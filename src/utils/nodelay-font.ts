/**
 * NODELAY.TDF-style ASCII Font Converter
 * 
 * This module provides ASCII art text conversion in the style of NODELAY.TDF font.
 * Based on TheDraw TDF font format specifications.
 */

// Character map for NODELAY-style font (simplified version)
// Each character is represented as an array of strings (lines)
const NODELAY_CHARS: Record<string, string[]> = {
  'A': [
    '╔═╗',
    '╠═╣',
    '╩ ╩'
  ],
  'B': [
    '╔╗ ',
    '╠╩╗',
    '╚═╝'
  ],
  'C': [
    '╔═╗',
    '║  ',
    '╚═╝'
  ],
  'D': [
    '╔╦╗',
    '║║║',
    '╚╩╝'
  ],
  'E': [
    '╔═╗',
    '╠═ ',
    '╚═╝'
  ],
  'F': [
    '╔═╗',
    '╠═ ',
    '╩  '
  ],
  'G': [
    '╔═╗',
    '║ ╦',
    '╚═╝'
  ],
  'H': [
    '╦ ╦',
    '╠═╣',
    '╩ ╩'
  ],
  'I': [
    '╦',
    '║',
    '╩'
  ],
  'J': [
    ' ╦',
    ' ║',
    '╚╝'
  ],
  'K': [
    '╦╔═',
    '╠╩╗',
    '╩ ╩'
  ],
  'L': [
    '╦  ',
    '║  ',
    '╚═╝'
  ],
  'M': [
    '╔╦╗',
    '║║║',
    '╩ ╩'
  ],
  'N': [
    '╔╗╔',
    '║║║',
    '╝╚╝'
  ],
  'O': [
    '╔═╗',
    '║ ║',
    '╚═╝'
  ],
  'P': [
    '╔═╗',
    '╠═╝',
    '╩  '
  ],
  'Q': [
    '╔═╗ ',
    '║ ║ ',
    '╚═╝╚'
  ],
  'R': [
    '╔═╗',
    '╠╦╝',
    '╩╚═'
  ],
  'S': [
    '╔═╗',
    '╚═╗',
    '╚═╝'
  ],
  'T': [
    '╔╦╗',
    ' ║ ',
    ' ╩ '
  ],
  'U': [
    '╦ ╦',
    '║ ║',
    '╚═╝'
  ],
  'V': [
    '╦  ╦',
    '╚╗╔╝',
    ' ╚╝ '
  ],
  'W': [
    '╦ ╦',
    '║║║',
    '╚╩╝'
  ],
  'X': [
    '═╗ ╦',
    '╔╩╦╝',
    '╩ ╚═'
  ],
  'Y': [
    '╦ ╦',
    '╚╦╝',
    ' ╩ '
  ],
  'Z': [
    '╔═╗',
    '╔═╝',
    '╚═╝'
  ],
  ' ': [
    '   ',
    '   ',
    '   '
  ],
  '.': [
    '  ',
    '  ',
    '═╝'
  ],
  '-': [
    '   ',
    '═══',
    '   '
  ],
  '\'': [
    '╔╗',
    '╚╝',
    '  '
  ],
  '0': [
    '╔═╗',
    '║║║',
    '╚═╝'
  ],
  '1': [
    '╔╗',
    ' ║',
    '═╩'
  ],
  '2': [
    '╔═╗',
    '╔═╝',
    '╚══'
  ],
  '3': [
    '╔═╗',
    ' ═╣',
    '╚═╝'
  ],
  '4': [
    '╦ ╦',
    '╚═╣',
    '  ╩'
  ],
  '5': [
    '╔══',
    '╚═╗',
    '╚═╝'
  ],
  '6': [
    '╔═ ',
    '╠═╗',
    '╚═╝'
  ],
  '7': [
    '╔══',
    '  ╔',
    '  ╩'
  ],
  '8': [
    '╔═╗',
    '╠═╣',
    '╚═╝'
  ],
  '9': [
    '╔═╗',
    '╚═╣',
    ' ═╝'
  ]
}

/**
 * Convert text to NODELAY-style ASCII art
 */
export function textToNodelay(text: string): string {
  const upperText = text.toUpperCase()
  const lines: string[][] = [[], [], []] // 3 lines for each character
  
  for (const char of upperText) {
    const charLines = NODELAY_CHARS[char] || NODELAY_CHARS[' ']
    
    for (let i = 0; i < 3; i++) {
      lines[i].push(charLines[i] || '   ')
      lines[i].push(' ') // Space between characters
    }
  }
  
  // Join lines
  return lines.map(line => line.join('')).join('\n')
}

/**
 * Convert text to NODELAY-style ASCII art with a border
 */
export function textToNodelayWithBorder(text: string): string {
  const art = textToNodelay(text)
  const lines = art.split('\n')
  const maxWidth = Math.max(...lines.map(l => l.length))
  
  const border = '═'.repeat(maxWidth + 4)
  const topBorder = `╔${border}╗`
  const bottomBorder = `╚${border}╝`
  
  const framedLines = lines.map(line => {
    const padding = ' '.repeat(maxWidth - line.length)
    return `║ ${line}${padding} ║`
  })
  
  return [topBorder, ...framedLines, bottomBorder].join('\n')
}

/**
 * Get all available headers in NODELAY style
 */
export const NODELAY_HEADERS = {
  'CLAUDE CC': textToNodelay('CLAUDE CC'),
  'SETUP': textToNodelay('SETUP'),
  'STATUS': textToNodelay('STATUS'), 
  'DONE': textToNodelay('DONE'),
  'CLOUDFLARE': textToNodelay('CLOUDFLARE'),
  'FREE TIER': textToNodelay('FREE TIER'),
  'NEWS': textToNodelay('NEWS'),
  'API': textToNodelay('API'),
  'DATABASE': textToNodelay('DATABASE'),
  'SUCCESS': textToNodelay('SUCCESS'),
  'ERROR': textToNodelay('ERROR'),
  'CONFIG': textToNodelay('CONFIG')
}

// Export a simple function to use in scripts
export function printNodelay(text: string): void {
  console.log(textToNodelay(text))
}