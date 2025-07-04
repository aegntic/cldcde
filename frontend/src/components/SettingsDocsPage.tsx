import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const PageContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  padding-top: calc(80px + ${({ theme }) => theme.spacing.xl});
  max-width: 1200px;
  margin: 0 auto;
`

const PageHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const Title = styled.h1`
  font-size: 3rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.blue},
    ${({ theme }) => theme.colors.terminal.cyan}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
`

const Section = styled(motion.section)`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  &::before {
    content: '>';
    color: ${({ theme }) => theme.colors.terminal.green};
  }
`

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const SettingsCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: block;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`

const SettingsTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.interactive.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SettingsDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SettingsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    padding: ${({ theme }) => theme.spacing.xs} 0;
    color: ${({ theme }) => theme.colors.text.muted};
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.9rem;
    
    &::before {
      content: '•';
      color: ${({ theme }) => theme.colors.terminal.green};
      margin-right: ${({ theme }) => theme.spacing.sm};
    }
  }
`

const CodeBlock = styled.pre`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: ${({ theme }) => theme.spacing.md} 0;
`

const InlineCode = styled.code`
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9em;
  color: ${({ theme }) => theme.colors.syntax.function};
`

const Badge = styled.span`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
  margin-right: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`

const AlertBox = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.terminal.yellow};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.md} 0;
  
  &::before {
    content: '⚠️';
    margin-right: ${({ theme }) => theme.spacing.sm};
  }
`

