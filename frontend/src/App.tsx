

import { useState } from 'react';
import { Box, Typography } from '@mui/material';

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

export type ExtendedPage = Page | 'ownerDashboard' | 'businessDetails' | 'ownerAppointments'| 'home'
  | 'login'
  | 'register' | 'appointments'| 'profile' | 'admin';

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
        <MapProvider>
            <Box sx={(theme) => ({
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'fixed',
                    zIndex: -1,
                    inset: 0,
                    backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(220, 35%, 97%), hsl(0, 0%, 100%))',
                    ...theme.applyStyles('dark', {
                        backgroundImage: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.3), hsl(220, 30%, 5%))',
                    }),
                    transition: 'background-image 0.3s ease-in-out',
                },
            })}>
                <Header navigateTo={navigateTo} />
                <Box component="main" sx={{
                    maxWidth: '1280px',
                    mx: 'auto',
                    p: { xs: 2, md: 3 },
                    width: '100%',
                    flexGrow: 1,
                }}>
                    {renderPage()}
                </Box>
                <Box component="footer" sx={{
                    bgcolor: 'background.paper',
                    color: 'text.secondary',
                    py: 3,
                    textAlign: 'center',
                    flexShrink: 0,
                    borderTop: 1,
                    borderColor: 'divider'
                }}>
                    <Typography variant="body2">&copy; {new Date().getFullYear()} ServiBook. Todos los derechos reservados.</Typography>
                </Box>
            </Box>
        </MapProvider>
    );
};