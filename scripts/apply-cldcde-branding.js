#!/usr/bin/env node

/**
 * CLDCDE Branding Application Script
 *
 * This script systematically applies CLDCDE.cc branding to all original tools
 * and adds appropriate acknowledgments for contributed projects.
 *
 * Usage: node scripts/apply-cldcde-branding.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLDCDE_ROOT = path.dirname(__dirname);

// CLDCDE Branding Configuration
const CLDCDE_BRANDING = {
  name: 'CLDCDE Ecosystem',
  fullName: 'Creator Live Development & Content Distribution Ecosystem',
  author: 'AEGNTIC AI Ecosystems for CLDCDE',
  homepage: 'https://cldcde.cc',
  repository: 'https://github.com/aegntic/cldcde.git',
  organization: '@cldcde',
  license: 'MIT',
  keywords: ['cldcde', 'creator-tools', 'aegntic'],

  // Contributor acknowledgments
  contributors: {
    'claude-flow': {
      name: 'Claude Flow',
      description: 'Advanced flow control and orchestration system',
      originalRepo: 'https://github.com/claude-flow/claude-flow',
      contribution: 'Core flow orchestration patterns and agent coordination'
    }
  }
};

// Categories for different types of tools
const TOOL_CATEGORIES = {
  plugin: {
    type: 'plugin',
    tiers: ['basic', 'pro', 'elite'],
    categories: [
      'content-creation', 'streaming', 'automation', 'ai-integration',
      'development', 'analytics', 'productivity', 'distribution'
    ]
  },
  'mcp-server': {
    type: 'mcp-server',
    tiers: ['basic', 'pro', 'elite'],
    categories: [
      'ai-integration', 'knowledge-management', 'automation', 'data-processing',
      'development', 'monitoring', 'communication', 'productivity'
    ]
  },
  skill: {
    type: 'skill',
    tiers: ['basic', 'pro', 'elite'],
    categories: [
      'ai-workflows', 'automation', 'development', 'content-creation',
      'productivity', 'integration', 'monitoring', 'analytics'
    ]
  }
};

/**
 * Apply CLDCDE branding to a package.json file
 */
