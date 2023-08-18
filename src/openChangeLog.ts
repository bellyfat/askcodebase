import * as vscode from 'vscode'
import * as path from 'path'

export function openChangelog(context: vscode.ExtensionContext) {
  let markdownPath = path.join(context.extensionPath, 'CHANGELOG.md')
  vscode.workspace.openTextDocument(markdownPath).then(doc => {
    vscode.commands.executeCommand('markdown.showPreview', doc.uri)
    // vscode.window.showTextDocument(doc)
  })
}
