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

export enum LogType {
  UserReq = 'UserReq',
  ShellResp = 'ShellResp',
  ChatGPTResp = 'ChatGPTResp'
}

export interface IUser {
  userid: string
  username: string
}

export interface ICommandBlock {
  type: LogType
  level: LogLevel
  id: string
  ts: number
  message: string
  user: IUser
  status: ProgramStatus
}
