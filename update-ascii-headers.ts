#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs'
import { textToNodelay } from './src/utils/nodelay-font'

// Files to update with their specific headers
const filesToUpdate = [
  {
    path: './setup-wizard-simple.ts',
    oldHeader: ` ▄▄·▄▄▌  ·▄▄▄▄   ▄▄· ·▄▄▄▄  ▄▄▄ .    ▄▄·  ▄▄· 
▐█ ▌▐██•  ██▪ ██ ▐█ ▌▪██▪ ██ ▀▄.▀·   ▐█ ▌▪▐█ ▌▪
██ ▄▄██▪  ▐█· ▐█▌██ ▄▄▐█· ▐█▌▐▀▀▪▄   ██ ▄▄██ ▄▄
▐███▌▐█▌▐▌██. ██ ▐███▌██. ██ ▐█▄▄▌   ▐███▌▐███▌
·▀▀▀ .▀▀▀ ▀▀▀▀▀• ·▀▀▀ ▀▀▀▀▀•  ▀▀▀  ▀ ·▀▀▀ ·▀▀▀ `,
    newHeader: textToNodelay('CLAUDE CC')
  },
  {
    path: './check-setup.ts',
    oldHeader: ` ▄▄·▄▄▌  ·▄▄▄▄   ▄▄· ·▄▄▄▄  ▄▄▄ .    ▄▄·  ▄▄· 
▐█ ▌▐██•  ██▪ ██ ▐█ ▌▪██▪ ██ ▀▄.▀·   ▐█ ▌▪▐█ ▌▪
██ ▄▄██▪  ▐█· ▐█▌██ ▄▄▐█· ▐█▌▐▀▀▪▄   ██ ▄▄██ ▄▄
▐███▌▐█▌▐▌██. ██ ▐███▌██. ██ ▐█▄▄▌   ▐███▌▐███▌
·▀▀▀ .▀▀▀ ▀▀▀▀▀• ·▀▀▀ ▀▀▀▀▀•  ▀▀▀  ▀ ·▀▀▀ ·▀▀▀ `,
    newHeader: textToNodelay('CLAUDE CC')
  },
  {
    path: './src/worker-ultra.ts',
    oldHeader: ` ▄▄·▄▄▌  ·▄▄▄▄   ▄▄· ·▄▄▄▄  ▄▄▄ .    ▄▄·  ▄▄· 
▐█ ▌▐██•  ██▪ ██ ▐█ ▌▪██▪ ██ ▀▄.▀·   ▐█ ▌▪▐█ ▌▪
██ ▄▄██▪  ▐█· ▐█▌██ ▄▄▐█· ▐█▌▐▀▀▪▄   ██ ▄▄██ ▄▄
▐███▌▐█▌▐▌██. ██ ▐███▌██. ██ ▐█▄▄▌   ▐███▌▐███▌
·▀▀▀ .▀▀▀ ▀▀▀▀▀• ·▀▀▀ ▀▀▀▀▀•  ▀▀▀  ▀ ·▀▀▀ ·▀▀▀ `,
    newHeader: textToNodelay('CLAUDE CC')
  },
  {
    path: './docs/FREE_TIER_SETUP.md',
    oldHeader: `·▄▄▄▄▄▄ ▄▄▄ .▄▄▄ .    ▄▄▄▄▄▪  ▄▄▄ .▄▄▄  
▐▄▄·▀▄ █·▀▄.▀·▀▄.▀·   •██  ██ ▀▄.▀·▀▄ █·
██▪ ▐▀▀▄ ▐▀▀▪▄▐▀▀▪▄    ▐█.▪▐█·▐▀▀▪▄▐▀▀▄ 
██▌.▐█•█▌▐█▄▄▌▐█▄▄▌    ▐█▌·▐█▌▐█▄▄▌▐█•█▌
▀▀▀ .▀  ▀ ▀▀▀  ▀▀▀     ▀▀▀ ▀▀▀ ▀▀▀ .▀  ▀`,
    newHeader: textToNodelay('FREE TIER')
  }
]

