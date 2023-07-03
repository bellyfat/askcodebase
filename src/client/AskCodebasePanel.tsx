import { VSCodeTextField } from '@vscode/webview-ui-toolkit/react'

export function AskCodebasePanel() {
  return (
    <div className='ask-codebase-panel'>
      <div className='repl-input-chevron codicon codicon-debug-console-evaluation-prompt'></div>
      <div className='icon'>
        <i className='codicon codicon-debug-console'></i> debug-console
      </div>
      <input />
    </div>
  )
}
