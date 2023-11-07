import { MutableRefObject, memo, useContext, useEffect, useRef, useState } from 'react'
import { throttle } from '~/client/utils/data/throttle'
import { Conversation } from '~/client/types/chat'
import { ReactStreamChatContext } from '~/client/components/ReactStreamChat/context'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { WelcomeScreen } from '../WelcomeScreen'
import { useSetAtom } from 'jotai'
import { activeConversationAtom, messageIsStreamingAtom } from '~/client/store'
import { MonacoInputBox } from '../MonacoInputBox'
import { useAtomRefValue } from '~/client/hooks'
import { VSCodeApi, globalEventEmitter } from '~/client/VSCodeApi'
import { TraceID } from '~/common/traceTypes'
import OpenAI from 'openai'
import {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources'

let baseURL = 'https://api.askcodebase.com/openai'
if (process.env.NODE_ENV === 'development') {
  baseURL = 'http://0.0.0.0:8787/openai'
}

const openai = new OpenAI({
  apiKey: Math.random().toString(),
  baseURL,
  dangerouslyAllowBrowser: true,
  fetch,
})

export interface ChatInputProps {
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  onSend: (message: ChatCompletionMessageParam) => void
  onScrollDownClick: () => void
  onRegenerate: () => void
  showScrollDownButton: boolean
}
export type ChatInputComponent = (props: ChatInputProps) => React.ReactNode

interface Props {
  stopConversationRef: MutableRefObject<boolean>
  CustomChatInput?: ChatInputComponent
}

function updateLastMessage(conversation: Conversation, update: ChatCompletionMessageParam) {
  const updatedMessages = conversation.messages.map((message, index) => {
    if (index === conversation.messages.length - 1) {
      return update
    }
    return message
  })
  return {
    ...conversation,
    messages: updatedMessages,
  }
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { dispatch } = useContext(ReactStreamChatContext)
  const setActiveConversation = useSetAtom(activeConversationAtom)
  const [activeConversation, getActiveConversation] = useAtomRefValue(activeConversationAtom)
  const setMessageIsStreaming = useSetAtom(messageIsStreamingAtom)

  const [currentMessage, setCurrentMessage] = useState<ChatCompletionMessageParam>()
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
  const [showScrollDownButton, setShowScrollDownButton] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // handle scrollToBottom event
  useEffect(() => {
    globalEventEmitter.on('scrollToBottom', () => {
      handleScrollDown()
    })
    return () => {
      globalEventEmitter.off('scrollToBottom', handleScrollDown)
    }
  }, [])

  const pushMessageToConversation = (
    updatedConversation: Conversation,
    message: ChatCompletionMessageParam,
  ) => {
    const updatedMessages: ChatCompletionMessageParam[] = [...updatedConversation.messages, message]
    updatedConversation = {
      ...updatedConversation,
      messages: updatedMessages,
    }
    setActiveConversation(updatedConversation)
    return updatedConversation
  }

  const handleSend = async (message: ChatCompletionMessageParam, deleteCount = 0) => {
    let updatedConversation = getActiveConversation()
    if (deleteCount > 0) {
      const updatedMessages = [...updatedConversation.messages]
      for (let i = 0; i < deleteCount; i++) {
        updatedMessages.pop()
      }
      updatedConversation = {
        ...updatedConversation,
        messages: [...updatedMessages, message],
      }
    } else {
      updatedConversation = pushMessageToConversation(updatedConversation, {
        role: 'user',
        content: message.content,
      })
    }

    // Setup messages
    const messages = [
      {
        role: 'system',
        content:
          'You are a helpful weather assistant AI to help users get latest weather information. ',
      },
      ...updatedConversation.messages,
    ].filter(message => {
      if (
        message.role === 'tool' &&
        (message as ChatCompletionToolMessageParam).tool_call_id === 'error'
      ) {
        return false
      }
      return true
    }) as ChatCompletionMessageParam[]

    updatedConversation = pushMessageToConversation(updatedConversation, {
      role: 'assistant',
      content: 'Thinking...',
    })

    // NOTE: this is a hack to make sure the scroll down
    // happens after the message is rendered
    setTimeout(handleScrollDown, 500)

    VSCodeApi.trace({ id: TraceID.Client_OnChatRequest })

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages,
        functions: [
          {
            name: 'get_weather',
            description: 'Determine weather in my location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state e.g. San Francisco, CA',
                },
                unit: {
                  type: 'string',
                  enum: ['c', 'f'],
                },
              },
              required: ['location'],
            },
          },
        ],
        stream: true,
      })

      let content = ''
      setMessageIsStreaming(true)
      for await (const chunk of completion) {
        const delta = chunk.choices[0].delta
        if (delta.content) {
          content += delta.content
        }
        updatedConversation = updateLastMessage(updatedConversation, { role: 'assistant', content })
        setActiveConversation(updatedConversation)
      }
      setMessageIsStreaming(false)
    } catch (error) {
      updatedConversation = updateLastMessage(updatedConversation, {
        role: 'tool',
        content: 'Network error. Please try again.',
        tool_call_id: 'error',
      })
      setActiveConversation(updatedConversation)
      return
    }
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
      behavior: 'smooth',
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
        threshold: 0.5,
      },
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
  const handleBuiltinCommands = (command: string | ChatCompletionContentPart[] | null) => {
    if (command === 'changelog') {
      VSCodeApi.executeCommand('askcodebase.changelog')
      VSCodeApi.trace({ id: TraceID.Client_CommandChangelog })
      return true
    }
    if (command === 'help') {
      VSCodeApi.executeCommand('askcodebase.openWalkthrough')
      VSCodeApi.trace({ id: TraceID.Client_CommandHelp })
      return true
    }
    if (command === 'clear') {
      setActiveConversation({
        ...getActiveConversation(),
        messages: [],
      })
      VSCodeApi.trace({ id: TraceID.Client_CommandClear })
      return true
    }
    return false
  }

  return (
    <div className='relative flex-1 overflow-hidden flex flex-col justify-end'>
      {renderMainContent()}
      <MonacoInputBox
        stopConversationRef={stopConversationRef}
        textareaRef={textareaRef}
        onSend={message => {
          if (handleBuiltinCommands(message.content)) {
            return
          }
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
