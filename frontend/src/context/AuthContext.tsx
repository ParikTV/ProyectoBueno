// src/context/AuthContext.tsx

import { createContext } from 'react';

// Definimos la "forma" de nuestro contexto
export interface AuthContextType {
    token: string | null;
    isAdmin: boolean; // AÑADIDO: Estado para saber si el usuario es admin
    login: (token: string) => void;
    logout: () => void;
    checkAdminStatus: () => Promise<void>; // AÑADIDO: Función para verificar el estado de admin
}

// Creamos y exportamos el contexto. Esta es la línea clave.
export const AuthContext = createContext<AuthContextType | null>(null);