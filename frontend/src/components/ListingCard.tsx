// src/components/ListingCard.tsx

import React from 'react';
import styles from '@/styles/Cards.module.css';
import commonStyles from '@/styles/Common.module.css';
import { StarIcon } from './Icons';
import { Business } from '@/types';

interface ListingCardProps {
    business: Business;
    onViewDetails: (businessId: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ business, onViewDetails }) => {
    // --- ¡LÍNEA CORREGIDA! ---
    // Se prioriza la foto principal (logo_url). Si no existe,
    // se muestra la primera de la galería. Si no hay ninguna, se muestra un placeholder.
    const displayImage = business.logo_url || business.photos?.[0] || 'https://placehold.co/400x300/e2e8f0/4a5568?text=Sin+Imagen';
    const displayCategories = business.categories.join(', ');

    return (
        <div className={styles.listingCard}>
            <img 
                src={displayImage} 
                alt={business.name} 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/4a5568?text=Error'; }}
            />
            <div className={styles.listingCardContent}>
                <p className={styles.listingCardCategory}>{displayCategories || 'Sin categoría'}</p>
                <h3 className={styles.listingCardName}>{business.name}</h3>
                <div className={styles.listingCardRating}>
                    <StarIcon />
                    {/* El rating se mantiene aleatorio como estaba en el código original */}
                    <span>{(Math.random() * (5 - 4.2) + 4.2).toFixed(1)}</span>
                </div>
                <p className={styles.listingCardLocation}>{business.address}</p>
                <div className={commonStyles.actionButtons} style={{marginTop: 'auto', paddingTop: '1rem'}}>
                    <button
                        className={`${commonStyles.button} ${commonStyles.buttonPrimary}`}
                        onClick={() => onViewDetails(business.id)}
                        disabled={!business.id}
                    >
                        Ver Detalles
                    </button>
                </div>
            </div>
        </div>
    );
};