import { createRoot } from 'react-dom/client'
import { AskCodebasePanel } from './AskCodebasePanel'
import './global.scss'
import { VSCodeApi } from './VSCodeApi'

VSCodeApi.setup()

const root = createRoot(document.getElementById('root')!)
root.render(<AskCodebasePanel />)
