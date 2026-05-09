import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('zeusfit_token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadMe(nextToken = token) {
    if (!nextToken) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await client.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${nextToken}` },
      })
      setUser(res.data.user)
    } catch {
      localStorage.removeItem('zeusfit_token')
      setToken('')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(email, password) {
    const res = await client.post('/api/auth/login', { email, password })
    localStorage.setItem('zeusfit_token', res.data.access_token)
    setToken(res.data.access_token)
    setUser(res.data.user)
    return res.data.user
  }

  async function register(payload) {
    const res = await client.post('/api/auth/register', payload)
    localStorage.setItem('zeusfit_token', res.data.access_token)
    setToken(res.data.access_token)
    setUser(res.data.user)
    return res.data.user
  }

  function logout() {
    localStorage.removeItem('zeusfit_token')
    setToken('')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshMe: loadMe,
      setUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

