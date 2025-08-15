

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Chip,
} from '@mui/material';

interface OwnerAppointmentsPageProps {
  businessId: string;
}


type ApptWithUser = {
  id?: string; _id?: string;
  business_id: string;
  user_id: string;
  appointment_time: string;
  status: 'confirmed' | 'cancelled';
  employee_id?: string | null;
  user?: {
    id?: string; _id?: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
};

const getId = (o: { id?: string; _id?: string } | null | undefined) =>
  (o?.id as string) || (o?._id as string) || '';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function visualStatus(a: ApptWithUser): { label: string; color: 'success' | 'warning' | 'default' } {
  if (a.status === 'cancelled') return { label: 'Cancelada', color: 'default' };
  const isPast = new Date(a.appointment_time).getTime() < Date.now();
  if (isPast) return { label: 'Finalizada', color: 'warning' };
  return { label: 'Confirmada', color: 'success' };
}

export const OwnerAppointmentsPage: React.FC<OwnerAppointmentsPageProps> = ({ businessId }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<ApptWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const r = await fetch(`${API_BASE_URL}/appointments/business/${businessId}/with-users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!r.ok) throw new Error('No se pudieron cargar las reservas del negocio.');
        const data: ApptWithUser[] = await r.json();
        setItems(data);
      } catch (e: any) {
        setError(e.message || 'Error cargando reservas.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [businessId, token]);

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Reservas del Negocio
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {items.length > 0 ? (
        <Stack spacing={2}>
          {items.map((a) => {
            const id = getId(a);
            const name = a.user?.full_name || a.user?.email || 'Usuario sin nombre';
            const email = a.user?.email || 'Email no disponible';
            const vs = visualStatus(a);

            return (
              <Paper
                key={id}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 3,
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  gap={2}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {email}
                    </Typography>
                    {}
                    {/* {a.employee_id && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Empleado asignado: {a.employee_id}
                      </Typography>
                    )} */}
                  </Box>

                  <Box
                    sx={{
                      bgcolor: 'action.selected',
                      px: 2,
                      py: 1.25,
                      borderRadius: 2,
                      textAlign: 'center',
                      minWidth: 200,
                    }}
                  >
                    <Typography fontWeight={700}>{fmtDate(a.appointment_time)}</Typography>
                    <Typography color="primary" variant="h6" fontWeight={900}>
                      {fmtTime(a.appointment_time)}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Chip label={vs.label} color={vs.color} size="small" />
              </Paper>
            );
          })}
        </Stack>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
          <Typography color="text.secondary">
            Este negocio aún no tiene ninguna cita reservada.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default OwnerAppointmentsPage;
