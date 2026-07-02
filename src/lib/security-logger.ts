import { logger } from './logger'

export type SecurityEvent =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'signup_attempt'
  | 'signup_success'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'unauthorized_access'
  | 'csrf_violation'
  | 'rate_limit_exceeded'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'suspicious_activity'

interface SecurityLogEntry {
  event: SecurityEvent
  userId?: string
  ip?: string
  userAgent?: string
  details?: Record<string, unknown>
}

export function logSecurityEvent(entry: SecurityLogEntry) {
  const { event, userId, ip, userAgent, details } = entry

  const logEntry = {
    event,
    userId,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    ...details,
  }

  switch (event) {
    case 'sql_injection_attempt':
    case 'xss_attempt':
    case 'csrf_violation':
    case 'suspicious_activity':
      logger.error(`Security: ${event}`, undefined, logEntry)
      break
    case 'rate_limit_exceeded':
    case 'unauthorized_access':
      logger.warn(`Security: ${event}`, logEntry)
      break
    default:
      logger.info(`Security: ${event}`, logEntry)
  }
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}