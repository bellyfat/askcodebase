import { Conversation } from '~/client/types/chat'
import { OpenAIModelID, OpenAIModels } from '~/client/types/openai'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from './const'

export const cleanSelectedConversation = (conversation: Conversation) => {
  let updatedConversation = conversation

  if (!updatedConversation.model) {
    updatedConversation = {
      ...updatedConversation,
      model: updatedConversation.model || OpenAIModels[OpenAIModelID.GPT_3_5]
    }
  }

  if (!updatedConversation.prompt) {
    updatedConversation = {
      ...updatedConversation,
      prompt: updatedConversation.prompt || DEFAULT_SYSTEM_PROMPT
    }
  }

  if (!updatedConversation.messages) {
    updatedConversation = {
      ...updatedConversation,
      messages: updatedConversation.messages || []
    }
  }

  return updatedConversation
}

export const cleanConversationHistory = (history: any[]): Conversation[] => {
  if (!Array.isArray(history)) {
    console.warn('history is not an array. Returning an empty array.')
    return []
  }

  return history.reduce((acc: any[], conversation) => {
    try {
      if (!conversation.model) {
        conversation.model = OpenAIModels[OpenAIModelID.GPT_3_5]
      }

      if (!conversation.prompt) {
        conversation.prompt = DEFAULT_SYSTEM_PROMPT
      }

      if (!conversation.messages) {
        conversation.messages = []
      }

      acc.push(conversation)
      return acc
    } catch (error) {
      console.warn(`error while cleaning conversations' history. Removing culprit`, error)
    }
    return acc
  }, [])
}
