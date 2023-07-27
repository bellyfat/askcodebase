import { atom } from 'jotai'
import { IUser } from '@askcodebase/common'

export const userAtom = atom<IUser | null>(null)
