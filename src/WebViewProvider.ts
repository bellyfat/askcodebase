import { join } from 'path'
import * as vscode from 'vscode'
import * as cp from 'child_process'
import { ExtensionMode, Uri } from 'vscode'
import fetch from 'node-fetch'

export class WebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ask-codebase'

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

    // monit VSCode theme color change
    vscode.window.onDidChangeActiveColorTheme(e => {
      webview.postMessage({ event: 'onDidChangeActiveColorTheme', data: e })
    })

    webview.onDidReceiveMessage(
      async message => {
        let data
        let error
        try {
          switch (message.command) {
            case 'getThemeColor': {
              const [color] = message.data
              const themeColor = new vscode.ThemeColor(color)
              themeColor
              data = await vscode.workspace.getConfiguration('workbench').get('colorTheme')
              break
            }
            case 'spawn': {
              const { command } = message.data
              const process = cp.spawn('bash', ['-c', command], { shell: true })

              process.stdout.on('data', chunk => {
                webview.postMessage({
                  event: 'onProcessEvent',
                  data: [process.pid, 'stdout.data', chunk.toString()]
                })
              })

              process.stderr.on('data', chunk => {
                webview.postMessage({
                  event: 'onProcessEvent',
                  data: [process.pid, 'stderr.data', chunk.toString()]
                })
              })

              process.on('error', err => {
                webview.postMessage({ event: 'onProcessEvent', data: [process.pid, 'error', err] })
              })

              process.on('exit', code => {
                webview.postMessage({ event: 'onProcessEvent', data: [process.pid, 'exit', code] })
              })

              data = { pid: process.pid }
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
