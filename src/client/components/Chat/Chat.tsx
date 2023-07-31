import { MutableRefObject, memo, useContext, useEffect, useRef, useState } from 'react'
import { throttle } from '~/client/utils/data/throttle'
import { Conversation, Message } from '~/client/types/chat'
import { ReactStreamChatContext } from '~/client/components/ReactStreamChat/context'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { WelcomeScreen } from '../WelcomeScreen'
import { useSetAtom } from 'jotai'
import { activeConversationAtom } from '~/client/store'
import { MonacoInputBox } from '../MonacoInputBox'
import { useAtomRefValue } from '~/client/hooks'

export interface ChatInputProps {
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  onSend: (message: Message) => void
  onScrollDownClick: () => void
  onRegenerate: () => void
  showScrollDownButton: boolean
}
export type ChatInputComponent = (props: ChatInputProps) => React.ReactNode

interface Props {
  stopConversationRef: MutableRefObject<boolean>
  getResponseStream: (message: Message) => Promise<ReadableStream<Uint8Array>>
  CustomChatInput?: ChatInputComponent
}

export const Chat = memo(({ stopConversationRef, CustomChatInput, getResponseStream }: Props) => {
  const { dispatch } = useContext(ReactStreamChatContext)
  const setActiveConversation = useSetAtom(activeConversationAtom)
  const [activeConversation, getActiveConversation] = useAtomRefValue(activeConversationAtom)

  const [currentMessage, setCurrentMessage] = useState<Message>()
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
  const [showScrollDownButton, setShowScrollDownButton] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const setConversationLastMessage = (updatedConversation: Conversation, text: string) => {
    const updatedMessages: Message[] = [
      ...updatedConversation.messages,
      {
        role: 'assistant',
        content: text
      }
    ]
    updatedConversation = {
      ...updatedConversation,
      messages: updatedMessages
    }
    setActiveConversation(updatedConversation)
  }

  const handleSend = async (message: Message, deleteCount = 0) => {
    let updatedConversation: Conversation
    const conversation = getActiveConversation()
    if (deleteCount > 0) {
      const updatedMessages = [...conversation.messages]
      for (let i = 0; i < deleteCount; i++) {
        updatedMessages.pop()
      }
      updatedConversation = {
        ...conversation,
        messages: [...updatedMessages, message]
      }
    } else {
      updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, message]
      }
    }
    setActiveConversation(activeConversation)
    setConversationLastMessage(updatedConversation, 'Thinking...')
    dispatch({ field: 'loading', value: true })
    dispatch({ field: 'messageIsStreaming', value: true })
    if (updatedConversation.messages.length === 1) {
      const { content } = message
      const customName = content.length > 30 ? content.substring(0, 30) + '...' : content
      updatedConversation = {
        ...updatedConversation,
        name: customName
      }
    }
    dispatch({ field: 'loading', value: false })
    let stream
    try {
      stream = await getResponseStream(message)
    } catch (e) {
      stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          const details = (e as Error)?.message as string
          const output =
            `Something went wrong. Error: "${details}". ` +
            'Please contact support@askcodebase.com if you need help.'
          const error = encoder.encode(output)
          controller.enqueue(error)
          controller.close()
        },
        pull(controller) {},
        cancel(reason) {}
      })
    }
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    let done = false
    let isFirst = true
    let text = ''
    while (!done) {
      if (stopConversationRef.current === true) {
        done = true
        break
      }
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      text += chunkValue
      if (isFirst) {
        isFirst = false
        const updatedMessages: Message[] = [
          ...updatedConversation.messages,
          { role: 'assistant', content: chunkValue }
        ]
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages
        }
        setActiveConversation(updatedConversation)
      } else {
        const updatedMessages: Message[] = updatedConversation.messages.map((message, index) => {
          if (index === updatedConversation.messages.length - 1) {
            return {
              ...message,
              content: text
            }
          }
          return message
        })
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages
        }
        setActiveConversation(updatedConversation)
      }
    }
    dispatch({ field: 'messageIsStreaming', value: false })
  }

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const bottomTolerance = 30

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false)
        setShowScrollDownButton(true)
      } else {
        setAutoScrollEnabled(true)
        setShowScrollDownButton(false)
      }
    }
  }

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true)
    }
  }
  const throttledScrollDown = throttle(scrollDown, 250)

  useEffect(() => {
    throttledScrollDown()
    setCurrentMessage(activeConversation.messages[activeConversation.messages.length - 2])
  }, [activeConversation, throttledScrollDown])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting)
        if (entry.isIntersecting) {
          textareaRef.current?.focus()
        }
      },
      {
        root: null,
        threshold: 0.5
      }
    )
    const messagesEndElement = messagesEndRef.current
    if (messagesEndElement) {
      observer.observe(messagesEndElement)
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement)
      }
    }
  }, [messagesEndRef])

  const { messages } = activeConversation!

  const renderMainContent = () => {
    if (messages.length === 0) {
      return <WelcomeScreen />
    }
    return (
      <div className='max-h-full overflow-x-hidden' ref={chatContainerRef} onScroll={handleScroll}>
        {messages.map((message, index) => (
          <MemoizedChatMessage key={index} message={message} messageIndex={index} />
        ))}
        <div className='h-[0px] bg-white dark:bg-[#343541]' ref={messagesEndRef} />
      </div>
    )
  }

  return (
    <div className='relative flex-1 overflow-hidden flex flex-col justify-end'>
      {renderMainContent()}
      <MonacoInputBox
        stopConversationRef={stopConversationRef}
        textareaRef={textareaRef}
        onSend={message => {
          setCurrentMessage(message)
          handleSend(message, 0)
        }}
        onScrollDownClick={handleScrollDown}
        onRegenerate={throttle(() => {
          if (currentMessage) {
            handleSend(currentMessage, 2)
          }
        }, 1000)}
        showScrollDownButton={showScrollDownButton}
      />
    </div>
  )
})
Chat.displayName = 'Chat'
