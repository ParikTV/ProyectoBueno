// src/pages/OwnerAppointmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from '@/styles/AppointmentsPage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { API_BASE_URL } from '@/services/api';
import { Appointment, UserResponse } from '@/types';

interface OwnerAppointmentsPageProps {
    businessId: string;
}

export const OwnerAppointmentsPage: React.FC<OwnerAppointmentsPageProps> = ({ businessId }) => {
    const { token, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [users, setUsers] = useState<Record<string, UserResponse>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointmentsAndUsers = async () => {
            if (!token) {
                setError("No estás autenticado.");
                setIsLoading(false);
                return;
            }
            try {
                const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/business/${businessId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!appointmentsResponse.ok) {
                    if (appointmentsResponse.status === 401) logout();
                    throw new Error("No se pudieron cargar las citas de este negocio.");
                }
                const appointmentsData: Appointment[] = await appointmentsResponse.json();
                setAppointments(appointmentsData);

                // Obtener los datos de usuario por cada cita
                const usersMap: Record<string, UserResponse> = {};
                for (const app of appointmentsData) {
                    const userId = app.user_id;
                    if (userId && !usersMap[userId]) {
                        const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });
                        if (userResponse.ok) {
                            const userData: UserResponse = await userResponse.json();
                            usersMap[userId] = userData;
                        }
                    }
                }
                setUsers(usersMap);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointmentsAndUsers();
    }, [token, logout, businessId]);

    if (isLoading) return <div className={styles.pageContainer}><p>Cargando las citas del negocio...</p></div>;
    if (error) return <div className={styles.pageContainer}><p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p></div>;

    return (
        <div className={styles.pageContainer}>
            <h2 className={styles.pageHeader}>Reservas del Negocio</h2>
            {appointments.length > 0 ? (
                <div className={styles.appointmentList}>
                    {appointments.map(app => {
                        const user = users[app.user_id];
                        const appointmentDate = new Date(app.appointment_time);
                        return (
                            <div key={app.id || (app as any)._id} className={styles.appointmentCard}>
                                <div className={styles.serviceInfo}>
                                    <h3>{user?.full_name || 'Usuario Desconocido'}</h3>
                                    <p>{user?.email || 'Email no disponible'}</p>
                                </div>
                                <div className={styles.appointmentDetails}>
                                    <strong>{appointmentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                    <span>{appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.noAppointments}>
                    <p>Este negocio aún no tiene ninguna cita reservada.</p>
                </div>
            )}
        </div>
    );
};