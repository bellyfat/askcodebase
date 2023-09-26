import * as vscode from 'vscode'
import { createJsonTranslator, createLanguageModel } from './typechat'
import { Actions, schema } from './schema'

export async function askcodebase(context: vscode.ExtensionContext, input: string) {
  const model = createLanguageModel(context)
  const translator = createJsonTranslator<Actions>(model, schema, 'Actions')

  const response = await translator.translate(input, (data: string) => {
    console.log('[chunk]', data)
  })
  if (!response.success) {
    console.log(response.message)
    return
  }
  const cart = response.data
  console.log(JSON.stringify(cart, undefined, 2))
}
