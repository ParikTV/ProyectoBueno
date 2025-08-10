// src/pages/BusinessDetailsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';
import { Business, Appointment } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';
import { LocationDisplay } from '@/components/LocationDisplay';
// --- MUI Component Imports ---
import { Box, Typography, Button, Paper, CircularProgress, Divider, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// --- NUEVO COMPONENTE: MODAL DE CONFIRMACIÓN Y ENVÍO ---
const ConfirmationDialog: React.FC<{
    appointment: Appointment;
    onClose: () => void;
    navigateTo: (page: ExtendedPage) => void;
}> = ({ appointment, onClose, navigateTo }) => {
    const { token, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const appointmentId = appointment.id || (appointment as any)._id;

    const handleSendEmail = async () => {
        if (!token || !appointmentId) return;
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/send-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("No se pudo enviar el correo.");
            setSuccess(`Comprobante enviado a ${user?.email}.`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onClose={onClose}>
            <DialogTitle fontWeight="bold">¡Reserva Confirmada!</DialogTitle>
            <DialogContent>
                <Typography>Tu cita ha sido agendada con éxito.</Typography>
                <Typography color="text.secondary" sx={{mt: 1}}>
                    Puedes ver y gestionar todas tus citas, además de descargar los comprobantes en PDF, desde la sección "Mis Citas".
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography>¿Deseas recibir el comprobante de esta cita en tu correo electrónico ({user?.email})?</Typography>
                {error && <Alert severity="error" sx={{mt: 1}}>{error}</Alert>}
                {success && <Alert severity="success" sx={{mt: 1}}>{success}</Alert>}
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button onClick={() => navigateTo('appointments')}>Ir a Mis Citas</Button>
                <Box>
                    <Button onClick={onClose} disabled={!!success}>No, gracias</Button>
                    <Button variant="contained" onClick={handleSendEmail} disabled={isLoading || !!success}>
                        {isLoading ? 'Enviando...' : 'Enviar Correo'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

// --- Booking Modal (Modificado para mostrar el nuevo diálogo) ---
const BookingModal: React.FC<{ 
    business: Business; 
    onClose: () => void; 
    onBookingSuccess: (appointment: Appointment) => void; 
}> = ({ business, onClose, onBookingSuccess }) => {
    const { token } = useAuth();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedDate || !business.id) return;
            setIsLoadingSlots(true);
            setSelectedSlot(null);
            setError('');
            try {
                const res = await fetch(`${API_BASE_URL}/businesses/${business.id}/available-slots?date=${selectedDate}`);
                if (!res.ok) throw new Error("No se pudo cargar la disponibilidad para este día.");
                setAvailableSlots(await res.json());
            } catch (err: any) {
                setAvailableSlots([]);
                setError(err.message);
            } finally {
                setIsLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, business.id]);

    const handleBooking = async () => {
        if (!selectedSlot) {
            setError("Por favor, selecciona una hora.");
            return;
        }
        setIsLoading(true); setError('');
        try {
            const appointmentTime = `${selectedDate}T${selectedSlot}:00`;
            const res = await fetch(`${API_BASE_URL}/appointments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ business_id: business.id, appointment_time: appointmentTime })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "No se pudo crear la cita.");
            }
            const responseData = await res.json();
            onBookingSuccess(responseData); // Pasamos la nueva cita al componente padre
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} PaperProps={{onClick: e => e.stopPropagation()}}>
            <DialogTitle>Reservar en {business.name}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{my: 1}}>{error}</Alert>}
                <Typography fontWeight="bold" mt={1}>1. Elige una fecha</Typography>
                <TextField type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} fullWidth sx={{ mt: 1 }} />
                <Typography fontWeight="bold" mt={2}>2. Elige una hora disponible</Typography>
                {isLoadingSlots ? <CircularProgress sx={{ my: 2 }} /> : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1, my: 2, maxHeight: '200px', overflowY: 'auto' }}>
                        {availableSlots.length > 0 ? availableSlots.map(slot => (
                            <Button key={slot} variant={selectedSlot === slot ? 'contained' : 'outlined'} onClick={() => setSelectedSlot(slot)}>
                                {slot}
                            </Button>
                        )) : <Typography>No hay horarios disponibles.</Typography>}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{p: 2}}>
                <Button onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button variant="contained" onClick={handleBooking} disabled={!selectedSlot || isLoading}>
                    {isLoading ? 'Confirmando...' : 'Confirmar Cita'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// --- Página de Detalles del Negocio (Modificada para gestionar los modales) ---
interface BusinessDetailsPageProps { 
    businessId: string; 
    navigateTo: (page: ExtendedPage) => void; 
}

export const BusinessDetailsPage: React.FC<BusinessDetailsPageProps> = ({ businessId, navigateTo }) => {
    const { token } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    // NUEVO ESTADO: Almacena la cita recién creada para pasarla al diálogo de confirmación.
    const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const fetchDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const businessRes = await fetch(`${API_BASE_URL}/businesses/${businessId}`);
            if (!businessRes.ok) throw new Error("Negocio no encontrado");
            setBusiness(await businessRes.json());
        } catch (error) {
            console.error("Error al cargar detalles:", error);
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    useEffect(() => { fetchDetails(); }, [fetchDetails]);
    
    // Función que se ejecuta cuando la reserva es exitosa
    const handleBookingSuccess = (newAppointment: Appointment) => {
        setShowBookingModal(false); // Cierra el modal de reserva
        setConfirmedAppointment(newAppointment); // Abre el modal de confirmación
    };

    const handleCloseConfirmation = () => {
        setConfirmedAppointment(null);
    };

    // (El resto del componente, como allImages, goToPrevious, etc., no cambia)

    const allImages = React.useMemo(() => {
        if (!business) return [];
        return Array.from(new Set([
            ...(business.logo_url ? [business.logo_url] : []),
            ...business.photos
        ]));
    }, [business]);

    const goToPrevious = () => setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
    const goToNext = () => setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));


    if (isLoading) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
    if (!business) return <Box sx={{ textAlign: 'center', p: 4 }}><Typography>Negocio no encontrado.</Typography></Box>;
    
    const canBook = business.status === 'published' && !!business.schedule;
    
    return (
        <Box>
            {showBookingModal && (
                <BookingModal 
                    business={business} 
                    onClose={() => setShowBookingModal(false)} 
                    onBookingSuccess={handleBookingSuccess} 
                />
            )}

            {/* Renderiza el nuevo diálogo de confirmación si hay una cita confirmada */}
            {confirmedAppointment && (
                <ConfirmationDialog
                    appointment={confirmedAppointment}
                    onClose={handleCloseConfirmation}
                    navigateTo={navigateTo}
                />
            )}
            
            <Paper elevation={4} sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '3fr 4fr' },
                gap: { xs: 3, md: 4 },
                p: { xs: 2, md: 4 },
                borderRadius: 4
            }}>
                {/* --- Image Carousel Section (Sin cambios) --- */}
                <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, md: 450 }, borderRadius: 2, overflow: 'hidden' }}>
                    {allImages.length > 1 && (
                        <>
                            <IconButton onClick={goToPrevious} sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                                <ArrowBackIosNewIcon />
                            </IconButton>
                            <IconButton onClick={goToNext} sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                                <ArrowForwardIosIcon />
                            </IconButton>
                        </>
                    )}
                    <img 
                        src={allImages[currentImageIndex] || 'https://placehold.co/600x400?text=Sin+Imagen'} 
                        alt={business.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </Box>

                {/* --- Info Section (Sin cambios) --- */}
                <Box>
                    <Typography color="text.secondary" fontWeight="bold" textTransform="uppercase">
                        {business.categories.join(', ') || 'Sin Categoría'}
                    </Typography>
                    <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                        {business.name}
                    </Typography>
                    <Typography color="text.secondary" variant="h6" sx={{ mb: 2 }}>
                        {business.address}
                    </Typography>
                    
                    <Button 
                        variant="contained" 
                        size="large"
                        disabled={!canBook}
                        title={!canBook ? 'Este negocio no ha configurado su horario de citas' : 'Reservar una cita'}
                        onClick={() => { 
                            if (!token) { 
                                alert("Debes iniciar sesión para reservar."); 
                                navigateTo('login'); 
                            } else { 
                                setShowBookingModal(true); 
                            } 
                        }}
                    >
                        {canBook ? 'Reservar ahora' : 'Reservas no disponibles'}
                    </Button>

                    <Divider sx={{ my: 3 }} />
                    
                    <Box mb={3}>
                        <Typography variant="h5" fontWeight="600" gutterBottom>Descripción</Typography>
                        <Typography color="text.secondary">{business.description}</Typography>
                    </Box>

                    <Box>
                        <Typography variant="h5" fontWeight="600" gutterBottom>Ubicación</Typography>
                        <LocationDisplay address={business.address} />
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};