// src/pages/AppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Appointment, Business } from '@/types';

// --- MUI Component Imports ---
import { Box, Typography, Paper, CircularProgress, Alert, Stack, Divider, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// --- Componente para mostrar el QR (Ahora carga la imagen de forma segura) ---
const QrModal: React.FC<{ appointmentId: string; onClose: () => void }> = ({ appointmentId, onClose }) => {
    const { token } = useAuth();
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQrCode = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/qr`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("No se pudo cargar el código QR.");
                
                const imageBlob = await response.blob();
                const imageUrl = URL.createObjectURL(imageBlob);
                setQrCodeUrl(imageUrl);
            } catch (err: any) {
                setError(err.message);
            }
        };
        fetchQrCode();

        // Limpieza: revocar la URL del objeto cuando el componente se desmonte
        return () => {
            if (qrCodeUrl) {
                URL.revokeObjectURL(qrCodeUrl);
            }
        };
    }, [appointmentId, token]); // Solo se ejecuta una vez

    return (
        <Dialog open={true} onClose={onClose}>
            <DialogTitle>Escanea para Validar tu Cita</DialogTitle>
            <DialogContent sx={{textAlign: 'center'}}>
                {error && <Alert severity="error">{error}</Alert>}
                {!qrCodeUrl && !error && <CircularProgress />}
                {qrCodeUrl && <img src={qrCodeUrl} alt="Código QR de la cita" style={{width: '256px', height: '256px'}} />}
                <Typography variant="caption" display="block" sx={{mt: 1}}>
                    El personal del negocio escaneará este código para confirmar tu reserva.
                </Typography>
            </DialogContent>
        </Dialog>
    );
};


// --- Tarjeta de Cita Actualizada con la nueva lógica ---
const AppointmentCard: React.FC<{ appointment: Appointment, business?: Business }> = ({ appointment, business }) => {
    const { token } = useAuth(); // Obtenemos el token para las descargas
    const appointmentDate = new Date(appointment.appointment_time);
    const [showQr, setShowQr] = useState(false);
    const appointmentId = appointment.id || (appointment as any)._id;

    const handleDownloadPdf = async () => {
        if (!token) {
            alert("Necesitas estar autenticado.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("No se pudo descargar el PDF.");

            const pdfBlob = await response.blob();
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            // Opcional: revocar la URL después de un tiempo para liberar memoria
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
        } catch (error) {
            console.error("Error al descargar el PDF:", error);
            alert("Ocurrió un error al descargar el comprobante.");
        }
    };

    return (
        <>
            {showQr && <QrModal appointmentId={appointmentId} onClose={() => setShowQr(false)} />}
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="h6" fontWeight="600">{business?.name || 'Negocio Desconocido'}</Typography>
                        <Typography variant="body2" color="text.secondary">{business?.address || 'Ubicación no disponible'}</Typography>
                        <Typography variant="caption" color="text.secondary">Categoría: {business?.categories.join(', ') || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, textAlign: { xs: 'left', sm: 'center' }, flexShrink: 0 }}>
                        <Typography fontWeight="bold">
                            {appointmentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Typography>
                        <Typography color="primary" variant="h6" fontWeight="bold">
                            {appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>Descargar PDF</Button>
                    <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={() => setShowQr(true)}>Ver QR</Button>
                </Stack>
            </Paper>
        </>
    );
};


// --- Página Principal (sin cambios en la lógica de fetch) ---
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
                    {appointments.map(app => (
                        <AppointmentCard key={app.id || (app as any)._id} appointment={app} business={businesses[app.business_id]} />
                    ))}
                </Stack>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Aún no tienes ninguna cita reservada.</Typography>
                </Paper>
            )}
        </Box>
    );
};