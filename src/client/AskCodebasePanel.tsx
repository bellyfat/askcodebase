import styles from './AskCodebasePanel.module.scss'
import * as cx from 'classnames'
import { WelcomeScreen } from '~/components'

export function AskCodebasePanel() {
  return (
    <div className={styles.AskCodebasePanel}>
      <WelcomeScreen />
      <div className={styles.inputBox}>
        <div className={cx('codicon codicon-debug-console-evaluation-prompt', styles.prompt)}></div>
        <input className={styles.input} placeholder='Send a command or a message' />
      </div>
    </div>
  )
}
