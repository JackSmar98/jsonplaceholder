// src/componentes/PostDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext';
import { supabase } from '../supabase';
import { addActivityToLocalStorage } from '../utils/activityLog.js';

function PostDetail() {
    const { id: postIdFromUrl } = useParams();
    const { posts, appInitialized, loading: contextLoading, error: contextError } = usePosts();
    const location = useLocation();

    const [post, setPost] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [errorDetail, setErrorDetail] = useState(null);

    const [currentUser, setCurrentUser] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [processingFavorite, setProcessingFavorite] = useState(false);

    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const numericPostId = parseInt(postIdFromUrl, 10);

    useEffect(() => {
        console.log("PostDetail: Montado o currentUser/numericPostId cambiado.");
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            console.log("PostDetail - getSession:", session);
            setCurrentUser(session?.user ?? null);
        };
        getSession();
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("PostDetail - onAuthStateChange:", session);
            setCurrentUser(session?.user ?? null);
        });
        return () => {
          if (authListener && authListener.subscription) {
            authListener.subscription.unsubscribe();
            console.log("PostDetail: Suscripción a authListener cancelada.");
          }
        };
    }, []);

    useEffect(() => {
        console.log("PostDetail - Efecto carga post: contextLoading:", contextLoading, "appInitialized:", appInitialized, "numericPostId:", numericPostId);
        if (contextLoading && !appInitialized) {
            setLoadingDetail(true);
            return;
        }
        if (contextError) {
            setErrorDetail(`Error obteniendo posts: ${contextError}`);
            setLoadingDetail(false);
            setPost(null);
            return;
        }
        if (appInitialized) {
            const foundPost = posts.find(p => p.id === numericPostId);
            console.log("PostDetail - Post encontrado:", foundPost);
            if (foundPost) {
                setPost(foundPost);
                setErrorDetail(null);
            } else {
                setErrorDetail('Post no encontrado.');
                setPost(null);
            }
        }
        setLoadingDetail(false);
    }, [numericPostId, posts, appInitialized, contextLoading, contextError]);

    const fetchComments = useCallback(async () => {
        if (!numericPostId) {
            console.log("fetchComments: numericPostId es nulo, no se hace fetch.");
            setComments([]); // Asegurar que comments sea un array vacío si no hay ID
            return;
        }
        console.log("fetchComments: Iniciando para postId:", numericPostId);
        setLoadingComments(true);
        try {
            const { data, error, status } = await supabase
                .from('post_comments')
                .select(`
                    id,
                    content,
                    created_at,
                    user_id,
                    profiles (
                        nombre,
                        avatar_url
                    )
                `)
                .eq('post_id', numericPostId)
                .order('created_at', { ascending: false });

            console.log("fetchComments - Respuesta de Supabase:", { data, error, status });

            if (error) {
                console.error("fetchComments - Error de Supabase:", error);
                // No cambiar comments aquí para no perder los previos si el fetch falla.
                // El error se debería manejar o mostrar al usuario si es crítico.
                // throw error; // Opcional: si quieres que el error se propague y se capture más arriba o afecte otros estados
            } else {
                console.log("fetchComments: Datos recibidos:", data);
                setComments(data || []);
                console.log("fetchComments: Estado 'comments' actualizado con:", data || []);
            }

        } catch (err) {
            console.error("fetchComments - Error en el bloque catch:", err.message);
            // Aquí podrías querer setear un estado de error para los comentarios
            // setComments([]); // Considera si es mejor mantener los comentarios viejos o limpiar
        } finally {
            setLoadingComments(false);
            console.log("fetchComments: Finalizado.");
        }
    }, [numericPostId]);

    useEffect(() => {
        if (post) {
            console.log("PostDetail - Efecto fetchComments: post existe, llamando a fetchComments.");
            fetchComments();
        } else {
            console.log("PostDetail - Efecto fetchComments: post es null, no se llama a fetchComments.");
            setComments([]); // Limpiar comentarios si no hay post
        }
    }, [post, fetchComments]);


    useEffect(() => {
        console.log("PostDetail - Efecto checkFavorite: post:", !!post, "currentUser:", !!currentUser);
        if (!post || !currentUser) {
            setIsFavorite(false);
            setProcessingFavorite(false);
            return;
        }
        setProcessingFavorite(true);
        const checkFavorite = async () => {
            console.log("checkFavorite: Iniciando para postId:", post.id, "userId:", currentUser.id);
            try {
                const { data, error, status } = await supabase
                    .from('user_favorite_posts')
                    .select('post_id')
                    .eq('user_id', currentUser.id)
                    .eq('post_id', post.id)
                    .maybeSingle();

                console.log("checkFavorite - Respuesta de Supabase:", { data, error, status });
                if (error) {
                    console.error("Error verificando favorito:", error);
                    setIsFavorite(false);
                } else {
                    setIsFavorite(!!data);
                }
            } catch (errCatch) {
                console.error("Excepción al verificar favorito:", errCatch);
                setIsFavorite(false);
            } finally {
                setProcessingFavorite(false);
                console.log("checkFavorite: Finalizado.");
            }
        };
        checkFavorite();
    }, [post, currentUser]);


    const toggleFavorite = async () => {
        if (!post || !currentUser || processingFavorite) return;
        console.log("toggleFavorite: Iniciando. Estado actual isFavorite:", isFavorite);
        setProcessingFavorite(true);
        setErrorDetail(null);
        try {
            if (isFavorite) {
                const { error } = await supabase.from('user_favorite_posts').delete().eq('user_id', currentUser.id).eq('post_id', post.id);
                if (error) throw error;
                setIsFavorite(false);
                addActivityToLocalStorage({ type: 'quito_favorito', postId: post.id, postTitle: post.title });
                console.log("toggleFavorite: Post quitado de favoritos.");
            } else {
                const { error } = await supabase.from('user_favorite_posts').insert([{ user_id: currentUser.id, post_id: post.id }]);
                if (error) throw error;
                setIsFavorite(true);
                addActivityToLocalStorage({ type: 'añadio_favorito', postId: post.id, postTitle: post.title });
                console.log("toggleFavorite: Post añadido a favoritos.");
            }
        } catch (err) {
            console.error("Error al actualizar favorito:", err);
            setErrorDetail(`Error al actualizar favorito: ${err.message}`);
        } finally {
            setProcessingFavorite(false);
            console.log("toggleFavorite: Finalizado.");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser || !post) {
            console.log("handleCommentSubmit: No se cumple condición para enviar. newComment:", newComment, "currentUser:", !!currentUser, "post:", !!post);
            return;
        }
        console.log("handleCommentSubmit: Iniciando envío de comentario:", newComment);
        setSubmittingComment(true);
        try {
            const commentToInsert = {
                post_id: post.id,
                user_id: currentUser.id,
                content: newComment.trim(),
            };
            console.log("handleCommentSubmit: Comentario a insertar:", commentToInsert);
            const { data: insertedComment, error, status } = await supabase.from('post_comments').insert(commentToInsert).select().single();
            
            console.log("handleCommentSubmit - Respuesta de Supabase (insert):", { insertedComment, error, status });
            if (error) throw error;

            addActivityToLocalStorage({
              type: 'comento_post',
              postId: post.id,
              postTitle: post.title,
              commentSnippet: newComment.trim().substring(0, 30) + (newComment.trim().length > 30 ? "..." : "")
            });
            console.log("handleCommentSubmit: Actividad registrada.");

            setNewComment(''); // Limpiar textarea primero
            console.log("handleCommentSubmit: Textarea limpiado. Llamando a fetchComments...");
            await fetchComments(); // Asegurarse que fetchComments termine antes de seguir (aunque no es estrictamente necesario aquí)
            console.log("handleCommentSubmit: fetchComments completado.");

        } catch (err) {
            console.error("Error al enviar comentario:", err);
            alert(`Error al enviar comentario: ${err.message || 'Ocurrió un error desconocido.'}`);
        } finally {
            setSubmittingComment(false);
            console.log("handleCommentSubmit: Finalizado.");
        }
    };

    if (loadingDetail || (contextLoading && !appInitialized && !post) ) { // Condición más específica para carga inicial del post
        console.log("Render: Cargando detalle del post (estado inicial)...");
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Cargando detalle del post...</div>;
    }
    if (errorDetail) {
        console.log("Render: Error al cargar post:", errorDetail);
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>Error: {errorDetail} <br /><Link to="/">Volver</Link></div>;
    }
    if (!post && appInitialized && !contextLoading) {
        console.log("Render: Post no disponible o no encontrado (contexto cargado).");
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Post no disponible o no encontrado. <br /><Link to="/">Volver</Link></div>;
    }
    if (!post) { // Fallback si ninguna de las anteriores atrapó el estado de carga del post
        console.log("Render: Post es null, mostrando carga genérica.");
        return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Cargando post...</div>;
    }

    console.log("Render: Renderizando PostDetail con post:", post, "y comentarios:", comments);

    return (
        <div className="App-container post-item">
            <h1>{post.title}</h1>
            {currentUser && (
                <button
                    onClick={toggleFavorite}
                    disabled={processingFavorite}
                    className={`action-button ${isFavorite ? 'active' : ''}`}
                    style={{ marginBottom: '15px' }}
                >
                    {processingFavorite ? 'Procesando...' : (isFavorite ? '❤️ Quitar Favorito' : '🤍 Añadir Favorito')}
                </button>
            )}
            <p>{post.body}</p>
            <Link to="/">Volver a la lista</Link>

            <section className="comments-section">
                <h3>Comentarios ({comments.length})</h3>
                {currentUser ? (
                    <form onSubmit={handleCommentSubmit} className="comment-form">
                        <textarea
                            className="comment-textarea"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe tu comentario..."
                            rows="4"
                            required
                            disabled={submittingComment}
                        />
                        <button type="submit" className="primary" disabled={submittingComment}>
                            {submittingComment ? 'Enviando...' : 'Enviar Comentario'}
                        </button>
                    </form>
                ) : (
                    <p>Debes <Link to="/login" state={{ from: location }}>iniciar sesión</Link> para comentar.</p>
                )}

                {loadingComments ? (
                    <p>Cargando comentarios...</p>
                ) : comments.length > 0 ? (
                    <ul className="comment-list">
                        {comments.map(comment => (
                            <li key={comment.id} className="comment-item">
                                <div className="comment-author">
                                    {comment.profiles?.avatar_url ? (
                                        <img src={comment.profiles.avatar_url} alt="avatar" className="comment-avatar-mini" />
                                    ) : (
                                        <span className="no-avatar-mini">{comment.profiles?.nombre?.charAt(0).toUpperCase() || '?'}</span>
                                    )}
                                    <span>{comment.profiles?.nombre || 'Usuario Anónimo'}</span>
                                </div>
                                <p>{comment.content}</p>
                                <small style={{color: '#777'}}>
                                    {new Date(comment.created_at).toLocaleString()}
                                </small>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Aún no hay comentarios. ¡Sé el primero!</p>
                )}
            </section>
        </div>
    );
}

export default PostDetail;