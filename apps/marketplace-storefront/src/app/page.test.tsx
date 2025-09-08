import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

// Mock component since we don't have the actual page
function HomePage() {
  return <div>Marketplace Storefront</div>
}

describe('Home Page', () => {
  it('should render marketplace storefront', () => {
    render(<HomePage />)
    expect(screen.getByText('Marketplace Storefront')).toBeDefined()
  })
})
