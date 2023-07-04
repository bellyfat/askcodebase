import styles from './AskCodebasePanel.module.scss'
import { InputBox, WelcomeScreen } from '~/components'
import { ILog, LogType, LogLevel } from './types'
import * as cx from 'classnames'

export function AskCodebasePanel() {
  const logs: ILog[] = [
    {
      id: '1',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Error,
      message: 'test',
      ts: Date.now()
    },
    {
      id: '2',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Success,
      message: 'The command is executed successfully.',
      ts: Date.now()
    },
    {
      id: '3',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Warn,
      message: 'Warning!!! The command is executed successfully.',
      ts: Date.now()
    },
    {
      id: '4',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Info,
      message: 'Note!!! The command is executed successfully.\nNote!!! The command is executed successfully.',
      ts: Date.now()
    },
    {
      id: '5',
      user: { userid: 'test', username: 'test' },
      type: LogType.UserReq,
      level: LogLevel.Log,
      message: 'Log. The command is executed successfully.',
      ts: Date.now()
    }
  ]

  return (
    <div className={styles.AskCodebasePanel}>
      {/* <WelcomeScreen /> */}
      <InputBox />
      <div className={styles.logs}>
        {logs.map(log => (
          <div className={cx(styles.log, styles[log.level])} key={log.id}>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  )
}
