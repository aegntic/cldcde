import React, { useState } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'

interface MCPServer {
  id: string
  name: string
  description: string
  author: string
  category: string
  features: string[]
  installation: string
  github_url: string
  downloads: number
  rating: number
  verified: boolean
}

const BrowserContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  padding-top: calc(80px + ${({ theme }) => theme.spacing.xl});
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const Title = styled.h1`
  font-size: 3rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.purple},
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

const ControlsSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  justify-content: center;
`

const SearchBar = styled.input`
  flex: 1;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1rem;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.border.focus}33;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const CategoryFilter = styled.select`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  cursor: pointer;
`

const ServersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const ServerCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  position: relative;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`

const ServerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ServerInfo = styled.div`
  flex: 1;
`

const ServerName = styled.h3`
  font-size: 1.3rem;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const VerifiedBadge = styled.span`
  color: ${({ theme }) => theme.colors.status.success};
  font-size: 1rem;
`

const ServerAuthor = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
`

const ServerStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const FeatureList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Feature = styled.span`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.mono};
`

const InstallCommand = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.syntax.string};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Button = styled.a`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.interactive.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    background: ${({ theme }) => theme.colors.interactive.primaryHover};
    transform: translateY(-1px);
  }
`

// Sample MCP servers data
const SAMPLE_SERVERS: MCPServer[] = [
  {
    id: '1',
    name: 'PostgreSQL MCP',
    description: 'Complete PostgreSQL integration for Claude Code. Execute queries, manage schemas, generate migrations, and analyze performance directly from your editor.',
    author: 'modelcontextprotocol',
    category: 'Database',
    features: ['Query execution', 'Schema management', 'Migration generation', 'Performance analysis'],
    installation: 'npm install @mcp/postgresql',
    github_url: 'https://github.com/modelcontextprotocol/servers/tree/main/postgresql',
    downloads: 15420,
    rating: 4.8,
    verified: true
  },
  {
    id: '2',
    name: 'Git MCP Server',
    description: 'Enhanced Git operations within Claude Code. Commit, branch, merge, and analyze repository history with natural language commands.',
    author: 'modelcontextprotocol',
    category: 'Version Control',
    features: ['Natural language commits', 'Branch management', 'Conflict resolution', 'History analysis'],
    installation: 'npm install @mcp/git',
    github_url: 'https://github.com/modelcontextprotocol/servers/tree/main/git',
    downloads: 23150,
    rating: 4.9,
    verified: true
  },
  {
    id: '3',
    name: 'Filesystem MCP',
    description: 'Advanced filesystem operations with safety checks. Read, write, and manipulate files with intelligent safeguards and permissions management.',
    author: 'modelcontextprotocol',
    category: 'File System',
    features: ['Safe file operations', 'Batch processing', 'Permission management', 'Pattern matching'],
    installation: 'npm install @mcp/filesystem',
    github_url: 'https://github.com/modelcontextprotocol/servers/tree/main/filesystem',
    downloads: 31200,
    rating: 4.7,
    verified: true
  },
  {
    id: '4',
    name: 'Docker MCP',
    description: 'Manage Docker containers, images, and compose files. Build, deploy, and monitor containerized applications seamlessly.',
    author: 'community',
    category: 'DevOps',
    features: ['Container management', 'Image building', 'Compose integration', 'Log streaming'],
    installation: 'npm install @community/docker-mcp',
    github_url: 'https://github.com/docker-mcp/server',
    downloads: 8930,
    rating: 4.6,
    verified: false
  },
  {
    id: '5',
    name: 'AWS MCP',
    description: 'Comprehensive AWS service integration. Manage EC2, S3, Lambda, and more AWS services directly from Claude Code.',
    author: 'aws-community',
    category: 'Cloud',
    features: ['Multi-service support', 'Resource management', 'Cost analysis', 'CloudFormation'],
    installation: 'npm install @aws-mcp/server',
    github_url: 'https://github.com/aws-mcp/server',
    downloads: 12450,
    rating: 4.5,
    verified: false
  },
  {
    id: '6',
    name: 'Slack MCP',
    description: 'Send messages, manage channels, and integrate Slack workflows into your Claude Code development process.',
    author: 'modelcontextprotocol',
    category: 'Communication',
    features: ['Message sending', 'Channel management', 'File sharing', 'Workflow automation'],
    installation: 'npm install @mcp/slack',
    github_url: 'https://github.com/modelcontextprotocol/servers/tree/main/slack',
    downloads: 7820,
    rating: 4.4,
    verified: true
  }
]

const MCPBrowser: React.FC = () => {
  const [servers] = useState<MCPServer[]>(SAMPLE_SERVERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(servers.map(s => s.category)))]

  // Filter servers
  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const copyInstallCommand = (command: string, serverId: string) => {
    navigator.clipboard.writeText(command)
    setCopiedId(serverId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDownloads = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <BrowserContainer>
      <Header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>MCP Servers</Title>
        <Subtitle>
          Model Context Protocol servers for extending Claude Code capabilities
        </Subtitle>
      </Header>

      <ControlsSection>
        <SearchBar
          type="text"
          placeholder="Search MCP servers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <CategoryFilter
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </CategoryFilter>
      </ControlsSection>

      <AnimatePresence mode="wait">
        <ServersGrid>
          {filteredServers.map((server, index) => (
            <ServerCard
              key={server.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <ServerHeader>
                <ServerInfo>
                  <ServerName>
                    {server.name}
                    {server.verified && <VerifiedBadge>✓</VerifiedBadge>}
                  </ServerName>
                  <ServerAuthor>by {server.author}</ServerAuthor>
                </ServerInfo>
                <ServerStats>
                  <Stat>
                    <span>⬇</span> {formatDownloads(server.downloads)}
                  </Stat>
                  <Stat>
                    <span>⭐</span> {server.rating}
                  </Stat>
                </ServerStats>
              </ServerHeader>

              <Description>{server.description}</Description>

              <FeatureList>
                {server.features.map(feature => (
                  <Feature key={feature}>{feature}</Feature>
                ))}
              </FeatureList>

              <InstallCommand
                onClick={() => copyInstallCommand(server.installation, server.id)}
              >
                <code>{server.installation}</code>
                <span>{copiedId === server.id ? '✓ Copied' : '📋'}</span>
              </InstallCommand>

              <ActionButtons>
                <Button
                  href={server.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>🐙</span> View on GitHub
                </Button>
              </ActionButtons>
            </ServerCard>
          ))}
        </ServersGrid>
      </AnimatePresence>
    </BrowserContainer>
  )
}

export { MCPBrowser }