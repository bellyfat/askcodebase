import { ChatCompletionMessageParam } from 'openai/resources'
import { OpenAIModel } from './openai'

export interface Conversation {
  id: string
  name: string
  messages: Array<ChatCompletionMessageParam>
  model: OpenAIModel
  prompt: string
}
