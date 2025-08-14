export type ScheduleDay = {
  is_active: boolean;
  open_time: string;
  close_time: string;
  slot_duration_minutes: number;
  capacity_per_slot: number;
};

export type Schedule = {
  monday: ScheduleDay; tuesday: ScheduleDay; wednesday: ScheduleDay;
  thursday: ScheduleDay; friday: ScheduleDay; saturday: ScheduleDay; sunday: ScheduleDay;
};

export interface Business {
  id?: string;
  _id?: string;
  name: string;
  address: string;
  description?: string;
  categories: string[];
  photos: string[];
  logo_url?: string;
  status: 'draft' | 'published' | 'archived';
  schedule?: any;
  appointment_mode?: 'generico' | 'por_empleado';

  owner_id?: string;        
  rating_avg?: number;      
  rating_count?: number;    
}


export interface Appointment {
  id?: string; _id?: string;
  user_id: string;
  business_id: string;
  appointment_time: string; 
  status: 'confirmed' | 'cancelled';
  employee_id?: string | null;
}


export type Category = { id: string; name: string };

export type Employee = {
  id: string;
  business_id: string;
  name: string;
  active: boolean;
  roles?: string[];
  schedule?: Schedule;
};
export interface ReviewReply {
  author_role: 'owner' | 'admin';
  content: string;
  created_at: string; 
}

export interface Review {
  id?: string;
  _id?: string;
  business_id: string;
  appointment_id: string;
  user_id: string;
  rating: number;          
  comment?: string;
  created_at: string;      
  replies?: ReviewReply[];
}