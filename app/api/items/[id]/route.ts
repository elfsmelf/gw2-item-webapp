import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a new pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gw2_tradingpost_app',
  password: 'postgres',
  port: 5432,
})

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    const client = await pool.connect()
    try {
      const result = await client.query('SELECT * FROM items WHERE id = $1', [id])
      
      if (result.rows.length === 0) {
        return new NextResponse(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const item = result.rows[0]

      // Transform the data to include all fields from the database
      const transformedItem = {
        id: item.id,
        name: item.name,
        charm: item.charm,
        img: item.img,
        rarity: item.rarity,
        chat_link: item.chat_link,
        level: item.level,
        type: item.type,
        first_added: item.first_added,
        stat_name: item.stat_name,
        upgrade_name: item.upgrade_name,
        weapon_type: item.weapon_type,
        last_update: item.last_update,
        buy_price: item.buy_price,
        sell_price: item.sell_price,
        sell_quantity: item.sell_quantity,
        buy_quantity: item.buy_quantity,
        one_d_sell_price_avg: item.one_d_sell_price_avg,
        one_d_sell_sold: item.one_d_sell_sold,
        one_d_sell_listed: item.one_d_sell_listed,
        one_d_sell_delisted: item.one_d_sell_delisted,
        one_d_sell_value: item.one_d_sell_value,
        one_d_sell_quantity_avg: item.one_d_sell_quantity_avg,
        two_d_sell_price_avg: item.two_d_sell_price_avg,
        two_d_sell_sold: item.two_d_sell_sold,
        two_d_sell_listed: item.two_d_sell_listed,
        two_d_sell_delisted: item.two_d_sell_delisted,
        two_d_sell_value: item.two_d_sell_value,
        two_d_sell_quantity_avg: item.two_d_sell_quantity_avg,
        seven_d_sell_price_avg: item.seven_d_sell_price_avg,
        seven_d_sell_sold: item.seven_d_sell_sold,
        seven_d_sell_listed: item.seven_d_sell_listed,
        seven_d_sell_delisted: item.seven_d_sell_delisted,
        seven_d_sell_value: item.seven_d_sell_value,
        seven_d_sell_quantity_avg: item.seven_d_sell_quantity_avg,
        one_m_sell_price_avg: item.one_m_sell_price_avg,
        one_m_sell_sold: item.one_m_sell_sold,
        one_m_sell_listed: item.one_m_sell_listed,
        one_m_sell_delisted: item.one_m_sell_delisted,
        one_m_sell_value: item.one_m_sell_value,
        one_m_sell_quantity_avg: item.one_m_sell_quantity_avg,
        one_d_buy_price_avg: item.one_d_buy_price_avg,
        one_d_buy_sold: item.one_d_buy_sold,
        one_d_buy_listed: item.one_d_buy_listed,
        one_d_buy_delisted: item.one_d_buy_delisted,
        one_d_buy_value: item.one_d_buy_value,
        one_d_buy_quantity_avg: item.one_d_buy_quantity_avg,
        two_d_buy_price_avg: item.two_d_buy_price_avg,
        two_d_buy_sold: item.two_d_buy_sold,
        two_d_buy_listed: item.two_d_buy_listed,
        two_d_buy_delisted: item.two_d_buy_delisted,
        two_d_buy_value: item.two_d_buy_value,
        two_d_buy_quantity_avg: item.two_d_buy_quantity_avg,
        seven_d_buy_price_avg: item.seven_d_buy_price_avg,
        seven_d_buy_sold: item.seven_d_buy_sold,
        seven_d_buy_listed: item.seven_d_buy_listed,
        seven_d_buy_delisted: item.seven_d_buy_delisted,
        seven_d_buy_value: item.seven_d_buy_value,
        seven_d_buy_quantity_avg: item.seven_d_buy_quantity_avg,
        one_m_buy_price_avg: item.one_m_buy_price_avg,
        one_m_buy_sold: item.one_m_buy_sold,
        one_m_buy_listed: item.one_m_buy_listed,
        one_m_buy_delisted: item.one_m_buy_delisted,
        one_m_buy_value: item.one_m_buy_value,
        one_m_buy_quantity_avg: item.one_m_buy_quantity_avg,
        one_d_sell_delisted_value: item.one_d_sell_delisted_value,
        two_d_sell_delisted_value: item.two_d_sell_delisted_value,
        seven_d_sell_delisted_value: item.seven_d_sell_delisted_value,
        one_m_sell_delisted_value: item.one_m_sell_delisted_value
      }

      return new NextResponse(JSON.stringify(transformedItem), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching item details:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}