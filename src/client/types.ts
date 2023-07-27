export enum LogLevel {
  Log = 'normal',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Success = 'success'
}

export enum ProgramStatus {
  Running = 'running',
  Exit = 'exit'
}

export enum BlockType {
  LoginBlock = 'LoginBlock',
  UserReq = 'UserReq',
  ShellResp = 'ShellResp',
  AssistantResp = 'ChatGPTResp'
}

export interface IUser {
  userid: string
  username: string
  avatarUrl: string
}

export interface ICommandBlock {
  type: BlockType
  level: LogLevel
  id: string
  ts: number
  message: string
  user: IUser
  status: ProgramStatus
}
