// src/pages/HomePage.tsx

import React, { useState } from 'react';
import styles from '@/styles/HomePage.module.css'; // <-- RUTA ACTUALIZADA
import { SearchIcon, MapPinIcon } from '@/components/Icons';
import { CategoryCard } from '@/components/CategoryCard';
import { ListingCard } from '@/components/ListingCard';

const categories = [ { name: 'Restaurantes', icon: '🍽️' }, { name: 'Barberías', icon: '💈' }, { name: 'Clínicas', icon: '⚕️' }, { name: 'Hoteles', icon: '🏨' }, ];
const featuredListings = [ { id: 1, name: 'La Parrilla Argentina', category: 'Restaurante', rating: '4.8', location: 'San José, Costa Rica', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto.format&fit=crop' }, { id: 2, name: 'Barbería El Caballero', category: 'Barbería', rating: '4.9', location: 'Heredia, Costa Rica', image: 'https://images.unsplash.com/photo-1536520002442-39764a41e987?q=80&w=2070&auto.format&fit=crop' }];

export const HomePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState('');

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
                <div className={styles.grid}>{categories.map((cat) => (<CategoryCard key={cat.name} icon={cat.icon} name={cat.name} />))}</div>
            </section>
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Destacados cerca de ti</h3>
                <div className={styles.grid}>{featuredListings.map((listing) => (<ListingCard key={listing.id} image={listing.image} category={listing.category} name={listing.name} rating={listing.rating} location={listing.location} />))}</div>
            </section>
        </>
    );
};