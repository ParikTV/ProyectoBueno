// src/pages/BusinessDetailsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';
import { Business } from '@/types';
import styles from '@/styles/DetailsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';

// --- NUEVO MODAL DE RESERVA CON SELECTOR DE FECHA/HORA ---
const BookingModal: React.FC<{ business: Business; onClose: () => void; onBookingSuccess: () => void; }> = ({ business, onClose, onBookingSuccess }) => {
    const { token } = useAuth();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        setIsLoading(true);
        setError('');
        setSuccess('');

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
            setSuccess(`¡Cita reservada con éxito! ID: ${responseData.id || responseData._id}`);
            
            setTimeout(() => {
                onBookingSuccess();
                onClose();
            }, 2000);

        } catch (err: any) {
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
                    <label>1. Elige una fecha</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem'}}/>
                </div>

                <div className={commonStyles.formGroup}>
                    <label>2. Elige una hora disponible</label>
                    {isLoadingSlots ? <p>Cargando horarios...</p> : (
                        <div className={styles.timeSlotsGrid}>
                            {availableSlots.length > 0 ? (
                                availableSlots.map(slot => (
                                    <button key={slot} onClick={() => setSelectedSlot(slot)} className={`${styles.timeSlot} ${selectedSlot === slot ? styles.selected : ''}`}>
                                        {slot}
                                    </button>
                                ))
                            ) : (
                                <p>No hay horarios disponibles para este día.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className={commonStyles.actionButtons} style={{marginTop: '2rem'}}>
                    <button className={commonStyles.buttonPrimary} onClick={handleBooking} disabled={!selectedSlot || isLoading || !!success}>
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
    const [isLoading, setIsLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);

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

    if (isLoading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando...</div>;
    if (!business) return <div style={{textAlign: 'center', padding: '2rem'}}>Negocio no encontrado.</div>;
    
    // Deshabilitar botón de reserva si no hay horario configurado
    const canBook = business.status === 'published' && !!business.schedule;

    return (
        <div className={styles.detailsContainer}>
            {showBookingModal && (
                <BookingModal 
                    business={business} 
                    onClose={() => setShowBookingModal(false)} 
                    onBookingSuccess={() => navigateTo('appointments')} 
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
                </button>
            </div>
        </div>
    );
};