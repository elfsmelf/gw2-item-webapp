'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, ChevronUp, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  TimeScale,
  TimeSeriesScale,
  Filler
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { cn } from "@/lib/utils"

// Add this custom hook at the top of your file
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

const FilterInput = ({ label, value, onChange, onRemove }: { 
  label: string, 
  value: [string, string], 
  onChange: (value: [string, string]) => void,
  onRemove: () => void
}) => {
  const [localValue, setLocalValue] = useState<[string, string]>(value);
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  const renderCoinPreview = (amount: string) => {
    if (!amount) return null;
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount)) return null;
    
    const gold = Math.floor(numAmount / 10000)
    const silver = Math.floor((numAmount % 10000) / 100)
    const copper = numAmount % 100

    return (
      <div className="flex items-center space-x-1">
        {gold > 0 && (
          <span className="flex items-center">
            {gold}
            <img src="/images/gold-coin.png" alt="Gold" className="w-4 h-4 ml-1" />
          </span>
        )}
        <span className="flex items-center">
          {silver}
          <img src="/images/silver-coin.png" alt="Silver" className="w-4 h-4 ml-1" />
        </span>
        <span className="flex items-center">
          {copper}
          <img src="/images/copper-coin.png" alt="Copper" className="w-4 h-4 ml-1" />
        </span>
      </div>
    )
  };

  const showCoinPreview = ['buy_price', 'sell_price', 'expected_profit'].includes(label);

  const handleInputChange = (index: number, newValue: string) => {
    const updatedValue = [...localValue] as [string, string];
    updatedValue[index] = newValue;
    setLocalValue(updatedValue);
  };

  const handleBlur = () => {
    onChange(localValue);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium">{label}:</span>
      <Input
        ref={minInputRef}
        type="number"
        placeholder="Min"
        value={localValue[0]}
        onChange={(e) => handleInputChange(0, e.target.value)}
        onBlur={handleBlur}
        className="w-24"
      />
      <Input
        ref={maxInputRef}
        type="number"
        placeholder="Max"
        value={localValue[1]}
        onChange={(e) => handleInputChange(1, e.target.value)}
        onBlur={handleBlur}
        className="w-24"
      />
      {showCoinPreview && (
        <>
          {renderCoinPreview(localValue[0])}
          {renderCoinPreview(localValue[1])}
        </>
      )}
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Plus className="h-4 w-4 rotate-45" />
      </Button>
    </div>
  )
}

const formatPrice = (price: number) => {
  const gold = Math.floor(price / 10000)
  const silver = Math.floor((price % 10000) / 100)
  const copper = price % 100

  return (
    <div className="flex items-center justify-end space-x-1">
      {gold > 0 && (
        <span className="flex items-center">
          {gold}
          <img src="/images/gold-coin.png" alt="Gold" className="w-4 h-4 ml-1" />
        </span>
      )}
      <span className="flex items-center">
        {silver}
        <img src="/images/silver-coin.png" alt="Silver" className="w-4 h-4 ml-1" />
      </span>
      <span className="flex items-center">
        {copper}
        <img src="/images/copper-coin.png" alt="Copper" className="w-4 h-4 ml-1" />
      </span>
    </div>
  )
}

const calculateProfit = (buyPrice: number, sellPrice: number) => {
  return Math.round(sellPrice * 0.85 - buyPrice) // Rounding to the nearest whole number
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
}

const SelectFilter = ({ label, options, value, onChange, onRemove }: {
  label: string,
  options: string[],
  value: string,
  onChange: (value: string) => void,
  onRemove: () => void
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium w-24">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {options.map((option) => (
            <SelectItem key={option} value={option} className="hover:bg-gray-100 transition-colors">{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onRemove} variant="outline" size="sm">Remove</Button>
    </div>
  )
}

