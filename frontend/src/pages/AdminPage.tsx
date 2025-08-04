// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { UserResponse, CategoryRequest } from '@/types';
import { LocationDisplay } from '@/components/LocationDisplay';
import {
    Box, Typography, Button, Paper, TextField, Select, MenuItem,
    FormControl, InputLabel, Stack, Alert, CircularProgress, Divider, Dialog,
    DialogTitle, DialogContent, DialogActions, Link as MuiLink
} from '@mui/material';

// Interfaces for handling Mongo's _id
interface UserWithMongoId extends UserResponse { _id?: string; }
interface CategoryRequestWithMongoId extends CategoryRequest { _id?: string; }

// --- Business Creation Form Component ---
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
                const res = await fetch(`${API_BASE_URL}/users/admin/owners`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) setOwners(await res.json());
            } catch (error) { console.error("Failed to fetch owners"); }
        };
        fetchOwners();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setIsLoading(true);
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
            setName(''); setDescription(''); setAddress(''); setSelectedOwner('');
            onUpdate();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>Crear y Asignar Negocio</Typography>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2} mt={2}>
                    <FormControl fullWidth>
                        <InputLabel id="owner-select-label">Asignar a Dueño</InputLabel>
                        <Select labelId="owner-select-label" value={selectedOwner} label="Asignar a Dueño" onChange={e => setSelectedOwner(e.target.value)} required>
                            {owners.map(owner => <MenuItem key={owner.id || owner._id} value={owner.id || owner._id}>{owner.full_name || owner.email}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField label="Nombre del Negocio" value={name} onChange={e => setName(e.target.value)} required fullWidth />
                    <TextField label="Dirección" value={address} onChange={e => setAddress(e.target.value)} required fullWidth />
                    <TextField label="Descripción" value={description} multiline rows={3} onChange={e => setDescription(e.target.value)} fullWidth />
                    <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Negocio'}</Button>
                    {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
                </Stack>
            </form>
        </Paper>
    );
};

// --- Category Creation Form Component ---
const AdminCreateCategoryForm: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
    const { token } = useAuth();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setIsLoading(true);
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
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>Crear Nueva Categoría</Typography>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2} mt={2}>
                    <TextField label="Nombre de la Categoría" value={name} onChange={e => setName(e.target.value)} required fullWidth />
                    <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Categoría'}</Button>
                    {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
                </Stack>
            </form>
        </Paper>
    );
};

// --- Request Details Modal Component ---
const RequestDetailsModal: React.FC<{ user: UserWithMongoId; onClose: () => void; onApprove: (userId: string) => void; onReject: (userId: string) => void; }> = ({ user, onClose, onApprove, onReject }) => {
    if (!user.owner_request) return null;
    const { business_name, business_description, address, logo_url } = user.owner_request;
    const userId = user.id || user._id;

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="600">Detalles de la Solicitud</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Solicitante</Typography>
                        <Typography>{user.full_name || user.email}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Nombre del Negocio Propuesto</Typography>
                        <Typography>{business_name}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Dirección Propuesta</Typography>
                        <Typography>{address}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Descripción</Typography>
                        <Typography>{business_description}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" display="block" color="text.secondary" mb={1}>Ubicación en el Mapa</Typography>
                        <LocationDisplay address={address} />
                    </Box>
                    {logo_url && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">Logo/Imagen Propuesta</Typography>
                            <img src={logo_url} alt="Logo del negocio" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px' }} />
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Cerrar</Button>
                <Button color="error" variant="outlined" onClick={() => userId && onReject(userId)}>Rechazar</Button>
                <Button color="success" variant="contained" onClick={() => userId && onApprove(userId)}>Aprobar</Button>
            </DialogActions>
        </Dialog>
    );
};

