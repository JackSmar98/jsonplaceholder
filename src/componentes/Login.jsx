// src/componentes/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../supabase'; // Asegúrate que la ruta a supabase.js sea correcta
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Intentar iniciar sesión
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        throw loginError;
      }

      // 2. Si el login es exitoso, verificar y crear perfil si es necesario
      if (loginData.user) {
        // Verificar si ya existe un perfil para este usuario
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', loginData.user.id)
          .single(); // Esperamos una sola fila o ninguna

        // Si profileError existe y es del tipo PGRST116, significa que no se encontró el perfil (0 filas)
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Perfil no encontrado para el usuario, creando uno nuevo...');
          // El perfil no existe, vamos a crearlo.
          // Aquí crearemos un perfil básico. El usuario puede completar más detalles
          // en su página de perfil. El campo 'nombre' del formulario de registro
          // no se pasa directamente aquí, pero se podría pedir al usuario que lo complete
          // en la página de perfil.
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert([{ 
                id: loginData.user.id, 
                email: loginData.user.email,
                // nombre: 'Usuario Nuevo' // O dejarlo null y que lo complete en su perfil
            }]);

          if (insertProfileError) {
            console.error("Error creando el perfil en el primer login:", insertProfileError);
            // Notificar al usuario o manejar el error.
            // Por ahora, el login procederá, pero el perfil podría no estar completo.
            setError(`Login exitoso, pero hubo un problema creando tu perfil inicial: ${insertProfileError.message}`);
            // No detenemos la navegación para que el usuario al menos pueda entrar.
          } else {
            console.log("Perfil creado exitosamente en el primer login para:", loginData.user.email);
          }
        } else if (profileError) {
          // Otro tipo de error al buscar el perfil
          console.error("Error verificando el perfil del usuario:", profileError);
          setError(`Hubo un problema al verificar tu perfil: ${profileError.message}`);
        } else {
          console.log("Perfil ya existente encontrado para:", loginData.user.email);
        }
        
        navigate('/'); // Redirige a la página principal después del login y la posible creación de perfil
      } else {
        // Esto no debería suceder si signInWithPassword fue exitoso sin error.
        setError("No se pudo obtener la información del usuario después del login.");
      }

    } catch (error) {
      console.error("Error en el login:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App-container auth-form">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email-login">Correo Electrónico:</label>
          <input
            id="email-login"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password-login">Contraseña:</label>
          <input
            id="password-login"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>
      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>Error: {error}</p>}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>¿No tienes una cuenta?</p>
        <Link to="/registro">Regístrate aquí</Link>
      </div>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/">Volver al inicio</Link>
      </div>
    </div>
  );
}

export default Login;