import { useEffect, useMemo, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Rating,
  Avatar,
  Chip,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import ReviewsIcon from '@mui/icons-material/Reviews';
import StarIcon from '@mui/icons-material/Star';

type ReviewReply = {
  text: string;
  role: 'owner' | 'admin';
  created_at: string;
};

type Review = {
  id?: string;
  _id?: string;
  business_id: any;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reply?: ReviewReply;
};

type UserLite = {
  id?: string;
  _id?: string;
  full_name?: string;
  email?: string;
  profile_picture_url?: string; 
};

const normalizeId = (x: any): string | null => {
  if (!x) return null;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (typeof x === 'object') return (x.$oid || x._id || x.id) ?? null;
  return null;
};

const sameId = (a: any, b: any) => {
  const sa = normalizeId(a);
  const sb = normalizeId(b);
  return !!sa && !!sb && sa === sb;
};

const fetchJSON = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {  }
  if (!res.ok) {
    const detail = data?.detail ?? data?.message ?? text ?? 'Error';
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: any) => d.msg || d.error || d.detail).join(' | ')
        : JSON.stringify(detail);
    throw new Error(msg);
  }
  return data as T;
};

const headersWithAuth = (token?: string | null, extra?: Record<string, string>) => {
  const h = new Headers(extra ?? {});
  if (token) h.set('Authorization', `Bearer ${token}`);
  return h;
};

