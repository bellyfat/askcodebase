import { CommandBlockBuilder } from './CommandBlockBuilder'
import { EventEmitter } from 'events'
import { BlockType } from './types'

export enum LogEvent {
  Push = 'push',
  Update = 'update',
  Remove = 'remove'
}

export class LogClass {
  public eventEmitter: EventEmitter = new EventEmitter()

  public userSend(message: string) {
    const block = CommandBlockBuilder.create({ message, type: BlockType.UserReq })
    this.eventEmitter.emit(LogEvent.Push, block)
  }
}

export const Log = new LogClass()
