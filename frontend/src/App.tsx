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
import { Page } from '@/types';

export type ExtendedPage = Page | 'ownerDashboard';

export default function App() {
    const [currentPage, setCurrentPage] = useState<ExtendedPage>('home');
    const navigateTo = (page: ExtendedPage) => setCurrentPage(page);

    const renderPage = () => {
        switch (currentPage) {
            case 'register': return <RegisterPage navigateTo={navigateTo} />;
            case 'login': return <LoginPage navigateTo={navigateTo} />;
            case 'profile': return <ProfilePage />;
            case 'appointments': return <AppointmentsPage />;
            case 'admin': return <AdminPage />;
            case 'ownerDashboard': return <OwnerDashboardPage />;
            case 'home': 
            default: 
                // --- CAMBIO AQUÍ ---
                // Se pasa la función navigateTo como prop a HomePage
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