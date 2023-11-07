import { FC, memo } from 'react'
import { CodeBlock } from '../Markdown/CodeBlock'
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown'
import rehypeMathjax from 'rehype-mathjax/browser'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import * as cx from 'classnames'
import styles from './ChatMessage.module.scss'
import { useAtom, useAtomValue } from 'jotai'
import { activeConversationAtom, messageIsStreamingAtom, userAtom } from '~/client/store'
import React = require('react')
import rehypeRaw from 'rehype-raw'
import { ChatCompletionMessageParam } from 'openai/resources'
import { renderContent } from './utils'

export function decodeHtmlEntities(html: string) {
  const e = document.createElement('textarea')
  e.innerHTML = html
  return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue
}

export interface Props {
  message: ChatCompletionMessageParam
  messageIndex: number
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      askcmd: { children: string; index: number }
    }
  }
}

export const ChatMessage: FC<Props> = memo(({ message, messageIndex }) => {
  const [user, setUserState] = useAtom(userAtom)
  const messageIsStreaming = useAtomValue(messageIsStreamingAtom)
  const activeConversation = useAtomValue(activeConversationAtom)

  const renderHead = (message: ChatCompletionMessageParam) => {
    return (
      <div
        className={styles.userAvatar}
        style={
          {
            '--avatar-url': `url(${
              message.role === 'user'
                ? user?.avatar
                : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiPjxnIG9wYWNpdHk9IjEiICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiPjxnIG9wYWNpdHk9IjEiICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiPjxyZWN0IGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMCkgIHJvdGF0ZSgwKSIgeD0iMCIgeT0iMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIHJ4PSI1MCIgLz48bWFzayBpZD0iYmctbWFzay0wIiBmaWxsPSJ3aGl0ZSI+PHVzZSB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiIHhsaW5rOmhyZWY9IiNwYXRoXzAiPjwvdXNlPjwvbWFzaz48ZyBtYXNrPSJ1cmwoI2JnLW1hc2stMCkiID48ZyBvcGFjaXR5PSIxIiAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzA5IDU5KSAgcm90YXRlKDApIj48bWFzayBpZD0iYmctbWFzay0xIiBmaWxsPSJ3aGl0ZSI+PHVzZSB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIDApICByb3RhdGUoMCkiIHhsaW5rOmhyZWY9IiNwYXRoXzEiPjwvdXNlPjwvbWFzaz48ZyBtYXNrPSJ1cmwoI2JnLW1hc2stMSkiID48cGF0aCBpZD0i6Lev5b6EIDEiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgb3BhY2l0eT0iMSIgZD0iTTIwLjA5NzEgNDIuNzAwMUwyMC4wOTcxIDkwLjA1MDFMNjYuNTE3MSAxMTQuNDNMNjYuNTE3MSA2NS43MTAxTDIwLjI2NzEgNDIuNjIwMUwyMC4wOTcxIDQyLjcwMDFaIj48L3BhdGg+PHBhdGggaWQ9IuaLvOWQiOWbvuW9oiIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSJ1cmwoI2xpbmVhcl8wKSIgb3BhY2l0eT0iMSIgZD0iTTExOC43ODYsMzQuNzI1NGMxLjQzLDAuOCAyLjU4LDIuMDEgMy4zLDMuNDdjMC40NywxLjAyIDAuNywyLjEzIDAuNjcsMy4yNnY1MC4wOWMtMC4wMSwyLjg4IC0xLjYyLDUuNTIgLTQuMTgsNi44NWwtNDguNjcwMSwyNS43NTk2Yy0wLjkzLDAuNDUgLTEuOTQsMC43MiAtMi45NywwLjc5aC0wLjU4Yy0xLjIyLC0wLjA4IC0yLjQsLTAuNDIgLTMuNDcsLTFsLTQ4LjY4LC0yNS42Mjk2Yy0yLjU0LC0xLjMxIC00LjE0LC0zLjkxIC00LjE3LC02Ljc3di01MC4wOWMwLjAxLC0xLjIyIDAuMzIsLTIuNDEgMC45MiwtMy40N2MwLjM0LC0wLjYgMC43NiwtMS4xNCAxLjI1LC0xLjYzYzAuNTQsLTAuNzIgMS4yMywtMS4zMyAyLC0xLjc5bDQ4LjcyLC0yNS42Mzk5OGMyLjIzLC0xLjE2IDQuODgsLTEuMTYgNy4xLDB6TTIwLjAxNTksOTAuMDQ1NGw0Ni40NiwyNC40MTk2di00OC4wODk2bC00Ni40NiwtMjIuODF6Ij48L3BhdGg+PC9nPjwvZz48cGF0aCBpZD0iQSIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSJ1cmwoI2xpbmVhcl8xKSIgb3BhY2l0eT0iMSIgZD0iTTIzMC4xNTksMTI1aDM3LjljNC4wNywwIDcuNzQsMi40NyA5LjI3LDYuMjVsOTMuMSwyMzBjMi42Niw2LjU3IC0yLjE4LDEzLjc1IC05LjI3LDEzLjc1aC0zOS41OGMtNC4xNiwwIC03Ljg4LC0yLjU4IC05LjM1LC02LjQ3bC0xNC4yLC0zNy42MWMtMS40NywtMy44OSAtNS4yLC02LjQ3IC05LjM2LC02LjQ3aC04MC40NmMtNC4yMSwwIC03Ljk2LDIuNjMgLTkuNCw2LjU4bC0xMy42MSwzNy4zOWMtMS40NCwzLjk1IC01LjE5LDYuNTggLTkuNCw2LjU4aC0zNi4yM2MtNy4wNSwwIC0xMS44OSwtNy4xIC05LjMxLC0xMy42Nmw5MC42LC0yMzBjMS41LC0zLjgyIDUuMTksLTYuMzQgOS4zLC02LjM0ek0yMzguMzY5LDIyMy4wMmwtMTQuMjMsMzkuMThjLTIuMzYsNi41MiAyLjQ2LDEzLjQgOS4zOSwxMy40MWgyOS4xNWM3LDAgMTEuODQsLTcuMDEgOS4zNSwtMTMuNTVsLTE0LjkyLC0zOS4xOWMtMy4zLC04LjY1IC0xNS41OCwtOC41NSAtMTguNzQsMC4xNXoiPjwvcGF0aD48L2c+PC9nPjwvZz48ZGVmcz48cmVjdCBpZD0icGF0aF8wIiB4PSIwIiB5PSIwIiB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgLz48cmVjdCBpZD0icGF0aF8xIiB4PSIwIiB5PSIwIiB3aWR0aD0iMTMzIiBoZWlnaHQ9IjEzMyIgLz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhcl8wIiB4MT0iMCUiIHkxPSI1MCUiIHgyPSIxMDAlIiB5Mj0iNTAlIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMTA5RUU5IiBzdG9wLW9wYWNpdHk9IjEiIC8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDc2NkVBIiBzdG9wLW9wYWNpdHk9IjEiIC8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhcl8xIiB4MT0iMCUiIHkxPSI1MCUiIHgyPSIxMDAlIiB5Mj0iNTAlIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNDc2NkVBIiBzdG9wLW9wYWNpdHk9IjEiIC8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMTA5RUU5IiBzdG9wLW9wYWNpdHk9IjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+'
            })`,
          } as React.CSSProperties
        }
      ></div>
    )
  }

  const renderMessage = (message: ChatCompletionMessageParam) => {
    switch (message.role) {
      case 'tool': {
        switch (message.tool_call_id) {
          case 'error': {
            return <div className={styles.errorMessage}>{message.content}</div>
          }
        }
        return null
      }
      case 'system':
      case 'assistant': {
        return (
          <div className='flex flex-row grow'>
            <MemoizedReactMarkdown
              className={cx('dark:prose-invert flex-1', styles.messageContent)}
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeMathjax, rehypeRaw]}
              skipHtml={true}
              components={{
                p({ children }) {
                  if (typeof children !== 'string') {
                    return children as React.ReactElement
                  }
                  return <p>{children}</p>
                },
                code({ node, className, children, ...props }) {
                  if (Array.isArray(children) && children.length) {
                    if (children[0] == '▍') {
                      return <span className='animate-pulse cursor-default mt-1'>▍</span>
                    }

                    children[0] = (children[0] as string).replace('`▍`', '▍')
                  }

                  const match = /language-(\w+)/.exec(className || '')

                  return match ? (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                table({ children }) {
                  return (
                    <table className='border-collapse border border-black px-3 py-1 dark:border-white'>
                      {children}
                    </table>
                  )
                },
                th({ children }) {
                  return (
                    <th className='break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white'>
                      {children}
                    </th>
                  )
                },
                li({ children }) {
                  return <li className='my-2'>{children}</li>
                },
                td({ children }) {
                  return (
                    <td className='break-words border border-black px-3 py-1 dark:border-white'>
                      {children}
                    </td>
                  )
                },
              }}
            >
              {`${message.content}${
                messageIsStreaming && messageIndex == (activeConversation?.messages.length ?? 0) - 1
                  ? '`▍`'
                  : ''
              }`}
            </MemoizedReactMarkdown>
          </div>
        )
      }
      case 'user': {
        return (
          <div className='flex w-full'>
            <div
              className={cx(
                'whitespace-pre-wrap dark:prose-invert flex-1 pr-1',
                styles.messageContent,
              )}
            >
              {renderContent(message.content)}
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div
      className={cx(
        'group px-4',
        styles.ChatMessage,
        message.role === 'user' ? styles.user : styles.assistant,
      )}
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className={cx('relative m-auto flex text-base', styles.ChatMessageInner)}>
        <div className='min-w-[40px] text-right font-bold'>{renderHead(message)}</div>

        <div className='mt-[-2px] w-full dark:prose-invert flex items-center'>
          {renderMessage(message)}
        </div>
      </div>
    </div>
  )
})
ChatMessage.displayName = 'ChatMessage'
