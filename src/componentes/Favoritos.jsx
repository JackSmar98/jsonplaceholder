// src/componentes/Favoritos.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext';

function Favoritos() {
    const [favoritePostDetails, setFavoritePostDetails] = useState([]);
    const [loadingFavorites, setLoadingFavorites] = useState(true); // Estado de carga específico para favoritos
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    // Obtenemos los posts y su estado de carga del contexto
    const { posts: allPosts, appInitialized: postsAppInitialized, loading: postsContextLoading } = usePosts();

    // Efecto para obtener la sesión del usuario
    useEffect(() => {
        setLoadingFavorites(true); // Inicia la carga general de la página de favoritos
        const getSession = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error("Error obteniendo sesión:", sessionError);
                setError("No se pudo verificar tu sesión.");
                setLoadingFavorites(false);
                return;
            }
            if (!session?.user) {
                // App.jsx debería redirigir, pero por si acaso.
                // O simplemente mostrar un mensaje y no cargar nada más.
                setCurrentUser(null);
                setFavoritePostDetails([]);
                setLoadingFavorites(false); 
                // navigate('/login'); // Considera si es necesario
            } else {
                setCurrentUser(session.user);
                // No llamamos a setLoadingFavorites(false) aquí todavía,
                // porque aún necesitamos cargar los favoritos.
            }
        };
        getSession();

        // Escuchar cambios de autenticación (opcional, pero bueno para robustez si el usuario cierra sesión desde otra pestaña)
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
                setCurrentUser(null);
                setFavoritePostDetails([]); // Limpiar si el usuario cierra sesión
                if (window.location.pathname === '/favoritos') navigate('/login'); // Redirigir si está en la página de favoritos
            } else {
                setCurrentUser(session.user); // Actualizar usuario si cambia la sesión
            }
        });
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    // Efecto para obtener los IDs de los posts favoritos y luego sus detalles
    useEffect(() => {
        // Solo proceder si tenemos un usuario y los posts del contexto han terminado de cargar (y están inicializados)
        if (currentUser && postsAppInitialized && !postsContextLoading) {
            setLoadingFavorites(true); // Indicar que estamos cargando los detalles de los favoritos
            setError(null);

            const fetchFavoritePostDetails = async () => {
                try {
                    // 1. Obtener los IDs de los posts favoritos del usuario actual
                    const { data: favoriteRelations, error: favError } = await supabase
                        .from('user_favorite_posts')
                        .select('post_id')
                        .eq('user_id', currentUser.id);

                    if (favError) {
                        throw favError;
                    }

                    // 2. Si tenemos los IDs y tenemos la lista de todos los posts del contexto
                    if (favoriteRelations && allPosts.length > 0) {
                        const favoriteIds = favoriteRelations.map(fav => fav.post_id);
                        // Filtrar la lista completa de posts para obtener los detalles de los favoritos
                        const details = allPosts.filter(post => favoriteIds.includes(post.id));
                        setFavoritePostDetails(details);
                    } else {
                        setFavoritePostDetails([]); // No hay favoritos o no hay posts en el contexto
                    }
                } catch (err) {
                    console.error("Error obteniendo posts favoritos:", err);
                    setError(err.message);
                    setFavoritePostDetails([]);
                } finally {
                    setLoadingFavorites(false); // Termina la carga de favoritos
                }
            };

            fetchFavoritePostDetails();
        } else if (currentUser && postsContextLoading) {
            // Si hay usuario pero el contexto de posts aún está cargando, mantenemos loadingFavorites true
            setLoadingFavorites(true);
        } else if (!currentUser) {
            // Si no hay usuario, no hay favoritos que cargar
            setFavoritePostDetails([]);
            setLoadingFavorites(false);
        }
    }, [currentUser, allPosts, postsAppInitialized, postsContextLoading]);


    // Estado de carga combinado
    if (loadingFavorites || (postsContextLoading && !postsAppInitialized) ) {
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Cargando favoritos...</div>;
    }

    if (error) {
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>Error al cargar favoritos: {error}</div>;
    }
    
    if (!currentUser) { // Doble verificación, aunque App.jsx ya debería redirigir
        return (
            <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>Debes iniciar sesión para ver tus posts favoritos.</p>
                <Link to="/login">Iniciar Sesión</Link>
            </div>
        );
    }

    return (
        <div className="App-container">
            <h2>Mis Posts Favoritos</h2>
            {favoritePostDetails.length > 0 ? (
                <ul className="posts-list">
                    {favoritePostDetails.map(post => (
                        <li key={post.id} className="post-item">
                            <Link to={`/post/${post.id}`}>
                                <h3>{post.title}</h3>
                            </Link>
                            <p>{post.body.substring(0, 100)}...</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ textAlign: 'center' }}>Aún no has añadido ningún post a tus favoritos.</p>
            )}
        </div>
    );
}

export default Favoritos;