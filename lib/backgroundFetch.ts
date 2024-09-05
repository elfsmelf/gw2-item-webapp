import fs from 'fs/promises'
import path from 'path'

const API_URL = 'https://api.datawars2.ie/gw2/v1/items/json?fields=id,name,img,rarity,buy_price,sell_price,buy_quantity,sell_quantity,chat_link,type,weaponType,1d_buy_sold,1d_sell_sold'
const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'gw2_items.json')
const METADATA_FILE_PATH = path.join(process.cwd(), 'public', 'gw2_items_metadata.json')

let lastFetchTime = 0
const FETCH_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

export async function fetchAndUpdateItemData() {
  console.log('fetchAndUpdateItemData called');
  const now = Date.now()
  if (now - lastFetchTime < FETCH_INTERVAL) {
    console.log('Skipping update, last fetch was too recent');
    return
  }

  try {
    console.log('Fetching data from API');
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const newData = await response.json()
    console.log('Fetched', newData.length, 'items from API');

    console.log('Reading existing data');
    const existingData = JSON.parse(await fs.readFile(DATA_FILE_PATH, 'utf8'))
    console.log('Existing data has', existingData.length, 'items');

    console.log('Merging data');
    const updatedData = newData.map((newItem: any) => ({
      ...existingData.find((existingItem: any) => existingItem.id === newItem.id),
      ...newItem
    }))

    console.log('Writing updated data');
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(updatedData, null, 2))

    console.log('Updating metadata');
    await fs.writeFile(METADATA_FILE_PATH, JSON.stringify({ lastUpdated: now }, null, 2))

    console.log('Item data updated successfully');
    lastFetchTime = now
  } catch (error) {
    console.error('Error updating item data:', error)
  }
}