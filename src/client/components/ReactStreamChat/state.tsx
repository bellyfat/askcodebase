import { ChatCompletionMessageParam } from 'openai/resources'
import { Conversation } from '~/client/types/chat'
import { OpenAIModelID } from '~/client/types/openai'

export interface ReactStreamChatInitialState {
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  currentMessage?: ChatCompletionMessageParam
  defaultModelId: OpenAIModelID
}

export const initialState: ReactStreamChatInitialState = {
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  defaultModelId: OpenAIModelID.GPT_3_5,
}
