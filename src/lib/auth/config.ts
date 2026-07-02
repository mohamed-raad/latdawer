export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars!!'
)

export const COOKIE_NAME = 'session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
