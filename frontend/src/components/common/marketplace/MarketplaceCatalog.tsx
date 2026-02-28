import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import type { MarketplaceFilterState, MarketplaceItem } from '../../../types/marketplace'
import { applyMarketplaceFilters } from '../../../lib/marketplaceApi'
import {
  Badge,
  CommandBlock,
  FilterPill,
  IsoCard,
  MarketplacePanel,
  NeonButton,
  SectionHeaderAscii,
  SectionLead,
  SectionRail,
  TagChip
} from './Primitives'

interface MarketplaceCatalogProps {
  title: string
  subtitle: string
  items: MarketplaceItem[]
  loading?: boolean
  forceKind?: 'extension' | 'mcp'
}

const ExplorerShell = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(320px, 1.1fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }
`

const Rail = styled(MarketplacePanel)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SearchInput = styled.input`
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.secondary}d2`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  padding: 0.58rem 0.76rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const AssetList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
`

const AssetRow = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.border.primary)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.interactive.primary}18` : `${theme.colors.background.secondary}bf`};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const AssetTitle = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const AssetSummary = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.78rem;
  line-height: 1.45;
`

const DetailPanel = styled(MarketplacePanel)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  position: sticky;
  top: 132px;
  align-self: start;

  @media (max-width: 1040px) {
    position: relative;
    top: 0;
  }
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const StripLabel = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
`

const Empty = styled.div`
  border: 1px dashed ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
