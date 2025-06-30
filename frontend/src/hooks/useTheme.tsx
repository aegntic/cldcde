import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { Theme, ThemeName, themes, claudeCodeTheme } from '../styles/themes'

interface ThemeContextType {
  currentTheme: Theme
  themeName: ThemeName
  toggleTheme: () => void
  setTheme: (themeName: ThemeName) => void
  isTransitioning: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('claudeCode') // Default to Claude Code theme
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cldcde-theme') as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setThemeName(savedTheme)
    }
  }, [])

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cldcde-theme', themeName)
  }, [themeName])

  const currentTheme = themes[themeName]

  const toggleTheme = () => {
    setIsTransitioning(true)
    
    // Cycle through themes: claudeCode -> claudeLight -> futuristic -> claudeCode
    let newTheme: ThemeName
    switch (themeName) {
      case 'claudeCode':
        newTheme = 'claudeLight'
        break
      case 'claudeLight':
        newTheme = 'futuristic'
        break
      case 'futuristic':
        newTheme = 'claudeCode'
        break
      default:
        newTheme = 'claudeCode'
    }
    
    setThemeName(newTheme)
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }

  const setTheme = (newThemeName: ThemeName) => {
    if (newThemeName !== themeName) {
      setIsTransitioning(true)
      setThemeName(newThemeName)
      
      setTimeout(() => {
        setIsTransitioning(false)
      }, 500)
    }
  }

  const contextValue: ThemeContextType = {
    currentTheme,
    themeName,
    toggleTheme,
    setTheme,
    isTransitioning
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={currentTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Global styles and CSS variables
export const createGlobalStyles = (theme: Theme) => `
  :root {
    /* Background colors */
    --bg-primary: ${theme.colors.background.primary};
    --bg-secondary: ${theme.colors.background.secondary};
    --bg-tertiary: ${theme.colors.background.tertiary};
    --bg-modal: ${theme.colors.background.modal};
    --bg-card: ${theme.colors.background.card};
    
    /* Text colors */
    --text-primary: ${theme.colors.text.primary};
    --text-secondary: ${theme.colors.text.secondary};
    --text-tertiary: ${theme.colors.text.tertiary};
    --text-muted: ${theme.colors.text.muted};
    --text-inverse: ${theme.colors.text.inverse};
    
    /* Border colors */
    --border-primary: ${theme.colors.border.primary};
    --border-secondary: ${theme.colors.border.secondary};
    --border-focus: ${theme.colors.border.focus};
    --border-hover: ${theme.colors.border.hover};
    
    /* Status colors */
    --status-success: ${theme.colors.status.success};
    --status-error: ${theme.colors.status.error};
    --status-warning: ${theme.colors.status.warning};
    --status-info: ${theme.colors.status.info};
    
    /* Interactive colors */
    --interactive-primary: ${theme.colors.interactive.primary};
    --interactive-primary-hover: ${theme.colors.interactive.primaryHover};
    --interactive-secondary: ${theme.colors.interactive.secondary};
    --interactive-secondary-hover: ${theme.colors.interactive.secondaryHover};
    --interactive-accent: ${theme.colors.interactive.accent};
    --interactive-accent-hover: ${theme.colors.interactive.accentHover};
    
    /* Terminal colors */
    --terminal-green: ${theme.colors.terminal.green};
    --terminal-blue: ${theme.colors.terminal.blue};
    --terminal-yellow: ${theme.colors.terminal.yellow};
    --terminal-orange: ${theme.colors.terminal.orange};
    --terminal-purple: ${theme.colors.terminal.purple};
    --terminal-cyan: ${theme.colors.terminal.cyan};
    --terminal-red: ${theme.colors.terminal.red};
    --terminal-white: ${theme.colors.terminal.white};
    --terminal-gray: ${theme.colors.terminal.gray};
    
    /* Fonts */
    --font-mono: ${theme.fonts.mono};
    --font-sans: ${theme.fonts.sans};
    --font-serif: ${theme.fonts.serif};
    
    /* Spacing */
    --spacing-xs: ${theme.spacing.xs};
    --spacing-sm: ${theme.spacing.sm};
    --spacing-md: ${theme.spacing.md};
    --spacing-lg: ${theme.spacing.lg};
    --spacing-xl: ${theme.spacing.xl};
    --spacing-xxl: ${theme.spacing.xxl};
    
    /* Border radius */
    --radius-sm: ${theme.borderRadius.sm};
    --radius-md: ${theme.borderRadius.md};
    --radius-lg: ${theme.borderRadius.lg};
    --radius-full: ${theme.borderRadius.full};
    
    /* Shadows */
    --shadow-sm: ${theme.shadows.sm};
    --shadow-md: ${theme.shadows.md};
    --shadow-lg: ${theme.shadows.lg};
    --shadow-glow: ${theme.shadows.glow};
    
    /* Animation durations */
    --duration-fast: ${theme.animations.duration.fast};
    --duration-normal: ${theme.animations.duration.normal};
    --duration-slow: ${theme.animations.duration.slow};
    
    /* Animation easing */
    --easing-default: ${theme.animations.easing.default};
    --easing-sharp: ${theme.animations.easing.sharp};
    --easing-smooth: ${theme.animations.easing.smooth};
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-sans);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    transition: 
      background-color var(--duration-normal) var(--easing-default),
      color var(--duration-normal) var(--easing-default);
    overflow-x: hidden;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-primary);
    border-radius: var(--radius-full);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-hover);
  }

  /* Focus styles */
  *:focus {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background-color: var(--interactive-primary);
    color: var(--text-inverse);
  }

  /* Code and monospace text */
  code,
  pre,
  .mono {
    font-family: var(--font-mono);
  }

  /* Terminal cursor animation */
  @keyframes blink {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0;
    }
  }

  .terminal-cursor {
    animation: blink 1s infinite;
  }

  /* Glow effects for futuristic theme */
  .glow {
    box-shadow: var(--shadow-glow);
    transition: box-shadow var(--duration-normal) var(--easing-default);
  }

  /* ASCII art styling */
  .ascii-art {
    font-family: var(--font-mono);
    line-height: 1;
    white-space: pre;
    color: var(--terminal-blue);
    text-shadow: 0 0 10px currentColor;
  }

  /* Theme transition overlay */
  .theme-transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-slow) var(--easing-default);
  }

  .theme-transition-overlay.active {
    opacity: 0.8;
  }

  /* Utility classes */
  .text-gradient {
    background: linear-gradient(
      135deg,
      var(--terminal-blue),
      var(--terminal-cyan),
      var(--interactive-accent)
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% 200%;
    animation: gradient-shift 3s ease infinite;
  }

  @keyframes gradient-shift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  /* Button base styles */
  .btn {
    font-family: var(--font-sans);
    font-weight: 500;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
    background: var(--interactive-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all var(--duration-fast) var(--easing-default);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .btn:hover {
    background: var(--interactive-secondary-hover);
    border-color: var(--border-hover);
    transform: translateY(-1px);
  }

  .btn.primary {
    background: var(--interactive-primary);
    border-color: var(--interactive-primary);
    color: white;
  }

  .btn.primary:hover {
    background: var(--interactive-primary-hover);
    border-color: var(--interactive-primary-hover);
  }

  .btn.accent {
    background: var(--interactive-accent);
    border-color: var(--interactive-accent);
    color: var(--text-inverse);
  }

  .btn.accent:hover {
    background: var(--interactive-accent-hover);
    border-color: var(--interactive-accent-hover);
  }
`
