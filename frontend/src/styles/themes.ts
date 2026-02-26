export interface Theme {
  name: string
  colors: {
    background: {
      primary: string
      secondary: string
      tertiary: string
      modal: string
      card: string
    }
    text: {
      primary: string
      secondary: string
      tertiary: string
      muted: string
      inverse: string
    }
    border: {
      primary: string
      secondary: string
      focus: string
      hover: string
    }
    status: {
      success: string
      error: string
      warning: string
      info: string
    }
    interactive: {
      primary: string
      primaryHover: string
      secondary: string
      secondaryHover: string
      accent: string
      accentHover: string
    }
    terminal: {
      green: string
      blue: string
      yellow: string
      orange: string
      purple: string
      cyan: string
      red: string
      white: string
      gray: string
    }
    syntax: {
      keyword: string
      string: string
      number: string
      comment: string
      function: string
      variable: string
    }
  }
  fonts: {
    mono: string
    sans: string
    serif: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xxl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    full: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    glow: string
  }
  animations: {
    duration: {
      fast: string
      normal: string
      slow: string
    }
    easing: {
      default: string
      sharp: string
      smooth: string
    }
  }
}

const commonTheme = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '0.35rem',
    md: '0.6rem',
    lg: '1rem',
    full: '9999px'
  },
  animations: {
    duration: {
      fast: '140ms',
      normal: '280ms',
      slow: '520ms'
    },
    easing: {
      default: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.22, 1, 0.36, 1)'
    }
  }
}

export const claudeCodeTheme: Theme = {
  name: 'Neon Grid Blue',
  colors: {
    background: {
      primary: '#040b16',
      secondary: '#091427',
      tertiary: '#0f1f3a',
      modal: 'rgba(4, 11, 22, 0.95)',
      card: '#081625'
    },
    text: {
      primary: '#e7f7ff',
      secondary: '#b7cfe8',
      tertiary: '#89aac8',
      muted: '#617f9d',
      inverse: '#020a13'
    },
    border: {
      primary: '#214264',
      secondary: '#1a334f',
      focus: '#63dfff',
      hover: '#2d5886'
    },
    status: {
      success: '#35d29c',
      error: '#ff5b7a',
      warning: '#ffbe55',
      info: '#58d6ff'
    },
    interactive: {
      primary: '#33d7ff',
      primaryHover: '#23bddf',
      secondary: '#132944',
      secondaryHover: '#1c3b5f',
      accent: '#4df4c2',
      accentHover: '#35d2a5'
    },
    terminal: {
      green: '#4df4c2',
      blue: '#58d6ff',
      yellow: '#ffbe55',
      orange: '#ff9a4a',
      purple: '#8eb3ff',
      cyan: '#46f4ff',
      red: '#ff5b7a',
      white: '#f5fbff',
      gray: '#83a3bf'
    },
    syntax: {
      keyword: '#74d5ff',
      string: '#ffbe77',
      number: '#80f0bc',
      comment: '#7192b2',
      function: '#ffe47b',
      variable: '#92c6ff'
    }
  },
  fonts: {
    mono: '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
    sans: '"Orbitron", "Space Grotesk", "Exo 2", "Segoe UI", sans-serif',
    serif: '"Rajdhani", "Instrument Serif", Georgia, serif'
  },
  shadows: {
    sm: '0 6px 16px rgba(0, 22, 46, 0.35)',
    md: '0 14px 32px rgba(0, 19, 40, 0.48)',
    lg: '0 24px 58px rgba(0, 16, 35, 0.58)',
    glow: '0 0 24px rgba(88, 214, 255, 0.35), 0 0 60px rgba(77, 244, 194, 0.2)'
  },
  ...commonTheme
}

export const futuristicTheme: Theme = {
  name: 'Neon Grid Magma',
  colors: {
    background: {
      primary: '#0a090f',
      secondary: '#141220',
      tertiary: '#201b2f',
      modal: 'rgba(10, 9, 15, 0.96)',
      card: '#161325'
    },
    text: {
      primary: '#f6f2ff',
      secondary: '#d7caee',
      tertiary: '#b7a7d9',
      muted: '#8878aa',
      inverse: '#0e0916'
    },
    border: {
      primary: '#3a2f58',
      secondary: '#2e2647',
      focus: '#ff7bd7',
      hover: '#55457c'
    },
    status: {
      success: '#53d6a1',
      error: '#ff688d',
      warning: '#ffc364',
      info: '#7ec5ff'
    },
    interactive: {
      primary: '#ff7bd7',
      primaryHover: '#dc61ba',
      secondary: '#231a37',
      secondaryHover: '#352652',
      accent: '#74c4ff',
      accentHover: '#5b9dd1'
    },
    terminal: {
      green: '#53d6a1',
      blue: '#74c4ff',
      yellow: '#ffc364',
      orange: '#ff9b5f',
      purple: '#c8a0ff',
      cyan: '#8eefff',
      red: '#ff688d',
      white: '#fbf8ff',
      gray: '#a091bf'
    },
    syntax: {
      keyword: '#b88dff',
      string: '#ffc49a',
      number: '#8ef4ca',
      comment: '#8c7aa8',
      function: '#ffd980',
      variable: '#edb6ff'
    }
  },
  fonts: {
    mono: '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
    sans: '"Orbitron", "Exo 2", "Space Grotesk", "Segoe UI", sans-serif',
    serif: '"Rajdhani", "Instrument Serif", Georgia, serif'
  },
  shadows: {
    sm: '0 6px 16px rgba(20, 12, 30, 0.35)',
    md: '0 14px 32px rgba(20, 12, 30, 0.5)',
    lg: '0 24px 58px rgba(20, 12, 30, 0.62)',
    glow: '0 0 24px rgba(255, 123, 215, 0.35), 0 0 60px rgba(116, 196, 255, 0.2)'
  },
  ...commonTheme
}

export const themes = {
  claudeCode: claudeCodeTheme,
  futuristic: futuristicTheme
}

export type ThemeName = keyof typeof themes
