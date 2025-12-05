# Creating New MCP Servers

This guide explains how to create new MCP servers for the aegntic-MCP repository using the provided template.

## Using the Template

The aegntic-MCP repository includes a template directory that you can use as a starting point for new MCP servers. This template includes:

- Flexible port handling (automatically finds an available port if the default is in use)
- Enhanced user experience with improved console output
- Network IP detection for easier connection from multiple devices
- Optional QR code generation for mobile connections
- Consistent error handling

### Step 1: Copy the Template

Start by copying the template directory to a new directory in the `servers` folder:

```bash
cp -r template servers/your-new-server-name
```

### Step 2: Update Package Information

Edit the `package.json` file in your new server directory:

1. Change the `name` field to `@aegntic/your-new-server-name`
2. Update the `description` field
3. Update the `bin` field to use your new server name
4. Add or modify the `keywords` as needed
5. Update the `directory` field in the repository section
6. Add any additional dependencies your server requires

### Step 3: Implement Your Server

Edit the `src/server.js` file to implement your MCP server logic:

1. Change the server name and description
2. Add your server methods using the `server.method()` function
3. Implement handlers for each method
4. Export the server object

### Step 4: Update Documentation

Edit the `README.md` file to document your server:

1. Change the title and description
2. Document the features and capabilities
3. Provide examples of how to use your server
4. List any specific requirements
5. Include any additional configuration options

### Step 5: Test Your Server

Test your server locally before submitting:

```bash
cd servers/your-new-server-name
npm install
npm start
```

Make sure all methods work as expected and handle errors gracefully.

## Adding to the Repository

Once your server is working correctly:

1. Add it to the repository:
   ```bash
   git add servers/your-new-server-name
   git commit -m "Add your-new-server-name MCP server"
   git push
   ```

2. Update the main README.md to include your new server in the list of available servers.

## MCP Server Guidelines

When creating MCP servers for the aegntic-MCP repository, follow these guidelines:

### Directory Structure

Maintain the standard directory structure:

```
servers/your-server-name/
├── README.md          # Documentation
├── package.json       # Package configuration
├── index.js           # Entry point
└── src/               # Source code
    ├── index.js       # Server initialization
    ├── server.js      # Server implementation
    └── ...            # Additional modules
```

### Error Handling

All MCP methods should:

1. Handle errors gracefully
2. Return clear error messages when things go wrong
3. Validate input parameters
4. Include a `success` boolean in the response

### Documentation

Documentation should include:

1. Clear description of the server's purpose
2. List of available methods with descriptions
3. Examples of how to use each method
4. Installation and usage instructions
5. Any configuration options

### Dependencies

Keep dependencies minimal and up-to-date:

1. Use the latest stable version of mcp-server
2. Avoid unnecessary dependencies
3. Use optionalDependencies for non-critical features
4. Document any external requirements

### Testing

Test your server thoroughly:

1. Test all methods with valid inputs
2. Test error handling with invalid inputs
3. Test on different platforms (Windows, macOS, Linux)
4. Test with different versions of Node.js

## Publishing to npm

Once your server is accepted into the repository, you can publish it to npm:

```bash
cd servers/your-new-server-name
npm publish
```

Make sure your npm account is added to the aegntic organization before publishing.

## Example Method Implementation

Here's an example of how to implement a method in your server:

```javascript
server.method({
  name: 'methodName',
  description: 'A description of what this method does',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of parameter 1'
      },
      param2: {
        type: 'number',
        description: 'Description of parameter 2'
      }
    },
    required: ['param1']
  },
  handler: async ({ param1, param2 }) => {
    try {
      // Implement your method logic here
      const result = await doSomething(param1, param2);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});
```