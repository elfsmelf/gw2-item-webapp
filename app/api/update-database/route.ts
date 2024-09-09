import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import fetch from 'node-fetch'

// Database connection parameters
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gw2_tradingpost_app',
  password: 'postgres',
  port: 5432,
})

// API URL and fields
const API_URL = "https://api.datawars2.ie/gw2/v1/items/json"
const FIELDS = "id,name,charm,img,rarity,chat_link,level,type,firstAdded,statName,upgradeName,weaponType,lastUpdate,buy_price,sell_price,sell_quantity,buy_quantity,1d_sell_price_avg,1d_sell_sold,1d_sell_listed,1d_sell_delisted,1d_sell_value,1d_sell_quantity_avg,2d_sell_price_avg,2d_sell_sold,2d_sell_listed,2d_sell_delisted,2d_sell_value,2d_sell_quantity_avg,7d_sell_price_avg,7d_sell_sold,7d_sell_listed,7d_sell_delisted,7d_sell_value,7d_sell_quantity_avg,1m_sell_price_avg,1m_sell_sold,1m_sell_listed,1m_sell_delisted,1m_sell_value,1m_sell_quantity_avg,1d_buy_price_avg,1d_buy_sold,1d_buy_listed,1d_buy_delisted,1d_buy_value,1d_buy_quantity_avg,2d_buy_price_avg,2d_buy_sold,2d_buy_listed,2d_buy_delisted,2d_buy_value,2d_buy_quantity_avg,7d_buy_price_avg,7d_buy_sold,7d_buy_listed,7d_buy_delisted,7d_buy_value,7d_buy_quantity_avg,1m_buy_price_avg,1m_buy_sold,1m_buy_listed,1m_buy_delisted,1m_buy_value,1m_buy_quantity_avg,1d_sell_delisted_value,2d_sell_delisted_value,7d_sell_delisted_value,1m_sell_delisted_value"

