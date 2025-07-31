// src/pages/OwnerDashboardPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Business, Category, Schedule, ScheduleDay } from '@/types';
import commonStyles from '@/styles/Common.module.css';
import { LocationPicker } from '@/components/LocationPicker';
import { ExtendedPage } from '@/App';
import { StarIcon } from '@/components/Icons'; // Importamos el ícono

// --- Estilos para la nueva UI de gestión de fotos (añadidos aquí para simplicidad) ---
const photoManagementStyles: { [key: string]: React.CSSProperties } = {
    photoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '1rem',
        marginTop: '10px',
        padding: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem'
    },
    photoContainer: {
        position: 'relative',
        width: '100%',
        paddingBottom: '100%', // Para mantener un aspect ratio 1:1
        borderRadius: '0.5rem',
        overflow: 'hidden'
    },
    photoImg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    photoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: 0,
        transition: 'opacity 0.2s'
    },
    photoContainerHover: {
        opacity: 1
    },
    photoButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
    },
    mainPhotoIndicator: {
        position: 'absolute',
        top: '4px',
        left: '4px',
        color: '#f59e0b',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '50%',
        padding: '4px'
    },
     mainPhotoBorder: {
        boxShadow: '0 0 0 3px #4f46e5', // Borde para la foto principal
        borderRadius: '0.5rem',
    }
};

