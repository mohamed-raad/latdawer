'use client'

import { useState, useCallback } from 'react'
import { ZodSchema, ZodError } from 'zod'

interface UseFormValidationReturn<T> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
  handleChange: (field: keyof T, value: unknown) => void
  handleBlur: (field: keyof T) => void
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: React.FormEvent) => Promise<void>
  reset: () => void
  setFieldValue: (field: keyof T, value: unknown) => void
  setFieldError: (field: keyof T, error: string) => void
}

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  initialValues: T
): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = useCallback(
    (data: T) => {
      try {
        schema.parse(data)
        return {}
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {}
          error.issues.forEach((err) => {
            const field = err.path.join('.')
            fieldErrors[field] = err.message
          })
          return fieldErrors
        }
        return {}
      }
    },
    [schema]
  )

  const isValid = Object.keys(validate(values)).length === 0

  const handleChange = useCallback(
    (field: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }))
      if (touched[field as string]) {
        const newValues = { ...values, [field]: value }
        const newErrors = validate(newValues)
        setErrors((prev) => ({
          ...prev,
          [field as string]: newErrors[field as string] || '',
        }))
      }
    },
    [touched, values, validate]
  )

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field as string]: true }))
      const fieldErrors = validate(values)
      setErrors((prev) => ({
        ...prev,
        [field as string]: fieldErrors[field as string] || '',
      }))
    },
    [values, validate]
  )

  const handleSubmit =
    (onSubmit: (values: T) => Promise<void>) =>
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)

      const allTouched: Record<string, boolean> = {}
      Object.keys(values).forEach((key) => {
        allTouched[key] = true
      })
      setTouched(allTouched)

      const validationErrors = validate(values)
      setErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        try {
          await onSubmit(values)
        } catch (error) {
          console.error('Form submission error:', error)
        }
      }

      setIsSubmitting(false)
    }

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field as string]: error }))
  }, [])

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  }
}