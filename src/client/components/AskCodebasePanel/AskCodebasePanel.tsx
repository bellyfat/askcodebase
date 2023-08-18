import styles from './AskCodebasePanel.module.scss'
import { MonacoInputBox } from '~/client/components'
import { useEffect, useRef, useState } from 'react'
import { VSCodeApi } from '~/client/VSCodeApi'
import { colorToRGBString } from '~/client/utils'
import { ChatInputComponent } from '~/client/components'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { activeConversationAtom, themeColorsAtom, userAtom } from '~/client/store'
import { useAtomRefValue, useCommandBlocks } from '~/client/hooks'
import { ReactStreamChat } from '~/client/components/ReactStreamChat'
import { Message } from '~/client/types/chat'
import { LoginModal } from '~/client/components'
import { showLoginModalAtom } from '~/client/store/showLoginModal'
import { getThemeColors } from '~/client/store/themeColorsAtom'
import { systemInfoAtom } from '~/client/store/systemInfoAtom'
import { TraceID } from '~/common/traceTypes'

export function AskCodebasePanel() {
  const [themeColors, setThemeColors] = useAtom(themeColorsAtom)
  const setSystemInfo = useSetAtom(systemInfoAtom)
  const showLoginModal = useAtomValue(showLoginModalAtom)
  const activeConversation = useAtomValue(activeConversationAtom)
  const [user, getUser] = useAtomRefValue(userAtom)

  useCommandBlocks()

  useEffect(() => {
    VSCodeApi.onColorThemeChanged(() => setThemeColors(getThemeColors()))
    VSCodeApi.getSystemInfo().then(systemInfo => setSystemInfo(systemInfo))
    VSCodeApi.setGlobalState('user', localStorage.getItem('user')).then(async () => {
      await VSCodeApi.trace({ id: TraceID.Client_OnShow })
    })
  }, [])

  const colors = {
    '--vscode-terminal-ansiRedRGB': colorToRGBString(themeColors['--vscode-terminal-ansiRed']),
    '--vscode-terminal-ansiGreenRGB': colorToRGBString(themeColors['--vscode-terminal-ansiGreen']),
    '--vscode-terminal-ansiYellowRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiYellow'],
    ),
    '--vscode-terminal-ansiBlueRGB': colorToRGBString(themeColors['--vscode-terminal-ansiBlue']),
    '--vscode-terminal-ansiMagentaRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiMagenta'],
    ),
    '--vscode-terminal-ansiCyanRGB': colorToRGBString(themeColors['--vscode-terminal-ansiCyan']),
    '--vscode-terminal-ansiWhiteRGB': colorToRGBString(themeColors['--vscode-terminal-ansiWhite']),
    '--vscode-terminal-ansiBlackRGB': colorToRGBString(themeColors['--vscode-terminal-ansiBlack']),
    '--vscode-terminal-ansiBrightRedRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightRed'],
    ),
    '--vscode-terminal-ansiBrightGreenRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightGreen'],
    ),
    '--vscode-terminal-ansiBrightYellowRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightYellow'],
    ),
    '--vscode-terminal-ansiBrightBlueRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightBlue'],
    ),
    '--vscode-terminal-ansiBrightMagentaRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightMagenta'],
    ),
    '--vscode-terminal-ansiBrightCyanRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightCyan'],
    ),
    '--vscode-terminal-ansiBrightWhiteRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightWhite'],
    ),
    '--vscode-terminal-ansiBrightBlackRGB': colorToRGBString(
      themeColors['--vscode-terminal-ansiBrightBlack'],
    ),
  } as unknown as React.CSSProperties

  const getResponseStream = async (message: Message) => {
    const resp = await fetch('https://askcodebase.com/api/chat', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + getUser()?.jwt,
      },
      method: 'POST',
      body: JSON.stringify({
        project_id: activeConversation.id,
        message: message.content,
      }),
    })
    if (!(resp.body instanceof ReadableStream)) {
      VSCodeApi.trace({ id: TraceID.Client_OnChatResponseFailure })
      throw new Error('Network Error')
    }
    VSCodeApi.trace({ id: TraceID.Client_OnChatResponseSuccess })
    return resp.body
  }

  const CustomChatInput: ChatInputComponent = ({
    stopConversationRef,
    textareaRef,
    onSend,
    onScrollDownClick,
    onRegenerate,
    showScrollDownButton,
  }) => (
    <MonacoInputBox
      stopConversationRef={stopConversationRef}
      textareaRef={textareaRef}
      onSend={onSend}
      onScrollDownClick={onScrollDownClick}
      onRegenerate={onRegenerate}
      showScrollDownButton={showScrollDownButton}
    />
  )

  return (
    <div className={styles.AskCodebasePanel} style={colors}>
      <ReactStreamChat getResponseStream={getResponseStream} CustomChatInput={CustomChatInput} />
      {showLoginModal ? <LoginModal /> : null}
    </div>
  )
}