export default function ReviewsSection({ businessId }: { businessId: string }) {
  const { token, user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserLite>>({});
  const [rating, setRating] = useState<number | null>(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const REVIEWS_LIST_URL = `${API_BASE_URL}/reviews/business/${businessId}`;
  const REVIEWS_CREATE_URL = `${API_BASE_URL}/reviews/`;
  const ELIGIBILITY_URL = `${API_BASE_URL}/reviews/eligibility/${businessId}`;
  const MY_APPTS_URL = `${API_BASE_URL}/appointments/me`;

  const resolveAppointmentId = useCallback(async (): Promise<string | null> => {
    if (!token) return null;

    try {
      const elig: any = await fetchJSON(ELIGIBILITY_URL, {
        headers: headersWithAuth(token),
      });
      if (elig?.eligible) {
        if (elig?.appointment_id) return String(elig.appointment_id);
      } else {
        return null;
      }
    } catch {
    }

    try {
      const myApps: any[] = await fetchJSON(MY_APPTS_URL, {
        headers: headersWithAuth(token),
      });
      const now = Date.now();
      const candidates = (myApps || []).filter((a) => {
        const bid =
          normalizeId(a.business_id) ??
          normalizeId(a.business?.id) ??
          normalizeId(a.business?._id);
        const status = (a.status || '').toLowerCase();
        const t = a.appointment_time ? new Date(a.appointment_time).getTime() : 0;
        const notCancelled = status !== 'cancelled' && status !== 'canceled';
        const passedOrNoTime = !t || t <= now;
        return sameId(bid, businessId) && notCancelled && passedOrNoTime;
      });

      if (!candidates.length) return null;

      candidates.sort((x, y) => {
        const tx = x.appointment_time ? new Date(x.appointment_time).getTime() : 0;
        const ty = y.appointment_time ? new Date(y.appointment_time).getTime() : 0;
        return ty - tx;
      });

      const top = candidates[0];
      const id =
        normalizeId(top?._id) ??
        normalizeId(top?.id);
      return id || null;
    } catch {
      return null;
    }
  }, [businessId, token, ELIGIBILITY_URL, MY_APPTS_URL]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJSON<Review[]>(REVIEWS_LIST_URL);
      setReviews(data);

      const uniqUserIds = Array.from(new Set(data.map(d => d.user_id)));
      const entries: Record<string, UserLite> = {};
      await Promise.all(uniqUserIds.map(async (uid) => {
        try {
          const ru = await fetch(`${API_BASE_URL}/users/${uid}`);
          if (ru.ok) entries[uid] = await ru.json();
        } catch {  }
      }));
      setUsersMap(entries);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [REVIEWS_LIST_URL]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const run = async () => {
      const id = await resolveAppointmentId();
      setAppointmentId(id);
    };
    void run();
  }, [resolveAppointmentId]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    const s = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

  const submit = async () => {
    if (!token) return alert('Inicia sesión para opinar.');
    if (!rating || rating < 1) return alert('Selecciona una puntuación.');
    if (!comment.trim()) return alert('Escribe un comentario.');

    setSubmitting(true);
    setError('');

    try {
      let apptId = appointmentId;
      if (!apptId) {
        apptId = await resolveAppointmentId();
        setAppointmentId(apptId);
      }
      if (!apptId) {
        setError('No pudimos validar una cita elegible para este negocio.');
        return;
      }

      const headers = headersWithAuth(token, { 'Content-Type': 'application/json' });

      await fetchJSON(REVIEWS_CREATE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          business_id: businessId,
          appointment_id: apptId,
          rating,
          comment: comment.trim(),
        }),
      });

      setRating(5);
      setComment('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canPost = Boolean(token);

  return (
    <Paper variant="outlined" sx={{ mt: 4, p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ReviewsIcon fontSize="small" />
        <Typography variant="h5" fontWeight={700}>Reseñas</Typography>
      </Stack>

      {}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Rating value={avg} precision={0.1} readOnly />
        <Typography fontWeight={700}>{avg.toFixed(1)}</Typography>
        <Typography color="text.secondary">· {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</Typography>
      </Stack>

      {}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              src={user?.profile_picture_url ?? undefined}
              alt={user?.full_name || user?.email || 'Usuario'}
            >
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Typography fontWeight={600}>{user?.full_name || user?.email || 'Tú'}</Typography>
            {appointmentId ? (
              <Chip size="small" label="Puedes opinar" color="success" variant="outlined" sx={{ ml: 'auto' }} />
            ) : (
              <Chip size="small" label="Validando cita…" variant="outlined" sx={{ ml: 'auto' }} />
            )}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography>Puntuación:</Typography>
            <Rating
              value={rating}
              onChange={(_, v) => setRating(v)}
              icon={<StarIcon fontSize="inherit" />}
            />
          </Stack>
          <TextField
            multiline minRows={3}
            placeholder="Cuéntanos tu experiencia…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={submit} disabled={submitting || !canPost}>
              {submitting ? 'Publicando…' : 'Publicar reseña'}
            </Button>
            {error && <Alert severity="warning" sx={{ ml: 1 }}>{error}</Alert>}
          </Stack>
        </Stack>
      </Paper>

      {}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={22} /></Box>
      ) : reviews.length === 0 ? (
        <Typography color="text.secondary">Aún no hay reseñas.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {reviews.map(r => {
            const rid = (r.id || (r as any)._id) as string;
            const u = usersMap[r.user_id];
            const when = new Date(r.created_at);
            return (
              <Paper key={rid} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5}>
                  <Avatar
                    src={u?.profile_picture_url ?? undefined}
                    alt={u?.full_name || 'Usuario'}
                  >
                    {(u?.full_name || u?.email || 'U')?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontWeight={700}>{u?.full_name || u?.email || 'Usuario'}</Typography>
                      <Rating value={r.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {when.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Stack>
                    <Typography sx={{ mt: .5 }}>{r.comment}</Typography>

                    {!!r.reply && (
                      <Paper
                        variant="outlined"
                        sx={{
                          mt: 1,
                          p: 1,
                          borderRadius: 2,
                          bgcolor: r.reply.role === 'admin' ? 'warning.50' : 'action.hover',
                          borderColor: r.reply.role === 'admin' ? 'warning.light' : 'divider',
                        }}
                      >
                        <Typography variant="caption" fontWeight={700}>
                          {r.reply.role === 'admin' ? 'Respuesta del admin' : 'Respuesta del propietario'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: .5 }}>
                          {r.reply.text}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
