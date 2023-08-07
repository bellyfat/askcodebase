import { atomWithStorage } from 'jotai/utils'

export function getThemeColors() {
  const element = document.getElementsByTagName('html')[0]
  const colors = Object.values(element.style).map(color => {
    const colorValue = element.style.getPropertyValue(color)
    return [color, colorValue]
  })
  return colors
    .filter(([key, value]) => key.startsWith('--'))
    .reduce((o, [key, value]) => Object.assign(o, { [key]: value }), {})
}

export const themeColorsAtom = atomWithStorage<Record<string, string>>(
  'themeColors',
  getThemeColors(),
)
