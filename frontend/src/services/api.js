import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Singleton refresh promise
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      })
      .catch(err => {
        localStorage.removeItem('accessToken');
        // Only redirect to /login if not already there (prevents infinite redirect loop)
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Auto-refresh on 401 — but ONLY if we had a token (user was authenticated)
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    const hadToken = !!localStorage.getItem('accessToken');

    if (err.response?.status === 401 && !original._retry && hadToken) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
