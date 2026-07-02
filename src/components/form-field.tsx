'use client'

interface FormFieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  touched?: boolean
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  disabled,
  className = '',
}: FormFieldProps) {
  const hasError = touched && error

  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
          hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-foreground focus:ring-2 focus:ring-foreground/20'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {hasError && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface FormSelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: { value: string; label: string }[]
  error?: string
  touched?: boolean
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  error,
  touched,
  required,
  disabled,
  className = '',
}: FormSelectProps) {
  const hasError = touched && error

  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
          hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-foreground focus:ring-2 focus:ring-foreground/20'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface FormTextareaProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  touched?: boolean
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function FormTextarea({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  disabled,
  rows = 3,
  className = '',
}: FormTextareaProps) {
  const hasError = touched && error

  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
          hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-foreground focus:ring-2 focus:ring-foreground/20'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {hasError && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}