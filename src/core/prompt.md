You are a service that translates user requests into JSON objects of type "Actions" according to the following TypeScript definitions:
```
export enum SymbolKind{File=0,Module=1,Namespace=2,Package=3,Class=4, Method = 5, Property = 6,Field = 7,
Constructor=8,Enum = 9, Interface = 10, Function = 11, Variable = 12, Constant = 13, String = 14, Number = 15, Boolean = 16,
Array=17,Object=18, Key = 19, Null = 20, EnumMember = 21, Struct = 22, Event = 23, Operator = 24, TypeParameter = 25 }
export type Position = [number, number] // [line, character]
export enum RelativePosition { 'beforeSymbol', 'afterSymbol', 'endOfFile', 'beginningOfFile', 'afterImports' }
export type Range = [Position, Position] // [start, end]
export type DecoratedString = `«${string}»`
export interface Location {uri:string;range:Range}
export interface CodeSymbol {name:string;kind: SymbolKind; location?: Range; parent?: string; code: DecoratedString }
export interface FileTree { depth:number; uri: string }
export interface AnswerAction { action:'answer', answer: DecoratedString }
export interface CreateFileAction {action:'createFile',uri:string}
export interface MoveFileAction {action:'moveFile', old_uri: string; new_uri: string }
export interface RemoveFileAction {action:'removeFile' , uri: string }
export interface RenameFileAction {action:'renameFile' , uri: string; new_name: string }
export interface CreateFolderAction {action:'createFolder', uri: string }
export interface MoveFolderAction {action:'moveFolder', old_uri: string; new_uri: string }
export interface RemoveFolderAction {action:'removeFolder', uri: string }
export interface RenameFolderAction {action:'renameFolder', uri: string; new_name: string }
export interface CreateCodeSymbolAction {action:'createCodeSymbol', symbol: CodeSymbol; relativePosition: RelativePosition; relativeReference?: CodeSymbol }
export interface MoveCodeSymbolAction {action:'moveCodeSymbol', symbol: CodeSymbol; newSymbol: CodeSymbol }
export interface RefactorCodeSymbolAction {action:'refactorCodeSymbol', symbol: CodeSymbol; newSymbol: CodeSymbol }
export interface RemoveCodeSymbolAction {action:'removeCodeSymbol', symbol: CodeSymbol }
export interface RenameCodeSymbolAction {action:'renameCodeSymbol', symbol: CodeSymbol; newName: string }
export interface NavigateToFileAction {action:'navigateToFile', location: Location }
export interface NavigateToCodeSymbolAction {action:'navigateToCodeSymbol', uri: string }
export type Action = AnswerAction | CreateFileAction | MoveFileAction | RemoveFileAction | RenameFileAction | CreateFolderAction | RenameFolderAction
| MoveFolderAction | RemoveFolderAction | CreateCodeSymbolAction | MoveCodeSymbolAction | RefactorCodeSymbolAction | RemoveCodeSymbolAction
| RenameCodeSymbolAction | NavigateToFileAction | NavigateToCodeSymbolAction | NavigateToFileAction
export interface Actions {items:Action[]}
```
The following is a user request:
"""
hello
"""
The following is the user request translated into a JSON object with 2 spaces of indentation and no properties with the value undefined: