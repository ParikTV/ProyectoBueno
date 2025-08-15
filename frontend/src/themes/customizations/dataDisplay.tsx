

import { Theme, Components } from '@mui/material/styles';
import { chipClasses } from '@mui/material/Chip';
import { green, orange } from '../themePrimitives';

export const dataDisplayCustomizations: Components<Theme> = {
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: '999px',
        border: '1px solid',
        [`& .${chipClasses.label}`]: {
          fontWeight: 600,
        },
        variants: [
          {
            props: { color: 'success' },
            style: {
              borderColor: green[200],
              backgroundColor: green[50],
              [`& .${chipClasses.label}`]: { color: green[600] },
              ...theme.applyStyles('dark', {
                borderColor: green[800],
                backgroundColor: green[900],
                [`& .${chipClasses.label}`]: { color: green[200] },
              }),
            },
          },
          {
            props: { color: 'warning' },
            style: {
              borderColor: orange[200],
              backgroundColor: orange[50],
              [`& .${chipClasses.label}`]: { color: orange[600] },
              ...theme.applyStyles('dark', {
                borderColor: orange[800],
                backgroundColor: orange[900],
                [`& .${chipClasses.label}`]: { color: orange[200] },
              }),
            },
          },
        ],
      }),
    },
  },
};