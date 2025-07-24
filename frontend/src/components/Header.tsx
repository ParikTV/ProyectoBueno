// src/components/Header.tsx

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/styles/Header.module.css';
import { ExtendedPage } from '@/App';

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
        <header className={styles.header}>
            <div className={styles.headerNav}>
                <h1 onClick={() => navigateTo('home')}>ServiBook</h1>
                <nav className={styles.navLinks}>
                    {token && user ? (
                        <>
                            {/* --- Se añade el botón de prueba aquí --- */}
                            <button onClick={() => navigateTo('testBooking')} style={{color: '#f59e0b', fontWeight: 'bold'}}>Página de Prueba</button>
                            
                            <button onClick={() => navigateTo('profile')}>Mi Perfil</button>
                            
                            {user.role === 'dueño' && (
                                <button onClick={() => navigateTo('ownerDashboard')}>Mi Negocio</button>
                            )}
                            {user.role === 'admin' && (
                                <button onClick={() => navigateTo('admin')}>Panel Admin</button>
                            )}
                            
                            <button onClick={() => navigateTo('appointments')}>Mis Citas</button>
                            <button onClick={handleLogout}>Cerrar Sesión</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigateTo('login')}>Iniciar Sesión</button>
                            <button onClick={() => navigateTo('register')} className={styles.buttonSignUp}>Registrarse</button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};