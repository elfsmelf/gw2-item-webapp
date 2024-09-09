import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { ChevronUp, ChevronDown } from "lucide-react"
import { formatPercentage } from "@/lib/utils"

interface ItemTableProps {
  data: any[]
  visibleColumns: Set<string>
  sortConfig: { key: string; direction: 'asc' | 'desc' }
  handleSort: (key: string) => void
  isLoading: boolean
  isFetching: boolean
  limit: number
}

const CoinDisplay = ({ amount }: { amount: number | null }) => {
  if (amount === null) return <span>N/A</span>
  
  const gold = Math.floor(amount / 10000)
  const silver = Math.floor((amount % 10000) / 100)
  const copper = amount % 100

  return (
    <div className="flex items-center justify-end space-x-1 text-sm">
      {gold > 0 && (
        <span className="flex items-center">
          {gold.toLocaleString()}
          <img src="/images/gold-coin.png" alt="Gold" className="w-4 h-4 ml-1" />
        </span>
      )}
      {(silver > 0 || gold > 0) && (
        <span className="flex items-center">
          {silver.toString().padStart(2, '0')}
          <img src="/images/silver-coin.png" alt="Silver" className="w-4 h-4 ml-1" />
        </span>
      )}
      <span className="flex items-center">
        {copper.toString().padStart(2, '0')}
        <img src="/images/copper-coin.png" alt="Copper" className="w-4 h-4 ml-1" />
      </span>
    </div>
  )
}

const formatROI = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function ItemTable({ data, visibleColumns, sortConfig, handleSort, isLoading, isFetching, limit }: ItemTableProps) {
  const rarityColors: { [key: string]: string } = {
    Junk: "bg-gray-500 text-white",
    Basic: "bg-black text-white",
    Fine: "bg-blue-500 text-white",
    Masterwork: "bg-green-500 text-white",
    Rare: "bg-yellow-500 text-white",
    Exotic: "bg-orange-500 text-white",
    Ascended: "bg-pink-500 text-white",
    Legendary: "bg-purple-500 text-white"
  }

  const typeColors: { [key: string]: string } = {
    Armor: "bg-blue-200 text-blue-800",
    Back: "bg-purple-200 text-purple-800",
    Bag: "bg-yellow-200 text-yellow-800",
    Consumable: "bg-green-200 text-green-800",
    Container: "bg-orange-200 text-orange-800",
    CraftingMaterial: "bg-red-200 text-red-800",
    Gathering: "bg-brown-200 text-brown-800",
    Gizmo: "bg-pink-200 text-pink-800",
    MiniPet: "bg-cyan-200 text-cyan-800",
    Tool: "bg-gray-200 text-gray-800",
    Trinket: "bg-indigo-200 text-indigo-800",
    Trophy: "bg-yellow-100 text-yellow-800",
    UpgradeComponent: "bg-purple-100 text-purple-800",
    Weapon: "bg-red-100 text-red-800"
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.has('image') && <TableHead className="w-[60px]">Image</TableHead>}
            {Array.from(visibleColumns).filter(column => column !== 'image').map(column => (
              <TableHead 
                key={column} 
                className={`cursor-pointer ${column === 'name' ? 'text-left' : 'text-right'}`}
                onClick={() => handleSort(column)}
              >
                <div className={`flex items-center ${column === 'name' ? 'justify-start' : 'justify-end'}`}>
                  {column}
                  {sortConfig.key === column && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any) => (
            <TableRow key={item.id} className="text-sm">
              {visibleColumns.has('image') && (
                <TableCell className="p-2 w-[60px]">
                  <div className="flex items-center justify-center">
                    <img
                      src={item.img || '/placeholder-image.png'}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                </TableCell>
              )}
              {Array.from(visibleColumns).filter(column => column !== 'image').map(column => (
                <TableCell 
                  key={column} 
                  className={`${column === 'name' ? 'text-left' : 'text-right'} ${column === 'name' ? 'sticky left-0 z-10 bg-background' : ''}`}
                >
                  {column === 'name' ? (
                    <Link href={`/item/${item.id}`} className="hover:underline cursor-pointer">
                      <span className="block truncate" title={item[column]}>{item[column]}</span>
                    </Link>
                  ) : column === 'rarity' || column === 'type' ? (
                    <Badge className={`${column === 'rarity' ? rarityColors[item[column]] : typeColors[item[column]]} text-xs`}>{item[column]}</Badge>
                  ) : column === 'buy_price' || column === 'sell_price' ? (
                    <CoinDisplay amount={item[column]} />
                  ) : column === 'profit' ? (
                    <CoinDisplay amount={Math.round(item[column])} />
                  ) : column === 'roi' ? (
                    <Badge className={`${item[column] >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                      {formatROI(item[column])}
                    </Badge>
                  ) : (
                    String(item[column])
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {data.length < limit && Array.from({ length: limit - data.length }).map((_, index) => (
            <TableRow key={`empty-${index}`}>
              {visibleColumns.has('image') && <TableCell>&nbsp;</TableCell>}
              {Array.from(visibleColumns).filter(column => column !== 'image').map((_, cellIndex) => (
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
  )
}