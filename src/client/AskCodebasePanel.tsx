import styles from './AskCodebasePanel.module.scss'
import * as cx from 'classnames'

export function AskCodebasePanel() {
  return (
    <div className={styles.AskCodebasePanel}>
      <div className={styles.inputBox}>
        <div className={cx('codicon codicon-debug-console-evaluation-prompt', styles.prompt)}></div>
        <input className={styles.input} />
      </div>
    </div>
  )
}
