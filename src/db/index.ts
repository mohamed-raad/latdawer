import * as schema from './schema'

export { schema }

// Lazy DB singleton
let _db: unknown = null
let _dbResolved = false

function getDbConnection() {
  if (_dbResolved) return _db

  // Try Cloudflare D1 first
  try {
    const cfGlobal = Symbol.for('__cloudflare-context__')
    const store = (globalThis as Record<symbol, unknown>)[cfGlobal]
    if (store && typeof store === 'object' && 'env' in store) {
      const env = (store as { env: { DB: unknown } }).env
      if (env && env.DB) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { drizzle } = require('drizzle-orm/d1')
        _db = drizzle(env.DB, { schema })
        _dbResolved = true
        return _db
      }
    }
  } catch {
    // Not on Cloudflare
  }

  // Local development — better-sqlite3
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./index.development')
  _db = mod.db
  _dbResolved = true
  return _db
}

export const db = new Proxy({} as object, {
  get(_, prop) {
    const conn = getDbConnection() as Record<string | symbol, unknown>
    const val = conn[prop]
    if (typeof val === 'function') {
      return val.bind(conn)
    }
    return val
  },
  has(_, prop) {
    return prop in (getDbConnection() as object)
  },
  apply(_target, _thisArg, args) {
    return (getDbConnection() as unknown as (...a: unknown[]) => unknown)(...args)
  },
})
