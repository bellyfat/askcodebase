import { createRoot } from 'react-dom/client'
import { VSCodeApi } from './VSCodeApi'
import 'react-tooltip/dist/react-tooltip.css'
import { AskCodebasePanel } from '~/client/components'
import './global.scss'
import '~/client/styles/globals.css'

VSCodeApi.setup()

const root = createRoot(document.getElementById('root')!)
root.render(<AskCodebasePanel />)
