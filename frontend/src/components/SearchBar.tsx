import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'

// Styled components
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 48px 12px 16px;
  font-size: 16px;
  font-family: 'Berkeley Mono', monospace;
  background: var(--terminal-bg);
  color: var(--terminal-green);
  border: 2px solid var(--terminal-green);
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    border-color: var(--terminal-bright-green);
  }

  &::placeholder {
    color: var(--terminal-dim);
    opacity: 0.7;
  }
`

const SearchIcon = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--terminal-green);
  pointer-events: none;
`

const SuggestionsContainer = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--terminal-bg);
  border: 2px solid var(--terminal-green);
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`

const SuggestionItem = styled(motion.div)<{ isActive?: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.isActive ? 'rgba(0, 255, 0, 0.1)' : 'transparent'};
  border-bottom: 1px solid var(--terminal-dim);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(0, 255, 0, 0.1);
  }
`

const SuggestionName = styled.div`
  font-family: 'Berkeley Mono', monospace;
  color: var(--terminal-green);
  font-size: 14px;

  mark {
    background: rgba(0, 255, 0, 0.3);
    color: var(--terminal-bright-green);
    font-weight: bold;
  }
`

const SuggestionMeta = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const TypeBadge = styled.span<{ type: 'extension' | 'mcp' }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Berkeley Mono', monospace;
  background: ${props => props.type === 'extension' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 200, 255, 0.2)'};
  color: ${props => props.type === 'extension' ? 'var(--terminal-green)' : 'var(--terminal-cyan)'};
  text-transform: uppercase;
`

const CategoryBadge = styled.span`
  font-size: 11px;
  color: var(--terminal-dim);
  font-family: 'Berkeley Mono', monospace;
`

const NoResults = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--terminal-dim);
  font-family: 'Berkeley Mono', monospace;
  font-size: 14px;
`

const SearchResults = styled.div`
  margin-top: 24px;
`

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-family: 'Berkeley Mono', monospace;
  color: var(--terminal-green);
`

const ResultCount = styled.span`
  font-size: 14px;
`

const SearchTime = styled.span`
  font-size: 12px;
  color: var(--terminal-dim);
`

// Types
interface Suggestion {
  id: string
  name: string
  category: string
  type: 'extension' | 'mcp'
  highlight: string
}

interface SearchResult {
  id: string
  name: string
  description: string
  category: string
  type: 'extension' | 'mcp'
  downloads: number
  rating: number
  _formatted?: {
    name?: string
    description?: string
  }
}

interface SearchBarProps {
  onSearch?: (results: SearchResult[]) => void
  placeholder?: string
  autoFocus?: boolean
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search extensions and MCP servers...',
  autoFocus = false
}) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTime, setSearchTime] = useState<number | null>(null)
  
  const debouncedQuery = useDebounce(query, 50)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}&type=all`)
      const data = await response.json()
      
      if (data.suggestions) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
      setSuggestions([])
    }
  }, [])

  // Perform full search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onSearch?.([])
      return
    }

    setIsLoading(true)
    const startTime = Date.now()

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: searchQuery,
          type: 'all',
          limit: 30,
        }),
      })

      const data = await response.json()
      setSearchTime(Date.now() - startTime)
      
      if (data.results) {
        onSearch?.(data.results)
      }
    } catch (error) {
      console.error('Search error:', error)
      onSearch?.([])
    } finally {
      setIsLoading(false)
    }
  }, [onSearch])

  // Handle input change
  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery, fetchSuggestions])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      
      case 'Enter':
        e.preventDefault()
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          selectSuggestion(suggestions[activeSuggestionIndex])
        } else {
          performSearch(query)
          setShowSuggestions(false)
        }
        break
      
      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  // Select a suggestion
  const selectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.name)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    performSearch(suggestion.name)
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <SearchContainer ref={containerRef}>
        <SearchInput
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        <SearchIcon>
          {isLoading ? '⟳' : '🔍'}
        </SearchIcon>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <SuggestionsContainer
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion.id}
                  isActive={index === activeSuggestionIndex}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SuggestionName dangerouslySetInnerHTML={{ __html: suggestion.highlight }} />
                  <SuggestionMeta>
                    <CategoryBadge>{suggestion.category}</CategoryBadge>
                    <TypeBadge type={suggestion.type}>
                      {suggestion.type}
                    </TypeBadge>
                  </SuggestionMeta>
                </SuggestionItem>
              ))}
            </SuggestionsContainer>
          )}

          {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isLoading && (
            <SuggestionsContainer
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <NoResults>No suggestions found</NoResults>
            </SuggestionsContainer>
          )}
        </AnimatePresence>
      </SearchContainer>

      {searchTime !== null && (
        <SearchResults>
          <ResultsHeader>
            <ResultCount>Search completed</ResultCount>
            <SearchTime>{searchTime}ms</SearchTime>
          </ResultsHeader>
        </SearchResults>
      )}
    </>
  )
}