// Additional headers in ASCII_HEADERS.md
const asciiHeaders = {
  'CLAUDE CC': textToNodelay('CLAUDE CC'),
  'SETUP': textToNodelay('SETUP'),
  'STATUS': textToNodelay('STATUS'),
  'DONE': textToNodelay('DONE'),
  'CLOUDFLARE': textToNodelay('CLOUDFLARE'),
  'FREE TIER': textToNodelay('FREE TIER'),
  'NEWS': textToNodelay('NEWS'),
  'API': textToNodelay('API'),
  'DATABASE': textToNodelay('DATABASE'),
  'SUCCESS': textToNodelay('SUCCESS'),
  'ERROR': textToNodelay('ERROR'),
  'CONFIG': textToNodelay('CONFIG')
}

console.log('Updating ASCII headers to NODELAY.TDF style...\n')

// Update specific files
for (const file of filesToUpdate) {
  try {
    let content = readFileSync(file.path, 'utf-8')
    
    // Replace the old header with new one
    if (content.includes(file.oldHeader)) {
      content = content.replace(file.oldHeader, file.newHeader)
      writeFileSync(file.path, content)
      console.log(`✓ Updated ${file.path}`)
    } else {
      console.log(`⚠ Could not find header in ${file.path}`)
    }
  } catch (error) {
    console.error(`✗ Error updating ${file.path}:`, error)
  }
}

// Generate new ASCII_HEADERS.md
const asciiHeadersContent = `# ASCII Headers - NODELAY.TDF Font Style

All headers now use the NODELAY.TDF font style for consistency. This font features box-drawing characters that create a distinctive terminal aesthetic.

## Main Banner
\`\`\`
${asciiHeaders['CLAUDE CC']}
\`\`\`

## Section Headers

### SETUP
\`\`\`
${asciiHeaders['SETUP']}
\`\`\`

### STATUS
\`\`\`
${asciiHeaders['STATUS']}
\`\`\`

### DONE
\`\`\`
${asciiHeaders['DONE']}
\`\`\`

### CLOUDFLARE
\`\`\`
${asciiHeaders['CLOUDFLARE']}
\`\`\`

### FREE TIER
\`\`\`
${asciiHeaders['FREE TIER']}
\`\`\`

### NEWS
\`\`\`
${asciiHeaders['NEWS']}
\`\`\`

### API
\`\`\`
${asciiHeaders['API']}
\`\`\`

### DATABASE
\`\`\`
${asciiHeaders['DATABASE']}
\`\`\`

### SUCCESS
\`\`\`
${asciiHeaders['SUCCESS']}
\`\`\`

### ERROR
\`\`\`
${asciiHeaders['ERROR']}
\`\`\`

### CONFIG
\`\`\`
${asciiHeaders['CONFIG']}
\`\`\`

## Usage

To use these headers in your code, simply copy and paste them. They're designed with the NODELAY.TDF font style which uses box-drawing characters for a clean, terminal-inspired look.

### Example in TypeScript:
\`\`\`typescript
import { textToNodelay } from '../src/utils/nodelay-font'

// Generate any text in NODELAY style
const header = textToNodelay('MY HEADER')
console.log(header)
\`\`\`

### Using the utility module:
\`\`\`typescript
import { NODELAY_HEADERS, printNodelay } from '../src/utils/nodelay-font'

// Use pre-generated headers
console.log(NODELAY_HEADERS.SETUP)

// Or create custom text
printNodelay('CUSTOM TEXT')
\`\`\`

### Font Information
The NODELAY.TDF font is a TheDraw font that uses box-drawing characters (╔═╗║╚╝╦╩╠╣╬) to create distinctive ASCII art. This implementation provides a simplified version optimized for web terminals and modern displays.`

try {
  writeFileSync('./docs/ASCII_HEADERS.md', asciiHeadersContent)
  console.log('✓ Updated docs/ASCII_HEADERS.md')
} catch (error) {
  console.error('✗ Error updating docs/ASCII_HEADERS.md:', error)
}

console.log('\nDone! ASCII headers have been updated to NODELAY.TDF style.')
console.log('\nExample of the new style:')
console.log(textToNodelay('CLAUDE CC'))