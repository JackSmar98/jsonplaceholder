// src/componentes/PostDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext';
import { supabase } from '../supabase'; // Asegúrate que la ruta sea correcta

function PostDetail() {
    const { id: postIdFromUrl } = useParams();
    const { posts, appInitialized, loading: contextLoading, error: contextError } = usePosts();

    const [post, setPost] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [errorDetail, setErrorDetail] = useState(null);

    const [currentUser, setCurrentUser] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [processingFavorite, setProcessingFavorite] = useState(false);

    // Obtener la sesión del usuario actual
    useEffect(() => {
        const getSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          setCurrentUser(session?.user ?? null);
        };
        getSession();
        
        // Escuchar cambios de autenticación por si el usuario inicia/cierra sesión mientras ve el detalle
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
        });

        return () => {
            if (authListener && authListener.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

    // Obtener el post específico del contexto
    useEffect(() => {
        if (contextLoading && !appInitialized) {
            setLoadingDetail(true);
            return;
        }
        if (contextError) {
            setErrorDetail(`Error obteniendo la lista de posts del contexto: ${contextError}`);
            setLoadingDetail(false); setPost(null); return;
        }
        if (appInitialized) {
            const numericId = parseInt(postIdFromUrl, 10);
            const foundPost = posts.find(p => p.id === numericId);
            if (foundPost) {
                setPost(foundPost); setErrorDetail(null);
            } else {
                setErrorDetail('Post no encontrado.');
            }
        }
        setLoadingDetail(false);
    }, [postIdFromUrl, posts, appInitialized, contextLoading, contextError]);

    // Verificar si el post actual es favorito
    useEffect(() => {
        // Solo verificar si tenemos un post y un usuario logueado
        if (post && currentUser) {
            const checkIfFavorite = async () => {
                setProcessingFavorite(true); // Indica que estamos verificando
                const { data, error } = await supabase
                    .from('user_favorite_posts')
                    .select('id', { count: 'exact' }) // Solo necesitamos saber si existe
                    .eq('user_id', currentUser.id)
                    .eq('post_id', post.id)
                    .maybeSingle(); // Devuelve null si no hay fila, o el objeto si existe

                if (error) {
                    console.error("Error verificando favorito:", error.message);
                    // Podrías querer mostrar un error al usuario aquí
                } else {
                    setIsFavorite(!!data); // Si data existe (no es null), es favorito
                }
                setProcessingFavorite(false);
            };
            checkIfFavorite();
        } else {
            setIsFavorite(false); // Si no hay post o usuario, no es favorito
        }
    }, [post, currentUser]); // Se ejecuta cuando 'post' o 'currentUser' cambian

    const toggleFavorite = async () => {
        if (!currentUser) {
            alert("Debes iniciar sesión para marcar posts como favoritos.");
            // Podrías redirigir al login: navigate('/login');
            return;
        }
        if (!post || processingFavorite) return; // No hacer nada si no hay post o ya se está procesando

        setProcessingFavorite(true);
        if (isFavorite) {
            // Quitar de favoritos
            const { error } = await supabase
                .from('user_favorite_posts')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('post_id', post.id);
            if (error) {
                console.error("Error al quitar de favoritos:", error.message)
                alert(`Error al quitar de favoritos: ${error.message}`);
            } else {
                setIsFavorite(false);
            }
        } else {
            // Añadir a favoritos
            const { error } = await supabase
                .from('user_favorite_posts')
                .insert({ user_id: currentUser.id, post_id: post.id });
            if (error) {
                console.error("Error al añadir a favoritos:", error.message)
                alert(`Error al añadir a favoritos: ${error.message}`);
            } else {
                setIsFavorite(true);
            }
        }
        setProcessingFavorite(false);
    };

    if (loadingDetail) {
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Cargando detalle del post...</div>;
    }

    if (errorDetail) {
        return (
            <div className="App-container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>
                Error: {errorDetail} <br />
                <Link to="/">Volver a la lista</Link>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>
                Post no disponible. <br />
                <Link to="/">Volver a la lista</Link>
            </div>
        );
    }

    return (
        <div className="App-container post-item">
            <h1>{post.title}</h1>
            {currentUser && ( // Solo muestra el botón si hay un usuario logueado
                <button 
                    onClick={toggleFavorite} 
                    disabled={processingFavorite} 
                    style={{ 
                        marginBottom: '15px', 
                        padding: '10px 15px',
                        cursor: processingFavorite ? 'wait' : 'pointer',
                        backgroundColor: isFavorite ? '#ffdddd' : '#ddffdd',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                >
                    {processingFavorite ? 'Procesando...' : (isFavorite ? '❤️ Quitar de Favoritos' : '🤍 Añadir a Favoritos')}
                </button>
            )}
            <p>{post.body}</p>
            <Link to="/">Volver a la lista</Link>
        </div>
    );
}

export default PostDetail;