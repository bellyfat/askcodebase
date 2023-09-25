export const schema = `
export enum SymbolKind { File = 0, Module = 1, Namespace = 2, Package = 3, Class = 4, Method = 5,
  Property = 6, Field = 7, Constructor = 8, Enum = 9, Interface = 10, Function = 11, Variable = 12,
  Constant = 13, String = 14, Number = 15, Boolean = 16, Array = 17, Object = 18, Key = 19, Null = 20,
  EnumMember = 21, Struct = 22, Event = 23, Operator = 24, TypeParameter = 25 }
export type Position = { line: number; character: number }
export type Range = { start: Position; end: Position }
export type Location = { uri: string; range: Range }
export type CodeSymbol = { name: string; containerName: string; kind: SymbolKind; location: Range, content: string }
export type FileTree = { depth: number; uri: string }
export type CreateFileAction = { uri: string }
export type MoveFileAction = { oldUri: string; newUri: string }
export type RemoveFileAction = { uri: string }
export type RenameFileAction = { uri: string; newName: string }
export type CreateFolderAction = { uri: string }
export type MoveFolderAction = { oldUri: string; newUri: string }
export type RemoveFolderAction = { uri: string }
export type RenameFolderAction = { uri: string; newName: string }
export type CreateCodeSymbolAction = {
  symbol: CodeSymbol
  relativePosition:
    | 'beforeSymbol'
    | 'afterSymbol'
    | 'endOfFile'
    | 'beginningOfFile'
    | 'afterImports'
  relativeReference: CodeSymbol
}
export type MoveCodeSymbolAction = { symbol: CodeSymbol; newContainer: CodeSymbol }
export type RefactorCodeSymbolAction = { symbol: CodeSymbol; newSymbol: CodeSymbol }
export type RemoveCodeSymbolAction = { symbol: CodeSymbol }
export type RenameCodeSymbolAction = { symbol: CodeSymbol; newName: string }
export type NavigateToFileAction = { location: Location }
export type NavigateToCodeSymbolAction = { uri: string }
/**
 * The context of codebase that we want to know.
 * Always make sure to put all queries here that you want to know in one time,
 * since reasoning takes long time that we should avoid calling getMoreContextAndReason
 * as few times as possible.
 */
export type AskCodebaseContext = {
  /* If symbols provided and not empty, it will get all symbols provided  */
  symbols?: string[]
  /* If subtree provided, it will get file tree information with given depth */
  subtree?: FileTree
  /** If references provided, it will get all references of given symbols correspondingly */
  references: CodeSymbol[]
  /** If definitons provided, it will get all definitions of given symbols correspondingly */
  definitions: CodeSymbol[]
}
/* You should limit @steps within 3 steps, and call getAdditionalContextAndReason for next tick */
export type API = {
  // call noop when when need to do nothing
  noop(): void
  createFile(action: CreateFileAction): Promise<boolean>
  deleteFile(action: RemoveFolderAction): Promise<boolean>
  moveFile(action: MoveFileAction): Promise<boolean>
  renameFile(action: RenameFileAction): Promise<boolean>
  createFolder(action: CreateFolderAction): Promise<boolean>
  moveFolder(action: MoveFolderAction): Promise<boolean>
  removeFolder(action: RemoveFolderAction): Promise<boolean>
  renameFolder(action: RenameFolderAction): Promise<boolean>
  // make sure symbol is a valid identifier
  createCodeSymbol(action: CreateCodeSymbolAction): Promise<boolean>
  moveCodeSymbol(action: MoveCodeSymbolAction): Promise<boolean>
  refactorCodeSymbol(action: RefactorCodeSymbolAction): Promise<boolean>
  removeCodeSymbol(action: RemoveCodeSymbolAction): Promise<boolean>
  renameCodeSymbol(action: RenameCodeSymbolAction): Promise<boolean>
  navigateToFile(action: NavigateToFileAction): Promise<boolean>
  navigateToCodeSymbol(action: NavigateToCodeSymbolAction): Promise<boolean>
  getAdditionalContextAndReason(context: AskCodebaseContext): Promise<string>
}
`.trim()
