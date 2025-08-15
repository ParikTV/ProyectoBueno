
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { Appointment, Business } from '@/types';

import {
  Box, Typography, Paper, CircularProgress, Alert, Stack, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const getApptId = (a: Appointment) => (a.id || (a as any)._id) as string;


const QrModal: React.FC<{ appointmentId: string; onClose: () => void }> = ({ appointmentId, onClose }) => {
  const { token } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let objURL: string | null = null;
    const fetchQrCode = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/qr`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("No se pudo cargar el código QR.");
        const imageBlob = await response.blob();
        objURL = URL.createObjectURL(imageBlob);
        setQrCodeUrl(objURL);
      } catch (err: any) {
        setError(err.message);
      }
    };
    void fetchQrCode();
    return () => { if (objURL) URL.revokeObjectURL(objURL); };
  }, [appointmentId, token]);

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Escanea para validar tu cita</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        {error && <Alert severity="error">{error}</Alert>}
        {!qrCodeUrl && !error && <CircularProgress />}
        {qrCodeUrl && <img src={qrCodeUrl} alt="Código QR" style={{ width: 256, height: 256 }} />}
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          El personal del negocio escaneará este código para confirmar tu reserva.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};


const CancelEmailDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  appointmentId: string;
}> = ({ open, onClose, appointmentId }) => {
  const { token, user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [okMsg, setOkMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const sendCancelEmail = async () => {
    if (!token) return;
    setIsSending(true);
    setOkMsg('');
    setErrMsg('');
    try {
      const r = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/send-cancellation-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.detail || 'No se pudo enviar el correo.');
      }
      setOkMsg(`Enviado a ${user?.email || 'tu correo'}.`);
    } catch (e: any) {
      setErrMsg(e.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle fontWeight={700}>Cita cancelada</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 1 }}>
          Tu cita se canceló correctamente.
        </Typography>
        <Typography color="text.secondary">
          ¿Deseas recibir por correo el comprobante de cancelación ({user?.email})?
        </Typography>
        {okMsg && <Alert severity="success" sx={{ mt: 1 }}>{okMsg}</Alert>}
        {errMsg && <Alert severity="error" sx={{ mt: 1 }}>{errMsg}</Alert>}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSending || !!okMsg}>Cerrar</Button>
        <Button variant="contained" onClick={sendCancelEmail} disabled={isSending || !!okMsg}>
          {isSending ? 'Enviando…' : 'Enviar correo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


function getVisualStatus(a: Appointment): { label: string; color: 'default' | 'success' | 'warning' } {
  if (a.status === 'cancelled') return { label: 'Cancelada', color: 'default' };
  const isPast = new Date(a.appointment_time).getTime() < Date.now();
  if (isPast) return { label: 'Finalizada', color: 'warning' };
  return { label: 'Confirmada', color: 'success' };
}


const AppointmentCard: React.FC<{
  appointment: Appointment;
  business?: Business;
  onCancelled: (a: Appointment) => void;
}> = ({ appointment, business, onCancelled }) => {
  const { token } = useAuth();
  const [showQr, setShowQr] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const id = getApptId(appointment);
  const when = new Date(appointment.appointment_time);

  const isFuture = when.getTime() > Date.now();
  const isCancelled = appointment.status === 'cancelled';
  const visual = getVisualStatus(appointment);

  const handleDownloadPdf = async () => {
    if (!token) return alert("Necesitas iniciar sesión.");
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("No se pudo descargar el PDF.");
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const cancelAppointment = async () => {
    if (!token) return;
    if (!window.confirm('¿Seguro que quieres cancelar esta cita?')) return;
    try {
      const r = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error((await r.json()).detail || 'No se pudo cancelar.');
      const updated: Appointment = await r.json();
      onCancelled(updated);
      setShowCancelDialog(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <>
      {showQr && <QrModal appointmentId={id} onClose={() => setShowQr(false)} />}
      {showCancelDialog && (
        <CancelEmailDialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          appointmentId={id}
        />
      )}

      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ textDecoration: isCancelled ? 'line-through' : 'none' }}
            >
              {business?.name || 'Negocio'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {business?.address || 'Ubicación no disponible'}
            </Typography>
            {!!business?.categories?.length && (
              <Typography variant="caption" color="text.secondary">
                Categoría: {business.categories.join(', ')}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: 'action.selected', p: 2, borderRadius: 2, textAlign: { xs: 'left', sm: 'center' }, flexShrink: 0 }}>
            <Typography fontWeight="bold">
              {when.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
            <Typography color="primary" variant="h6" fontWeight="bold">
              {when.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf} disabled={isCancelled}>
            Descargar PDF
          </Button>
          <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={() => setShowQr(true)} disabled={isCancelled}>
            Ver QR
          </Button>

          <Chip label={visual.label} color={visual.color} size="small" sx={{ ml: 1 }} />

          <Box flex={1} />
          <Button variant="contained" color="error" disabled={!isFuture || isCancelled} onClick={cancelAppointment}>
            Cancelar cita
          </Button>
        </Stack>
      </Paper>
    </>
  );
};


export const AppointmentsPage: React.FC = () => {
  const { token, logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("No estás autenticado.");
        setIsLoading(false);
        return;
      }
      try {
        const r = await fetch(`${API_BASE_URL}/appointments/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!r.ok) {
          if (r.status === 401) logout();
          throw new Error("No se pudieron cargar tus citas.");
        }
        const data: Appointment[] = await r.json();
        setAppointments(data);

        const rb = await fetch(`${API_BASE_URL}/businesses/`);
        if (rb.ok) {
          const list: Business[] = await rb.json();
          const map = list.reduce((acc, b) => {
            const key = (b as any).id || (b as any)._id;
            if (key) acc[key] = b;
            return acc;
          }, {} as Record<string, Business>);
          setBusinesses(map);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [token, logout]);

  const handleCancelled = (updated: Appointment) => {
    const id = getApptId(updated);
    setAppointments(prev => prev.map(a => (getApptId(a) === id ? updated : a)));
  };

  if (isLoading) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>Mis Citas</Typography>
      <Divider sx={{ mb: 3 }} />
      {appointments.length > 0 ? (
        <Stack spacing={3}>
          {appointments.map(a => (
            <AppointmentCard
              key={getApptId(a)}
              appointment={a}
              business={businesses[a.business_id]}
              onCancelled={handleCancelled}
            />
          ))}
        </Stack>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Aún no tienes ninguna cita reservada.</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AppointmentsPage;
