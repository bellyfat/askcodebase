import { OpenAIModel } from './openai'

export type Role = 'assistant' | 'user'

export interface Message {
  role: Role
  content: string
}

export interface Conversation {
  id: string
  name: string
  messages: Message[]
  model: OpenAIModel
  prompt: string
}
