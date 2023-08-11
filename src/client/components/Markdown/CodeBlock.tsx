import { IconCheck, IconClipboard } from '@tabler/icons-react'
import { FC, memo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import * as cx from 'classnames'
import styles from './CodeBlock.module.scss'

interface Props {
  language: string
  value: string
}

export const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const [isCopied, setIsCopied] = useState<Boolean>(false)

  const copyToClipboard = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    })
  }

  return (
    <div className={cx('codeblock relative font-sans text-[13px]', styles.codeblock)}>
      <div className={cx('flex items-center justify-between py-1.5 px-4', styles.header)}>
        <span className={cx('text-xs lowercase', styles.language)}>{language}</span>

        <div className='flex items-center'>
          <button
            className={cx(
              'flex gap-1.5 items-center rounded bg-none p-1 text-xs',
              styles.copyButton,
            )}
            onClick={copyToClipboard}
          >
            {isCopied ? <IconCheck size={18} /> : <IconClipboard size={18} />}
            {isCopied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          margin: 0,
          backgroundColor: 'var(--vscode-editor-background)',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'
