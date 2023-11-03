import askcodeStyles from './AskCode.module.scss'
import * as cx from 'classnames'
import { CodeBlock } from '../Markdown/CodeBlock'
import { FC, memo, useEffect, useRef, useState } from 'react'
import { globalEventEmitter } from '~/client/VSCodeApi'

interface AskCmdProps {
  children: string
}

const AskCmd: React.FC<AskCmdProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true)

  if (typeof children === 'string') {
    const match = children.match(/cmd":\s*"([^"]+)/)
    return (
      <div
        className={cx(
          'askcmd flex flex-col',
          askcodeStyles.askcmd,
          collapsed ? askcodeStyles.collapsed : null,
        )}
        onClick={() => {
          setCollapsed(!collapsed)
          if (collapsed) {
            setTimeout(() => {
              globalEventEmitter.emit('scrollToBottom')
            }, 300)
          }
        }}
      >
        <div className={cx(askcodeStyles.action)}>
          <div className='action-name'>{match ? match[1] : 'Thinking...'}</div>
          {collapsed ? (
            <div className='codicon codicon-chevron-down '></div>
          ) : (
            <div className='codicon codicon-chevron-up '></div>
          )}
        </div>
        <CodeBlock
          key={Math.random()}
          language='json'
          value={children}
          className={askcodeStyles.askcode}
        />
      </div>
    )
  }
  return children
}

export const MemoizedAskCmd: FC<AskCmdProps> = memo(
  AskCmd,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
)