`

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = value
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

export const MarketplaceCatalog: React.FC<MarketplaceCatalogProps> = ({
  title,
  subtitle,
  items,
  loading = false,
  forceKind
}) => {
  const [copied, setCopied] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [filters, setFilters] = useState<MarketplaceFilterState>({
    search: '',
    kind: forceKind || 'all',
    category: 'all',
    tags: [],
    sort: 'newest',
    tier: 'all',
    verifiedOnly: false
  })

  const filtered = useMemo(() => {
    const scoped = forceKind ? items.filter((item) => item.kind === forceKind) : items
    return applyMarketplaceFilters(scoped, { ...filters, kind: forceKind || filters.kind })
  }, [forceKind, filters, items])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(() => {
    if (!filtered.length) return null
    if (!selectedId) return filtered[0]
    return filtered.find((item) => item.id === selectedId) || filtered[0]
  }, [filtered, selectedId])

  const featured = useMemo(() => filtered.filter((item) => item.featured).slice(0, 3), [filtered])
  const trending = useMemo(() => [...filtered].sort((a, b) => b.downloads - a.downloads).slice(0, 3), [filtered])
  const newest = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()).slice(0, 3),
    [filtered]
  )
  const visible = showAll ? filtered : filtered.slice(0, 9)
  const hiddenCount = Math.max(filtered.length - visible.length, 0)

  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => set.add(item.category))
    return ['all', ...Array.from(set).sort()]
  }, [items])

  const handleCopy = async (item: MarketplaceItem) => {
    await copyText(item.installCommand)
    setCopied(item.id)
    setTimeout(() => setCopied(null), 1300)
  }

  return (
    <>
      <SectionRail>
        <SectionHeaderAscii text={title} size="section" level={1} />
        <SectionLead>{subtitle}</SectionLead>
      </SectionRail>

      {featured.length > 0 && (
        <SectionRail
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionHeaderAscii text="FEATURED STRIP" size="card" level={2} />
          <TopGrid>
            {featured.map((item) => (
              <IsoCard key={item.id} whileHover={{ y: -2 }} onClick={() => setSelectedId(item.id)}>
                <MetaRow>
                  <Badge $tone="kind">{item.kind}</Badge>
                  <Badge $tone="new">{item.featured ? 'featured' : 'standard'}</Badge>
                  <Badge $tone="tier">{item.tier}</Badge>
                </MetaRow>
                <AssetTitle style={{ marginTop: '0.5rem' }}>{item.name}</AssetTitle>
                <AssetSummary>{item.summary}</AssetSummary>
              </IsoCard>
            ))}
          </TopGrid>
        </SectionRail>
      )}

      {trending.length > 0 && (
        <SectionRail
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionHeaderAscii text="TRENDING STRIP" size="card" level={2} />
          <TopGrid>
            {trending.map((item) => (
              <IsoCard key={`trending-${item.id}`} whileHover={{ y: -2 }} onClick={() => setSelectedId(item.id)}>
                <StripLabel>downloads: {item.downloads}</StripLabel>
                <MetaRow>
                  <Badge $tone="kind">{item.kind}</Badge>
                  <Badge>{item.author}</Badge>
                  <Badge $tone="tier">{item.tier}</Badge>
                </MetaRow>
                <AssetTitle style={{ marginTop: '0.5rem' }}>{item.name}</AssetTitle>
                <AssetSummary>{item.summary}</AssetSummary>
              </IsoCard>
            ))}
          </TopGrid>
        </SectionRail>
      )}

      {newest.length > 0 && (
        <SectionRail
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionHeaderAscii text="NEW RELEASES" size="card" level={2} />
          <TopGrid>
            {newest.map((item) => (
              <IsoCard key={`new-${item.id}`} whileHover={{ y: -2 }} onClick={() => setSelectedId(item.id)}>
                <StripLabel>{new Date(item.releasedAt).toLocaleDateString()}</StripLabel>
                <MetaRow>
                  <Badge $tone="new">new</Badge>
                  <Badge $tone="kind">{item.kind}</Badge>
                  <Badge $tone="tier">{item.tier}</Badge>
                </MetaRow>
                <AssetTitle style={{ marginTop: '0.5rem' }}>{item.name}</AssetTitle>
                <AssetSummary>{item.summary}</AssetSummary>
              </IsoCard>
            ))}
          </TopGrid>
        </SectionRail>
      )}

      <SectionRail
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <ExplorerShell>
          <Rail>
            <SearchInput
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="search by name, tags, author"
            />

            {!forceKind && (
              <FilterRow>
                {(['all', 'extension', 'mcp', 'pack'] as const).map((kind) => (
                  <FilterPill
                    key={kind}
                    $active={filters.kind === kind}
                    onClick={() => setFilters((prev) => ({ ...prev, kind }))}
                  >
                    {kind}
                  </FilterPill>
                ))}
              </FilterRow>
            )}

            <FilterRow>
              {(['all', 'free', 'pro'] as const).map((tier) => (
                <FilterPill
                  key={tier}
                  $active={filters.tier === tier}
                  onClick={() => setFilters((prev) => ({ ...prev, tier }))}
                >
                  {tier}
                </FilterPill>
              ))}
            </FilterRow>

            <FilterRow>
              {(['trending', 'downloads', 'rating', 'newest', 'name'] as const).map((sort) => (
                <FilterPill
                  key={sort}
                  $active={filters.sort === sort}
                  onClick={() => setFilters((prev) => ({ ...prev, sort }))}
                >
                  {sort}
                </FilterPill>
              ))}
            </FilterRow>

            <FilterRow>
              {categories.slice(0, 10).map((category) => (
                <FilterPill
                  key={category}
                  $active={filters.category === category}
                  onClick={() => setFilters((prev) => ({ ...prev, category }))}
                >
                  {category}
                </FilterPill>
              ))}
            </FilterRow>

            {loading ? (
              <Empty>Loading marketplace assets...</Empty>
            ) : visible.length ? (
              <AssetList>
                {visible.map((item) => (
                  <AssetRow key={item.id} $active={selected?.id === item.id} onClick={() => setSelectedId(item.id)}>
                    <MetaRow>
                      <Badge $tone="kind">{item.kind}</Badge>
                      <Badge>{item.author}</Badge>
                    </MetaRow>
                    <AssetTitle>{item.name}</AssetTitle>
                    <AssetSummary>{item.summary}</AssetSummary>
                  </AssetRow>
                ))}
              </AssetList>
            ) : (
              <Empty>No marketplace assets match current filters.</Empty>
            )}

            {hiddenCount > 0 && (
              <NeonButton $tone="ghost" onClick={() => setShowAll((prev) => !prev)}>
                {showAll ? 'Show less' : `Show ${hiddenCount} more`}
              </NeonButton>
            )}
          </Rail>

          <DetailPanel>
            {selected ? (
              <>
                <MetaRow>
                  <Badge $tone="kind">{selected.kind}</Badge>
                  <Badge>{selected.category}</Badge>
                  <Badge $tone="tier">{selected.tier}</Badge>
                  <Badge>{selected.verified ? 'verified' : 'community'}</Badge>
                </MetaRow>
                <SectionHeaderAscii text={selected.name.toUpperCase()} size="card" level={3} />
                <SectionLead>{selected.summary}</SectionLead>

                <TagRow>
                  {selected.tags.map((tag) => (
                    <TagChip key={`${selected.id}-${tag}`}>{tag}</TagChip>
                  ))}
                </TagRow>

                <CommandBlock>{selected.installCommand}</CommandBlock>

                <ActionRow>
                  <NeonButton
                    onClick={() => handleCopy(selected)}
                    $tone="primary"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    {copied === selected.id ? 'Copied' : 'Copy Install'}
                  </NeonButton>
                  {selected.repoUrl && (
                    <NeonButton
                      as="a"
                      href={selected.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      $tone="secondary"
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      Open Source
                    </NeonButton>
                  )}
                  {(selected.docsUrl || selected.repoUrl) && (
                    <NeonButton
                      as="a"
                      href={selected.docsUrl || selected.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      $tone="ghost"
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      View Docs
                    </NeonButton>
                  )}
                </ActionRow>
              </>
            ) : (
              <Empty>Select an asset from the left rail to inspect install details.</Empty>
            )}
          </DetailPanel>
        </ExplorerShell>
      </SectionRail>
    </>
  )
}
