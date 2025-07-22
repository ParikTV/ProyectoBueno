// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/App.module.css';
import { API_BASE_URL } from '@/services/api';

interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    created_at: string;
}

export const ProfilePage: React.FC = () => {
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) { setError("No estás autenticado."); return; }
            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 401) logout();
                    throw new Error(data.detail || "No se pudo cargar el perfil.");
                }
                setProfile(data);
            } catch (err: any) {
                setError(err.message);
            }
        };
        fetchProfile();
    }, [token, logout]);

    if (error) return <div className={styles.profilePage}><p className={styles.errorMessage}>{error}</p></div>;
    if (!profile) return <div className={styles.profilePage}><p>Cargando perfil...</p></div>;

    return (
        <div className={styles.profilePage}>
            <h2>Mi Perfil</h2>
            <div className={styles.profileInfo}>
                <p><strong>Nombre Completo:</strong> {profile.full_name || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> {profile.phone_number || 'No especificado'}</p>
                <p><strong>Correo Electrónico:</strong> {profile.email}</p>
                <p><strong>ID de Usuario:</strong> {profile.id}</p>
                <p><strong>Miembro desde:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    );
};