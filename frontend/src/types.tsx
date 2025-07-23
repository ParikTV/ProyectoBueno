// src/types.tsx

export type Page = 'home' | 'register' | 'login' | 'profile' | 'appointments' | 'admin';

export interface Category {
    id: string; // Es mejor usar string para los IDs de MongoDB
    _id?: string;
    name: string;
}

export interface Service {
    id: string;
    _id?: string; 
    name: string;
    category: string;
    location: string;
    image_url: string | null;
}

export interface Appointment {
    id: string;
    service_id: string;
    user_id: string;
    appointment_time: string; 
    status: string;
    created_at: string;
}

export interface OwnerRequest {
    business_name: string;
    business_description: string;
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

// --- INTERFAZ DE BUSINESS ACTUALIZADA ---
export interface Business {
    id: string;
    owner_id: string;
    name: string;
    description: string;
    address: string;
    logo_url?: string;
    photos: string[];
    categories: string[];
    status: 'draft' | 'published';
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