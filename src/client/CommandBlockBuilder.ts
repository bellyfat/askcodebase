import { randomString } from '~/client/utils'
import { ICommandBlock, LogLevel, BlockType, ProgramStatus } from './types'

export class CommandBlockBuilder {
  private static _baseCommandBlock = {
    level: LogLevel.Log,
    user: {
      userid: 'test',
      username: 'test',
      avatarUrl:
        'https://avatars.githubusercontent.com/u/32427260?s=400&u=d45336a4227d24b24c75fda962567eb81c88b9e1&v=4'
    },
    type: BlockType.ShellResp,
    ts: Date.now(),
    status: ProgramStatus.Running
  }

  public static create(block: Partial<ICommandBlock>) {
    return {
      id: randomString(),
      ...this._baseCommandBlock,
      ...block
    }
  }
}
