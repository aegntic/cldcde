import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode } from '../themes/luxury';

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
    isGold: boolean;
    isSilver: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'cldcde-luxury-theme';

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    defaultTheme = 'dark'
}) => {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        // Check localStorage first
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'dark' || stored === 'light') {
                return stored;
            }
            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
        }
        return defaultTheme;
    });

    // Apply theme class to document
    useEffect(() => {
        const root = document.documentElement;

        // Remove previous theme classes
        root.classList.remove('luxury-gold', 'luxury-silver', 'dark', 'light');

        // Add current theme classes
        if (theme === 'dark') {
            root.classList.add('luxury-gold', 'dark');
        } else {
            root.classList.add('luxury-silver', 'light');
        }

        // Store preference
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

        const handler = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem(STORAGE_KEY);
            // Only auto-switch if user hasn't manually set a preference
            if (!stored) {
                setThemeState(e.matches ? 'light' : 'dark');
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            setTheme,
            isGold: theme === 'dark',
            isSilver: theme === 'light',
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Hook for conditional rendering based on theme
export const useThemeValue = <T,>(goldValue: T, silverValue: T): T => {
    const { isGold } = useTheme();
    return isGold ? goldValue : silverValue;
};
