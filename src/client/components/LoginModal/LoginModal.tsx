import { JsonResp, IUser, ErrorUserNull } from '@askcodebase/common'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { VSCodeApi } from '~/client/VSCodeApi'
import styles from './LoginModal.module.scss'
import { randomString } from '~/client/utils'
import { useSetAtom } from 'jotai'
import { userAtom } from '~/client/store'
import IconGithub from '~/assets/github.svg'
import IconGoogle from '~/assets/google.svg'
import { showLoginModalAtom } from '~/client/store/showLoginModal'

let countdown = 2 * 60 // 2 minutes
let timer: NodeJS.Timer | null = null

export function LoginModal() {
  const setUserState = useSetAtom(userAtom)
  const setShowLoginModal = useSetAtom(showLoginModalAtom)

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
            setShowLoginModal(false)
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

  return (
    <div className={styles.loginModal}>
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
