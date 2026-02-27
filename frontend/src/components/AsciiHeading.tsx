import React from 'react'
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

const frameSizeStyles = {
  hero: css`
    padding: 0.8rem 1rem;
  `,
  section: css`
    padding: 0.62rem 0.8rem;
  `,
  card: css`
    padding: 0.5rem 0.65rem;
  `,
  micro: css`
    padding: 0.42rem 0.54rem;
  `
}

const textSizeStyles = {
  hero: css`
    font-size: clamp(1.28rem, 2.8vw, 2.4rem);
    letter-spacing: 0.05em;
  `,
  section: css`
    font-size: clamp(0.98rem, 1.7vw, 1.58rem);
    letter-spacing: 0.04em;
  `,
  card: css`
    font-size: clamp(0.9rem, 1.35vw, 1.24rem);
    letter-spacing: 0.03em;
  `,
  micro: css`
    font-size: clamp(0.82rem, 1.02vw, 1.02rem);
    letter-spacing: 0.025em;
  `
}

const HeadingRoot = styled.div<{ $align: AsciiAlign }>`
  width: 100%;
  text-align: ${({ $align }) => $align};
`

const Frame = styled.div<{ $size: AsciiSize; $align: AsciiAlign }>`
  display: inline-block;
  max-width: 100%;
  border: 1px solid ${({ theme }) => `${theme.colors.border.secondary}b6`};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background:
    linear-gradient(
      165deg,
      ${({ theme }) => `${theme.colors.background.secondary}ef`} 0%,
      ${({ theme }) => `${theme.colors.background.primary}de`} 100%
    );
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: perspective(860px) rotateX(8deg) skewX(-7deg) translateZ(0);
  transform-origin: ${({ $align }) => ($align === 'center' ? 'center bottom' : 'left bottom')};
  transition: transform 200ms ease, box-shadow 200ms ease;
  ${props => frameSizeStyles[props.$size]}

  &:hover {
    transform: perspective(860px) rotateX(9deg) skewX(-6deg) translateY(-1px);
    box-shadow:
      0 14px 30px rgba(0, 0, 0, 0.34),
      0 0 18px ${({ theme }) => `${theme.colors.interactive.primary}55`};
  }

  @media (max-width: 760px) {
    transform: none;
  }
`

const Text = styled.span<{ $size: AsciiSize }>`
  display: inline-block;
  font-family: ${({ theme }) => theme.fonts.sans};
  text-transform: uppercase;
  line-height: 1.12;
  color: ${({ theme }) => theme.colors.text.primary};
  text-shadow:
    0 0 12px ${({ theme }) => `${theme.colors.interactive.primary}66`},
    0 1px 0 rgba(0, 0, 0, 0.44);
  white-space: pre-line;
  ${props => textSizeStyles[props.$size]}
`

export const buildAsciiBanner = (rawText: string): string => rawText

export const AsciiHeading: React.FC<AsciiHeadingProps> = ({
  text,
  size = 'section',
  level = 2,
  align = 'left',
  className
}) => {
  return (
    <HeadingRoot
      className={className}
      $align={align}
      role="heading"
      aria-level={level}
      aria-label={text}
    >
      <Frame $size={size} $align={align}>
        <Text $size={size}>{text}</Text>
      </Frame>
    </HeadingRoot>
  )
}
