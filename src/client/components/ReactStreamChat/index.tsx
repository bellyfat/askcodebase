import { FC, useEffect, useRef } from 'react'
import { useCreateReducer } from '~/client/hooks/useCreateReducer'
import { cleanConversationHistory, cleanSelectedConversation } from '~/client/utils/app/clean'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '~/client/utils/app/const'
import {
  saveConversation,
  saveConversations,
  updateConversation
} from '~/client/utils/app/conversation'
import { Conversation, Message } from '~/client/types/chat'
import { KeyValuePair } from '~/client/types/data'
import { OpenAIModels } from '~/client/types/openai'
import { Chat, ChatInputComponent } from '~/client/components/Chat/Chat'
import { ReactStreamChatContext } from './context'
import { ReactStreamChatInitialState, initialState } from './state'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  CustomChatInput?: ChatInputComponent
  getResponseStream: (message: Message) => Promise<ReadableStream<Uint8Array>>
}

export const ReactStreamChat: FC<Props> = ({
  getResponseStream,
  CustomChatInput: customChatInput
}) => {
  const contextValue = useCreateReducer<ReactStreamChatInitialState>({
    initialState
  })

  const {
    state: { conversations, selectedConversation, defaultModelId },
    dispatch
  } = contextValue

  const stopConversationRef = useRef<boolean>(false)

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation
    })

    saveConversation(conversation)
  }

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1]

    const newConversation: Conversation = {
      id: uuidv4(),
      name: 'New Conversation',
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit
      },
      prompt: DEFAULT_SYSTEM_PROMPT
    }

    const updatedConversations = [...conversations, newConversation]

    dispatch({ field: 'selectedConversation', value: newConversation })
    dispatch({ field: 'conversations', value: updatedConversations })

    saveConversation(newConversation)
    saveConversations(updatedConversations)

    dispatch({ field: 'loading', value: false })
  }

  const handleUpdateConversation = (conversation: Conversation, data: KeyValuePair) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value
    }

    const { single, all } = updateConversation(updatedConversation, conversations)

    dispatch({ field: 'selectedConversation', value: single })
    dispatch({ field: 'conversations', value: all })
  }

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const conversationHistory = localStorage.getItem('conversationHistory')
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] = JSON.parse(conversationHistory)
      const cleanedConversationHistory = cleanConversationHistory(parsedConversationHistory)

      dispatch({ field: 'conversations', value: cleanedConversationHistory })
    }

    const selectedConversation = localStorage.getItem('selectedConversation')
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation = JSON.parse(selectedConversation)
      const cleanedSelectedConversation = cleanSelectedConversation(parsedSelectedConversation)

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation
      })
    } else {
      const lastConversation = conversations[conversations.length - 1]
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: 'New Conversation',
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT
        }
      })
    }
  }, [dispatch])

  return (
    <ReactStreamChatContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleSelectConversation,
        handleUpdateConversation
      }}
    >
      {selectedConversation && (
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
      )}
    </ReactStreamChatContext.Provider>
  )
}
