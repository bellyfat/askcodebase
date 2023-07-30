import { Dispatch, createContext } from 'react'
import { ActionType } from '~/client/hooks/useCreateReducer'
import { Conversation } from '~/client/types/chat'
import { KeyValuePair } from '~/client/types/data'
import { ReactStreamChatInitialState } from './state'

export interface HomeContextProps {
  state: ReactStreamChatInitialState
  dispatch: Dispatch<ActionType<ReactStreamChatInitialState>>
  handleNewConversation: () => void
  handleSelectConversation: (conversation: Conversation) => void
  handleUpdateConversation: (conversation: Conversation, data: KeyValuePair) => void
}

export const ReactStreamChatContext = createContext<HomeContextProps>(undefined!)
