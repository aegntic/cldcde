# ASCII Headers - NODELAY.TDF Font Style

All headers now use the NODELAY.TDF font style for consistency. This font features box-drawing characters that create a distinctive terminal aesthetic.

## Main Banner
```
╔═╗ ╦   ╔═╗ ╦ ╦ ╔╦╗ ╔═╗     ╔═╗ ╔═╗ 
║   ║   ╠═╣ ║ ║ ║║║ ╠═      ║   ║   
╚═╝ ╚═╝ ╩ ╩ ╚═╝ ╚╩╝ ╚═╝     ╚═╝ ╚═╝ 
```

## Section Headers

### SETUP
```
╔═╗ ╔═╗ ╔╦╗ ╦ ╦ ╔═╗ 
╚═╗ ╠═   ║  ║ ║ ╠═╝ 
╚═╝ ╚═╝  ╩  ╚═╝ ╩   
```

### STATUS
```
╔═╗ ╔╦╗ ╔═╗ ╔╦╗ ╦ ╦ ╔═╗ 
╚═╗  ║  ╠═╣  ║  ║ ║ ╚═╗ 
╚═╝  ╩  ╩ ╩  ╩  ╚═╝ ╚═╝ 
```

### DONE
```
╔╦╗ ╔═╗ ╔╗╔ ╔═╗ 
║║║ ║ ║ ║║║ ╠═  
╚╩╝ ╚═╝ ╝╚╝ ╚═╝ 
```

### CLOUDFLARE
```
╔═╗ ╦   ╔═╗ ╦ ╦ ╔╦╗ ╔═╗ ╦   ╔═╗ ╔═╗ ╔═╗ 
║   ║   ║ ║ ║ ║ ║║║ ╠═  ║   ╠═╣ ╠╦╝ ╠═  
╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚╩╝ ╩   ╚═╝ ╩ ╩ ╩╚═ ╚═╝ 
```

### FREE TIER
```
╔═╗ ╔═╗ ╔═╗ ╔═╗     ╔╦╗ ╦ ╔═╗ ╔═╗ 
╠═  ╠╦╝ ╠═  ╠═       ║  ║ ╠═  ╠╦╝ 
╩   ╩╚═ ╚═╝ ╚═╝      ╩  ╩ ╚═╝ ╩╚═ 
```

### NEWS
```
╔╗╔ ╔═╗ ╦ ╦ ╔═╗ 
║║║ ╠═  ║║║ ╚═╗ 
╝╚╝ ╚═╝ ╚╩╝ ╚═╝ 
```

### API
```
╔═╗ ╔═╗ ╦ 
╠═╣ ╠═╝ ║ 
╩ ╩ ╩   ╩ 
```

### DATABASE
```
╔╦╗ ╔═╗ ╔╦╗ ╔═╗ ╔╗  ╔═╗ ╔═╗ ╔═╗ 
║║║ ╠═╣  ║  ╠═╣ ╠╩╗ ╠═╣ ╚═╗ ╠═  
╚╩╝ ╩ ╩  ╩  ╩ ╩ ╚═╝ ╩ ╩ ╚═╝ ╚═╝ 
```

### SUCCESS
```
╔═╗ ╦ ╦ ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗ 
╚═╗ ║ ║ ║   ║   ╠═  ╚═╗ ╚═╗ 
╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ 
```

### ERROR
```
╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗ 
╠═  ╠╦╝ ╠╦╝ ║ ║ ╠╦╝ 
╚═╝ ╩╚═ ╩╚═ ╚═╝ ╩╚═ 
```

### CONFIG
```
╔═╗ ╔═╗ ╔╗╔ ╔═╗ ╦ ╔═╗ 
║   ║ ║ ║║║ ╠═  ║ ║ ╦ 
╚═╝ ╚═╝ ╝╚╝ ╩   ╩ ╚═╝ 
```

## Usage

To use these headers in your code, simply copy and paste them. They're designed with the NODELAY.TDF font style which uses box-drawing characters for a clean, terminal-inspired look.

### Example in TypeScript:
```typescript
import { textToNodelay } from '../src/utils/nodelay-font'

// Generate any text in NODELAY style
const header = textToNodelay('MY HEADER')
console.log(header)
```

### Using the utility module:
```typescript
import { NODELAY_HEADERS, printNodelay } from '../src/utils/nodelay-font'

// Use pre-generated headers
console.log(NODELAY_HEADERS.SETUP)

// Or create custom text
printNodelay('CUSTOM TEXT')
```

### Font Information
The NODELAY.TDF font is a TheDraw font that uses box-drawing characters (╔═╗║╚╝╦╩╠╣╬) to create distinctive ASCII art. This implementation provides a simplified version optimized for web terminals and modern displays.