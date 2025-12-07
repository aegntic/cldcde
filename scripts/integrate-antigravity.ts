
import { RegistryManager } from '../plugins/tool-registry-manager/src/registry/RegistryManager.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

// Define the shape of our Frontmatter
interface AgentFrontmatter {
  name: string;
  type: string;
  description: string;
  capabilities?: string[];
  [key: string]: any;
}

// Helper to parse frontmatter
function parseFrontmatter(content: string): { data: AgentFrontmatter; content: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  try {
    const data = yaml.parse(match[1]) as AgentFrontmatter;
    return { data, content: match[2] };
  } catch (e) {
    console.error('Failed to parse YAML:', e);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Antigravity Integration...');

  // Initialize Registry Manager
  // We use the default path defined in the class, assuming it matches the environment
  const registryManager = new RegistryManager();

  try {
    // Verify registry access
    const stats = await registryManager.getStats();
    console.log(`📊 Connected to Antigravity Registry. Current tools: ${stats.total_tools}`);
  } catch (error) {
    console.error('❌ Failed to connect to Antigravity registry. Is the path correct?');
    console.error(error);
    process.exit(1);
  }

  const agentsDir = path.resolve('.claude/agents');
  
  // Recursively find all markdown files
  async function getFiles(dir: string): Promise<string[]> {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files).filter(f => f.endsWith('.md'));
  }

  const agentFiles = await getFiles(agentsDir);
  console.log(`found ${agentFiles.length} agent definitions in .claude/agents`);

  for (const file of agentFiles) {
    const content = await fs.promises.readFile(file, 'utf-8');
    const parsed = parseFrontmatter(content);
    
    if (!parsed) {
      console.warn(`⚠️ Skipping ${path.basename(file)}: No valid frontmatter found`);
      continue;
    }

    const { data, content: body } = parsed;
    const toolId = `claude-agent-${path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
    
    // Map to ToolDefinition
    const toolDef = {
      id: toolId,
      name: data.name || path.basename(file, '.md'),
      provider: 'claude-code',
      type: 'model', // Agents act as specialized models
      description: data.description || 'Imported Claude Code Agent',
      features: data.capabilities || [],
      input: {
        type: 'text',
        description: 'Task description or prompt',
        formats: ['text/markdown']
      },
      output: {
        type: 'text',
        description: 'Agent response or artifact',
        formats: ['text/markdown', 'application/json']
      },
      // Store the full configuration in metadata for the agent runner to use
      metadata: {
        original_type: data.type,
        color: data.color,
        priority: data.priority,
        hooks: data.hooks,
        full_prompt: body.trim()
      },
      quality: 'high', // Assumed for curated agents
      cost: 'free'
    };

    try {
      // Check if exists
      const existing = await registryManager.getTool(toolId);
      
      if (existing) {
        console.log(`🔄 Updating existing agent: ${toolDef.name} (${toolId})`);
        await registryManager.updateTool(toolId, toolDef);
      } else {
        console.log(`✨ Registering new agent: ${toolDef.name} (${toolId})`);
        await registryManager.addTool('agents', data.type || 'general', toolDef);
      }
    } catch (e) {
      console.error(`❌ Failed to process ${toolId}:`, e);
    }
  }

  console.log('✅ Integration complete!');
  const finalStats = await registryManager.getStats();
  console.log(`📊 Final Registry Stats: ${finalStats.total_tools} tools`);
}

// Enhanced migration for commands, workflows, and skills
async function migrateCommands() {
  console.log('🚀 Migrating .claude commands to antigravity workflows...');

  const commandsDir = path.resolve('.claude/commands');

  // Recursively find all command markdown files
  async function getCommandFiles(dir: string): Promise<string[]> {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getCommandFiles(res) : res;
    }));
    return Array.prototype.concat(...files).filter(f => f.endsWith('.md'));
  }

  const commandFiles = await getCommandFiles(commandsDir);
  console.log(`Found ${commandFiles.length} command definitions in .claude/commands`);

  for (const file of commandFiles) {
    const content = await fs.promises.readFile(file, 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      console.warn(`⚠️ Skipping command ${path.basename(file)}: No valid frontmatter found`);
      continue;
    }

    const { data, content: body } = parsed;
    const workflowId = `claude-command-${path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

    // Map command to workflow definition
    const workflowDef = {
      id: workflowId,
      name: data.title || path.basename(file, '.md'),
      provider: 'claude-code',
      type: 'workflow',
      description: data.description || 'Imported Claude Code Command',
      category: data.type || 'general',
      features: data.capabilities || [],
      input: {
        type: 'text',
        description: 'Command parameters or context',
        formats: ['text/markdown']
      },
      output: {
        type: 'text',
        description: 'Command execution result',
        formats: ['text/markdown', 'application/json']
      },
      // Store command-specific configuration
      metadata: {
        original_type: data.type,
        read_only: data.read_only,
        allowed_tools: data.allowed_tools,
        command_content: body.trim(),
        execution_mode: data.execution_mode || 'sequential',
        validation_required: data.validation_required || false
      },
      quality: 'high',
      cost: 'free'
    };

    try {
      // Check if workflow exists
      const existing = await registryManager.getTool(workflowId);

      if (existing) {
        console.log(`🔄 Updating existing workflow: ${workflowDef.name} (${workflowId})`);
        await registryManager.updateTool(workflowId, workflowDef);
      } else {
        console.log(`✨ Registering new workflow: ${workflowDef.name} (${workflowId})`);
        await registryManager.addTool('workflows', data.type || 'general', workflowDef);
      }
    } catch (e) {
      console.error(`❌ Failed to process workflow ${workflowId}:`, e);
    }
  }
}

// Migrate skills with enhanced capabilities
async function migrateSkills() {
  console.log('🎯 Migrating .claude skills to antigravity...');

  const skillsDir = path.resolve('.claude/skills');

  if (!fs.existsSync(skillsDir)) {
    console.log('📁 No skills directory found, skipping skill migration');
    return;
  }

  // Recursively find all skill files
  async function getSkillFiles(dir: string): Promise<string[]> {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getSkillFiles(res) : res;
    }));
    return Array.prototype.concat(...files).filter(f =>
      f.endsWith('.md') || f.endsWith('.py') || f.endsWith('.js') || f.endsWith('.ts')
    );
  }

  const skillFiles = await getSkillFiles(skillsDir);
  console.log(`Found ${skillFiles.length} skill files in .claude/skills`);

  for (const file of skillFiles) {
    const relativePath = path.relative(skillsDir, file);
    const skillName = path.basename(relativePath, path.extname(relativePath));
    const skillId = `claude-skill-${skillName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

    let content = '';
    let metadata: any = {};

    if (file.endsWith('.md')) {
      content = await fs.promises.readFile(file, 'utf-8');
      const parsed = parseFrontmatter(content);
      if (parsed) {
        metadata = parsed.data;
        content = parsed.content;
      }
    } else {
      content = await fs.promises.readFile(file, 'utf-8');
      // Try to read metadata from adjacent files
      const metadataFile = file.replace(path.extname(file), '.json');
      if (fs.existsSync(metadataFile)) {
        try {
          metadata = JSON.parse(await fs.promises.readFile(metadataFile, 'utf-8'));
        } catch (e) {
          console.warn(`⚠️ Could not parse metadata for ${skillName}`);
        }
      }
    }

    // Map skill to capability definition
    const skillDef = {
      id: skillId,
      name: metadata.name || skillName,
      provider: 'claude-code',
      type: 'skill',
      description: metadata.description || `Imported Claude Code Skill: ${skillName}`,
      category: metadata.category || 'general',
      features: metadata.capabilities || [],
      input: {
        type: 'text',
        description: 'Skill input parameters',
        formats: ['text/markdown', 'application/json']
      },
      output: {
        type: 'text',
        description: 'Skill execution result',
        formats: ['text/markdown', 'application/json']
      },
      metadata: {
        original_path: relativePath,
        file_type: path.extname(file),
        skill_content: content,
        execution_context: metadata.execution_context || 'standalone',
        dependencies: metadata.dependencies || [],
        integration_level: metadata.integration_level || 'basic'
      },
      quality: 'high',
      cost: 'free'
    };

    try {
      const existing = await registryManager.getTool(skillId);

      if (existing) {
        console.log(`🔄 Updating existing skill: ${skillDef.name} (${skillId})`);
        await registryManager.updateTool(skillId, skillDef);
      } else {
        console.log(`✨ Registering new skill: ${skillDef.name} (${skillId})`);
        await registryManager.addTool('skills', metadata.category || 'general', skillDef);
      }
    } catch (e) {
      console.error(`❌ Failed to process skill ${skillId}:`, e);
    }
  }
}

// Enhanced main function with full migration
async function enhancedMain() {
  console.log('🚀 Starting Enhanced Antigravity Integration...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Initialize Registry Manager
    const registryManager = new RegistryManager();

    // Verify registry access
    const stats = await registryManager.getStats();
    console.log(`📊 Connected to Antigravity Registry. Current tools: ${stats.total_tools}`);

    // Phase 1: Migrate agents (existing functionality)
    await main();

    // Phase 2: Migrate commands
    await migrateCommands();

    // Phase 3: Migrate skills
    await migrateSkills();

    console.log('✅ Enhanced Integration complete!');
    const finalStats = await registryManager.getStats();
    console.log(`📊 Final Registry Stats: ${finalStats.total_tools} tools`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 .claude ecosystem successfully integrated with Antigravity!');
    console.log('🧠 Agents, Commands, and Skills are now available in Antigravity workflows.');

  } catch (error) {
    console.error('❌ Enhanced integration failed:', error);
    process.exit(1);
  }
}

// Run enhanced integration if called directly
if (require.main === module) {
  enhancedMain().catch(console.error);
}
