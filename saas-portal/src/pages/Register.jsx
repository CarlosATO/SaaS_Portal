import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

const Register = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    try {
      // 1. Registrar al usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName, 
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
      
      // 2. Verificamos si el Trigger ya le asignó una empresa (por invitación)
      // Damos un pequeño respiro de 500ms para asegurar que el trigger de BD terminó
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', authData.user.id)
        .single()

      if (profile && profile.organization_id) {
        // CASO A: ¡FUE INVITADO!
        // No creamos empresa. Le avisamos y redirigimos.
        setMsg('👋 ¡Te detectamos una invitación! Te uniste a tu equipo existente.')
        
      } else {
        // CASO B: USUARIO NUEVO (Sin invitación)
        // Creamos la empresa nueva como siempre
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([{ name: formData.companyName }])
          .select()
          .single()

        if (orgError) throw orgError

        // Lo hacemos admin de su nueva empresa
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            organization_id: orgData.id,
            role: 'admin' 
          })
          .eq('id', authData.user.id)

        if (profileError) throw profileError

        setMsg('✅ Empresa registrada con éxito.')
      }

      // Redirigir en ambos casos
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (error) {
      console.error(error)
      setMsg('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>🚀 Registro</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <label>Nombre de la Empresa</label>
          <input 
            type="text" name="companyName" required 
            placeholder="Si tienes invitación, este nombre se ignorará"
            value={formData.companyName} onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          <small style={{color: '#666', fontSize: '11px'}}>
            * Si te invitaron a un equipo, te uniremos automáticamente.
          </small>
        </div>

        <div>
          <label>Tu Nombre Completo</label>
          <input 
            type="text" name="fullName" required 
            value={formData.fullName} onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Correo Electrónico</label>
          <input 
            type="email" name="email" required 
            value={formData.email} onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Contraseña</label>
          <input 
            type="password" name="password" required 
            value={formData.password} onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Procesando...' : 'Registrarse'}
        </button>

      </form>

      {msg && <p style={{ marginTop: '15px', textAlign: 'center', fontWeight: 'bold', color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</p>}

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login">¿Ya tienes cuenta? Ingresa aquí</Link>
      </div>
    </div>
  )
}

export default Register