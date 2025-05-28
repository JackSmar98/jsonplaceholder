// src/componentes/PerfilUsuario.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate, Link } from 'react-router-dom';
import { getActivitiesFromLocalStorage, clearActivitiesFromLocalStorage } from '../utils/activityLog.js'; // Asegúrate que esta ruta sea correcta

// Estilos (puedes tenerlos en tu App.css o aquí temporalmente)
const avatarPreviewStyle = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid var(--primary-color)',
  margin: '0 auto 25px auto',
  display: 'block',
  boxShadow: 'var(--box-shadow-light)',
};
const noAvatarStyle = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  backgroundColor: 'var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--secondary-color)',
  border: '3px solid var(--border-color)',
  margin: '0 auto 25px auto',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: '500',
};
const activitySectionStyle = {
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid var(--border-color)', // Usa tu variable CSS
};
const activityListStyle = {
  listStyle: 'none',
  padding: 0,
};
const activityItemStyle = {
  backgroundColor: 'var(--bg-color)', // Usa tu variable CSS
  padding: '12px 15px',
  border: '1px solid var(--border-color)', // Usa tu variable CSS
  borderRadius: '4px',
  marginBottom: '8px',
  fontSize: '0.9em',
  color: 'var(--text-color)' // Usa tu variable CSS
};
const activityTimestampStyle = {
  display: 'block',
  fontSize: '0.8em',
  color: '#777', // O una variable CSS
  marginTop: '4px'
};


