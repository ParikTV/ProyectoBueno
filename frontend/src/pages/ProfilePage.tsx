// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import commonStyles from '@/styles/Common.module.css';
import pageStyles from '@/styles/ProfilePage.module.css';
import { API_BASE_URL } from '@/services/api';
import { UserResponse } from '@/types';

export const ProfilePage: React.FC = () => {
    const { user, token, logout, fetchUser } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', phone_number: '' });
    
    // --- ¡CAMBIO AQUÍ! ---
    // Añadimos los nuevos campos al estado de la solicitud
    const [ownerRequestData, setOwnerRequestData] = useState({
        business_name: '',
        business_description: '',
        address: '',
        logo_url: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({ full_name: user.full_name || '', phone_number: user.phone_number || '' });
        }
    }, [user]);

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
            await fetchUser(); // Actualizamos el usuario en el contexto
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
                body: JSON.stringify(ownerRequestData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "No se pudo enviar la solicitud.");
            await fetchUser(); // Actualizamos el usuario en el contexto
            setSuccess("¡Solicitud para ser dueño enviada con éxito! El administrador la revisará pronto.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div className={pageStyles.pageContainer}><p>Cargando perfil...</p></div>;
    if (error) return <div className={pageStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;

    const renderOwnerRequestSection = () => {
        if (user.role === 'usuario' && !user.owner_request) {
            return (
                <div className={commonStyles.formContainer} style={{marginTop: '2rem', maxWidth: '600px'}}>
                    <h2>Solicitar ser Dueño de un Servicio</h2>
                    <p style={{textAlign: 'center', marginBottom: '1.5rem'}}>Completa los datos de tu negocio para que un administrador pueda revisar tu solicitud.</p>
                    <form onSubmit={handleOwnerRequestSubmit}>
                        {/* --- ¡CAMBIO AQUÍ! --- Añadimos los nuevos campos al formulario */}
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="business_name">Nombre del Negocio</label>
                            <input type="text" id="business_name" name="business_name" value={ownerRequestData.business_name} onChange={handleOwnerRequestChange} required />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="address">Dirección del Negocio</label>
                            <input type="text" id="address" name="address" value={ownerRequestData.address} onChange={handleOwnerRequestChange} required />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="logo_url">URL del Logo o Foto Principal (Opcional)</label>
                            <input type="url" id="logo_url" name="logo_url" placeholder="https://ejemplo.com/logo.png" value={ownerRequestData.logo_url} onChange={handleOwnerRequestChange} />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="business_description">Descripción Breve del Negocio</label>
                            <textarea id="business_description" name="business_description" value={ownerRequestData.business_description} onChange={handleOwnerRequestChange} required style={{ width: '100%', minHeight: '100px', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                        </div>
                        <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Enviando...' : 'Enviar Solicitud'}</button>
                    </form>
                </div>
            );
        }
        if (user.owner_request) {
             const statusStyle = user.owner_request.status === 'pending' 
                ? commonStyles.alertSuccess 
                : user.owner_request.status === 'approved'
                ? commonStyles.alertSuccess
                : commonStyles.alertError;

             return (
                 <div className={`${commonStyles.alert} ${statusStyle}`} style={{marginTop: '2rem', maxWidth: '600px'}}>
                     <p style={{margin: '0'}}><strong>Estado de tu solicitud para ser Dueño:</strong> {user.owner_request.status.toUpperCase()}</p>
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
                    {!isEditing && <button className={commonStyles.buttonSecondary} onClick={() => setIsEditing(true)}>Editar Perfil</button>}
                </div>
                {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
                {isEditing ? (
                    <form onSubmit={handleUpdateProfile}>
                        <div className={commonStyles.formGroup}><label htmlFor="full_name">Nombre Completo</label><input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} /></div>
                        <div className={commonStyles.formGroup}><label htmlFor="phone_number">Número de Teléfono</label><input type="tel" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} /></div>
                        <div className={commonStyles.formGroup}><label>Correo Electrónico</label><input type="email" value={user.email} disabled /></div>
                        <div className={commonStyles.actionButtons}>
                            <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                            <button type="button" className={`${commonStyles.button} ${commonStyles.buttonSecondary}`} onClick={() => setIsEditing(false)} disabled={isLoading}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <div className={pageStyles.profileInfo}>
                        <p><strong>Rol:</strong> <span style={{fontWeight: 'bold', color: '#4f46e5', textTransform: 'capitalize'}}>{user.role}</span></p>
                        <p><strong>Nombre Completo:</strong> {user.full_name || 'No especificado'}</p>
                        <p><strong>Teléfono:</strong> {user.phone_number || 'No especificado'}</p>
                        <p><strong>Correo Electrónico:</strong> {user.email}</p>
                        <p><strong>Miembro desde:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                )}
            </div>
            {renderOwnerRequestSection()}
        </div>
    );
};