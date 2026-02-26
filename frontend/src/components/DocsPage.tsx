import React from 'react'
import styled from 'styled-components'
import {
  Badge,
  IsoCard,
  MarketplaceShell,
  SectionHeaderAscii,
  SectionLead,
  SectionRail,
  TagChip
} from './common/marketplace'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`

const CardTitle = styled.h3`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

const CardBody = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
  font-size: 0.9rem;
`

const MetaRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const CodeBlock = styled.pre`
  margin: 0;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => `${theme.colors.background.secondary}cc`};
  padding: ${({ theme }) => theme.spacing.md};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

const ResourceLink = styled.a`
  text-decoration: none;
  color: inherit;
`

const sections = [
  {
    title: 'Core References',
    items: [
      {
        title: 'CLDCDE Repository',
        description: 'Primary source for plugin marketplace, packs, and UI runtime.',
        url: 'https://github.com/aegntic/cldcde',
        tags: ['source', 'platform']
      },
      {
        title: 'MCP Server Catalog',
        description: 'Model Context Protocol server collection and integration paths.',
        url: 'https://github.com/modelcontextprotocol/servers',
        tags: ['mcp', 'integration']
      },
      {
        title: 'Claude Code Docs',
        description: 'Official docs for CLI workflows and ecosystem integration patterns.',
        url: 'https://docs.anthropic.com/en/docs/claude-code',
        tags: ['official', 'documentation']
      }
    ]
  },
  {
    title: 'Build + Deploy',
    items: [
      {
        title: 'Pages Build',
        description: 'Build frontend bundle and static output for Cloudflare Pages deployment.',
        url: 'https://github.com/aegntic/cldcde/blob/main/scripts/build-pages-site.sh',
        tags: ['build', 'pages']
      },
      {
        title: 'AE.LTD Packager',
        description: 'Pack construction pipeline for skills, plugins, MCPs, workflows and prompts.',
        url: 'https://github.com/aegntic/cldcde/tree/main/website/ae-ltd-packager',
        tags: ['packs', 'distribution']
      },
      {
        title: 'Worker Config',
        description: 'Cloudflare Worker runtime configuration for API and supporting endpoints.',
        url: 'https://github.com/aegntic/cldcde/blob/main/wrangler.worker.toml',
        tags: ['infra', 'worker']
      }
    ]
  }
]

const DocsPage: React.FC = () => {
  return (
    <MarketplaceShell>
      <SectionRail>
        <SectionHeaderAscii text="MARKETPLACE DOCS HUB" size="hero" level={1} />
        <SectionLead>
          Operational references for building, shipping, and maintaining the CLDCDE plugin marketplace.
        </SectionLead>
      </SectionRail>

      {sections.map((section) => (
        <SectionRail key={section.title}>
          <SectionHeaderAscii text={section.title.toUpperCase()} size="section" level={2} />
          <Grid>
            {section.items.map((item) => (
              <ResourceLink key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">
                <IsoCard whileHover={{ y: -2 }}>
                  <Badge>{item.url.includes('github.com') ? 'github' : 'docs'}</Badge>
                  <CardTitle>{item.title}</CardTitle>
                  <CardBody>{item.description}</CardBody>
                  <MetaRow>
                    {item.tags.map((tag) => (
                      <TagChip key={`${item.title}-${tag}`}>{tag}</TagChip>
                    ))}
                  </MetaRow>
                </IsoCard>
              </ResourceLink>
            ))}
          </Grid>
        </SectionRail>
      ))}

      <SectionRail>
        <SectionHeaderAscii text="QUICK START" size="section" level={2} />
        <CodeBlock>{`# Build and verify marketplace site bundle
bun run site:build
bun run site:check

# Deploy to Cloudflare Pages
bun run site:deploy`}</CodeBlock>
      </SectionRail>
    </MarketplaceShell>
  )
}

export { DocsPage }
