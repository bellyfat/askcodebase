import * as vscode from 'vscode'
import {
  createLanguageModel,
  createProgramTranslator,
  evaluateJsonProgram,
  getData,
} from './typechat'
import { schema } from './schema'

export async function askcodebase(context: vscode.ExtensionContext, input: string) {
  const model = createLanguageModel(context)
  const translator = createProgramTranslator(model, schema)

  const response = await translator.translate(input)
  if (!response.success) {
    console.log(response.message)
    return
  }
  const program = response.data
  console.log(getData(translator.validator.createModuleTextFromJson(program)))
  console.log('Running program:')
  const result = await evaluateJsonProgram(program, handleCall)
  console.log(`Result: ${typeof result === 'number' ? result : 'Error'}`)

  async function handleCall(func: string, args: any[]) {
    console.log(
      `${func}(${args
        .map(arg => (typeof arg === 'number' ? arg : JSON.stringify(arg, undefined, 2)))
        .join(', ')})`,
    )
  }
}
