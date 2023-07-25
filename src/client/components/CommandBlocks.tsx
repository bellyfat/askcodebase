import { FC, useState } from 'react'
import styles from './CommandBlocks.module.scss'
import { BlockType, ICommandBlock } from '../types'
import { CommandBlock } from './CommandBlock'
import { CommandBlockBuilder } from '../CommandBlockBuilder'

export const CommandBlocks: FC<{ blocks: ICommandBlock[] }> = ({ blocks }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
