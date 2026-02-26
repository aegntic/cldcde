import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { fetchMarketplaceNews } from '../lib/marketplaceApi'
import {
  Badge,
  IsoCard,
  MarketplaceShell,
  SectionHeaderAscii,
  SectionLead,
  SectionRail,
  TagChip
} from './common/marketplace'

interface NewsCard {
  id: string
  title: string
  summary: string
  publishedAt: string
  tags: string[]
}

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 220px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.secondary}d0`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  padding: 0.6rem 0.78rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`

const Headline = styled.div`
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1.02rem;
  letter-spacing: 0.01em;
`

const Summary = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
  font-size: 0.9rem;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const Empty = styled.div`
  border: 1px dashed ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
`

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const NewsPage: React.FC = () => {
  const [items, setItems] = useState<NewsCard[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const feed = await fetchMarketplaceNews()
        if (!mounted) return
        setItems(feed)
      } catch (error) {
        console.error('Failed to load release feed:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const haystack = [item.title, item.summary, item.tags.join(' ')].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, query])

  return (
    <MarketplaceShell>
      <SectionRail
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <SectionHeaderAscii text="MARKETPLACE RELEASE FEED" size="hero" level={1} />
        <SectionLead>
          Product drops, plugin updates, and ecosystem notes presented as a clean release stream.
        </SectionLead>
      </SectionRail>

      <SectionRail
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <Controls>
          <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search release notes" />
        </Controls>

        {loading ? (
          <Empty>Loading release feed...</Empty>
        ) : filtered.length === 0 ? (
          <Empty>No release notes match the current query.</Empty>
        ) : (
          <Grid>
            {filtered.map((item, index) => (
              <IsoCard
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ y: -2 }}
              >
                <MetaRow>
                  <Badge>{formatDate(item.publishedAt)}</Badge>
                  <Badge $tone="new">release</Badge>
                </MetaRow>
                <Headline>{item.title}</Headline>
                <Summary>{item.summary || 'No summary provided for this release update.'}</Summary>
                <MetaRow>
                  {item.tags.slice(0, 4).map((tag) => (
                    <TagChip key={`${item.id}-${tag}`}>{tag}</TagChip>
                  ))}
                </MetaRow>
              </IsoCard>
            ))}
          </Grid>
        )}
      </SectionRail>
    </MarketplaceShell>
  )
}

export { NewsPage }
