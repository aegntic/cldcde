import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    name: string
    background: string
    foreground: string
    primary: string
    secondary: string
    accent: string
    error: string
    warning: string
    success: string
    border: string
    shadow: string
    hover: string
    terminal: {
      green: string
      red: string
      yellow: string
      blue: string
      magenta: string
      cyan: string
    }
  }
}