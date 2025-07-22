// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import commonStyles from '@/styles/Common.module.css'; // <-- RUTA ACTUALIZADA
import pageStyles from '@/styles/ProfilePage.module.css'; // <-- RUTA ACTUALIZADA
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
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', phone_number: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
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
                setFormData({ full_name: data.full_name || '', phone_number: data.phone_number || '' });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [token, logout]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "No se pudo actualizar el perfil.");
            setProfile(data);
            setSuccess("¡Perfil actualizado con éxito!");
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !profile) return <div className={pageStyles.pageContainer}><p>Cargando perfil...</p></div>;
    if (error) return <div className={pageStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;
    if (!profile) return <div className={pageStyles.pageContainer}><p>No se encontró el perfil.</p></div>;

    return (
        <div className={pageStyles.pageContainer}>
            <div className={commonStyles.formContainer}>
                <div className={pageStyles.profileHeader}>
                    <h2>Mi Perfil</h2>
                    {!isEditing && (
                        <button className={commonStyles.buttonSecondary} onClick={() => setIsEditing(true)}>
                            Editar Perfil
                        </button>
                    )}
                </div>
                {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
                {isEditing ? (
                    <form onSubmit={handleUpdateProfile}>
                        <div className={commonStyles.formGroup}><label htmlFor="full_name">Nombre Completo</label><input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} /></div>
                        <div className={commonStyles.formGroup}><label htmlFor="phone_number">Número de Teléfono</label><input type="tel" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} /></div>
                        <div className={commonStyles.formGroup}><label>Correo Electrónico</label><input type="email" value={profile.email} disabled /></div>
                        <div className={commonStyles.actionButtons}>
                            <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                            <button type="button" className={`${commonStyles.button} ${commonStyles.buttonSecondary}`} onClick={() => setIsEditing(false)} disabled={isLoading}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <div className={pageStyles.profileInfo}>
                        <p><strong>Nombre Completo:</strong> {profile.full_name || 'No especificado'}</p>
                        <p><strong>Teléfono:</strong> {profile.phone_number || 'No especificado'}</p>
                        <p><strong>Correo Electrónico:</strong> {profile.email}</p>
                        <p><strong>ID de Usuario:</strong> {profile.id}</p>
                        <p><strong>Miembro desde:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                )}
            </div>
        </div>
    );
};