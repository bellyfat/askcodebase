import styles from './MonacoInputBox.module.scss'
import * as cx from 'classnames'
import Editor, { Monaco } from '@monaco-editor/react'
import { FC, useEffect, useRef } from 'react'
import { ChatInputProps } from './Chat/Chat'
import { useAtomValue, useSetAtom } from 'jotai'
import { userAtom } from '../store'
import { showLoginModalAtom } from '../store/showLoginModal'
import { useAtomRefValue } from '../hooks'
import { VSCodeApi, globalEventEmitter } from '../VSCodeApi'
import { messageIsStreamingAtom } from '../store/messageIsStreamingAtom'

const placeholder = 'Type a message'

export const MonacoInputBox: FC<ChatInputProps> = ({ onSend, onScrollDownClick }) => {
  const messageIsStreaming = useAtomValue(messageIsStreamingAtom)
  const inputBox$ = useRef<HTMLDivElement | null>()
  const editor$ = useRef<any | null>(null)
  const setShowLoginModal = useSetAtom(showLoginModalAtom)
  const [user, getUserRefValue] = useAtomRefValue(userAtom)

  const handleSend = (content: string) => {
    if (messageIsStreaming) {
      return
    }

    if (!content) {
      return
    }

    onSend({ role: 'user', content })
    onScrollDownClick()
  }

  const handleEditorOnChange = (value: string | undefined) => {
    let placeholder = document.querySelector('.monaco-placeholder') as HTMLElement | null
    if (!value) {
      placeholder!.style.display = 'block'
    } else {
      placeholder!.style.display = 'none'
    }
  }

  const handleEditorOnMount = (editor: any, monaco: Monaco) => {
    editor$.current = editor

    const inputBoxElement = inputBox$.current as HTMLDivElement
    inputBoxElement.style.height = 'unset'
    const layout = () => {
      const container = editor$.current.getContainerDomNode()
      const halfWindowHeight = Math.floor(document.body.clientHeight / 2)
      const contentHeight = Math.min(halfWindowHeight, editor.getContentHeight())
      let promptWidth = 30
      const paddingBorder = (1 + 11) * 2
      if (innerWidth < 896 + paddingBorder) {
        promptWidth = 60
      }
      container.style.height = `${contentHeight}px`
      const contentWidth = Math.min(896 - promptWidth, innerWidth - promptWidth)
      editor.layout({ width: contentWidth, height: contentHeight })
    }
    layout()

    window.addEventListener('resize', layout)
    editor.onDidChangeModelContent(layout)

    // Disable Find Command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, function () {})
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, function () {
      VSCodeApi.hidePanel()
    })
    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.KeyH, function () {
      VSCodeApi.hidePanel()
    })

    let isSuggestionOpen = false
    const suggestionController = editor.getContribution('editor.contrib.suggestController')
    suggestionController.widget.value.onDidShow(() => (isSuggestionOpen = true))
    suggestionController.widget.value.onDidHide(() => (isSuggestionOpen = false))

    // Enter to send message
    editor.addCommand(monaco.KeyCode.Enter, () => {
      if (isSuggestionOpen) {
        editor.trigger('keyboard', 'acceptSelectedSuggestion', {})
        return
      }

      const currentContent = editor.getValue()
      const user = getUserRefValue()
      if (!user) {
        setShowLoginModal(true)
        return
      }
      handleSend(currentContent)
      editor.setValue('')
    })

    // Ctrl + P to Open File
    // TODO hardcoded shortcut here, there's no callback for when the quickOpen is closed
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, async () => {
      VSCodeApi.executeCommand('workbench.action.quickOpen')
    })
    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.KeyP, async () => {
      VSCodeApi.executeCommand('workbench.action.quickOpen')
    })

    // Shift + Enter to start new line
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      editor.trigger('keyboard', 'type', { text: '\n' })
    })

    monaco.editor.defineTheme('ask-codebase', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
      },
    })
    let placeholder = document.querySelector('.monaco-placeholder') as HTMLElement | null
    placeholder!.style.display = 'block'

    monaco.editor.setTheme('ask-codebase')
    editor.focus()
  }

  useEffect(() => {
    const handleOnDidChangeVisibility = (visible: boolean) => {
      if (visible) {
        setTimeout(() => {
          editor$.current.focus()
        }, 300)
      }
    }
    globalEventEmitter.on('onDidChangeVisibility', handleOnDidChangeVisibility)
    return () => {
      globalEventEmitter.off('onDidChangeVisibility', handleOnDidChangeVisibility)
      return
    }
  }, [])

  return (
    <div className={styles.inputBox} ref={ref => (inputBox$.current = ref)}>
      <div className={cx('codicon codicon-debug-console-evaluation-prompt', styles.prompt)}></div>
      <Editor
        className={styles.input}
        defaultLanguage='markdown'
        theme='ask-codebase'
        options={{
          glyphMargin: false,
          lineNumbers: 'off',
          lineDecorationsWidth: 0,
          overviewRulerLanes: 0,
          folding: false,
          fontFamily: 'var(--vscode-editor-font-family)',
          minimap: {
            enabled: false,
          },
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
          },
          automaticLayout: true,
          renderLineHighlight: 'none',
          scrollBeyondLastLine: false,
          scrollBeyondLastColumn: 0,
          wordWrap: 'on',
          wrappingStrategy: 'advanced',
        }}
        onChange={handleEditorOnChange}
        onMount={handleEditorOnMount}
        loading={null}
      />
      <div className={cx('monaco-placeholder', styles.placeholder)}>{placeholder}</div>
    </div>
  )
}
