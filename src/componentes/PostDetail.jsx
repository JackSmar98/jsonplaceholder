// src/componentes/PostDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePosts } from '../contexto/PostsContext';
import { supabase } from '../supabase';
import { addActivityToLocalStorage } from '../utils/activityLog.js';

// (Estilos del componente PostDetail sin cambios, solo añadiremos para comentarios)
const commentsSectionStyle = {
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #eee',
};

const commentFormStyle = {
  marginTop: '20px',
  marginBottom: '20px',
};

const commentTextareaStyle = {
  width: '100%',
  minHeight: '80px',
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '1em',
  marginBottom: '10px',
  boxSizing: 'border-box'
};

const commentButtonStyle = {
  padding: '10px 20px',
  backgroundColor: 'var(--primary-color)', // Usar variable CSS
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const commentListStyle = {
  listStyle: 'none',
  padding: 0,
};

const commentItemStyle = {
  border: '1px solid #eee',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '15px',
  backgroundColor: '#f9f9f9',
  textAlign: 'left'
};

const commentAuthorStyle = {
  fontWeight: 'bold',
  marginBottom: '5px',
  display: 'flex',
  alignItems: 'center'
};

const commentAvatarMiniStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '10px',
    border: '1px solid #ccc'
};

const noAvatarMiniStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'inline-block',
    textAlign: 'center',
    lineHeight: '30px',
    fontSize: '10px',
    color: '#757575',
    marginRight: '10px',
    border: '1px solid #ccc'
};


function PostDetail() {
    const { id: postIdFromUrl } = useParams();
    const { posts, appInitialized, loading: contextLoading, error: contextError } = usePosts();

    const [post, setPost] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [errorDetail, setErrorDetail] = useState(null);

    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // Para obtener avatar_url del perfil
    const [isFavorite, setIsFavorite] = useState(false);
    const [processingFavorite, setProcessingFavorite] = useState(false);

    // Estados para comentarios
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const numericPostId = parseInt(postIdFromUrl, 10);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUser(session?.user ?? null);
            if (session?.user) {
                // Obtener perfil del usuario para el avatar en comentarios
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', session.user.id)
                    .single();
                setUserProfile(profileData);
            }
        };
        getSession();
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
             if (session?.user) {
                supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single().then(({data}) => setUserProfile(data));
            } else {
                setUserProfile(null);
            }
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        // (Lógica para cargar el post sin cambios)
        if (contextLoading && !appInitialized) { setLoadingDetail(true); return; }
        if (contextError) { setErrorDetail(`Error obteniendo posts: ${contextError}`); setLoadingDetail(false); setPost(null); return; }
        if (appInitialized) {
            const foundPost = posts.find(p => p.id === numericPostId);
            if (foundPost) { setPost(foundPost); setErrorDetail(null); } else { setErrorDetail('Post no encontrado.'); }
        }
        setLoadingDetail(false);
    }, [numericPostId, posts, appInitialized, contextLoading, contextError]);

    // Cargar comentarios para el post actual
    const fetchComments = useCallback(async () => {
        if (!numericPostId) return;
        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .select('*') // Podrías seleccionar campos específicos: 'id, content, created_at, user_email, user_avatar_url, user_id'
                .eq('post_id', numericPostId)
                .order('created_at', { ascending: false }); // Los más nuevos primero

            if (error) throw error;
            setComments(data || []);
        } catch (err) {
            console.error("Error cargando comentarios:", err);
            // setErrorDetail o un nuevo estado para error de comentarios
        }
        setLoadingComments(false);
    }, [numericPostId]);

    useEffect(() => {
        if (post) { // Solo cargar comentarios si el post existe
            fetchComments();
        }
    }, [post, fetchComments]);


    // Lógica de Favoritos (sin cambios)
    useEffect(() => { /* ... */ }, [post, currentUser]);
    const toggleFavorite = async () => { /* ... */ };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser || !post) return;

        setSubmittingComment(true);
        try {
            const commentToInsert = {
                post_id: post.id,
                user_id: currentUser.id,
                user_email: currentUser.email, // Guardar el email actual
                user_avatar_url: userProfile?.avatar_url || null, // Guardar el avatar actual
                content: newComment.trim(),
            };

            const { data, error } = await supabase
                .from('post_comments')
                .insert(commentToInsert)
                .select() // Para obtener el comentario insertado de vuelta
                .single(); 

            if (error) throw error;

            // Añadir el nuevo comentario a la lista local para actualización instantánea
            // setComments(prevComments => [data, ...prevComments]); // El más nuevo primero
            // O mejor, volver a obtener todos los comentarios para asegurar consistencia si hay paginación o filtros futuros
            fetchComments(); 
            setNewComment(''); // Limpiar el textarea
        } catch (err) {
            console.error("Error al enviar comentario:", err);
            alert(`Error al enviar comentario: ${err.message}`);
        }
        setSubmittingComment(false);
    };


    if (loadingDetail) return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Cargando detalle del post...</div>;
    if (errorDetail) return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>Error: {errorDetail} <br /><Link to="/">Volver</Link></div>;
    if (!post) return <div className="App-container" style={{ textAlign: 'center', marginTop: '20px' }}>Post no disponible. <br /><Link to="/">Volver</Link></div>;

    return (
        <div className="App-container post-item">
            <h1>{post.title}</h1>
            {currentUser && (
                <button onClick={toggleFavorite} disabled={processingFavorite} style={{ marginBottom: '15px', /* ... otros estilos ... */ }}>
                    {processingFavorite ? 'Procesando...' : (isFavorite ? '❤️ Quitar Favorito' : '🤍 Añadir Favorito')}
                </button>
            )}
            <p>{post.body}</p>
            <Link to="/">Volver a la lista</Link>

            {/* Sección de Comentarios */}
            <section style={commentsSectionStyle}>
                <h3>Comentarios ({comments.length})</h3>
                {currentUser ? (
                    <form onSubmit={handleCommentSubmit} style={commentFormStyle}>
                        <textarea
                            style={commentTextareaStyle}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe tu comentario..."
                            rows="4"
                            required
                            disabled={submittingComment}
                        />
                        <button type="submit" style={commentButtonStyle} disabled={submittingComment}>
                            {submittingComment ? 'Enviando...' : 'Enviar Comentario'}
                        </button>
                    </form>
                ) : (
                    <p>Debes <Link to="/login" state={{ from: location }}>iniciar sesión</Link> para comentar.</p>
                )}

                {loadingComments ? (
                    <p>Cargando comentarios...</p>
                ) : comments.length > 0 ? (
                    <ul style={commentListStyle}>
                        {comments.map(comment => (
                            <li key={comment.id} style={commentItemStyle}>
                                <div style={commentAuthorStyle}>
                                    {comment.user_avatar_url ? (
                                        <img src={comment.user_avatar_url} alt="avatar" style={commentAvatarMiniStyle} />
                                    ) : (
                                        <span style={noAvatarMiniStyle}></span>
                                    )}
                                    <span>{comment.user_email || 'Usuario Anónimo'}</span>
                                </div>
                                <p style={{margin: '5px 0 10px 0'}}>{comment.content}</p>
                                <small style={{color: '#777'}}>
                                    {new Date(comment.created_at).toLocaleString()}
                                    {/* Opcional: Lógica para editar/eliminar si es el autor */}
                                    {currentUser && currentUser.id === comment.user_id && (
                                        <>
                                            {/* <button onClick={() => handleEditComment(comment.id)}>Editar</button> */}
                                            {/* <button onClick={() => handleDeleteComment(comment.id)}>Eliminar</button> */}
                                        </>
                                    )}
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