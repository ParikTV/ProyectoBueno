// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { UserResponse, CategoryRequest } from '@/types';
import commonStyles from '@/styles/Common.module.css';
import adminStyles from '@/styles/AdminPage.module.css';

// Interfaces para compatibilidad con _id de MongoDB
interface UserWithMongoId extends UserResponse {
    _id?: string;
}
interface CategoryRequestWithMongoId extends CategoryRequest {
    _id?: string;
}

export const AdminPage: React.FC = () => {
    const { token, isAdmin, logout } = useAuth();
    
    const [ownerRequests, setOwnerRequests] = useState<UserWithMongoId[]>([]);
    const [categoryRequests, setCategoryRequests] = useState<CategoryRequestWithMongoId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
            
            if (ownerReqRes.ok) {
                setOwnerRequests(await ownerReqRes.json());
            } else {
                console.error("No se pudieron cargar las solicitudes de dueño.");
                setError("No se pudieron cargar las solicitudes de dueño.");
            }

            if (categoryReqRes.ok) {
                setCategoryRequests(await categoryReqRes.json());
            } else {
                console.error("No se pudieron cargar las solicitudes de categorías.");
                throw new Error("No se pudieron cargar las solicitudes de categorías.");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (isAdmin) fetchAdminData();
    }, [isAdmin, token]);
    
    const handleApproveOwnerRequest = async (userId: string | undefined) => {
        if (!userId) {
            setError("Error crítico: El ID del usuario es inválido.");
            return;
        }
        if (!window.confirm("¿Estás seguro de que quieres aprobar esta solicitud para ser Dueño?")) return;
        
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/admin/approve-owner/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("No se pudo aprobar la solicitud de dueño.");
            setSuccess("¡Solicitud de dueño aprobada con éxito!");
            fetchAdminData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApproveCategoryRequest = async (requestId: string | undefined) => {
        if (!requestId) {
            setError("Error: El ID de la solicitud de categoría es inválido.");
            return;
        }
        if (!window.confirm("¿Estás seguro de que quieres crear esta nueva categoría?")) return;

        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/admin/category-requests/${requestId}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("No se pudo aprobar la solicitud de categoría.");
            setSuccess("Categoría aprobada y creada con éxito.");
            fetchAdminData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className={adminStyles.pageContainer}><p>Cargando panel...</p></div>;
    if (!isAdmin) return <div className={adminStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>No tienes permisos.</p></div>;
    
    return (
        <div className={adminStyles.pageContainer}>
            <h2 className={adminStyles.pageHeader}>Panel de Administración</h2>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}

            <h3 className={adminStyles.sectionTitle}>Solicitudes Pendientes para ser Dueño</h3>
            {!isLoading && ownerRequests.length === 0 ? (
                 <div className={adminStyles.noServices}><p>No hay solicitudes de dueño pendientes.</p></div>
            ) : (
                <div className={adminStyles.serviceList}>
                    {ownerRequests.map(user => {
                        const currentUserId = user.id || user._id;
                        return (
                            <div key={currentUserId} className={adminStyles.serviceCard}>
                                <div className={adminStyles.serviceCardContent}>
                                    <h4>{user.owner_request?.business_name || "Nombre no disponible"}</h4>
                                    <p><strong>Usuario:</strong> {user.full_name || user.email}</p>
                                    <p><strong>Descripción:</strong> {user.owner_request?.business_description || "Sin descripción"}</p>
                                </div>
                                <div className={adminStyles.serviceCardActions}>
                                    <button
                                        className={`${commonStyles.button} ${commonStyles.buttonPrimary}`}
                                        style={{ width: 'auto' }}
                                        onClick={() => handleApproveOwnerRequest(currentUserId)}
                                    >
                                        Aprobar Solicitud
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <h3 className={adminStyles.sectionTitle} style={{marginTop: '3rem'}}>Solicitudes de Nuevas Categorías</h3>
            {!isLoading && categoryRequests.length === 0 ? (
                 <div className={adminStyles.noServices}><p>No hay solicitudes de categorías pendientes.</p></div>
            ) : (
                <div className={adminStyles.serviceList}>
                    {categoryRequests.map(req => {
                        // --- CAMBIO CLAVE AQUÍ ---
                        const currentRequestId = req.id || req._id;
                        return (
                            <div key={currentRequestId} className={adminStyles.serviceCard}>
                                <div className={adminStyles.serviceCardContent}>
                                    <h4>Categoría Propuesta: "{req.category_name}"</h4>
                                    <p><strong>Motivo:</strong> {req.reason}</p>
                                    {req.evidence_url && <a href={req.evidence_url} target="_blank" rel="noopener noreferrer">Ver Evidencia</a>}
                                </div>
                                <div className={adminStyles.serviceCardActions}>
                                    <button 
                                        className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} 
                                        style={{width:'auto'}} 
                                        onClick={() => handleApproveCategoryRequest(currentRequestId)}
                                    >
                                        Aprobar Categoría
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};