import { join } from 'path'
import * as vscode from 'vscode'
import { ExtensionMode, Uri } from 'vscode'
import type { IPty } from 'node-pty'
import fetch from 'node-fetch'
import { requireVSCodeModule } from '~/extensions'
import { deferred } from './common/Deferred'
import * as cp from 'child_process'

const { spawn } = requireVSCodeModule<typeof import('node-pty')>('node-pty')
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'

export class WebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ask-codebase'
  private _ptyProcesses = new Map<number, IPty>()
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
              let args = ['bash', ['-c', command], { shell: true }] as [string, string[], any]
              if (command.startsWith('which')) {
                args = [`which ${command.split(' ')[1]}`, [], { shell: true }]
              }
              console.log({ args })
              const process = cp.spawn(...args)

              process.stdout.on('data', chunk => {
                webview.postMessage({
                  event: 'onProcessEvent',
                  data: [process.pid, 'stdout.data', chunk.toString()],
                })
              })

              process.stderr.on('data', chunk => {
                webview.postMessage({
                  event: 'onProcessEvent',
                  data: [process.pid, 'stderr.data', chunk.toString()],
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
      this._context.subscriptions,
    )
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
