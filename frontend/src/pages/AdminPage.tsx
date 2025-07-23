// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Service, ServiceFormInputs, Category } from '@/types';
import commonStyles from '@/styles/Common.module.css';
import adminStyles from '@/styles/AdminPage.module.css';

export const AdminPage: React.FC = () => {
    const { token, isAdmin, logout } = useAuth();
    
    // Estados para la gestión de servicios
    const [services, setServices] = useState<Service[]>([]);
    const [isServiceFormVisible, setIsServiceFormVisible] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceFormData, setServiceFormData] = useState<ServiceFormInputs>({
        name: '',
        category: '',
        location: '',
        image_url: '',
    });

    // Estados para la gestión de categorías
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);

    // Estados generales de la página
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Función unificada para cargar todos los datos necesarios para la página de admin
    const fetchAdminData = async () => {
        if (!token || !isAdmin) {
            setError("Acceso denegado. No eres administrador o no has iniciado sesión.");
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Peticiones en paralelo para mayor eficiencia
            const [servicesResponse, categoriesResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/services/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/categories/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!servicesResponse.ok) throw new Error("No se pudieron cargar los servicios.");
            const servicesData: Service[] = await servicesResponse.json();
            setServices(servicesData);

            if (!categoriesResponse.ok) throw new Error("No se pudieron cargar las categorías.");
            const categoriesData: Category[] = await categoriesResponse.json();
            setCategories(categoriesData);

        } catch (err: any) {
            setError(err.message);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAdminData();
    }, [token, isAdmin]);

    const handleServiceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setServiceFormData({ ...serviceFormData, [e.target.name]: e.target.value });
    };

    const handleServiceFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!serviceFormData.category) {
            setError("Por favor, selecciona una categoría para el servicio.");
            return;
        }

        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const isEditing = !!editingService;
        const method = isEditing ? 'PUT' : 'POST';
        const serviceIdToUse = isEditing ? (editingService?._id || editingService?.id) : null;
        const url = isEditing ? `${API_BASE_URL}/services/${serviceIdToUse}` : `${API_BASE_URL}/services/`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(serviceFormData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || `Error al ${isEditing ? 'actualizar' : 'crear'} el servicio.`);
            
            setSuccess(`Servicio ${isEditing ? 'actualizado' : 'creado'} con éxito!`);
            setIsServiceFormVisible(false);
            setEditingService(null);
            setServiceFormData({ name: '', category: '', location: '', image_url: '' });
            fetchAdminData(); // Recargar todos los datos
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            setError("El nombre de la categoría no puede estar vacío.");
            return;
        }
        setError(null);
        setSuccess(null);
        setIsCategoryLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/categories/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newCategoryName }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Error al crear la categoría.");
            
            setSuccess(`Categoría "${data.name}" creada con éxito.`);
            setNewCategoryName('');
            fetchAdminData(); // Recargar todos los datos
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCategoryLoading(false);
        }
    };

    const handleEditService = (service: Service) => {
        setEditingService(service);
        setServiceFormData({
            name: service.name,
            category: service.category,
            location: service.location,
            image_url: service.image_url || '',
        });
        setIsServiceFormVisible(true);
        window.scrollTo(0, 0);
    };

    const handleDeleteService = async (serviceId: string) => {
        if (!serviceId) {
            setError("Error: ID de servicio no válido.");
            return;
        }
        if (!window.confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al eliminar el servicio.");
            }
            setSuccess("Servicio eliminado con éxito!");
            fetchAdminData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && !services.length && !categories.length) return <div className={adminStyles.pageContainer}><p>Cargando panel de administración...</p></div>;
    if (!isAdmin) return <div className={adminStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>No tienes permisos para acceder a esta página.</p></div>;
    
    return (
        <div className={adminStyles.pageContainer}>
            <h2 className={adminStyles.pageHeader}>Panel de Administración</h2>
            
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}

            {/* --- SECCIÓN PARA GESTIONAR SERVICIOS --- */}
            <div className={adminStyles.actionSection}>
                <button
                    className={`${commonStyles.button} ${commonStyles.buttonPrimary}`}
                    onClick={() => {
                        setIsServiceFormVisible(!isServiceFormVisible);
                        setEditingService(null);
                        setServiceFormData({ name: '', category: '', location: '', image_url: '' });
                    }}
                >
                    {isServiceFormVisible ? 'Cerrar Formulario de Servicio' : 'Añadir Nuevo Servicio'}
                </button>
            </div>

            {isServiceFormVisible && (
                <div className={commonStyles.formContainer} style={{ marginBottom: '2rem' }}>
                    <h3>{editingService ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</h3>
                    <form onSubmit={handleServiceFormSubmit}>
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="name">Nombre del Servicio</label>
                            <input type="text" id="name" name="name" value={serviceFormData.name} onChange={handleServiceFormChange} required />
                        </div>
                        
                        <div className={commonStyles.formGroup}>
                            <label htmlFor="category">Categoría</label>
                            <select 
                                id="category" 
                                name="category" 
                                value={serviceFormData.category} 
                                onChange={handleServiceFormChange} 
                                required
                            >
                                <option value="" disabled>-- Selecciona una categoría --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={commonStyles.formGroup}>
                            <label htmlFor="location">Ubicación</label>
                            <input type="text" id="location" name="location" value={serviceFormData.location} onChange={handleServiceFormChange} required />
                        </div>

                        <div className={commonStyles.formGroup}>
                            <label htmlFor="image_url">URL de la Imagen</label>
                            <input type="url" id="image_url" name="image_url" value={serviceFormData.image_url} onChange={handleServiceFormChange} placeholder="https://ejemplo.com/imagen.jpg" />
                        </div>

                        <div className={commonStyles.actionButtons}>
                            <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Servicio'}</button>
                            <button type="button" className={`${commonStyles.button} ${commonStyles.buttonSecondary}`} onClick={() => setIsServiceFormVisible(false)} disabled={isLoading}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* --- NUEVA SECCIÓN: GESTIONAR CATEGORÍAS --- */}
            <h3 className={adminStyles.sectionTitle}>Gestionar Categorías</h3>
            <div className={commonStyles.formContainer} style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                <h4>Añadir Nueva Categoría</h4>
                <form onSubmit={handleCategorySubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className={commonStyles.formGroup} style={{ flexGrow: 1, marginBottom: 0 }}>
                        <label htmlFor="newCategoryName">Nombre de la Categoría</label>
                        <input 
                            type="text" 
                            id="newCategoryName" 
                            name="newCategoryName" 
                            value={newCategoryName} 
                            onChange={(e) => setNewCategoryName(e.target.value)} 
                            placeholder="Ej: Barberías, Clínicas, etc."
                            required 
                        />
                    </div>
                    <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} style={{ width: 'auto', flexShrink: 0 }} disabled={isCategoryLoading}>
                        {isCategoryLoading ? 'Añadiendo...' : 'Añadir Categoría'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem' }}>
                    <h5>Categorías Existentes:</h5>
                    {categories.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {categories.map(cat => (
                                <span key={cat.id} style={{ padding: '0.5rem 1rem', backgroundColor: '#eef2ff', borderRadius: '9999px', color: '#4338ca', fontSize: '0.9rem', fontWeight: '500' }}>
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p>Aún no hay categorías registradas.</p>
                    )}
                </div>
            </div>

            <h3 className={adminStyles.sectionTitle}>Servicios Existentes</h3>
            {services.length === 0 && !isLoading ? (
                <div className={adminStyles.noServices}>
                    <p>No hay servicios registrados aún.</p>
                </div>
            ) : (
                <div className={adminStyles.serviceList}>
                    {services.map((service) => (
                         <div key={service.id || service._id} className={adminStyles.serviceCard}>
                            {service.image_url && <img src={service.image_url} alt={service.name} className={adminStyles.serviceImage} />}
                            <div className={adminStyles.serviceCardContent}>
                                <h4>{service.name}</h4>
                                <p><strong>Categoría:</strong> <span style={{color: '#4f46e5', fontWeight:'bold'}}>{service.category}</span></p>
                                <p><strong>Ubicación:</strong> {service.location}</p>
                            </div>
                            <div className={adminStyles.serviceCardActions}>
                                <button className={`${commonStyles.button} ${commonStyles.buttonSecondary}`} style={{width:'auto'}} onClick={() => handleEditService(service)}>
                                    Editar
                                </button>
                                <button className={`${adminStyles.buttonDanger}`} style={{width:'auto'}} onClick={() => handleDeleteService(service.id || service._id || '')}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};