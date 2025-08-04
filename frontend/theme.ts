// src/theme.ts

import { createTheme } from '@mui/material/styles';

// Tu nueva paleta de colores
const palette = {
  navy: '#2F4156',
  teal: '#567C8D',
  skyBlue: '#C8D9E6',
  beige: '#F5EFEB',
  white: '#FFFFFF',
};

// Se crea el tema de MUI usando tu paleta
export const theme = createTheme({
  palette: {
    primary: {
      main: palette.navy, // Color principal para botones, cabeceras, etc.
      light: palette.teal, // Una versión más clara del primario
      contrastText: palette.white, // Color del texto sobre el color primario
    },
    secondary: {
      main: palette.teal, // Color secundario para acentos y otros elementos
      contrastText: palette.white,
    },
    background: {
      default: palette.beige, // Color de fondo principal de la app
      paper: palette.white,   // Color de fondo para tarjetas, modales, etc.
    },
    text: {
      primary: palette.navy,    // Color principal del texto
      secondary: palette.teal,  // Color secundario para textos menos importantes
    },
  },
  typography: {
    fontFamily: 'sans-serif', // Mantenemos la fuente por ahora
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
  },
  components: {
    // Estilo personalizado para el componente 'Paper' (usado en la barra de búsqueda)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Elimina cualquier gradiente o imagen de fondo
        },
      },
    },
    // Estilo personalizado para los botones
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px', // Botones más redondeados
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '10px 24px',
        },
      },
    },
  },
});