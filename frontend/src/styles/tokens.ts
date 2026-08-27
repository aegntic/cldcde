export const voxelTokens = {
  void: '#050505',
  voidRaised: '#0c0707',
  voidCard: '#140808',
  ember: '#FF3B1F',
  emberCore: '#C41E12',
  emberHot: '#FF6A4A',
  emberHighlight: '#FFB199',
  emberDim: '#7A2418',
  text: '#FFF3EF',
  textMuted: '#C4A39A'
} as const

export const contrastRatio = (foreground: string, background: string): number => {
  const luminance = (hex: string) => {
    const raw = hex.replace('#', '')
    const value = raw.length === 3 ? raw.split('').map((ch) => ch + ch).join('') : raw
    const channels = [0, 2, 4].map((offset) => {
      const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }

  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}
