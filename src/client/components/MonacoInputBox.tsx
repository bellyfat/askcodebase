import styles from './MonacoInputBox.module.scss'
import * as cx from 'classnames'
import Editor, { Monaco, useMonaco } from '@monaco-editor/react'
import { FC, useContext, useEffect, useRef } from 'react'
import { ChatInputProps } from './Chat/Chat'
import { ReactStreamChatContext } from './ReactStreamChat/context'

const placeholder = 'Type a command or a message'

export const MonacoInputBox: FC<ChatInputProps> = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton
}) => {
  const {
    state: { selectedConversation, messageIsStreaming }
  } = useContext(ReactStreamChatContext)
  const inputBox$ = useRef<HTMLDivElement | null>()
  const editor$ = useRef<any | null>(null)
  const monaco = useMonaco()

  const handleSend = (content: string) => {
    onScrollDownClick()

    if (messageIsStreaming) {
      return
    }

    if (!content) {
      return
    }

    onSend({ role: 'user', content })

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur()
    }
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
      const PROMPT_WIDTH = 40 // TODO hard coded, need a better solution
      container.style.height = `${contentHeight}px`
      editor.layout({ width: innerWidth - PROMPT_WIDTH, height: contentHeight })
    }
    layout()

    window.addEventListener('resize', layout)
    editor.onDidChangeModelContent(layout)

    // Disable Find Command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, function () {})

    // Enter to send message
    editor.addCommand(monaco.KeyCode.Enter, () => {
      const currentContent = editor.getValue()
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
        'editor.background': '#00000000'
      }
    })
    let placeholder = document.querySelector('.monaco-placeholder') as HTMLElement | null
    placeholder!.style.display = 'block'

    monaco.editor.setTheme('ask-codebase')
    editor.focus()
  }

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
            enabled: false
          },
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden'
          },
          automaticLayout: true,
          renderLineHighlight: 'none',
          scrollBeyondLastLine: false,
          scrollBeyondLastColumn: 0,
          wordWrap: 'on',
          wrappingStrategy: 'advanced'
        }}
        onChange={handleEditorOnChange}
        onMount={handleEditorOnMount}
        loading={null}
      />
      <div className={cx('monaco-placeholder', styles.placeholder)}>{placeholder}</div>
    </div>
  )
}
