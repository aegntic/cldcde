export interface Theme {
  name: string
  colors: {
    // Background colors
    background: {
      primary: string
      secondary: string
      tertiary: string
      modal: string
      card: string
    }
    // Text colors
    text: {
      primary: string
      secondary: string
      tertiary: string
      muted: string
      inverse: string
    }
    // Border and divider colors
    border: {
      primary: string
      secondary: string
      focus: string
      hover: string
    }
    // Status colors
    status: {
      success: string
      error: string
      warning: string
      info: string
    }
    // Interactive elements
    interactive: {
      primary: string
      primaryHover: string
      secondary: string
      secondaryHover: string
      accent: string
      accentHover: string
    }
    // ASCII art and terminal elements
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
    // Syntax highlighting
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

export const claudeCodeTheme: Theme = {
  name: 'Labs Signal Dark',
  colors: {
    background: {
      primary: '#070f16',
      secondary: '#0e1823',
      tertiary: '#152234',
      modal: 'rgba(7, 15, 22, 0.95)',
      card: '#0d1722'
    },
    text: {
      primary: '#e8f4ff',
      secondary: '#b8c8da',
      tertiary: '#8ca2ba',
      muted: '#667b94',
      inverse: '#061019'
    },
    border: {
      primary: '#25364a',
      secondary: '#1b2a3c',
      focus: '#4ec5ff',
      hover: '#34516c'
    },
    status: {
      success: '#29c27f',
      error: '#ff5b5b',
      warning: '#f6b73c',
      info: '#4ec5ff'
    },
    interactive: {
      primary: '#00a8ff',
      primaryHover: '#0089cf',
      secondary: '#1c3046',
      secondaryHover: '#2c4864',
      accent: '#0fd39f',
      accentHover: '#0bb383'
    },
    terminal: {
      green: '#29c27f',
      blue: '#4ec5ff',
      yellow: '#f6b73c',
      orange: '#ff8b3d',
      purple: '#7890ff',
      cyan: '#38e8d3',
      red: '#ff5b5b',
      white: '#f4f9ff',
      gray: '#7f95ad'
    },
    syntax: {
      keyword: '#65cbff',
      string: '#ffad71',
      number: '#89e6bf',
      comment: '#6f88a4',
      function: '#ffd379',
      variable: '#9cc9ff'
    }
  },
  fonts: {
    mono: '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
    sans: '"Space Grotesk", "Manrope", "Avenir Next", "Segoe UI", sans-serif',
    serif: '"Instrument Serif", "Iowan Old Style", Georgia, serif'
  },
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
    md: '0.65rem',
    lg: '1rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 4px 12px rgba(0, 23, 44, 0.25)',
    md: '0 10px 28px rgba(0, 20, 38, 0.35)',
    lg: '0 20px 44px rgba(0, 20, 38, 0.44)',
    glow: '0 0 24px rgba(78, 197, 255, 0.3), 0 0 52px rgba(15, 211, 159, 0.16)'
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }
}

export const futuristicTheme: Theme = {
  name: 'Compound Carbon',
  colors: {
    background: {
      primary: '#0b0907',
      secondary: '#15110d',
      tertiary: '#221b14',
      modal: 'rgba(11, 9, 7, 0.97)',
      card: '#17120e'
    },
    text: {
      primary: '#f7efe6',
      secondary: '#d3c3b3',
      tertiary: '#b29d87',
      muted: '#7f6c59',
      inverse: '#120d09'
    },
    border: {
      primary: '#3c2d1f',
      secondary: '#2d2218',
      focus: '#ff8b3d',
      hover: '#5b442e'
    },
    status: {
      success: '#58c28b',
      error: '#ff6d4a',
      warning: '#f4b654',
      info: '#55b9ff'
    },
    interactive: {
      primary: '#ff7a2f',
      primaryHover: '#e05f1c',
      secondary: '#352515',
      secondaryHover: '#4a321f',
      accent: '#f1cc4f',
      accentHover: '#d7b238'
    },
    terminal: {
      green: '#58c28b',
      blue: '#55b9ff',
      yellow: '#f1cc4f',
      orange: '#ff7a2f',
      purple: '#d18eff',
      cyan: '#6be9ff',
      red: '#ff6d4a',
      white: '#fff7ed',
      gray: '#a99582'
    },
    syntax: {
      keyword: '#ffb177',
      string: '#ffd39f',
      number: '#9de0bc',
      comment: '#8f7a64',
      function: '#f5d66f',
      variable: '#ff9b70'
    }
  },
  fonts: {
    mono: '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
    sans: '"Manrope", "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif',
    serif: '"Instrument Serif", "Iowan Old Style", Georgia, serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '0.2rem',
    md: '0.35rem',
    lg: '0.6rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 4px 12px rgba(36, 18, 8, 0.24)',
    md: '0 10px 28px rgba(36, 18, 8, 0.34)',
    lg: '0 20px 44px rgba(36, 18, 8, 0.46)',
    glow: '0 0 28px rgba(255, 122, 47, 0.3), 0 0 64px rgba(241, 204, 79, 0.18)'
  },
  animations: {
    duration: {
      fast: '100ms',
      normal: '200ms',
      slow: '400ms'
    },
    easing: {
      default: 'cubic-bezier(0.23, 1, 0.32, 1)',
      sharp: 'cubic-bezier(0.55, 0, 0.1, 1)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }
}


export const themes = {
  claudeCode: claudeCodeTheme,
  futuristic: futuristicTheme
}

export type ThemeName = keyof typeof themes
