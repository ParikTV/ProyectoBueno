import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ExtendedPage } from '@/App';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider
} from '@mui/material';
import ColorModeSelect from '@/themes/ColorModeSelect';

interface HeaderProps {
  navigateTo: (page: ExtendedPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
  const { token, logout, user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigateTo('home');
  };

  const handleNavigate = (page: ExtendedPage) => {
    handleClose();
    navigateTo(page);
  };

  const avatarSrc: string | undefined = user?.profile_picture_url ?? undefined;
  const avatarAlt = user?.full_name || user?.email || 'Usuario';
  const avatarFallback = (user?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <AppBar position="static" elevation={1} color="default" sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 'bold', cursor: 'pointer' }}
          onClick={() => navigateTo('home')}
        >
          ServiBook
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {token && user ? (
            <>
              {}
              <IconButton onClick={handleMenu} size="small">
                <Avatar sx={{ width: 32, height: 32 }} src={avatarSrc} alt={avatarAlt}>
                  {avatarFallback}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => handleNavigate('profile')}>Mi Perfil</MenuItem>
                <MenuItem onClick={() => handleNavigate('appointments')}>Mis Citas</MenuItem>
                {user.role === 'dueño' && (
                  <MenuItem onClick={() => handleNavigate('ownerDashboard')}>Mi Negocio</MenuItem>
                )}
                {user.role === 'admin' && (
                  <MenuItem onClick={() => handleNavigate('admin')}>Panel Admin</MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigateTo('login')}>
                Iniciar Sesión
              </Button>
              <Button variant="contained" onClick={() => navigateTo('register')}>
                Registrarse
              </Button>
            </>
          )}
          <ColorModeSelect size="small" />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
