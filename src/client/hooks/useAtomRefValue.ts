import { Atom, useAtomValue } from 'jotai'
import { useRef } from 'react'

export function useAtomRefValue<T>(atom: Atom<T>) {
  const state = useAtomValue(atom)
  const ref = useRef(state)
  ref.current = state

  return [state, () => ref.current] as const
}
