// src/pages/OwnerDashboardPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Business, Category, Schedule, ScheduleDay } from '@/types';
import { LocationPicker } from '@/components/LocationPicker';
import { ExtendedPage } from '@/App';
import { StarIcon } from '@/components/Icons';

// --- MUI Component Imports ---
import {
    Box, Typography, Button, Paper, TextField, CircularProgress, Alert, Stack, Divider,
    Select, MenuItem, FormControl, InputLabel, IconButton, Chip, Checkbox, FormControlLabel, Switch
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublishIcon from '@mui/icons-material/Publish';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

// --- Componente para registrar un NUEVO negocio ---
const BusinessRegistrationForm: React.FC<{ onSave: () => void; onCancel: () => void; }> = ({ onSave, onCancel }) => {
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
                throw new Error(errorData.detail || "No se pudo registrar la empresa.");
            }
            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: '700px', mx: 'auto', my: 4 }}>
            <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>
                Registra un Nuevo Negocio
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Completa los datos de tu nuevo negocio para empezar.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <TextField label="Nombre del Negocio" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required fullWidth />
                    <Box>
                        <Typography fontWeight="600" gutterBottom>Dirección del Negocio</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{mb: 1.5}}>Haz clic en el mapa para seleccionar la ubicación.</Typography>
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                        <TextField label="Dirección Seleccionada" value={formData.address} InputProps={{ readOnly: true }} fullWidth sx={{mt: 2}} />
                    </Box>
                    <TextField label="Descripción Corta" value={formData.description} multiline rows={4} onChange={e => setFormData({...formData, description: e.target.value})} required fullWidth />
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={onCancel}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={isLoading}>
                            {isLoading ? 'Registrando...' : 'Registrar Negocio'}
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Paper>
    );
};


