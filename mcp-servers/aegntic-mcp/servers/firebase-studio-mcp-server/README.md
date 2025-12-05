# Firebase Studio MCP Server

This MCP server provides a comprehensive interface to Firebase and Google Cloud services, allowing Claude to manage Firebase projects, databases, authentication, storage, hosting, and more.

## Features

- **Firebase Project Management**: Create, list, and manage Firebase projects
- **Authentication**: Create and manage Firebase Auth users
- **Database Operations**: 
  - Firestore document management
  - Realtime Database operations
- **Storage**: List and manage files in Firebase Storage
- **Hosting**: Deploy sites to Firebase Hosting
- **Emulators**: Start and manage Firebase Emulator Suite
- **Extensions**: List and install Firebase Extensions
- **Google Cloud Integration**: Execute Google Cloud CLI commands

## Installation

```bash
# Install from npm
npx @aegntic/firebase-studio-mcp-server

# Or install globally
npm install -g @aegntic/firebase-studio-mcp-server
```

## Requirements

The server requires the following tools to be installed:

- Node.js and npm
- Firebase CLI
- Google Cloud SDK

The setup script can help install these dependencies if they're not already available.

## Getting Started

1. Run the server:

```bash
firebase-studio-mcp-server
```

2. Connect to the server from Claude using the MCP interface.

3. Initialize Firebase:

```javascript
initializeFirebase({
  serviceAccountPath: "/path/to/service-account.json" 
})
```

## Available Methods

### Firebase Project Management

- `listProjects()`: List all Firebase projects
- `useProject({ projectId })`: Set current Firebase project
- `createProject({ projectId, displayName })`: Create a new Firebase project

### Firebase Auth

- `createUser({ email, password, displayName, phoneNumber })`: Create a new user
- `getUser({ uid, email })`: Get user details

### Firestore

- `getDocument({ collection, documentId })`: Get a document from Firestore
- `setDocument({ collection, documentId, data, merge })`: Set a document in Firestore
- `queryDocuments({ collection, where, orderBy, limit })`: Query documents from Firestore

### Firebase Storage

- `listFiles({ prefix, maxResults })`: List files in Firebase Storage

### Firebase Hosting

- `deployHosting({ projectPath, only })`: Deploy to Firebase Hosting

### Realtime Database

- `getDatabaseValue({ path, projectId, instance })`: Get value from Realtime Database
- `setDatabaseValue({ path, data, projectId, instance })`: Set value in Realtime Database

### Firebase Emulators

- `startEmulators({ services, projectPath })`: Start Firebase emulators

### Google Cloud SDK

- `gcloudCommand({ service, command, args, project, json })`: Execute Google Cloud CLI commands

## Example Usage

```javascript
// Initialize Firebase
initializeFirebase({
  serviceAccountPath: "./service-account.json",
  databaseURL: "https://my-project.firebaseio.com"
})

// List projects
listProjects()

// Get a document from Firestore
getDocument({
  collection: "users",
  documentId: "user123"
})

// Query documents with conditions
queryDocuments({
  collection: "products",
  where: [
    ["price", ">", 100],
    ["inStock", "==", true]
  ],
  orderBy: { field: "price", direction: "desc" },
  limit: 10
})
```

## License

MIT