function brandPackageJson(packagePath, toolCategory = 'plugin', tier = 'pro') {
  try {
    if (!fs.existsSync(packagePath)) {
      console.log(`⚠️  Package.json not found: ${packagePath}`);
      return false;
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const originalName = pkg.name;
    const toolName = path.basename(path.dirname(packagePath));

    // Update basic package info
    pkg.name = pkg.name.startsWith('@cldcde/') ? pkg.name : `${CLDCDE_BRANDING.organization}/${toolName}`;
    pkg.author = CLDCDE_BRANDING.author;
    pkg.license = CLDCDE_BRANDING.license;
    pkg.homepage = CLDCDE_BRANDING.homepage;

    // Update repository info
    if (!pkg.repository) {
      pkg.repository = {
        type: 'git',
        url: CLDCDE_BRANDING.repository,
        directory: `${toolCategory === 'plugin' ? 'plugins' : 'mcp-servers'}/${toolName}`
      };
    } else if (typeof pkg.repository === 'string') {
      pkg.repository = {
        type: 'git',
        url: pkg.repository,
        directory: `${toolCategory === 'plugin' ? 'plugins' : 'mcp-servers'}/${toolName}`
      };
    }

    // Update bugs URL
    pkg.bugs = {
      url: 'https://github.com/aegntic/cldcde/issues'
    };

    // Ensure CLDCDE keywords
    if (!pkg.keywords) pkg.keywords = [];
    CLDCDE_BRANDING.keywords.forEach(keyword => {
      if (!pkg.keywords.includes(keyword)) {
        pkg.keywords.push(keyword);
      }
    });

    // Add CLDCDE-specific metadata
    const category = TOOL_CATEGORIES[toolCategory];
    if (category) {
      pkg.cldcde = {
        type: category.type,
        tier: tier,
        category: determineCategory(pkg, category.categories),
        capabilities: generateCapabilities(pkg),
        compatibility: {
          cldcde: '>=1.0.0'
        },
        permissions: generatePermissions(pkg),
        branding: {
          logo: 'https://cldcde.cc/assets/logo.png',
          brandColor: '#00ff41',
          terminalStyle: true
        }
      };
    }

    // Add contributor acknowledgments if this is a contributed project
    if (originalName && isContributedProject(originalName)) {
      pkg.contributors = CLDCDE_BRANDING.contributors;
      pkg.acknowledgments = generateAcknowledgments(originalName);
    }

    // Write updated package.json
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ Branded: ${toolName} (${pkg.name})`);
    return true;

  } catch (error) {
    console.error(`❌ Error branding ${packagePath}:`, error.message);
    return false;
  }
}

/**
 * Determine the most appropriate category for a tool based on its keywords and description
 */
function determineCategory(pkg, availableCategories) {
  const text = `${pkg.description || ''} ${(pkg.keywords || []).join(' ')}`.toLowerCase();

  const categoryMapping = {
    'content-creation': ['youtube', 'video', 'content', 'creator', 'media', 'streaming'],
    'streaming': ['obs', 'stream', 'twitch', 'live', 'broadcast'],
    'automation': ['automation', 'workflow', 'orchestration', 'task', 'process'],
    'ai-integration': ['ai', 'claude', 'gpt', 'anthropic', 'openai', 'llm'],
    'development': ['dev', 'development', 'code', 'programming', 'cli'],
    'analytics': ['analytics', 'metrics', 'monitoring', 'tracking', 'stats'],
    'knowledge-management': ['knowledge', 'rag', 'obsidian', 'notes', 'brain'],
    'productivity': ['productivity', 'efficiency', 'tools', 'utility']
  };

  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return availableCategories.includes(category) ? category : availableCategories[0];
    }
  }

  return availableCategories[0]; // Default category
}

/**
 * Generate capabilities based on package metadata
 */
function generateCapabilities(pkg) {
  const capabilities = [];
  const text = `${pkg.description || ''} ${(pkg.keywords || []).join(' ')}`.toLowerCase();

  const capabilityMapping = {
    'ai-content-generation': ['ai', 'content', 'generation', 'writing'],
    'automation': ['automation', 'workflow', 'orchestration'],
    'data-analysis': ['analytics', 'analysis', 'metrics'],
    'integration': ['integration', 'api', 'connect'],
    'monitoring': ['monitoring', 'tracking', 'health'],
    'security': ['security', 'auth', 'encryption'],
    'real-time': ['real-time', 'live', 'streaming'],
    'collaboration': ['collaboration', 'team', 'sharing']
  };

  for (const [capability, keywords] of Object.entries(capabilityMapping)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      capabilities.push(capability);
    }
  }

  return capabilities.length > 0 ? capabilities : ['core-functionality'];
}

/**
 * Generate appropriate permissions based on tool type
 */
function generatePermissions(pkg) {
  const permissions = [];
  const text = `${pkg.description || ''} ${(pkg.keywords || []).join(' ')}`.toLowerCase();

  if (text.includes('api') || text.includes('network')) {
    permissions.push('network:api-access');
  }
  if (text.includes('file') || text.includes('storage')) {
    permissions.push('filesystem:read');
  }
  if (text.includes('ai') || text.includes('claude')) {
    permissions.push('ai:model-access');
  }
  if (text.includes('ui') || text.includes('interface')) {
    permissions.push('ui:interactive');
  }

  return permissions.length > 0 ? permissions : ['basic:execute'];
}

/**
 * Check if a project is a contributed project
 */
function isContributedProject(projectName) {
  return Object.keys(CLDCDE_BRANDING.contributors).includes(projectName);
}

/**
 * Generate acknowledgment text for contributed projects
 */
function generateAcknowledgments(projectName) {
  const contributor = CLDCDE_BRANDING.contributors[projectName];
  if (!contributor) return '';

  return `This project includes contributions from ${contributor.name}.
Original repository: ${contributor.originalRepo}
Contribution: ${contributor.contribution}

We thank the ${contributor.name} team for their excellent work and collaboration.`;
}

/**
 * Add CLDCDE header to README files
 */
function addReadmeBranding(readmePath, toolName) {
  try {
    if (!fs.existsSync(readmePath)) {
      console.log(`⚠️  README not found: ${readmePath}`);
      return false;
    }

    const content = fs.readFileSync(readmePath, 'utf8');
    if (content.includes('CLDCDE')) {
      console.log(`ℹ️  Already branded: ${toolName}`);
      return true;
    }

    const header = `╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                                                                               ║
║      █████████   ██████   ███████████   ███████████   ███████████      ███████  ║
║     ███░░░░███ ███░░███ ░░███░░███░░███░░███░░░░░███ ░░███░░███░░███  ███░░███  ║
║    ░███    ░███░███████  ░███ ░███ ░███ ░███    ░███  ░███ ░███ ░███ ░███ ░░███ ║
║    ░██████████ ░███░░███ ░███ ░███ ░███ ░██████████   ░███ ░███ ░████░░█████░  ║
║    ░███░░░░░███░███ ░░███ ░███ ░███ ░███ ░███░░░░░███  ░███ ░███ ░███ ░░███░░███║
║    ░███    ░███░███  ░███ ░███ ░███ ░███ ░███    ░███  ░███ ░███ ░███  ░███ ░░███║
║    █████   ██████  ██████ ███████████  █████   █████ ████████ █████  ██████ ░███║
║    ░░░░░   ░░░░░  ░░░░░░ ░░░░░░░░░░░  ░░░░░   ░░░░░ ░░░░░░░░░ ░░░░░  ░░░░░░  ░░ ║
║                                                                               ║
║  ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                               https://cldcde.cc  ║
║           ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

# ${toolName}

**Part of the CLDCDE Ecosystem** - Creator Live Development & Content Distribution

---

`;

    const brandedContent = header + content;
    fs.writeFileSync(readmePath, brandedContent);
    console.log(`✅ README branded: ${toolName}`);
    return true;

  } catch (error) {
    console.error(`❌ Error branding README ${readmePath}:`, error.message);
    return false;
  }
}

/**
 * Process all tools in the CLDCDE ecosystem
 */
async function processAllTools() {
  console.log('🚀 Starting CLDCDE branding application...\n');

  const toolsDir = path.join(CLDCDE_ROOT, 'tools');
  const pluginsDir = path.join(CLDCDE_ROOT, 'plugins');
  const mcpServersDir = path.join(CLDCDE_ROOT, 'mcp-servers');

  let processedCount = 0;
  let successCount = 0;

  // Process plugins
  if (fs.existsSync(pluginsDir)) {
    const plugins = fs.readdirSync(pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('📦 Processing Plugins:');
    for (const plugin of plugins) {
      const packagePath = path.join(pluginsDir, plugin, 'package.json');
      const readmePath = path.join(pluginsDir, plugin, 'README.md');

      processedCount++;
      if (brandPackageJson(packagePath, 'plugin', 'pro')) successCount++;
      addReadmeBranding(readmePath, plugin);
    }
  }

  // Process MCP servers
  if (fs.existsSync(mcpServersDir)) {
    const mcpServers = fs.readdirSync(mcpServersDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('\n🧠 Processing MCP Servers:');
    for (const mcpServer of mcpServers) {
      const packagePath = path.join(mcpServersDir, mcpServer, 'package.json');
      const readmePath = path.join(mcpServersDir, mcpServer, 'README.md');

      processedCount++;
      if (brandPackageJson(packagePath, 'mcp-server', 'elite')) successCount++;
      addReadmeBranding(readmePath, mcpServer);
    }
  }

  // Process tools directory if it exists
  if (fs.existsSync(toolsDir)) {
    const tools = fs.readdirSync(toolsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('\n🔧 Processing Tools:');
    for (const tool of tools) {
      const packagePath = path.join(toolsDir, tool, 'package.json');
      const readmePath = path.join(toolsDir, tool, 'README.md');

      processedCount++;
      if (brandPackageJson(packagePath, 'tool', 'basic')) successCount++;
      addReadmeBranding(readmePath, tool);
    }
  }

  console.log(`\n✨ Branding Complete!`);
  console.log(`📊 Processed: ${processedCount} tools`);
  console.log(`✅ Success: ${successCount} tools`);
  console.log(`🌐 CLDCDE Ecosystem: https://cldcde.cc`);
}

// Run the branding script
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllTools().catch(console.error);
}

export { brandPackageJson, addReadmeBranding, processAllTools };