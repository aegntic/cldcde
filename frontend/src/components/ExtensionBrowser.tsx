import React, { useEffect, useState } from 'react'
import { MarketplaceCatalog, MarketplaceShell } from './common/marketplace'
import { fetchMarketplaceCatalog } from '../lib/marketplaceApi'
import type { MarketplaceItem } from '../types/marketplace'

interface ExtensionBrowserProps {
  onClose?: () => void
  user?: {
    username: string
    id: string
  } | null
}

const ExtensionBrowser: React.FC<ExtensionBrowserProps> = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<MarketplaceItem[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const catalog = await fetchMarketplaceCatalog()
        if (!mounted) return
        setItems(catalog.filter((item) => item.kind === 'extension' || item.kind === 'pack'))
      } catch (error) {
        console.error('Failed to load extension marketplace:', error)
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
        title="PLUGIN MARKETPLACE"
        subtitle="Route-first catalog for plugins and bundle assets. Explore, compare, and copy direct install commands."
        items={items}
        loading={loading}
      />
    </MarketplaceShell>
  )
}

export { ExtensionBrowser }
