import { Conversation, Message } from '~/client/types/chat'
import { OpenAIModelID } from '~/client/types/openai'

export interface ReactStreamChatInitialState {
  messageIsStreaming: boolean
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  currentMessage: Message | undefined
  defaultModelId: OpenAIModelID
}

export const initialState: ReactStreamChatInitialState = {
  messageIsStreaming: false,
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  defaultModelId: OpenAIModelID.GPT_3_5,
}
