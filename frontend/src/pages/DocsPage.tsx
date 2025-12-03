import React from 'react'

export default function DocsPage() {
  const [content, setContent] = React.useState<string>('<p>Loading documentation...</p>')

  React.useEffect(() => {
    // Determine which static docs file to load based on the path.
    // /docs            -> /docs/index.html
    // /docs/intro      -> /docs/intro.html
    // /docs/intro.html -> /docs/intro.html
    const path = location.pathname
    let file = '/docs/index.html'
    if (path !== '/docs' && path !== '/docs/') {
      const sub = path.replace(/^\/docs\/?/, '')
      if (sub.endsWith('.html')) file = `/docs/${sub}`
      else if (sub) file = `/docs/${sub}.html`
    }

    let canceled = false
    fetch(file, { cache: 'no-cache' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load ${file}: ${r.status}`)
        const text = await r.text()
        if (!canceled) {
          // Extract only the body content to avoid nested HTML documents
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          const bodyContent = doc.body.innerHTML
          setContent(bodyContent)
        }
      })
      .catch(() => {
        if (!canceled) setContent('<h2>Documentation not found</h2><p>Ask the project maintainers to add docs under <code>frontend/public/docs/</code>.</p>')
      })

    return () => { canceled = true }
  }, [location.pathname]) // Add dependency on pathname to re-fetch when route changes

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Render the fetched HTML body content from the static docs folder. */}
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  )
}
