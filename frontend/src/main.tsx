// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthProvider.tsx';
import { CssBaseline } from '@mui/material';
import AppTheme from './themes/AppTheme.tsx'; // FIX: Import the AppTheme component

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* FIX: Wrap the entire application with the AppTheme component */}
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppTheme>
  </React.StrictMode>,
);