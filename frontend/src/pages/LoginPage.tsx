// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { Box, Button, Checkbox, CssBaseline, Divider, FormControlLabel, FormLabel, FormControl, Link, TextField, Typography, Stack, Card } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useAuth } from '@/hooks/useAuth';
import { Page } from '@/types';
import { API_BASE_URL } from '@/services/api';
import { GoogleIcon, FacebookIcon } from '@/components/Icons';
import ForgotPassword from '@/components/ForgotPassword'; // Importamos el nuevo componente

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100%',
  minHeight: '80vh',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

interface LoginPageProps {
    navigateTo: (page: Page) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigateTo }) => {
    // Tu lógica de estado original
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false); // Estado para el diálogo de "Olvidé contraseña"

    // Lógica del diálogo
    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Tu lógica de envío original
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        try {
            const response = await fetch(`${API_BASE_URL}/login/access-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Error al iniciar sesión.');
            login(data.access_token);
            navigateTo('home');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <CssBaseline enableColorScheme />
            <SignInContainer>
                <Card sx={{ py: 4, px: 3, width: '100%', maxWidth: '450px', boxShadow: 'lg' }}>
                    <Typography component="h1" variant="h4" sx={{ width: '100%', fontWeight: 'bold' }}>
                        Iniciar Sesión
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                        <FormControl>
                            <FormLabel htmlFor="email">Correo Electrónico</FormLabel>
                            <TextField
                                id="email"
                                type="email"
                                name="email"
                                placeholder="tu@email.com"
                                autoComplete="email"
                                required
                                fullWidth
                                variant="outlined"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">Contraseña</FormLabel>
                            <TextField
                                name="password"
                                placeholder="••••••"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                required
                                fullWidth
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FormControl>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <FormControlLabel control={<Checkbox value="remember" color="primary" />} label="Recordarme" />
                            <Link component="button" type="button" onClick={handleClickOpen} variant="body2">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </Box>
                        <ForgotPassword open={open} handleClose={handleClose} />
                        {error && <Typography color="error" sx={{ textAlign: 'center' }}>{error}</Typography>}
                        <Button type="submit" fullWidth variant="contained" disabled={isLoading}>
                            {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </Button>
                    </Box>
                    <Divider sx={{ my: 2 }}>o</Divider>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button fullWidth variant="outlined" startIcon={<GoogleIcon />}>
                            Continuar con Google
                        </Button>
                        <Button fullWidth variant="outlined" startIcon={<FacebookIcon />}>
                            Continuar con Facebook
                        </Button>
                        <Typography sx={{ textAlign: 'center', mt: 1 }}>
                            ¿No tienes una cuenta?{' '}
                            <Link component="button" variant="body2" onClick={() => navigateTo('register')} sx={{ fontWeight: 'bold' }}>
                                Regístrate
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </SignInContainer>
        </>
    );
};