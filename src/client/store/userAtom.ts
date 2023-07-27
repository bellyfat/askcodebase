import { atomWithStorage } from 'jotai/utils'
import { IUser } from '@askcodebase/common'

export const userAtom = atomWithStorage<IUser | null>('user', null)
