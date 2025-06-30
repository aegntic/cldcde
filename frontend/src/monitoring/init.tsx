/**
 * Client-side monitoring initialization
 * Integrates Web Vitals and error tracking
 */

import { initWebVitals } from '../../../src/monitoring/web-vitals'

// Initialize monitoring on app load
export function initializeMonitoring() {
  // Initialize Web Vitals collection
  if (typeof window !== 'undefined') {
    // Disable web vitals for now since the endpoint doesn't exist
    // TODO: Re-enable when metrics API is implemented
    // initWebVitals('/api/metrics/vitals')
    
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      
      // Disable error reporting to avoid network errors
      // This endpoint doesn't exist on Cloudflare Pages
      /*
      fetch('/api/metrics/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Silently fail to avoid error loops
      })
      */
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Disable error reporting to avoid network errors
      // This endpoint doesn't exist on Cloudflare Pages
      /*
      fetch('/api/metrics/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Unhandled promise rejection',
          reason: String(event.reason),
          stack: event.reason?.stack,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Silently fail to avoid error loops
      })
      */
    })
  }
}

// React Error Boundary for catching component errors
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Stack:', error.stack)
    
    // Disable error reporting to avoid network errors
    // This endpoint doesn't exist on Cloudflare Pages
    /*
    fetch('/api/metrics/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(() => {
      // Silently fail to avoid error loops
    })
    */
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#ff0000',
          fontFamily: 'monospace'
        }}>
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering this component.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}