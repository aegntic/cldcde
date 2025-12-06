/**
 * ANSI Shadow ASCII Art Generator
 * Converts text to ANSI Shadow style ASCII art
 * 
 * Usage:
 *   Node.js: node ansi-shadow-generator.js "Your Text"
 *   Browser: Copy the ANSIShadow class and use it directly
 */

const ANSIShadow = {
    // Character definitions using Unicode box-drawing and block characters
    chars: {
        'A': [
            ' █████╗ ',
            '██╔══██╗',
            '███████║',
            '██╔══██║',
            '██║  ██║',
            '╚═╝  ╚═╝'
        ],
        'B': [
            '██████╗ ',
            '██╔══██╗',
            '██████╔╝',
            '██╔══██╗',
            '██████╔╝',
            '╚═════╝ '
        ],
        'C': [
            ' ██████╗',
            '██╔════╝',
            '██║     ',
            '██║     ',
            '╚██████╗',
            ' ╚═════╝'
        ],
        'D': [
            '██████╗ ',
            '██╔══██╗',
            '██║  ██║',
            '██║  ██║',
            '██████╔╝',
            '╚═════╝ '
        ],
        'E': [
            '███████╗',
            '██╔════╝',
            '█████╗  ',
            '██╔══╝  ',
            '███████╗',
            '╚══════╝'
        ],
        'F': [
            '███████╗',
            '██╔════╝',
            '█████╗  ',
            '██╔══╝  ',
            '██║     ',
            '╚═╝     '
        ],
        'G': [
            ' ██████╗ ',
            '██╔════╝ ',
            '██║  ███╗',
            '██║   ██║',
            '╚██████╔╝',
            ' ╚═════╝ '
        ],
        'H': [
            '██╗  ██╗',
            '██║  ██║',
            '███████║',
            '██╔══██║',
            '██║  ██║',
            '╚═╝  ╚═╝'
        ],
        'I': [
            '██╗',
            '██║',
            '██║',
            '██║',
            '██║',
            '╚═╝'
        ],
        'J': [
            '     ██╗',
            '     ██║',
            '     ██║',
            '██   ██║',
            '╚█████╔╝',
            ' ╚════╝ '
        ],
        'K': [
            '██╗  ██╗',
            '██║ ██╔╝',
            '█████╔╝ ',
            '██╔═██╗ ',
            '██║  ██╗',
            '╚═╝  ╚═╝'
        ],
        'L': [
            '██╗     ',
            '██║     ',
            '██║     ',
            '██║     ',
            '███████╗',
            '╚══════╝'
        ],
        'M': [
            '███╗   ███╗',
            '████╗ ████║',
            '██╔████╔██║',
            '██║╚██╔╝██║',
            '██║ ╚═╝ ██║',
            '╚═╝     ╚═╝'
        ],
        'N': [
            '███╗   ██╗',
            '████╗  ██║',
            '██╔██╗ ██║',
            '██║╚██╗██║',
            '██║ ╚████║',
            '╚═╝  ╚═══╝'
        ],
        'O': [
            ' ██████╗ ',
            '██╔═══██╗',
            '██║   ██║',
            '██║   ██║',
            '╚██████╔╝',
            ' ╚═════╝ '
        ],
        'P': [
            '██████╗ ',
            '██╔══██╗',
            '██████╔╝',
            '██╔═══╝ ',
            '██║     ',
            '╚═╝     '
        ],
        'Q': [
            ' ██████╗ ',
            '██╔═══██╗',
            '██║   ██║',
            '██║▄▄ ██║',
            '╚██████╔╝',
            ' ╚══▀▀═╝ '
        ],
        'R': [
            '██████╗ ',
            '██╔══██╗',
            '██████╔╝',
            '██╔══██╗',
            '██║  ██║',
            '╚═╝  ╚═╝'
        ],
        'S': [
            '███████╗',
            '██╔════╝',
            '███████╗',
            '╚════██║',
            '███████║',
            '╚══════╝'
        ],
        'T': [
            '████████╗',
            '╚══██╔══╝',
            '   ██║   ',
            '   ██║   ',
            '   ██║   ',
            '   ╚═╝   '
        ],
        'U': [
            '██╗   ██╗',
            '██║   ██║',
            '██║   ██║',
            '██║   ██║',
            '╚██████╔╝',
            ' ╚═════╝ '
        ],
        'V': [
            '██╗   ██╗',
            '██║   ██║',
            '██║   ██║',
            '╚██╗ ██╔╝',
            ' ╚████╔╝ ',
            '  ╚═══╝  '
        ],
        'W': [
            '██╗    ██╗',
            '██║    ██║',
            '██║ █╗ ██║',
            '██║███╗██║',
            '╚███╔███╔╝',
            ' ╚══╝╚══╝ '
        ],
        'X': [
            '██╗  ██╗',
            '╚██╗██╔╝',
            ' ╚███╔╝ ',
            ' ██╔██╗ ',
            '██╔╝ ██╗',
            '╚═╝  ╚═╝'
        ],
        'Y': [
            '██╗   ██╗',
            '╚██╗ ██╔╝',
            ' ╚████╔╝ ',
            '  ╚██╔╝  ',
            '   ██║   ',
            '   ╚═╝   '
        ],
        'Z': [
            '███████╗',
            '╚══███╔╝',
            '  ███╔╝ ',
            ' ███╔╝  ',
            '███████╗',
            '╚══════╝'
        ],
        '0': [
            ' ██████╗ ',
            '██╔═████╗',
            '██║██╔██║',
            '████╔╝██║',
            '╚██████╔╝',
            ' ╚═════╝ '
        ],
        '1': [
            ' ██╗',
            '███║',
            '╚██║',
            ' ██║',
            ' ██║',
            ' ╚═╝'
        ],
        '2': [
            '██████╗ ',
            '╚════██╗',
            ' █████╔╝',
            '██╔═══╝ ',
            '███████╗',
            '╚══════╝'
        ],
        '3': [
            '██████╗ ',
            '╚════██╗',
            ' █████╔╝',
            ' ╚═══██╗',
            '██████╔╝',
            '╚═════╝ '
        ],
        '4': [
            '██╗  ██╗',
            '██║  ██║',
            '███████║',
            '╚════██║',
            '     ██║',
            '     ╚═╝'
        ],
        '5': [
            '███████╗',
            '██╔════╝',
            '███████╗',
            '╚════██║',
            '███████║',
            '╚══════╝'
        ],
        '6': [
            ' ██████╗ ',
            '██╔════╝ ',
            '███████╗ ',
            '██╔═══██╗',
            '╚██████╔╝',
            ' ╚═════╝ '
        ],
        '7': [
            '███████╗',
            '╚════██║',
            '    ██╔╝',
            '   ██╔╝ ',
            '   ██║  ',
            '   ╚═╝  '
        ],
        '8': [
            ' █████╗ ',
            '██╔══██╗',
            '╚█████╔╝',
            '██╔══██╗',
            '╚█████╔╝',
            ' ╚════╝ '
        ],
        '9': [
            ' █████╗ ',
            '██╔══██╗',
            '╚██████║',
            ' ╚═══██║',
            ' █████╔╝',
            ' ╚════╝ '
        ],
        ' ': [
            '   ',
            '   ',
            '   ',
            '   ',
            '   ',
            '   '
        ],
        '!': [
            '██╗',
            '██║',
            '██║',
            '╚═╝',
            '██╗',
            '╚═╝'
        ],
        '?': [
            '██████╗ ',
            '╚════██╗',
            '  ▄███╔╝',
            '  ▀▀══╝ ',
            '  ██╗   ',
            '  ╚═╝   '
        ],
        '.': [
            '   ',
            '   ',
            '   ',
            '   ',
            '██╗',
            '╚═╝'
        ],
        ',': [
            '   ',
            '   ',
            '   ',
            '   ',
            '▄█╗',
            '╚═╝'
        ],
        ':': [
            '   ',
            '██╗',
            '╚═╝',
            '██╗',
            '╚═╝',
            '   '
        ],
        ';': [
            '   ',
            '██╗',
            '╚═╝',
            '▄█╗',
            '▀═╝',
            '   '
        ],
        '-': [
            '        ',
            '        ',
            '███████╗',
            '╚══════╝',
            '        ',
            '        '
        ],
        '+': [
            '       ',
            '  ██╗  ',
            '██████╗',
            '╚═██╔═╝',
            '  ╚═╝  ',
            '       '
        ],
        '=': [
            '        ',
            '███████╗',
            '╚══════╝',
            '███████╗',
            '╚══════╝',
            '        '
        ],
        '_': [
            '        ',
            '        ',
            '        ',
            '        ',
            '███████╗',
            '╚══════╝'
        ],
        '/': [
            '    ██╗',
            '   ██╔╝',
            '  ██╔╝ ',
            ' ██╔╝  ',
            '██╔╝   ',
            '╚═╝    '
        ],
        '\\': [
            '██╗    ',
            '╚██╗   ',
            ' ╚██╗  ',
            '  ╚██╗ ',
            '   ╚██╗',
            '    ╚═╝'
        ],
        '(': [
            ' ██╗',
            '██╔╝',
            '██║ ',
            '██║ ',
            '╚██╗',
            ' ╚═╝'
        ],
        ')': [
            '██╗ ',
            '╚██╗',
            ' ██║',
            ' ██║',
            '██╔╝',
            '╚═╝ '
        ],
        '[': [
            '███╗',
            '██╔╝',
            '██║ ',
            '██║ ',
            '███╗',
            '╚══╝'
        ],
        ']': [
            '███╗',
            '╚██║',
            ' ██║',
            ' ██║',
            '███║',
            '╚══╝'
        ],
        '{': [
            '  ██╗',
            ' ██╔╝',
            '██╔╝ ',
            '╚██╗ ',
            ' ╚██╗',
            '  ╚═╝'
        ],
        '}': [
            '██╗  ',
            '╚██╗ ',
            ' ╚██╗',
            ' ██╔╝',
            '██╔╝ ',
            '╚═╝  '
        ],
        '<': [
            '  ██╗',
            ' ██╔╝',
            '██╔╝ ',
            '╚██╗ ',
            ' ╚██╗',
            '  ╚═╝'
        ],
        '>': [
            '██╗  ',
            '╚██╗ ',
            ' ╚██╗',
            ' ██╔╝',
            '██╔╝ ',
            '╚═╝  '
        ],
        '#': [
            ' ██╗ ██╗ ',
            '████████╗',
            '╚██╔═██╔╝',
            '████████╗',
            '╚██╔═██╔╝',
            ' ╚═╝ ╚═╝ '
        ],
        '@': [
            ' ██████╗ ',
            '██╔═══██╗',
            '██║██╗██║',
            '██║██║██║',
            '╚█║████╔╝',
            ' ╚╝╚═══╝ '
        ],
        '$': [
            '▄▄███▄▄·',
            '██╔════╝',
            '███████╗',
            '╚════██║',
            '███████║',
            '╚═▀▀▀══╝'
        ],
        '%': [
            '██╗ ██╗',
            '╚═╝██╔╝',
            '  ██╔╝ ',
            ' ██╔╝  ',
            '██╔╝██╗',
            '╚═╝ ╚═╝'
        ],
        '^': [
            ' ███╗ ',
            '██╔██╗',
            '╚═╝╚═╝',
            '      ',
            '      ',
            '      '
        ],
        '&': [
            '   ██╗   ',
            '   ██║   ',
            '████████╗',
            '██╔═██╔═╝',
            '██████║  ',
            '╚═════╝  '
        ],
        '*': [
            '      ',
            '▄ ██╗▄',
            ' ████╗',
            '▀╚██╔▀',
            '  ╚═╝ ',
            '      '
        ],
        '\'': [
            '██╗',
            '╚█║',
            ' ╚╝',
            '   ',
            '   ',
            '   '
        ],
        '"': [
            '██╗██╗',
            '╚█║╚█║',
            ' ╚╝ ╚╝',
            '      ',
            '      ',
            '      '
        ],
        '`': [
            '██╗',
            '╚██╗',
            ' ╚═╝',
            '    ',
            '    ',
            '    '
        ]
    },

    /**
     * Convert text to ANSI Shadow ASCII art
     * @param {string} text - Text to convert
     * @returns {string} ASCII art representation
     */
    render(text) {
        const upperText = text.toUpperCase();
        const lines = ['', '', '', '', '', ''];

        for (const char of upperText) {
            const charDef = this.chars[char] || this.chars[' '];
            for (let i = 0; i < 6; i++) {
                lines[i] += charDef[i];
            }
        }

        return lines.join('\n');
    },

    /**
     * Render with custom spacing between characters
     * @param {string} text - Text to convert
     * @param {number} spacing - Number of spaces between characters (default: 0)
     * @returns {string} ASCII art representation
     */
    renderWithSpacing(text, spacing = 0) {
        const upperText = text.toUpperCase();
        const lines = ['', '', '', '', '', ''];
        const spacer = ' '.repeat(spacing);

        for (let c = 0; c < upperText.length; c++) {
            const char = upperText[c];
            const charDef = this.chars[char] || this.chars[' '];
            for (let i = 0; i < 6; i++) {
                lines[i] += charDef[i] + (c < upperText.length - 1 ? spacer : '');
            }
        }

        return lines.join('\n');
    },

    /**
     * Get array of lines instead of joined string
     * @param {string} text - Text to convert
     * @returns {string[]} Array of ASCII art lines
     */
    renderLines(text) {
        return this.render(text).split('\n');
    },

    /**
     * Render for HTML display (with &nbsp; for spaces and <br> for newlines)
     * @param {string} text - Text to convert
     * @returns {string} HTML-safe ASCII art
     */
    renderHTML(text) {
        return this.render(text)
            .replace(/ /g, '&nbsp;')
            .replace(/\n/g, '<br>');
    },

    /**
     * Render with ANSI color codes for terminal
     * @param {string} text - Text to convert
     * @param {string} color - ANSI color code (e.g., '\x1b[32m' for green)
     * @returns {string} Colored ASCII art
     */
    renderColored(text, color = '\x1b[32m') {
        const reset = '\x1b[0m';
        return color + this.render(text) + reset;
    },

    /**
     * List all available characters
     * @returns {string[]} Array of available characters
     */
    getAvailableChars() {
        return Object.keys(this.chars);
    }
};

// CLI usage
if (typeof process !== 'undefined' && process.argv && process.argv[2]) {
    const text = process.argv.slice(2).join(' ');
    const useColor = process.argv.includes('--color') || process.argv.includes('-c');

    if (useColor) {
        // Filter out the color flag from text
        const filteredText = process.argv.slice(2).filter(arg => arg !== '--color' && arg !== '-c').join(' ');
        console.log(ANSIShadow.renderColored(filteredText, '\x1b[32m')); // Green
    } else {
        console.log(ANSIShadow.render(text));
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ANSIShadow;
}

// Export for ES modules
if (typeof exports !== 'undefined') {
    exports.ANSIShadow = ANSIShadow;
}
