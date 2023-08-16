import styles from './WelcomeScreen.module.scss'

export function WelcomeScreen() {
  return (
    <div className={styles.WelcomeScreen}>
      <div className={styles.WelcomeScreenInner}>
        <div className={styles.title}>
          <span>AskCodebase AI</span>
        </div>
        <div className={styles.description}>Your AI Programming Autopilot</div>
        <div className={styles.examples}>
          <div className={styles.block}>
            <div className={styles.subTitle}>Examples:</div>
          </div>
          <div className={styles.block}>
            <div className={styles.head}>Built-in Commands:</div>
            <div className={styles.example}>clear</div>
          </div>
          {/* Need to re-introduce it later. */}
          {/* <div className={styles.block}>
            <div className={styles.head}>Shell Commands:</div>
            <div className={styles.example}>ls -la</div>
            <div className={styles.example}>npm install</div>
            <div className={styles.example}>npm run dev</div>
            <div className={styles.example}>git log</div>
            <div className={styles.example}>pwd</div>
          </div> */}
          <div className={styles.block}>
            <div className={styles.head}>Codebase Commands:</div>
            <div className={styles.example}>explain the codebase</div>
            <div className={styles.example}>refactor this file</div>
            <div className={styles.example}>fix problems</div>
          </div>
          <div className={styles.block}>
            <div className={styles.head}>Ask Questions:</div>
            <div className={styles.example}>How to use react 18?</div>
            <div className={styles.example}>what is the entry of this project?</div>
          </div>
        </div>
      </div>
    </div>
  )
}
