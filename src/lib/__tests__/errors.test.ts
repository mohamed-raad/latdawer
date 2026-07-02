import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '@/lib/errors'

describe('Error classes', () => {
  it('creates AppError with correct properties', () => {
    const error = new AppError('Test error', 'TEST_ERROR', 500)
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_ERROR')
    expect(error.statusCode).toBe(500)
    expect(error.name).toBe('AppError')
  })

  it('creates NotFoundError', () => {
    const error = new NotFoundError('User', '123')
    expect(error.message).toBe('User with id 123 not found')
    expect(error.code).toBe('NOT_FOUND')
    expect(error.statusCode).toBe(404)
  })

  it('creates NotFoundError without id', () => {
    const error = new NotFoundError('User')
    expect(error.message).toBe('User not found')
  })

  it('creates ValidationError', () => {
    const error = new ValidationError('Invalid input', { email: 'Invalid email' })
    expect(error.message).toBe('Invalid input')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.fields).toEqual({ email: 'Invalid email' })
  })

  it('creates UnauthorizedError', () => {
    const error = new UnauthorizedError()
    expect(error.message).toBe('Unauthorized')
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.statusCode).toBe(401)
  })

  it('creates ForbiddenError', () => {
    const error = new ForbiddenError()
    expect(error.message).toBe('Forbidden')
    expect(error.code).toBe('FORBIDDEN')
    expect(error.statusCode).toBe(403)
  })

  it('creates ConflictError', () => {
    const error = new ConflictError('Email already exists')
    expect(error.message).toBe('Email already exists')
    expect(error.code).toBe('CONFLICT')
    expect(error.statusCode).toBe(409)
  })
})