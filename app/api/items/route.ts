import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getLastUpdateTime, setLastUpdateTime } from '@/lib/lastUpdateTime'
import { GET as updateDatabase } from '../update-database/route'

// Create a new pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gw2_tradingpost_app',
  password: 'postgres',
  port: 5432,
})

const UPDATE_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

async function checkAndUpdateDatabase() {
  const lastUpdateTime = await getLastUpdateTime()
  const currentTime = Date.now()

  if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
    console.log('Updating database...')
    await updateDatabase()
    await setLastUpdateTime(currentTime)
  }
}

export async function GET(request: Request) {
  await checkAndUpdateDatabase()

  console.log('GET request received');
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const search = searchParams.get('search') || ''
  const sortKey = searchParams.get('sortKey') || 'name'
  const sortDirection = searchParams.get('sortDirection') || 'asc'
  const rarity = searchParams.get('rarity')
  const type = searchParams.get('type')

  console.log('Query parameters:', { page, limit, search, sortKey, sortDirection, rarity, type });

  try {
    const client = await pool.connect()
    try {
      // Check if the table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE  table_schema = 'public'
          AND    table_name   = 'gw2_items'
        );
      `)
      
      if (!tableCheck.rows[0].exists) {
        return new NextResponse(JSON.stringify({ error: "Data not available. Please run the update endpoint first." }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Construct the base query
      let query = `
        SELECT *, 
        CASE 
          WHEN sell_price IS NOT NULL AND sell_price > 0 AND buy_price > 0
          THEN (sell_price * 0.85) - (buy_price * 1.05)
          ELSE NULL
        END as profit,
        CASE 
          WHEN sell_price IS NOT NULL AND sell_price > 0 AND buy_price > 0
          THEN (((sell_price * 0.85) - (buy_price * 1.05)) / (buy_price * 1.05)) * 100
          ELSE NULL
        END as roi,
        (one_d_buy_sold + one_d_sell_sold) as total_sold,
        (one_d_buy_value + one_d_sell_value) as total_value,
        (buy_quantity + COALESCE(sell_quantity, 0)) as total_listed,
        (one_d_buy_delisted + one_d_sell_delisted) as total_delisted,
        one_d_sell_delisted_value as total_delisted_value,
        CASE WHEN sell_price IS NOT NULL AND sell_price > 0 THEN (sell_price * 0.15) ELSE NULL END as sell_tax,
        (buy_price * 0.05) as buy_tax,
        CASE 
          WHEN sell_price IS NOT NULL AND sell_price > 0
          THEN ((sell_price * 0.15) + (buy_price * 0.05))
          ELSE (buy_price * 0.05)
        END as total_tax,
        
        -- Change calculations
        (one_d_buy_sold - two_d_buy_sold) as change_buy_sold_day,
        (one_d_sell_sold - two_d_sell_sold) as change_sell_sold_day,
        ((one_d_buy_sold + one_d_sell_sold) - (two_d_buy_sold + two_d_sell_sold)) as change_total_sold_day,
        
        (one_d_buy_listed - two_d_buy_listed) as change_buy_listed_day,
        (one_d_sell_listed - two_d_sell_listed) as change_sell_listed_day,
        ((one_d_buy_listed + one_d_sell_listed) - (two_d_buy_listed + two_d_sell_listed)) as change_total_listed_day,
        
        (one_d_buy_delisted - two_d_buy_delisted) as change_buy_delisted_day,
        (one_d_sell_delisted - two_d_sell_delisted) as change_sell_delisted_day,
        ((one_d_buy_delisted + one_d_sell_delisted) - (two_d_buy_delisted + two_d_sell_delisted)) as change_total_delisted_day,
        
        (one_d_buy_value - two_d_buy_value) as change_buy_value_day,
        (one_d_sell_value - two_d_sell_value) as change_sell_value_day,
        ((one_d_buy_value + one_d_sell_value) - (two_d_buy_value + two_d_sell_value)) as change_total_value_day,
        
        (one_d_buy_price_avg - two_d_buy_price_avg) as change_buy_price_avg_day,
        (one_d_sell_price_avg - two_d_sell_price_avg) as change_sell_price_avg_day,
        ((one_d_buy_price_avg + one_d_sell_price_avg) - (two_d_buy_price_avg + two_d_sell_price_avg)) / 2 as change_total_price_avg_day,
        
        (one_d_buy_quantity_avg - two_d_buy_quantity_avg) as change_buy_quantity_avg_day,
        (one_d_sell_quantity_avg - two_d_sell_quantity_avg) as change_sell_quantity_avg_day,
        ((one_d_buy_quantity_avg + one_d_sell_quantity_avg) - (two_d_buy_quantity_avg + two_d_sell_quantity_avg)) / 2 as change_total_quantity_avg_day
        
        FROM gw2_items WHERE 1=1
      `
      const queryParams = []

      // Add search condition
      if (search) {
        query += ' AND name ILIKE $' + (queryParams.length + 1)
        queryParams.push(`%${search}%`)
      }

      // Add rarity filter
      if (rarity) {
        query += ' AND rarity = $' + (queryParams.length + 1)
        queryParams.push(rarity)
      }

      // Add type filter
      if (type) {
        query += ' AND type = $' + (queryParams.length + 1)
        queryParams.push(type)
      }

      // Handle numeric filters
      const numericFilters = ['buy_price', 'sell_price', 'one_d_buy_sold', 'one_d_sell_sold']
      numericFilters.forEach(filter => {
        const value = searchParams.get(filter)
        if (value) {
          const [min, max] = value.split(',').map(Number)
          if (!isNaN(min)) {
            query += ` AND ${filter} >= $` + (queryParams.length + 1)
            queryParams.push(min)
          }
          if (!isNaN(max)) {
            query += ` AND ${filter} <= $` + (queryParams.length + 1)
            queryParams.push(max)
          }
        }
      })

      // Handle expected_profit filter
      const expectedProfitValue = searchParams.get('expected_profit')
      if (expectedProfitValue) {
        const [min, max] = expectedProfitValue.split(',').map(Number)
        if (!isNaN(min)) {
          query += ` AND (sell_price * 0.85) - (buy_price * 1.05) >= $` + (queryParams.length + 1)
          queryParams.push(min)
        }
        if (!isNaN(max)) {
          query += ` AND (sell_price * 0.85) - (buy_price * 1.05) <= $` + (queryParams.length + 1)
          queryParams.push(max)
        }
      }

      // Handle sorting
      const validSortKeys = [
        'name', 'rarity', 'type', 'buy_price', 'sell_price', 'profit', 'roi',
        'total_sold', 'total_value', 'total_listed', 'total_delisted',
        'total_delisted_value', 'sell_tax', 'buy_tax', 'total_tax'
      ]
      
      console.log('Sorting by:', sortKey, 'in direction:', sortDirection);

      if (validSortKeys.includes(sortKey)) {
        switch (sortKey) {
          case 'profit':
            query += ` ORDER BY (CASE 
              WHEN sell_price IS NOT NULL AND sell_price > 0 AND buy_price > 0
              THEN (sell_price * 0.85) - (buy_price * 1.05)
              ELSE NULL
            END) ${sortDirection} NULLS LAST`
            break
          case 'roi':
            query += ` ORDER BY (CASE 
              WHEN sell_price IS NOT NULL AND sell_price > 0 AND buy_price > 0
              THEN (((sell_price * 0.85) - (buy_price * 1.05)) / (buy_price * 1.05)) * 100
              ELSE NULL
            END) ${sortDirection} NULLS LAST`
            break
          case 'total_sold':
            query += ` ORDER BY (one_d_buy_sold + one_d_sell_sold) ${sortDirection} NULLS LAST`
            break
          case 'total_value':
            query += ` ORDER BY (one_d_buy_value + one_d_sell_value) ${sortDirection} NULLS LAST`
            break
          case 'total_listed':
            query += ` ORDER BY (buy_quantity + COALESCE(sell_quantity, 0)) ${sortDirection} NULLS LAST`
            break
          case 'total_delisted':
            query += ` ORDER BY (one_d_buy_delisted + one_d_sell_delisted) ${sortDirection} NULLS LAST`
            break
          case 'total_delisted_value':
            query += ` ORDER BY one_d_sell_delisted_value ${sortDirection} NULLS LAST`
            break
          case 'sell_tax':
            query += ` ORDER BY (CASE WHEN sell_price IS NOT NULL AND sell_price > 0 THEN (sell_price * 0.15) ELSE NULL END) ${sortDirection} NULLS LAST`
            break
          case 'buy_tax':
            query += ` ORDER BY (buy_price * 0.05) ${sortDirection} NULLS LAST`
            break
          case 'total_tax':
            query += ` ORDER BY (CASE 
              WHEN sell_price IS NOT NULL AND sell_price > 0
              THEN ((sell_price * 0.15) + (buy_price * 0.05))
              ELSE (buy_price * 0.05)
            END) ${sortDirection} NULLS LAST`
            break
          default:
            query += ` ORDER BY ${sortKey} ${sortDirection} NULLS LAST`
        }
      } else {
        query += ` ORDER BY name ASC NULLS LAST`  // Default sorting
      }

      // Add pagination
      query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
      queryParams.push(limit, (page - 1) * limit)

      console.log('Executing query:', query);
      console.log('Query parameters:', queryParams);

      const result = await client.query(query, queryParams)

      console.log('Query executed, fetched', result.rows.length, 'items');
      console.log('First item:', result.rows[0]);
      console.log('Last item:', result.rows[result.rows.length - 1]);

      // Get total count for pagination
      const countResult = await client.query('SELECT COUNT(*) FROM gw2_items')
      const totalItems = parseInt(countResult.rows[0].count, 10)

      return new NextResponse(JSON.stringify({
        items: result.rows,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        lastUpdated: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    } finally {
      client.release()
    }
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