function PerfilUsuario() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null); // <--- DECLARACIÓN DE currentUser
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const getInitialSessionAndProfile = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError);
        setError("No se pudo verificar tu sesión.");
        setLoading(false);
        navigate('/login');
        return;
      }

      if (!session) {
        navigate('/login');
        setLoading(false);
        return;
      }
      
      setCurrentUser(session.user); // <--- currentUser SE ESTABLECE AQUÍ
      setEmail(session.user.email || '');

      // Fetch profile solo si hay un usuario
      try {
        const { data: profileData, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id) // <--- currentUser (o session.user) SE USA AQUÍ
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            console.warn("Perfil no encontrado para el usuario:", session.user.id);
            setError("No se encontró información de perfil. Puede completarlo editando su perfil.");
            setProfile(null);
            setNombre(''); setFechaNacimiento(''); setTelefono(''); setAvatarUrl('');
          } else {
            throw fetchError;
          }
        } else if (profileData) {
          setProfile(profileData);
          setNombre(profileData.nombre || '');
          setFechaNacimiento(profileData.fecha_nacimiento || '');
          setTelefono(profileData.telefono || '');
          setAvatarUrl(profileData.avatar_url || '');
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

    getInitialSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate('/login');
          setCurrentUser(null);
          setProfile(null);
        } else {
          setCurrentUser(session.user);
          setEmail(session.user.email || '');
          // Podrías considerar volver a cargar el perfil aquí si el usuario cambia,
          // aunque getInitialSessionAndProfile ya lo hace basado en el currentUser del estado.
        }
      }
    );
     return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]); // El array de dependencias estaba [navigate] antes, lo cual es correcto para la lógica de sesión.
                  // El fetch del perfil ahora está dentro de este mismo useEffect.

  // Cargar actividades cuando currentUser cambia (y ya no está cargando la sesión/perfil)
  useEffect(() => {
    if (currentUser && !loading) { // Solo cargar actividades si hay usuario y la carga inicial del perfil terminó
      setActivities(getActivitiesFromLocalStorage());
    } else if (!currentUser) {
      setActivities([]);
    }
  }, [currentUser, loading]);


  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) { setError("No hay usuario para actualizar el perfil."); return; }
    setIsUpdating(true); setError(null);
    const updates = {
      nombre: nombre,
      fecha_nacimiento: fechaNacimiento === '' ? null : fechaNacimiento,
      telefono: telefono === '' ? null : telefono,
      avatar_url: avatarUrl === '' ? null : avatarUrl,
      updated_at: new Date().toISOString(),
    };
    try {
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (updateError) throw updateError;
      alert('¡Perfil actualizado con éxito!'); setIsEditing(false);
      const { data: updatedProfileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      if (updatedProfileData) {
          setProfile(updatedProfileData);
          setNombre(updatedProfileData.nombre || '');
          setFechaNacimiento(updatedProfileData.fecha_nacimiento || '');
          setTelefono(updatedProfileData.telefono || '');
          setAvatarUrl(updatedProfileData.avatar_url || '');
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
    if (profile) {
        setNombre(profile.nombre || '');
        setFechaNacimiento(profile.fecha_nacimiento || '');
        setTelefono(profile.telefono || '');
        setAvatarUrl(profile.avatar_url || '');
    } else if (currentUser) { // Si no hay perfil pero hay usuario (ej. para completar por primera vez)
        setNombre(''); setFechaNacimiento(''); setTelefono(''); setAvatarUrl('');
    }
    // El email se toma del currentUser y ya debería estar seteado
  };

  const handleClearActivity = () => {
    if (window.confirm("¿Estás seguro de que quieres limpiar tu actividad reciente?")) {
      clearActivitiesFromLocalStorage(); setActivities([]); alert("Actividad reciente limpiada.");
    }
  };

  // Componente interno para mostrar el avatar
  const AvatarDisplay = () => {
    const displayUrl = isEditing ? avatarUrl : (profile?.avatar_url || '');
    if (displayUrl) {
      return <img key={displayUrl} src={displayUrl} alt="Avatar" style={avatarPreviewStyle} onError={(e) => { e.target.src = ''; e.target.alt = 'Error al cargar avatar'; /* O un placeholder */ }} />;
    }
    return <div style={noAvatarStyle}><span>Sin Avatar</span></div>;
  };


  if (loading) {
    return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Cargando perfil...</div>;
  }

  if (!currentUser) { // Ya no debería llegar aquí si navigate funciona, pero como salvaguarda
    return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Debes iniciar sesión para ver tu perfil.</div>;
  }
  
  // Mostrar error si ocurrió durante la carga del perfil Y no hay datos de perfil
  if (error && !profile && !isEditing) {
    return (
        <div className="App-container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>
            <p>{error}</p>
            {error.includes("Perfil no encontrado") && currentUser && (
                <button onClick={handleEditClick} style={{marginTop: '10px'}}>Completar Perfil Ahora</button>
            )}
        </div>
    );
  }

  return (
    <div className="App-container profile-form auth-form">
      <h2>Mi Perfil</h2>
      <AvatarDisplay />
      {error && isEditing && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}
      
      {!isEditing ? (
        // Modo Vista del Perfil
        <>
          {profile ? (
              <div>
                <p><strong>Correo:</strong> {email}</p>
                <p><strong>Nombre:</strong> {profile.nombre || 'No especificado'}</p>
                {profile.avatar_url && <p><strong>Avatar:</strong> <a href={profile.avatar_url} target="_blank" rel="noopener noreferrer">Ver imagen</a></p>}
                <p><strong>Fecha de Nacimiento:</strong> {profile.fecha_nacimiento || 'No especificada'}</p>
                <p><strong>Teléfono:</strong> {profile.telefono || 'No especificado'}</p>
                <p><small>Última actualización: {profile.updated_at ? new Date(profile.updated_at).toLocaleString() : 'N/A'}</small></p>
              </div>
          ) : ( 
               <p>No se pudo cargar la información del perfil o aún no existe.</p>
          )}
          <button onClick={handleEditClick} style={{width: 'auto', marginTop: '15px'}}>
            {profile ? 'Editar Perfil' : 'Completar/Crear Perfil'}
          </button>
        </>
      ) : (
        // Modo Edición del Perfil
        <form onSubmit={handleUpdateProfile}>
          <div><label htmlFor="profile-email">Correo Electrónico:</label><input id="profile-email" type="email" value={email} disabled readOnly /></div>
          <div><label htmlFor="profile-nombre">Nombre:</label><input id="profile-nombre" type="text" placeholder="Tu nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></div>
          <div><label htmlFor="profile-avatarUrl">URL de Avatar:</label><input id="profile-avatarUrl" type="url" placeholder="https://ejemplo.com/imagen.png" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} /></div>
          <div><label htmlFor="profile-fechaNacimiento">Fecha de Nacimiento:</label><input id="profile-fechaNacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} /></div>
          <div><label htmlFor="profile-telefono">Teléfono:</label><input id="profile-telefono" type="tel" placeholder="Ej: 3001234567" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
          <button type="submit" disabled={isUpdating}>{isUpdating ? 'Guardando...' : 'Guardar Cambios'}</button>
          <button type="button" onClick={() => { setIsEditing(false); setError(null); }} disabled={isUpdating} style={{ marginLeft: '10px', backgroundColor: 'var(--secondary-color)' }}>Cancelar</button>
        </form>
      )}

      {/* Sección de Actividad Reciente */}
      {currentUser && (
        <section style={activitySectionStyle}>
          <h3>Mi Actividad Reciente</h3>
          {activities.length > 0 ? (
            <>
              <ul style={activityListStyle}>
                {activities.map((activity, index) => (
                  <li key={index} style={activityItemStyle}>
                    {activity.type === 'añadio_favorito' && <span>Marcaste "<Link to={`/post/${activity.postId}`}>{activity.postTitle}</Link>" como favorito.</span>}
                    {activity.type === 'quito_favorito' && <span>Quitaste "<Link to={`/post/${activity.postId}`}>{activity.postTitle}</Link>" de favoritos.</span>}
                    {activity.type === 'comento_post' && <span>Comentaste en "<Link to={`/post/${activity.postId}`}>{activity.postTitle}</Link>": "<i>{activity.commentSnippet}</i>"</span>}
                    {activity.type === 'descubrio_posts_aleatorios' && <span>Descubriste {activity.count} posts aleatorios.</span>}
                    <span style={activityTimestampStyle}>{new Date(activity.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleClearActivity} style={{marginTop: '15px', backgroundColor: 'var(--danger-color)', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                  Limpiar Actividad
              </button>
            </>
          ) : (
            <p>No hay actividad reciente para mostrar.</p>
          )}
        </section>
      )}
    </div>
  );
}

export default PerfilUsuario;