// --- Main Admin Page Component ---
export const AdminPage: React.FC = () => {
    const { token, isAdmin, logout } = useAuth();
    
    const [ownerRequests, setOwnerRequests] = useState<UserWithMongoId[]>([]);
    const [categoryRequests, setCategoryRequests] = useState<CategoryRequestWithMongoId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [viewingRequest, setViewingRequest] = useState<UserWithMongoId | null>(null);

    const fetchAdminData = async () => {
        if (!token || !isAdmin) return;
        setIsLoading(true); setError(null);
        try {
            const [ownerReqRes, categoryReqRes] = await Promise.all([
                fetch(`${API_BASE_URL}/users/admin/owner-requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/users/admin/category-requests`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (ownerReqRes.status === 401 || categoryReqRes.status === 401) { logout(); throw new Error("Tu sesión ha expirado."); }
            if (ownerReqRes.ok) setOwnerRequests(await ownerReqRes.json());
            if (categoryReqRes.ok) setCategoryRequests(await categoryReqRes.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => { if (isAdmin) fetchAdminData(); }, [isAdmin, token, updateTrigger]);
    
    const handleAction = async (action: () => Promise<Response>, successMessage: string) => {
        setError(null); setSuccess(null);
        try {
            const response = await action();
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "La operación falló.");
            }
            setSuccess(successMessage);
            setUpdateTrigger(t => t + 1);
            setViewingRequest(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleApproveOwnerRequest = (userId: string | undefined) => {
        if (!userId) return;
        handleAction(() => fetch(`${API_BASE_URL}/users/admin/approve-owner/${userId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }), "¡Solicitud de dueño aprobada con éxito!");
    };
    const handleRejectOwnerRequest = (userId: string | undefined) => {
        if (!userId || !window.confirm("¿Estás seguro de que quieres rechazar esta solicitud?")) return;
        handleAction(() => fetch(`${API_BASE_URL}/users/admin/reject-owner/${userId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }), "Solicitud de dueño rechazada.");
    };
    const handleApproveCategoryRequest = (requestId: string | undefined) => {
        if (!requestId || !window.confirm("¿Aprobar y crear esta categoría?")) return;
        handleAction(() => fetch(`${API_BASE_URL}/users/admin/category-requests/${requestId}/approve`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }), "¡Categoría aprobada y creada con éxito!");
    };

    if (isLoading && !ownerRequests.length && !categoryRequests.length) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!isAdmin) return <Box sx={{ p: 4 }}><Alert severity="error">Acceso denegado.</Alert></Box>;
    
    return (
        <Box>
            {viewingRequest && ( <RequestDetailsModal user={viewingRequest} onClose={() => setViewingRequest(null)} onApprove={handleApproveOwnerRequest} onReject={handleRejectOwnerRequest} /> )}
            
            <Typography variant="h4" component="h1" fontWeight="600" gutterBottom>Panel de Administración</Typography>
            {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ my: 2 }}>{success}</Alert>}

            {/* FIX: Replaced Grid with a responsive Box layout using Flexbox */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -2, my: 2 }}>
                <Box sx={{ width: { xs: '100%', md: '50%' }, p: 2 }}>
                    <AdminCreateBusinessForm onUpdate={() => setUpdateTrigger(t => t + 1)} />
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' }, p: 2 }}>
                    <AdminCreateCategoryForm onUpdate={() => setUpdateTrigger(t => t + 1)} />
                </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box component="section" mb={4}>
                <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>Solicitudes Pendientes para ser Dueño</Typography>
                {ownerRequests.length === 0 ? (<Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No hay solicitudes pendientes.</Typography></Paper>) : (
                    <Stack spacing={2}>
                        {ownerRequests.map(user => (
                            <Paper key={user.id || user._id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography fontWeight="bold">{user.owner_request?.business_name || "Nombre no disponible"}</Typography>
                                    <Typography variant="body2" color="text.secondary">Usuario: {user.full_name || user.email}</Typography>
                                </Box>
                                <Button variant="outlined" size="small" onClick={() => setViewingRequest(user)}>Ver Detalles</Button>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>

            <Box component="section">
                <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>Solicitudes de Nuevas Categorías</Typography>
                {categoryRequests.length === 0 ? (<Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No hay solicitudes de categorías pendientes.</Typography></Paper>) : (
                    <Stack spacing={2}>
                        {categoryRequests.map(req => (
                            <Paper key={req.id || req._id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography fontWeight="bold">Categoría Propuesta: "{req.category_name}"</Typography>
                                    <Typography variant="body2" color="text.secondary">Motivo: {req.reason}</Typography>
                                    {req.evidence_url && <MuiLink href={req.evidence_url} target="_blank" rel="noopener noreferrer">Ver Evidencia</MuiLink>}
                                </Box>
                                <Button variant="contained" size="small" onClick={() => handleApproveCategoryRequest(req.id || req._id)}>Aprobar</Button>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
};