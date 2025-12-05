# zkFlow.pro Chrome Extension

Zero Knowledge Form Flow Pro - A smart form automation tool that saves time by recording and replaying complex form filling sequences.

## Features

- 🎯 **Smart Form Detection**: Automatically detects and identifies form fields
- 🔐 **Secure Local Storage**: All data stored locally, no cloud sync
- ⚡ **One-Click Replay**: Instantly replay saved workflows
- ⌨️ **Keyboard Shortcuts**: Quick access to your most-used flows
- 🔄 **Multi-Step Support**: Handle complex, multi-page forms
- 🎨 **Modern UI**: Clean, intuitive interface

## Installation

### From Source
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` directory

### Building
```bash
npm install
npm run build
```

### Packaging
```bash
npm run package
```

This creates a `zkflow-pro.zip` file ready for distribution.

## Usage

### Recording a Flow
1. Click the zkFlow icon in your browser toolbar
2. Navigate to the "Record" tab
3. Click "Start Recording"
4. Fill out your form as usual
5. Click "Stop Recording"
6. Name your flow and save

### Playing a Flow
1. Click the zkFlow icon
2. Select a saved flow
3. Click "Play Flow"
4. Watch as your form is filled automatically

### Keyboard Shortcuts
- `Ctrl+Shift+1` (Mac: `⌘⇧1`) - Play flow #1
- `Ctrl+Shift+2` (Mac: `⌘⇧2`) - Play flow #2
- `Ctrl+Shift+3` (Mac: `⌘⇧3`) - Play flow #3
- `Ctrl+Shift+R` (Mac: `⌘⇧R`) - Start/Stop recording

## Privacy & Security

- All data is stored locally on your device
- No data is ever transmitted to external servers
- No analytics or tracking
- Open source and auditable

## Development

### Project Structure
```
extension/
├── manifest.json           # Extension manifest (v3)
├── src/
│   ├── popup/             # Extension popup UI
│   ├── background/        # Service worker
│   ├── content/           # Content scripts
│   └── options/           # Options page
├── assets/
│   └── icons/            # Extension icons
└── package.json          # Build configuration
```

### Key Technologies
- Manifest V3
- Service Workers
- Content Scripts
- Chrome Storage API
- Modern JavaScript (ES6+)

## License

MIT License - see LICENSE file for details

## Support

For support, documentation, or feature requests, visit [zkflow.pro](https://zkflow.pro)