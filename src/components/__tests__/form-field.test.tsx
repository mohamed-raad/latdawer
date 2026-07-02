import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FormField, FormSelect, FormTextarea } from '@/components/form-field'

describe('FormField Component', () => {
  it('renders with label', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows error when touched', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        error="Email is required"
        touched={true}
      />
    )
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('does not show error when not touched', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        error="Email is required"
        touched={false}
      />
    )
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument()
  })

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={handleChange}
      />
    )
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    })
    expect(handleChange).toHaveBeenCalledWith('test@example.com')
  })
})

describe('FormSelect Component', () => {
  const options = [
    { value: 'ar', label: 'Arabic' },
    { value: 'en', label: 'English' },
  ]

  it('renders with options', () => {
    render(
      <FormSelect
        label="Language"
        name="language"
        value="ar"
        onChange={() => {}}
        options={options}
      />
    )
    expect(screen.getByDisplayValue('Arabic')).toBeInTheDocument()
  })

  it('calls onChange when selection changes', () => {
    const handleChange = vi.fn()
    render(
      <FormSelect
        label="Language"
        name="language"
        value="ar"
        onChange={handleChange}
        options={options}
      />
    )
    fireEvent.change(screen.getByDisplayValue('Arabic'), {
      target: { value: 'en' },
    })
    expect(handleChange).toHaveBeenCalledWith('en')
  })
})

describe('FormTextarea Component', () => {
  it('renders with label', () => {
    render(
      <FormTextarea
        label="Description"
        name="description"
        value=""
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn()
    render(
      <FormTextarea
        label="Description"
        name="description"
        value=""
        onChange={handleChange}
      />
    )
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    })
    expect(handleChange).toHaveBeenCalledWith('Test description')
  })
})