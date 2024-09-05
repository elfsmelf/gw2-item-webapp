import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { fetchAndUpdateItemData } from '@/lib/backgroundFetch'

const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'gw2_items.json')
const METADATA_FILE_PATH = path.join(process.cwd(), 'public', 'gw2_items_metadata.json')

export async function GET(request: Request) {
  console.log('GET request received');
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const search = searchParams.get('search') || ''
  const sortKey = searchParams.get('sortKey') || 'name'
  const sortDirection = searchParams.get('sortDirection') || 'asc'
  const rarity = searchParams.get('rarity')
  const type = searchParams.get('type')

  try {
    console.log('Reading item data from:', DATA_FILE_PATH);
    const itemsData = JSON.parse(await fs.readFile(DATA_FILE_PATH, 'utf8'))
    console.log('Items data loaded, count:', itemsData.length);
    
    console.log('Reading metadata from:', METADATA_FILE_PATH);
    const metadata = JSON.parse(await fs.readFile(METADATA_FILE_PATH, 'utf8'))
    console.log('Metadata loaded:', metadata);

    // Trigger background update without waiting for it
    fetchAndUpdateItemData().catch(console.error)

    // Filter items
    let filteredItems = itemsData.filter((item: any) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
      if (rarity && item.rarity !== rarity) return false
      if (type && item.type !== type) return false

      // Handle numeric filters
      const entries = Array.from(searchParams.entries());
      for (const [key, value] of entries) {
        if (['buy_price', 'sell_price', 'expected_profit', '1d_buy_sold', '1d_sell_sold'].includes(key)) {
          const [min, max] = value.split(',').map(Number)
          let itemValue = item[key]
          if (key === 'expected_profit') {
            itemValue = item.sell_price - item.buy_price
          }
          if ((min && itemValue < min) || (max && itemValue > max)) return false
        }
      }

      return true
    })

    // Sort items
    filteredItems.sort((a: any, b: any) => {
      let aValue = a[sortKey]
      let bValue = b[sortKey]

      // Handle expected profit sorting
      if (sortKey === 'expected_profit') {
        aValue = a.sell_price - a.buy_price
        bValue = b.sell_price - b.buy_price
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    // Paginate items
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedItems = filteredItems.slice(startIndex, endIndex)

    console.log('Sending response with', paginatedItems.length, 'items');
    return new NextResponse(JSON.stringify({
      items: paginatedItems,
      currentPage: page,
      totalPages: Math.ceil(filteredItems.length / limit),
      totalItems: filteredItems.length,
      lastUpdated: metadata.lastUpdated
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error in GET function:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }
}

// Add OPTIONS handler for preflight requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}