/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Original Cyberpunk Theme
                cyber: {
                    neon: '#ff5e00',
                    blue: '#00f3ff',
                    dark: '#050505',
                    panel: '#0f0a0a',
                    border: '#2a1a1a',
                    dim: 'rgba(255, 94, 0, 0.1)',
                    glow: 'rgba(255, 94, 0, 0.5)',
                    'blue-dim': 'rgba(0, 243, 255, 0.1)',
                    'blue-glow': 'rgba(0, 243, 255, 0.5)'
                },
                // Luxury Theme (CSS Custom Properties for dynamic switching)
                luxury: {
                    // Backgrounds
                    'bg': 'var(--luxury-bg)',
                    'surface': 'var(--luxury-surface)',
                    'elevated': 'var(--luxury-elevated)',
                    'overlay': 'var(--luxury-overlay)',
                    // Primary (Gold/Silver)
                    'primary': 'var(--luxury-primary)',
                    'primary-hover': 'var(--luxury-primary-hover)',
                    'primary-dim': 'var(--luxury-primary-dim)',
                    'primary-glow': 'var(--luxury-primary-glow)',
                    // Secondary (Rose Gold/Gunmetal)
                    'secondary': 'var(--luxury-secondary)',
                    'secondary-hover': 'var(--luxury-secondary-hover)',
                    // Accent
                    'accent': 'var(--luxury-accent)',
                    'accent-subtle': 'var(--luxury-accent-subtle)',
                    // Text
                    'text': 'var(--luxury-text)',
                    'text-secondary': 'var(--luxury-text-secondary)',
                    'text-muted': 'var(--luxury-text-muted)',
                    'text-inverse': 'var(--luxury-text-inverse)',
                    // Borders
                    'border': 'var(--luxury-border)',
                    'border-subtle': 'var(--luxury-border-subtle)',
                    'border-accent': 'var(--luxury-border-accent)',
                },
                // Static Gold colors (for direct use)
                gold: {
                    50: '#FFFDF5',
                    100: '#FFF9E6',
                    200: '#FFF0C2',
                    300: '#FFE08A',
                    400: '#E5C158',
                    500: '#D4AF37',
                    600: '#B8962F',
                    700: '#8A7023',
                    800: '#5C4B17',
                    900: '#2E250C',
                },
                // Static Silver colors (for direct use)
                silver: {
                    50: '#FAFAFA',
                    100: '#F5F5F5',
                    200: '#E8E8E8',
                    300: '#D4D4D4',
                    400: '#A8A9AD',
                    500: '#71706E',
                    600: '#5C5C5C',
                    700: '#4A4A4A',
                    800: '#2D2D2D',
                    900: '#1A1A1A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Share Tech Mono', 'monospace'],
                cyber: ['Orbitron', 'sans-serif'],
                term: ['VT323', 'monospace'],
                // Luxury typography
                luxury: ['Playfair Display', 'serif'],
                'luxury-sans': ['Montserrat', 'sans-serif'],
            },
            boxShadow: {
                // Original Cyber shadows
                'neon': '0 0 5px theme("colors.cyber.neon"), 0 0 10px theme("colors.cyber.dim")',
                'neon-strong': '0 0 10px theme("colors.cyber.neon"), 0 0 20px theme("colors.cyber.glow")',
                'blue': '0 0 5px theme("colors.cyber.blue"), 0 0 10px theme("colors.cyber.blue-dim")',
                'blue-strong': '0 0 10px theme("colors.cyber.blue"), 0 0 20px theme("colors.cyber.blue-glow")',
                // Luxury shadows
                'luxury-glow': 'var(--luxury-glow)',
                'luxury-emboss': 'var(--luxury-emboss)',
                'luxury-card': '0 4px 20px rgba(0, 0, 0, 0.15)',
                'luxury-card-hover': '0 8px 30px rgba(0, 0, 0, 0.25)',
            },
            backgroundImage: {
                'luxury-gradient': 'var(--luxury-gradient)',
                'luxury-metallic': 'var(--luxury-metallic)',
            },
        }
    },
    plugins: [],
}
