import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
    className?: string;
    size?: number;
    showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
    className = '',
    size = 20,
    showLabel = false
}) => {
    const { theme, toggleTheme, isGold } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative flex items-center gap-2 px-3 py-2 rounded-lg
        transition-all duration-300 ease-out
        ${isGold
                    ? 'bg-luxury-surface border border-luxury-border hover:border-luxury-primary hover:shadow-luxury-glow'
                    : 'bg-luxury-surface border border-luxury-border hover:border-luxury-primary hover:shadow-luxury-glow'
                }
        group
        ${className}
      `}
            aria-label={`Switch to ${isGold ? 'Silver Mist' : 'Gold Rush'} theme`}
            title={isGold ? 'Switch to Silver (Light Mode)' : 'Switch to Gold (Dark Mode)'}
        >
            {/* Icon Container with Flip Animation */}
            <div className="relative w-5 h-5 overflow-hidden">
                {/* Moon (Gold/Dark Mode) */}
                <Moon
                    size={size}
                    className={`
            absolute inset-0 transition-all duration-300
            ${isGold
                            ? 'opacity-100 rotate-0 text-luxury-primary'
                            : 'opacity-0 -rotate-90 text-luxury-primary'
                        }
          `}
                    fill={isGold ? 'currentColor' : 'none'}
                />

                {/* Sun (Silver/Light Mode) */}
                <Sun
                    size={size}
                    className={`
            absolute inset-0 transition-all duration-300
            ${isGold
                            ? 'opacity-0 rotate-90 text-luxury-primary'
                            : 'opacity-100 rotate-0 text-luxury-primary'
                        }
          `}
                />
            </div>

            {/* Optional Label */}
            {showLabel && (
                <span className="text-xs font-mono font-bold text-luxury-text-secondary group-hover:text-luxury-primary transition-colors">
                    {isGold ? 'GOLD' : 'SILVER'}
                </span>
            )}

            {/* Subtle shimmer effect */}
            <div
                className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100
          transition-opacity duration-300 pointer-events-none
          ${isGold
                        ? 'bg-gradient-to-r from-transparent via-luxury-primary/10 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-luxury-primary/20 to-transparent'
                    }
        `}
            />
        </button>
    );
};

export default ThemeToggle;
