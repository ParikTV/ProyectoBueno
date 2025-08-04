// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthProvider.tsx';
import { CssBaseline } from '@mui/material';
import AppTheme from './themes/AppTheme.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google'; // Importa el proveedor

// Obtén el Client ID desde las variables de entorno
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppTheme>
        <CssBaseline enableColorScheme />
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppTheme>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);