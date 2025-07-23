// src/pages/AppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/styles/AppointmentsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { API_BASE_URL } from '@/services/api';
import { Appointment, Business } from '@/types'; // CAMBIO: Importamos Business en lugar de Service

// --- Componente de la tarjeta de cita (actualizado) ---
const AppointmentCard: React.FC<{ appointment: Appointment, business?: Business }> = ({ appointment, business }) => {
    const appointmentDate = new Date(appointment.appointment_time);
    
    // Unimos las categorías del negocio en un solo string
    const displayCategories = business?.categories.join(', ') || 'N/A';

    return (
        <div className={styles.appointmentCard}>
            <div className={styles.serviceInfo}>
                <h3>{business?.name || 'Negocio Desconocido'}</h3>
                {/* CAMBIO: Usamos 'address' en lugar de 'location' */}
                <p>{business?.address || 'Ubicación no disponible'}</p>
                {/* CAMBIO: Mostramos las categorías del negocio */}
                <p>Categoría: {displayCategories}</p>
            </div>
            <div className={styles.appointmentDetails}>
                <strong>{appointmentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                <span>{appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
};

// --- Componente principal de la página (actualizado) ---
export const AppointmentsPage: React.FC = () => {
    const { token, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    // CAMBIO: El estado ahora almacena un mapa de Negocios (Business)
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
                // 1. Obtener todas las citas del usuario
                const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!appointmentsResponse.ok) {
                    if (appointmentsResponse.status === 401) logout();
                    throw new Error("No se pudieron cargar tus citas.");
                }
                const appointmentsData: Appointment[] = await appointmentsResponse.json();
                setAppointments(appointmentsData);

                // 2. Obtener todos los negocios publicados para poder mostrar sus detalles
                const businessesResponse = await fetch(`${API_BASE_URL}/services/`);
                if (!businessesResponse.ok) throw new Error("No se pudieron cargar los detalles de los negocios.");
                
                // CAMBIO: Los datos ahora son de tipo Business
                const businessesData: Business[] = await businessesResponse.json();
                
                // Convertimos la lista de negocios en un objeto para fácil acceso
                const businessesMap = businessesData.reduce((acc, business) => {
                    const businessKey = business.id;
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

    if (isLoading) return <div className={styles.pageContainer}><p>Cargando tus citas...</p></div>;
    if (error) return <div className={styles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;

    return (
        <div className={styles.pageContainer}>
            <h2 className={styles.pageHeader}>Mis Citas</h2>
            {appointments.length > 0 ? (
                <div className={styles.appointmentList}>
                    {appointments.map(app => {
                        // Buscamos el negocio correspondiente a la cita en nuestro mapa
                        const businessToShow = businesses[app.service_id];
                        return (
                            <AppointmentCard key={app.id} appointment={app} business={businessToShow} />
                        );
                    })}
                </div>
            ) : (
                <div className={styles.noAppointments}>
                    <p>Aún no tienes ninguna cita reservada.</p>
                </div>
            )}
        </div>
    );
};