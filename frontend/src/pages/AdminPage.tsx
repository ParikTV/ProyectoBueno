// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { UserResponse, CategoryRequest } from '@/types';
import commonStyles from '@/styles/Common.module.css';
import adminStyles from '@/styles/AdminPage.module.css';

// --- Interfaces para compatibilidad con _id de MongoDB ---
interface UserWithMongoId extends UserResponse {
    _id?: string;
}
interface CategoryRequestWithMongoId extends CategoryRequest {
    _id?: string;
}

// --- Componente: Formulario para crear y asignar negocio ---
const AdminCreateBusinessForm: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
    const { token } = useAuth();
    const [owners, setOwners] = useState<UserWithMongoId[]>([]);
    const [selectedOwner, setSelectedOwner] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchOwners = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/users/admin/owners`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setOwners(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch owners");
            }
        };
        fetchOwners();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        if (!selectedOwner) {
            setError("Debes seleccionar un dueño.");
            setIsLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/businesses/admin/assign-business?owner_id=${selectedOwner}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name, description, address })
            });
            if (!res.ok) {
                 const errData = await res.json();
                 throw new Error(errData.detail || "No se pudo crear el negocio.");
            }
            setSuccess(`¡Negocio '${name}' creado y asignado!`);
            setName('');
            setDescription('');
            setAddress('');
            setSelectedOwner('');
            onUpdate(); // Para refrescar listas si es necesario
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={commonStyles.formContainer} style={{maxWidth: '100%'}}>
            <h3 className={adminStyles.sectionTitle} style={{marginTop: 0, border: 'none'}}>Crear y Asignar Negocio</h3>
            <form onSubmit={handleSubmit}>
                <div className={commonStyles.formGroup}>
                    <label>Asignar a Dueño</label>
                    <select value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)} required >
                        <option value="" disabled>Selecciona un dueño</option>
                        {owners.map(owner => <option key={owner.id || owner._id} value={owner.id || owner._id}>{owner.full_name || owner.email}</option>)}
                    </select>
                </div>
                <div className={commonStyles.formGroup}><label>Nombre del Negocio</label><input type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
                <div className={commonStyles.formGroup}><label>Dirección</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} required /></div>
                <div className={commonStyles.formGroup}><label>Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}/></div>
                <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Negocio'}</button>
                {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
                {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
            </form>
        </div>
    );
};

// --- Componente: Formulario para crear categoría ---
const AdminCreateCategoryForm: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
    const { token } = useAuth();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/categories/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "No se pudo crear la categoría. Es posible que ya exista.");
            }
            setSuccess(`¡Categoría '${name}' creada con éxito!`);
            setName('');
            onUpdate();
        } catch (err:any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={commonStyles.formContainer} style={{maxWidth: '100%'}}>
            <h3 className={adminStyles.sectionTitle} style={{marginTop: 0, border: 'none'}}>Crear Nueva Categoría</h3>
            <form onSubmit={handleSubmit}>
                <div className={commonStyles.formGroup}><label>Nombre de la Categoría</label><input type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
                <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Categoría'}</button>
                {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
                {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
            </form>
        </div>
    );
};


// --- Componente principal ---
export const AdminPage: React.FC = () => {
    const { token, isAdmin, logout } = useAuth();
    
    const [ownerRequests, setOwnerRequests] = useState<UserWithMongoId[]>([]);
    const [categoryRequests, setCategoryRequests] = useState<CategoryRequestWithMongoId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const fetchAdminData = async () => {
        if (!token || !isAdmin) return;
        setIsLoading(true);
        setError(null);
        try {
            const [ownerReqRes, categoryReqRes] = await Promise.all([
                fetch(`${API_BASE_URL}/users/admin/owner-requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/users/admin/category-requests`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (ownerReqRes.status === 401 || categoryReqRes.status === 401) {
                logout();
                throw new Error("Tu sesión ha expirado.");
            }
            
            if (ownerReqRes.ok) setOwnerRequests(await ownerReqRes.json());
            if (categoryReqRes.ok) setCategoryRequests(await categoryReqRes.json());

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (isAdmin) fetchAdminData();
    }, [isAdmin, token, updateTrigger]);
    
    const handleAction = async (action: () => Promise<any>, successMessage: string) => {
        setError(null);
        setSuccess(null);
        try {
            await action();
            setSuccess(successMessage);
            setUpdateTrigger(t => t + 1); // Disparar actualización
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleApproveOwnerRequest = (userId: string | undefined) => {
        if (!userId) return;
        if (!window.confirm("¿Aprobar esta solicitud para ser Dueño?")) return;
        handleAction(
            () => fetch(`${API_BASE_URL}/users/admin/approve-owner/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            "¡Solicitud de dueño aprobada con éxito!"
        );
    };
    
    const handleApproveCategoryRequest = (requestId: string | undefined) => {
        if (!requestId) return;
        if (!window.confirm("¿Aprobar y crear esta categoría?")) return;
        handleAction(
            () => fetch(`${API_BASE_URL}/users/admin/category-requests/${requestId}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            "¡Categoría aprobada y creada con éxito!"
        );
    };

    if (isLoading && !ownerRequests.length && !categoryRequests.length) {
        return <div className={adminStyles.pageContainer}><p>Cargando panel de administración...</p></div>;
    }
    if (!isAdmin) return <div className={adminStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>Acceso denegado. No tienes permisos de administrador.</p></div>;
    
    return (
        <div className={adminStyles.pageContainer}>
            <h2 className={adminStyles.pageHeader}>Panel de Administración</h2>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <AdminCreateBusinessForm onUpdate={() => setUpdateTrigger(t => t + 1)} />
                <AdminCreateCategoryForm onUpdate={() => setUpdateTrigger(t => t + 1)} />
            </div>

            <h3 className={adminStyles.sectionTitle}>Solicitudes Pendientes para ser Dueño</h3>
            {!isLoading && ownerRequests.length === 0 ? (
                 <div className={adminStyles.noServices}><p>No hay solicitudes de dueño pendientes.</p></div>
            ) : (
                <div className={adminStyles.serviceList}>
                    {ownerRequests.map(user => (
                        <div key={user.id || user._id} className={adminStyles.serviceCard}>
                            <div className={adminStyles.serviceCardContent}>
                                <h4>{user.owner_request?.business_name || "Nombre no disponible"}</h4>
                                <p><strong>Usuario:</strong> {user.full_name || user.email}</p>
                                <p><strong>Descripción:</strong> {user.owner_request?.business_description || "Sin descripción"}</p>
                            </div>
                            <div className={adminStyles.serviceCardActions}>
                                <button
                                    className={`${commonStyles.button} ${commonStyles.buttonPrimary}`}
                                    style={{ width: 'auto' }}
                                    onClick={() => handleApproveOwnerRequest(user.id || user._id)}
                                >
                                    Aprobar Solicitud
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <h3 className={adminStyles.sectionTitle}>Solicitudes de Nuevas Categorías</h3>
            {!isLoading && categoryRequests.length === 0 ? (
                 <div className={adminStyles.noServices}><p>No hay solicitudes de categorías pendientes.</p></div>
            ) : (
                <div className={adminStyles.serviceList}>
                    {categoryRequests.map(req => (
                        <div key={req.id || req._id} className={adminStyles.serviceCard}>
                            <div className={adminStyles.serviceCardContent}>
                                <h4>Categoría Propuesta: "{req.category_name}"</h4>
                                <p><strong>Motivo:</strong> {req.reason}</p>
                                {req.evidence_url && <a href={req.evidence_url} target="_blank" rel="noopener noreferrer">Ver Evidencia</a>}
                            </div>
                            <div className={adminStyles.serviceCardActions}>
                                <button 
                                    className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} 
                                    style={{width:'auto'}} 
                                    onClick={() => handleApproveCategoryRequest(req.id || req._id)}
                                >
                                    Aprobar Categoría
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};