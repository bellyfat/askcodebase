import * as vscode from 'vscode'

export interface CodeSymbol<T extends vscode.SymbolInformation | vscode.DocumentSymbol> {
  kind: string
  symbol: T
}

function processSymbol<T extends vscode.SymbolInformation | vscode.DocumentSymbol>(
  symbol: T,
): CodeSymbol<T> {
  const codeSymbol: CodeSymbol<T> = {
    kind: getSymbolKindName(symbol.kind),
    symbol: symbol,
  }
  return codeSymbol
}

function getSymbolKindName(kind: vscode.SymbolKind): string {
  switch (kind) {
    case vscode.SymbolKind.File:
      return 'File'
    case vscode.SymbolKind.Module:
      return 'Module'
    case vscode.SymbolKind.Namespace:
      return 'Namespace'
    case vscode.SymbolKind.Package:
      return 'Package'
    case vscode.SymbolKind.Class:
      return 'Class'
    case vscode.SymbolKind.Method:
      return 'Method'
    case vscode.SymbolKind.Property:
      return 'Property'
    case vscode.SymbolKind.Field:
      return 'Field'
    case vscode.SymbolKind.Constructor:
      return 'Constructor'
    case vscode.SymbolKind.Enum:
      return 'Enum'
    case vscode.SymbolKind.Interface:
      return 'Interface'
    case vscode.SymbolKind.Function:
      return 'Function'
    case vscode.SymbolKind.Variable:
      return 'Variable'
    case vscode.SymbolKind.Constant:
      return 'Constant'
    case vscode.SymbolKind.String:
      return 'String'
    case vscode.SymbolKind.Number:
      return 'Number'
    case vscode.SymbolKind.Boolean:
      return 'Boolean'
    case vscode.SymbolKind.Array:
      return 'Array'
    case vscode.SymbolKind.Object:
      return 'Object'
    case vscode.SymbolKind.Key:
      return 'Key'
    case vscode.SymbolKind.Null:
      return 'Null'
    case vscode.SymbolKind.EnumMember:
      return 'EnumMember'
    case vscode.SymbolKind.Struct:
      return 'Struct'
    case vscode.SymbolKind.Event:
      return 'Event'
    case vscode.SymbolKind.Operator:
      return 'Operator'
    case vscode.SymbolKind.TypeParameter:
      return 'TypeParameter'
    default:
      return 'Unknown'
  }
}

export async function searchWorkspaceSymbols(query = '') {
  const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
    'vscode.executeWorkspaceSymbolProvider',
    query,
  )
  const ret: CodeSymbol<vscode.SymbolInformation> = []
  for (const symbol of symbols) {
    const kind = getSymbolKindName(symbol.kind)
    ret.push({ symbol, kind })
  }
  return ret
}

export async function searchDocumentSymbols(query = '') {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return []
  }

  const document = editor.document
  const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
    'vscode.executeDocumentSymbolProvider',
    document.uri,
  )

  const ret: CodeSymbol<vscode.DocumentSymbol>[] = []
  for (const symbol of symbols || []) {
    if (symbol.name.toLowerCase().includes(query.toLowerCase())) {
      const kind = getSymbolKindName(symbol.kind)
      ret.push({ symbol, kind })
    }
  }

  return ret
}
