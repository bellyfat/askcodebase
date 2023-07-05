import { createRoot } from 'react-dom/client'
import { AskCodebasePanel } from './AskCodebasePanel'
import './global.scss'
import { VSCodeApi } from './VSCodeApi'
import 'react-tooltip/dist/react-tooltip.css'

VSCodeApi.setup()

const root = createRoot(document.getElementById('root')!)
root.render(<AskCodebasePanel />)
