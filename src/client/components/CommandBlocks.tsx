import { FC } from 'react'
import styles from './CommandBlocks.module.scss'
import { BlockType, ICommandBlock } from '../types'
import { CommandBlock } from './CommandBlock'
import { CommandBlockBuilder } from '../CommandBlockBuilder'
import { useAtomValue } from 'jotai'
import { userAtom } from '../store'

export const CommandBlocks: FC<{ blocks: ICommandBlock[] }> = ({ blocks }) => {
  const isLoggedIn = useAtomValue(userAtom)

  if (!isLoggedIn) {
    const block = CommandBlockBuilder.create({
      type: BlockType.LoginBlock
    }) as ICommandBlock
    return (
      <div className={styles.CommandBlocks}>
        <CommandBlock key={block.id} block={block} />
      </div>
    )
  }

  return (
    <div className={styles.CommandBlocks}>
      {blocks.map(block => (
        <CommandBlock key={block.id} block={block} />
      ))}{' '}
    </div>
  )
}
