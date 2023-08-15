import { atomWithStorage } from 'jotai/utils'

export interface ISystemInfo {
  arch: string
  platform: string
  vscodeVersion: string
}

export const systemInfoAtom = atomWithStorage<ISystemInfo | null>('systemInfo', null)
