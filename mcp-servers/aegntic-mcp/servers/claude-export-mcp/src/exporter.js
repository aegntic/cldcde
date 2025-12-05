/**
 * Claude Desktop export functionality
 */

const fs = require('fs');
const path = require('path');
const utils = require('./utils');

/**
 * Export a single conversation to the appropriate project structure
 * @param {string} conversationPath - Path to the conversation JSON file
 * @param {string} exportBasePath - Base path for the export
 * @returns {Object} Result of the export operation
 */
function exportConversation(conversationPath, exportBasePath) {
  try {
    const rawData = fs.readFileSync(conversationPath, 'utf8');
    const conversation = JSON.parse(rawData);
    
    // Get project ID
    const projectId = utils.getProjectId(conversation);
    
    // Create project directory
    const projectDir = path.join(exportBasePath, projectId);
    fs.mkdirSync(projectDir, { recursive: true });
    
    // Create conversations directory within project
    const conversationsDir = path.join(projectDir, 'conversations');
    fs.mkdirSync(conversationsDir, { recursive: true });
    
    // Create artifacts directory within project
    const projectArtifactsDir = path.join(projectDir, 'artifacts');
    fs.mkdirSync(projectArtifactsDir, { recursive: true });
    
    // Create project files directory within project
    const projectFilesDir = path.join(projectDir, 'files');
    fs.mkdirSync(projectFilesDir, { recursive: true });
    
    // Create a directory with the conversation title (or ID if no title)
    const conversationName = conversation.title 
      ? conversation.title.replace(/[/\\?%*:|"<>]/g, '-') 
      : path.basename(conversationPath, '.json');
    
    const conversationDir = path.join(conversationsDir, conversationName);
    fs.mkdirSync(conversationDir, { recursive: true });
    
    // Export main conversation as markdown
    const markdown = utils.convertToMarkdown(conversation);
    fs.writeFileSync(path.join(conversationDir, 'conversation.md'), markdown);
    
    // Export artifacts as separate files
    if (conversation.artifacts && conversation.artifacts.length > 0) {
      // Create conversation-specific artifacts directory
      const conversationArtifactsDir = path.join(conversationDir, 'artifacts');
      fs.mkdirSync(conversationArtifactsDir, { recursive: true });
      
      conversation.artifacts.forEach((artifact, index) => {
        const filename = artifact.title 
          ? `${artifact.title.replace(/[/\\?%*:|"<>]/g, '-')}.${utils.getExtension(artifact.language)}` 
          : `artifact-${index}.${utils.getExtension(artifact.language)}`;
        
        // Save to conversation-specific artifacts directory
        fs.writeFileSync(path.join(conversationArtifactsDir, filename), artifact.content);
        
        // Also save to project-wide artifacts directory
        fs.writeFileSync(path.join(projectArtifactsDir, filename), artifact.content);
      });
    }
    
    return {
      success: true,
      message: `Exported: ${projectId}/${conversationName}`,
      path: conversationDir,
      projectId: projectId
    };
  } catch (error) {
    return {
      success: false,
      message: `Error exporting ${conversationPath}: ${error.message}`
    };
  }
}

/**
 * Export all conversations maintaining project structure
 * @param {string} claudePath - Path to Claude Desktop
 * @param {string} exportPath - Path for the export
 * @returns {Object} Result of the export operation
 */
function exportAllConversations(claudePath, exportPath) {
  // Find conversations directory
  const conversationsDir = path.join(claudePath, 'conversations');
  
  if (!fs.existsSync(conversationsDir)) {
    return {
      success: false,
      message: `Conversations directory not found: ${conversationsDir}`
    };
  }
  
  // Create export directory
  fs.mkdirSync(exportPath, { recursive: true });
  
  // Get all conversation files
  const files = fs.readdirSync(conversationsDir)
    .filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    return {
      success: false,
      message: 'No conversation files found'
    };
  }
  
  const results = {
    success: true,
    total: files.length,
    exported: 0,
    failed: 0,
    exportPath,
    projects: {},
    details: []
  };
  
  for (const file of files) {
    const conversationPath = path.join(conversationsDir, file);
    const result = exportConversation(conversationPath, exportPath);
    
    if (result.success) {
      results.exported++;
      
      // Track by project
      if (result.projectId) {
        if (!results.projects[result.projectId]) {
          results.projects[result.projectId] = {
            conversations: 0,
            path: path.join(exportPath, result.projectId)
          };
        }
        results.projects[result.projectId].conversations++;
      }
    } else {
      results.failed++;
    }
    
    results.details.push({
      file,
      ...result
    });
  }
  
  // Also copy over any project files if they exist
  const projectsDir = path.join(claudePath, 'projects');
  if (fs.existsSync(projectsDir)) {
    try {
      const projects = fs.readdirSync(projectsDir);
      
      for (const project of projects) {
        const projectDir = path.join(projectsDir, project);
        if (fs.statSync(projectDir).isDirectory()) {
          const projectFilesSourceDir = path.join(projectDir, 'files');
          if (fs.existsSync(projectFilesSourceDir)) {
            const projectFilesDestDir = path.join(exportPath, project, 'files');
            fs.mkdirSync(projectFilesDestDir, { recursive: true });
            
            // Copy all files from project files directory
            const files = fs.readdirSync(projectFilesSourceDir);
            for (const file of files) {
              const sourcePath = path.join(projectFilesSourceDir, file);
              const destPath = path.join(projectFilesDestDir, file);
              fs.copyFileSync(sourcePath, destPath);
            }
            
            if (!results.projects[project]) {
              results.projects[project] = {
                conversations: 0,
                path: path.join(exportPath, project)
              };
            }
            results.projects[project].files = files.length;
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Error copying project files: ${error.message}`);
    }
  }
  
  return results;
}

module.exports = {
  exportConversation,
  exportAllConversations
};
