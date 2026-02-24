import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

const ToggleContainer = styled(motion.button)`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.md};
  left: ${({ theme }) => theme.spacing.md};
  z-index: 999;
  min-width: 168px;
  height: 46px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.card}db`};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.8rem 0.4rem 0.45rem;
  gap: 0.55rem;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  backdrop-filter: blur(10px);
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.hover};
    background: ${({ theme }) => `${theme.colors.background.secondary}e1`};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`

const Badge = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => `${theme.colors.background.secondary}ba`};
`

const LabelStack = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  line-height: 1.1;
  flex: 1;
`

const LabelTop = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.tertiary};
`

const LabelBottom = styled.span`
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.84rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Hint = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.text.tertiary};
`

const ThemeToggle: React.FC = () => {
  const { currentTheme, themeName, toggleTheme, isTransitioning } = useTheme()

  const getThemeMeta = () => {
    switch (themeName) {
      case 'claudeCode':
        return { badge: 'LS', hint: 'Alt: CC' }
      case 'futuristic':
        return { badge: 'CC', hint: 'Alt: LS' }
      default:
        return { badge: '--', hint: 'Alt' }
    }
  }

  const themeMeta = getThemeMeta()

  const getThemeName = () => {
    switch (themeName) {
      case 'claudeCode':
        return 'Labs Signal Dark'
      case 'futuristic':
        return 'Compound Carbon'
      default:
        return 'Unknown Theme'
    }
  }

  return (
    <ToggleContainer
      onClick={toggleTheme}
      disabled={isTransitioning}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      title={`Current theme: ${getThemeName()}. Click to toggle.`}
      aria-label={`Toggle theme. Current theme: ${getThemeName()}`}
    >
      <Badge
        key={themeName}
        initial={{ rotate: -120, scale: 0.85, opacity: 0.5 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {themeMeta.badge}
      </Badge>
      <LabelStack>
        <LabelTop>Theme</LabelTop>
        <LabelBottom>{currentTheme.name}</LabelBottom>
      </LabelStack>
      <Hint>{themeMeta.hint}</Hint>
    </ToggleContainer>
  )
}

export { ThemeToggle }
