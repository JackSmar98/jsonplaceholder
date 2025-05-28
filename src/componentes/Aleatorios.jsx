// src/componentes/Aleatorios.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext';
import { addActivityToLocalStorage } from '../utils/activityLog.js'; // <--- IMPORTADO

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

    try {
      const currentVistosIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_VISTOS)) || [];
      const newVistosIds = selectedPosts.map(p => p.id);
      let updatedVistosIds = [...currentVistosIds];
      newVistosIds.forEach(id => {
        if (!updatedVistosIds.includes(id)) {
          updatedVistosIds.push(id);
        }
      });
      localStorage.setItem(LOCAL_STORAGE_KEY_VISTOS, JSON.stringify(updatedVistosIds));
      
      // Registrar actividad de descubrimiento
      addActivityToLocalStorage({ // <--- AÑADIDO
        type: 'descubrio_posts_aleatorios',
        count: selectedPosts.length 
      });
      console.log("Posts vistos aleatoriamente actualizados y actividad registrada.");

    } catch (error) {
      console.error("Error al guardar posts vistos o registrar actividad:", error);
    }
    
    setTimeout(() => { // Simular un pequeño delay para la UI si es necesario
      setLoadingAleatorios(false);
    }, 300);

  }, [allPosts, NUM_RANDOM_POSTS]);

  useEffect(() => {
    if (postsAppInitialized && !postsLoading && allPosts.length > 0) {
      if (randomPosts.length === 0) {
          getRandomPosts();
      }
    }
  }, [postsAppInitialized, postsLoading, allPosts, getRandomPosts, randomPosts.length]);

  if (postsLoading && !postsAppInitialized) {
    return <div className="App-container aleatorios-container">Cargando lista base de posts...</div>;
  }

  if (loadingAleatorios && randomPosts.length === 0) {
    return <div className="App-container aleatorios-container">Generando posts aleatorios...</div>;
  }

  return (
    <div className="App-container aleatorios-container">
      <h2>Descubre Posts Aleatorios</h2>
      <button onClick={getRandomPosts} className="button-style primary" disabled={loadingAleatorios || postsLoading}>
        {loadingAleatorios ? 'Generando...' : 'Mostrar Nuevos Posts Aleatorios'}
      </button>

      {randomPosts.length > 0 ? (
        <div className="posts-list"> {/* Usar clase de lista general */}
          {randomPosts.map(post => (
            <div key={post.id} className="post-item">
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