import * as vscode from 'vscode'
import { WebViewProvider } from './WebViewProvider'

function registerStatusBarItem(context: vscode.ExtensionContext) {
  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -Number.MAX_SAFE_INTEGER,
  )

  statusBarItem.command = 'askcodebase.toggleAskCodebase'
  statusBarItem.text = '$(layout-panel) Toggle AskCodebase'
  statusBarItem.tooltip = 'Toggle AskCodebase Panel'
  context.subscriptions.push(statusBarItem)
  statusBarItem.show()
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new WebViewProvider(context)
  const { isWebviewVisible } = provider
  const disposable = vscode.window.registerWebviewViewProvider(WebViewProvider.viewType, provider, {
    webviewOptions: { retainContextWhenHidden: true },
  })

  registerStatusBarItem(context)
  context.subscriptions.push(disposable)

  vscode.commands.registerCommand('askcodebase.toggleAskCodebase', async () => {
    if (isWebviewVisible()) {
      await vscode.commands.executeCommand('workbench.action.closePanel')
    } else {
      await vscode.commands.executeCommand('ask-codebase.focus')
    }
  })
}

export function deactivate() {}
