import * as vscode from 'vscode'
import * as path from 'path'

export function requireVSCodeModule<T extends any>(id: string) {
  //@ts-ignore
  const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
  const modulePath = path.join(vscode.env.appRoot, 'node_modules.asar', id)

  return requireFunc(modulePath) as T
}
