import { FC, useEffect, useRef, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { ICommandBlock, BlockType, ProgramStatus } from '../types'
import styles from './CommandBlock.module.scss'
import * as cx from 'classnames'
import 'xterm/css/xterm.css'
import { Terminal } from 'xterm'

export const CommandBlock: FC<{ block: ICommandBlock }> = ({ block }) => {
  const terminal$ = useRef<HTMLDivElement | null>(null)
  const [tooltipContent, setTooltipContent] = useState('Click to copy')
  const handleMouseDown = () => {
    setTooltipContent('Copied!')
  }

  const handleMouseUp = () => {
    setTimeout(() => {
      setTooltipContent('Click to copy')
    }, 2000)
  }

  const renderHead = (block: ICommandBlock) => {
    switch (block.type) {
      case BlockType.UserReq: {
        return (
          <div
            className={styles.userAvatar}
            style={
              {
                '--avatar-url': `url(${block.user.avatarUrl})`
              } as React.CSSProperties
            }
          ></div>
        )
      }
      case BlockType.ShellResp: {
        return <div className={cx('codicon codicon-gripper', styles.gripper)}></div>
      }
    }
  }

  useEffect(() => {
    const terminalElement = terminal$.current!
    const terminal = new Terminal()
    terminal.open(terminalElement)
    terminal.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
  }, [])

  return (
    <div
      className={cx(
        styles.CommandBlock,
        styles[block.level],
        block.status === ProgramStatus.Running && styles.running
      )}
      key={block.id}
    >
      <div className={styles.terminal} ref={ref => (terminal$.current = ref)}></div>
      {/* {renderHead(block)}
      <div className={styles.message}>{block.message}</div>
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
      </Tooltip> */}
    </div>
  )
}
