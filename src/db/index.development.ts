import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import * as path from 'path'

// Ensure .data directory exists (only needed for first run)
const dbDir = path.resolve(process.cwd(), '.data')
const dbPath = path.join(dbDir, 'central-parts-finder.db')

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
