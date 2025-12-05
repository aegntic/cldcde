/**
 * Utility functions for Claude Export MCP
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Get the default Claude Desktop path based on operating system
 * @returns {string|null} The path to Claude Desktop folder or null if not found
 */
function getDefaultClaudePath() {
  const homedir = os.homedir();
  
  switch (process.platform) {
    case 'win32':
      return path.join(homedir, 'AppData', 'Roaming', 'Claude Desktop');
    case 'darwin': // macOS
      return path.join(homedir, 'Library', 'Application Support', 'Claude Desktop');
    case 'linux':
      return path.join(homedir, '.config', 'Claude Desktop');
    default:
      return null;
  }
}

/**
 * Convert Claude Desktop conversation to Markdown
 * @param {Object} conversation - The conversation object
 * @returns {string} Conversation formatted as Markdown
 */
function convertToMarkdown(conversation) {
  let markdown = `# ${conversation.title || 'Untitled Conversation'}\n\n`;
  
  for (const message of conversation.messages) {
    const role = message.role === 'user' ? 'Human' : 'Assistant';
    markdown += `## ${role}\n\n${message.content}\n\n`;
    
    // Handle artifacts if present
    if (message.artifacts && message.artifacts.length > 0) {
      for (const artifact of message.artifacts) {
        markdown += `### Artifact: ${artifact.title || 'Untitled'}\n\n`;
        markdown += `\`\`\`${artifact.language || ''}\n${artifact.content}\n\`\`\`\n\n`;
      }
    }
  }
  
  return markdown;
}

/**
 * Determine file extension based on language
 * @param {string} language - The language identifier
 * @returns {string} The appropriate file extension
 */
function getExtension(language) {
  const extensionMap = {
    'javascript': 'js',
    'python': 'py',
    'html': 'html',
    'css': 'css',
    'markdown': 'md',
    'json': 'json',
    'application/vnd.ant.code': 'txt',
    'application/vnd.ant.react': 'jsx',
    'text/markdown': 'md',
    'text/html': 'html',
    'image/svg+xml': 'svg',
    'application/vnd.ant.mermaid': 'mermaid',
    // Add more mappings as needed
  };
  
  return extensionMap[language?.toLowerCase()] || 'txt';
}

/**
 * Get the project ID from a conversation
 * @param {Object} conversation - The conversation object
 * @returns {string} The project ID or default value
 */
function getProjectId(conversation) {
  return conversation.projectId || 'default-project';
}

module.exports = {
  getDefaultClaudePath,
  convertToMarkdown,
  getExtension,
  getProjectId
};