// --- Componente para el formulario de EDICIÓN del negocio ---
const BusinessEditForm: React.FC<{ business: Business; onSave: () => void; onCancel: () => void; }> = ({ business, onSave, onCancel }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState<Business>(business);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);

    const allBusinessPhotos = Array.from(new Set([...(formData.logo_url ? [formData.logo_url] : []), ...formData.photos]));

    const handleSetAsMain = (photoUrl: string) => {
        setFormData(prev => ({ ...prev, logo_url: photoUrl, photos: allBusinessPhotos.filter(p => p !== photoUrl) }));
    };

    const handleDeletePhoto = (photoUrl: string) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta foto?")) return;
        setFormData(prev => ({
            ...prev,
            logo_url: prev.logo_url === photoUrl ? undefined : prev.logo_url,
            photos: prev.photos.filter(p => p !== photoUrl)
        }));
    };

    const handleAddPhoto = () => {
        if (newPhotoUrl && !allBusinessPhotos.includes(newPhotoUrl)) {
            if (!formData.logo_url) {
                setFormData({ ...formData, logo_url: newPhotoUrl });
            } else {
                setFormData({ ...formData, photos: [...formData.photos, newPhotoUrl] });
            }
            setNewPhotoUrl('');
        }
    };

    const handleLocationSelect = (address: string) => setFormData(prev => ({ ...prev, address }));

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
        const newCategories = currentCategories.includes(categoryName)
            ? currentCategories.filter(c => c !== categoryName)
            : [...currentCategories, categoryName];
        setFormData({ ...formData, categories: newCategories });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setIsLoading(true);
        try {
            const businessId = business.id || (business as any)._id;
            if (!businessId) throw new Error("ID del negocio no encontrado.");
            
            const updateData = { 
                name: formData.name, description: formData.description, address: formData.address, 
                photos: formData.photos, categories: formData.categories, logo_url: formData.logo_url
            };

            const response = await fetch(`${API_BASE_URL}/businesses/my-business/${businessId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.detail || "No se pudieron guardar los cambios.");
            }
            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: '800px', mx: 'auto', my: 4 }}>
            <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>Editar {business.name}</Typography>
            {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
                <Stack spacing={3} mt={3}>
                    <TextField label="Nombre de la Empresa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required fullWidth />
                    <Box>
                        <Typography fontWeight="600" gutterBottom>Dirección</Typography>
                        <LocationPicker onLocationSelect={handleLocationSelect} initialAddress={formData.address} />
                        <TextField label="Dirección Seleccionada" value={formData.address} InputProps={{readOnly: true}} fullWidth sx={{mt: 2}} />
                    </Box>
                    <TextField label="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required multiline rows={4} fullWidth />
                    <Box>
                        <Typography fontWeight="600" gutterBottom>Categorías</Typography>
                        <Paper variant="outlined" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
                            {allCategories.map(cat => (
                                <FormControlLabel
                                    key={cat.id || (cat as any)._id}
                                    control={<Checkbox checked={formData.categories.includes(cat.name)} onChange={() => handleCategoryChange(cat.name)} />}
                                    label={cat.name}
                                />
                            ))}
                        </Paper>
                    </Box>
                    <Box>
                        <Typography fontWeight="600" gutterBottom>Fotos del Negocio</Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField label="Añadir URL de imagen" type="url" placeholder="https://ejemplo.com/foto.jpg" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} fullWidth size="small" />
                            <Button variant="outlined" onClick={handleAddPhoto}>Añadir</Button>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 2, mt: 2 }}>
                            {allBusinessPhotos.map((photo) => (
                                <Box key={photo} onMouseEnter={() => setHoveredPhoto(photo)} onMouseLeave={() => setHoveredPhoto(null)} sx={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 2, overflow: 'hidden', border: photo === formData.logo_url ? '3px solid' : '1px solid', borderColor: photo === formData.logo_url ? 'primary.main' : 'divider' }}>
                                    <img src={photo} alt="Foto del negocio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {photo === formData.logo_url && <StarIcon sx={{ position: 'absolute', top: 4, left: 4, color: 'yellow', bgcolor: 'rgba(0,0,0,0.4)', borderRadius: '50%', p: '2px' }} />}
                                    <Stack direction="row" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', gap: 0.5, opacity: hoveredPhoto === photo ? 1 : 0, transition: 'opacity 0.2s' }}>
                                        {photo !== formData.logo_url && <IconButton title="Poner como principal" sx={{ color: 'white' }} onClick={() => handleSetAsMain(photo)}><StarIcon /></IconButton>}
                                        <IconButton title="Eliminar foto" sx={{ color: '#ffb2b2' }} onClick={() => handleDeletePhoto(photo)}><DeleteIcon /></IconButton>
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={onCancel}>Cancelar</Button>
                        <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
                    </Stack>
                </Stack>
            </form>
        </Paper>
    );
};

// --- Componente de Horario (IMPLEMENTACIÓN COMPLETA Y REESTILIZADA) ---
const ManageScheduleForm: React.FC<{ business: Business; onSave: () => void; onCancel: () => void; }> = ({ business, onSave, onCancel }) => {
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
        const finalValue = numericFields.includes(field) ? parseInt(value, 10) || 1 : value;
        
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
    
    const dayNames: { [key in keyof Schedule]: string } = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };

    return (
        <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: '900px', mx: 'auto', my: 4 }}>
            <Typography variant="h5" component="h2" fontWeight="600">Gestionar Horario de {business.name}</Typography>
            <Typography color="text.secondary" sx={{ my: 2 }}>Define los días y horas que tu negocio está abierto para recibir citas.</Typography>
            {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
                <Stack spacing={2} divider={<Divider />}>
                    {/* --- Encabezados --- */}
                    <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 2, px: 2 }}>
                        <Typography variant="caption" color="text.secondary">Día</Typography>
                        <Typography variant="caption" color="text.secondary">Apertura</Typography>
                        <Typography variant="caption" color="text.secondary">Cierre</Typography>
                        <Typography variant="caption" color="text.secondary">Duración (min)</Typography>
                        <Typography variant="caption" color="text.secondary">Cupos</Typography>
                    </Box>
                    {/* --- Filas de Días --- */}
                    {Object.keys(dayNames).map((day) => {
                        const dayKey = day as keyof Schedule;
                        const daySchedule = schedule[dayKey];
                        const isActive = daySchedule.is_active;
                        return (
                            <Box 
                                key={day} 
                                sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: { xs: '1fr 1fr', md: '2fr 1fr 1fr 1fr 1fr' }, 
                                    gap: 2, 
                                    alignItems: 'center',
                                    py: 1
                                }}
                            >
                                <FormControlLabel
                                    sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}
                                    control={
                                        <Switch
                                            checked={isActive}
                                            onChange={e => handleDayChange(dayKey, 'is_active', e.target.checked)}
                                        />
                                    }
                                    label={<Typography fontWeight="bold">{dayNames[dayKey]}</Typography>}
                                />
                                <TextField label="Apertura" type="time" disabled={!isActive} value={daySchedule.open_time} onChange={e => handleDayChange(dayKey, 'open_time', e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                                <TextField label="Cierre" type="time" disabled={!isActive} value={daySchedule.close_time} onChange={e => handleDayChange(dayKey, 'close_time', e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                                <TextField label="Duración (min)" type="number" disabled={!isActive} value={daySchedule.slot_duration_minutes} onChange={e => handleDayChange(dayKey, 'slot_duration_minutes', e.target.value)} size="small" />
                                <TextField label="Cupos" type="number" disabled={!isActive} value={daySchedule.capacity_per_slot} onChange={e => handleDayChange(dayKey, 'capacity_per_slot', e.target.value)} size="small" />
                            </Box>
                        )
                    })}
                </Stack>
                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                    <Button variant="outlined" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Horario'}</Button>
                </Stack>
            </form>
        </Paper>
    );
};

// --- Componente principal de la página ---
export const OwnerDashboardPage: React.FC<{navigateTo: (page: ExtendedPage, businessId?: string) => void;}> = ({ navigateTo }) => {
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
                setBusinesses(await response.json());
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

    useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

    const handleLaunch = async (businessId: string | undefined) => {
        if (!businessId || !window.confirm("¿Estás seguro de que quieres publicar este negocio? Te recomendamos revisar y completar todos los detalles antes de publicarlo.")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/businesses/my-business/${businessId}/publish`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) { throw new Error((await res.json()).detail || "No se pudo publicar."); }
            fetchBusinesses(); 
        } catch (err: any) { alert(`Error: ${err.message}`); }
    };
    
    const handleFormClose = () => {
        setIsEditing(null); setIsRegistering(false); setManagingScheduleFor(null);
        fetchBusinesses();
    }

    if (isLoading) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
    if (isRegistering) return <BusinessRegistrationForm onSave={handleFormClose} onCancel={() => setIsRegistering(false)} />;
    if (isEditing) return <BusinessEditForm business={isEditing} onSave={handleFormClose} onCancel={() => setIsEditing(null)} />;
    if (managingScheduleFor) return <ManageScheduleForm business={managingScheduleFor} onSave={handleFormClose} onCancel={handleFormClose} />;
    
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" component="h1" fontWeight="600">Mis Negocios</Typography>
                <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setIsRegistering(true)}>
                    Registrar Nuevo Negocio
                </Button>
            </Box>

            {businesses.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography variant="h6" gutterBottom>Aún no tienes negocios registrados.</Typography>
                    <Typography color="text.secondary">Cuando un administrador apruebe tu solicitud, tu negocio aparecerá aquí en modo "Borrador".</Typography>
                </Paper>
            ) : (
                <Stack spacing={3}>
                    {businesses.map(business => {
                        const businessId = business.id || (business as any)._id;
                        return (
                            <Paper key={businessId} elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                                <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems="center">
                                    <Box
                                        component="img"
                                        src={business.logo_url || business.photos?.[0] || 'https://placehold.co/100x100?text=Sin+Logo'} 
                                        alt="Logo" 
                                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                                    />
                                    <Box flexGrow={1}>
                                        <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                                            <Typography variant="h6" fontWeight="bold">{business.name}</Typography>
                                            <Chip 
                                                label={business.status === 'published' ? 'Publicado' : 'Borrador'}
                                                color={business.status === 'published' ? 'success' : 'warning'}
                                                size="small"
                                            />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">{business.address}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{business.description}</Typography>
                                    </Box>
                                    <Stack direction={{xs: 'row', sm: 'column'}} spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(business)}>Editar</Button>
                                        <Button size="small" variant="outlined" startIcon={<ScheduleIcon />} onClick={() => setManagingScheduleFor(business)}>Horario</Button>
                                        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => navigateTo('ownerAppointments', businessId)}>Reservas</Button>
                                        {business.status === 'draft' && (<Button size="small" variant="contained" startIcon={<PublishIcon />} onClick={() => handleLaunch(businessId)}>Publicar</Button>)}
                                    </Stack>
                                </Stack>
                            </Paper>
                        )
                    })}
                </Stack>
            )}
        </Box>
    );
};