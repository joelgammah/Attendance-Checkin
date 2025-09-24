export function useParams(){
  const m = location.pathname.match(/\/events\/(.+)$/)
  return { token: m? m[1]: '' }
}

export function useSearch(){
  const p = new URLSearchParams(location.search)
  return { token: p.get('token') || '' }
}
