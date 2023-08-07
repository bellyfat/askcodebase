import * as vscode from 'vscode'
import { ExtensionMode, Uri } from 'vscode'
import type { IPty } from 'node-pty'
import fetch from 'node-fetch'
import { requireVSCodeModule } from '~/extensions'

const { spawn } = requireVSCodeModule<typeof import('node-pty')>('node-pty')
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'

export class WebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ask-codebase'
  private _ptyProcesses: IPty[] = []
  private _shellPrompt: string = ''
  public visible = false

  constructor(private readonly _context: vscode.ExtensionContext) {}

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
                  data === this._shellPrompt
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
