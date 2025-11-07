export function useParams(){
  // Handle both /events/:token and /checkin/:token patterns
  const eventMatch = location.pathname.match(/\/events\/(.+)$/)
  const checkinMatch = location.pathname.match(/\/checkin\/(.+)$/)
  return { token: eventMatch?.[1] || checkinMatch?.[1] || '' }
}

export function useSearch(){
  const p = new URLSearchParams(location.search)
  return { token: p.get('token') || '' }
}
