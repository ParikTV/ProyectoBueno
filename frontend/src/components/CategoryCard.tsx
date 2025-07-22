// src/components/CategoryCard.tsx

import React from 'react';
import styles from '@/styles/Cards.module.css'; // <-- RUTA ACTUALIZADA

interface CategoryCardProps {
    icon: string;
    name: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ icon, name }) => (
    <div className={styles.categoryCard}>
        <div className={styles.icon}>{icon}</div>
        <span className={styles.name}>{name}</span>
    </div>
);