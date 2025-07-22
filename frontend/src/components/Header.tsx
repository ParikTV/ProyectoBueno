// src/components/Header.tsx

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/App.module.css';
import { Page } from '@/types';

interface HeaderProps {
    navigateTo: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
    const { token, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigateTo('home');
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerNav}>
                <h1 onClick={() => navigateTo('home')}>ServiBook</h1>
                <nav className={styles.navLinks}>
                    {token ? (
                        <>
                            <button onClick={() => navigateTo('profile')}>Mi Perfil</button>
                            <button onClick={() => navigateTo('appointments')}>Mis Citas</button>
                            <button onClick={handleLogout}>Cerrar Sesión</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigateTo('login')}>Iniciar Sesión</button>
                            <button onClick={() => navigateTo('register')} className={styles.signUpButton}>Registrarse</button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};