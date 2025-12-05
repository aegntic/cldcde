# Firebase Studio MCP Server

This server provides access to Firebase Studio and Google Cloud services through an MCP interface. It allows AI assistants to interact with Firebase projects programmatically.

## Features

- Full Firebase CLI integration
- Google Cloud SDK access
- Firebase Admin SDK capabilities
- Project management
- Firestore database operations
- Firebase Authentication
- Firebase Hosting deployment
- Firebase Storage operations
- Firebase Emulator Suite
- Realtime Database operations
- Firebase Extensions

## Installation

```bash
# Install from npm
npx @aegntic/firebase-studio-mcp

# Or install globally
npm install -g @aegntic/firebase-studio-mcp
```

## Setup

1. Run the setup script:
   ```
   ./setup.sh
   ```
   This will install and configure:
   - Firebase CLI
   - Google Cloud SDK 

2. Start the server:
   ```
   npm start
   ```

3. In Claude, add the server using the MCP toolbox:
   ```
   https://localhost:3000
   ```

## Available Methods

### Firebase Admin SDK

- `initializeFirebase`: Initialize Firebase Admin SDK with service account

### Firebase CLI

- `firebaseCommand`: Execute any Firebase CLI command directly
- `listProjects`: List all Firebase projects
- `useProject`: Set the current Firebase project
- `createProject`: Create a new Firebase project

### Firebase Hosting

- `deployHosting`: Deploy to Firebase Hosting

### Firestore Database

- `getDocument`: Get a document from Firestore
- `setDocument`: Set a document in Firestore
- `queryDocuments`: Query documents from Firestore

### Firebase Auth

- `createUser`: Create a new Firebase Auth user
- `getUser`: Get a Firebase Auth user by ID or email

### Firebase Storage

- `listFiles`: List files in Firebase Storage

### Google Cloud SDK

- `gcloudCommand`: Execute any Google Cloud CLI command

### Firebase Emulator Suite

- `startEmulators`: Start Firebase emulators

### Firebase Studio

- `openFirebaseConsole`: Get link to Firebase Console for current or specified project

### Firebase Extensions

- `listExtensions`: List available Firebase Extensions
- `installExtension`: Install a Firebase Extension

### Firebase Performance

- `getFirebasePerformance`: Get Firebase performance metrics

### Firebase A/B Testing

- `createABTest`: Create Firebase A/B Test via gcloud

### Firebase Realtime Database

- `getDatabaseValue`: Get value from Firebase Realtime Database
- `setDatabaseValue`: Set value in Firebase Realtime Database

### Google Auth

- `login`: Login to Firebase and Google Cloud

## Examples

### Initialize Firebase Admin SDK

```javascript
initializeFirebase({
  serviceAccountPath: "path/to/service-account.json",
  databaseURL: "https://your-project-id.firebaseio.com"
})
```

### Deploy to Firebase Hosting

```javascript
deployHosting({
  projectPath: "/path/to/project",
  only: true
})
```

### Query Firestore Documents

```javascript
queryDocuments({
  collection: "users",
  where: [
    ["status", "==", "active"],
    ["age", ">", 18]
  ],
  orderBy: {
    field: "created",
    direction: "desc"
  },
  limit: 10
})
```

### Execute Google Cloud Command

```javascript
gcloudCommand({
  service: "compute",
  command: "instances list",
  project: "your-project-id",
  json: true
})
```

## Requirements

- Node.js 14 or higher
- Firebase CLI
- Google Cloud SDK

## License

MIT
