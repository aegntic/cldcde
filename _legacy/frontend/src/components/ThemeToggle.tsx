import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

const ToggleContainer = styled(motion.button)`
  position: fixed;
  top: ${({ theme }) => theme.spacing.md};
  left: ${({ theme }) => theme.spacing.md};
  z-index: 999;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.card};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  backdrop-filter: blur(10px);
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.hover};
    background: ${({ theme }) => theme.colors.background.secondary};
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: scale(0.95);
  }

  /* Add glow effect for futuristic theme */
  ${({ theme }) => 
    theme.name === 'Futuristic Monochrome' &&
    `
      box-shadow: ${theme.shadows.glow};
      border-color: ${theme.colors.terminal.blue};
    `
  }
`

const IconWrapper = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const ThemeIcon = styled.span`
  display: inline-block;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
`

const ThemeToggle: React.FC = () => {
  const { currentTheme, themeName, toggleTheme, isTransitioning } = useTheme()

  // Icon based on current theme
  const getThemeIcon = () => {
    switch (themeName) {
      case 'claudeCode':
        return '🌙' // Moon for dark theme
      case 'futuristic':
        return '⚡' // Lightning bolt for futuristic theme
      default:
        return '🎨' // Fallback
    }
  }

  const getThemeName = () => {
    switch (themeName) {
      case 'claudeCode':
        return 'Claude Code Dark'
      case 'futuristic':
        return 'Futuristic Monochrome'
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
      title={`Current: ${getThemeName()}. Click to toggle theme.`}
      aria-label={`Toggle theme. Current theme: ${getThemeName()}`}
    >
      <IconWrapper
        key={themeName} // Force re-render when theme changes
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ 
          duration: 0.4,
          ease: "backOut"
        }}
      >
        <ThemeIcon>{getThemeIcon()}</ThemeIcon>
      </IconWrapper>
    </ToggleContainer>
  )
}

export { ThemeToggle }
