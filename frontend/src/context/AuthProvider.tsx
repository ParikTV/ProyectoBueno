// src/context/AuthProvider.tsx

import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from '@/services/api';
import { UserResponse } from '@/types';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchUser = useCallback(async () => {
        const currentToken = localStorage.getItem("servibook_token");
        if (!currentToken) {
            setUser(null);
            setIsAdmin(false);
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (response.ok) {
                const data: UserResponse = await response.json();
                setUser(data);
                setIsAdmin(data.role === 'admin');
            } else {
                logout();
            }
        } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
            logout();
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialToken = localStorage.getItem("servibook_token");
        setToken(initialToken);
        fetchUser();
    }, [fetchUser]);

    const login = (newToken: string) => {
        localStorage.setItem("servibook_token", newToken);
        setToken(newToken);
        fetchUser(); 
    };

    const logout = () => {
        localStorage.removeItem("servibook_token");
        setToken(null);
        setUser(null);
        setIsAdmin(false);
    };
    
    if (isLoading) {
        return <div style={{textAlign: 'center', padding: '3rem', fontSize: '1.2rem'}}>Cargando sesión...</div>;
    }

    // --- LÍNEA CORREGIDA ---
    // Asegúrate de que aquí diga "AuthContext.Provider"
    return (
        <AuthContext.Provider value={{ token, user, isAdmin, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};