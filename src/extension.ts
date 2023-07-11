import * as vscode from 'vscode'
import { WebViewProvider } from './WebViewProvider'

export function activate(context: vscode.ExtensionContext) {
  const provider = new WebViewProvider(context)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WebViewProvider.viewType, provider)
  )
}

export function deactivate() {}
