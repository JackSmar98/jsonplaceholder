// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { PostsProvider } from './contexto/PostsContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostsProvider>
      <App />
    </PostsProvider>
  </React.StrictMode>,
);