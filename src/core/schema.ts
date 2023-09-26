export enum SymbolKind {
  File = 0,
  Module = 1,
  Namespace = 2,
  Package = 3,
  Class = 4,
  Method = 5,
  Property = 6,
  Field = 7,
  Constructor = 8,
  Enum = 9,
  Interface = 10,
  Function = 11,
  Variable = 12,
  Constant = 13,
  String = 14,
  Number = 15,
  Boolean = 16,
  Array = 17,
  Object = 18,
  Key = 19,
  Null = 20,
  EnumMember = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}
export type Position = [number, number] // [line, character]
export enum RelativePosition {
  'beforeSymbol',
  'afterSymbol',
  'endOfFile',
  'beginningOfFile',
  'afterImports',
}
export type Range = [Position, Position] // [start, end]
export interface Location {
  uri: string
  range: Range
}
export interface CodeSymbol {
  name: string
  kind: SymbolKind
  location?: Range
  parent?: string
  $code: string
}
export interface FileTree {
  depth: number
  uri: string
}
export interface MessageAction {
  action: 'message'
  $message: string
}
export interface CreateFileAction {
  action: 'createFile'
  uri: string
}
export interface MoveFileAction {
  action: 'moveFile'
  old_uri: string
  new_uri: string
}
export interface RemoveFileAction {
  action: 'removeFile'
  uri: string
}
export interface RenameFileAction {
  action: 'renameFile'
  uri: string
  new_name: string
}
export interface CreateFolderAction {
  action: 'createFolder'
  uri: string
}
export interface MoveFolderAction {
  action: 'moveFolder'
  old_uri: string
  new_uri: string
}
export interface RemoveFolderAction {
  action: 'removeFolder'
  uri: string
}
export interface RenameFolderAction {
  action: 'renameFolder'
  uri: string
  new_name: string
}
export interface InsertCodeAction {
  action: 'insertCode'
  relativePosition: RelativePosition
  relativeReference?: CodeSymbol
  $code: CodeSymbol['$code']
}
export interface MoveCodeAction {
  action: 'moveCode'
  symbol: CodeSymbol
  newSymbol: CodeSymbol
}
export interface RefactorCodeAction {
  action: 'refactorCode'
  symbol: CodeSymbol
  newSymbol: CodeSymbol
}
export interface RemoveCodeAction {
  action: 'removeCode'
  symbol: CodeSymbol
}
export interface RenameCodeSymbolAction {
  action: 'renameCodeSymbol'
  symbol: CodeSymbol
  newName: string
}
export interface NavigateToFileAction {
  action: 'navigateToFile'
  location: Location
}
export interface NavigateToCodeSymbolAction {
  action: 'navigateToCodeSymbol'
  uri: string
}
export type Action =
  | MessageAction
  | CreateFileAction
  | MoveFileAction
  | RemoveFileAction
  | RenameFileAction
  | CreateFolderAction
  | RenameFolderAction
  | MoveFolderAction
  | RemoveFolderAction
  | InsertCodeAction
  | MoveCodeAction
  | RefactorCodeAction
  | RemoveCodeAction
  | RenameCodeSymbolAction
  | NavigateToFileAction
  | NavigateToCodeSymbolAction
  | NavigateToFileAction
export interface Actions {
  actions: Action[]
}

