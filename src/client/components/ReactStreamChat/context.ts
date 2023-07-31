import { Dispatch, createContext } from 'react'
import { ActionType } from '~/client/hooks/useCreateReducer'
import { ReactStreamChatInitialState } from './state'

export interface HomeContextProps {
  state: ReactStreamChatInitialState
  dispatch: Dispatch<ActionType<ReactStreamChatInitialState>>
}

export const ReactStreamChatContext = createContext<HomeContextProps>(undefined!)
