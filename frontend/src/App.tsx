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
import { BusinessDetailsPage } from '@/pages/BusinessDetailsPage';
import { TestBookingPage } from '@/pages/TestBookingPage'; // <-- Se importa la página de prueba
import { Page } from '@/types';

// Se añade 'testBooking' a los tipos de página
export type ExtendedPage = Page | 'ownerDashboard' | 'businessDetails' | 'testBooking';

export default function App() {
    const [currentPage, setCurrentPage] = useState<ExtendedPage>('home');
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

    const navigateTo = (page: ExtendedPage, businessId?: string) => {
        if (page === 'businessDetails' && businessId) {
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
            case 'ownerDashboard': return <OwnerDashboardPage />;
            
            case 'businessDetails':
                if (!selectedBusinessId) { return <HomePage navigateTo={navigateTo} />; }
                return <BusinessDetailsPage businessId={selectedBusinessId} navigateTo={navigateTo} />;

            case 'testBooking': // <-- Se añade la lógica para mostrar la página de prueba
                return <TestBookingPage />;

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