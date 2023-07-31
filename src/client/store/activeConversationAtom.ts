import { atomWithStorage } from 'jotai/utils'
import { Conversation } from '../types/chat'
import { v4 as uuidv4 } from 'uuid'
import { OpenAIModelID, OpenAIModels } from '../types/openai'
import { DEFAULT_SYSTEM_PROMPT } from '../utils/const'

const defaultModelId = OpenAIModelID.GPT_3_5

export const activeConversationAtom = atomWithStorage<Conversation>('activeConversation', {
  id: uuidv4(),
  name: 'New Conversation',
  messages: [],
  model: {
    id: OpenAIModels[defaultModelId].id,
    name: OpenAIModels[defaultModelId].name,
    maxLength: OpenAIModels[defaultModelId].maxLength,
    tokenLimit: OpenAIModels[defaultModelId].tokenLimit
  },
  prompt: DEFAULT_SYSTEM_PROMPT
})

activeConversationAtom.debugLabel = 'activeConversationAtom'
