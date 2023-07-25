import { join } from 'path'
import * as vscode from 'vscode'
import { ExtensionMode, Uri } from 'vscode'
import type { IPty } from 'node-pty'
import fetch from 'node-fetch'
import { requireVSCodeModule } from '~/extensions'

const { spawn } = requireVSCodeModule<typeof import('node-pty')>('node-pty')
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'

export class WebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ask-codebase'
  private _ptyProcesses = new Map<number, IPty>()

  constructor(private readonly _context: vscode.ExtensionContext) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ) {
    const { webview } = webviewView
    webview.options = {
      enableScripts: true,
      localResourceRoots: []
    }
    webview.html = await this._getHtmlForWebview(webviewView.webview)

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
            case 'openLink': {
              const { url } = message.data
              vscode.commands.executeCommand('vscode.open', Uri.parse(url))
              break
            }
            case 'spawn': {
              const { pid, command } = message.data

              if (this._ptyProcesses.has(pid)) {
                const ptyProcess = this._ptyProcesses.get(pid)!
                ptyProcess.write(command)
                data = { pid }
              } else {
                const ptyProcess = spawn(shell, [], {
                  name: 'xterm-color',
                  cwd: process.env.HOME,
                  env: process.env
                })
                this._ptyProcesses.set(pid, ptyProcess)

                ptyProcess.onData(data => {
                  webview.postMessage({
                    event: 'onProcessEvent',
                    data: [process.pid, 'write', data]
                  })
                })

                ptyProcess.onExit(() => {
                  webview.postMessage({
                    event: 'onProcessEvent',
                    data: [process.pid, 'exit']
                  })
                })
                data = { pid: ptyProcess.pid }
              }
              break
            }
          }
        } catch (e) {
          error = e
        }
        webview.postMessage({ responseId: message.id, data, error })
      },
      undefined,
      this._context.subscriptions
    )
  }

  private async _getHtmlForWebview(webView: vscode.Webview) {
    const jsFile = 'vscode.js'
    const cssFile = 'vscode.css'
    const localServerUrl = 'http://localhost:3000'

    let scriptUrl: string | null = null
    let cssUrl: string | null = null

    const isProduction = this._context.extensionMode === ExtensionMode.Production
    if (isProduction) {
      scriptUrl = webView
        .asWebviewUri(Uri.file(join(this._context.extensionPath, 'dist', jsFile)))
        .toString()
      cssUrl = webView
        .asWebviewUri(Uri.file(join(this._context.extensionPath, 'dist', cssFile)))
        .toString()
    } else {
      scriptUrl = `${localServerUrl}/${jsFile}`
    }
    const devServerHtml = await fetch(`${localServerUrl}/index.html`).then(res => res.text())

    if (isProduction) {
      return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${isProduction ? `<link href="${cssUrl}" rel="stylesheet">` : ''}
      </head>
      <body>
        <div id="root"></div>
        <script src="${scriptUrl}" />
      </body>
      </html>`
    } else {
      const html = devServerHtml.replace(/(href|src)="(.+)"/g, (_, p1, p2) => {
        return `${p1}="${localServerUrl}/${p2}"`
      })
      return html
    }
  }
}
