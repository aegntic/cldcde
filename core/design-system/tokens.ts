/**
 * CLDCDE+ Unified Design System
 * 
 * A comprehensive design token system that unifies all components
 * across the cldcde.cc marketplace ecosystem.
 * 
 * @package @cld/design-tokens
 * @version 1.0.0
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
    // Primary Brand Colors
    brand: {
        primary: '#2563eb',      // Electric Blue - Main brand color
        primaryLight: '#3b82f6', // Lighter blue for hovers
        primaryDark: '#1d4ed8',  // Darker blue for active states
        secondary: '#eab308',    // Hazard Yellow - Accent/CTA
        secondaryLight: '#facc15',
        secondaryDark: '#ca8a04',
    },

    // Neutral Colors (Dark-first design)
    neutral: {
        50: '#fafafa',   // Lightest (for light mode backgrounds)
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',  // Card backgrounds
        900: '#18181b',  // Main background
        950: '#0a0a0b',  // Deepest black
    },

    // Semantic Colors
    semantic: {
        success: '#10b981',      // Emerald
        successLight: '#34d399',
        successDark: '#059669',
        warning: '#f59e0b',      // Amber
        warningLight: '#fbbf24',
        warningDark: '#d97706',
        error: '#ef4444',        // Red
        errorLight: '#f87171',
        errorDark: '#dc2626',
        info: '#3b82f6',         // Blue
        infoLight: '#60a5fa',
        infoDark: '#2563eb',
    },

    // Terminal/Syntax Colors (for code displays)
    terminal: {
        green: '#22d3ee',        // Cyan-green
        blue: '#3b82f6',         // Bright blue
        yellow: '#eab308',       // Hazard yellow
        orange: '#f97316',       // Burnt orange
        purple: '#a78bfa',       // Light purple
        cyan: '#06b6d4',         // Cyan
        red: '#f87171',          // Light red
        pink: '#f472b6',         // Pink
    },

    // Syntax Highlighting
    syntax: {
        keyword: '#60a5fa',      // Light blue
        string: '#f97316',       // Burnt orange
        number: '#22d3ee',       // Cyan
        comment: '#64748b',      // Slate gray
        function: '#eab308',     // Hazard yellow
        variable: '#a78bfa',     // Light purple
        type: '#2dd4bf',         // Teal
        constant: '#f472b6',     // Pink
    },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
    fonts: {
        mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, "Liberation Mono", monospace',
        sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    },

    sizes: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
    },

    weights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    lineHeights: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
    },

    letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
    },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
    px: '1px',
    0: '0',
    0.5: '0.125rem',   // 2px
    1: '0.25rem',      // 4px
    1.5: '0.375rem',   // 6px
    2: '0.5rem',       // 8px
    2.5: '0.625rem',   // 10px
    3: '0.75rem',      // 12px
    3.5: '0.875rem',   // 14px
    4: '1rem',         // 16px
    5: '1.25rem',      // 20px
    6: '1.5rem',       // 24px
    7: '1.75rem',      // 28px
    8: '2rem',         // 32px
    9: '2.25rem',      // 36px
    10: '2.5rem',      // 40px
    11: '2.75rem',     // 44px
    12: '3rem',        // 48px
    14: '3.5rem',      // 56px
    16: '4rem',        // 64px
    20: '5rem',        // 80px
    24: '6rem',        // 96px
    28: '7rem',        // 112px
    32: '8rem',        // 128px
} as const;

// ============================================================================
// BORDERS & RADIUS
// ============================================================================

export const borders = {
    width: {
        none: '0',
        thin: '1px',
        medium: '2px',
        thick: '4px',
    },

    radius: {
        none: '0',
        sm: '0.125rem',    // 2px
        md: '0.25rem',     // 4px
        lg: '0.5rem',      // 8px
        xl: '0.75rem',     // 12px
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
        full: '9999px',
    },
} as const;

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

    // Glow effects for buttons and highlights
    glow: {
        primary: '0 0 20px rgba(37, 99, 235, 0.4)',
        secondary: '0 0 20px rgba(234, 179, 8, 0.4)',
        success: '0 0 20px rgba(16, 185, 129, 0.4)',
        error: '0 0 20px rgba(239, 68, 68, 0.4)',
    },
} as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
    duration: {
        instant: '0ms',
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        slower: '500ms',
    },

    easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    keyframes: {
        spin: 'spin 1s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        bounce: 'bounce 1s infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
    },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
    hide: -1,
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    toast: 1500,
    tooltip: 1600,
} as const;

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

export interface CLDCDETheme {
    name: string;
    mode: 'dark' | 'light';
    colors: {
        bg: {
            primary: string;
            secondary: string;
            tertiary: string;
            elevated: string;
            overlay: string;
        };
        text: {
            primary: string;
            secondary: string;
            muted: string;
            inverse: string;
        };
        border: {
            primary: string;
            secondary: string;
            focus: string;
        };
        interactive: {
            primary: string;
            primaryHover: string;
            secondary: string;
            secondaryHover: string;
            accent: string;
            accentHover: string;
        };
    };
}

// Dark Theme (Default)
export const darkTheme: CLDCDETheme = {
    name: 'CLDCDE+ Dark',
    mode: 'dark',
    colors: {
        bg: {
            primary: colors.neutral[950],
            secondary: colors.neutral[900],
            tertiary: colors.neutral[800],
            elevated: colors.neutral[700],
            overlay: 'rgba(10, 10, 11, 0.95)',
        },
        text: {
            primary: colors.neutral[50],
            secondary: colors.neutral[400],
            muted: colors.neutral[500],
            inverse: colors.neutral[950],
        },
        border: {
            primary: colors.neutral[700],
            secondary: colors.neutral[800],
            focus: colors.brand.primary,
        },
        interactive: {
            primary: colors.brand.primary,
            primaryHover: colors.brand.primaryLight,
            secondary: colors.neutral[700],
            secondaryHover: colors.neutral[600],
            accent: colors.brand.secondary,
            accentHover: colors.brand.secondaryLight,
        },
    },
};

// Light Theme
export const lightTheme: CLDCDETheme = {
    name: 'CLDCDE+ Light',
    mode: 'light',
    colors: {
        bg: {
            primary: colors.neutral[50],
            secondary: colors.neutral[100],
            tertiary: colors.neutral[200],
            elevated: '#ffffff',
            overlay: 'rgba(250, 250, 250, 0.95)',
        },
        text: {
            primary: colors.neutral[900],
            secondary: colors.neutral[600],
            muted: colors.neutral[400],
            inverse: colors.neutral[50],
        },
        border: {
            primary: colors.neutral[300],
            secondary: colors.neutral[200],
            focus: colors.brand.primary,
        },
        interactive: {
            primary: colors.brand.primary,
            primaryHover: colors.brand.primaryDark,
            secondary: colors.neutral[200],
            secondaryHover: colors.neutral[300],
            accent: colors.brand.secondaryDark,
            accentHover: colors.brand.secondary,
        },
    },
};

// Export all themes
export const themes = {
    dark: darkTheme,
    light: lightTheme,
} as const;

export type ThemeName = keyof typeof themes;

// ============================================================================
// CSS CUSTOM PROPERTIES GENERATOR
// ============================================================================

export function generateCSSVariables(theme: CLDCDETheme): string {
    return `
    --cld-bg-primary: ${theme.colors.bg.primary};
    --cld-bg-secondary: ${theme.colors.bg.secondary};
    --cld-bg-tertiary: ${theme.colors.bg.tertiary};
    --cld-bg-elevated: ${theme.colors.bg.elevated};
    --cld-bg-overlay: ${theme.colors.bg.overlay};
    
    --cld-text-primary: ${theme.colors.text.primary};
    --cld-text-secondary: ${theme.colors.text.secondary};
    --cld-text-muted: ${theme.colors.text.muted};
    --cld-text-inverse: ${theme.colors.text.inverse};
    
    --cld-border-primary: ${theme.colors.border.primary};
    --cld-border-secondary: ${theme.colors.border.secondary};
    --cld-border-focus: ${theme.colors.border.focus};
    
    --cld-interactive-primary: ${theme.colors.interactive.primary};
    --cld-interactive-primary-hover: ${theme.colors.interactive.primaryHover};
    --cld-interactive-secondary: ${theme.colors.interactive.secondary};
    --cld-interactive-secondary-hover: ${theme.colors.interactive.secondaryHover};
    --cld-interactive-accent: ${theme.colors.interactive.accent};
    --cld-interactive-accent-hover: ${theme.colors.interactive.accentHover};
    
    --cld-brand-primary: ${colors.brand.primary};
    --cld-brand-secondary: ${colors.brand.secondary};
    
    --cld-success: ${colors.semantic.success};
    --cld-warning: ${colors.semantic.warning};
    --cld-error: ${colors.semantic.error};
    --cld-info: ${colors.semantic.info};
  `.trim();
}
