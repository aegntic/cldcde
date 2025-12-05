// Type declarations for MCP SDK responses
declare module '@modelcontextprotocol/sdk/client/index.js' {
  export * from '@modelcontextprotocol/sdk/client/index';
  
  export interface ToolsListResponse {
    tools: Array<{
      name: string;
      description?: string;
      inputSchema?: any;
    }>;
  }

  export interface CallToolResponse {
    content: Array<{
      type: string;
      text?: string;
    }>;
  }
}

declare module '@modelcontextprotocol/sdk/server/index.js' {
  export * from '@modelcontextprotocol/sdk/server/index';
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export * from '@modelcontextprotocol/sdk/server/stdio';
}

declare module '@modelcontextprotocol/sdk/client/stdio.js' {
  export * from '@modelcontextprotocol/sdk/client/stdio';
}

declare module '@modelcontextprotocol/sdk/types.js' {
  export * from '@modelcontextprotocol/sdk/types';
}