async function fetchData() {
  const params = new URLSearchParams({
    fields: FIELDS,
    beautify: 'min'
  })
  const response = await fetch(`${API_URL}?${params}`)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

async function createTable(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS gw2_items (
      id BIGINT PRIMARY KEY,
      name TEXT,
      charm TEXT,
      img TEXT,
      rarity TEXT,
      chat_link TEXT,
      level NUMERIC,
      type TEXT,
      first_added TIMESTAMP,
      stat_name TEXT,
      upgrade_name TEXT,
      weapon_type TEXT,
      last_update TIMESTAMP,
      buy_price NUMERIC,
      sell_price NUMERIC,
      sell_quantity NUMERIC,
      buy_quantity NUMERIC,
      one_d_sell_price_avg NUMERIC,
      one_d_sell_sold NUMERIC,
      one_d_sell_listed NUMERIC,
      one_d_sell_delisted NUMERIC,
      one_d_sell_value NUMERIC,
      one_d_sell_quantity_avg NUMERIC,
      two_d_sell_price_avg NUMERIC,
      two_d_sell_sold NUMERIC,
      two_d_sell_listed NUMERIC,
      two_d_sell_delisted NUMERIC,
      two_d_sell_value NUMERIC,
      two_d_sell_quantity_avg NUMERIC,
      seven_d_sell_price_avg NUMERIC,
      seven_d_sell_sold NUMERIC,
      seven_d_sell_listed NUMERIC,
      seven_d_sell_delisted NUMERIC,
      seven_d_sell_value NUMERIC,
      seven_d_sell_quantity_avg NUMERIC,
      one_m_sell_price_avg NUMERIC,
      one_m_sell_sold NUMERIC,
      one_m_sell_listed NUMERIC,
      one_m_sell_delisted NUMERIC,
      one_m_sell_value NUMERIC,
      one_m_sell_quantity_avg NUMERIC,
      one_d_buy_price_avg NUMERIC,
      one_d_buy_sold NUMERIC,
      one_d_buy_listed NUMERIC,
      one_d_buy_delisted NUMERIC,
      one_d_buy_value NUMERIC,
      one_d_buy_quantity_avg NUMERIC,
      two_d_buy_price_avg NUMERIC,
      two_d_buy_sold NUMERIC,
      two_d_buy_listed NUMERIC,
      two_d_buy_delisted NUMERIC,
      two_d_buy_value NUMERIC,
      two_d_buy_quantity_avg NUMERIC,
      seven_d_buy_price_avg NUMERIC,
      seven_d_buy_sold NUMERIC,
      seven_d_buy_listed NUMERIC,
      seven_d_buy_delisted NUMERIC,
      seven_d_buy_value NUMERIC,
      seven_d_buy_quantity_avg NUMERIC,
      one_m_buy_price_avg NUMERIC,
      one_m_buy_sold NUMERIC,
      one_m_buy_listed NUMERIC,
      one_m_buy_delisted NUMERIC,
      one_m_buy_value NUMERIC,
      one_m_buy_quantity_avg NUMERIC,
      one_d_sell_delisted_value NUMERIC,
      two_d_sell_delisted_value NUMERIC,
      seven_d_sell_delisted_value NUMERIC,
      one_m_sell_delisted_value NUMERIC,
      profit NUMERIC GENERATED ALWAYS AS (sell_price - buy_price) STORED,
      roi NUMERIC GENERATED ALWAYS AS (CASE WHEN buy_price > 0 THEN ((sell_price - buy_price) / buy_price * 100) ELSE NULL END) STORED,
      total_sold NUMERIC GENERATED ALWAYS AS (one_d_buy_sold + one_d_sell_sold) STORED,
      total_value NUMERIC GENERATED ALWAYS AS (one_d_buy_value + one_d_sell_value) STORED,
      total_listed NUMERIC GENERATED ALWAYS AS (buy_quantity + sell_quantity) STORED,
      total_delisted NUMERIC GENERATED ALWAYS AS (one_d_buy_delisted + one_d_sell_delisted) STORED,
      total_delisted_value NUMERIC GENERATED ALWAYS AS (one_d_sell_delisted_value) STORED,
      sell_tax NUMERIC GENERATED ALWAYS AS (sell_price * 0.15) STORED,
      buy_tax NUMERIC GENERATED ALWAYS AS (buy_price * 0.05) STORED,
      total_tax NUMERIC GENERATED ALWAYS AS ((sell_price * 0.15) + (buy_price * 0.05)) STORED
    )
  `)
}

function validateItemData(item: any) {
  const columnMapping: { [key: string]: string } = {
    firstAdded: 'first_added',
    lastUpdate: 'last_update',
    statName: 'stat_name',
    upgradeName: 'upgrade_name',
    weaponType: 'weapon_type',
    '1d_sell_price_avg': 'one_d_sell_price_avg',
    '1d_sell_sold': 'one_d_sell_sold',
    '1d_sell_listed': 'one_d_sell_listed',
    '1d_sell_delisted': 'one_d_sell_delisted',
    '1d_sell_value': 'one_d_sell_value',
    '1d_sell_quantity_avg': 'one_d_sell_quantity_avg',
    '2d_sell_price_avg': 'two_d_sell_price_avg',
    '2d_sell_sold': 'two_d_sell_sold',
    '2d_sell_listed': 'two_d_sell_listed',
    '2d_sell_delisted': 'two_d_sell_delisted',
    '2d_sell_value': 'two_d_sell_value',
    '2d_sell_quantity_avg': 'two_d_sell_quantity_avg',
    '7d_sell_price_avg': 'seven_d_sell_price_avg',
    '7d_sell_sold': 'seven_d_sell_sold',
    '7d_sell_listed': 'seven_d_sell_listed',
    '7d_sell_delisted': 'seven_d_sell_delisted',
    '7d_sell_value': 'seven_d_sell_value',
    '7d_sell_quantity_avg': 'seven_d_sell_quantity_avg',
    '1m_sell_price_avg': 'one_m_sell_price_avg',
    '1m_sell_sold': 'one_m_sell_sold',
    '1m_sell_listed': 'one_m_sell_listed',
    '1m_sell_delisted': 'one_m_sell_delisted',
    '1m_sell_value': 'one_m_sell_value',
    '1m_sell_quantity_avg': 'one_m_sell_quantity_avg',
    '1d_buy_price_avg': 'one_d_buy_price_avg',
    '1d_buy_sold': 'one_d_buy_sold',
    '1d_buy_listed': 'one_d_buy_listed',
    '1d_buy_delisted': 'one_d_buy_delisted',
    '1d_buy_value': 'one_d_buy_value',
    '1d_buy_quantity_avg': 'one_d_buy_quantity_avg',
    '2d_buy_price_avg': 'two_d_buy_price_avg',
    '2d_buy_sold': 'two_d_buy_sold',
    '2d_buy_listed': 'two_d_buy_listed',
    '2d_buy_delisted': 'two_d_buy_delisted',
    '2d_buy_value': 'two_d_buy_value',
    '2d_buy_quantity_avg': 'two_d_buy_quantity_avg',
    '7d_buy_price_avg': 'seven_d_buy_price_avg',
    '7d_buy_sold': 'seven_d_buy_sold',
    '7d_buy_listed': 'seven_d_buy_listed',
    '7d_buy_delisted': 'seven_d_buy_delisted',
    '7d_buy_value': 'seven_d_buy_value',
    '7d_buy_quantity_avg': 'seven_d_buy_quantity_avg',
    '1m_buy_price_avg': 'one_m_buy_price_avg',
    '1m_buy_sold': 'one_m_buy_sold',
    '1m_buy_listed': 'one_m_buy_listed',
    '1m_buy_delisted': 'one_m_buy_delisted',
    '1m_buy_value': 'one_m_buy_value',
    '1m_buy_quantity_avg': 'one_m_buy_quantity_avg',
    '1d_sell_delisted_value': 'one_d_sell_delisted_value',
    '2d_sell_delisted_value': 'two_d_sell_delisted_value',
    '7d_sell_delisted_value': 'seven_d_sell_delisted_value',
    '1m_sell_delisted_value': 'one_m_sell_delisted_value'
  }

  const validatedItem: { [key: string]: any } = {}
  for (const [key, value] of Object.entries(item)) {
    const newKey = columnMapping[key] || key
    if (newKey === 'id') {
      validatedItem[newKey] = value !== null ? parseInt(value as string) : null
    } else if (newKey === 'level' || newKey.endsWith('_price') || newKey.endsWith('_quantity') || newKey.endsWith('_avg') || newKey.endsWith('_sold') || newKey.endsWith('_listed') || newKey.endsWith('_delisted') || newKey.endsWith('_value')) {
      validatedItem[newKey] = value !== null ? parseFloat(value as string) : null
    } else if (newKey === 'first_added' || newKey === 'last_update') {
      validatedItem[newKey] = value ? new Date(value as string) : null
    } else {
      validatedItem[newKey] = value
    }
  }
  return validatedItem
}

async function insertData(client: any, data: any[]) {
  const batchSize = 100
  const errors: string[] = []

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    try {
      const values = batch.map(item => Object.values(validateItemData(item)))
      const placeholders = batch.map((_, index) => 
        `(${Object.keys(batch[0]).map((_, colIndex) => `$${index * Object.keys(batch[0]).length + colIndex + 1}`).join(', ')})`
      ).join(', ')

      const query = `
        INSERT INTO gw2_items (${Object.keys(validateItemData(batch[0])).join(', ')})
        VALUES ${placeholders}
        ON CONFLICT (id) DO UPDATE SET
        ${Object.keys(validateItemData(batch[0])).filter(key => key !== 'id').map(key => `${key} = EXCLUDED.${key}`).join(', ')}
      `

      await client.query(query, values.flat())
      console.log(`Inserted batch ${i / batchSize + 1}`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error inserting batch ${i / batchSize + 1}:`, errorMessage)
      errors.push(`Error inserting batch ${i / batchSize + 1}: ${errorMessage}`)
    }
  }

  return errors.length > 0 ? errors : null
}

export async function GET() {
  const startTime = Date.now()

  try {
    console.log("Fetching data from API...")
    const data = await fetchData() as any[]
    console.log(`Fetched ${data.length} items`)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      console.log("Ensuring table exists...")
      await createTable(client)

      console.log("Inserting/updating data in database...")
      const errors = await insertData(client, data)

      if (errors) {
        await client.query('ROLLBACK')
        return NextResponse.json({ 
          error: "Errors occurred during data insertion", 
          details: errors
        }, { status: 500 })
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000

    return NextResponse.json({ 
      message: "Database updated successfully", 
      itemsProcessed: data.length,
      duration: `${duration.toFixed(2)} seconds`
    })
  } catch (error) {
    console.error("An error occurred:", error)
    return NextResponse.json({ error: "An error occurred while updating the database", details: error }, { status: 500 })
  }
}

export { GET as default }