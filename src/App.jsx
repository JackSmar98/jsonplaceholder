// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css'; // Puedes crear este archivo para estilos básicos

function App() {
  const [posts, setPosts] = useState([]); // Estado para almacenar los posts
  const [loading, setLoading] = useState(true); // Estado para manejar la carga
  const [error, setError] = useState(null); // Estado para manejar errores

  useEffect(() => {
    // Función para obtener los datos de la API
    const fetchPosts = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data.slice(0, 10)); // Guardamos solo los primeros 10 posts para el ejemplo
        setError(null);
      } catch (err) {
        setError(err.message);
        setPosts([]); // Limpiamos los posts en caso de error
      } finally {
        setLoading(false); // Finaliza la carga, ya sea con éxito o error
      }
    };

    fetchPosts(); // Llamamos a la función al montar el componente
  }, []); // El array vacío como segundo argumento asegura que useEffect se ejecute solo una vez (al montar)

  // Renderizar estado de carga
  if (loading) {
    return <div className="App-container">Cargando posts...</div>;
  }

  // Renderizar estado de error
  if (error) {
    return <div className="App-container">Error al cargar los posts: {error}</div>;
  }

  // Renderizar los posts
  return (
    <div className="App-container">
      <h1>Lista de Posts</h1>
      {posts.length > 0 ? (
        <ul className="posts-list">
          {posts.map(post => (
            <li key={post.id} className="post-item">
              <h2>{post.title}</h2>
              <p>{post.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No se encontraron posts.</p> // Mensaje si no hay posts y no está cargando
      )}
    </div>
  );
}

export default App;