export const functions = [
  {
    name: 'convertPositionToLineCharacter',
    description: 'Converts the position in the file to line and character',
    parameters: {
      type: 'object',
      properties: {
        position: {
          type: 'array',
          items: { type: 'number' },
          description: 'The position in the file as [line, character]',
        },
      },
      required: ['position'],
    },
  },
  {
    name: 'convertRangeToStartEnd',
    description: 'Converts the range in the file to start and end positions',
    parameters: {
      type: 'object',
      properties: {
        range: {
          type: 'array',
          items: { type: 'array', items: { type: 'number' } },
          description:
            'The range in the file as [[startLine, startCharacter], [endLine, endCharacter]]',
        },
      },
      required: ['range'],
    },
  },
  {
    name: 'createCodeSymbol',
    description: 'Creates a code symbol with the specified properties',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the code symbol' },
        kind: {
          type: 'string',
          enum: [
            'File',
            'Module',
            'Namespace',
            'Package',
            'Class',
            'Method',
            'Property',
            'Field',
            'Constructor',
            'Enum',
            'Interface',
            'Function',
            'Variable',
            'Constant',
            'String',
            'Number',
            'Boolean',
            'Array',
            'Object',
            'Key',
            'Null',
            'EnumMember',
            'Struct',
            'Event',
            'Operator',
            'TypeParameter',
          ],
        },
        location: {
          type: 'array',
          items: { type: 'array', items: { type: 'number' } },
          description:
            'The location of the code symbol as [[startLine, startCharacter], [endLine, endCharacter]]',
        },
        parent: { type: 'string', description: 'The name of the parent code symbol' },
        code: { type: 'string', description: 'The code of the symbol' },
      },
      required: ['name', 'kind', 'code'],
    },
  },
  {
    name: 'createFileTree',
    description: 'Creates a file tree with the specified depth and URI',
    parameters: {
      type: 'object',
      properties: {
        depth: { type: 'number', description: 'The depth of the file tree' },
        uri: { type: 'string', description: 'The URI of the file' },
      },
      required: ['depth', 'uri'],
    },
  },
  {
    name: 'createMessage',
    description: 'Creates a message action with the specified message',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The message of the action' },
      },
      required: ['message'],
    },
  },
  {
    name: 'createFile',
    description: 'Creates a file action with the specified URI',
    parameters: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'The URI of the file' },
      },
      required: ['uri'],
    },
  },
  {
    name: 'moveFile',
    description: 'Moves a file from the old URI to the new URI',
    parameters: {
      type: 'object',
      properties: {
        old_uri: { type: 'string', description: 'The old URI of the file' },
        new_uri: { type: 'string', description: 'The new URI of the file' },
      },
      required: ['old_uri', 'new_uri'],
    },
  },
  {
    name: 'removeFile',
    description: 'Removes a file with the specified URI',
    parameters: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'The URI of the file' },
      },
      required: ['uri'],
    },
  },
  {
    name: 'renameFile',
    description: 'Renames a file with the specified URI to a new name',
    parameters: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'The URI of the file' },
        new_name: { type: 'string', description: 'The new name of the file' },
      },
      required: ['uri', 'new_name'],
    },
  },
  {
    name: 'createFolder',
    description: 'Creates a folder action with the specified URI',
    parameters: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'The URI of the folder' },
      },
      required: ['uri'],
    },
  },
  {
    name: 'moveFolder',
    description: 'Moves a folder from the old URI to the new URI',
    parameters: {
      type: 'object',
      properties: {
        old_uri: { type: 'string', description: 'The old URI of the folder' },
        new_uri: { type: 'string', description: 'The new URI of the folder' },
      },
      required: ['old_uri', 'new_uri'],
    },
  },
  {
    name: 'removeFolder',
    description: 'Removes a folder with the specified URI',
    parameters: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'The URI of the folder' },
      },
      required: ['uri'],
    },
  },
  {
    name: 'renameFolder',
    description: 'Renames a folder with the specified URI to a new name',
    parameters: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'The URI of the folder' },
        new_name: { type: 'string', description: 'The new name of the folder' },
      },
      required: ['uri', 'new_name'],
    },
  },
  {
    name: 'insertCode',
    description: 'Inserts code at a relative position in the file',
    parameters: {
      type: 'object',
      properties: {
        relativePosition: {
          type: 'string',
          enum: ['beforeSymbol', 'afterSymbol', 'endOfFile', 'beginningOfFile', 'afterImports'],
        },
        relativeReference: { type: 'object', properties: { name: { type: 'string' } } },
        code: { type: 'string', description: 'The code to insert' },
      },
      required: ['relativePosition', 'code'],
    },
  },
  {
    name: 'moveCode',
    description: 'Moves code from one symbol to another symbol',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'object', properties: { name: { type: 'string' } } },
        newSymbol: { type: 'object', properties: { name: { type: 'string' } } },
      },
      required: ['symbol', 'newSymbol'],
    },
  },
  {
    name: 'refactorCode',
    description: 'Refactors code by renaming a code symbol',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'object', properties: { name: { type: 'string' } } },
        newSymbol: { type: 'object', properties: { name: { type: 'string' } } },
      },
      required: ['symbol', 'newSymbol'],
    },
  },
  {
    name: 'removeCode',
    description: 'Removes a code symbol',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'object', properties: { name: { type: 'string' } } },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'renameCodeSymbol',
    description: 'Renames a code symbol',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'object', properties: { name: { type: 'string' } } },
        newName: { type: 'string', description: 'The new name of the code symbol' },
      },
      required: ['symbol', 'newName'],
    },
  },
  {
    name: 'navigateToFile',
    description: 'Navigates to a specific location in a file',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'object',
          properties: {
            uri: { type: 'string', description: 'The URI of the location' },
            range: {
              type: 'array',
              items: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
              description:
                'The range of the location as [[[startLine, startCharacter], [endLine, endCharacter]]]',
            },
          },
          required: ['uri', 'range'],
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'navigateToCodeSymbol',
    description: 'Navigates to a specific code symbol in a file',
    parameters: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'The URI of the file to navigate to' },
      },
      required: ['uri'],
    },
  },
]
