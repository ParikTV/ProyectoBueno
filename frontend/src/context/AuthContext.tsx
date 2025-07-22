// src/context/AuthContext.tsx

import { createContext } from 'react';

// Definimos la "forma" de nuestro contexto
export interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

// Creamos y exportamos el contexto. Esta es la línea clave.
export const AuthContext = createContext<AuthContextType | null>(null);