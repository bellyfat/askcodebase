import styles from './WelcomeScreen.module.scss'

export function WelcomeScreen() {
  return (
    <div className={styles.WelcomeScreen}>
      <div className={styles.title}>
        <span>AskCodebase AI</span>
      </div>
      <div className={styles.description}>Chat Is All You Need</div>
      <div className={styles.examples}>
        <div className={styles.block}>
          <div className={styles.subTitle}>Examples:</div>
        </div>
        <div className={styles.block}>
          <div className={styles.head}>Built-in Commands:</div>
          <div className={styles.example}>revert</div>
          <div className={styles.example}>help</div>
        </div>
        <div className={styles.block}>
          <div className={styles.head}>Shell Commands:</div>
          <div className={styles.example}>ls -la</div>
          <div className={styles.example}>npm install</div>
          <div className={styles.example}>npm run dev</div>
          <div className={styles.example}>git log</div>
          <div className={styles.example}>pwd</div>
        </div>
        <div className={styles.block}>
          <div className={styles.head}>Codebase Commands:</div>
          <div className={styles.example}>install npm dependencies for me</div>
          <div className={styles.example}>start this project</div>
          <div className={styles.example}>fix all errors</div>
          <div className={styles.example}>help me push my changes to the remote repository</div>
        </div>
        <div className={styles.block}>
          <div className={styles.head}>Ask Questions:</div>
          <div className={styles.example}>How to use react 18?</div>
          <div className={styles.example}>explain this project for me</div>
        </div>
      </div>
    </div>
  )
}
