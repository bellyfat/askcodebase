import { MutableRefObject, memo, useContext, useEffect, useRef, useState } from 'react'
import { throttle } from '~/client/utils/data/throttle'
import { Conversation, Message, Role } from '~/client/types/chat'
import { ReactStreamChatContext } from '~/client/components/ReactStreamChat/context'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { WelcomeScreen } from '../WelcomeScreen'
import { useSetAtom } from 'jotai'
import { activeConversationAtom } from '~/client/store'
import { MonacoInputBox } from '../MonacoInputBox'
import { useAtomRefValue } from '~/client/hooks'
import { VSCodeApi, globalEventEmitter } from '~/client/VSCodeApi'
import { ProcessEvent } from '~/client/Process'
import { TraceID } from '~/common/traceTypes'
import { randomString } from '~/common/randomString'

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

const askcmds = new Set()

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
    role: Role = 'assistant',
    text: string,
  ) => {
    const updatedMessages: Message[] = [
      ...updatedConversation.messages,
      {
        role,
        content: text,
      },
    ]
    updatedConversation = {
      ...updatedConversation,
      messages: updatedMessages,
    }
    setActiveConversation(updatedConversation)
    return updatedConversation
  }

  const handleSend = async (message: Message, deleteCount = 0) => {
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
      updatedConversation = pushMessageToConversation(updatedConversation, 'user', message.content)
    }

    pushMessageToConversation(updatedConversation, 'assistant', 'Thinking...')

    // fixme: this is a hack to make sure the scroll down happens after the message is rendered
    setTimeout(handleScrollDown, 500)
    dispatch({ field: 'messageIsStreaming', value: true })

    let stream
    try {
      VSCodeApi.trace({ id: TraceID.Client_OnChatRequest })
      stream = await getResponseStream(message)
    } catch (e) {
      stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          const details = (e as Error)?.message as string
          const output =
            `Something went wrong. Error: "${details}". ` +
            'Please fire an issue on our [GitHub](https://github.com/jipitiai/askcodebase-community/issues/new). contact support@askcodebase.com if you need help.'
          const error = encoder.encode(output)
          controller.enqueue(error)
          controller.close()
        },
        pull(controller) {},
        cancel(reason) {},
      })
    }
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    let done = false
    let isFirst = true
    let text = ''
    let lastStreamingCode = ''
    let chunkId = 0
    const respSessionId = randomString()

    while (!done) {
      if (stopConversationRef.current === true) {
        done = true
        break
      }
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      text += chunkValue

      // debug raw response if needed
      // console.log(text)

      const askcmdRegexp = /<askcmd[^>]*>(.+)<\/askcmd>/g
      const askcodeStreamRegexp = /<div class="askcode[^>]*>([^<]+)/g
      const askcodeRegexp = /<div class="askcode[^>]*>([^<]+)<\/div>/g

      const commandMatch = text.match(askcmdRegexp)
      if (commandMatch != null) {
        let json = commandMatch[0].replace(askcmdRegexp, '$1')
        let command = {} as { id: string }
        try {
          json = json.replace(/```[^\n]./g, '')
          command = JSON.parse(json)
        } catch (e) {}
        const payload = Object.assign(command, { respSessionId })
        const commandUID = `${respSessionId}_${command.id}`
        if (!askcmds.has(commandUID)) {
          askcmds.add(commandUID)
          // console.log('executeCommand', payload)
          VSCodeApi.executeEditorAction(payload)
        }
      }
      const decodeHtmlEntities = (input: string) => {
        const e = document.createElement('textarea')
        e.innerHTML = input
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue
      }
      const codeStreamMatch = text.match(askcodeStreamRegexp)
      if (codeStreamMatch != null) {
        const codeStream = codeStreamMatch[0].replace(askcodeStreamRegexp, '$1')
        const stream = codeStream.replace(/```[^\n]./g, '')
        const code = decodeHtmlEntities(stream)!
        const chunk = code.replace(lastStreamingCode, '')
        VSCodeApi.executeEditorAction({
          cmd: 'codeStreaming',
          respSessionId,
          code: chunk,
          id: chunkId++,
          firstChunk: lastStreamingCode === '',
        })
        lastStreamingCode = code
      }
      // console.log(text)
      const codeMatch = text.match(askcodeRegexp)
      if (codeMatch != null) {
        VSCodeApi.executeEditorAction({
          cmd: 'codeStreamingEnd',
          respSessionId,
        })
      }

      if (isFirst) {
        isFirst = false
        const updatedMessages: Message[] = [
          ...updatedConversation.messages,
          { role: 'assistant', content: chunkValue },
        ]
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages,
        }
        setActiveConversation(updatedConversation)
      } else {
        const updatedMessages: Message[] = updatedConversation.messages.map((message, index) => {
          if (index === updatedConversation.messages.length - 1) {
            return {
              ...message,
              content: text,
            }
          }
          return message
        })
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages,
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
  const handleBuiltinCommands = (command: string) => {
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
