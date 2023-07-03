import { createRoot } from 'react-dom/client'
import { AskCodebasePanel } from './AskCodebasePanel'
import './global.scss'

const root = createRoot(document.getElementById('root')!)
root.render(<AskCodebasePanel />)
