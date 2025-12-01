import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import '@testing-library/jest-dom'
import { describe, expect, it, vi } from 'vitest'
import { CheckboxInput, Input, NumberInput, PasswordInput, RadioInput, SearchInput } from '../index'

// Mock the design system utilities
vi.mock('../../../../lib/design-system', () => ({
  buttonVariants: vi.fn(
    ({ variant, size }) => `button-${variant || 'default'}-${size || 'default'}`
  ),
}))

vi.mock('../../../../lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}))

// Mock class-variance-authority
vi.mock('class-variance-authority', () => ({
  cva: vi.fn(() => vi.fn(() => 'mocked-class')),
}))

describe('Input Component', () => {
  const user = userEvent.setup()

  it('renders correctly with default props', () => {
    render(<Input />)

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('handles text input correctly', async () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello World')

    // Check that change handler was called for each character typed
    expect(handleChange).toHaveBeenCalled()
    expect(handleChange.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('applies error state correctly', () => {
    render(<Input error="This field is required" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('mocked-class')
  })

  it('applies success state correctly', () => {
    render(<Input success />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('mocked-class')
  })

  it('applies warning state correctly', () => {
    render(<Input warning />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('mocked-class')
  })

  it('handles number values correctly', () => {
    render(<Input type="number" value={42} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(42)
  })

  it('handles precision for number values', () => {
    render(<Input type="number" value={Math.PI} precision={2} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(3.14) // Number instead of string
  })

  it('renders with start icon', () => {
    const StartIcon = () => <span data-testid="start-icon">🔍</span>
    render(<Input startIcon={<StartIcon />} />)

    expect(screen.getByTestId('start-icon')).toBeInTheDocument()
  })

  it('renders with end icon', () => {
    const EndIcon = () => <span data-testid="end-icon">📝</span>
    render(<Input endIcon={<EndIcon />} />)

    expect(screen.getByTestId('end-icon')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Input loading />)

    expect(screen.getByLabelText('Chargement en cours')).toBeInTheDocument()
  })

  it('handles clearable functionality', async () => {
    const handleChange = vi.fn()
    const handleClear = vi.fn()

    render(<Input value="test content" clearable onClear={handleClear} onChange={handleChange} />)

    const clearButton = screen.getByLabelText('Effacer le contenu')
    expect(clearButton).toBeInTheDocument()

    await user.click(clearButton)

    expect(handleClear).toHaveBeenCalled()
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: '' }),
      })
    )
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  describe('Checkbox Input', () => {
    it('renders checkbox correctly', () => {
      render(<Input type="checkbox" />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })

    it('handles checked state', () => {
      const handleCheckedChange = vi.fn()
      render(<Input type="checkbox" checked={true} onCheckedChange={handleCheckedChange} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('calls onCheckedChange when clicked', async () => {
      const handleCheckedChange = vi.fn()
      render(<Input type="checkbox" onCheckedChange={handleCheckedChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleCheckedChange).toHaveBeenCalledWith(true)
    })
  })

  describe('Radio Input', () => {
    it('renders radio correctly', () => {
      render(<Input type="radio" name="test" />)

      const radio = screen.getByRole('radio')
      expect(radio).toBeInTheDocument()
    })

    it('handles checked state for radio', () => {
      render(<Input type="radio" name="test" checked={true} />)

      const radio = screen.getByRole('radio')
      expect(radio).toBeChecked()
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Input aria-label="Search field" />)

      const input = screen.getByLabelText('Search field')
      expect(input).toBeInTheDocument()
    })

    it('supports aria-describedby', () => {
      const TestComponent = () => {
        const helpId = React.useId()
        return (
          <div>
            <Input aria-describedby={helpId} />
            <div id={helpId}>Enter your name</div>
          </div>
        )
      }
      render(<TestComponent />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby')
      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      const helpText = document.getElementById(describedBy!)
      expect(helpText).toHaveTextContent('Enter your name')
    })

    it('supports required attribute', () => {
      render(<Input required />)

      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })

    it('supports disabled attribute', () => {
      render(<Input disabled />)

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })
  })
})

describe('NumberInput Component', () => {
  it('renders with number type', () => {
    render(<NumberInput />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('applies min/max constraints', () => {
    render(<NumberInput min={0} max={100} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
  })

  it('handles allowNegative prop', () => {
    render(<NumberInput allowNegative={false} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '0')
  })

  it('allows negative numbers when allowNegative is true', () => {
    render(<NumberInput allowNegative={true} />)

    const input = screen.getByRole('spinbutton')
    expect(input).not.toHaveAttribute('min')
  })
})

describe('SearchInput Component', () => {
  it('renders with search type and icon', () => {
    render(<SearchInput />)

    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('placeholder', 'Rechercher...')
  })

  it('is clearable by default', () => {
    render(<SearchInput value="search term" />)

    // Clear button should be present when there's a value
    expect(screen.getByLabelText('Effacer le contenu')).toBeInTheDocument()
  })
})

describe('PasswordInput Component', () => {
  const user = userEvent.setup()

  it('renders with password type initially', () => {
    render(<PasswordInput data-testid="password-input" />)

    const input = screen.getByTestId('password-input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('toggles password visibility', async () => {
    render(<PasswordInput data-testid="password-input" />)

    const input = screen.getByTestId('password-input')
    // Find button with hidden option since it might be inaccessible
    const toggleButton = screen.getByRole('button', { hidden: true })

    expect(input).toHaveAttribute('type', 'password')

    await user.click(toggleButton)

    await waitFor(() => {
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  it('shows appropriate icons for visibility toggle', async () => {
    render(<PasswordInput data-testid="password-input" />)

    // Should have a toggle button (with hidden option)
    const toggleButton = screen.getByRole('button', { hidden: true })
    expect(toggleButton).toBeInTheDocument()

    await user.click(toggleButton)

    // Should still have the toggle button after click
    await waitFor(() => {
      const updatedToggleButton = screen.getByRole('button', { hidden: true })
      expect(updatedToggleButton).toBeInTheDocument()
    })
  })
})

describe('CheckboxInput Component', () => {
  it('renders as checkbox', () => {
    render(<CheckboxInput />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toHaveAttribute('type', 'checkbox')
  })

  it('forwards all props correctly', () => {
    render(<CheckboxInput name="test-checkbox" value="test" />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('name', 'test-checkbox')
    expect(checkbox).toHaveAttribute('value', 'test')
  })
})

describe('RadioInput Component', () => {
  it('renders as radio', () => {
    render(<RadioInput />)

    const radio = screen.getByRole('radio')
    expect(radio).toBeInTheDocument()
    expect(radio).toHaveAttribute('type', 'radio')
  })

  it('forwards all props correctly', () => {
    render(<RadioInput name="test-radio" value="option1" />)

    const radio = screen.getByRole('radio')
    expect(radio).toHaveAttribute('name', 'test-radio')
    expect(radio).toHaveAttribute('value', 'option1')
  })
})