// --- Componente para registrar un NUEVO negocio (sin cambios) ---
const BusinessRegistrationForm: React.FC<{ onSave: () => void; onCancel: () => void; }> = ({ onSave, onCancel }) => {
    // ... (este componente no necesita cambios)
    const { token } = useAuth();
    const [formData, setFormData] = useState({ name: '', description: '', address: ''});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLocationSelect = (address: string) => {
        setFormData(prev => ({ ...prev, address }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.address) {
            alert("Por favor, selecciona una ubicación en el mapa.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/businesses/my-business`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                const detail = errorData.detail?.[0];
                const errorMessage = detail ? `${detail.loc[1]}: ${detail.msg}` : (errorData.detail || "No se pudo registrar la empresa.");
                throw new Error(errorMessage);
            }
            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={commonStyles.formContainer} style={{maxWidth: '600px'}}>
            <h2>Registra un Nuevo Negocio</h2>
            <p style={{textAlign: 'center', marginBottom: '1.5rem'}}>Completa los datos de tu nuevo negocio para empezar.</p>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className={commonStyles.formGroup}><label>Nombre del Negocio</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                
                <div className={commonStyles.formGroup}>
                    <label>Dirección del Negocio (Haz clic en el mapa)</label>
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                    <input type="text" value={formData.address} readOnly placeholder="La dirección aparecerá aquí..." style={{marginTop: '0.5rem', backgroundColor: '#f9fafb'}}/>
                </div>

                <div className={commonStyles.formGroup}><label>Descripción Corta</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{minHeight: '100px', width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box'}} /></div>
                <div className={commonStyles.actionButtons}>
                    <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>
                        {isLoading ? 'Registrando...' : 'Registrar Negocio'}
                    </button>
                     <button type="button" className={`${commonStyles.button} ${commonStyles.buttonSecondary}`} onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};


// --- Componente para el formulario de EDICIÓN del negocio (CON CAMBIOS) ---
const BusinessEditForm: React.FC<{ business: Business; onSave: () => void; onCancel: () => void; }> = ({ business, onSave, onCancel }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState<Business>(business);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);

    // --- NUEVA LÓGICA DE FOTOS ---
    const allBusinessPhotos = Array.from(new Set([
        ...(formData.logo_url ? [formData.logo_url] : []),
        ...formData.photos
    ]));

    const handleSetAsMain = (photoUrl: string) => {
        setFormData(prev => {
            const otherPhotos = allBusinessPhotos.filter(p => p !== photoUrl);
            return {
                ...prev,
                logo_url: photoUrl,
                photos: otherPhotos
            };
        });
    };

    const handleDeletePhoto = (photoUrl: string) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta foto?")) return;

        setFormData(prev => {
            const newPhotos = prev.photos.filter(p => p !== photoUrl);
            const newLogoUrl = prev.logo_url === photoUrl ? null : prev.logo_url;
            return {
                ...prev,
                logo_url: newLogoUrl,
                photos: newPhotos
            };
        });
    };

    const handleAddPhoto = () => {
        if (newPhotoUrl && !allBusinessPhotos.includes(newPhotoUrl)) {
            // Si no hay foto principal, la primera que se añade se convierte en la principal
            if (!formData.logo_url) {
                setFormData({ ...formData, logo_url: newPhotoUrl });
            } else {
                setFormData({ ...formData, photos: [...formData.photos, newPhotoUrl] });
            }
            setNewPhotoUrl('');
        }
    };
    // --- FIN DE LA NUEVA LÓGICA DE FOTOS ---

    const handleLocationSelect = (address: string) => {
        setFormData(prev => ({ ...prev, address }));
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/categories/`);
                if (res.ok) setAllCategories(await res.json());
            } catch (err) { console.error("No se pudieron cargar las categorías."); }
        };
        fetchCategories();
    }, []);

    const handleCategoryChange = (categoryName: string) => {
        const currentCategories = formData.categories || [];
        const newCategories = currentCategories.includes(categoryName) ? currentCategories.filter(c => c !== categoryName) : [...currentCategories, categoryName];
        setFormData({ ...formData, categories: newCategories });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const businessId = business.id || (business as any)._id;
            if (!businessId) throw new Error("ID del negocio no encontrado.");
            
            // --- PAYLOAD DE ACTUALIZACIÓN MODIFICADO ---
            const updateData = { 
                name: formData.name, 
                description: formData.description, 
                address: formData.address, 
                photos: formData.photos, 
                categories: formData.categories,
                logo_url: formData.logo_url // Se envía la foto principal
            };

            const response = await fetch(`${API_BASE_URL}/businesses/my-business/${businessId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 const detail = errorData.detail?.[0];
                 const errorMessage = detail ? `${detail.loc[1]}: ${detail.msg}` : (errorData.detail || "No se pudieron guardar los cambios.");
                 throw new Error(errorMessage);
            }
            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={commonStyles.formContainer} style={{maxWidth: '700px'}}>
            <h2>Editar {business.name}</h2>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            <form onSubmit={handleSubmit}>
                 <div className={commonStyles.formGroup}><label>Nombre de la Empresa</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                
                <div className={commonStyles.formGroup}>
                    <label>Dirección del Negocio (Haz clic en el mapa para actualizar)</label>
                    <LocationPicker 
                        onLocationSelect={handleLocationSelect}
                        initialAddress={formData.address}
                    />
                    <input type="text" value={formData.address} readOnly placeholder="La dirección aparecerá aquí..." style={{marginTop: '0.5rem', backgroundColor: '#f9fafb'}}/>
                </div>

                <div className={commonStyles.formGroup}><label>Descripción</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{minHeight: '100px', width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box'}} /></div>
                <div className={commonStyles.formGroup}><label>Categorías</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>{allCategories.map(cat => (<label key={cat.id || (cat as any)._id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><input type="checkbox" checked={formData.categories.includes(cat.name)} onChange={() => handleCategoryChange(cat.name)} />{cat.name}</label>))}</div></div>
                
                {/* --- SECCIÓN DE FOTOS ACTUALIZADA --- */}
                <div className={commonStyles.formGroup}>
                    <label>Fotos del Negocio</label>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <input 
                            type="url" 
                            placeholder="https://ejemplo.com/foto.jpg" 
                            value={newPhotoUrl} 
                            onChange={e => setNewPhotoUrl(e.target.value)} 
                            style={{flexGrow: 1}}
                        />
                        <button type="button" className={commonStyles.buttonSecondary} onClick={handleAddPhoto} style={{width: 'auto'}}>Añadir</button>
                    </div>
                    <div style={photoManagementStyles.photoGrid}>
                        {allBusinessPhotos.length > 0 ? allBusinessPhotos.map((photo) => (
                            <div 
                                key={photo} 
                                style={{
                                    ...(photo === formData.logo_url ? photoManagementStyles.mainPhotoBorder : {}),
                                }}
                                onMouseEnter={() => setHoveredPhoto(photo)}
                                onMouseLeave={() => setHoveredPhoto(null)}
                            >
                                <div style={photoManagementStyles.photoContainer}>
                                    <img src={photo} alt="Foto del negocio" style={photoManagementStyles.photoImg} />
                                    {photo === formData.logo_url && (
                                        <div style={photoManagementStyles.mainPhotoIndicator}>
                                            <StarIcon className=''/>
                                        </div>
                                    )}
                                    <div style={{
                                        ...photoManagementStyles.photoOverlay,
                                        ...(hoveredPhoto === photo ? photoManagementStyles.photoContainerHover : {})
                                    }}>
                                        {photo !== formData.logo_url && (
                                            <button type="button" title="Poner como principal" style={photoManagementStyles.photoButton} onClick={() => handleSetAsMain(photo)}>⭐</button>
                                        )}
                                        <button type="button" title="Eliminar foto" style={{...photoManagementStyles.photoButton, color: '#ef4444'}} onClick={() => handleDeletePhoto(photo)}>🗑️</button>
                                    </div>
                                </div>
                            </div>
                        )) : <p style={{gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280'}}>Añade una URL para subir tu primera foto.</p>}
                    </div>
                </div>

                <div className={commonStyles.actionButtons}><button type="submit" className={commonStyles.buttonPrimary} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button><button type="button" className={commonStyles.buttonSecondary} onClick={onCancel}>Cancelar</button></div>
            </form>
        </div>
    );
};

// --- Componente de Horario (sin cambios) ---
const ManageScheduleForm: React.FC<{ business: Business; onSave: () => void; onCancel: () => void; }> = ({ business, onSave, onCancel }) => {
    // ... (este componente no necesita cambios)
    const { token } = useAuth();
    const [schedule, setSchedule] = useState<Schedule>(business.schedule || {
        monday: { is_active: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30, capacity_per_slot: 1 },
        tuesday: { is_active: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30, capacity_per_slot: 1 },
        wednesday: { is_active: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30, capacity_per_slot: 1 },
        thursday: { is_active: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30, capacity_per_slot: 1 },
        friday: { is_active: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30, capacity_per_slot: 1 },
        saturday: { is_active: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30, capacity_per_slot: 1 },
        sunday: { is_active: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30, capacity_per_slot: 1 },
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDayChange = (day: keyof Schedule, field: keyof ScheduleDay, value: any) => {
        const numericFields = ['slot_duration_minutes', 'capacity_per_slot'];
        const finalValue = numericFields.includes(field) ? parseInt(value, 10) : value;
        
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: finalValue }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const businessId = business.id || (business as any)._id;
            const res = await fetch(`${API_BASE_URL}/businesses/my-business/${businessId}/schedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(schedule)
            });
            if (!res.ok) throw new Error((await res.json()).detail || "No se pudo guardar el horario.");
            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const dayNames: { [key: string]: string } = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };

    return (
        <div className={commonStyles.formContainer} style={{maxWidth: '800px'}}>
            <h2>Gestionar Horario de {business.name}</h2>
            <p style={{textAlign: 'center', color: '#6b7280'}}>Define los días y horas que tu negocio está abierto...</p>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem', fontWeight: 'bold', paddingBottom: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #f3f4f6'}}>
                    <span>Día</span>
                    <span>Apertura</span>
                    <span>Cierre</span>
                    <span>Duración (min)</span>
                    <span>Cupos / Cita</span>
                </div>
                {Object.keys(dayNames).map(day => (
                    <div key={day} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <label style={{fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <input type="checkbox" checked={schedule[day as keyof Schedule].is_active} onChange={e => handleDayChange(day as keyof Schedule, 'is_active', e.target.checked)} style={{transform: 'scale(1.2)'}}/>
                            {dayNames[day]}
                        </label>
                        <input type="time" value={schedule[day as keyof Schedule].open_time} onChange={e => handleDayChange(day as keyof Schedule, 'open_time', e.target.value)} disabled={!schedule[day as keyof Schedule].is_active} />
                        <input type="time" value={schedule[day as keyof Schedule].close_time} onChange={e => handleDayChange(day as keyof Schedule, 'close_time', e.target.value)} disabled={!schedule[day as keyof Schedule].is_active} />
                        <input type="number" min="1" value={schedule[day as keyof Schedule].slot_duration_minutes} onChange={e => handleDayChange(day as keyof Schedule, 'slot_duration_minutes', e.target.value)} disabled={!schedule[day as keyof Schedule].is_active} />
                        <input type="number" min="1" value={schedule[day as keyof Schedule].capacity_per_slot} onChange={e => handleDayChange(day as keyof Schedule, 'capacity_per_slot', e.target.value)} disabled={!schedule[day as keyof Schedule].is_active} />
                    </div>
                ))}
                <div className={commonStyles.actionButtons} style={{marginTop: '2rem'}}><button type="submit" className={commonStyles.buttonPrimary} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Horario'}</button><button type="button" className={commonStyles.buttonSecondary} onClick={onCancel}>Cancelar</button></div>
            </form>
        </div>
    );
};


// --- Componente principal de la página (LÓGICA DE IMAGEN ACTUALIZADA) ---
export const OwnerDashboardPage: React.FC<{navigateTo: (page: ExtendedPage, businessId?: string) => void;}> = ({ navigateTo }) => {
    // ... (el resto del componente no necesita cambios)
    const { token } = useAuth();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Business | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [managingScheduleFor, setManagingScheduleFor] = useState<Business | null>(null);

    const fetchBusinesses = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/businesses/my-businesses`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setBusinesses(data);
            } else {
                setBusinesses([]);
            }
        } catch (error) {
            console.error("Error al cargar las empresas", error);
            setBusinesses([]);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchBusinesses();
    }, [fetchBusinesses]);

    const handleLaunch = async (businessId: string | undefined) => {
        if (!businessId) return;
        if (window.confirm("¿Estás seguro de que quieres publicar este negocio? Te recomendamos revisar y completar todos los detalles antes de publicarlo.")) {
            try {
                const res = await fetch(`${API_BASE_URL}/businesses/my-business/${businessId}/publish`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) { throw new Error((await res.json()).detail || "No se pudo publicar el servicio."); }
                fetchBusinesses(); 
            } catch (err: any) { alert(`Error al publicar el servicio: ${err.message}`); }
        }
    };
    
    const handleFormClose = () => {
        setIsEditing(null);
        setIsRegistering(false);
        setManagingScheduleFor(null);
        fetchBusinesses();
    }

    if (isLoading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando tu panel...</div>;
    if (isRegistering) return <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}><BusinessRegistrationForm onSave={handleFormClose} onCancel={() => setIsRegistering(false)} /></div>;
    if (isEditing) return <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}><BusinessEditForm business={isEditing} onSave={handleFormClose} onCancel={() => setIsEditing(null)} /></div>;
    if (managingScheduleFor) return <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}><ManageScheduleForm business={managingScheduleFor} onSave={handleFormClose} onCancel={() => setManagingScheduleFor(null)} /></div>;
    
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0, fontSize: '2.25rem' }}>Mis Negocios</h1>
                <button className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} style={{width: 'auto'}} onClick={() => setIsRegistering(true)}>+ Registrar Nuevo Negocio</button>
            </div>

            {businesses.length === 0 ? (
                <div className={`${commonStyles.alert}`} style={{backgroundColor: '#eef2ff', color: '#4338ca', textAlign: 'center', padding: '2rem'}}>
                    <p>Aún no tienes negocios registrados.</p>
                    <p>Cuando un administrador apruebe tu solicitud, tu negocio aparecerá aquí en modo "Borrador".</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {businesses.map(business => {
                        const businessId = business.id || (business as any)._id;
                        return (
                            <div key={businessId} style={{backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flexGrow: 1 }}>
                                        <h2 style={{marginTop: 0, marginBottom: '0.5rem'}}>{business.name}</h2>
                                        <p style={{margin: '0 0 0.5rem', color: '#6b7280', fontSize: '0.9rem'}}>{business.address}</p>
                                        <p style={{margin: 0, padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block', backgroundColor: business.status === 'published' ? '#dcfce7' : '#fffbeb', color: business.status === 'published' ? '#166534' : '#b45309'}}>{business.status === 'published' ? 'PUBLICADO' : 'BORRADOR'}</p>
                                    </div>
                                    <img 
                                        // --- LÓGICA DE IMAGEN CORREGIDA ---
                                        src={business.logo_url || business.photos?.[0] || 'https://placehold.co/100x100/e2e8f0/4a5568?text=Sin+Logo'} 
                                        alt="Logo" 
                                        style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb'}}
                                    />
                                </div>
                                <p style={{margin: 0, color: '#374151', borderTop: '1px solid #f3f4f6', paddingTop: '1rem'}}>{business.description}</p>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: '1rem', justifyContent: 'flex-end' }}>
                                    <button className={commonStyles.buttonSecondary} style={{width: 'auto'}} onClick={() => setIsEditing(business)}>✏️ Editar</button>
                                    <button className={commonStyles.buttonSecondary} style={{width: 'auto'}} onClick={() => setManagingScheduleFor(business)}>🗓️ Horario</button>
                                    <button className={commonStyles.buttonSecondary} style={{width: 'auto'}} onClick={() => navigateTo('ownerAppointments', businessId)}>Ver Reservas</button>
                                    {business.status === 'draft' && (<button className={commonStyles.buttonPrimary} style={{width: 'auto'}} onClick={() => handleLaunch(businessId)}>🚀 Publicar</button>)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};