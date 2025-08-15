

import { createContext } from 'react';
import { UserResponse } from '@/types';


export interface AuthContextType {
    token: string | null;
    user: UserResponse | null;
    isAdmin: boolean;
    login: (token: string) => void;
    logout: () => void;

    fetchUser: () => Promise<void>; 
}


export const AuthContext = createContext<AuthContextType | null>(null);