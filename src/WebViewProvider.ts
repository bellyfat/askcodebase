import * as vscode from 'vscode'
import { ExtensionMode, Uri } from 'vscode'
import type { IPty } from 'node-pty'
import fetch from 'node-fetch'
import { requireVSCodeModule } from '~/extensions'
import { trace } from './trace'
import { updateLayout } from './utils'
import { getFileTree } from './getFileTree'

const { spawn } = requireVSCodeModule<typeof import('node-pty')>('node-pty')
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'

interface IEditorEditAction {
  cmd: string
  id: string
  lines?: [number, number]
  code?: string
  firstChunk?: boolean
}

class AskCodebaseCursor {
  private _uri: vscode.Uri | null = null
  private _position: vscode.Position = new vscode.Position(0, 0)

  setUri(uri: vscode.Uri): AskCodebaseCursor {
    this._uri = uri
    return this
  }

  public setPosition(line: number, col: number) {
    this._position = new vscode.Position(line, col)
    this._updateCursorPosition(this._position)
  }

  public getPosition() {
    return this._position
  }

  private _updateCursorPosition(position: vscode.Position) {
    const range = new vscode.Range(position, position)
    updateAskCodebaseCursorPosition(range)
  }
}

export class WebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ask-codebase'
  private _ptyProcesses: IPty[] = []
  private _shellPrompt: string = ''
  private _commands: IEditorEditAction[] = []
  private _cursor: AskCodebaseCursor = new AskCodebaseCursor()
  private _editingRange: vscode.Range = new vscode.Range(0, 0, 0, 0)
  private _chunkQueue: Array<{ id: number; chunk: string }> = []
  public visible = false

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _updateStatusBarItem: () => void,
  ) { }

  public isWebviewVisible = () => {
    return this.visible
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken,
  ) {
    const { webview } = webviewView
    let cwd: string
    if (vscode.workspace.workspaceFolders) {
      cwd = vscode.workspace.workspaceFolders[0].uri.fsPath
    } else {
      cwd = process.env.HOME || ''
    }
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'dist-client')],
    }
    webview.html = await this._getHtmlForWebview(webviewView.webview)

    // Webview visibility
    this.visible = webviewView.visible
    webviewView.onDidChangeVisibility(e => {
      this.visible = webviewView.visible
      this._updateStatusBarItem()
      if (this.visible) {
        updateLayout()
      }
      webview.postMessage({ event: 'onDidChangeVisibility', data: webviewView.visible })
    })

    // VSCode theme color change
    vscode.window.onDidChangeActiveColorTheme(e => {
      webview.postMessage({ event: 'onDidChangeActiveColorTheme', data: e })
    })

    webview.onDidReceiveMessage(
      async message => {
        let data
        let error
        try {
          switch (message.command) {
            // 1. remove lines [startLine -1, endLine - 1]
            case 'executeEditorAction': {
              try {
                const command = message.data.payload
                const isStreamingCommand = (cmd: string) =>
                  ['codeStreaming', 'codeStreamingEnd'].includes(cmd)

                // Done.
                if (command.cmd === 'codeStreamingEnd') {
                  const document = vscode.window.activeTextEditor?.document

                  // format and save
                  const range = new vscode.Range(this._editingRange.start.line + 1, 0, this._editingRange.end.line, Number.MAX_SAFE_INTEGER)
                  console.log('format:', {
                    uri: document?.uri, range,
                  })
                  await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document?.uri, range)
                  document?.save()

                  setTimeout(() => {
                    cleanCollabCursorAndBadge()
                  }, 1500)
                }

                const activeEditor = vscode.window.activeTextEditor
                if (activeEditor != null) {
                  let document = activeEditor.document
                  // If not streaming command, reset commands.
                  if (!isStreamingCommand(command.cmd)) {
                    this._commands = [command]

                    const { cmd, lines } = this._commands[0]
                    if (Array.isArray(lines)) {
                      let edit = new vscode.WorkspaceEdit()
                      let startLine = Math.max(lines[0] - 1, 0)
                      let endLine = Math.max(lines[1] - 1, 0)
                      let textRange = new vscode.Range(
                        startLine,
                        0,
                        endLine,
                        Number.MAX_SAFE_INTEGER,
                      )

                      // Reset cursor position
                      this._editingRange = textRange
                      this._cursor.setUri(document.uri).setPosition(startLine, 0)

                      // Remove fist.
                      if (['replaceCode', 'removeCode'].includes(cmd)) {
                        if (startLine === endLine) {
                          const textRange = new vscode.Range(
                            startLine,
                            0,
                            endLine + 1,
                            Number.MAX_SAFE_INTEGER,
                          )
                          const nextLineText = document.lineAt(endLine + 1).text
                          edit.replace(document.uri, textRange, nextLineText)
                          await vscode.workspace.applyEdit(edit)

                          if (cmd === 'removeCode') {
                            await document.save()
                          }
                        } else {
                          edit.delete(document.uri, textRange)
                          vscode.workspace.applyEdit(edit)
                        }
                      }
                    }
                  } else {
                    // Then, insert
                    // Streaming command
                    const { cmd } = this._commands[0]
                    if (['insertCode', 'replaceCode'].includes(cmd) && command.code != null) {
                      this._chunkQueue.push({ id: command.id, chunk: command.code })
                      let { code: chunk, firstChunk } = command

                      const chunkLines = chunk.split('\n')

                      // Remove leading '\n' in the first chunk
                      if (firstChunk) {
                        console.log('before', chunk)
                        chunk = chunk.replace(/^\n/, '')
                        console.log('after', chunk)
                      }

                      // insert chunk
                      let edit = new vscode.WorkspaceEdit()
                      console.log(
                        'insertion_cursor:',
                        this._cursor.getPosition().line,
                        this._cursor.getPosition().character,
                        JSON.stringify(chunk)
                      )
                      edit.insert(document.uri, this._cursor.getPosition(), chunk)
                      await vscode.workspace.applyEdit(edit)

                      // update cursor position
                      let line = this._cursor.getPosition().line
                      if (chunk !== "") {
                        line += chunkLines.length - 1
                      }
                      this._cursor.setPosition(line, document.lineAt(line).range.end.character)
                      this._commands.push(command)
                    }
                  }
                }
              } catch (e) {
                console.error(e)
              }

              data = null
              break
            }
            case 'getActiveTextDocument': {
              const document = await vscode.window.activeTextEditor?.document
              if (document != null) {
                data = {
                  relativeUrl: vscode.workspace.asRelativePath(document.uri),
                  text: document.getText(),
                }
              } else {
                data = null
              }
              break
            }
            case 'getFileTree': {
              data = await getFileTree()
              break
            }
            case 'trace': {
              const { id, blobs, doubles } = message.data
              data = await trace(this._context, { id, blobs, doubles })
              break
            }
            case 'setGlobalState': {
              const { key, value } = message.data
              data = await this._context.globalState.update(key, value)
              break
            }
            case 'getSystemInfo': {
              data = {
                platform: process.platform,
                arch: process.arch,
                vscodeVersion: vscode.version,
                deviceID: this._context.globalState.get('deviceID'),
              }
              break
            }
            case 'executeCommand': {
              const { command, args } = message.data
              data = await vscode.commands.executeCommand(command, ...args)
              break
            }
            case 'hidePanel': {
              vscode.commands.executeCommand('workbench.action.closePanel')
              break
            }
            case 'openLink': {
              const { url } = message.data
              data = await vscode.commands.executeCommand('vscode.open', Uri.parse(url))
              break
            }
            case 'showInformationMessage': {
              const { message: msg } = message.data
              data = await vscode.window.showInformationMessage(msg)
              break
            }
            case 'showErrorMessage': {
              const { message: msg } = message.data
              data = await vscode.window.showErrorMessage(msg)
              break
            }
            case 'spawn': {
              const { command } = message.data
              const ptyProcess = spawn(shell, [], {
                name: 'xterm-color',
                cwd: cwd,
                env: {
                  ...process.env,
                  cwd,
                  BASH_SILENCE_DEPRECATION_WARNING: '1',
                },
              })
              this._ptyProcesses.push(ptyProcess)
              ptyProcess.write(`${command}\r`)
              ptyProcess.onData(data => {
                if (
                  data === `${command}\r\n` ||
                  data === `${this._shellPrompt}${command}\r\n` ||
                  data === this._shellPrompt ||
                  `${this._shellPrompt}${command}`.includes(data.replace('\r\n', ''))
                ) {
                  return
                }
                console.log('1', JSON.stringify(data), JSON.stringify(this._shellPrompt))
                data = data.replace(/\r\n$/, '')
                data = data.replace(`\r\n${this._shellPrompt}`, '')
                data = data.replace(`${this._shellPrompt}${command}\r\n`, '')
                console.log('2', JSON.stringify(data), JSON.stringify(this._shellPrompt))
                // 1. "\r\n> "
                // 2. start with `bash:` & contains "command not found"
                webview.postMessage({
                  event: 'onProcessEvent',
                  data: [ptyProcess.pid, 'data', data],
                })
              })
              ptyProcess.onExit(() => {
                webview.postMessage({
                  event: 'onProcessEvent',
                  data: [ptyProcess.pid, 'exit'],
                })
              })
              data = { pid: ptyProcess.pid }
              break
            }
          }
        } catch (e) {
          error = e
        }
        webview.postMessage({ responseId: message.id, data, error })
      },
      undefined,
      this._context.subscriptions,
    )

    this._updateStatusBarItem()
    this._shellPrompt = await this._getShellPrompt(cwd)
  }

  private _getShellPrompt(cwd: string): Promise<string> {
    const ptyProcess = spawn(shell, [], {
      name: 'xterm-color',
      cwd: cwd,
      env: {
        ...process.env,
        cwd,
        BASH_SILENCE_DEPRECATION_WARNING: '1',
      },
    })
    ptyProcess.write('\r')
    return new Promise(resolve => {
      ptyProcess.onData(data => {
        const prompt = data.split('\r\n').pop() || ''
        resolve(prompt)
      })
    })
  }

  private async _getHtmlForWebview(webview: vscode.Webview) {
    const jsFile = 'vscode.js'
    const localServerUrl = 'http://localhost:3000'

    let scriptUri: string | null = null
    let cssUri: string | null = null

    const isProduction = this._context.extensionMode === ExtensionMode.Production
    if (isProduction) {
      const scriptOnDiskPath = vscode.Uri.joinPath(
        this._context.extensionUri,
        'dist-client',
        'vscode.js',
      )
      const cssOnDiskPath = vscode.Uri.joinPath(
        this._context.extensionUri,
        'dist-client',
        'codicon.css',
      )
      scriptUri = webview.asWebviewUri(scriptOnDiskPath).toString()
      cssUri = webview.asWebviewUri(cssOnDiskPath).toString()
    } else {
      scriptUri = `${localServerUrl}/${jsFile}`
    }
    if (isProduction) {
      return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${cssUri}" />
      </head>
      <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`
    } else {
      const devServerHtml = await fetch(`${localServerUrl}/index.html`).then(res => res.text())
      const html = devServerHtml.replace(/(href|src)="(.+)"/g, (_, p1, p2) => {
        return `${p1}="${localServerUrl}/${p2}"`
      })
      return html
    }
  }
}

function updateAskCodebaseCursorPosition(range: vscode.Range) {
  setCollabCursorAndBadge(range, '#aa96fb', 'AskCodebase AI')
}

let cursorType: vscode.TextEditorDecorationType
let selectionType: vscode.TextEditorDecorationType
let badgeType: vscode.TextEditorDecorationType

function cleanCollabCursorAndBadge() {
  // dispose
  cursorType && cursorType.dispose()
  selectionType && selectionType.dispose()
  badgeType && badgeType.dispose()

  const activeTextEditor = vscode.window.activeTextEditor

  if (activeTextEditor != null) {
    activeTextEditor.setDecorations(cursorType, [])
    activeTextEditor.setDecorations(selectionType, [])
    activeTextEditor.setDecorations(badgeType, [])
  }
}

function setCollabCursorAndBadge(range: vscode.Range, cursorColor: string, badgeName: string) {
  // Cursor decoration
  const cursorDecoration = {
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    before: {
      contentText: 'ᛙ',
      textDecoration: `text-shadow: 1px 0px 0px ${cursorColor}, -1px 0px 0px ${cursorColor}; position: absolute; display: inline-block; z-index: 9999; color: ${cursorColor}; font-weight: bold; top: -5px; font-size: 230%`,
      margin: '0px 0px 0px -0.3ch',
    },
  }

  // Selection decoration
  const selectionDecoration = {
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    backgroundColor: cursorColor + '44',
  }

  // Badge decoration
  let topOffset =
    range && range.end.line === range.start.line ? 'calc(-1 * (1rem + 3px))' : 'calc(1rem + 3px)'
  const css = `none; position: absolute; display: inline-block; top: ${topOffset}; margin: 0px 0px 0px 0px; font-weight: bold; z-index: 9998; border-radius: 0.2rem; pointer-event: none; color: black; background: ${cursorColor}; padding: 1px 3px 1px 3px;`
  const badgeDecoration = {
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    after: {
      contentText: badgeName,
      textDecoration: css,
    },
  }

  // dispose
  cursorType && cursorType.dispose()
  selectionType && selectionType.dispose()
  badgeType && badgeType.dispose()

  // Create and return the decorations
  cursorType = vscode.window.createTextEditorDecorationType(cursorDecoration)
  selectionType = vscode.window.createTextEditorDecorationType(selectionDecoration)
  badgeType = vscode.window.createTextEditorDecorationType(badgeDecoration)

  const activeTextEditor = vscode.window.activeTextEditor

  if (activeTextEditor != null) {
    const cursorRange = new vscode.Range(range.end, range.end)
    activeTextEditor.setDecorations(cursorType, [cursorRange])
    activeTextEditor.setDecorations(selectionType, [range])
    activeTextEditor.setDecorations(badgeType, [range])

    setTimeout(() => {
      cleanCollabCursorAndBadge()
    }, 1500)
  }

}
