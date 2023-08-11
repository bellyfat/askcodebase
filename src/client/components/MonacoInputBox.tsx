import styles from './MonacoInputBox.module.scss'
import * as cx from 'classnames'
import Editor, { Monaco, useMonaco, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { FC, useContext, useEffect, useRef } from 'react'
import { ChatInputProps } from './Chat/Chat'
import { ReactStreamChatContext } from './ReactStreamChat/context'
import { useSetAtom } from 'jotai'
import { userAtom } from '../store'
import { showLoginModalAtom } from '../store/showLoginModal'
import { useAtomRefValue } from '../hooks'
import { VSCodeApi, globalEventEmitter } from '../VSCodeApi'

loader.config({ monaco })
const placeholder = 'Type a command or a message'

export const MonacoInputBox: FC<ChatInputProps> = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
}) => {
  const {
    state: { selectedConversation, messageIsStreaming },
  } = useContext(ReactStreamChatContext)
  const inputBox$ = useRef<HTMLDivElement | null>()
  const editor$ = useRef<any | null>(null)
  const monaco = useMonaco()
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

  const handleStopConversation = () => {
    stopConversationRef.current = true
    setTimeout(() => {
      stopConversationRef.current = false
    }, 1000)
  }

  const handleEditorOnChange = (value: string | undefined, ev: any) => {
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

    // Enter to send message
    editor.addCommand(monaco.KeyCode.Enter, () => {
      const currentContent = editor.getValue()
      if (!getUserRefValue()) {
        setShowLoginModal(true)
        return
      }
      handleSend(currentContent)
      editor.setValue('')
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
        defaultLanguage='shell'
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
