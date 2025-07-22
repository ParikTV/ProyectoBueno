// src/components/ListingCard.tsx

import React from 'react';
import styles from '@/App.module.css';
import { StarIcon } from './Icons';

interface ListingCardProps {
    image: string;
    category: string;
    name: string;
    rating: string;
    location: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({ image, category, name, rating, location }) => (
    <div className={styles.listingCard}>
        <img src={image} alt={name} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/4a5568?text=Imagen'; }}/>
        <div className={styles.listingCardContent}>
            <p className={styles.listingCardCategory}>{category}</p>
            <h3 className={styles.listingCardName}>{name}</h3>
            <div className={styles.listingCardRating}>
                <StarIcon />
                <span>{rating}</span>
            </div>
            <p className={styles.listingCardLocation}>{location}</p>
        </div>
    </div>
);