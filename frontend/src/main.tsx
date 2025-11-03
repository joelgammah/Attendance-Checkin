import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './styles/index.css'
import App from './App'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID

// Validate Auth0 configuration
if (!domain || !clientId) {
  console.error('Auth0 configuration missing. Please check your .env file.')
  console.error('Required environment variables:')
  console.error('- VITE_AUTH0_DOMAIN')
  console.error('- VITE_AUTH0_CLIENT_ID')
  throw new Error('Auth0 domain and client ID must be set in .env file')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    <App />
  </Auth0Provider>
)