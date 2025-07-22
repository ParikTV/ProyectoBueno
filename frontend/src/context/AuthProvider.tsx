// src/context/AuthProvider.tsx

import React, { useState, ReactNode } from 'react';
import { AuthContext } from '@/context/AuthContext';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("servibook_token"));

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem("servibook_token", newToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem("servibook_token");
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider> // <-- ¡Aquí está la corrección!
    );
};