import { vi } from 'vitest'

// Mock react-dom/client default export
vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn(() => ({
      render: vi.fn()
    }))
  }
}))

vi.mock('../App', () => ({
  default: () => null
}))

vi.mock('../styles/index.css', () => ({}))

// Mock document methods
global.document = {
  getElementById: vi.fn(() => ({}))
} as any

describe('Main module coverage', () => {
  it('imports and executes main.tsx', async () => {
    // This will provide coverage for main.tsx
    await import('../main')
  })
})