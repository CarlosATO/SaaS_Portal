import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext()

// URL del Portal Central
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleSSO = async () => {
      // 1. Verificar sesión existente
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setLoading(false)
        return
      }

      // 2. SSO vía URL Hash
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error && data.session) {
            setUser(data.session.user)
            window.history.replaceState({}, document.title, window.location.pathname)
            setLoading(false)
            return
          }
        }
      }

      // 3. Si falla, expulsar al Portal
      // Si no hay sesión y no vienen tokens en la URL, redirigimos al Portal Central (puerto 5173)
      window.location.href = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173'; 
      setLoading(false); 
    }

    handleSSO()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)