// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; //
import { API_BASE_URL } from '@/services/api'; //
import { Service, ServiceFormInputs } from '@/types'; //
import commonStyles from '@/styles/Common.module.css'; //
import adminStyles from '@/styles/AdminPage.module.css'; //


export const AdminPage: React.FC = () => {
    const { token, isAdmin, logout } = useAuth(); //
    const [services, setServices] = useState<Service[]>([]); //
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null); //
    const [formData, setFormData] = useState<ServiceFormInputs>({ //
        name: '',
        category: '',
        location: '',
        image_url: '',
    });

    useEffect(() => {
        if (!token || !isAdmin) {
            setError("Acceso denegado. No eres administrador o no has iniciado sesión.");
            setIsLoading(false);
            return;
        }
        fetchServices();
    }, [token, isAdmin, logout]);

    const fetchServices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/services/`, { //
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) logout();
                throw new Error("No se pudieron cargar los servicios.");
            }
            const data: Service[] = await response.json(); //
            setServices(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const isEditing = !!editingService;
        const method = isEditing ? 'PUT' : 'POST';
        let url = '';

        if (isEditing) {
            // USANDO service._id O service.id
            const serviceIdToUse = editingService._id || editingService.id;
            if (!serviceIdToUse) {
                setError("Error interno: ID del servicio para actualizar no encontrado.");
                setIsLoading(false);
                return;
            }
            url = `${API_BASE_URL}/services/${serviceIdToUse}`; //
        } else {
            url = `${API_BASE_URL}/services/`; //
        }
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || `Error al ${isEditing ? 'actualizar' : 'crear'} el servicio.`);
            }
            setSuccess(`Servicio ${isEditing ? 'actualizado' : 'creado'} con éxito!`);
            setIsFormVisible(false);
            setEditingService(null);
            setFormData({ name: '', category: '', location: '', image_url: '' });
            fetchServices();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditService = (service: Service) => { //
        setEditingService(service);
        setFormData({
            name: service.name,
            category: service.category,
            location: service.location,
            image_url: service.image_url || '',
        });
        setIsFormVisible(true);
    };

    const handleDeleteService = async (serviceId: string) => {
        // AÑADIDO: Verificación del ID antes de la eliminación
        // El serviceId ya debería venir con el valor correcto (sea .id o ._id)
        if (!serviceId) {
            setError("Error: El ID del servicio a eliminar no es válido.");
            return;
        }

        if (!window.confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, { //
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al eliminar el servicio.");
            }
            setSuccess("Servicio eliminado con éxito!");
            fetchServices();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !services.length && !error) return <div className={adminStyles.pageContainer}><p>Cargando panel de administración...</p></div>; //
    if (error && !isAdmin) return <div className={adminStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>; //
    if (!isAdmin) return <div className={adminStyles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>No tienes permisos para acceder a esta página.</p></div>; //


    return (
        <div className={adminStyles.pageContainer}> {/* */}
            <h2 className={adminStyles.pageHeader}>Panel de Administración de Servicios</h2> {/* */}

            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>} {/* */}
            {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>} {/* */}

            <div className={adminStyles.actionSection}> {/* */}
                <button
                    // *** ESTA ES LA LÍNEA CRÍTICA (antes 165/168): NO DEBE HABER NADA ENTRE LAS COMILLAS Y EL SÍMBOLO ">" ***
                    className={`${commonStyles.button} ${commonStyles.buttonPrimary}`}
                    onClick={() => {
                        setIsFormVisible(!isFormVisible);
                        setEditingService(null);
                        setFormData({ name: '', category: '', location: '', image_url: '' });
                    }}
                >
                    {isFormVisible ? 'Cerrar Formulario' : 'Añadir Nuevo Servicio'}
                </button>
            </div>

            {isFormVisible && (
                <div className={commonStyles.formContainer}> {/* */}
                    <h3>{editingService ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</h3>
                    <form onSubmit={handleFormSubmit}>
                        <div className={commonStyles.formGroup}> {/* */}
                            <label htmlFor="name">Nombre</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required />
                        </div>
                        <div className={commonStyles.formGroup}> {/* */}
                            <label htmlFor="category">Categoría</label>
                            <input type="text" id="category" name="category" value={formData.category} onChange={handleFormChange} required />
                        </div>
                        <div className={commonStyles.formGroup}> {/* */}
                            <label htmlFor="location">Ubicación</label>
                            <input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} required />
                        </div>
                        <div className={commonStyles.formGroup}> {/* */}
                            <label htmlFor="image_url">URL de la Imagen</label>
                            <input type="url" id="image_url" name="image_url" value={formData.image_url} onChange={handleFormChange} placeholder="http://ejemplo.com/imagen.jpg" />
                        </div>
                        <div className={commonStyles.actionButtons}> {/* */}
                            <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Servicio'}</button> {/* */}
                            <button type="button" className={`${commonStyles.button} ${commonStyles.buttonSecondary}`} onClick={() => setIsFormVisible(false)} disabled={isLoading}>Cancelar</button> {/* */}
                        </div>
                    </form>
                </div>
            )}

            <h3 className={adminStyles.sectionTitle}>Servicios Existentes</h3> {/* */}
            {isLoading && services.length === 0 ? (
                <p>Cargando servicios...</p>
            ) : services.length === 0 ? (
                <div className={adminStyles.noServices}> {/* */}
                    <p>No hay servicios registrados aún.</p>
                </div>
            ) : (
                <div className={adminStyles.serviceList}> {/* */}
                    {services.map((service) => {
                        // CONSOLE.LOGS PARA DEPURACIÓN: Asegúrate de ver qué ID se está pasando
                        console.log("Inspeccionando servicio en la lista:", service);
                        console.log("ID del servicio para eliminar/editar (service.id):", service.id);
                        console.log("ID del servicio para eliminar/editar (service._id):", service._id);

                        // Aquí usamos service._id como fallback si service.id es undefined
                        const serviceIdForActions = service.id || service._id || ''; 

                        return (
                            <div key={serviceIdForActions} className={adminStyles.serviceCard}> {/* */}
                                <div className={adminStyles.serviceCardContent}> {/* */}
                                    <h4>{service.name}</h4>
                                    <p><strong>Categoría:</strong> {service.category}</p>
                                    <p><strong>Ubicación:</strong> {service.location}</p>
                                    {service.image_url && <img src={service.image_url} alt={service.name} className={adminStyles.serviceImage} />} {/* */}
                                </div>
                                <div className={adminStyles.serviceCardActions}> {/* */}
                                    <button
                                        // *** LÍNEA 236 (antes 236): VERIFICA AQUÍ. Debe ser así, sin ` {/* */}` al final. ***
                                        className={`${commonStyles.button} ${commonStyles.buttonSecondary}`}
                                        onClick={() => handleEditService(service)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        // *** LÍNEA 241 (aproximadamente): VERIFICA AQUÍ. Debe ser así, sin ` {/* */}` al final. ***
                                        className={`${commonStyles.button} ${commonStyles.buttonDanger}`}
                                        onClick={() => handleDeleteService(serviceIdForActions)} // Usar el ID fallback
                                    >
                                        Eliminar
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