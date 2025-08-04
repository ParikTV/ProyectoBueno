import { Theme, Components } from '@mui/material/styles';
import { tabClasses } from '@mui/material/Tab';
import { gray } from '../themePrimitives';

export const navigationCustomizations: Components<Theme> = {
  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 'fit-content' },
      indicator: ({ theme }) => ({
        backgroundColor: (theme.vars || theme).palette.grey[800],
        ...theme.applyStyles('dark', {
          backgroundColor: (theme.vars || theme).palette.grey[200],
        }),
      }),
    },
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '6px 8px', textTransform: 'none', minWidth: 'fit-content',
        minHeight: 'fit-content', color: (theme.vars || theme).palette.text.secondary,
        borderRadius: (theme.vars || theme).shape.borderRadius,
        border: '1px solid', borderColor: 'transparent',
        ':hover': {
          color: (theme.vars || theme).palette.text.primary,
          backgroundColor: gray[100], borderColor: gray[200],
        },
        [`&.${tabClasses.selected}`]: { color: gray[900] },
        ...theme.applyStyles('dark', {
          ':hover': {
            color: (theme.vars || theme).palette.text.primary,
            backgroundColor: gray[800], borderColor: gray[700],
          },
          [`&.${tabClasses.selected}`]: { color: '#fff' },
        }),
      }),
    },
  },
};