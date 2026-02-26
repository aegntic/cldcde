import React from 'react'
import styled from 'styled-components'
import {
  Badge,
  CommandBlock,
  IsoCard,
  MarketplacePanel,
  MarketplaceShell,
  NeonButton,
  SectionHeaderAscii,
  SectionLead,
  SectionRail,
  TagChip
} from './common/marketplace'
import { UserSettings } from './UserSettings'

interface SettingsDocsPageProps {
  user?: any
  onUpdateUser?: (user: any) => void
  onLoginClick?: () => void
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
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

const TagRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const docsModules = [
  {
    title: 'Account + Identity',
    summary: 'Manage profile, username, and avatar signature for marketplace attribution.',
    tags: ['profile', 'identity', 'account']
  },
  {
    title: 'Access Tokens',
    summary: 'Authentication tokens are stored in local browser storage for active sessions.',
    tags: ['auth', 'token', 'security']
  },
  {
    title: 'Notification Routing',
    summary: 'Control newsletters, product updates, and release notifications from one surface.',
    tags: ['mailing', 'updates', 'preferences']
  },
  {
    title: 'CLI Install Targets',
    summary: 'Pack installs support Codex, Agent Zero, ZeroClaw, and ClawReform workspaces.',
    tags: ['codex', 'agent-zero', 'clawreform']
  }
]

const troubleshooting = [
  'If auth actions fail, re-login to refresh local token storage.',
  'If profile updates fail, ensure API health reports online in the bottom status indicator.',
  'If install commands fail, verify python3, tar, and curl are available in terminal.',
  'If copied commands paste incorrectly, open the item detail and copy again from command block.'
]

const SettingsDocsPage: React.FC<SettingsDocsPageProps> = ({ user, onUpdateUser, onLoginClick }) => {
  return (
    <MarketplaceShell>
      <SectionRail>
        <SectionHeaderAscii text="SETTINGS + DOCS RAIL" size="hero" level={1} />
        <SectionLead>
          Account controls, operational docs, and install policy references for the CLDCDE marketplace.
        </SectionLead>
      </SectionRail>

      <SectionRail>
        <Grid>
          {docsModules.map((module) => (
            <IsoCard key={module.title} whileHover={{ y: -2 }}>
              <Badge>{module.title.includes('Account') ? 'settings' : 'docs'}</Badge>
              <CardTitle>{module.title}</CardTitle>
              <CardBody>{module.summary}</CardBody>
              <TagRow>
                {module.tags.map((tag) => (
                  <TagChip key={`${module.title}-${tag}`}>{tag}</TagChip>
                ))}
              </TagRow>
            </IsoCard>
          ))}
        </Grid>
      </SectionRail>

      <SectionRail>
        <MarketplacePanel>
          <SectionHeaderAscii text="REFERENCE COMMANDS" size="section" level={2} />
          <SectionLead>Use these commands to validate marketplace build and deployment surfaces.</SectionLead>
          <CommandBlock>{`# Build and verify static site
bun run site:build
bun run site:check

# Run tests
bun test

# Deploy (main)
bun run site:deploy`}</CommandBlock>
        </MarketplacePanel>
      </SectionRail>

      {user && onUpdateUser ? (
        <UserSettings user={user} onUpdate={onUpdateUser} />
      ) : (
        <SectionRail>
          <MarketplacePanel>
            <SectionHeaderAscii text="ACCOUNT REQUIRED" size="section" level={2} />
            <SectionLead>
              Login is required to edit mailing preferences and profile-linked settings.
            </SectionLead>
            <NeonButton type="button" onClick={onLoginClick} whileTap={{ scale: 0.98 }}>
              Login / Register
            </NeonButton>
          </MarketplacePanel>
        </SectionRail>
      )}

      <SectionRail>
        <MarketplacePanel>
          <SectionHeaderAscii text="TROUBLESHOOTING" size="section" level={2} />
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {troubleshooting.map((line) => (
              <IsoCard key={line} whileHover={{ y: -1 }}>
                <CardBody style={{ margin: 0 }}>{line}</CardBody>
              </IsoCard>
            ))}
          </div>
        </MarketplacePanel>
      </SectionRail>
    </MarketplaceShell>
  )
}

export { SettingsDocsPage }
