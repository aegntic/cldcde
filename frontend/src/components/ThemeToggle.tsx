import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

const ToggleContainer = styled(motion.button)`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.md};
  left: ${({ theme }) => theme.spacing.md};
  z-index: 999;
  min-width: 186px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background:
    linear-gradient(165deg, ${({ theme }) => `${theme.colors.background.card}e6`} 0%, ${({ theme }) => `${theme.colors.background.secondary}ca`} 100%);
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.36rem 0.85rem 0.36rem 0.44rem;
  box-shadow: ${({ theme }) => theme.shadows.md};
  backdrop-filter: blur(12px);

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }

  @media (max-width: 640px) {
    min-width: 0;
    max-width: 152px;
    height: 42px;
    padding: 0.3rem 0.72rem 0.3rem 0.4rem;
    gap: 0.45rem;
  }
`

const ModeBadge = styled(motion.span)`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => `${theme.colors.background.primary}cb`};

  @media (max-width: 640px) {
    width: 26px;
    height: 26px;
    font-size: 0.58rem;
  }
`

const LabelStack = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  line-height: 1.1;
`

const LabelTop = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.tertiary};

  @media (max-width: 640px) {
    display: none;
  }
`

const LabelBottom = styled.span`
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 640px) {
    font-size: 0.76rem;
  }
`

const Hint = styled.span`
  margin-left: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.tertiary};

  @media (max-width: 640px) {
    display: none;
  }
`

const ThemeToggle: React.FC = () => {
  const { currentTheme, themeName, toggleTheme, isTransitioning } = useTheme()
  const badge = themeName === 'claudeCode' ? 'NG' : 'NR'
  const next = themeName === 'claudeCode' ? 'to NR' : 'to NG'

  return (
    <ToggleContainer
      type="button"
      onClick={toggleTheme}
      disabled={isTransitioning}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      title={`Current theme: ${currentTheme.name}. Click to toggle.`}
      aria-label={`Toggle theme. Current theme: ${currentTheme.name}`}
    >
      <ModeBadge
        key={themeName}
        initial={{ rotate: -100, scale: 0.84, opacity: 0.5 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        {badge}
      </ModeBadge>
      <LabelStack>
        <LabelTop>Theme</LabelTop>
        <LabelBottom>{currentTheme.name}</LabelBottom>
      </LabelStack>
      <Hint>{next}</Hint>
    </ToggleContainer>
  )
}

export { ThemeToggle }
