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
  name: 'Voxel Ember',
  colors: {
    background: {
      primary: '#050505',
      secondary: '#0c0707',
      tertiary: '#160909',
      modal: 'rgba(5, 5, 5, 0.96)',
      card: '#140808'
    },
    text: {
      primary: '#fff3ef',
      secondary: '#f0cec6',
      tertiary: '#d9a39a',
      muted: '#ab7870',
      inverse: '#120606'
    },
    border: {
      primary: '#5d2931',
      secondary: '#3a1a1f',
      focus: '#FF3B1F',
      hover: '#7A2418'
    },
    status: {
      success: '#5fd3a0',
      error: '#ff4d5d',
      warning: '#ffb55d',
      info: '#FF6A4A'
    },
    interactive: {
      primary: '#FF3B1F',
      primaryHover: '#C41E12',
      secondary: '#2a1216',
      secondaryHover: '#3d1a20',
      accent: '#FFB199',
      accentHover: '#FF6A4A'
    },
    terminal: {
      green: '#5fd3a0',
      blue: '#FFB199',
      yellow: '#ffb55d',
      orange: '#FF6A4A',
      purple: '#ff9eb1',
      cyan: '#FFB199',
      red: '#FF3B1F',
      white: '#fff8f5',
      gray: '#bf9088'
    },
    syntax: {
      keyword: '#FF6A4A',
      string: '#ffc691',
      number: '#92f1bc',
      comment: '#b48379',
      function: '#ffd37f',
      variable: '#FFB199'
    }
  },
  fonts: {
    mono: '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
    sans: '"Orbitron", "Space Grotesk", "Exo 2", "Segoe UI", sans-serif',
    serif: '"Rajdhani", "Instrument Serif", Georgia, serif'
  },
  shadows: {
    sm: '0 6px 16px rgba(8, 0, 0, 0.45)',
    md: '0 14px 32px rgba(8, 0, 0, 0.58)',
    lg: '0 24px 58px rgba(8, 0, 0, 0.7)',
    glow: '0 0 24px rgba(255, 59, 31, 0.38), 0 0 60px rgba(196, 30, 18, 0.22)'
  },
  ...commonTheme
}

export const futuristicTheme: Theme = {
  name: 'Neon Grid Red',
  colors: {
    background: {
      primary: '#12080a',
      secondary: '#1b0d11',
      tertiary: '#2a151b',
      modal: 'rgba(18, 8, 10, 0.96)',
      card: '#1f0e13'
    },
    text: {
      primary: '#fff3ef',
      secondary: '#f0cec6',
      tertiary: '#d9a39a',
      muted: '#ab7870',
      inverse: '#18090c'
    },
    border: {
      primary: '#5d2931',
      secondary: '#492028',
      focus: '#ff5f6b',
      hover: '#753540'
    },
    status: {
      success: '#5fd3a0',
      error: '#ff4d5d',
      warning: '#ffb55d',
      info: '#ff887c'
    },
    interactive: {
      primary: '#ff4d5d',
      primaryHover: '#e13e4d',
      secondary: '#36171f',
      secondaryHover: '#4d222c',
      accent: '#ff7a6e',
      accentHover: '#ea6357'
    },
    terminal: {
      green: '#5fd3a0',
      blue: '#ff9f8d',
      yellow: '#ffb55d',
      orange: '#ff8d53',
      purple: '#ff9eb1',
      cyan: '#ff8989',
      red: '#ff4d5d',
      white: '#fff8f5',
      gray: '#bf9088'
    },
    syntax: {
      keyword: '#ff8f83',
      string: '#ffc691',
      number: '#92f1bc',
      comment: '#b48379',
      function: '#ffd37f',
      variable: '#ffaaa0'
    }
  },
  fonts: {
    mono: '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Consolas, monospace',
    sans: '"Orbitron", "Exo 2", "Space Grotesk", "Segoe UI", sans-serif',
    serif: '"Rajdhani", "Instrument Serif", Georgia, serif'
  },
  shadows: {
    sm: '0 6px 16px rgba(36, 10, 14, 0.35)',
    md: '0 14px 32px rgba(36, 10, 14, 0.52)',
    lg: '0 24px 58px rgba(36, 10, 14, 0.64)',
    glow: '0 0 24px rgba(255, 95, 107, 0.32), 0 0 60px rgba(255, 122, 110, 0.18)'
  },
  ...commonTheme
}

export const themes = {
  claudeCode: claudeCodeTheme,
  futuristic: futuristicTheme
}

export type ThemeName = keyof typeof themes
