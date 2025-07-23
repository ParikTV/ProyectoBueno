// src/pages/BusinessDetailsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';
import { Business, Appointment } from '@/types';
import styles from '@/styles/DetailsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';

// --- COMPONENTE MODAL DE RESERVA ---
const BookingModal: React.FC<{ business: Business; existingAppointments: Appointment[]; onClose: () => void; onBookingSuccess: () => void; }> = ({ business, existingAppointments, onClose, onBookingSuccess }) => {
    const { token, user } = useAuth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Genera horarios de ejemplo, de 9:00 a 17:00
    const timeSlots = Array.from({ length: 9 }, (_, i) => `${9 + i}:00`);
    
    // Crea un set con las fechas de las citas existentes para bloquearlas
    const bookedSlots = new Set(
        existingAppointments.map(app => new Date(app.appointment_time).toISOString())
    );

    const handleBooking = async () => {
        if (!selectedTime) {
            setError("Por favor, selecciona una hora.");
            return;
        }
        if (!user) {
            setError("Debes iniciar sesión para reservar.");
            return;
        }
        
        setIsLoading(true);
        setError('');
        const [hour] = selectedTime.split(':').map(Number);
        const bookingDate = new Date(selectedDate);
        // Usamos setUTCHours para crear una fecha en formato UTC, el estándar universal
        bookingDate.setUTCHours(hour, 0, 0, 0);

        try {
            const res = await fetch(`${API_BASE_URL}/appointments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    service_id: business.id,
                    appointment_time: bookingDate.toISOString() // Se envía en formato ISO 8601
                })
            });

            // --- MANEJO DE ERRORES MEJORADO ---
            if (!res.ok) {
                // Intenta leer el JSON del error para obtener el detalle del backend
                const errData = await res.json();
                // Muestra el mensaje de error específico de FastAPI
                const errorMessage = errData.detail?.[0]?.msg || errData.detail || "No se pudo crear la cita.";
                throw new Error(errorMessage);
            }

            setSuccess("¡Cita reservada con éxito!");
            setTimeout(() => {
                onBookingSuccess(); // Recarga las citas en la página de detalles
                onClose(); // Cierra el modal
            }, 2000);
        } catch(err: any) {
            // Ahora el error que se muestra es el mensaje detallado del backend
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h2>Reservar en {business.name}</h2>
                {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
                {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
                
                <div className={commonStyles.formGroup}>
                    <label>Selecciona una fecha</label>
                    <input type="date" 
                        onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))} 
                        defaultValue={selectedDate.toISOString().split('T')[0]}/>
                </div>

                <div className={commonStyles.formGroup}>
                    <label>Selecciona una hora</label>
                    <div className={styles.timeSlotsGrid}>
                        {timeSlots.map(time => {
                            const [hour] = time.split(':').map(Number);
                            const slotDate = new Date(selectedDate);
                            slotDate.setUTCHours(hour, 0, 0, 0);
                            const isBooked = bookedSlots.has(slotDate.toISOString());
                            
                            return (
                                <button key={time} disabled={isBooked}
                                    className={`${styles.timeSlot} ${selectedTime === time ? styles.selected : ''} ${isBooked ? styles.booked : ''}`}
                                    onClick={() => setSelectedTime(time)}>
                                    {time}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                <div className={commonStyles.actionButtons}>
                    <button className={commonStyles.buttonPrimary} onClick={handleBooking} disabled={isLoading}>
                        {isLoading ? 'Confirmando...' : 'Confirmar Cita'}
                    </button>
                    <button className={commonStyles.buttonSecondary} onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
interface BusinessDetailsPageProps {
    businessId: string;
    navigateTo: (page: ExtendedPage) => void;
}
export const BusinessDetailsPage: React.FC<BusinessDetailsPageProps> = ({ businessId, navigateTo }) => {
    const { token } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const fetchDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const [businessRes, appointmentsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/businesses/${businessId}`),
                fetch(`${API_BASE_URL}/appointments/business/${businessId}`)
            ]);
            if (!businessRes.ok) throw new Error("Negocio no encontrado");
            
            setBusiness(await businessRes.json());
            if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
        } catch (error) {
            console.error("Error al cargar detalles:", error);
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    if (isLoading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando detalles del negocio...</div>;
    if (!business) return <div style={{textAlign: 'center', padding: '2rem'}}>Negocio no encontrado o no está disponible.</div>;
    
    return (
        <div className={styles.detailsContainer}>
            {showBookingModal && (
                <BookingModal 
                    business={business} 
                    existingAppointments={appointments} 
                    onClose={() => setShowBookingModal(false)}
                    onBookingSuccess={fetchDetails}
                />
            )}
            
            <div className={styles.imageColumn}>
                <img src={business.photos?.[0] || 'https://placehold.co/600x400/e2e8f0/4a5568?text=Sin+Imagen'} alt={business.name} />
            </div>

            <div className={styles.infoColumn}>
                <span className={styles.category}>{business.categories.join(', ')}</span>
                <h1>{business.name}</h1>
                <p className={styles.address}>{business.address}</p>
                <hr className={styles.divider} />
                <p className={styles.description}>{business.description}</p>
                
                <button 
                    className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} 
                    style={{width: 'auto'}}
                    onClick={() => {
                        if (!token) {
                            alert("Debes iniciar sesión para reservar.");
                            navigateTo('login');
                        } else {
                            setShowBookingModal(true);
                        }
                    }}>
                    Reservar ahora
                </button>
            </div>
        </div>
    );
};