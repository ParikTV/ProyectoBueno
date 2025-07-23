// src/context/AuthContext.tsx

import { createContext } from 'react';
import { UserResponse } from '@/types'; // Importamos el tipo de usuario

// Definimos la "forma" de nuestro contexto
export interface AuthContextType {
    token: string | null;
    user: UserResponse | null;
    isAdmin: boolean;
    login: (token: string) => void;
    logout: () => void;
    // La función fetchUser no necesita argumentos, usará el token del contexto
    fetchUser: () => Promise<void>; 
}

// Creamos y exportamos el contexto
export const AuthContext = createContext<AuthContextType | null>(null);