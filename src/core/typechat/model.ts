import fetch from 'node-fetch'
import { error, Result, success } from './result'
import * as vscode from 'vscode'
import { getUserJWT } from '~/utils'

/**
 * Represents a AI language model that can complete prompts. TypeChat uses an implementation of this
 * interface to communicate with an AI service that can translate natural language requests to JSON
 * instances according to a provided schema. The `createLanguageModel`, `createOpenAILanguageModel`,
 * and `createAzureOpenAILanguageModel` functions create instances of this interface.
 */
export interface TypeChatLanguageModel {
  /**
   * Optional property that specifies the maximum number of retry attempts (the default is 3).
   */
  retryMaxAttempts?: number
  /**
   * Optional property that specifies the delay before retrying in milliseconds (the default is 1000ms).
   */
  retryPauseMs?: number
  /**
   * Obtains a completion from the language model for the given prompt.
   * @param prompt The prompt string.
   */
  complete(prompt: string, onChunk: (chunk: string) => void): Promise<Result<string>>
}

/**
 * Creates a language model encapsulation of an OpenAI or Azure OpenAI REST API endpoint
 * chosen by environment variables.
 *
 * If an `OPENAI_API_KEY` environment variable exists, the `createOpenAILanguageModel` function
 * is used to create the instance. The `OPENAI_ENDPOINT` and `OPENAI_MODEL` environment variables
 * must also be defined or an exception will be thrown.
 *
 * If an `AZURE_OPENAI_API_KEY` environment variable exists, the `createAzureOpenAILanguageModel` function
 * is used to create the instance. The `AZURE_OPENAI_ENDPOINT` environment variable must also be defined
 * or an exception will be thrown.
 *
 * If none of these key variables are defined, an exception is thrown.
 * @returns An instance of `TypeChatLanguageModel`.
 */
export function createLanguageModel(context: vscode.ExtensionContext): TypeChatLanguageModel {
  const model: TypeChatLanguageModel = {
    complete,
  }
  return model

  async function complete(prompt: string, onChunk: (chunk: string) => void) {
    const params = {
      prompt,
      temperature: 0.2,
      n: 1,
      max_tokens: 15000
    }
    const resp = await fetch('https://askcodebase.com/api/instruct', {
      method: 'POST',
      headers: {
        Authorization: getUserJWT(context),
      },
      body: JSON.stringify(params),
    })
    const body = resp.body as unknown as ReadableStream<Uint8Array>
    if (resp.body && typeof body.getReader === 'function') {
      console.log("readable stream")
    } else {
      console.log("not readable stream")
    }

    const reader = (resp.body! as unknown as ReadableStream<Uint8Array>).getReader()
    const decoder = new TextDecoder()

    let done = false
    let isFirst = true
    let output = ''
    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)

      if (typeof onChunk === 'function') {
        onChunk(chunkValue)
      }

      output += chunkValue
      if (isFirst) {
        isFirst = false
        console.log(chunkValue)
      } else {
        console.log(output)
      }
    }
    return success(output)
  }
}

/**
 * Returns true of the given HTTP status code represents a transient error.
 */
function isTransientHttpError(code: number): boolean {
  switch (code) {
    case 429: // TooManyRequests
    case 500: // InternalServerError
    case 502: // BadGateway
    case 503: // ServiceUnavailable
    case 504: // GatewayTimeout
      return true
  }
  return false
}

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
