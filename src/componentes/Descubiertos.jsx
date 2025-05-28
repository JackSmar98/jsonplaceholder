// src/componentes/Descubiertos.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext'; // Para obtener los detalles de los posts

const descubiertosContainerStyle = {
  padding: '20px',
  textAlign: 'center',
};

const postsGridStyle = { // Puedes reutilizar los estilos de Aleatorios.jsx
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginTop: '20px',
  marginBottom: '20px',
};

const postCardStyle = { // Puedes reutilizar los estilos de Aleatorios.jsx
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '15px',
  textAlign: 'left',
  backgroundColor: '#f9f9f9',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const buttonStyle = {
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
  backgroundColor: '#dc3545', // Un color diferente para "Limpiar"
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  marginTop: '20px'
};

const LOCAL_STORAGE_KEY_VISTOS = 'postsVistosAleatoriamente';

function Descubiertos() {
  const [discoveredPostsDetails, setDiscoveredPostsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Obtenemos los posts y su estado de carga del contexto
  const { posts: allPosts, appInitialized: postsAppInitialized, loading: postsContextLoading } = usePosts();

  // Cargar y mostrar los posts descubiertos
  const loadDiscoveredPosts = () => {
    setLoading(true);
    try {
      const vistosIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_VISTOS)) || [];
      if (vistosIds.length > 0 && allPosts.length > 0) {
        // Filtrar allPosts para obtener los detalles de los posts vistos
        // Es importante que allPosts ya esté cargado del contexto.
        const details = allPosts.filter(post => vistosIds.includes(post.id));
        // Opcional: mantener el orden en que fueron descubiertos si 'vistosIds' lo refleja.
        // Si no, mapear sobre vistosIds para preservar el orden y encontrar el post.
        const orderedDetails = vistosIds.map(id => allPosts.find(post => post.id === id)).filter(Boolean);
        setDiscoveredPostsDetails(orderedDetails.reverse()); // Mostrar los más recientes primero
      } else {
        setDiscoveredPostsDetails([]);
      }
    } catch (error) {
      console.error("Error al cargar posts descubiertos de localStorage:", error);
      setDiscoveredPostsDetails([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Cargar los posts descubiertos solo cuando los posts del contexto estén listos
    if (postsAppInitialized && !postsContextLoading) {
      loadDiscoveredPosts();
    } else if (!postsAppInitialized && postsContextLoading) {
      setLoading(true); // Asegurar que esté cargando si el contexto aún no está listo
    }
  }, [postsAppInitialized, postsContextLoading, allPosts]); // Depender de allPosts para re-filtrar si cambia

  const handleClearHistory = () => {
    if (window.confirm("¿Estás seguro de que quieres limpiar tu historial de posts descubiertos?")) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY_VISTOS);
        setDiscoveredPostsDetails([]); // Actualizar la UI inmediatamente
        alert("Historial de descubrimientos limpiado.");
      } catch (error) {
        console.error("Error al limpiar el historial de localStorage:", error);
        alert("Error al limpiar el historial.");
      }
    }
  };

  if (loading || (postsContextLoading && !postsAppInitialized)) {
    return <div style={descubiertosContainerStyle}>Cargando historial de posts descubiertos...</div>;
  }

  return (
    <div style={descubiertosContainerStyle} className="App-container">
      <h2>Posts Descubiertos Aleatoriamente</h2>
      {discoveredPostsDetails.length > 0 ? (
        <>
          <div style={postsGridStyle}>
            {discoveredPostsDetails.map(post => (
              <div key={post.id} style={postCardStyle} className="post-item">
                <Link to={`/post/${post.id}`}>
                  <h3>{post.title}</h3>
                </Link>
                <p>{post.body.substring(0, 120)}...</p>
              </div>
            ))}
          </div>
          <button onClick={handleClearHistory} style={buttonStyle}>
            Limpiar Historial de Descubrimientos
          </button>
        </>
      ) : (
        <p>Aún no has descubierto ningún post aleatoriamente. ¡Ve a la sección de "Posts Aleatorios"!</p>
      )}
    </div>
  );
}

export default Descubiertos;