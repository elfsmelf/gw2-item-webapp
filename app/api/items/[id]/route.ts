import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'gw2_items.json')

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    const itemsData = JSON.parse(await fs.readFile(DATA_FILE_PATH, 'utf8'))
    const item = itemsData.find((item: any) => item.id.toString() === id)

    if (!item) {
      return new NextResponse(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new NextResponse(JSON.stringify(item), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching item details:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}