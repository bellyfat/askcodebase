import askcodeStyles from './AskCode.module.scss'
import * as cx from 'classnames'
import { CodeBlock } from '../Markdown/CodeBlock'
import { useState } from 'react'
import { globalEventEmitter } from '~/client/VSCodeApi'

interface AskCmdProps {
  children: string
}

export const AskCmd: React.FC<AskCmdProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true)

  if (typeof children === 'string') {
    const match = children.match(/cmd":"([^"]+)/)
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
        <div className={askcodeStyles.action}>
          <div className='action-name'>{match ? match[1] : 'Thinking...'}</div>
          <div className='codicon codicon-chevron-down '></div>
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