const rarityColors: { [key: string]: string } = {
  Basic: "bg-gray-200 text-gray-800",
  Fine: "bg-blue-200 text-blue-800",
  Masterwork: "bg-green-200 text-green-800",
  Rare: "bg-yellow-200 text-yellow-800",
  Exotic: "bg-orange-200 text-orange-800",
  Ascended: "bg-pink-200 text-pink-800",
  Legendary: "bg-purple-200 text-purple-800",
}

const typeColors: { [key: string]: string } = {
  Armor: "bg-red-200 text-red-800",
  Weapon: "bg-blue-200 text-blue-800",
  Consumable: "bg-green-200 text-green-800",
  Container: "bg-yellow-200 text-yellow-800",
  Gathering: "bg-purple-200 text-purple-800",
  Gizmo: "bg-pink-200 text-pink-800",
  Tool: "bg-indigo-200 text-indigo-800",
  Trinket: "bg-orange-200 text-orange-800",
  "Upgrade Component": "bg-teal-200 text-teal-800",
}

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  TimeScale,
  TimeSeriesScale,
  Filler
)

// Add this interface at the top of your file, after the imports
interface HistoryEntry {
  date: string;
  sell_price: number;
  buy_price: number;
  sell_quantity: number;
  buy_quantity: number;
  '1d_sell_sold': number;
  '1d_buy_sold': number;
}

// At the top of your file, add or update this type definition
type FilterEntry = {
  key: string;
  value: [string, string];
};

interface GameItemFilterProps {
  initialSearchParams: string
}

