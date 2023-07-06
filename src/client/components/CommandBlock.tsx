import { FC, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { ICommandBlock, ProgramStatus } from '../types'
import styles from './CommandBlock.module.scss'
import * as cx from 'classnames'

export const CommandBlock: FC<{ block: ICommandBlock }> = ({ block }) => {
  const [tooltipContent, setTooltipContent] = useState('Click to copy')
  const handleMouseDown = () => {
    setTooltipContent('Copied!')
  }

  const handleMouseUp = () => {
    setTimeout(() => {
      setTooltipContent('Click to copy')
    }, 2000)
  }

  return (
    <div
      className={cx(
        styles.CommandBlock,
        styles[block.level],
        block.status === ProgramStatus.Running && styles.running
      )}
      key={block.id}
    >
      <div className={cx('codicon codicon-gripper', styles.gripper)}></div>
      <div>{block.message}</div>
      {block.status === ProgramStatus.Exit ? (
        <div
          data-tooltip-id='copy-command'
          data-tooltip-content={tooltipContent}
          data-tooltip-delay-hide={1000}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className={cx('codicon codicon-copy', styles.copy)}
        ></div>
      ) : (
        <div className={cx('stop-process', 'codicon codicon-debug-stop', styles.stop)}></div>
      )}
      <Tooltip
        id='copy-command'
        place='left'
        style={{
          color: 'var(--vscode-foreground)',
          background: 'var(--vscode-panel-background)'
        }}
      />
      <Tooltip
        anchorSelect='.stop-process'
        place='left'
        style={{
          color: 'var(--vscode-foreground)',
          background: 'var(--vscode-panel-background)'
        }}
      >
        Stop
      </Tooltip>
    </div>
  )
}
