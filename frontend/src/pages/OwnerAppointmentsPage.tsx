// src/pages/OwnerAppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Appointment, UserResponse } from '@/types';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Stack,
    Divider,
} from '@mui/material';

interface OwnerAppointmentsPageProps {
    businessId: string;
}

export const OwnerAppointmentsPage: React.FC<OwnerAppointmentsPageProps> = ({ businessId }) => {
    const { token, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [users, setUsers] = useState<Record<string, UserResponse>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointmentsAndUsers = async () => {
            if (!token) {
                setError("No estás autenticado.");
                setIsLoading(false);
                return;
            }
            try {
                // 1. Obtener las citas del negocio
                const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/business/${businessId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!appointmentsResponse.ok) {
                    if (appointmentsResponse.status === 401) logout();
                    throw new Error("No se pudieron cargar las citas de este negocio.");
                }
                const appointmentsData: Appointment[] = await appointmentsResponse.json();
                setAppointments(appointmentsData);

                // 2. Obtener los datos de usuario para cada cita
                const usersMap: Record<string, UserResponse> = {};
                // Usamos Promise.all para hacer las peticiones de usuario en paralelo y mejorar el rendimiento
                const userPromises = appointmentsData.map(app => {
                    const userId = app.user_id;
                    if (userId && !usersMap[userId]) {
                        return fetch(`${API_BASE_URL}/users/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                        }).then(res => res.ok ? res.json() : null);
                    }
                    return Promise.resolve(null);
                });

                const usersData = await Promise.all(userPromises);
                usersData.forEach(userData => {
                    if (userData) {
                        usersMap[userData.id] = userData;
                    }
                });
                setUsers(usersMap);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointmentsAndUsers();
    }, [token, logout, businessId]);

    if (isLoading) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

    return (
        <Box>
            <Typography variant="h4" component="h1" fontWeight="600" gutterBottom>
                Reservas del Negocio
            </Typography>
            <Divider sx={{ mb: 4 }} />
            
            {appointments.length > 0 ? (
                <Stack spacing={3}>
                    {appointments.map(app => {
                        const user = users[app.user_id];
                        const appointmentDate = new Date(app.appointment_time);
                        return (
                            <Paper 
                                key={app.id || (app as any)._id} 
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
                                    <Typography variant="h6" fontWeight="600">{user?.full_name || 'Usuario Desconocido'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{user?.email || 'Email no disponible'}</Typography>
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
                    })}
                </Stack>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography color="text.secondary">Este negocio aún no tiene ninguna cita reservada.</Typography>
                </Paper>
            )}
        </Box>
    );
};