import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { UserResponse } from '@/types';
import { LocationPicker } from '@/components/LocationPicker';

import { Box, Typography, Button, Paper, TextField, CircularProgress, Alert, Stack, Divider, Avatar } from '@mui/material';
import { motion } from 'framer-motion';

export const ProfilePage: React.FC = () => {
  const { user: initialUser, token, fetchUser: fetchUserFromContext } = useAuth();
  
  const [profile, setProfile] = useState<UserResponse | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editFormData, setEditFormData] = useState({ 
    full_name: '', 
    phone_number: '',
    profile_picture_url: '' 
  });
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

        setEditFormData({ 
          full_name: data.full_name || '', 
          phone_number: data.phone_number || '',
          profile_picture_url: data.profile_picture_url || ''
        });
        if (data.role === 'dueño' && initialUser?.role === 'usuario') {
          await fetchUserFromContext();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
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
    setError(null); setSuccess(null); setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "No se pudo actualizar el perfil.");
      
      await fetchUserFromContext();
      
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
    setError(null); setSuccess(null); setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/request-owner`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerRequestData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "No se pudo enviar la solicitud.");
      
      await fetchUserFromContext();
      
      setSuccess("¡Solicitud para ser dueño enviada con éxito! El administrador la revisará pronto.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error && !profile) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  if (!profile) return <Box sx={{ p: 4 }}><Alert severity="warning">No se encontró el perfil.</Alert></Box>;

  const renderOwnerRequestSection = () => {
    if (profile.role === 'usuario' && !profile.owner_request) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Paper component="section" sx={{ p: { xs: 2, md: 4 }, mt: 4, width: '100%', maxWidth: '800px' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2, mb: 3 }}>
              <Typography variant="h5" component="h2" fontWeight="600">Conviértete en Socio de ServiBook</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Registra los detalles de tu negocio para empezar a recibir clientes.</Typography>
            </Box>
            <form onSubmit={handleOwnerRequestSubmit}>
              <Stack spacing={3}>
                <Stack direction={{xs: 'column', sm: 'row'}} spacing={3}>
                  <TextField label="Nombre del Negocio" name="business_name" value={ownerRequestData.business_name} onChange={handleOwnerRequestChange} required fullWidth />
                  <TextField label="URL del Logo o Foto Principal" type="url" name="logo_url" placeholder="https://ejemplo.com/logo.png" value={ownerRequestData.logo_url} onChange={handleOwnerRequestChange} fullWidth />
                </Stack>
                <TextField label="Describe tu Negocio" name="business_description" value={ownerRequestData.business_description} onChange={handleOwnerRequestChange} required multiline rows={4} fullWidth />
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography fontWeight="600" gutterBottom>Ubicación del Negocio</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{mb: 1.5}}>Busca y selecciona la dirección exacta en el mapa.</Typography>
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', p: 0.5 }}>
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                  </Box>
                  <TextField label="Dirección Seleccionada" value={ownerRequestData.address} InputProps={{ readOnly: true }} fullWidth sx={{ mt: 2 }} />
                </Box>
                <Button type="submit" variant="contained" size="large" disabled={isLoading} sx={{ alignSelf: 'flex-start', fontWeight: 'bold' }}>
                  {isLoading ? 'Enviando...' : 'Enviar Solicitud de Socio'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </motion.div>
      );
    }
    if (profile.owner_request) {
      const status = profile.owner_request.status;
      return (
        <Alert severity={status === 'approved' ? 'success' : status === 'pending' ? 'info' : 'error'} sx={{ mt: 4, maxWidth: '800px', width: '100%' }}>
          <strong>Estado de tu solicitud para ser Dueño:</strong> {status.toUpperCase()}
        </Alert>
      );
    }
    return null;
  };

  const ProfileDetail = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
      <Typography fontWeight="bold" sx={{ width: '180px', flexShrink: 0 }}>{label}:</Typography>
      <Typography color="text.secondary">{value}</Typography>
    </Box>
  );

  
  const joinedText = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-CR')
    : 'No disponible';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: '800px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="600">Mi Perfil</Typography>
          {!isEditing && (
            <Button variant="outlined" onClick={() => setIsEditing(true)}>Editar Perfil</Button>
          )}
        </Box>
        
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80 }}
                  src={editFormData.profile_picture_url || undefined}
                  alt={profile?.full_name || profile?.email || 'Usuario'}
                >
                  {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
                <TextField 
                  label="URL de la Foto de Perfil" 
                  name="profile_picture_url" 
                  value={editFormData.profile_picture_url} 
                  onChange={handleEditFormChange} 
                  fullWidth 
                  placeholder="https://ejemplo.com/imagen.png"
                />
              </Box>
              <Divider />
              <TextField label="Nombre Completo" name="full_name" value={editFormData.full_name} onChange={handleEditFormChange} fullWidth />
              <TextField label="Número de Teléfono" name="phone_number" value={editFormData.phone_number} onChange={handleEditFormChange} fullWidth />
              <TextField label="Correo Electrónico" value={profile.email} disabled fullWidth />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" onClick={() => setIsEditing(false)} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
              </Box>
            </Stack>
          </form>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 4 }}>
            <Avatar
              sx={{ width: 120, height: 120, mb: { xs: 2, sm: 0 } }}
              src={profile.profile_picture_url ?? undefined}
              alt={profile.full_name || profile.email || 'Usuario'}
            >
              {(profile.full_name || profile.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <ProfileDetail label="Rol" value={<Typography component="span" fontWeight="bold" color="primary.main" sx={{textTransform: 'capitalize'}}>{profile.role}</Typography>} />
              <ProfileDetail label="Nombre Completo" value={profile.full_name || 'No especificado'} />
              <ProfileDetail label="Teléfono" value={profile.phone_number || 'No especificado'} />
              <ProfileDetail label="Correo Electrónico" value={profile.email} />
              <ProfileDetail label="Miembro desde" value={joinedText} />
            </Box>
          </Box>
        )}
      </Paper>
      {renderOwnerRequestSection()}
    </Box>
  );
};
