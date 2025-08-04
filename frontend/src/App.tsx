// src/App.tsx

import React, { useState } from 'react';
import styles from '@/styles/App.module.css';

// --- NUEVA IMPORTACIÓN ---
// Importamos el MapProvider que se encargará de cargar la API de Google Maps.
import { MapProvider } from './context/MapProvider';

import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { AdminPage } from '@/pages/AdminPage';
import { OwnerDashboardPage } from '@/pages/OwnerDashboardPage';
import { BusinessDetailsPage } from '@/pages/BusinessDetailsPage';
import { OwnerAppointmentsPage } from '@/pages/OwnerAppointmentsPage';
import { Page } from '@/types';

export type ExtendedPage = Page | 'ownerDashboard' | 'businessDetails' | 'ownerAppointments';

export default function App() {
    const [currentPage, setCurrentPage] = useState<ExtendedPage>('home');
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

    const navigateTo = (page: ExtendedPage, businessId?: string) => {
        if (page === 'businessDetails' && businessId) {
            setSelectedBusinessId(businessId);
        } else if (page === 'ownerAppointments' && businessId) {
            setSelectedBusinessId(businessId);
        } else {
            setSelectedBusinessId(null);
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
            case 'ownerDashboard': return <OwnerDashboardPage navigateTo={navigateTo} />;
            
            case 'businessDetails':
                if (!selectedBusinessId) { return <HomePage navigateTo={navigateTo} />; }
                return <BusinessDetailsPage businessId={selectedBusinessId} navigateTo={navigateTo} />;

            case 'ownerAppointments':
                if (!selectedBusinessId) { return <OwnerDashboardPage navigateTo={navigateTo} />; }
                return <OwnerAppointmentsPage businessId={selectedBusinessId} />;

            case 'home': 
            default: 
                return <HomePage navigateTo={navigateTo} />;
        }
    };

    return (
        // --- CAMBIO PRINCIPAL ---
        // Envolvemos toda la aplicación con MapProvider.
        // Esto asegura que la API de Google se cargue antes de mostrar cualquier página,
        // eliminando los problemas de "espacios en blanco".
        <MapProvider>
            <div className={styles.appContainer}>
                <Header navigateTo={navigateTo} />
                <main className={styles.mainContent}>
                    {renderPage()}
                </main>
                <footer className={styles.footer}>
                    <p>&copy; 2025 ServiBook. Todos los derechos reservados.</p>
                </footer>
            </div>
        </MapProvider>
    );
};