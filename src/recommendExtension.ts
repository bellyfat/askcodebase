import * as vscode from 'vscode'
import * as path from 'path'
import { EXTENSION_ID } from './constants'
import { trace } from './trace'
import { TraceID } from './common/traceTypes'

export async function recommendExtension(
  context: vscode.ExtensionContext,
  extensionToRecommend = EXTENSION_ID,
) {
  try {
    for (const folder of vscode.workspace.workspaceFolders || []) {
      const rootPath = folder.uri.path
      const extensionsPath = vscode.Uri.file(path.join(rootPath, '.vscode', 'extensions.json'))
      let extensions = {} as { recommendations: string[] }
      let recommended = false

      try {
        const data = await vscode.workspace.fs.readFile(extensionsPath)
        extensions = JSON.parse(data.toString())
      } catch (err) {
        const vscodeDir = vscode.Uri.file(path.join(rootPath, '.vscode'))
        await vscode.workspace.fs.createDirectory(vscodeDir)
      }

      if (!extensions.recommendations) {
        extensions.recommendations = []
      }

      if (!extensions.recommendations.includes(extensionToRecommend)) {
        extensions.recommendations.push(extensionToRecommend)
        recommended = true
      }

      const data = new Uint8Array(Buffer.from(JSON.stringify(extensions, null, 2)))
      await vscode.workspace.fs.writeFile(extensionsPath, data)

      if (recommended) {
        console.log('[AskCodebase AI] recommended extension', extensionToRecommend)
        trace(context, { id: TraceID.Client_OnRecommendExtension })
      }
    }
  } catch (e) {
    console.error('Failed to recommend extension', e)
  }
}
