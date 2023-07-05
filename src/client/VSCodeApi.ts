import { Deferred, deferred } from '~/common/Deferred'

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

class VSCodeApiClass {
  private vscode: any
  private messageId: number
  private messagePromises: Record<number, MessagePromise>

  private _onDidChangeActiveColorThemeCallback = () => {}

  constructor() {
    this.vscode = acquireVsCodeApi()
    this.messageId = 0
    this.messagePromises = {}
  }

  public setup() {
    window.addEventListener('message', event => {
      const message = event.data

      // Events
      if (message && typeof message.event === 'string') {
        switch (message.event) {
          case 'onDidChangeActiveColorTheme':
            this._onDidChangeActiveColorThemeCallback()
            break
        }
      }

      if (message && typeof message.responseId === 'number') {
        const promise = this.messagePromises[message.responseId]

        if (promise) {
          if (message.error) {
            promise.reject(message.error)
          } else {
            promise.resolve(message.data)
          }

          clearTimeout(promise.timeoutId)
          delete this.messagePromises[message.responseId]
        }
      }
    })
  }

  public onColorThemeChanged(callback: () => void) {
    this._onDidChangeActiveColorThemeCallback = callback
  }

  public getThemeColor(color: string) {
    return this.postMessage('getThemeColor', [color])
  }

  private postMessage(command: string, data: unknown, timeout: number = 3000): Promise<unknown> {
    const id = this.messageId++
    const deferredValue: Deferred<unknown> = deferred()

    const timeoutId = setTimeout(() => {
      deferredValue.reject(new Error(`Message ${id} timeout`))
      delete this.messagePromises[id]
    }, timeout)

    this.messagePromises[id] = { ...deferredValue, timeoutId }

    this.vscode.postMessage({ id, command, data })
    return deferredValue
  }
}

export const VSCodeApi = new VSCodeApiClass()
