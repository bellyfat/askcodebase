import { Deferred, deferred } from '~/common/Deferred'
import { Process } from './Process'
import { EventEmitter } from 'events'
import { TraceID } from '~/common/traceTypes'
import { TextDocument } from './components/AskCodebasePanel/prompt'

interface MessagePromise {
  resolve: (value: unknown) => void
  reject: (reason?: any) => void
  timeoutId: NodeJS.Timeout
}

declare global {
  function acquireVsCodeApi(): {
    postMessage(message: any): void
  }
}

export const globalEventEmitter = new EventEmitter()

class VSCodeApiClass {
  private _vscode = acquireVsCodeApi()
  private _messageId: number = 0
  private _messagePromises: Record<number, MessagePromise> = {}
  private _pendingProcesses: Record<number, Process> = {}

  private _onDidChangeActiveColorThemeCallback = () => {}

  public setup() {
    window.addEventListener('message', event => {
      const message = event.data

      // Process events
      if (message && typeof message.event === 'string') {
        switch (message.event) {
          case 'onDidChangeVisibility': {
            const visible = message.data
            globalEventEmitter.emit('onDidChangeVisibility', visible)
            break
          }
          case 'onDidChangeActiveColorTheme': {
            this._onDidChangeActiveColorThemeCallback()
            globalEventEmitter.emit('onDidChangeActiveColorTheme')
            break
          }
          case 'onProcessEvent': {
            const [pid, event, data] = message.data
            const process = this._pendingProcesses[pid]
            if (process != null) {
              process.dispatchEvent(event, data)
            }
            break
          }
        }
      }

      // The API responses
      if (message && typeof message.responseId === 'number') {
        const promise = this._messagePromises[message.responseId]

        if (promise) {
          if (message.error) {
            promise.reject(message.error)
          } else {
            promise.resolve(message.data)
          }

          clearTimeout(promise.timeoutId)
          delete this._messagePromises[message.responseId]
        }
      }
    })
  }

  public async spawn(command: string): Promise<Process> {
    const resp = await this._postMessage('spawn', { command })
    const { pid } = resp

    if (typeof pid === 'number') {
      const process = new Process(pid)
      this._pendingProcesses[pid] = process

      return process
    } else {
      throw new Error(`Run command ${command} failed}.`)
    }
  }

  public async trace(payload: { id: TraceID; blobs?: string[]; doubles?: number[] }) {
    return this._postMessage('trace', payload)
  }

  public async setGlobalState(key: string, value: any): Promise<void> {
    return this._postMessage('setGlobalState', { key, value })
  }

  public async getSystemInfo(): Promise<{
    vscodeVersion: string
    platform: string
    arch: string
    deviceID: string
  }> {
    return this._postMessage('getSystemInfo')
  }

  public async executeEditorAction(payload: Record<string, string | number | boolean>) {
    return this._postMessage('executeEditorAction', { payload })
  }

  public async executeCommand<T = any>(command: string, ...args: any[]): Promise<T> {
    return this._postMessage('executeCommand', { command, args })
  }

  public async openLink(url: string) {
    return this._postMessage('openLink', { url })
  }

  public async getFileTree(): Promise<string> {
    return await this._postMessage('getFileTree')
  }

  public async getActiveTextDocument(): Promise<TextDocument | null> {
    return await this._postMessage('getActiveTextDocument')
  }

  public async hidePanel() {
    return this._postMessage('hidePanel')
  }

  public async showInformationMessage(message: string) {
    return this._postMessage('showInformationMessage', { message })
  }

  public async showErrorMessage(message: string) {
    return this._postMessage('showErrorMessage', { message })
  }

  public onColorThemeChanged(callback: () => void) {
    this._onDidChangeActiveColorThemeCallback = callback
  }

  private _postMessage(command: string, data?: unknown, timeout: number = 15 * 1000): Promise<any> {
    const id = this._messageId++
    const deferredValue: Deferred<unknown> = deferred()

    const timeoutId = setTimeout(() => {
      deferredValue.reject(new Error(`Message ${id} timeout`))
      delete this._messagePromises[id]
    }, timeout)

    this._messagePromises[id] = { ...deferredValue, timeoutId }

    this._vscode.postMessage({ id, command, data })
    return deferredValue
  }
}

export const VSCodeApi = new VSCodeApiClass()
