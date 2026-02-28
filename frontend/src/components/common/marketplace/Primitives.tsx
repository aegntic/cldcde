import React from 'react'
import styled from 'styled-components'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AsciiHeading } from '../../AsciiHeading'

const panelShell = `
  position: relative;
  border: 1px solid ${({ theme }: any) => `${theme.colors.border.primary}d8`};
  border-radius: ${({ theme }: any) => theme.borderRadius.lg};
  background:
    linear-gradient(160deg, ${({ theme }: any) => `${theme.colors.background.card}f2`} 0%, ${({ theme }: any) => `${theme.colors.background.secondary}e2`} 100%);
  box-shadow:
    0 16px 42px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.25);
  overflow: hidden;
`

export const MarketplaceShell = styled.div`
  min-height: 100vh;
  max-width: 1280px;
  margin: 0 auto;
  padding: calc(86px + ${({ theme }) => theme.spacing.xl}) ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  position: relative;
  z-index: 1;

  @media (max-width: 640px) {
    padding:
      calc(132px + ${({ theme }) => theme.spacing.lg})
      ${({ theme }) => theme.spacing.sm}
      calc(88px + env(safe-area-inset-bottom));
  }
`

export const DepthRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
`

const WirePlane = styled(motion.div)`
  position: absolute;
  inset: -18% -20%;
  opacity: 0.17;
  background-image:
    linear-gradient(to right, ${({ theme }) => `${theme.colors.border.secondary}88`} 1px, transparent 1px),
    linear-gradient(to bottom, ${({ theme }) => `${theme.colors.border.secondary}66`} 1px, transparent 1px);
  background-size: 52px 52px;
  transform: perspective(1200px) rotateX(62deg) scale(1.35);
  transform-origin: 50% 0;
`

const Halo = styled(motion.div)<{ $size: string; $top: string; $left?: string; $right?: string }>`
  position: absolute;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left || 'auto'};
  right: ${({ $right }) => $right || 'auto'};
  border-radius: 48% 52% 44% 56% / 42% 58% 40% 60%;
  filter: blur(22px);
  opacity: 0.42;
  background:
    radial-gradient(circle at 24% 28%, ${({ theme }) => `${theme.colors.interactive.primary}80`} 0%, transparent 60%),
    radial-gradient(circle at 76% 72%, ${({ theme }) => `${theme.colors.interactive.accent}66`} 0%, transparent 72%);
`

const Ridge = styled(motion.div)`
  position: absolute;
  width: 74vw;
  max-width: 980px;
  height: 300px;
  left: -10%;
  top: 38%;
  border-radius: 46% 54% 52% 48% / 44% 52% 48% 56%;
  border: 1px solid ${({ theme }) => `${theme.colors.border.secondary}77`};
  background:
    radial-gradient(circle at 30% 30%, ${({ theme }) => `${theme.colors.interactive.primary}24`} 0%, transparent 72%),
    linear-gradient(140deg, ${({ theme }) => `${theme.colors.background.secondary}90`} 0%, transparent 70%);
  opacity: 0.56;
`

export const DepthScene: React.FC = () => {
  const { scrollYProgress } = useScroll()
  const planeY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%'])
  const haloY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const ridgeY = useTransform(scrollYProgress, [0, 1], ['0%', '7%'])

  return (
    <DepthRoot aria-hidden>
      <WirePlane style={{ y: planeY }} />
      <Halo $size="32vw" $top="-10%" $left="-8%" style={{ y: haloY }} />
      <Halo $size="24vw" $top="8%" $right="-3%" style={{ y: haloY }} />
      <Ridge style={{ y: ridgeY }} />
    </DepthRoot>
  )
}

export const MarketplacePanel = styled(motion.section)`
  ${panelShell}
  padding: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 640px) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`

export const IsoCard = styled(motion.article)`
  ${panelShell}
  padding: ${({ theme }) => theme.spacing.md};
  transform-style: preserve-3d;

  @media (max-width: 640px) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`

export const SectionRail = styled(motion.section)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  scroll-margin-top: 140px;
`

export const SectionHeaderAscii = styled(AsciiHeading)`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`

export const SectionLead = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`

export const NeonButton = styled(motion.button)<{ $tone?: 'primary' | 'secondary' | 'ghost' }>`
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'secondary'
        ? theme.colors.interactive.accent
        : $tone === 'ghost'
        ? theme.colors.border.primary
        : theme.colors.interactive.primary};
  background: ${({ theme, $tone }) =>
    $tone === 'secondary'
      ? `${theme.colors.interactive.accent}22`
      : $tone === 'ghost'
      ? `${theme.colors.background.secondary}db`
      : `${theme.colors.interactive.primary}26`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.56rem 0.86rem;
  cursor: pointer;

  @media (max-width: 640px) {
    font-size: 0.76rem;
    padding: 0.56rem 0.72rem;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }
`

export const Badge = styled.span<{ $tone?: 'neutral' | 'new' | 'kind' | 'tier' }>`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.2rem 0.44rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ theme, $tone }) => {
    if ($tone === 'new') return `${theme.colors.status.success}24`
    if ($tone === 'kind') return `${theme.colors.interactive.primary}20`
    if ($tone === 'tier') return `${theme.colors.interactive.accent}24`
    return `${theme.colors.background.secondary}ca`
  }};
  color: ${({ theme }) => theme.colors.text.secondary};

  @media (max-width: 640px) {
    font-size: 0.62rem;
    padding: 0.16rem 0.38rem;
  }
`

export const TagChip = styled.span`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.18rem 0.42rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  background: ${({ theme }) => `${theme.colors.background.secondary}ca`};

  @media (max-width: 640px) {
    font-size: 0.64rem;
  }
`

export const FilterPill = styled.button<{ $active: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.border.secondary)};
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.interactive.primary}22` : `${theme.colors.background.secondary}c2`};
  color: ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.text.secondary)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.26rem 0.55rem;
  cursor: pointer;
`

export const CommandBlock = styled.pre`
  margin: 0;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.sm};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: pre-wrap;
  word-break: break-word;
`
