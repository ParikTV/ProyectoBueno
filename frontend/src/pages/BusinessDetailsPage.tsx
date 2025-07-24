// src/pages/BusinessDetailsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';
import { Business } from '@/types';
import styles from '@/styles/DetailsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';

// --- NUEVO MODAL DE RESERVA (BASADO EN TestBookingPage) ---
const BookingModal: React.FC<{ business: Business; onClose: () => void; onBookingSuccess: () => void; }> = ({ business, onClose, onBookingSuccess }) => {
    const { token, user } = useAuth();
    const [appointmentTime, setAppointmentTime] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleBooking = async () => {
        if (!appointmentTime) {
            setError("Por favor, ingresa la fecha y hora.");
            return;
        }
        if (!user) {
            setError("Debes iniciar sesión para reservar.");
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const businessId = business.id || business._id;
            if (!businessId) throw new Error("ID del negocio no válido.");

            const res = await fetch(`${API_BASE_URL}/appointments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    business_id: businessId,
                    appointment_time: appointmentTime
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                const errorMessage = errData.detail?.[0]?.msg || JSON.stringify(errData.detail) || "No se pudo crear la cita.";
                throw new Error(errorMessage);
            }

            const responseData = await res.json();
            setSuccess(`¡Cita reservada con éxito! ID: ${responseData.id || responseData._id}`);
            
            // Esperar 2 segundos y luego cerrar y refrescar.
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
                <p>Esta es una interfaz de reserva simplificada.</p>

                {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
                {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{success}</p>}
                
                <div className={commonStyles.formGroup}>
                    <label htmlFor="appointmentTime">Fecha y Hora (appointment_time)</label>
                    <input 
                        id="appointmentTime" 
                        type="text" 
                        value={appointmentTime} 
                        onChange={e => setAppointmentTime(e.target.value)} 
                        placeholder="Formato: YYYY-MM-DDTHH:MM:SS" 
                    />
                     <small>Ej: 2025-12-24T18:30:00</small>
                </div>

                <div className={commonStyles.actionButtons}>
                    <button className={commonStyles.buttonPrimary} onClick={handleBooking} disabled={isLoading || !!success}>
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


// --- COMPONENTE PRINCIPAL (SIN CAMBIOS EN SU LÓGICA) ---
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
    
    return (
        <div className={styles.detailsContainer}>
            {showBookingModal && (
                <BookingModal 
                    business={business} 
                    onClose={() => setShowBookingModal(false)} 
                    onBookingSuccess={() => {
                        // Opcional: podrías navegar a la página de "Mis Citas"
                        navigateTo('appointments');
                    }} 
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
                    }}
                >
                    Reservar ahora
                </button>
            </div>
        </div>
    );
};