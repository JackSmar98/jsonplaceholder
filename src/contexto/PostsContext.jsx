// src/contexto/PostsContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

export const PostsContext = createContext();

export const usePosts = () => {
    const context = useContext(PostsContext);
    if (context === undefined) {
        throw new Error("usePosts debe ser usado dentro de un PostsProvider");
    }
    return context;
};

export function PostsProvider({ children }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [appInitialized, setAppInitialized] = useState(false);

    useEffect(() => {
        const fetchPostsFromApi = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('https://jsonplaceholder.typicode.com/posts');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPosts(data.slice(0, 10));
            } catch (err) {
                setError(err.message);
                setPosts([]);
            } finally {
                setLoading(false);
                setAppInitialized(true);
            }
        };

        fetchPostsFromApi();
    }, []);

    const value = {
        posts,
        loading,
        error,
        appInitialized,
    };

    return (
        <PostsContext.Provider value={value}>
            {children}
        </PostsContext.Provider>
    );
}