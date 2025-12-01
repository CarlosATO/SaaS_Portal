import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

const TeamSettings = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState([])
  const [invites, setInvites] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [myRole, setMyRole] = useState('')

  useEffect(() => {
    if (user) loadTeamData()
  }, [user])

  const loadTeamData = async () => {
    try {
      setLoading(true)
      
      // 1. Averiguar mi Org ID y mi Rol
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()
      
      setMyRole(myProfile.role)

      if (myProfile.organization_id) {
        // 2. Cargar compañeros de equipo
        const { data: members } = await supabase
          .from('profiles')
          .select('id, full_name, email:id(email), role') // Truco para sacar email (requiere config extra) o solo mostramos nombre
          // Nota: Por privacidad, Supabase no deja leer emails de auth.users facilmente. 
          // Para este ejemplo mostraremos Nombre y Rol.
          .eq('organization_id', myProfile.organization_id)
        
        setTeam(members || [])

        // 3. Cargar invitaciones pendientes
        const { data: pending } = await supabase
          .from('organization_invites')
          .select('*')
          .eq('organization_id', myProfile.organization_id)
        
        setInvites(pending || [])
      }

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!newEmail) return

    try {
      // Obtenemos mi ID de org de nuevo para asegurar
      const { data: myProfile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      
      const { error } = await supabase.from('organization_invites').insert({
        email: newEmail,
        organization_id: myProfile.organization_id,
        role: 'member'
      })

      if (error) throw error
      
      alert('Invitación creada. Dile al usuario que se registre con este email.')
      setNewEmail('')
      loadTeamData() // Recargar lista

    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) return <div>Cargando equipo...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 Gestión de Equipo</h2>

      {/* Solo el Admin puede invitar */}
      {myRole === 'admin' ? (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
          <h3>Invitar nuevo miembro</h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="email" 
              placeholder="correo@compañero.com" 
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
              style={{ padding: '8px', flex: 1 }}
            />
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Invitar
            </button>
          </form>
          <small>El usuario debe registrarse usando este mismo correo para unirse automáticamente.</small>
        </div>
      ) : (
        <p>Solo los administradores pueden invitar usuarios.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Columna 1: Miembros Activos */}
        <div>
          <h3>Miembros Activos</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {team.map(member => (
              <li key={member.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <span>{member.full_name || 'Usuario'}</span>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: member.role === 'admin' ? '#dcfce7' : '#f3f4f6' }}>
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 2: Invitaciones Pendientes */}
        <div>
          <h3>Invitaciones Pendientes</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {invites.length === 0 && <li style={{color: '#999'}}>No hay invitaciones pendientes</li>}
            {invites.map(invite => (
              <li key={invite.id} style={{ padding: '10px', borderBottom: '1px solid #eee', color: '#666' }}>
                ⏳ {invite.email} ({invite.role})
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}

export default TeamSettings