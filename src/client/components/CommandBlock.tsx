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
      case BlockType.UserReq:
      case BlockType.AssistantResp: {
        return (
          <div
            className={styles.userAvatar}
            style={
              {
                '--avatar-url': `url(${
                  block.type === BlockType.UserReq
                    ? user?.avatar
                    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiPjxnIG9wYWNpdHk9IjEiICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiPjxnIG9wYWNpdHk9IjEiICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiPjxyZWN0IGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMCkgIHJvdGF0ZSgwKSIgeD0iMCIgeT0iMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIHJ4PSI1MCIgLz48bWFzayBpZD0iYmctbWFzay0wIiBmaWxsPSJ3aGl0ZSI+PHVzZSB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiIHhsaW5rOmhyZWY9IiNwYXRoXzAiPjwvdXNlPjwvbWFzaz48ZyBtYXNrPSJ1cmwoI2JnLW1hc2stMCkiID48ZyBvcGFjaXR5PSIxIiAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzA5IDU5KSAgcm90YXRlKDApIj48bWFzayBpZD0iYmctbWFzay0xIiBmaWxsPSJ3aGl0ZSI+PHVzZSB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiIHhsaW5rOmhyZWY9IiNwYXRoXzEiPjwvdXNlPjwvbWFzaz48ZyBtYXNrPSJ1cmwoI2JnLW1hc2stMSkiID48cGF0aCBpZD0i6Lev5b6EIDEiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgb3BhY2l0eT0iMSIgZD0iTTIwLjA5NzEgNDIuNzAwMUwyMC4wOTcxIDkwLjA1MDFMNjYuNTE3MSAxMTQuNDNMNjYuNTE3MSA2NS43MTAxTDIwLjI2NzEgNDIuNjIwMUwyMC4wOTcxIDQyLjcwMDFaIj48L3BhdGg+PHBhdGggaWQ9IuaLvOWQiOWbvuW9oiIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSJ1cmwoI2xpbmVhcl8wKSIgb3BhY2l0eT0iMSIgZD0iTTExOC43ODYsMzQuNzI1NGMxLjQzLDAuOCAyLjU4LDIuMDEgMy4zLDMuNDdjMC40NywxLjAyIDAuNywyLjEzIDAuNjcsMy4yNnY1MC4wOWMtMC4wMSwyLjg4IC0xLjYyLDUuNTIgLTQuMTgsNi44NWwtNDguNjcwMSwyNS43NTk2Yy0wLjkzLDAuNDUgLTEuOTQsMC43MiAtMi45NywwLjc5aC0wLjU4Yy0xLjIyLC0wLjA4IC0yLjQsLTAuNDIgLTMuNDcsLTFsLTQ4LjY4LC0yNS42Mjk2Yy0yLjU0LC0xLjMxIC00LjE0LC0zLjkxIC00LjE3LC02Ljc3di01MC4wOWMwLjAxLC0xLjIyIDAuMzIsLTIuNDEgMC45MiwtMy40N2MwLjM0LC0wLjYgMC43NiwtMS4xNCAxLjI1LC0xLjYzYzAuNTQsLTAuNzIgMS4yMywtMS4zMyAyLC0xLjc5bDQ4LjcyLC0yNS42Mzk5OGMyLjIzLC0xLjE2IDQuODgsLTEuMTYgNy4xLDB6TTIwLjAxNTksOTAuMDQ1NGw0Ni40NiwyNC40MTk2di00OC4wODk2bC00Ni40NiwtMjIuODF6Ij48L3BhdGg+PC9nPjwvZz48cGF0aCBpZD0iQSIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSJ1cmwoI2xpbmVhcl8xKSIgb3BhY2l0eT0iMSIgZD0iTTIzMC4xNTksMTI1aDM3LjljNC4wNywwIDcuNzQsMi40NyA5LjI3LDYuMjVsOTMuMSwyMzBjMi42Niw2LjU3IC0yLjE4LDEzLjc1IC05LjI3LDEzLjc1aC0zOS41OGMtNC4xNiwwIC03Ljg4LC0yLjU4IC05LjM1LC02LjQ3bC0xNC4yLC0zNy42MWMtMS40NywtMy44OSAtNS4yLC02LjQ3IC05LjM2LC02LjQ3aC04MC40NmMtNC4yMSwwIC03Ljk2LDIuNjMgLTkuNCw2LjU4bC0xMy42MSwzNy4zOWMtMS40NCwzLjk1IC01LjE5LDYuNTggLTkuNCw2LjU4aC0zNi4yM2MtNy4wNSwwIC0xMS44OSwtNy4xIC05LjMxLC0xMy42Nmw5MC42LC0yMzBjMS41LC0zLjgyIDUuMTksLTYuMzQgOS4zLC02LjM0ek0yMzguMzY5LDIyMy4wMmwtMTQuMjMsMzkuMThjLTIuMzYsNi41MiAyLjQ2LDEzLjQgOS4zOSwxMy40MWgyOS4xNWM3LDAgMTEuODQsLTcuMDEgOS4zNSwtMTMuNTVsLTE0LjkyLC0zOS4xOWMtMy4zLC04LjY1IC0xNS41OCwtOC41NSAtMTguNzQsMC4xNXoiPjwvcGF0aD48L2c+PC9nPjwvZz48ZGVmcz48cmVjdCBpZD0icGF0aF8wIiB4PSIwIiB5PSIwIiB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgLz48cmVjdCBpZD0icGF0aF8xIiB4PSIwIiB5PSIwIiB3aWR0aD0iMTMzIiBoZWlnaHQ9IjEzMyIgLz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhcl8wIiB4MT0iMCUiIHkxPSI1MCUiIHgyPSIxMDAlIiB5Mj0iNTAlIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMTA5RUU5IiBzdG9wLW9wYWNpdHk9IjEiIC8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDc2NkVBIiBzdG9wLW9wYWNpdHk9IjEiIC8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhcl8xIiB4MT0iMCUiIHkxPSI1MCUiIHgyPSIxMDAlIiB5Mj0iNTAlIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNDc2NkVBIiBzdG9wLW9wYWNpdHk9IjEiIC8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMTA5RUU5IiBzdG9wLW9wYWNpdHk9IjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+'
                })`
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
      {block.status === ProgramStatus.Exit ||
      block.type === BlockType.UserReq ||
      block.type === BlockType.AssistantResp ? (
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
