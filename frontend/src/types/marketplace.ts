export type MarketplaceKind = 'extension' | 'mcp' | 'pack'
export type MarketplaceTier = 'free' | 'pro'

export interface MarketplaceItem {
  id: string
  kind: MarketplaceKind
  name: string
  slug: string
  summary: string
  tags: string[]
  downloads: number
  rating: number
  verified: boolean
  installCommand: string
  repoUrl?: string
  docsUrl?: string
  tier: MarketplaceTier
  releasedAt: string
  category: string
  platform: string[]
  author: string
  featured: boolean
}

export interface MarketplaceFilterState {
  search: string
  kind: MarketplaceKind | 'all'
  category: string
  tags: string[]
  sort: 'trending' | 'downloads' | 'rating' | 'newest' | 'name'
  tier: MarketplaceTier | 'all'
  verifiedOnly: boolean
}

export interface MarketplaceFeatured {
  featured: MarketplaceItem[]
  trending: MarketplaceItem[]
  newest: MarketplaceItem[]
}
