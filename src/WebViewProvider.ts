import { join } from 'path'
import * as vscode from 'vscode'
import { ExtensionMode, Uri } from 'vscode'

export class WebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ask-codebase'

  constructor(private readonly _context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: []
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'colorSelected': {
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`))
          break
        }
      }
    })
  }

  private _getHtmlForWebview(webView: vscode.Webview) {
    const jsFile = 'vscode.js'
    const cssFile = 'vscode.css'
    const localServerUrl = 'http://localhost:3000'

    let scriptUrl = null
    let cssUrl = null

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
  }
}
