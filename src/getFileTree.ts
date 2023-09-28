import * as vscode from 'vscode'
import * as path from 'path'
import { default as ignore } from 'ignore'

export async function getFileTree(): Promise<string> {
  const fileTree: { [folder: string]: string[] } = {}

  // Get the workspace folder path
  if (vscode.workspace.workspaceFolders != null) {
    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath

    // Read the .gitignore file
    const gitignorePath = path.join(workspaceFolder, '.gitignore')
    const gitignoreContent = await vscode.workspace.fs.readFile(vscode.Uri.file(gitignorePath))

    // Parse the .gitignore file
    const ignoreRules = ignore().add(gitignoreContent.toString())

    // Find files in workspace
    const files = await vscode.workspace.findFiles('**/*')
    for (const file of files) {
      const filePath = vscode.workspace.asRelativePath(file)
      const filename = path.basename(filePath)
      const folder = path.dirname(filePath)

      // Check if the file should be ignored
      if (ignoreRules.ignores(filePath)) {
        continue
      }

      if (fileTree[folder]) {
        fileTree[folder].push(filename)
      } else {
        fileTree[folder] = [filename]
      }
    }
  }

  return Object.entries(fileTree)
    .map(([folder, files]) => {
      if (files.length === 1) {
        return `${folder}/${files[0]}`
      } else {
        return `${folder}/{${files.join()}}`
      }
    })
    .join(' ')
}
