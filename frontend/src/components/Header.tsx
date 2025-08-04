// src/components/Header.tsx

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import ColorModeSelect from '../themes/ColorModeSelect'; // Importamos el selector de tema

interface HeaderProps {
    navigateTo: (page: ExtendedPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
    const { token, logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigateTo('home');
    };

    return (
        <AppBar position="static" elevation={1} color="default" sx={{ bgcolor: 'background.paper' }}>
            <Toolbar sx={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
                <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ flexGrow: 1, fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => navigateTo('home')}
                >
                    ServiBook
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {token && user ? (
                        <>
                            <Button color="inherit" onClick={() => navigateTo('profile')}>Mi Perfil</Button>
                            {user.role === 'dueño' && (
                                <Button color="inherit" onClick={() => navigateTo('ownerDashboard')}>Mi Negocio</Button>
                            )}
                            {user.role === 'admin' && (
                                <Button color="inherit" onClick={() => navigateTo('admin')}>Panel Admin</Button>
                            )}
                            <Button color="inherit" onClick={() => navigateTo('appointments')}>Mis Citas</Button>
                            <Button color="inherit" onClick={handleLogout}>Cerrar Sesión</Button>
                        </>
                    ) : (
                        <>
                            <Button color="inherit" onClick={() => navigateTo('login')}>Iniciar Sesión</Button>
                            <Button variant="contained" onClick={() => navigateTo('register')}>Registrarse</Button>
                        </>
                    )}
                    <ColorModeSelect size="small" />
                </Box>
            </Toolbar>
        </AppBar>
    );
};