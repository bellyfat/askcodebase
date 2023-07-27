import styles from './InputBox.module.scss'
import * as cx from 'classnames'
import Editor, { Monaco, useMonaco } from '@monaco-editor/react'
import { useRef } from 'react'
import { Log } from '~/client/Log'

const placeholder = 'Send a command or a message'

export function InputBox() {
  const inputBox$ = useRef<HTMLDivElement | null>()
  const editor$ = useRef<any | null>(null)
  const monaco = useMonaco()

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
      container.style.height = `${contentHeight}px`
      editor.layout({ width: editor.getLayoutInfo().width, height: contentHeight })
    }
    layout()
    editor.onDidChangeModelContent(layout)

    // Disable Find Command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, function () {})

    // Enter to send message
    editor.addCommand(monaco.KeyCode.Enter, () => {
      const currentValue = editor.getValue()
      Log.userSend(currentValue)
      Log.assistantRespond('Hello, I am AskCodebase Assistant. How can I help you?')
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
