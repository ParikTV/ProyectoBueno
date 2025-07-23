// src/components/Header.tsx

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/styles/Header.module.css';
import { ExtendedPage } from '@/App'; // Importamos el tipo extendido desde App.tsx

interface HeaderProps {
    navigateTo: (page: ExtendedPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
    // --- CAMBIO CLAVE ---
    // Obtenemos el objeto 'user' completo del contexto de autenticación
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
                    {token && user ? ( // Verificamos que tanto el token como el usuario existan
                        <>
                            <button onClick={() => navigateTo('profile')}>Mi Perfil</button>
                            
                            {/* Lógica corregida para mostrar botones según el rol */}
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