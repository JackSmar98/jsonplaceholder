// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import PostsList from './componentes/PostsList';
import PostDetail from './componentes/PostDetail';
import Login from './componentes/Login';
import Registro from './componentes/Registro';
import PerfilUsuario from './componentes/PerfilUsuario';
import Favoritos from './componentes/Favoritos';
import Aleatorios from './componentes/Aleatorios'; // <--- IMPORTA EL NUEVO COMPONENTE
import { supabase } from './supabase.js';
import './App.css';

const Menu = ({ user, onLogout }) => {
  return (
    <nav className="main-menu">
      <Link to="/">Lista de Posts</Link>
      <span style={{ margin: '0 10px' }}>|</span>
      <Link to="/aleatorios">Posts Aleatorios</Link> {/* <--- ENLACE A ALEATORIOS */}
      <span style={{ margin: '0 10px' }}>|</span>
      {user ? (
        <>
          <Link to="/favoritos">Mis Favoritos</Link>
          <span style={{ margin: '0 10px' }}>|</span>
          <Link to="/perfil">Mi Perfil</Link>
          <span style={{ margin: '0 10px' }}>|</span>
          <span>Hola, {user.email}</span>
          <span style={{ margin: '0 10px' }}>|</span>
          <button onClick={onLogout}>Cerrar Sesión</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <span style={{ margin: '0 10px' }}>|</span>
          <Link to="/registro">Registro</Link>
        </>
      )}
    </nav>
  );
};

function App() {
  const [userSession, setUserSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      setLoadingSession(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
    });
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => { 
    await supabase.auth.signOut();
  };

  if (loadingSession) {
    return <div className="App-container" style={{ textAlign: 'center', marginTop: '50px' }}>Cargando sesión...</div>;
  }

  return (
    <Router>
      <Menu user={userSession} onLogout={handleLogout} />
      <div className="content-area" style={{ paddingTop: '20px' }}>
        <Routes>
          <Route path="/login" element={!userSession ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/registro" element={!userSession ? <Registro /> : <Navigate to="/" replace />} />
          
          <Route path="/" element={<PostsList />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/aleatorios" element={<Aleatorios />} /> {/* <--- NUEVA RUTA */}

          <Route
            path="/perfil"
            element={userSession ? <PerfilUsuario /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/favoritos"
            element={userSession ? <Favoritos /> : <Navigate to="/login" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;