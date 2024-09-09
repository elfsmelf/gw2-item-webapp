'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from './SearchBar'
import { ColumnManager } from './ColumnManager'
import { FilterManager } from './FilterManager'
import { ItemTable } from './ItemTable'
import { Pagination } from './Pagination'

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

type FilterEntry = {
  key: string;
  value: [string, string];
};

interface GameItemFilterProps {
  initialSearchParams: string
}

export default function GameItemFilter({ initialSearchParams }: GameItemFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' })
  const [filters, setFilters] = useState<FilterEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['image', 'name', 'rarity', 'type', 'buy_price', 'sell_price', 'profit', 'roi']))

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchItems = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: debouncedSearchTerm,
      sortKey: sortConfig.key,
      sortDirection: sortConfig.direction,
      ...Object.fromEntries(filters.map(f => [f.key, `${f.value[0]},${f.value[1]}`]))
    })

    const response = await fetch(`/api/items?${params}`)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['items', page, limit, debouncedSearchTerm, sortConfig, filters],
    queryFn: fetchItems,
    keepPreviousData: true
  })

  useEffect(() => {
    if (data?.lastUpdated) {
      setLastUpdated(data.lastUpdated)
    }
  }, [data])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
    setPage(1)
  }

  const addFilter = (key: string) => {
    setFilters(current => [...current, { key, value: ['', ''] }])
  }

  const updateFilter = (index: number, value: [string, string]) => {
    setFilters(current => {
      const newFilters = [...current]
      newFilters[index].value = value
      return newFilters
    })
    setPage(1)
  }

  const removeFilter = (index: number) => {
    setFilters(current => current.filter((_, i) => i !== index))
    setPage(1)
  }

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(column)) {
        newSet.delete(column)
      } else {
        newSet.add(column)
      }
      return newSet
    })
  }

  const getUniqueValues = useCallback((column: string): string[] => {
    if (!data?.items || !Array.isArray(data.items)) return []
    const uniqueValues = new Set(data.items.map(item => String(item[column] || '')).filter(Boolean))
    return Array.from(uniqueValues)
  }, [data?.items])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
        <ColumnManager visibleColumns={visibleColumns} toggleColumn={toggleColumn} />
        <FilterManager
          filters={filters}
          addFilter={addFilter}
          updateFilter={updateFilter}
          removeFilter={removeFilter}
          getUniqueValues={getUniqueValues}
        />
      </div>

      <Card className="bg-card text-card-foreground">
        <CardContent className="p-0">
          <ItemTable 
            data={data?.items || []} 
            visibleColumns={visibleColumns} 
            sortConfig={sortConfig} 
            handleSort={handleSort} 
            isLoading={isLoading} 
            isFetching={isFetching} 
            limit={limit} 
          />
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground">
        <CardContent>
          <Pagination 
            currentPage={page} 
            totalPages={data?.totalPages || 1} 
            limit={limit} 
            setPage={setPage} 
            setLimit={setLimit} 
            isLoading={isLoading} 
            lastUpdated={lastUpdated} 
          />
        </CardContent>
      </Card>
    </div>
  )
}