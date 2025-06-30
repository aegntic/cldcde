import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { config } from '../config'

// Ultra-simple resource type for both extensions and MCPs
interface Resource {
  id: string
  type: 'extension' | 'mcp'
  name: string
  slug: string
  description: string
  category: string
  downloads: number
  rating: number
  tags: string[]
  featured: boolean
  verified: boolean
  repository?: string
  homepage?: string
  platform?: string[]
  install_command?: string
}

interface ContentContextType {
  resources: Resource[]
  loading: boolean
  error: string | null
  filters: {
    type: 'all' | 'extension' | 'mcp'
    search: string
    category?: string
  }
  setFilter: (key: string, value: any) => void
  refresh: () => void
  featured: Resource[]
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

// Simple API client
const fetchResources = async (): Promise<Resource[]> => {
  try {
    const [extensionsRes, mcpRes] = await Promise.all([
      fetch(`${config.api.baseUrl}/extensions`),
      fetch(`${config.api.baseUrl}/mcp`)
    ])

    const [extensions, mcps] = await Promise.all([
      extensionsRes.json(),
      mcpRes.json()
    ])

    return [
      ...(extensions.data || []).map((e: any) => ({ ...e, type: 'extension' as const })),
      ...(mcps.data || []).map((m: any) => ({ ...m, type: 'mcp' as const }))
    ]
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    return []
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    type: 'all' as const,
    search: '',
    category: undefined as string | undefined
  })

  // Load resources
  const loadResources = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchResources()
      setResources(data)
    } catch (err) {
      setError('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  // Simple client-side filtering
  const filteredResources = resources.filter(resource => {
    if (filters.type !== 'all' && resource.type !== filters.type) return false
    if (filters.search && !resource.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !resource.description.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.category && resource.category !== filters.category) return false
    return true
  })

  const featured = resources.filter(r => r.featured)

  const setFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <ContentContext.Provider value={{
      resources: filteredResources,
      loading,
      error,
      filters,
      setFilter,
      refresh: loadResources,
      featured
    }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useContent must be used within ContentProvider')
  }
  return context
}