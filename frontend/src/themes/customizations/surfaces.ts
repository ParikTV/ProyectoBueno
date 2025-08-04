import { alpha, Theme, Components } from '@mui/material/styles';
import { gray } from '../themePrimitives';

export const surfacesCustomizations: Components<Theme> = {
  MuiPaper: {
    styleOverrides: {
        root: ({ theme }) => ({
            backgroundImage: 'none',
            ...theme.applyStyles('dark', {
                backgroundColor: alpha(gray[800], 0.5)
            })
        })
    }
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => {
        return {
          backgroundColor: (theme.vars || theme).palette.background.paper,
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: `1px solid ${(theme.vars || theme).palette.divider}`,
          boxShadow: 'none',
          ...theme.applyStyles('dark', {
            backgroundColor: alpha(gray[800], 0.6),
            border: `1px solid ${gray[700]}`,
          }),
        };
      },
    },
  },
};