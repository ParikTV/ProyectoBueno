// src/pages/HomePage.tsx

import React, { useState, useEffect } from 'react';
import styles from '@/styles/HomePage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { SearchIcon, MapPinIcon } from '@/components/Icons';
import { CategoryCard } from '@/components/CategoryCard';
import { ListingCard } from '@/components/ListingCard';
import { Service } from '@/types';
import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const categories = [ { name: 'Restaurantes', icon: '🍽️' }, { name: 'Barberías', icon: '💈' }, { name: 'Clínicas', icon: '⚕️' }, { name: 'Hoteles', icon: '🏨' }, ];

export const HomePage: React.FC = () => {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState('');
    
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/services/`);
                if (!response.ok) throw new Error('No se pudieron cargar los servicios.');
                const data: Service[] = await response.json();
                setServices(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleBooking = async (serviceId: string) => {
        if (!token) {
            alert("Por favor, inicia sesión para poder reservar.");
            return;
        }
        setBookingSuccess(null);
        setError(null);
        const appointmentTime = new Date();
        appointmentTime.setDate(appointmentTime.getDate() + 1);
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    service_id: serviceId,
                    appointment_time: appointmentTime.toISOString(),
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "No se pudo crear la cita.");
            }
            setBookingSuccess("¡Cita reservada con éxito! Puedes verla en 'Mis Citas'.");
            setTimeout(() => setBookingSuccess(null), 5000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <>
            <div className={styles.heroSection}>
                <h2>Encuentra y reserva cualquier servicio</h2>
                <p>Desde un corte de cabello hasta una cena especial, todo en un solo lugar.</p>
                <div className={styles.searchBar}>
                    <div className={styles.searchInputContainer}><SearchIcon /><input type="text" placeholder="Restaurante, hotel, barbería..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <div className={styles.searchInputContainer}><MapPinIcon /><input type="text" placeholder="¿Dónde?" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                    <button>Buscar</button>
                </div>
            </div>
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Explorar por categoría</h3>
                <div className={styles.grid}>
                    {categories.map((cat) => (
                        <CategoryCard key={cat.name} icon={cat.icon} name={cat.name} />
                    ))}
                </div>
            </section>
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Destacados cerca de ti</h3>
                {bookingSuccess && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{bookingSuccess}</p>}
                {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
                {isLoading && <p>Cargando servicios...</p>}
                
                <div className={styles.grid}>
                    {services.map((service) => (
                        <ListingCard 
                            key={service.id} 
                            service={service} 
                            onBook={handleBooking} 
                        />
                    ))}
                </div>
            </section>
        </>
    );
};