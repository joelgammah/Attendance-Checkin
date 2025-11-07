import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import App from './App'
import Auth0ProviderWithConfig from './auth/Auth0ProviderWithConfig'

ReactDOM.createRoot(document.getElementById('root')!).render(
	<Auth0ProviderWithConfig>
		<App />
	</Auth0ProviderWithConfig>
)
