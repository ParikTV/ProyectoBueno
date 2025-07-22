// src/pages/AppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/styles/AppointmentsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { API_BASE_URL } from '@/services/api';
import { Appointment, Service } from '@/types';

// Un componente pequeño para mostrar los detalles de una cita
const AppointmentCard: React.FC<{ appointment: Appointment, service?: Service }> = ({ appointment, service }) => {
    const appointmentDate = new Date(appointment.appointment_time);
    
    return (
        <div className={styles.appointmentCard}>
            <div className={styles.serviceInfo}>
                <h3>{service?.name || 'Servicio Desconocido'}</h3>
                <p>{service?.location || 'Ubicación no disponible'}</p>
                <p>Categoría: {service?.category || 'N/A'}</p>
            </div>
            <div className={styles.appointmentDetails}>
                <strong>{appointmentDate.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                <span>{appointmentDate.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
};

export const AppointmentsPage: React.FC = () => {
    const { token, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Record<string, Service>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointmentsAndServices = async () => {
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

                // 2. Obtener todos los servicios para poder mostrar sus detalles
                const servicesResponse = await fetch(`${API_BASE_URL}/services/`);
                if (!servicesResponse.ok) throw new Error("No se pudieron cargar los detalles de los servicios.");
                const servicesData: Service[] = await servicesResponse.json();
                
                // Convertir la lista de servicios en un objeto para fácil acceso
                const servicesMap = servicesData.reduce((acc, service) => {
                    acc[service.id] = service;
                    return acc;
                }, {} as Record<string, Service>);
                setServices(servicesMap);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointmentsAndServices();
    }, [token, logout]);

    if (isLoading) return <div className={styles.pageContainer}><p>Cargando tus citas...</p></div>;
    if (error) return <div className={styles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;

    return (
        <div className={styles.pageContainer}>
            <h2 className={styles.pageHeader}>Mis Citas</h2>
            {appointments.length > 0 ? (
                <div className={styles.appointmentList}>
                    {appointments.map(app => (
                        <AppointmentCard key={app.id} appointment={app} service={services[app.service_id]} />
                    ))}
                </div>
            ) : (
                <div className={styles.noAppointments}>
                    <p>Aún no tienes ninguna cita reservada.</p>
                </div>
            )}
        </div>
    );
};