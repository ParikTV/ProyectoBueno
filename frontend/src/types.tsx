// src/types.tsx

export type Page = 'home' | 'register' | 'login' | 'profile' | 'appointments' | 'admin';

// --- NUEVAS INTERFACES PARA EL HORARIO ---
export interface ScheduleDay {
    is_active: boolean;
    open_time: string;
    close_time: string;
    slot_duration_minutes: number;
    capacity_per_slot: number;
}

export interface Schedule {
    monday: ScheduleDay;
    tuesday: ScheduleDay;
    wednesday: ScheduleDay;
    thursday: ScheduleDay;
    friday: ScheduleDay;
    saturday: ScheduleDay;
    sunday: ScheduleDay;
}

// --- INTERFACES EXISTENTES ---
export interface Category {
    id: string;
    _id?: string;
    name: string;
}

export interface Appointment {
    id: string;
    business_id: string;
    user_id: string;
    appointment_time: string; 
    status: string;
    created_at: string;
}

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
// Añadimos los nuevos campos a la interfaz de la solicitud.
export interface OwnerRequest {
    business_name: string;
    business_description: string;
    address: string; // <--- CAMPO AÑADIDO
    logo_url?: string; // <--- CAMPO AÑADIDO (opcional)
    status: 'pending' | 'approved' | 'rejected';
}

export interface UserResponse {
    id: string;
    _id?: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    created_at: string;
    role: 'usuario' | 'dueño' | 'admin';
    owner_request?: OwnerRequest;
}

export interface Business {
    id: string;
    _id?: string;
    owner_id: string;
    name: string;
    description: string;
    address: string;
    logo_url?: string;
    photos: string[];
    categories: string[];
    status: 'draft' | 'published';
    schedule?: Schedule;
}

export interface CategoryRequest {
    id: string;
    _id?: string;
    owner_id: string;
    category_name: string;
    reason: string;
    evidence_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}