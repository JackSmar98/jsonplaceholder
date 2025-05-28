// src/componentes/Aleatorios.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext';

// (Los estilos pueden permanecer igual o los puedes mover a un .css)
const aleatoriosContainerStyle = { /* ... */ };
const postsGridStyle = { /* ... */ };
const postCardStyle = { /* ... */ };
const buttonStyle = { /* ... */ };

const LOCAL_STORAGE_KEY_VISTOS = 'postsVistosAleatoriamente';

function Aleatorios() {
  const { posts: allPosts, loading: postsLoading, appInitialized: postsAppInitialized } = usePosts();
  const [randomPosts, setRandomPosts] = useState([]);
  const [loadingAleatorios, setLoadingAleatorios] = useState(false);

  const NUM_RANDOM_POSTS = 3;

  const getRandomPosts = useCallback(() => {
    if (!allPosts || allPosts.length === 0) {
      setRandomPosts([]);
      return;
    }
    setLoadingAleatorios(true);

    const shuffled = [...allPosts].sort(() => 0.5 - Math.random());
    const selectedPosts = shuffled.slice(0, NUM_RANDOM_POSTS);
    setRandomPosts(selectedPosts);

    // Guardar los IDs de estos posts en localStorage
    try {
      const currentVistosIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_VISTOS)) || [];
      const newVistosIds = selectedPosts.map(p => p.id);
      
      // Añadir nuevos IDs sin duplicados, manteniendo los más recientes al final (o como prefieras)
      // Aquí, simplemente añadimos los nuevos si no están, y mantenemos un historial.
      // Podrías querer una lógica más compleja, como limitar el tamaño del historial.
      let updatedVistosIds = [...currentVistosIds];
      newVistosIds.forEach(id => {
        if (!updatedVistosIds.includes(id)) {
          updatedVistosIds.push(id); // Podrías usar unshift si quieres los más nuevos primero
        }
      });
      // Opcional: Limitar el tamaño del historial
      // const MAX_HISTORIAL = 20;
      // if (updatedVistosIds.length > MAX_HISTORIAL) {
      //   updatedVistosIds = updatedVistosIds.slice(updatedVistosIds.length - MAX_HISTORIAL);
      // }

      localStorage.setItem(LOCAL_STORAGE_KEY_VISTOS, JSON.stringify(updatedVistosIds));
      console.log("Posts vistos aleatoriamente actualizados en localStorage:", updatedVistosIds);

    } catch (error) {
      console.error("Error al guardar posts vistos en localStorage:", error);
    }
    
    setTimeout(() => {
      setLoadingAleatorios(false);
    }, 300);

  }, [allPosts, NUM_RANDOM_POSTS]);

  useEffect(() => {
    if (postsAppInitialized && !postsLoading && allPosts.length > 0) {
      if (randomPosts.length === 0) { // Generar solo si no hay posts aleatorios ya mostrados
          getRandomPosts();
      }
    }
  }, [postsAppInitialized, postsLoading, allPosts, getRandomPosts, randomPosts.length]);

  if (postsLoading && !postsAppInitialized) {
    return <div style={aleatoriosContainerStyle}>Cargando lista base de posts...</div>;
  }

  if (loadingAleatorios && randomPosts.length === 0) { // Muestra solo si está cargando la primera vez
    return <div style={aleatoriosContainerStyle}>Generando posts aleatorios...</div>;
  }

  return (
    <div style={aleatoriosContainerStyle} className="App-container">
      <h2>Descubre Posts Aleatorios</h2>
      <button onClick={getRandomPosts} style={buttonStyle} disabled={loadingAleatorios || postsLoading}>
        {loadingAleatorios ? 'Generando...' : 'Mostrar Nuevos Posts Aleatorios'}
      </button>

      {randomPosts.length > 0 ? (
        <div style={postsGridStyle}>
          {randomPosts.map(post => (
            <div key={post.id} style={postCardStyle} className="post-item">
              <Link to={`/post/${post.id}`}>
                <h3>{post.title}</h3>
              </Link>
              <p>{post.body.substring(0, 120)}...</p>
            </div>
          ))}
        </div>
      ) : (
        !postsLoading && <p>No hay posts aleatorios para mostrar. Intenta generar de nuevo.</p>
      )}
    </div>
  );
}

export default Aleatorios;