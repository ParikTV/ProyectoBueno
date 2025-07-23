// src/App.tsx

import React, { useState } from 'react';
import styles from '@/styles/App.module.css';

import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { AdminPage } from '@/pages/AdminPage';
import { OwnerDashboardPage } from '@/pages/OwnerDashboardPage';
import { BusinessDetailsPage } from '@/pages/BusinessDetailsPage'; // Se importa la nueva página
import { Page } from '@/types';

// Se añade 'businessDetails' a los tipos de página posibles
export type ExtendedPage = Page | 'ownerDashboard' | 'businessDetails';

export default function App() {
    const [currentPage, setCurrentPage] = useState<ExtendedPage>('home');
    // Nuevo estado para guardar el ID del negocio que el usuario quiere ver
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

    // La función de navegación ahora puede aceptar un ID de negocio
    const navigateTo = (page: ExtendedPage, businessId?: string) => {
        if (page === 'businessDetails' && businessId) {
            setSelectedBusinessId(businessId);
        } else {
            setSelectedBusinessId(null); // Limpiar el ID si no es la página de detalles
        }
        setCurrentPage(page);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'register': return <RegisterPage navigateTo={navigateTo} />;
            case 'login': return <LoginPage navigateTo={navigateTo} />;
            case 'profile': return <ProfilePage />;
            case 'appointments': return <AppointmentsPage />;
            case 'admin': return <AdminPage />;
            case 'ownerDashboard': return <OwnerDashboardPage />;
            
            // Nuevo caso para renderizar la página de detalles
            case 'businessDetails':
                if (!selectedBusinessId) {
                    // Si no hay un ID, vuelve al inicio para evitar errores
                    return <HomePage navigateTo={navigateTo} />;
                }
                return <BusinessDetailsPage businessId={selectedBusinessId} navigateTo={navigateTo} />;

            case 'home': 
            default: 
                return <HomePage navigateTo={navigateTo} />;
        }
    };

    return (
        <div className={styles.appContainer}>
            <Header navigateTo={navigateTo} />
            <main className={styles.mainContent}>
                {renderPage()}
            </main>
            <footer className={styles.footer}>
                <p>&copy; 2025 ServiBook. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};