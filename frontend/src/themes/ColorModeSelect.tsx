

import * as React from 'react';
import { useColorScheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectProps } from '@mui/material/Select';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import Box from '@mui/material/Box';

export default function ColorModeSelect(props: SelectProps) {
  const { mode, setMode } = useColorScheme();
  if (!mode) {
    return null;
  }
  return (
    <Select
      value={mode}
      onChange={(event) => setMode(event.target.value as 'light' | 'dark' | 'system')}
      {...props}
      sx={{
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        },
        ...props.sx,
      }}
    >
      <MenuItem value="light">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightModeIcon fontSize="small" /> Light
        </Box>
      </MenuItem>
      <MenuItem value="dark">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DarkModeIcon fontSize="small" /> Dark
        </Box>
      </MenuItem>
      <MenuItem value="system">System</MenuItem>
    </Select>
  );
}