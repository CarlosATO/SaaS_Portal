import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const AdminPanel = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState([])
  const [modules, setModules] = useState([])
  const [activeLicenses, setActiveLicenses] = useState({}) 

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_super_admin) {
        alert("⛔ Acceso Denegado: No eres Super Admin")
        navigate('/dashboard')
        return
      }
      
      fetchData()
    }

    checkAdmin()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
      
      setCompanies(orgsData || [])

      const { data: modsData } = await supabase
        .from('app_modules')
        .select('*')
      
      setModules(modsData || [])

      const { data: licensesData } = await supabase
        .from('org_modules')
        .select('organization_id, module_key, status')
      
      const licensesMap = {}
      licensesData?.forEach(item => {
        if (item.status === 'active') {
          licensesMap[`${item.organization_id}_${item.module_key}`] = true
        }
      })
      setActiveLicenses(licensesMap)

    } catch (error) {
      console.error("Error cargando datos admin:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = async (orgId, modKey, currentStatus) => {
    const compositeKey = `${orgId}_${modKey}`
    
    try {
      if (currentStatus) {
        await supabase
          .from('org_modules')
          .delete()
          .match({ organization_id: orgId, module_key: modKey })
        
        const newMap = { ...activeLicenses }
        delete newMap[compositeKey]
        setActiveLicenses(newMap)

      } else {
        await supabase
          .from('org_modules')
          .insert({ organization_id: orgId, module_key: modKey, status: 'active' })
        
        setActiveLicenses({ ...activeLicenses, [compositeKey]: true })
      }
    } catch (error) {
      alert("Error actualizando módulo")
      console.error(error)
    }
  }

  if (loading) return <div style={{padding: 40}}>Cargando Panel Maestro...</div>

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>🦸‍♂️ Super Admin Panel</h1>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Volver al Dashboard
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: '15px' }}>Empresa Cliente</th>
              <th style={{ padding: '15px' }}>Fecha Alta</th>
              {modules.map(mod => (
                <th key={mod.key} style={{ padding: '15px', textAlign: 'center' }}>
                  {mod.name} <br/>
                  <small style={{ fontWeight: 'normal' }}>(${mod.base_price})</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map(org => (
              <tr key={org.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{org.name}</td>
                <td style={{ padding: '15px', color: '#666' }}>{new Date(org.created_at).toLocaleDateString()}</td>
                
                {modules.map(mod => {
                  const isActive = activeLicenses[`${org.id}_${mod.key}`]
                  return (
                    <td key={mod.key} style={{ padding: '15px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleModule(org.id, mod.key, isActive)}
                        style={{
                          padding: '6px 12px',
                          cursor: 'pointer',
                          // Removed duplicate `border` property; border set conditionally below
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          backgroundColor: isActive ? '#d1fae5' : '#f3f4f6',
                          color: isActive ? '#065f46' : '#6b7280',
                          border: isActive ? '1px solid #34d399' : '1px solid #d1d5db'
                        }}
                      >
                        {isActive ? '✅ ACTIVO' : '⛔ INACTIVO'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPanel