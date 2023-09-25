import {
  ChatCompletionFunctions,
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageFunctionCall,
  CreateChatCompletionRequestFunctionCall,
} from './OpenAI.types'

export class BaseAgent {
  private _functions: ChatCompletionFunctions[] = []
  private _messages: ChatCompletionRequestMessage[] = []
  private _function_call: CreateChatCompletionRequestFunctionCall = 'auto'
}
