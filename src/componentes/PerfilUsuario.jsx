// src/componentes/PerfilUsuario.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Asegúrate que la ruta a supabase.js sea correcta
import { useNavigate } from 'react-router-dom';

function PerfilUsuario() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los campos del formulario de edición
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(''); // El email usualmente es solo de lectura del auth
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  // const [avatarUrl, setAvatarUrl] = useState(''); // Para futura subida de avatar

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login'); // Si no hay sesión, redirigir al login
      } else {
        setCurrentUser(session.user);
        setEmail(session.user.email || ''); // Establecer el email aquí
      }
    };
    getInitialSession();
    // Escuchar cambios de autenticación por si la sesión cambia mientras el componente está montado
     const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate('/login');
        } else {
          setCurrentUser(session.user);
          setEmail(session.user.email || '');
        }
      }
    );
     return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              console.warn("Perfil no encontrado para el usuario:", currentUser.id);
              setError("No se encontró información de perfil. Puede completarlo editando su perfil.");
              setProfile(null); // Indica que no hay perfil, pero no es un error de carga fatal
              // Poblar campos de edición con valores por defecto o vacíos si no hay perfil
              setNombre('');
              setFechaNacimiento('');
              setTelefono('');
            } else {
              throw fetchError;
            }
          } else if (data) {
            setProfile(data);
            setNombre(data.nombre || '');
            setFechaNacimiento(data.fecha_nacimiento || '');
            setTelefono(data.telefono || '');
            // setAvatarUrl(data.avatar_url || '');
          } else {
             setError("No se encontró información de perfil, pero no hubo error de Supabase.");
             setProfile(null);
          }
        } catch (err) {
          console.error("Error obteniendo el perfil:", err.message);
          setError(`Error al cargar el perfil: ${err.message}`);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError("No hay usuario para actualizar el perfil.");
      return;
    }
    setIsUpdating(true);
    setError(null);

    const updates = {
      // id: currentUser.id, // El ID no se actualiza, se usa en .eq()
      nombre: nombre,
      fecha_nacimiento: fechaNacimiento === '' ? null : fechaNacimiento,
      telefono: telefono === '' ? null : telefono,
      updated_at: new Date().toISOString(),
      // email: email, // El email no se actualiza desde aquí, es parte de auth.users
    };

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }
      alert('¡Perfil actualizado con éxito!');
      setIsEditing(false);
      // Vuelve a cargar el perfil para reflejar los cambios
      const { data: updatedProfileData, error: fetchAgainError } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      if (fetchAgainError) {
          console.error("Error recargando perfil después de actualizar:", fetchAgainError);
          // Aún si falla la recarga, actualiza el estado local con lo que se intentó guardar
          setProfile(prevProfile => ({...prevProfile, ...updates}));
      } else if (updatedProfileData) {
          setProfile(updatedProfileData);
          // Repoblar campos del formulario con los datos recién guardados
          setNombre(updatedProfileData.nombre || '');
          setFechaNacimiento(updatedProfileData.fecha_nacimiento || '');
          setTelefono(updatedProfileData.telefono || '');
      }

    } catch (err) {
      console.error("Error actualizando el perfil:", err.message);
      setError(`Error al actualizar: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Asegurarse de que el formulario de edición se pueble con los datos actuales del perfil
    // o con el email del usuario si no hay perfil aún.
    if (profile) {
        setNombre(profile.nombre || '');
        setFechaNacimiento(profile.fecha_nacimiento || '');
        setTelefono(profile.telefono || '');
    } else if (currentUser) {
        setNombre(''); // Puede que el usuario quiera añadir su nombre por primera vez
        setFechaNacimiento('');
        setTelefono('');
    }
    setEmail(currentUser?.email || ''); // El email siempre del usuario actual
  };


  if (loading) {
    return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Cargando perfil...</div>;
  }

  if (!currentUser) {
    return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Redirigiendo a login...</div>;
  }
  
  // Mensaje de error general si falló la carga y no hay perfil
  if (error && !isEditing && !profile) {
    return (
        <div className="App-container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>
            <p>{error}</p>
            <p>Intenta recargar la página. Si el problema persiste y acabas de registrarte, la creación inicial del perfil pudo haber fallado.</p>
        </div>
    );
  }

  return (
    <div className="App-container profile-form auth-form">
      <h2>Mi Perfil</h2>
      {error && !isUpdating && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      
      {!isEditing ? (
        // Modo Vista
        profile ? (
            <div>
            <p><strong>Correo:</strong> {email}</p>
            <p><strong>Nombre:</strong> {profile.nombre || 'No especificado'}</p>
            <p><strong>Fecha de Nacimiento:</strong> {profile.fecha_nacimiento || 'No especificada'}</p>
            <p><strong>Teléfono:</strong> {profile.telefono || 'No especificado'}</p>
            <p><small>Última actualización: {profile.updated_at ? new Date(profile.updated_at).toLocaleString() : 'N/A'}</small></p>
            <button onClick={handleEditClick}>Editar Perfil</button>
            </div>
        ) : (
            // No hay perfil pero el usuario está logueado y no está cargando
            <div>
                <p><strong>Correo:</strong> {email}</p>
                <p>Aún no has completado tu perfil.</p>
                <button onClick={handleEditClick}>Completar Perfil</button>
            </div>
        )
      ) : (
        // Modo Edición
        <form onSubmit={handleUpdateProfile}>
          <div>
            <label htmlFor="profile-email">Correo Electrónico:</label>
            <input id="profile-email" type="email" value={email} disabled readOnly />
          </div>
          <div>
            <label htmlFor="profile-nombre">Nombre:</label>
            <input
              id="profile-nombre"
              type="text"
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="profile-fechaNacimiento">Fecha de Nacimiento:</label>
            <input
              id="profile-fechaNacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="profile-telefono">Teléfono:</label>
            <input
              id="profile-telefono"
              type="tel"
              placeholder="Ej: 3001234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button type="button" onClick={() => { setIsEditing(false); setError(null); /* Resetea campos si es necesario */ }} disabled={isUpdating} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}

export default PerfilUsuario;