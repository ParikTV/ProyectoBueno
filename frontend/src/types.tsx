// src/types.ts

export type Page = 'home' | 'register' | 'login' | 'profile' | 'appointments';

// NUEVO: Tipo para un Servicio
export interface Service {
    id: string;
    name: string;
    category: string;
    location: string;
    image_url: string | null;
}

// NUEVO: Tipo para una Cita
export interface Appointment {
    id: string;
    service_id: string;
    user_id: string;
    appointment_time: string; // Usamos string por simplicidad en el frontend
    status: string;
    created_at: string;
}