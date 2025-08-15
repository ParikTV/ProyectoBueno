

import { createTheme } from '@mui/material/styles';


const palette = {
  navy: '#2F4156',
  teal: '#567C8D',
  skyBlue: '#C8D9E6',
  beige: '#F5EFEB',
  white: '#FFFFFF',
};


export const theme = createTheme({
  palette: {
    primary: {
      main: palette.navy,
      light: palette.teal,
      contrastText: palette.white,
    },
    secondary: {
      main: palette.teal,
      contrastText: palette.white,
    },
    background: {
      default: palette.beige,
      paper: palette.white,
    },
    text: {
      primary: palette.navy,
      secondary: palette.teal,
    },
  },
  typography: {
    fontFamily: 'sans-serif', 
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
  },
  components: {

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', 
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px', 
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '10px 24px',
        },
      },
    },
  },
});