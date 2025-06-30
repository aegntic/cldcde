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

const ResourceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const ResourceCard = styled(motion.a)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  text-decoration: none;
  color: inherit;
  display: block;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`

const ResourceTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.interactive.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ResourceDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ResourceMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
`

const Badge = styled.span`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
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

const DocsPage: React.FC = () => {
  const officialResources = [
    {
      title: 'Claude Code Official Docs',
      description: 'Official documentation for Claude Code, including getting started guides, API reference, and best practices.',
      url: 'https://docs.anthropic.com/en/docs/claude-code',
      icon: '📚',
      meta: ['Official', 'Documentation']
    },
    {
      title: 'Claude Code GitHub',
      description: 'Official Claude Code repository with source code, issues, and community contributions.',
      url: 'https://github.com/anthropics/claude-code',
      icon: '🐙',
      meta: ['GitHub', 'Source Code']
    },
    {
      title: 'Model Context Protocol (MCP)',
      description: 'Official MCP specification and documentation for building Claude Code server integrations.',
      url: 'https://modelcontextprotocol.io',
      icon: '🔌',
      meta: ['MCP', 'Protocol']
    }
  ]

  const communityResources = [
    {
      title: 'Awesome Claude',
      description: 'A curated list of awesome Claude Code extensions, MCP servers, tools, and resources maintained by the community.',
      url: 'https://github.com/awesome-claude/awesome-claude',
      icon: '🌟',
      meta: ['Community', 'Curated List']
    },
    {
      title: 'MCP Servers Collection',
      description: 'Community-driven collection of MCP servers for various integrations including databases, APIs, and development tools.',
      url: 'https://github.com/modelcontextprotocol/servers',
      icon: '🛠️',
      meta: ['MCP', 'Servers']
    },
    {
      title: 'Claude Code Extensions',
      description: 'Repository of community-built extensions for Claude Code, enhancing functionality across different platforms.',
      url: 'https://github.com/claude-code-extensions',
      icon: '🧩',
      meta: ['Extensions', 'Community']
    }
  ]

  const developerResources = [
    {
      title: 'Extension Development Kit',
      description: 'Starter template and SDK for building Claude Code extensions with TypeScript, including examples and best practices.',
      url: 'https://github.com/anthropics/claude-extension-sdk',
      icon: '🚀',
      meta: ['SDK', 'TypeScript']
    },
    {
      title: 'MCP Server Template',
      description: 'Boilerplate for creating MCP servers in various languages with examples for common integration patterns.',
      url: 'https://github.com/modelcontextprotocol/server-template',
      icon: '📋',
      meta: ['Template', 'MCP']
    },
    {
      title: 'Testing Framework',
      description: 'Tools and utilities for testing Claude Code extensions and MCP servers, including mock environments.',
      url: 'https://github.com/claude-testing/framework',
      icon: '🧪',
      meta: ['Testing', 'Development']
    }
  ]

  return (
    <PageContainer>
      <PageHeader
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Documentation & Resources</Title>
        <Subtitle>
          Essential guides, repositories, and tools for Claude Code development
        </Subtitle>
      </PageHeader>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SectionTitle>Official Resources</SectionTitle>
        <ResourceGrid>
          {officialResources.map((resource, index) => (
            <ResourceCard
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <ResourceTitle>
                <span>{resource.icon}</span>
                {resource.title}
              </ResourceTitle>
              <ResourceDescription>{resource.description}</ResourceDescription>
              <ResourceMeta>
                {resource.meta.map(tag => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </ResourceMeta>
            </ResourceCard>
          ))}
        </ResourceGrid>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <SectionTitle>Community Resources</SectionTitle>
        <ResourceGrid>
          {communityResources.map((resource, index) => (
            <ResourceCard
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <ResourceTitle>
                <span>{resource.icon}</span>
                {resource.title}
              </ResourceTitle>
              <ResourceDescription>{resource.description}</ResourceDescription>
              <ResourceMeta>
                {resource.meta.map(tag => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </ResourceMeta>
            </ResourceCard>
          ))}
        </ResourceGrid>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <SectionTitle>Developer Tools</SectionTitle>
        <ResourceGrid>
          {developerResources.map((resource, index) => (
            <ResourceCard
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <ResourceTitle>
                <span>{resource.icon}</span>
                {resource.title}
              </ResourceTitle>
              <ResourceDescription>{resource.description}</ResourceDescription>
              <ResourceMeta>
                {resource.meta.map(tag => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </ResourceMeta>
            </ResourceCard>
          ))}
        </ResourceGrid>
      </Section>

      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <SectionTitle>Quick Start</SectionTitle>
        <ResourceCard as="div">
          <ResourceDescription>
            Get started with Claude Code extension development:
          </ResourceDescription>
          <CodeBlock>{`# Install Claude Code CLI
npm install -g @anthropic/claude-code-cli

# Create a new extension
claude-code create my-extension

# Install dependencies
cd my-extension && npm install

# Start development
npm run dev`}</CodeBlock>
          <ResourceDescription>
            For MCP server development:
          </ResourceDescription>
          <CodeBlock>{`# Clone the MCP server template
git clone https://github.com/modelcontextprotocol/server-template
cd server-template

# Install dependencies
npm install

# Configure your server
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start`}</CodeBlock>
          <ResourceDescription>
            Learn more in the <InlineCode>official documentation</InlineCode> or join the community discussions on GitHub.
          </ResourceDescription>
        </ResourceCard>
      </Section>
    </PageContainer>
  )
}

export { DocsPage }