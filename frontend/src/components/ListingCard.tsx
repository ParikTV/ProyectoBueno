// src/components/ListingCard.tsx

import React from 'react';
import styles from '@/styles/Cards.module.css'; //
import commonStyles from '@/styles/Common.module.css'; //
import { StarIcon } from './Icons'; //
import { Service } from '@/types'; //

interface ListingCardProps {
    service: Service; //
    onBook: (serviceId: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ service, onBook }) => {
    const rating = (Math.random() * (5 - 4) + 4).toFixed(1);

    // Determinar qué ID usar: service.id o service._id
    const serviceIdForBooking = service.id || service._id || '';

    return (
        <div className={styles.listingCard}> {/* */}
            <img 
                src={service.image_url || 'https://placehold.co/400x300/e2e8f0/4a5568?text=Sin+Imagen'} 
                alt={service.name} 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/4a5568?text=Error'; }}
            />
            <div className={styles.listingCardContent}> {/* */}
                <p className={styles.listingCardCategory}>{service.category}</p> {/* */}
                <h3 className={styles.listingCardName}>{service.name}</h3> {/* */}
                <div className={styles.listingCardRating}> {/* */}
                    <StarIcon /> {/* */}
                    <span>{rating}</span>
                </div>
                <p className={styles.listingCardLocation}>{service.location}</p> {/* */}
                <div className={commonStyles.actionButtons}> {/* */}
                    <button
                        // LÍNEA CORREGIDA: Elimina el ` {/* */}` de aquí. Debe terminar simplemente así:
                        className={`${commonStyles.button} ${commonStyles.buttonPrimary}`}
                        // CAMBIO AQUÍ: Pasa serviceIdForBooking en lugar de service.id
                        onClick={() => onBook(serviceIdForBooking)}
                        // Puedes añadir una pequeña validación visual si el ID no es válido
                        disabled={!serviceIdForBooking}
                    >
                        Reservar
                    </button>
                </div>
            </div>
        </div>
    );
};