import { Theme, alpha, Components } from '@mui/material/styles';
import { gray, orange } from '../themePrimitives';

export const feedbackCustomizations: Components<Theme> = {
  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        backgroundColor: orange[100],
        color: (theme.vars || theme).palette.text.primary,
        border: `1px solid ${alpha(orange[300], 0.5)}`,
        '& .MuiAlert-icon': { color: orange[500] },
        ...theme.applyStyles('dark', {
          backgroundColor: alpha(orange[900], 0.5),
          border: `1px solid ${alpha(orange[800], 0.5)}`,
        }),
      }),
    },
  },


  MuiDialog: {
    styleOverrides: {

      paper: ({ theme }) => ({
        borderRadius: 10,
        border: '1px solid',
        borderColor: (theme.vars || theme).palette.divider,
        backgroundImage: 'none',

        backgroundColor: (theme.vars || theme).palette.background.paper,

        ...theme.applyStyles('dark', {
          backgroundColor: '#0F1115',
        }),
      }),
    },
  },
};
