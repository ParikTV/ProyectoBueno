// src/App.tsx

import React, { useState } from 'react';
import styles from '@/styles/App.module.css'; //

import { Header } from '@/components/Header'; //
import { HomePage } from '@/pages/HomePage'; //
import { LoginPage } from '@/pages/LoginPage'; //
import { RegisterPage } from '@/pages/RegisterPage'; //
import { ProfilePage } from '@/pages/ProfilePage'; //
import { AppointmentsPage } from '@/pages/AppointmentsPage'; //
import { AdminPage } from '@/pages/AdminPage'; // AÑADIDO: Importar AdminPage
import { Page } from '@/types'; //

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>('home'); //
    const navigateTo = (page: Page) => setCurrentPage(page); //

    const renderPage = () => {
        switch (currentPage) {
            case 'register': return <RegisterPage navigateTo={navigateTo} />; //
            case 'login': return <LoginPage navigateTo={navigateTo} />; //
            case 'profile': return <ProfilePage />; //
            case 'appointments': return <AppointmentsPage />; //
            case 'admin': return <AdminPage />; // AÑADIDO: Renderizar AdminPage
            case 'home': default: return <HomePage />; //
        }
    };

    return (
        <div className={styles.appContainer}>
            <Header navigateTo={navigateTo} /> {/* */}
            <main className={styles.mainContent}>
                {renderPage()}
            </main>
            <footer className={styles.footer}>
                <p>&copy; 2025 ServiBook. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};