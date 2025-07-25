// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import commonStyles from '@/styles/Common.module.css';
import pageStyles from '@/styles/ProfilePage.module.css';
import { API_BASE_URL } from '@/services/api';
import { UserResponse } from '@/types';
import { LocationPicker } from '@/components/LocationPicker';

export const ProfilePage: React.FC = () => {
    // MODIFICADO: Se obtiene la función para refrescar el contexto del usuario.
    const { user: initialUser, token, fetchUser: fetchUserFromContext } = useAuth();
    
    const [profile, setProfile] = useState<UserResponse | null>(initialUser);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const [editFormData, setEditFormData] = useState({ full_name: '', phone_number: '' });
    const [ownerRequestData, setOwnerRequestData] = useState({
        business_name: '',
        business_description: '',
        address: '',
        logo_url: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) {
                setIsLoading(false);
                setError("No estás autenticado.");
                return;
            }
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("No se pudo cargar el perfil.");
                const data = await response.json();
                setProfile(data);
                setEditFormData({ full_name: data.full_name || '', phone_number: data.phone_number || '' });

                // --- ¡ESTA ES LA LÓGICA CLAVE DE LA SOLUCIÓN! ---
                // Si el rol en la base de datos es 'dueño' pero en nuestro contexto
                // todavía figura como 'usuario', significa que acaba de ser aprobado.
                if (data.role === 'dueño' && initialUser?.role === 'usuario') {
                    // Forzamos una actualización completa del contexto de autenticación.
                    await fetchUserFromContext();
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    // MODIFICADO: Se añaden las dependencias para que el efecto se vuelva a ejecutar si cambian.
    }, [token, initialUser, fetchUserFromContext]);

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleOwnerRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setOwnerRequestData({ ...ownerRequestData, [e.target.name]: e.target.value });
    };
    
    const handleLocationSelect = (address: string) => {
        setOwnerRequestData(prevData => ({ ...prevData, address }));
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
                body: JSON.stringify(editFormData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "No se pudo actualizar el perfil.");
            setProfile(data); // Actualiza el perfil local
            await fetchUserFromContext(); // Actualiza el contexto global
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
        if (!ownerRequestData.address) {
            alert("Por favor, selecciona una ubicación en el mapa.");
            return;
        }
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
            setProfile(data); // Actualiza el perfil local con la nueva solicitud
            await fetchUserFromContext(); // Actualiza el contexto global
            setSuccess("¡Solicitud para ser dueño enviada con éxito! El administrador la revisará pronto.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className={pageStyles.pageContainer}><p>Cargando perfil...</p></div>;
    if (error) return <div className={pageStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;
    if (!profile) return <div className={pageStyles.pageContainer}><p>No se encontró el perfil.</p></div>;

    const renderOwnerRequestSection = () => {
        if (profile.role === 'usuario' && !profile.owner_request) {
            return (
                <div className={commonStyles.formContainer} style={{marginTop: '2rem', maxWidth: '600px'}}>
                    <h2>Solicitar ser Dueño de un Servicio</h2>
                    <p style={{textAlign: 'center', marginBottom: '1.5rem'}}>Completa los datos de tu negocio para que un administrador pueda revisar tu solicitud.</p>
                    <form onSubmit={handleOwnerRequestSubmit}>
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="business_name">Nombre del Negocio</label>
                            <input type="text" id="business_name" name="business_name" value={ownerRequestData.business_name} onChange={handleOwnerRequestChange} required />
                        </div>
                        
                        <div className={commonStyles.formGroup}>
                            <label>Dirección del Negocio (Haz clic en el mapa para seleccionar)</label>
                            <LocationPicker onLocationSelect={handleLocationSelect} />
                            <input 
                                type="text" 
                                value={ownerRequestData.address} 
                                readOnly 
                                placeholder="La dirección aparecerá aquí..." 
                                style={{marginTop: '0.5rem', backgroundColor: '#f9fafb'}}
                            />
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
        if (profile.owner_request) {
             const statusStyle = profile.owner_request.status === 'pending' 
                ? commonStyles.alertSuccess 
                : profile.owner_request.status === 'approved'
                ? commonStyles.alertSuccess
                : commonStyles.alertError;

             return (
                 <div className={`${commonStyles.alert} ${statusStyle}`} style={{marginTop: '2rem', maxWidth: '600px'}}>
                     <p style={{margin: '0'}}><strong>Estado de tu solicitud para ser Dueño:</strong> {profile.owner_request.status.toUpperCase()}</p>
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
                        <div className={commonStyles.formGroup}><label htmlFor="full_name">Nombre Completo</label><input type="text" id="full_name" name="full_name" value={editFormData.full_name} onChange={handleEditFormChange} /></div>
                        <div className={commonStyles.formGroup}><label htmlFor="phone_number">Número de Teléfono</label><input type="tel" id="phone_number" name="phone_number" value={editFormData.phone_number} onChange={handleEditFormChange} /></div>
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