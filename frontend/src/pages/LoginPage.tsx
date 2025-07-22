// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/App.module.css';
import { API_BASE_URL } from '@/services/api';
import { Page } from '@/types';

interface LoginPageProps {
    navigateTo: (page: Page) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigateTo }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const response = await fetch(`${API_BASE_URL}/login/access-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Error al iniciar sesión.');
            login(data.access_token);
            navigateTo('home');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authFormContainer}>
                <h2>Iniciar Sesión</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}><label htmlFor="email">Correo Electrónico</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                    <div className={styles.formGroup}><label htmlFor="password">Contraseña</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                    <button type="submit" className={styles.submitButton} disabled={isLoading}>{isLoading ? 'Iniciando...' : 'Iniciar Sesión'}</button>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                </form>
            </div>
        </div>
    );
};