import styles from './AskCodebasePanel.module.scss'
import { InputBox, WelcomeScreen } from '~/client/components'
import { ILog, LogType, LogLevel, ProgramStatus } from './types'
import * as cx from 'classnames'
import { useEffect, useState } from 'react'
import { VSCodeApi } from './VSCodeApi'
import { colorToRGBString } from '~/client/utils'

function getThemeColors() {
  const element = document.getElementsByTagName('html')[0]
  const colors = Object.values(element.style).map(color => {
    const colorValue = element.style.getPropertyValue(color)
    return [color, colorValue]
  })
  return colors
    .filter(([key, value]) => key.startsWith('--'))
    .reduce((o, [key, value]) => Object.assign(o, { [key]: value }), {})
}

export function AskCodebasePanel() {
  const [themeColors, setThemeColors] = useState<Record<string, string>>(() => getThemeColors())

  useEffect(() => {
    VSCodeApi.onColorThemeChanged(() => setThemeColors(getThemeColors()))
  }, [])

  const logs: ILog[] = [
    {
      id: '1',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Error,
      message: 'test',
      ts: Date.now(),
      status: ProgramStatus.Exit
    },
    {
      id: '2',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Success,
      message: 'The command is executed successfully.',
      ts: Date.now(),
      status: ProgramStatus.Exit
    },
    {
      id: '3',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Warn,
      message: 'Warning!!! The command is executed successfully.',
      ts: Date.now(),
      status: ProgramStatus.Exit
    },
    {
      id: '4',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Info,
      message:
        'Note!!! The command is executed successfully.\nNote!!! The resource is downloading...',
      ts: Date.now(),
      status: ProgramStatus.Running
    },
    {
      id: '5',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Log,
      message: 'Log. The command is executed successfully.',
      ts: Date.now(),
      status: ProgramStatus.Exit
    }
  ]

  const colors = {
    '--vscode-terminal-ansiRedRGB': colorToRGBString(themeColors['--vscode-terminal-ansiRed']),
    '--vscode-terminal-ansiGreenRGB': colorToRGBString(themeColors['--vscode-terminal-ansiGreen']),
    '--vscode-terminal-ansiYellowRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiYellow']
    ),
    '--vscode-terminal-ansiBlueRGB': colorToRGBString(themeColors['--vscode-terminal-ansiBlue']),
    '--vscode-terminal-ansiMagentaRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiMagenta']
    ),
    '--vscode-terminal-ansiCyanRGB': colorToRGBString(themeColors['--vscode-terminal-ansiCyan']),
    '--vscode-terminal-ansiWhiteRGB': colorToRGBString(themeColors['--vscode-terminal-ansiWhite']),
    '--vscode-terminal-ansiBlackRGB': colorToRGBString(themeColors['--vscode-terminal-ansiBlack']),
    '--vscode-terminal-ansiBrightRedRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightRed']
    ),
    '--vscode-terminal-ansiBrightGreenRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightGreen']
    ),
    '--vscode-terminal-ansiBrightYellowRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightYellow']
    ),
    '--vscode-terminal-ansiBrightBlueRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightBlue']
    ),
    '--vscode-terminal-ansiBrightMagentaRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightMagenta']
    ),
    '--vscode-terminal-ansiBrightCyanRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightCyan']
    ),
    '--vscode-terminal-ansiBrightWhiteRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightWhite']
    ),
    '--vscode-terminal-ansiBrightBlackRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightBlack']
    )
  } as unknown as React.CSSProperties

  return (
    <div className={styles.AskCodebasePanel} style={colors}>
      {/* <WelcomeScreen /> */}
      <InputBox />
      <div className={styles.logs}>
        {logs.map(log => (
          <div
            className={cx(
              styles.log,
              styles[log.level],
              log.status === ProgramStatus.Running && styles.running
            )}
            key={log.id}
          >
            <div className={cx('codicon codicon-gripper', styles.gripper)}></div>
            <div>{log.message}</div>
            {log.status === ProgramStatus.Exit ? (
              <div className={cx('codicon codicon-copy', styles.copy)}></div>
            ) : (
              <div className={cx('codicon codicon-debug-stop', styles.stop)}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
