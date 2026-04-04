import React from 'react';

interface ASCIILogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

// ANSI Shadow font style for CLDCDE.CC
// Tiny version for navbar
const ASCIILogo: React.FC<ASCIILogoProps> = ({ size = 'sm', className = '' }) => {
    // Extra small - single line stylized
    const logoXS = `█▀▀ █   █▀▄ █▀▀ █▀▄ █▀▀ ░ █▀▀ █▀▀`;
    const logoXS2 = `█▄▄ █▄▄ █▄▀ █▄▄ █▄▀ ██▄ ▄ █▄▄ █▄▄`;

    // Small - 2 lines (for navbar)
    const logoSM = [
        `╔═╗╦  ╔╦╗╔═╗╔╦╗╔═╗  ╔═╗╔═╗`,
        `╚═╝╩═╝═╩╝╚═╝═╩╝╚═╝░░╚═╝╚═╝`
    ];

    // Medium - ANSI Shadow style
    const logoMD = [
        `█▀▀ █   █▀▄ █▀▀ █▀▄ █▀▀   █▀▀ █▀▀`,
        `█   █   █ █ █   █ █ █▀▀   █   █   `,
        `▀▀▀ ▀▀▀ ▀▀  ▀▀▀ ▀▀  ▀▀▀ ▀ ▀▀▀ ▀▀▀`
    ];

    const sizeStyles = {
        xs: 'text-[6px] leading-[6px]',
        sm: 'text-[8px] leading-[8px]',
        md: 'text-[10px] leading-[10px]',
        lg: 'text-[12px] leading-[12px]'
    };

    const getLogoLines = () => {
        switch (size) {
            case 'xs':
                return [logoXS, logoXS2];
            case 'sm':
                return logoSM;
            case 'md':
            case 'lg':
            default:
                return logoMD;
        }
    };

    return (
        <pre
            className={`
        font-mono whitespace-pre select-none
        ascii-logo-silver
        ${sizeStyles[size]}
        ${className}
      `}
            aria-label="CLDCDE.CC"
        >
            {getLogoLines().join('\n')}
        </pre>
    );
};

export default ASCIILogo;
