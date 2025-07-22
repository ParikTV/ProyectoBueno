// src/context/AuthProvider.tsx

import React, { useState, ReactNode, useEffect } from 'react'; // Importamos useEffect
import { AuthContext } from './AuthContext'; //
import { API_BASE_URL } from '@/services/api'; // Importamos la URL base de la API

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("servibook_token"));
    const [isAdmin, setIsAdmin] = useState<boolean>(false); // AÑADIDO: Nuevo estado para el rol de admin

    // Función para verificar el estado de administrador del usuario
    const checkAdminStatus = async () => {
        if (!token) {
            setIsAdmin(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, { //
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            if (response.ok) {
                const data = await response.json();
                setIsAdmin(data.is_admin || false); // Actualizar el estado isAdmin
            } else {
                setIsAdmin(false);
                // Si el token es inválido o expira, limpiarlo
                if (response.status === 401) {
                    logout();
                }
            }
        } catch (error) {
            console.error("Error al verificar el estado de administrador:", error);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        checkAdminStatus(); // Verificar el estado de admin al cargar el componente o cambiar el token
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem("servibook_token", newToken);
        // Al iniciar sesión, inmediatamente verifica el rol de admin
        checkAdminStatus(); 
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem("servibook_token");
        setIsAdmin(false); // Resetear el estado de admin al cerrar sesión
    };

    return (
        <AuthContext.Provider value={{ token, isAdmin, login, logout, checkAdminStatus }}>
            {children}
        </AuthContext.Provider>
    );
};