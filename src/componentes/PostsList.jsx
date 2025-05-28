// src/componentes/PostsList.jsx
import React, { useState, useMemo } from 'react'; // Añade useState y useMemo
import { Link } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext';

const PostsList = () => {
    const { posts: allPosts, loading, error, appInitialized } = usePosts();
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda

    // Filtrar los posts basándose en el searchTerm
    // Usamos useMemo para evitar recalcular en cada render a menos que allPosts o searchTerm cambien.
    const filteredPosts = useMemo(() => {
        if (!searchTerm.trim()) {
            return allPosts; // Si no hay término de búsqueda, muestra todos los posts
        }
        return allPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.body.toLowerCase().includes(searchTerm.toLowerCase()) // Opcional: buscar también en el cuerpo
        );
    }, [allPosts, searchTerm]);

    if (!appInitialized && loading) {
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px'}}>Cargando posts...</div>;
    }

    if (error) {
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>Error al cargar los posts: {error}</div>;
    }
    
    // Este caso es importante si el fetch inicial no devuelve posts por alguna razón (ej. API vacía)
    if (appInitialized && !loading && allPosts.length === 0 && !error) {
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px'}}><p>No se encontraron posts para mostrar.</p></div>;
    }
    
    // Para cargas subsecuentes si se implementara refetch (o si el contexto aún está cargando y appInitialized es true)
    if (loading) { 
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px'}}>Actualizando posts...</div>;
    }

    return (
        <div className="App-container">
            <h1>Lista de Posts (Context API)</h1>
            
            {/* Input para la búsqueda */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <input
                    type="text"
                    placeholder="Buscar posts por título o contenido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                        padding: '10px', 
                        width: '80%', 
                        maxWidth: '500px',
                        fontSize: '16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                />
            </div>

            {filteredPosts.length > 0 ? (
                <ul className="posts-list">
                    {filteredPosts.map(post => (
                        <li key={post.id} className="post-item">
                            <Link to={`/post/${post.id}`}>
                                <h2>{post.title}</h2>
                            </Link>
                            <p>{post.body.substring(0, 100)}...</p>
                        </li>
                    ))}
                </ul>
            ) : (
                 appInitialized && <p style={{ textAlign: 'center' }}>No se encontraron posts que coincidan con tu búsqueda "{searchTerm}".</p>
            )}
        </div>
    );
};

export default PostsList;