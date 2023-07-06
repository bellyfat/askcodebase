import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { Log, LogEvent } from '~/client/Log'
import { commandBlocksAtom } from '~/client/store'
import { BlockType, ICommandBlock } from '../types'
import { VSCodeApi } from '../VSCodeApi'
import { ProcessEvent } from '../Process'
import { CommandBlockBuilder } from '../CommandBlockBuilder'

export function useCommandBlocks() {
  const setCommandBlocks = useSetAtom(commandBlocksAtom)

  const onPushBlock = (block: ICommandBlock) => {
    setCommandBlocks(blocks => [...blocks, block])

    if (block.type === BlockType.UserReq) {
      executeCommand(block.message)
    }
  }

  const executeCommand = async (command: string) => {
    const process = await VSCodeApi.spawn(command)
    const pid = process.pid
    const block = CommandBlockBuilder.create({ type: BlockType.ShellResp })

    process.on(ProcessEvent.Exit, code => {
      console.log(`process ${pid} exited with code ${code}`)
    })
    process.on(ProcessEvent.Error, data => {
      console.log(`process ${pid} has error ${data}`)
    })
    process.stdout.on('data', (data: string) => {
      block.message = data
      onPushBlock(block as ICommandBlock)
      console.log(data)
    })
    process.stderr.on('data', data => {
      console.error(data)
    })
  }

  useEffect(() => {
    Log.eventEmitter.on(LogEvent.Push, onPushBlock)

    return () => {
      Log.eventEmitter.off(LogEvent.Push, onPushBlock)
    }
  }, [])
}
