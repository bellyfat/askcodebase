import { EventEmitter } from 'events'

export enum ProcessEvent {
  Error = 'error',
  Exit = 'exit'
}

export interface ProcessCallbacks {
  [ProcessEvent.Error]: (error: Error) => void
  [ProcessEvent.Exit]: (code: number) => void
}

export class Process {
  private _events: EventEmitter = new EventEmitter()
  private _stdout: EventEmitter = new EventEmitter()
  private _stderr: EventEmitter = new EventEmitter()

  constructor(public readonly pid: number) {}

  public dispatchEvent(event: string, data: any) {
    switch (event) {
      case 'exit':
      case 'error':
        this._events.emit(event, data)
        break
      case 'stdout.data':
        this._stdout.emit(event, data)
        break
      case 'stderr.data':
        this._stderr.emit(event, data)
        break
    }
  }

  public on<K extends keyof ProcessCallbacks>(event: K, callback: ProcessCallbacks[K]) {
    this._events.on(event, callback)
  }

  public get stdout() {
    return {
      on: (event: string, callback: (data: any) => void) => {
        this._stdout.on(`stdout.${event}`, callback)
      }
    }
  }

  public get stderr() {
    return {
      on: (event: string, callback: (data: any) => void) => {
        this._stderr.on(`stderr.${event}`, callback)
      }
    }
  }
}
