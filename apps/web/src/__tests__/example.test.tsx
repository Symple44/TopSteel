// apps/web/src/__tests__/example.test.tsx
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Test d'exemple - remplacez par vos vrais tests
describe('Example Test', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })

  it('should render text', () => {
    const { container } = render(<div>Hello Test</div>)
    expect(container).toBeInTheDocument()
  })
})
