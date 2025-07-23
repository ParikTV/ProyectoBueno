// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import commonStyles from '@/styles/Common.module.css';
import pageStyles from '@/styles/ProfilePage.module.css';
import { API_BASE_URL } from '@/services/api';
import { UserResponse } from '@/types';

export const ProfilePage: React.FC = () => {
    const { token, logout, checkAdminStatus } = useAuth();
    const [profile, setProfile] = useState<UserResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', phone_number: '' });
    
    // Estado para el formulario de solicitud de dueño
    const [ownerRequestData, setOwnerRequestData] = useState({ business_name: '', business_description: '' });

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
    
    useEffect(() => {
        fetchProfile();
    }, [token, logout]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleOwnerRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setOwnerRequestData({ ...ownerRequestData, [e.target.name]: e.target.value });
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
    
    const handleOwnerRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/me/request-owner`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...ownerRequestData, status: 'pending' })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "No se pudo enviar la solicitud.");
            setProfile(data);
            setSuccess("¡Solicitud para ser dueño enviada con éxito! El administrador la revisará pronto.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !profile) return <div className={pageStyles.pageContainer}><p>Cargando perfil...</p></div>;
    if (error) return <div className={pageStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;
    if (!profile) return <div className={pageStyles.pageContainer}><p>No se encontró el perfil.</p></div>;

    const renderOwnerRequestSection = () => {
        if (profile.role === 'usuario' && !profile.owner_request) {
            return (
                <div className={commonStyles.formContainer} style={{marginTop: '2rem', maxWidth: '600px'}}>
                    <h2>Solicitar ser Dueño de un Servicio</h2>
                    <p style={{textAlign: 'center', marginBottom: '1.5rem'}}>Si eres dueño de un negocio y quieres ofrecer tus servicios en nuestra plataforma, completa este formulario.</p>
                    <form onSubmit={handleOwnerRequestSubmit}>
                        <div className={commonStyles.formGroup}><label htmlFor="business_name">Nombre del Negocio</label><input type="text" id="business_name" name="business_name" value={ownerRequestData.business_name} onChange={handleOwnerRequestChange} required /></div>
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="business_description">Descripción Breve del Negocio</label>
                            <textarea id="business_description" name="business_description" value={ownerRequestData.business_description} onChange={(e) => handleOwnerRequestChange(e as any)} required style={{ width: '100%', minHeight: '100px', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                        </div>
                        <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Enviando...' : 'Enviar Solicitud'}</button>
                    </form>
                </div>
            );
        }
        if (profile.owner_request) {
             const statusStyle = profile.owner_request.status === 'pending' 
                ? commonStyles.alertSuccess 
                : profile.owner_request.status === 'approved'
                ? commonStyles.alertSuccess
                : commonStyles.alertError;

             return (
                 <div className={`${commonStyles.alert} ${statusStyle}`} style={{marginTop: '2rem', maxWidth: '600px'}}>
                     <p style={{margin: '0'}}><strong>Estado de tu solicitud para ser Dueño:</strong> {profile.owner_request.status.toUpperCase()}</p>
                     {profile.owner_request.status === 'pending' && <p style={{margin: '0.5rem 0 0 0'}}>Un administrador revisará tu solicitud pronto.</p>}
                     {profile.owner_request.status === 'rejected' && <p style={{margin: '0.5rem 0 0 0'}}>Tu solicitud ha sido rechazada. Contacta a soporte para más información.</p>}
                 </div>
             );
        }
        return null;
    };

    return (
        <div className={pageStyles.pageContainer} style={{flexDirection: 'column', alignItems: 'center'}}>
            <div className={commonStyles.formContainer} style={{maxWidth: '600px'}}>
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
                        <p><strong>Rol:</strong> <span style={{fontWeight: 'bold', color: '#4f46e5', textTransform: 'capitalize'}}>{profile.role}</span></p>
                        <p><strong>Nombre Completo:</strong> {profile.full_name || 'No especificado'}</p>
                        <p><strong>Teléfono:</strong> {profile.phone_number || 'No especificado'}</p>
                        <p><strong>Correo Electrónico:</strong> {profile.email}</p>
                        <p><strong>Miembro desde:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                )}
            </div>
            {renderOwnerRequestSection()}
        </div>
    );
};