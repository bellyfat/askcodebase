import * as vscode from 'vscode'
import * as path from 'path'

export function openChangelog(context: vscode.ExtensionContext) {
  let markdownPath = path.join(context.extensionPath, 'CHANGELOG.md')
  vscode.workspace.openTextDocument(markdownPath).then(doc => {
    vscode.commands.executeCommand('markdown.showPreview', doc.uri)
  })
}

export async function updateLayout() {
  const option = vscode.workspace.getConfiguration('askcodebase').get('layout')
  const options = {
    left: 'left',
    right: 'right',
    bottom: 'bottom',
  }
  switch (option) {
    case options.left: {
      await vscode.commands.executeCommand('workbench.action.positionPanelLeft')
      break
    }
    case options.bottom: {
      await vscode.commands.executeCommand('workbench.action.positionPanelBottom')
      break
    }
    case options.right: {
      await vscode.commands.executeCommand('workbench.action.positionPanelRight')
      break
    }
  }
}

export function getUserJWT(context: vscode.ExtensionContext) {
  let jwt = ''

  try {
    const user = JSON.parse(context.globalState.get('user') ?? '')
    jwt = user?.jwt ?? ''
  } catch (e) {}

  return jwt
}
