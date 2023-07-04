import styles from './AskCodebasePanel.module.scss'
import { InputBox, WelcomeScreen } from '~/components'

export function AskCodebasePanel() {
  return (
    <div className={styles.AskCodebasePanel}>
      <WelcomeScreen />
      <InputBox />
    </div>
  )
}
