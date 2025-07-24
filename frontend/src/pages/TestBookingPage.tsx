// src/pages/TestBookingPage.tsx

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import commonStyles from '@/styles/Common.module.css';

export const TestBookingPage: React.FC = () => {
    const { token } = useAuth();
    const [businessId, setBusinessId] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleTestBooking = async () => {
        if (!token) { setError("No estás autenticado."); return; }
        if (!businessId || !appointmentTime) { setError("Ambos campos son obligatorios."); return; }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
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
                const readableError = errData.detail?.[0]?.msg || JSON.stringify(errData.detail) || "Ocurrió un error.";
                throw new Error(readableError);
            }

            const responseData = await res.json();
            
            // --- CAMBIO CLAVE AQUÍ ---
            // Le decimos al frontend que busque '_id' en lugar de 'id' en la respuesta.
            setSuccess(`¡Cita creada con éxito! ID: ${responseData._id}`);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className={commonStyles.formContainer} style={{ maxWidth: '500px' }}>
                <h2>Página de Prueba de Reservas</h2>
                <p>Esta página es para probar la creación de citas de la forma más simple posible.</p>

                <div className={commonStyles.formGroup}>
                    <label htmlFor="businessId">ID del Negocio (business_id)</label>
                    <input id="businessId" type="text" value={businessId} onChange={e => setBusinessId(e.target.value)} placeholder="Pega el ID de un negocio aquí" />
                </div>

                <div className={commonStyles.formGroup}>
                    <label htmlFor="appointmentTime">Fecha y Hora (appointment_time)</label>
                    <input id="appointmentTime" type="text" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} placeholder="Formato: YYYY-MM-DDTHH:MM:SSZ" />
                </div>

                <button onClick={handleTestBooking} className={commonStyles.buttonPrimary} disabled={isLoading}>
                    {isLoading ? 'Enviando...' : 'Probar Crear Cita'}
                </button>

                {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`} style={{ marginTop: '1rem' }}>{error}</p>}
                {success && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`} style={{ marginTop: '1rem' }}>{success}</p>}
            </div>
        </div>
    );
};