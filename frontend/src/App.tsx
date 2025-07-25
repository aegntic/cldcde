import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { apiClient, wsClient, type User } from './api/client'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Repositories from './pages/Repositories'
import Workflows from './pages/Workflows'
import Projects from './pages/Projects'
import './styles/github-dark.css'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    checkAuth()
    
    // Connect WebSocket
    wsClient.connect()
    
    return () => {
      wsClient.disconnect()
    }
  }, [])

  const checkAuth = async () => {
    const result = await apiClient.getCurrentUser()
    if (result.data) {
      setUser(result.data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading CLDCDE Pro...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />}
        />
        <Route
          path="/"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/repositories"
          element={user ? <Repositories user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/workflows"
          element={user ? <Workflows user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects"
          element={user ? <Projects user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  )
}

export default App