import React, { useMemo } from 'react'
import styled, { css } from 'styled-components'

type AsciiSize = 'hero' | 'section' | 'card' | 'micro'
type AsciiAlign = 'left' | 'center'

interface AsciiHeadingProps {
  text: string
  size?: AsciiSize
  level?: 1 | 2 | 3 | 4 | 5 | 6
  align?: AsciiAlign
  className?: string
}

const GLYPHS: Record<string, string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['#####', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '#   #', '#  ##', ' ####'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '   # ', '  #  ', '#####'],
  '3': ['#### ', '    #', ' ### ', '    #', '#### '],
  '4': ['#   #', '#   #', '#####', '    #', '    #'],
  '5': ['#####', '#    ', '#### ', '    #', '#### '],
  '6': [' ### ', '#    ', '#### ', '#   #', ' ### '],
  '7': ['#####', '   # ', '  #  ', ' #   ', '#    '],
  '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  '9': [' ### ', '#   #', ' ####', '    #', ' ### '],
  '.': ['     ', '     ', '     ', ' ##  ', ' ##  '],
  '-': ['     ', '     ', '#####', '     ', '     '],
  '+': ['     ', '  #  ', ' ### ', '  #  ', '     '],
  ':': ['     ', ' ##  ', '     ', ' ##  ', '     '],
  '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
  '&': [' ##  ', '#  # ', ' ## #', '#  # ', ' ### '],
  "'": [' ##  ', ' ##  ', '  #  ', '     ', '     '],
  '?': [' ### ', '    #', '  ## ', '     ', '  #  '],
  ' ': ['   ', '   ', '   ', '   ', '   ']
}

const GLYPH_HEIGHT = 5

export const buildAsciiBanner = (rawText: string): string => {
  const lines = rawText.toUpperCase().split('\n')

  const renderedLines = lines.map((line) => {
    const rows = Array.from({ length: GLYPH_HEIGHT }, () => [] as string[])
    for (const char of line) {
      const glyph = GLYPHS[char] ?? GLYPHS['?']
      for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
        rows[row].push(glyph[row])
      }
    }

    return rows.map((row) => row.join(' ').replace(/\s+$/g, '')).join('\n')
  })

  return renderedLines.join('\n\n')
}

const frameSizeStyles = {
  hero: css`
    padding: 0.85rem 1rem;
  `,
  section: css`
    padding: 0.68rem 0.8rem;
  `,
  card: css`
    padding: 0.52rem 0.62rem;
  `,
  micro: css`
    padding: 0.42rem 0.5rem;
  `
}

const artSizeStyles = {
  hero: css`
    font-size: clamp(0.36rem, 0.82vw, 0.62rem);
    letter-spacing: 0.06em;
  `,
  section: css`
    font-size: clamp(0.31rem, 0.62vw, 0.5rem);
    letter-spacing: 0.055em;
  `,
  card: css`
    font-size: clamp(0.26rem, 0.5vw, 0.41rem);
    letter-spacing: 0.05em;
  `,
  micro: css`
    font-size: clamp(0.23rem, 0.42vw, 0.35rem);
    letter-spacing: 0.045em;
  `
}

const HeadingRoot = styled.div<{ $align: AsciiAlign }>`
  width: 100%;
  text-align: ${({ $align }) => $align};
`

const ArtFrame = styled.div<{ $size: AsciiSize; $align: AsciiAlign }>`
  display: inline-block;
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => `${theme.colors.border.secondary}b0`};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background:
    linear-gradient(
      170deg,
      ${({ theme }) => `${theme.colors.background.secondary}f4`} 0%,
      ${({ theme }) => `${theme.colors.background.primary}de`} 100%
    );
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 ${({ theme }) => `${theme.colors.terminal.white}22`};
  transform:
    perspective(900px)
    rotateX(11deg)
    skewX(-10deg)
    translateZ(0);
  transform-origin: ${({ $align }) => ($align === 'center' ? 'center bottom' : 'left bottom')};
  transition: transform 220ms ease, box-shadow 220ms ease;
  ${props => frameSizeStyles[props.$size]}

  &:hover {
    animation: titleHoverLoop 1.8s ease-in-out infinite;
    box-shadow:
      0 14px 28px rgba(0, 0, 0, 0.34),
      0 0 22px ${({ theme }) => `${theme.colors.terminal.blue}55`},
      inset 0 1px 0 ${({ theme }) => `${theme.colors.terminal.white}2f`};
  }

  &::-webkit-scrollbar {
    height: 6px;
  }

  @keyframes titleHoverLoop {
    0% { transform: perspective(900px) rotateX(11deg) skewX(-10deg) translateY(0); }
    50% { transform: perspective(900px) rotateX(13deg) skewX(-9deg) translateY(-2px); }
    100% { transform: perspective(900px) rotateX(11deg) skewX(-10deg) translateY(0); }
  }
`

const Art = styled.pre<{ $size: AsciiSize }>`
  margin: 0;
  white-space: pre;
  font-family: ${({ theme }) => theme.fonts.mono};
  line-height: 1.07;
  color: ${({ theme }) => theme.colors.terminal.white};
  text-shadow:
    1px 0 0 ${({ theme }) => theme.colors.terminal.green},
    2px 1px 0 ${({ theme }) => theme.colors.terminal.cyan},
    3px 2px 0 ${({ theme }) => `${theme.colors.terminal.blue}cc`},
    4px 3px 0 rgba(0, 0, 0, 0.5);
  user-select: none;
  ${props => artSizeStyles[props.$size]}
`

export const AsciiHeading: React.FC<AsciiHeadingProps> = ({
  text,
  size = 'section',
  level = 2,
  align = 'left',
  className
}) => {
  const asciiText = useMemo(() => buildAsciiBanner(text), [text])

  return (
    <HeadingRoot
      className={className}
      $align={align}
      role="heading"
      aria-level={level}
      aria-label={text}
    >
      <ArtFrame $size={size} $align={align}>
        <Art aria-hidden="true" $size={size}>
          {asciiText}
        </Art>
      </ArtFrame>
    </HeadingRoot>
  )
}
