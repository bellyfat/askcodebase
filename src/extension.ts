import * as vscode from 'vscode'
import { WebViewProvider } from './WebViewProvider'

function registerStatusBarItem(context: vscode.ExtensionContext) {
  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -Number.MAX_SAFE_INTEGER,
  )

  statusBarItem.command = 'askcodebase.toggleAskCodebase'
  statusBarItem.text = '$(layout-panel) Open AskCodebase'
  statusBarItem.tooltip = 'Toggle AskCodebase Panel'
  context.subscriptions.push(statusBarItem)
  statusBarItem.show()

  return statusBarItem
}

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = registerStatusBarItem(context)
  const updateStatusBar = () => updateStatusBarItem(statusBarItem, provider.isWebviewVisible)
  const provider = new WebViewProvider(context, updateStatusBar)
  const { isWebviewVisible } = provider
  const disposable = vscode.window.registerWebviewViewProvider(WebViewProvider.viewType, provider, {
    webviewOptions: { retainContextWhenHidden: true },
  })

  context.subscriptions.push(disposable)
  updateStatusBar()

  vscode.commands.registerCommand('askcodebase.toggleAskCodebase', async () => {
    if (isWebviewVisible()) {
      await vscode.commands.executeCommand('workbench.action.closePanel')
    } else {
      await vscode.commands.executeCommand('ask-codebase.focus')
    }
    updateStatusBarItem(statusBarItem, isWebviewVisible)
  })
}

function updateStatusBarItem(statusBarItem: vscode.StatusBarItem, isWebviewVisible: () => boolean) {
  if (isWebviewVisible()) {
    statusBarItem.text = '$(layout-panel) Hide AskCodebase'
  } else {
    statusBarItem.text = '$(layout-panel) Open AskCodebase'
  }
}

export function deactivate() {}
