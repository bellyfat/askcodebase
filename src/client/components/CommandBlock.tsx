import { FC, useEffect, useRef, useState } from 'react'
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
import { ErrorUserNull, IUser, JsonResp } from '@askcodebase/common'
import { useAtom, useSetAtom } from 'jotai'
import { userAtom } from '../store'
import { Tooltip } from 'react-tooltip'

let countdown = 2 * 60 // 2 minutes
let timer: NodeJS.Timer | null = null

export const CommandBlock: FC<{ block: ICommandBlock }> = ({ block }) => {
  const [user, setUserState] = useAtom(userAtom)
  const terminal$ = useRef<HTMLDivElement | null>(null)

  const renderHead = (block: ICommandBlock) => {
    switch (block.type) {
      case BlockType.UserReq: {
        return (
          <div
            className={styles.userAvatar}
            style={
              {
                '--avatar-url': `url(${user?.avatar})`
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

  const loginWithGitHub = async () => {
    const state = randomString()
    await VSCodeApi.openLink(`https://askcodebase.com/api/login/github?state=${state}`)

    if (timer == null) {
      timer = setInterval(async () => {
        countdown--

        if (countdown <= 0) {
          clearInterval(timer!)
          timer = null
          return
        }

        try {
          const resp = await fetch(`https://askcodebase.com/api/user?state=${state}`)
          const { data: user, error, errcode } = (await resp.json()) as JsonResp<IUser>

          if (errcode > 0 && errcode !== ErrorUserNull.code) {
            VSCodeApi.showErrorMessage(error!)
            clearInterval(timer!)
            timer = null
            return
          }

          if (user != null) {
            setUserState(user)
            clearInterval(timer!)
            timer = null
            return
          }
        } catch (error) {
          console.error(error)
        }
      }, 1000)
    }
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
      {renderHead(block)}
      <div className={styles.message}>{block.message}</div>
      {block.status === ProgramStatus.Exit || block.type === BlockType.UserReq ? (
        <div
          data-tooltip-id='copy-command'
          data-tooltip-content='Click to Copy'
          data-tooltip-delay-hide={1000}
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