const SettingsDocsPage: React.FC = () => {
  const diagnosticCommands = `# Check CLDCDE+ status
cldstatus

# View configuration
cldconfig

# Test database connection  
cldtest-db

# View logs
cldlogs

# Reset configuration
cldreset --confirm`

  const installationCode = `# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/cldcde/cldcde-uno/main/install-cldcde-uno.sh | bash

# Or download and inspect first
curl -fsSL https://raw.githubusercontent.com/cldcde/cldcde-uno/main/install-cldcde-uno.sh > install-cldcde-uno.sh
chmod +x install-cldcde-uno.sh
./install-cldcde-uno.sh`

  const usageExamples = `# Basic shortcuts
cld "What is this file?"          # claude "What is this file?"
clds "Explain this code"          # claude --model sonnet-3.5 "Explain this code"
cldo "Complex reasoning task"     # claude --model opus "Complex reasoning task"

# Auto-execute (safe operations only)
cldae "analyze this directory"    # claude "analyze this directory" --auto-execute
cldaep "review this PR"          # claude "review this PR" --auto-execute --project

# Experimental system
cldex "implement user auth"       # Starts experimental development workflow
cldlist                          # Lists active experiments
cldshow experiment_123           # Shows experiment details`

  const envSetup = `# Create .env file in your project root
# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# OAuth Providers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret

# Development vs Production
NODE_ENV=development
DEBUG=true

# OpenRouter (optional)
OPENROUTER_API_KEY=your_openrouter_key`

  const fileLocations = `# Main configuration directory
~/.cld/
├── shortcuts.sh                # CLI shortcuts and aliases
├── config.json                 # Main configuration
├── themes/                     # Custom themes
│   ├── terminal.css
│   └── custom-theme.css
└── experiments/                # Experimental system
    ├── active/
    ├── completed/
    └── templates/

# Shell integration
~/.zshrc                       # Zsh shell configuration
~/.bashrc                      # Bash shell configuration

# Project-specific
./.env                         # Environment variables
./cldcde.config.js             # Project configuration
./package.json                 # Dependencies (if using npm)`
  const installationSettings = [
    {
      title: 'Installation & Setup',
      description: 'Get CLDCDE+ installed and configured on your system with automated shell integration.',
      icon: '🚀',
      items: [
        'Cross-platform installation script',
        'Automatic shell integration (.zshrc/.bashrc)',
        'Environment detection and validation',
        'Post-install verification tests'
      ]
    },
    {
      title: 'Shell Configuration',
      description: 'Configure your shell environment for optimal CLDCDE+ performance.',
      icon: '🐚',
      items: [
        'Shell compatibility settings',
        'PATH environment setup',
        'Alias configuration management',
        'Custom prompt integration'
      ]
    }
  ]

  const cliSettings = [
    {
      title: 'CLI Shortcuts',
      description: 'Customize and manage your 40+ CLI shortcuts for maximum productivity.',
      icon: '⚡',
      items: [
        'Basic commands: cld, cldp, cldc, cldr',
        'Model shortcuts: clds (Sonnet), cldo (Opus)', 
        'Auto-execute: cldae, cldaep, cldaec',
        'Experiment commands: cldex, cldlist, cldshow'
      ]
    },
    {
      title: 'Safety Controls',
      description: 'Configure safety settings for auto-execute and experimental features.',
      icon: '🛡️',
      items: [
        'Auto-execute permission levels',
        'Safe operation definitions',
        'Confirmation prompts',
        'Operation logging and rollback'
      ]
    }
  ]

  const environmentSettings = [
    {
      title: 'Environment Variables',
      description: 'Configure API keys, database connections, and service integrations.',
      icon: '🔐',
      items: [
        'SUPABASE_URL and SUPABASE_KEY',
        'OAuth provider keys (GitHub, X)',
        'OpenRouter API configuration',
        'Development vs production settings'
      ]
    },
    {
      title: 'Database Configuration',
      description: 'Set up and manage your database connections and schema.',
      icon: '🗄️',
      items: [
        'Supabase connection setup',
        'Database schema migrations',
        'Connection pooling settings',
        'Backup and recovery configuration'
      ]
    }
  ]

  const experimentalSettings = [
    {
      title: 'Experimental System',
      description: 'Configure the advanced experimental development workflow system.',
      icon: '🧪',
      items: [
        'Directory structure: ~/.claude-experiments/',
        'Workflow phase configurations',
        'Output format customization',
        'Multi-approach analysis settings'
      ]
    },
    {
      title: 'Component Library',
      description: 'Configure the React component library and development environment.',
      icon: '🧩',
      items: [
        'React 19 + TypeScript setup',
        'Vite build configuration',
        'Terminal theme customization',
        'Component styling options'
      ]
    }
  ]

  return (
    <PageContainer>
      <PageHeader
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>CLDCDE+ Settings</Title>
        <Subtitle>
          Configure Claude Code Plus for optimal productivity and customization
        </Subtitle>
      </PageHeader>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SectionTitle>What is CLDCDE+?</SectionTitle>
        <SettingsCard>
          <SettingsDescription>
            <strong>CLDCDE+ (Claude Code Plus)</strong> is an unofficial enhancement suite that supercharges your Claude CLI experience with:
          </SettingsDescription>
          <SettingsList>
            <li><Badge>40+ CLI Shortcuts</Badge> Transform verbose commands into quick aliases</li>
            <li><Badge>Multi-Model Support</Badge> Dedicated shortcuts for Sonnet and Opus</li>
            <li><Badge>Auto-Execute</Badge> Safe automation for read-only operations</li>
            <li><Badge>Experimental System</Badge> Advanced development workflows</li>
            <li><Badge>Component Library</Badge> React 19 + TypeScript + Vite setup</li>
          </SettingsList>
          <AlertBox>
            <strong>Note:</strong> CLDCDE+ is an unofficial enhancement suite and is not affiliated with Anthropic or the official Claude development team.
          </AlertBox>
        </SettingsCard>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SectionTitle>Installation & Setup</SectionTitle>
        <SettingsGrid>
          {installationSettings.map((setting, index) => (
            <SettingsCard
              key={setting.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SettingsTitle>
                <span>{setting.icon}</span>
                {setting.title}
              </SettingsTitle>
              <SettingsDescription>{setting.description}</SettingsDescription>
              <SettingsList>
                {setting.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </SettingsList>
            </SettingsCard>
          ))}
        </SettingsGrid>
        
        <SettingsCard>
          <SettingsTitle>
            <span>📥</span>
            Quick Installation
          </SettingsTitle>
          <SettingsDescription>
            Install CLDCDE+ with a single command:
          </SettingsDescription>
          <CodeBlock>{installationCode}</CodeBlock>
        </SettingsCard>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SectionTitle>CLI Configuration</SectionTitle>
        <SettingsGrid>
          {cliSettings.map((setting, index) => (
            <SettingsCard
              key={setting.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SettingsTitle>
                <span>{setting.icon}</span>
                {setting.title}
              </SettingsTitle>
              <SettingsDescription>{setting.description}</SettingsDescription>
              <SettingsList>
                {setting.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </SettingsList>
            </SettingsCard>
          ))}
        </SettingsGrid>
        
        <SettingsCard>
          <SettingsTitle>
            <span>⌨️</span>
            Example Usage
          </SettingsTitle>
          <SettingsDescription>
            Common CLDCDE+ commands and their standard equivalents:
          </SettingsDescription>
          <CodeBlock>{usageExamples}</CodeBlock>
        </SettingsCard>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <SectionTitle>Environment Configuration</SectionTitle>
        <SettingsGrid>
          {environmentSettings.map((setting, index) => (
            <SettingsCard
              key={setting.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SettingsTitle>
                <span>{setting.icon}</span>
                {setting.title}
              </SettingsTitle>
              <SettingsDescription>{setting.description}</SettingsDescription>
              <SettingsList>
                {setting.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </SettingsList>
            </SettingsCard>
          ))}
        </SettingsGrid>
        
        <SettingsCard>
          <SettingsTitle>
            <span>🔧</span>
            Environment Setup
          </SettingsTitle>
          <SettingsDescription>
            Configure your environment variables for full functionality:
          </SettingsDescription>
          <CodeBlock>{envSetup}</CodeBlock>
        </SettingsCard>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <SectionTitle>Advanced Features</SectionTitle>
        <SettingsGrid>
          {experimentalSettings.map((setting, index) => (
            <SettingsCard
              key={setting.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SettingsTitle>
                <span>{setting.icon}</span>
                {setting.title}
              </SettingsTitle>
              <SettingsDescription>{setting.description}</SettingsDescription>
              <SettingsList>
                {setting.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </SettingsList>
            </SettingsCard>
          ))}
        </SettingsGrid>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <SectionTitle>Configuration Files</SectionTitle>
        <SettingsCard>
          <SettingsTitle>
            <span>📁</span>
            File Locations
          </SettingsTitle>
          <SettingsDescription>
            CLDCDE+ creates and manages several configuration files:
          </SettingsDescription>
          <CodeBlock>{fileLocations}</CodeBlock>
        </SettingsCard>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <SectionTitle>Troubleshooting</SectionTitle>
        <SettingsCard>
          <SettingsTitle>
            <span>🔍</span>
            Common Issues
          </SettingsTitle>
          <SettingsDescription>
            Solutions for common CLDCDE+ configuration problems:
          </SettingsDescription>
          <SettingsList>
            <li><strong>Command not found:</strong> Restart terminal or run <InlineCode>source ~/.zshrc</InlineCode></li>
            <li><strong>Permission denied:</strong> Check script permissions with <InlineCode>chmod +x</InlineCode></li>
            <li><strong>Environment variables:</strong> Verify <InlineCode>.env</InlineCode> file exists and is properly formatted</li>
            <li><strong>Database errors:</strong> Confirm Supabase credentials and network connectivity</li>
          </SettingsList>
          
          <SettingsDescription style={{ marginTop: '1rem' }}>
            <strong>Diagnostic Commands:</strong>
          </SettingsDescription>
          <CodeBlock>{diagnosticCommands}</CodeBlock>
        </SettingsCard>
      </Section>
    </PageContainer>
  )
}

export { SettingsDocsPage }