// src/types.ts

export type Page = 'home' | 'register' | 'login' | 'profile' | 'appointments' | 'admin';

// Tipo para un Servicio
export interface Service {
    id: string;
    _id?: string; // AÑADIDO: Añadir _id como opcional, ya que a veces viene del backend
    name: string;
    category: string;
    location: string;
    image_url: string | null;
}

// Tipo para una Cita
export interface Appointment {
    id: string;
    service_id: string;
    user_id: string;
    appointment_time: string; // Usamos string por simplicidad en el frontend
    status: string;
    created_at: string;
}

// Tipo para la respuesta de usuario, incluyendo si es admin
export interface UserResponse {
    id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    created_at: string;
    is_admin?: boolean; // Indica si el usuario es administrador
}

// Tipo para los datos del formulario de servicio
export interface ServiceFormInputs {
    name: string;
    category: string;
    location: string;
    image_url: string;
}