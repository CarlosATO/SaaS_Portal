import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [companyName, setCompanyName] = useState('Cargando...')

  const apps = [
    { 
      id: 'rrhh', name: 'Recursos Humanos', desc: 'Nóminas y empleados', icon: '👥', status: 'active', url: import.meta.env.VITE_RRHH_URL, color: 'bg-blue-500' 
    },
    { 
      id: 'logis', name: 'Logística', desc: 'Flota y rutas', icon: '🚚', status: 'coming_soon', url: '/logistica', color: 'bg-orange-500' 
    },
    { 
      id: 'settings', name: 'Configuración', desc: 'Datos de empresa', icon: '⚙️', status: 'active', url: '/settings', color: 'bg-gray-600' 
    }
  ]

  useEffect(() => {
    if (!user) return
    const fetchProfileData = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, organization_id, is_super_admin')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
        if (profileData?.organization_id) {
          const { data: orgData } = await supabase.from('organizations').select('name').eq('id', profileData.organization_id).single()
          if (orgData) setCompanyName(orgData.name)
        }
      } catch (error) { console.error(error) }
    }
    fetchProfileData()
  }, [user])

  const handleAppClick = async (app) => {
    if (app.status === 'coming_soon') {
      alert('🚧 Este módulo está en construcción')
      return
    }

    try {
      // 1. Obtenemos la sesión actual del usuario en el Portal
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        navigate('/login')
        return
      }

      // 2. Construimos la URL de destino con los tokens en el Hash (#)
      const targetUrl = new URL(app.url, 'http://localhost:5174') // Base URL del módulo
      targetUrl.hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=recovery`

      // 3. Redirigimos al usuario (fuera del Portal, hacia el Módulo)
      window.location.href = targetUrl.toString()

    } catch (error) {
      console.error('Error manejando redirección de app:', error)
      alert('Error al intentar abrir la aplicación. Intenta de nuevo más tarde.')
    }
  }

  const handleLogout = async () => { await signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Navbar Superior */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg">🚀</div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Portal SaaS</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{companyName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm text-gray-600">Hola, <span className="font-bold text-gray-900">{profile?.full_name?.split(' ')[0]}</span></span>
          
          {/* Botones de Acción */}
          <div className="flex gap-2">
            {profile?.is_super_admin && (
              <button onClick={() => navigate('/admin')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                <span>🦸‍♂️</span> Admin
              </button>
            )}
            
            <button onClick={() => navigate('/team')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
              <span>👥</span> Equipo
            </button>
            
            <button onClick={handleLogout} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto mt-10 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tus Aplicaciones</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div 
              key={app.id} 
              onClick={() => handleAppClick(app)}
              className={`group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden ${app.status === 'coming_soon' ? 'opacity-70 grayscale' : ''}`}
            >
              <div className={`${app.color} w-14 h-14 rounded-2xl flex items-center justify-center text-3xl text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {app.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{app.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{app.desc}</p>
              
              {app.status === 'coming_soon' && (
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Próximamente
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Dashboard