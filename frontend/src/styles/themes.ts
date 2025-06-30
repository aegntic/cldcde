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

// Claude Code Dark Theme (Default)
export const claudeCodeTheme: Theme = {
  name: 'Claude Code Dark',
  colors: {
    background: {
      primary: '#1a1a1a',      // Main dark background
      secondary: '#2d2d2d',    // Slightly lighter for cards
      tertiary: '#3a3a3a',     // Even lighter for modals
      modal: 'rgba(26, 26, 26, 0.95)',
      card: '#252525'
    },
    text: {
      primary: '#e8e8e8',      // Main text
      secondary: '#b8b8b8',    // Secondary text
      tertiary: '#888888',     // Muted text
      muted: '#666666',        // Very muted
      inverse: '#1a1a1a'       // Dark text on light backgrounds
    },
    border: {
      primary: '#404040',      // Main borders
      secondary: '#333333',    // Subtle borders
      focus: '#007acc',        // Focus ring (Claude blue)
      hover: '#4a4a4a'         // Hover state borders
    },
    status: {
      success: '#4caf50',      // Green
      error: '#f44336',        // Red
      warning: '#ff9800',      // Orange
      info: '#2196f3'          // Blue
    },
    interactive: {
      primary: '#007acc',      // Claude blue
      primaryHover: '#0056a3', // Darker blue
      secondary: '#404040',    // Gray button
      secondaryHover: '#4a4a4a', // Lighter gray
      accent: '#00d4aa',       // Teal accent
      accentHover: '#00b89a'   // Darker teal
    },
    terminal: {
      green: '#4caf50',
      blue: '#2196f3',
      yellow: '#ffeb3b',
      orange: '#ff9800',
      purple: '#9c27b0',
      cyan: '#00bcd4',
      red: '#f44336',
      white: '#ffffff',
      gray: '#9e9e9e'
    },
    syntax: {
      keyword: '#569cd6',      // Blue keywords
      string: '#ce9178',       // Orange strings
      number: '#b5cea8',       // Green numbers
      comment: '#6a9955',      // Green comments
      function: '#dcdcaa',     // Yellow functions
      variable: '#9cdcfe'      // Light blue variables
    }
  },
  fonts: {
    mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: '"Crimson Text", Georgia, serif'
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem'      // 48px
  },
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(0, 122, 204, 0.3)'
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

// Futuristic Monochrome Theme
export const futuristicTheme: Theme = {
  name: 'Futuristic Monochrome',
  colors: {
    background: {
      primary: '#0a0a0a',      // Deep black
      secondary: '#111111',    // Slightly lighter black
      tertiary: '#1a1a1a',     // Dark gray
      modal: 'rgba(10, 10, 10, 0.98)',
      card: '#0f0f0f'
    },
    text: {
      primary: '#e0e6ff',      // Subtle blue-white
      secondary: '#a0b0d0',    // Muted blue-gray
      tertiary: '#6080a0',     // Darker blue-gray
      muted: '#405060',        // Very muted blue-gray
      inverse: '#0a0a0a'       // Deep black
    },
    border: {
      primary: '#1e2a3a',      // Dark blue-gray
      secondary: '#151b25',    // Darker blue-gray
      focus: '#3b82f6',        // Bright blue
      hover: '#2a3645'         // Lighter blue-gray
    },
    status: {
      success: '#10b981',      // Emerald green
      error: '#ef4444',        // Red
      warning: '#f59e0b',      // Amber/burnt orange
      info: '#3b82f6'          // Blue
    },
    interactive: {
      primary: '#2563eb',      // Blue primary
      primaryHover: '#1d4ed8', // Darker blue
      secondary: '#1e293b',    // Dark slate
      secondaryHover: '#334155', // Lighter slate
      accent: '#eab308',       // Hazard yellow
      accentHover: '#ca8a04'   // Darker yellow
    },
    terminal: {
      green: '#22d3ee',        // Cyan-green
      blue: '#3b82f6',         // Bright blue
      yellow: '#eab308',       // Hazard yellow
      orange: '#f97316',       // Burnt orange
      purple: '#8b5cf6',       // Purple
      cyan: '#06b6d4',         // Cyan
      red: '#ef4444',          // Red
      white: '#e0e6ff',        // Blue-white
      gray: '#64748b'          // Slate gray
    },
    syntax: {
      keyword: '#60a5fa',      // Light blue
      string: '#f97316',       // Burnt orange
      number: '#22d3ee',       // Cyan
      comment: '#64748b',      // Slate gray
      function: '#eab308',     // Hazard yellow
      variable: '#a78bfa'      // Light purple
    }
  },
  fonts: {
    mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: '"Crimson Text", Georgia, serif'
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
    sm: '0.125rem',  // Sharper corners for futuristic look
    md: '0.25rem',
    lg: '0.5rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px rgba(59, 130, 246, 0.1)',
    md: '0 4px 6px rgba(59, 130, 246, 0.15)',
    lg: '0 10px 15px rgba(59, 130, 246, 0.2)',
    glow: '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(234, 179, 8, 0.2)'
  },
  animations: {
    duration: {
      fast: '100ms',    // Snappier animations
      normal: '200ms',
      slow: '400ms'
    },
    easing: {
      default: 'cubic-bezier(0.23, 1, 0.32, 1)',  // More dramatic easing
      sharp: 'cubic-bezier(0.55, 0, 0.1, 1)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }
}

// Claude Light Theme (matching claude.ai)
export const claudeLightTheme: Theme = {
  name: 'Claude Light',
  colors: {
    background: {
      primary: '#ffffff',      // Pure white background
      secondary: '#f7f7f8',    // Light gray for cards
      tertiary: '#f2f2f3',     // Slightly darker gray
      modal: 'rgba(255, 255, 255, 0.98)',
      card: '#fafafa'
    },
    text: {
      primary: '#1a1a1a',      // Dark text
      secondary: '#4a4a4a',    // Medium gray text
      tertiary: '#6a6a6a',     // Lighter gray text
      muted: '#8a8a8a',        // Muted text
      inverse: '#ffffff'       // White text on dark backgrounds
    },
    border: {
      primary: '#e5e5e7',      // Light gray borders (Claude's exact)
      secondary: '#f0f0f1',    // Very light borders
      focus: '#d4a574',        // Claude's orange/brown focus
      hover: '#d0d0d2'         // Slightly darker on hover
    },
    status: {
      success: '#059669',      // Green
      error: '#dc2626',        // Red
      warning: '#d97706',      // Orange
      info: '#2563eb'          // Blue
    },
    interactive: {
      primary: '#d4a574',      // Claude's beige/orange button color
      primaryHover: '#c99862', // Darker on hover
      secondary: '#f3f3f4',    // Light gray secondary
      secondaryHover: '#e8e8ea', // Darker gray on hover
      accent: '#dc8c48',       // Stronger orange accent
      accentHover: '#c97a3d'   // Darker orange on hover
    },
    terminal: {
      green: '#059669',
      blue: '#2563eb',
      yellow: '#eab308',
      orange: '#ea580c',
      purple: '#7c3aed',
      cyan: '#0891b2',
      red: '#dc2626',
      white: '#1a1a1a',        // Dark color in light theme
      gray: '#6b7280'
    },
    syntax: {
      keyword: '#1e40af',      // Dark blue
      string: '#b91c1c',       // Dark red
      number: '#059669',       // Green
      comment: '#6b7280',      // Gray
      function: '#7c2d12',     // Brown
      variable: '#4338ca'      // Indigo
    }
  },
  fonts: {
    mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: '"Crimson Text", Georgia, serif'
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
    sm: '0.375rem',   // 6px - Claude's border radius
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(212, 165, 116, 0.3)'
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

export const themes = {
  claudeCode: claudeCodeTheme,
  claudeLight: claudeLightTheme,
  futuristic: futuristicTheme
}

export type ThemeName = keyof typeof themes
