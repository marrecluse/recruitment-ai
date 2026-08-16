import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// Public auth routes — never trigger the refresh/redirect flow on 401
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh',
                       '/auth/forgot-password', '/auth/reset-password'];

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Singleton refresh promise — ensures only one /auth/refresh call flies at a time.
// All concurrent 401s wait for the same promise instead of racing each other.
let _refreshPromise = null;

// Auto-refresh on 401 — skips public auth routes entirely
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    const isPublic = PUBLIC_ROUTES.some(r => original.url?.includes(r));

    if (err.response?.status === 401 && !original._retry && !isPublic) {
      original._retry = true;
      try {
        // Reuse an in-flight refresh if one is already pending
        if (!_refreshPromise) {
          _refreshPromise = axios.post('/api/auth/refresh', {}, { withCredentials: true })
            .finally(() => { _refreshPromise = null; });
        }
        const { data } = await _refreshPromise;
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        _refreshPromise = null;
        localStorage.removeItem('accessToken');

        if (original._skipAuthRedirect) {
          // Called from checkAuth — silent reject, let checkAuth handle it
          return Promise.reject(new Error('auth_expired'));
        }

        // Active session expired — hard redirect so no component catch fires
        window.location.href = '/login';
        return new Promise(() => {});
      }
    }

    // For public routes (login, register etc.) or non-401: let error through normally
    return Promise.reject(err);
  }
);

export default api;
