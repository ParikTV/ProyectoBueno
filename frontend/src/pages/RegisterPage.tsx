

import React, { useState } from 'react';
import { Box, Button, Checkbox, CssBaseline, Divider, FormControlLabel, FormLabel, FormControl, Link, TextField, Typography, Stack, Card, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useGoogleLogin } from '@react-oauth/google';

import { Page } from '@/types';
import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { GoogleIcon } from '@/components/Icons';

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: '100%',
  minHeight: '80vh',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

interface RegisterPageProps {
    navigateTo: (page: Page) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigateTo }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    const handleBackendLogin = async (token: string, provider: 'google' | 'facebook') => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/login/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || `Error con el registro de ${provider}.`);
            
            login(data.access_token);
            navigateTo('home');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => handleBackendLogin(tokenResponse.access_token, 'google'),
        onError: () => setError('El registro con Google falló.'),
    });


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Ocurrió un error al registrar.');
            setSuccess(`¡Registro exitoso! Serás redirigido para iniciar sesión.`);
            setTimeout(() => navigateTo('login'), 2500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <CssBaseline enableColorScheme />
            <SignUpContainer>
                <Card sx={{ py: 4, px: 3, width: '100%', maxWidth: '450px', boxShadow: 'lg' }}>
                    <Typography component="h1" variant="h4" sx={{ width: '100%', fontWeight: 'bold' }}>
                        Crear una Cuenta
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl>
                            <FormLabel htmlFor="email">Correo Electrónico</FormLabel>
                            <TextField required fullWidth id="email" placeholder="tu@email.com" name="email" autoComplete="email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">Contraseña</FormLabel>
                            <TextField required fullWidth name="password" placeholder="••••••" type="password" id="password" autoComplete="new-password" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="confirmPassword">Confirmar Contraseña</FormLabel>
                            <TextField required fullWidth name="confirmPassword" placeholder="••••••" type="password" id="confirmPassword" variant="outlined" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </FormControl>
                        <FormControlLabel
                            control={<Checkbox value="allowExtraEmails" color="primary" />}
                            label="Quiero recibir notificaciones y ofertas por correo."
                        />
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}
                        <Button type="submit" fullWidth variant="contained" disabled={isLoading}>
                            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>
                    </Box>
                    <Divider sx={{ my: 2 }}>o</Divider>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {}
                        <Button fullWidth variant="outlined" onClick={() => googleLogin()} startIcon={<GoogleIcon />}>
                            Registrarse con Google
                        </Button>
                        <Typography sx={{ textAlign: 'center', mt: 1 }}>
                            ¿Ya tienes una cuenta?{' '}
                            <Link component="button" variant="body2" onClick={() => navigateTo('login')} sx={{ fontWeight: 'bold' }}>
                                Inicia sesión
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </SignUpContainer>
        </>
    );
};