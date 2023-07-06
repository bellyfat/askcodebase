import { atom } from 'jotai'
import { ICommandBlock } from '~/client/types'

export const commandBlocksAtom = atom<ICommandBlock[]>([])
