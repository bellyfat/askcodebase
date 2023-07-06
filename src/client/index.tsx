import { createRoot } from 'react-dom/client'
import { AskCodebasePanel } from './AskCodebasePanel'
import './global.scss'
import { VSCodeApi } from './VSCodeApi'
import 'react-tooltip/dist/react-tooltip.css'
import { ProcessEvent } from './Process'

VSCodeApi.setup()

!(async () => {
  try {
    const process = await VSCodeApi.spawn('watch')
    const pid = process.pid
    process.on(ProcessEvent.Exit, code => {
      console.log(`process ${pid} exited with code ${code}`)
    })
    process.on(ProcessEvent.Error, data => {
      console.log(`process ${pid} has error ${data}`)
    })
    process.stdout.on('data', data => {
      console.log(data)
    })
    process.stderr.on('data', data => {
      console.error(data)
    })
  } catch (e) {
    console.error('spawn failed: ', e)
  }
})()

const root = createRoot(document.getElementById('root')!)
root.render(<AskCodebasePanel />)
