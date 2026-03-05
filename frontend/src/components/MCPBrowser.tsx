import React, { useEffect, useState } from 'react'
import { MarketplaceCatalog, MarketplaceShell } from './common/marketplace'
import { fetchMarketplaceCatalog } from '../lib/marketplaceApi'
import type { MarketplaceItem } from '../types/marketplace'

const MCPBrowser: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<MarketplaceItem[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const catalog = await fetchMarketplaceCatalog()
        if (!mounted) return
        setItems(catalog.filter((item) => item.kind === 'mcp'))
      } catch (error) {
        console.error('Failed to load MCP marketplace:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <MarketplaceShell>
      <MarketplaceCatalog
        title="MCP SERVERS"
        subtitle="Curated model-context servers with setup notes, install commands, and source links."
        items={items}
        loading={loading}
        forceKind="mcp"
      />
    </MarketplaceShell>
  )
}

export { MCPBrowser }
