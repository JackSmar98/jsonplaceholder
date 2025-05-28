// src/componentes/Registro.jsx
import React, { useState } from 'react';
import { supabase } from '../supabase'; // Asegúrate que la ruta a supabase.js sea correcta
import { useNavigate, Link } from 'react-router-dom';

function Registro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Mantenemos el campo nombre por si lo usamos al crear el perfil en el login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      // 1. Registrar el usuario en Supabase Auth
      // Pasamos el 'nombre' en options.data para que esté disponible si Supabase lo puede usar
      // o para recuperarlo en el lado del cliente después si es necesario, aunque no es la forma más robusta.
      // Por ahora, el 'nombre' no se usa directamente aquí para crear el perfil.
      const { data: authData, error: errorAuth } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            // Puedes pasar datos adicionales aquí que podrían ser útiles para funciones o triggers de Supabase.
            // Por ejemplo, podrías tener un trigger en auth.users que use este 'nombre_completo'.
            // O, si el usuario confirma y luego inicia sesión, podrías intentar recuperar estos datos
            // (aunque la recuperación de options.data post-registro no es directa sin hooks o funciones de Supabase).
            // Para la Opción 2 (crear perfil en login), el 'nombre' del estado de este componente no se pasará directamente
            // al Login.jsx. Se deberá pedir al usuario que complete su perfil después del primer login
            // o crear un perfil básico y permitirle editarlo.
            // Por ahora, lo dejamos en el formulario, pero la creación del perfil con este 'nombre'
            // se hará en el flujo de login o en la edición del perfil.
            nombre_completo: nombre // Ejemplo de cómo pasar datos adicionales
          }
        }
      });

      if (errorAuth) {
        throw errorAuth;
      }

      // Ya no intentamos insertar en 'profiles' aquí.
      // Eso se hará en el componente Login después de la confirmación e inicio de sesión.

      setSuccessMessage(
        '¡Registro exitoso! Revisa tu correo para confirmar tu cuenta. ' +
        '(Si no ves el correo, revisa tu carpeta de spam).'
      );
      // Podrías redirigir a una página informativa o al login.
      // navigate('/login');

    } catch (error) {
      console.error("Error en el registro:", error.message);
      setError(`Error en el registro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App-container auth-form">
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleRegistro}>
        <div>
          <label htmlFor="nombre-registro">Nombre:</label>
          <input
            id="nombre-registro"
            type="text"
            placeholder="Tu nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email-registro">Correo Electrónico:</label>
          <input
            id="email-registro"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password-registro">Contraseña:</label>
          <input
            id="password-registro"
            type="password"
            placeholder="Tu contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green', textAlign: 'center', marginTop: '10px' }}>{successMessage}</p>}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>¿Ya tienes una cuenta?</p>
        <Link to="/login">Iniciar Sesión</Link>
      </div>
       <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/">Volver al inicio</Link>
      </div>
    </div>
  );
}

export default Registro;