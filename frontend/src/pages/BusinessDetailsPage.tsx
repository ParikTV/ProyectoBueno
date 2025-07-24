// src/pages/BusinessDetailsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';
import { Business, Appointment } from '@/types';
import styles from '@/styles/DetailsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';

// --- MODAL DE RESERVA (VERSIÓN POSTMAN) ---
const BookingModal: React.FC<{ business: Business; onClose: () => void; onBookingSuccess: () => void; }> = ({ business, onClose, onBookingSuccess }) => {
    const { token, user } = useAuth();
    const [appointmentTimeString, setAppointmentTimeString] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleBooking = async () => {
        if (!appointmentTimeString) { setError("Por favor, ingresa la fecha y hora."); return; }
        if (!user) { setError("Debes iniciar sesión para reservar."); return; }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/appointments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    business_id: business.id, // Se envía 'business_id'
                    appointment_time: appointmentTimeString
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                const errorMessage = errData.detail?.[0]?.msg || JSON.stringify(errData.detail) || "No se pudo crear la cita.";
                throw new Error(errorMessage);
            }

            setSuccess("¡Cita reservada con éxito!");
            setTimeout(() => { onBookingSuccess(); onClose(); }, 2000);
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
                    <label htmlFor="appointmentTime">Fecha y Hora de la Cita</label>
                    <input id="appointmentTime" type="text" value={appointmentTimeString} onChange={e => setAppointmentTimeString(e.target.value)} placeholder="Ej: 2025-12-01T15:30:00Z" />
                    <small>Usa el formato exacto: YYYY-MM-DDTHH:MM:SSZ</small>
                </div>
                <div className={commonStyles.actionButtons}>
                    <button className={commonStyles.buttonPrimary} onClick={handleBooking} disabled={isLoading}>{isLoading ? 'Confirmando...' : 'Confirmar Cita'}</button>
                    <button className={commonStyles.buttonSecondary} onClick={onClose} disabled={isLoading}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL (SIN CAMBIOS) ---
interface BusinessDetailsPageProps { businessId: string; navigateTo: (page: ExtendedPage) => void; }
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

    useEffect(() => { fetchDetails(); }, [fetchDetails]);

    if (isLoading) return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando...</div>;
    if (!business) return <div style={{textAlign: 'center', padding: '2rem'}}>Negocio no encontrado.</div>;
    
    return (
        <div className={styles.detailsContainer}>
            {showBookingModal && (<BookingModal business={business} existingAppointments={appointments} onClose={() => setShowBookingModal(false)} onBookingSuccess={fetchDetails} />)}
            <div className={styles.imageColumn}><img src={business.photos?.[0] || 'https://placehold.co/600x400/e2e8f0/4a5568?text=Sin+Imagen'} alt={business.name} /></div>
            <div className={styles.infoColumn}>
                <span className={styles.category}>{business.categories.join(', ')}</span>
                <h1>{business.name}</h1>
                <p className={styles.address}>{business.address}</p>
                <hr className={styles.divider} />
                <p className={styles.description}>{business.description}</p>
                <button className={`${commonStyles.button} ${commonStyles.buttonPrimary}`} style={{width: 'auto'}} onClick={() => { if (!token) { alert("Debes iniciar sesión para reservar."); navigateTo('login'); } else { setShowBookingModal(true); } }}>
                    Reservar ahora
                </button>
            </div>
        </div>
    );
};