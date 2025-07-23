// src/pages/HomePage.tsx

import React, { useState, useEffect } from 'react';
import styles from '@/styles/HomePage.module.css';
import commonStyles from '@/styles/Common.module.css';
import { SearchIcon, MapPinIcon } from '@/components/Icons';
import { CategoryCard } from '@/components/CategoryCard';
import { ListingCard } from '@/components/ListingCard';
import { Business, Category } from '@/types';
import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';

interface HomePageProps {
    navigateTo: (page: ExtendedPage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigateTo }) => {
    const { token } = useAuth();
    
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [businessesResponse, categoriesResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/services/`),
                    fetch(`${API_BASE_URL}/categories/`)
                ]);

                if (!businessesResponse.ok) throw new Error('No se pudieron cargar los negocios.');
                if (!categoriesResponse.ok) throw new Error('No se pudieron cargar las categorías.');

                setBusinesses(await businessesResponse.json());
                setCategories(await categoriesResponse.json());

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSelectCategory = (categoryName: string) => {
        setSelectedCategory(prev => prev === categoryName ? null : categoryName);
    };

    const handleBooking = async (businessId: string) => {
        if (!token) {
            alert("Por favor, inicia sesión para poder reservar.");
            navigateTo('login');
            return;
        }
        
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
                    service_id: businessId,
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

    const filteredBusinesses = selectedCategory
        ? businesses.filter(business => business.categories.includes(selectedCategory))
        : businesses;

    return (
        <>
            <div className={styles.heroSection}>
                <h2>Encuentra y reserva cualquier servicio</h2>
                <p>Desde un corte de cabello hasta una cena especial, todo en un solo lugar.</p>
                <div className={styles.searchBar}>
                    {/* ... (barra de búsqueda) ... */}
                </div>
            </div>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Explorar por categoría</h3>
                <div className={styles.grid}>
                    {categories.map((cat) => (
                        <div key={cat.id || cat._id} onClick={() => handleSelectCategory(cat.name)}
                            className={`${styles.categoryCardWrapper} ${selectedCategory === cat.name ? styles.selected : ''}`}>
                            <CategoryCard icon="⭐" name={cat.name} />
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    {selectedCategory ? `Mostrando resultados para "${selectedCategory}"` : 'Destacados cerca de ti'}
                </h3>
                {bookingSuccess && <p className={`${commonStyles.alert} ${commonStyles.alertSuccess}`}>{bookingSuccess}</p>}
                {error && <p className={`${commonStyles.alert} ${commonStyles.alertError}`}>{error}</p>}
                {isLoading && <p>Cargando...</p>}
                
                {!isLoading && filteredBusinesses.length === 0 && (
                    <div style={{textAlign: 'center', padding: '2rem'}}>
                        <p>No se encontraron negocios en esta categoría.</p>
                        {selectedCategory && (
                            <button className={commonStyles.buttonSecondary} style={{width: 'auto'}} onClick={() => setSelectedCategory(null)}>
                                Mostrar todos
                            </button>
                        )}
                    </div>
                )}
                
                <div className={styles.grid}>
                    {filteredBusinesses.map((business) => (
                        <ListingCard 
                            key={business.id} 
                            business={business} 
                            onBook={handleBooking} 
                        />
                    ))}
                </div>
            </section>
        </>
    );
};