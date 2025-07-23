import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Business, Category } from '@/types';
import commonStyles from '@/styles/Common.module.css';

// --- Componente para registrar la empresa si no existe ---
const BusinessRegistrationForm: React.FC<{ onBusinessRegistered: () => void }> = ({ onBusinessRegistered }) => {
    const { token, user } = useAuth();
    const [formData, setFormData] = useState({ name: '', description: '', address: '', logo_url: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (!user) {
            setError("Error de autenticación, por favor inicia sesión de nuevo.");
            setIsLoading(false);
            return;
        }

        try {
            // El endpoint espera un BusinessBase, que no incluye owner_id
            const businessData = {
                name: formData.name,
                description: formData.description,
                address: formData.address,
                logo_url: formData.logo_url,
            };

            const response = await fetch(`${API_BASE_URL}/businesses/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(businessData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "No se pudo registrar la empresa.");
            }
            onBusinessRegistered();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={commonStyles.formContainer} style={{maxWidth: '600px'}}>
            <h2>Registra tu Empresa</h2>
            <p style={{textAlign: 'center', marginBottom: '1.5rem'}}>Completa los datos de tu negocio para empezar a ofrecer tus servicios.</p>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className={commonStyles.formGroup}><label>Nombre de la Empresa</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className={commonStyles.formGroup}><label>Dirección</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required /></div>
                <div className={commonStyles.formGroup}><label>Descripción Corta del Negocio</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{minHeight: '100px', width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem'}} /></div>
                <div className={commonStyles.formGroup}><label>URL del Logo (Opcional)</label><input type="url" placeholder="https://ejemplo.com/logo.png" value={formData.logo_url} onChange={e => setFormData({...formData, logo_url: e.target.value})} /></div>
                <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>
                    {isLoading ? 'Registrando...' : 'Registrar Empresa'}
                </button>
            </form>
        </div>
    );
};


// --- Componente para el formulario de edición del negocio ---
const BusinessEditForm: React.FC<{ business: Business; onSave: () => void; onCancel: () => void; }> = ({ business, onSave, onCancel }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState<Business>(business);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/categories/`);
                if (res.ok) {
                    const data = await res.json();
                    setAllCategories(data);
                }
            } catch (err) {
                console.error("No se pudieron cargar las categorías.");
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryChange = (categoryName: string) => {
        const currentCategories = formData.categories || [];
        const newCategories = currentCategories.includes(categoryName)
            ? currentCategories.filter(c => c !== categoryName)
            : [...currentCategories, categoryName];
        setFormData({ ...formData, categories: newCategories });
    };

    const handleAddPhoto = () => {
        if (newPhotoUrl && !formData.photos.includes(newPhotoUrl)) {
            setFormData({ ...formData, photos: [...formData.photos, newPhotoUrl] });
            setNewPhotoUrl('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // Solo enviamos los campos que se pueden actualizar
            const updateData = {
                name: formData.name,
                description: formData.description,
                address: formData.address,
                logo_url: formData.logo_url,
                photos: formData.photos,
                categories: formData.categories
            };
            const response = await fetch(`${API_BASE_URL}/businesses/my-business`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) throw new Error("No se pudieron guardar los cambios.");
            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={commonStyles.formContainer} style={{maxWidth: '700px'}}>
            <h2>Editar Negocio</h2>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className={commonStyles.formGroup}><label>Nombre de la Empresa</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className={commonStyles.formGroup}><label>Dirección</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required /></div>
                <div className={commonStyles.formGroup}><label>Descripción</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{minHeight: '100px', width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem'}} /></div>

                <div className={commonStyles.formGroup}>
                    <label>Categorías</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
                        {allCategories.length > 0 ? allCategories.map(cat => (
                            <label key={cat.id || cat._id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.categories.includes(cat.name)} onChange={() => handleCategoryChange(cat.name)} />
                                {cat.name}
                            </label>
                        )) : <p>No hay categorías disponibles.</p>}
                    </div>
                </div>
                
                <div className={commonStyles.formGroup}>
                    <label>Fotos del Negocio</label>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <input type="url" placeholder="https://ejemplo.com/foto.jpg" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} style={{flexGrow: 1}}/>
                        <button type="button" className={commonStyles.buttonSecondary} onClick={handleAddPhoto} style={{width: 'auto'}}>Añadir</button>
                    </div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                        {formData.photos.map((photo, index) => <img key={index} src={photo} alt={`Foto ${index + 1}`} style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}}/>)}
                    </div>
                </div>

                <div className={commonStyles.actionButtons}>
                    <button type="submit" className={commonStyles.buttonPrimary} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                    <button type="button" className={commonStyles.buttonSecondary} onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};


// --- Componente para solicitar una nueva categoría ---
const CategoryRequestForm: React.FC = () => {
    const { token, user } = useAuth();
    const [formData, setFormData] = useState({ category_name: '', reason: '', evidence_url: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        if (!user) {
            setError("Error de autenticación.");
            setIsLoading(false);
            return;
        }

        try {
            const requestData = {
                category_name: formData.category_name,
                reason: formData.reason,
                evidence_url: formData.evidence_url,
            };
            const response = await fetch(`${API_BASE_URL}/category-requests/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(requestData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "No se pudo enviar la solicitud.");
            }
            setSuccess("¡Solicitud enviada con éxito! El administrador la revisará pronto.");
            setFormData({ category_name: '', reason: '', evidence_url: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={commonStyles.formContainer} style={{marginTop: '2rem', maxWidth: '700px'}}>
            <h2>Solicitar Nueva Categoría</h2>
            <p style={{textAlign: 'center', marginBottom: '1.5rem'}}>Si tu servicio no encaja en las categorías existentes, puedes proponer una nueva.</p>
            {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
            {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
            <form onSubmit={handleSubmit}>
                <div className={commonStyles.formGroup}><label>Nombre de la Categoría Propuesta</label><input type="text" value={formData.category_name} onChange={e => setFormData({...formData, category_name: e.target.value})} required /></div>
                <div className={commonStyles.formGroup}><label>Motivo y Descripción del Servicio</label><textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required style={{minHeight: '100px', width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem'}} /></div>
                <div className={commonStyles.formGroup}><label>URL de Evidencia (Opcional)</label><input type="url" placeholder="https://ejemplo.com/evidencia.pdf" value={formData.evidence_url} onChange={e => setFormData({...formData, evidence_url: e.target.value})} /></div>
                <button type="submit" className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} disabled={isLoading}>
                    {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
            </form>
        </div>
    );
};


// --- Componente principal de la página ---
export const OwnerDashboardPage: React.FC = () => {
    const { token } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchBusiness = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/businesses/my-business`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBusiness(data);
            } else if (response.status === 404) {
                setBusiness(null);
            } else {
                throw new Error("No se pudo verificar la información de tu empresa.");
            }
        } catch (error) {
            console.error("Error al cargar la empresa", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchBusiness();
        }
    }, [token]);

    const handleLaunch = async () => {
        if (!window.confirm("¿Estás seguro de que quieres lanzar tu negocio? Será visible para todos los usuarios y ya no podrás ocultarlo.")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/businesses/my-business/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("No se pudo lanzar el servicio.");
            fetchBusiness(); // Recargar datos para mostrar el nuevo estado
        } catch (err) {
            console.error(err);
        }
    };
    
    if (isLoading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando...</div>;

    // Si no hay negocio, muestra el formulario de registro
    if (!business) {
        return (
             <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'}}>
                <BusinessRegistrationForm onBusinessRegistered={fetchBusiness} />
            </div>
        );
    }

    // Si está en modo edición, muestra el formulario de edición
    if (isEditing) {
        return (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'}}>
                <BusinessEditForm business={business} onSave={() => { setIsEditing(false); fetchBusiness(); }} onCancel={() => setIsEditing(false)} />
            </div>
        );
    }

    // Vista principal del panel de dueño
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{width: '100%'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2.25rem' }}>Panel de Dueño</h1>
                    {business.status === 'draft' && (
                        <button className={commonStyles.buttonPrimary} onClick={handleLaunch} style={{width: 'auto'}}>
                            🚀 Lanzar Servicio
                        </button>
                    )}
                </div>
                
                {business.status === 'draft' && (
                    <div className={commonStyles.alert} style={{backgroundColor: '#fffbeb', color: '#b45309', marginBottom: '1.5rem'}}>
                        Tu negocio está en modo **borrador**. Completa los detalles y lánzalo para que sea visible para todos.
                    </div>
                )}
                {business.status === 'published' && (
                    <div className={commonStyles.alertSuccess}>
                        ¡Felicidades! Tu negocio está **publicado** y es visible para todos los usuarios.
                    </div>
                )}
                
                <div style={{backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ marginTop: 0 }}>{business.name}</h2>
                            <p>{business.address}</p>
                        </div>
                        <button className={commonStyles.buttonSecondary} onClick={() => setIsEditing(true)} style={{width: 'auto'}}>Editar</button>
                    </div>
                    <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '1rem 0'}}/>
                    <p><strong>Descripción:</strong> {business.description}</p>
                    <p><strong>Categorías:</strong> {business.categories.join(', ') || 'Ninguna seleccionada'}</p>
                    <div>
                        <strong>Fotos:</strong>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                            {business.photos.length > 0 ? business.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`Foto ${index + 1}`} style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}/>
                            )) : <p style={{margin: '0.5rem 0 0 0', color: '#6b7280'}}>No hay fotos añadidas.</p>}
                        </div>
                    </div>
                </div>
            </div>
            
            <CategoryRequestForm />
        </div>
    );
};