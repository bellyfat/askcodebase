import { FC, useEffect, useRef, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { ICommandBlock, BlockType, ProgramStatus } from '../types'
import styles from './CommandBlock.module.scss'
import * as cx from 'classnames'
import 'xterm/css/xterm.css'
import { Terminal } from 'xterm'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import IconGithub from '~/assets/github.svg'
import IconGoogle from '~/assets/google.svg'
import { VSCodeApi } from '../VSCodeApi'
import { randomString } from '../utils'

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
    if (block.type === BlockType.ShellResp) {
      const terminalElement = terminal$.current!
      const terminal = new Terminal()
      terminal.open(terminalElement)
      terminal.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
    }
  }, [])

  const loginWithGitHub = () => {
    const state = randomString()
    VSCodeApi.openLink(`https://askcodebase.com/api/login/github?state=${state}`)

    let countdown = 2 * 60 // 2 minutes
    const timer = setInterval(async () => {
      countdown--

      if (countdown <= 0) {
        clearInterval(timer)
        return
      }

      const resp = await fetch(`https://askcodebase.com/api/user?state=${state}`)
      const user = await resp.json()
      console.log('user', user)
    }, 1000)
  }

  const loginWithGoogle = () => {
    VSCodeApi.showInformationMessage('Coming soon, use GitHub for now.')
  }

  if (block.type === BlockType.LoginBlock) {
    return (
      <div
        className={cx(
          styles.CommandBlock,
          styles[block.level],
          block.status === ProgramStatus.Running && styles.running
        )}
        key={block.id}
      >
        <div className={styles.login}>
          <div className={styles.header}>Log in to your account to continue</div>
          <div className={styles.buttons}>
            <VSCodeButton className={styles.github} onClick={loginWithGitHub}>
              <div className={styles.buttonContent}>
                <div className={styles.icon}>
                  <IconGithub />
                </div>
                Log in with GitHub
              </div>
            </VSCodeButton>
            <VSCodeButton className={styles.google} onClick={loginWithGoogle}>
              <div className={styles.buttonContent}>
                <div className={styles.icon}>
                  <IconGoogle />
                </div>
                Log in with Google
              </div>
            </VSCodeButton>
          </div>
        </div>
      </div>
    )
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
