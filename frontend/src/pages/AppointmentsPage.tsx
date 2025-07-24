// src/pages/AppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/styles/AppointmentsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { API_BASE_URL } from '@/services/api';
import { Appointment, Business } from '@/types';

const AppointmentCard: React.FC<{ appointment: Appointment, business?: Business }> = ({ appointment, business }) => {
    const appointmentDate = new Date(appointment.appointment_time);
    const displayCategories = business?.categories.join(', ') || 'N/A';

    return (
        <div className={styles.appointmentCard}>
            <div className={styles.serviceInfo}>
                <h3>{business?.name || 'Negocio Desconocido'}</h3>
                <p>{business?.address || 'Ubicación no disponible'}</p>
                <p>Categoría: {displayCategories}</p>
            </div>
            <div className={styles.appointmentDetails}>
                <strong>{appointmentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                <span>{appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
};

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

    if (isLoading) return <div className={styles.pageContainer}><p>Cargando tus citas...</p></div>;
    if (error) return <div className={styles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;

    return (
        <div className={styles.pageContainer}>
            <h2 className={styles.pageHeader}>Mis Citas</h2>
            {appointments.length > 0 ? (
                <div className={styles.appointmentList}>
                    {appointments.map(app => {
                        // --- CAMBIO CLAVE AQUÍ ---
                        // Usamos app.business_id para encontrar el negocio
                        const businessToShow = businesses[app.business_id];
                        return (
                            <AppointmentCard key={app.id || (app as any)._id} appointment={app} business={businessToShow} />
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