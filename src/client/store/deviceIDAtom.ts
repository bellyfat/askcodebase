import { atomWithStorage } from 'jotai/utils'
import { randomString } from '../utils'

export const deviceIDAtom = atomWithStorage<string>('deviceID', randomString())
