import { FC, useRef } from 'react'
import { useCreateReducer } from '~/client/hooks/useCreateReducer'
import { Message } from '~/client/types/chat'
import { Chat, ChatInputComponent } from '~/client/components/Chat/Chat'
import { ReactStreamChatContext } from './context'
import { ReactStreamChatInitialState, initialState } from './state'

interface Props {
  CustomChatInput?: ChatInputComponent
  getResponseStream: (message: Message) => Promise<ReadableStream<Uint8Array>>
}

export const ReactStreamChat: FC<Props> = ({
  getResponseStream,
  CustomChatInput: customChatInput,
}) => {
  const contextValue = useCreateReducer<ReactStreamChatInitialState>({
    initialState,
  })
  const stopConversationRef = useRef<boolean>(false)

  return (
    <ReactStreamChatContext.Provider value={{ ...contextValue }}>
      <main className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white dark`}>
        <div className='flex h-full w-full sm:pt-0'>
          <div className='flex flex-1'>
            <Chat
              getResponseStream={getResponseStream}
              CustomChatInput={customChatInput}
              stopConversationRef={stopConversationRef}
            />
          </div>
        </div>
      </main>
    </ReactStreamChatContext.Provider>
  )
}
