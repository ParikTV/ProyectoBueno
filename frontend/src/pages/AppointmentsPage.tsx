// src/pages/AppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Appointment, Business } from '@/types';

// --- MUI Component Imports ---
import { Box, Typography, Paper, CircularProgress, Alert, Stack, Divider } from '@mui/material';

// --- Componente AppointmentCard (Reestilizado con MUI) ---
const AppointmentCard: React.FC<{ appointment: Appointment, business?: Business }> = ({ appointment, business }) => {
    const appointmentDate = new Date(appointment.appointment_time);
    const displayCategories = business?.categories.join(', ') || 'N/A';

    return (
        <Paper 
            elevation={2} 
            sx={{
                p: { xs: 2, md: 3 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                borderRadius: 3
            }}
        >
            <Box>
                <Typography variant="h6" fontWeight="600">{business?.name || 'Negocio Desconocido'}</Typography>
                <Typography variant="body2" color="text.secondary">{business?.address || 'Ubicación no disponible'}</Typography>
                <Typography variant="caption" color="text.secondary">Categoría: {displayCategories}</Typography>
            </Box>
            <Box sx={{ 
                bgcolor: 'action.hover', 
                p: 2, 
                borderRadius: 2, 
                textAlign: { xs: 'left', sm: 'center' },
                width: { xs: '100%', sm: 'auto' },
                flexShrink: 0
            }}>
                <Typography fontWeight="bold">
                    {appointmentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
                <Typography color="primary" fontWeight="bold">
                    {appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
            </Box>
        </Paper>
    );
};

// --- Página Principal de Mis Citas (Reestilizada) ---
export const AppointmentsPage: React.FC = () => {
    const { token, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [businesses, setBusinesses] = useState<Record<string, Business>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointmentsAndBusinesses = async () => {
            if (!token) {
                setError("No estás autenticado.");
                setIsLoading(false);
                return;
            }
            try {
                const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!appointmentsResponse.ok) {
                    if (appointmentsResponse.status === 401) logout();
                    throw new Error("No se pudieron cargar tus citas.");
                }
                const appointmentsData: Appointment[] = await appointmentsResponse.json();
                setAppointments(appointmentsData);

                const businessesResponse = await fetch(`${API_BASE_URL}/businesses/`);
                if (!businessesResponse.ok) throw new Error("No se pudieron cargar los detalles de los negocios.");
                
                const businessesData: Business[] = await businessesResponse.json();
                
                const businessesMap = businessesData.reduce((acc, business) => {
                    const businessKey = business.id || business._id;
                    if (businessKey) {
                        acc[businessKey] = business;
                    }
                    return acc;
                }, {} as Record<string, Business>);
                setBusinesses(businessesMap);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointmentsAndBusinesses();
    }, [token, logout]);

    if (isLoading) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

    return (
        <Box>
            <Typography variant="h4" component="h1" fontWeight="600" gutterBottom>Mis Citas</Typography>
            <Divider sx={{ mb: 4 }} />
            
            {appointments.length > 0 ? (
                <Stack spacing={3}>
                    {appointments.map(app => {
                        const businessToShow = businesses[app.business_id];
                        return (
                            <AppointmentCard key={app.id || (app as any)._id} appointment={app} business={businessToShow} />
                        );
                    })}
                </Stack>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Aún no tienes ninguna cita reservada.</Typography>
                </Paper>
            )}
        </Box>
    );
};