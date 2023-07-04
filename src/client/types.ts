export enum LogLevel {
  Log = 'log',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Success = 'success'
}

export interface ILog {
  id: number
  ts: number
  text: string
  code: number
  level: LogLevel
}
