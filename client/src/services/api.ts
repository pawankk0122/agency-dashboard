import axios from 'axios';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        setAccessToken(null);
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);
