import { useAtomValue } from 'jotai'
import { FC, useEffect, useRef, useState } from 'react'
import { ITerminalInitOnlyOptions, ITerminalOptions, Terminal } from 'xterm'
import { themeColorsAtom } from '~/client/store'
import { Message } from '~/client/types/chat'
import { randomString } from '~/client/utils'
import styles from './XtermMessage.module.scss'

interface Props {
  message: Message
}

export const XtermMessage: FC<Props> = ({ message }) => {
  const [id] = useState(() => randomString())
  const themeColors = useAtomValue(themeColorsAtom)
  const terminal$ = useRef<Terminal | null>(null)
  const rows$ = useRef(80)

  console.log(themeColors)
  useEffect(() => {
    const config = {
      rows: 1,
      fontSize: 13,
      disableStdin: true,
      allowTransparency: true,
      theme: {
        foreground: themeColors['--vscode-foreground'],
        background: themeColors['--vscode-panel-background'],
        black: themeColors['--vscode-terminal-ansiBlack'],
        blue: themeColors['--vscode-terminal-ansiBlue'],
        cyan: themeColors['--vscode-terminal-ansiCyan'],
        green: themeColors['--vscode-terminal-ansiGreen'],
        magenta: themeColors['--vscode-terminal-ansiMagenta'],
        red: themeColors['--vscode-terminal-ansiRed'],
        white: themeColors['--vscode-foreground'],
        yellow: themeColors['--vscode-terminal-ansiYellow'],
        brightBlack: themeColors['--vscode-terminal-ansiBrightBlack'],
        brightBlue: themeColors['--vscode-terminal-ansiBrightBlue'],
        brightCyan: themeColors['--vscode-terminal-ansiBrightCyan'],
        brightGreen: themeColors['--vscode-terminal-ansiBrightGreen'],
        brightMagenta: themeColors['--vscode-terminal-ansiBrightMagenta'],
        brightRed: themeColors['--vscode-terminal-ansiBrightRed'],
        brightWhite: themeColors['--vscode-terminal-ansiBrightWhite'],
        brightYellow: themeColors['--vscode-terminal-ansiBrightYellow'],
        cursor: themeColors['--vscode-panel-background'],
        cursorAccent: themeColors['--vscode-panel-background'],
        selectionBackground: themeColors['--vscode-editor-selectionBackground'],
        selectionForeground: themeColors['--vscode-editor-selectionForeground'],
        selectionInactiveBackground: themeColors['--vscode-editor-inactiveSelectionBackground'],
      },
    } as ITerminalOptions & ITerminalInitOnlyOptions
    const term = new Terminal(config)
    const container = document.getElementById(id)!
    terminal$.current = term
    term.open(container)
    term.onRender(e => {
      console.log({
        baseY: term.buffer.active.baseY,
        rows: term.rows,
        actualCellHeight: (term as any)._core._renderService.dimensions.actualCellHeight,
        cell: (term as any)._core._renderService.dimensions.css.cell,
        dimentions: (term as any)._core._renderService.dimensions,
        render: (term as any)._core._renderService,
      })
      const rows = term.buffer.active.baseY + term.rows
      const lineHeight = 13
      container.style.height = `${rows * lineHeight}px`
    })
    term.write(message.content.trim())
  }, [])

  useEffect(() => {
    const term = terminal$.current
    const lines = message.content.split('\n').length
    if (term != null) {
      term.resize(rows$.current, lines)
      term.scrollToBottom()
    }
  }, [message.content])

  return <div id={id} className={styles.xtermMessage}></div>
}
