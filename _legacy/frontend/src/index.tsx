import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initializeMonitoring, ErrorBoundary } from './monitoring/init'

// Initialize client-side monitoring
initializeMonitoring()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
