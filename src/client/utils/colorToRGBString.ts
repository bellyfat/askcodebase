export function colorToRGBString(colorStr: string) {
  let r, g, b

  if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '')

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    } else {
      throw new Error('Invalid HEX color')
    }
  } else if (colorStr.startsWith('rgb')) {
    const rgb = colorStr.match(/\d+/g)

    if (rgb && (rgb.length === 3 || rgb.length === 4)) {
      r = parseInt(rgb[0], 10)
      g = parseInt(rgb[1], 10)
      b = parseInt(rgb[2], 10)
    } else {
      throw new Error('Invalid RGB color')
    }
  } else {
    throw new Error('Unsupported color format')
  }

  return `${r}, ${g}, ${b}`
}
