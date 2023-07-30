import styles from './AskCodebasePanel.module.scss'
import { MonacoInputBox, WelcomeScreen } from '~/client/components'
import { useEffect, useState } from 'react'
import { VSCodeApi } from './VSCodeApi'
import { colorToRGBString } from '~/client/utils'
import { CommandBlocks } from './components/CommandBlocks'
import { useAtomValue } from 'jotai'
import { commandBlocksAtom, userAtom } from './store'
import { useCommandBlocks } from './hooks'
import { ReactStreamChat } from './components/ReactStreamChat'
import { Message } from './types/chat'
import { ChatInputComponent } from './components/Chat/Chat'

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
  const blocks = useAtomValue(commandBlocksAtom)
  const user = useAtomValue(userAtom)

  useCommandBlocks()

  useEffect(() => {
    VSCodeApi.onColorThemeChanged(() => setThemeColors(getThemeColors()))
  }, [])

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

  const getResponseStream = async (message: Message) => {
    const resp = await fetch('https://askcodebase.com/chat', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + user?.jwt
      },
      method: 'POST',
      body: JSON.stringify({
        question: message
      })
    })
    if (!(resp.body instanceof ReadableStream)) {
      throw new Error('Network Error')
    }
    return resp.body
  }
  const CustomChatInput: ChatInputComponent = ({
    stopConversationRef,
    textareaRef,
    onSend,
    onScrollDownClick,
    onRegenerate,
    showScrollDownButton
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
      {/* {blocks?.length > 0 ? <CommandBlocks blocks={blocks} /> : <WelcomeScreen />} */}
    </div>
  )
}
