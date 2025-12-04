import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import DocsPage from '../pages/DocsPage'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock global location
const mockLocation = {
  pathname: '/docs',
  href: '',
  origin: 'http://localhost'
}
Object.defineProperty(global, 'location', {
  value: mockLocation,
  writable: true
})

describe('DocsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.pathname = '/docs'
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders loading message initially', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><body><h1>Test</h1></body></html>')
    })

    render(<DocsPage />)
    
    expect(screen.getByText('Loading documentation...')).toBeInTheDocument()
  })

  it('loads and renders index.html for /docs path', async () => {
    const mockHtml = `
      <html>
        <head><title>Test</title></head>
        <body>
          <h1>Welcome to Documentation</h1>
          <p>This is the index page</p>
        </body>
      </html>
    `
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    })

    render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Welcome to Documentation')).toBeInTheDocument()
      expect(screen.getByText('This is the index page')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/docs/index.html', { cache: 'no-cache' })
  })

  it('loads specific doc file for /docs/intro path', async () => {
    mockLocation.pathname = '/docs/intro'
    
    const mockHtml = `
      <html>
        <head><title>Introduction</title></head>
        <body>
          <h1>Getting Started</h1>
          <p>Introduction content</p>
        </body>
      </html>
    `
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    })

    render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Introduction content')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/docs/intro.html', { cache: 'no-cache' })
  })

  it('loads .html file directly for /docs/api.html path', async () => {
    mockLocation.pathname = '/docs/api.html'
    
    const mockHtml = `
      <html>
        <head><title>API Reference</title></head>
        <body>
          <h1>API Documentation</h1>
          <p>API endpoints and usage</p>
        </body>
      </html>
    `
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    })

    render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('API Documentation')).toBeInTheDocument()
      expect(screen.getByText('API endpoints and usage')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/docs/api.html', { cache: 'no-cache' })
  })

  it('loads index.html for /docs/ path with trailing slash', async () => {
    mockLocation.pathname = '/docs/'
    
    const mockHtml = `
      <html>
        <head><title>Home</title></head>
        <body>
          <h1>Documentation Home</h1>
        </body>
      </html>
    `
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    })

    render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Documentation Home')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/docs/index.html', { cache: 'no-cache' })
  })

  it('extracts only body content from HTML, not head or html tags', async () => {
    const mockHtml = `
      <html>
        <head>
          <title>Should Not Appear</title>
          <meta name="description" content="Should not appear">
        </head>
        <body>
          <h1>Visible Content</h1>
          <p>This should appear</p>
          <script>console.log("Should not appear")</script>
        </body>
      </html>
    `
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    })

    render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Visible Content')).toBeInTheDocument()
      expect(screen.getByText('This should appear')).toBeInTheDocument()
    })

    // Ensure head content doesn't appear
    expect(screen.queryByText('Should Not Appear')).not.toBeInTheDocument()
  })

  it('displays error message when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Documentation not found')).toBeInTheDocument()
      expect(screen.getByText(/Ask the project maintainers to add docs/)).toBeInTheDocument()
    })
  })

  it('displays error message when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found')
    })

    render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Documentation not found')).toBeInTheDocument()
    })
  })

  it('handles empty body content gracefully', async () => {
    const mockHtml = `
      <html>
        <head><title>Empty</title></head>
        <body></body>
      </html>
    `
    
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    })

    render(<DocsPage />)

    await waitFor(() => {
      // Should not crash, content area should exist but be empty
      expect(screen.queryByText('Loading documentation...')).not.toBeInTheDocument()
    })
  })

  it('re-fetches content when pathname changes', async () => {
    // Initial render at /docs
    const mockHtmlIndex = `<html><body><h1>Index Page</h1></body></html>`
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtmlIndex)
    })

    const { rerender } = render(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Index Page')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/docs/index.html', { cache: 'no-cache' })

    // Change pathname and rerender
    mockLocation.pathname = '/docs/usage'
    const mockHtmlUsage = `<html><body><h1>Usage Guide</h1></body></html>`
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtmlUsage)
    })

    rerender(<DocsPage />)

    await waitFor(() => {
      expect(screen.getByText('Usage Guide')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/docs/usage.html', { cache: 'no-cache' })
  })

  it('cancels fetch request when component unmounts', async () => {
    let rejectFetch: (reason: any) => void

    mockFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        rejectFetch = reject
      })
    })

    const { unmount } = render(<DocsPage />)
    
    // Unmount before fetch completes
    unmount()
    
    // Simulate fetch completion after unmount - should not update state
    rejectFetch!(new Error('Cancelled'))

    // No state update should occur after unmount
    // This test mainly ensures no console errors or warnings
  })

  it('renders with correct container styling', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><body><h1>Test</h1></body></html>')
    })

    const { container } = render(<DocsPage />)
    
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv).toHaveClass('min-h-screen', 'p-6')
    
    const innerDiv = outerDiv.firstChild as HTMLElement
    expect(innerDiv).toHaveClass('max-w-4xl', 'mx-auto')
  })
})