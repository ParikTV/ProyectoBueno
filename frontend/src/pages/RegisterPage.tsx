// src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import commonStyles from '@/styles/Common.module.css'; // <-- RUTA ACTUALIZADA
import pageStyles from '@/styles/AuthPage.module.css'; // <-- RUTA ACTUALIZADA
import { API_BASE_URL } from '@/services/api';
import { Page } from '@/types';

interface RegisterPageProps {
    navigateTo: (page: Page) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigateTo }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Ocurrió un error.');
            setSuccess(`¡Registro exitoso! Ahora puedes iniciar sesión.`);
            setTimeout(() => navigateTo('login'), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={pageStyles.pageContainer}>
            <div className={commonStyles.formContainer}>
                <h2>Crear una Cuenta</h2>
                <form onSubmit={handleSubmit}>
                    <div className={commonStyles.formGroup}><label htmlFor="email">Correo Electrónico</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                    <div className={commonStyles.formGroup}><label htmlFor="password">Contraseña</label><input type="password" id="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                    <div className={commonStyles.formGroup}><label htmlFor="confirmPassword">Confirmar Contraseña</label><input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                    <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>
                        {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                    </button>
                    {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
                    {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
                </form>
            </div>
        </div>
    );
};