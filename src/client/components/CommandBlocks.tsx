import { FC } from 'react'
import styles from './CommandBlocks.module.scss'
import { ICommandBlock } from '../types'
import { CommandBlock } from './CommandBlock'

export const CommandBlocks: FC<{ blocks: ICommandBlock[] }> = ({ blocks }) => {
  return (
    <div className={styles.CommandBlocks}>
      {blocks.map(block => (
        <CommandBlock key={block.id} block={block} />
      ))}{' '}
    </div>
  )
}
