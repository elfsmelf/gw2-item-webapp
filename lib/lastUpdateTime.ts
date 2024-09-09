import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const LAST_UPDATE_FILE = path.join(DATA_DIR, 'lastUpdateTime.json')

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

export async function getLastUpdateTime(): Promise<number> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(LAST_UPDATE_FILE, 'utf8')
    return JSON.parse(data).lastUpdateTime
  } catch (error) {
    return 0
  }
}

export async function setLastUpdateTime(time: number): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(LAST_UPDATE_FILE, JSON.stringify({ lastUpdateTime: time }))
}