export default function GameItemFilter({ initialSearchParams }: GameItemFilterProps) {
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(initialSearchParams))

  // State declarations
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' })
  const [filters, setFilters] = useState<FilterEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [showRarityFilter, setShowRarityFilter] = useState(false)
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [timePeriod, setTimePeriod] = useState('1D')

  // Hooks
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Query
  const fetchItems = useCallback(async () => {
    const response = await fetch(`/api/items?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }, [searchParams])

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['items', page, limit, sortConfig, searchTerm, filters],
    queryFn: fetchItems,
    placeholderData: keepPreviousData,
  })

  // Effects
  useEffect(() => {
    if (data?.lastUpdated) {
      setLastUpdated(new Date(data.lastUpdated).toLocaleString())
    }
  }, [data?.lastUpdated])

  const updateURL = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('page', page.toString())
    newSearchParams.set('limit', limit.toString())
    newSearchParams.set('sortKey', sortConfig.key)
    newSearchParams.set('sortDirection', sortConfig.direction)
    if (searchTerm) newSearchParams.set('search', searchTerm)
    filters.forEach(filter => {
      newSearchParams.set(filter.key, filter.value.join(','))
    })
    
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`
    router.push(newUrl, { scroll: false })
  }, [searchParams, page, limit, sortConfig, searchTerm, filters, router])

  useEffect(() => {
    updateURL()
  }, [updateURL])

  // Memoized values
  const filteredHistoryData = useMemo(() => {
    if (!data?.history) return []

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)

    let filteredData = data.history

    if (timePeriod === '1D') {
      filteredData = filteredData.filter((entry: HistoryEntry) => new Date(entry.date) >= oneDayAgo)
    } else if (timePeriod === '1W') {
      filteredData = filteredData.filter((entry: HistoryEntry) => new Date(entry.date) >= oneWeekAgo)
    } else if (timePeriod === '1M') {
      filteredData = filteredData.filter((entry: HistoryEntry) => new Date(entry.date) >= oneMonthAgo)
    } else if (timePeriod === '6M') {
      filteredData = filteredData.filter((entry: HistoryEntry) => new Date(entry.date) >= sixMonthsAgo)
    }

    return filteredData.sort((a: HistoryEntry, b: HistoryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data?.history, timePeriod])

  const chartData = useMemo(() => {
    return {
      labels: filteredHistoryData.map((entry: HistoryEntry) => new Date(entry.date)),
      datasets: [
        {
          label: 'Sell',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry.sell_price),
          borderColor: '#674FFF',
          backgroundColor: '#674FFF',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Buy',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry.buy_price),
          borderColor: '#FF2418',
          backgroundColor: '#FF2418',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Supply',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry.sell_quantity),
          borderColor: '#674FFF',
          backgroundColor: '#674FFF',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y1',
        },
        {
          label: 'Demand',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry.buy_quantity),
          borderColor: '#FF2418',
          backgroundColor: '#FF2418',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y1',
        },
        {
          label: 'Sold',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry['1d_sell_sold']),
          borderColor: '#674FFF',
          backgroundColor: '#674FFF',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y2',
        },
        {
          label: 'Offers',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry['1d_buy_sold']),
          borderColor: '#606063',
          backgroundColor: '#606063',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y2',
        },
        {
          label: 'Bought',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry['1d_buy_sold']),
          borderColor: '#FF2418',
          backgroundColor: '#FF2418',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y2',
        },
        {
          label: 'Bids',
          data: filteredHistoryData.map((entry: HistoryEntry) => entry.buy_quantity),
          borderColor: '#606063',
          backgroundColor: '#606063',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y2',
        },
      ],
    }
  }, [filteredHistoryData])

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'h:mm a',
            },
          },
          grid: {
            color: '#707073',
          },
          ticks: {
            color: '#E0E0E3',
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: '#707073',
          },
          ticks: {
            color: '#E0E0E3',
            callback: (value: any) => formatPrice(value),
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#E0E0E3',
          },
        },
        y2: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#E0E0E3',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#E0E0E3',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
        },
        tooltip: {
          callbacks: {
            title: (context: any) => {
              const date = new Date(context[0].label)
              return date.toLocaleString()
            },
            label: (context: any) => {
              const label = context.dataset.label || ''
              const value = formatPrice(context.parsed.y)
              return `${label}: ${value}`
            },
          },
        },
      },
    }
  }, [])

  // Callbacks
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleSort = useCallback((key: string) => {
    setSortConfig(prevConfig => {
      const newDirection: 'asc' | 'desc' = prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc';
      const newConfig: SortConfig = {
        key,
        direction: newDirection
      };
      searchParams.set('sortKey', newConfig.key);
      searchParams.set('sortDirection', newConfig.direction);
      setSearchParams(new URLSearchParams(searchParams));
      return newConfig;
    });
  }, [searchParams]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    if (term) {
      searchParams.set('search', term)
    } else {
      searchParams.delete('search')
    }
    setSearchParams(new URLSearchParams(searchParams))
    setPage(1)
  }, [searchParams])

  const addFilter = useCallback((key: string) => {
    setFilters(prevFilters => {
      const newFilters: FilterEntry[] = [...prevFilters, { key, value: ['', ''] }];
      searchParams.set(key, ',');
      setSearchParams(new URLSearchParams(searchParams));
      return newFilters;
    });
  }, [searchParams]);

  const updateFilter = useCallback((index: number, newValue: [string, string]) => {
    setFilters(prevFilters => {
      const newFilters = [...prevFilters];
      newFilters[index] = { ...newFilters[index], value: newValue };
      searchParams.set(newFilters[index].key, newValue.join(','));
      setSearchParams(new URLSearchParams(searchParams));
      return newFilters;
    });
  }, [searchParams]);

  const removeFilter = useCallback((index: number) => {
    setFilters(prevFilters => {
      const newFilters = prevFilters.filter((_, i) => i !== index)
      searchParams.delete(prevFilters[index].key)
      setSearchParams(new URLSearchParams(searchParams))
      return newFilters
    })
  }, [searchParams])

  // Render
  if (error) return <div>An error occurred: {(error as Error).message}</div>

  return (
    <div className="space-y-4">
      <Card className="bg-card text-card-foreground">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
            <div className="flex flex-wrap gap-2">
              {filters.map((entry: FilterEntry, index: number) => (
                <div key={entry.key} className="mb-2">
                  <FilterInput
                    label={entry.key}
                    value={entry.value}
                    onChange={(value) => updateFilter(index, value)}
                    onRemove={() => removeFilter(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground">
        <CardContent>
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead className="cursor-pointer w-1/5">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('name')} />
                      <span onClick={() => handleSort('name')}>Name</span>
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-1/10">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('rarity')} />
                      <span onClick={() => handleSort('rarity')}>Rarity</span>
                      {sortConfig.key === 'rarity' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-1/10">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('type')} />
                      <span onClick={() => handleSort('type')}>Type</span>
                      {sortConfig.key === 'type' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-1/10">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('buy_price')} />
                      <span onClick={() => handleSort('buy_price')}>Buy Price</span>
                      {sortConfig.key === 'buy_price' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-1/10">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('sell_price')} />
                      <span onClick={() => handleSort('sell_price')}>Sell Price</span>
                      {sortConfig.key === 'sell_price' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-1/10">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('expected_profit')} />
                      <span onClick={() => handleSort('expected_profit')}>Expected Profit</span>
                      {sortConfig.key === 'expected_profit' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-1/10">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('1d_buy_sold')} />
                      <span onClick={() => handleSort('1d_buy_sold')}>1d Buy Sold</span>
                      {sortConfig.key === '1d_buy_sold' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-1/10">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" onClick={() => addFilter('1d_sell_sold')} />
                      <span onClick={() => handleSort('1d_sell_sold')}>1d Sell Sold</span>
                      {sortConfig.key === '1d_sell_sold' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items || []).map((item: any) => {
                  const expectedProfit = calculateProfit(item.buy_price, item.sell_price)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="w-24">
                        <Link href={`/item/${item.id}`}>
                          <img src={item.img} alt={item.name} className="w-12 h-12 object-contain cursor-pointer" />
                        </Link>
                      </TableCell>
                      <TableCell className="w-1/5">
                        <Link href={`/item/${item.id}`} className="hover:underline cursor-pointer">
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell className="w-1/10">
                        <Badge className={`${rarityColors[item.rarity]}`}>{item.rarity}</Badge>
                      </TableCell>
                      <TableCell className="w-1/10">
                        <Badge className={`${typeColors[item.type]}`}>{item.type}</Badge>
                      </TableCell>
                      <TableCell className="w-1/10">{formatPrice(item.buy_price)}</TableCell>
                      <TableCell className="w-1/10">{formatPrice(item.sell_price)}</TableCell>
                      <TableCell className="w-1/10">{formatPrice(expectedProfit)}</TableCell>
                      <TableCell className="w-1/10">{item['1d_buy_sold']}</TableCell>
                      <TableCell className="w-1/10">{item['1d_sell_sold']}</TableCell>
                    </TableRow>
                  )
                })}
                {/* Add empty rows to maintain table height when fewer items are present */}
                {data?.items && data.items.length < limit && Array.from({ length: limit - data.items.length }).map((_, index) => (
                  <TableRow key={`empty-${index}`}>
                    {Array.from({ length: 9 }).map((_, cellIndex) => (
                      <TableCell key={`empty-cell-${cellIndex}`}>&nbsp;</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(isLoading || isFetching) && (
              <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground">
        <CardContent>
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
              disabled={page === 1 || isLoading}
            >
              Previous Page
            </Button>
            <span>
              {isLoading || isFetching 
                ? 'Loading...' 
                : `Page ${data?.currentPage || page} of ${data?.totalPages || 1}`
              }
            </span>
            <Button 
              onClick={() => setPage(prev => prev + 1)} 
              disabled={isLoading || (data?.currentPage === data?.totalPages)}
            >
              Next Page
            </Button>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                {[20, 50, 100, 200, 500].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value} items
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {lastUpdated && (
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdated}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}