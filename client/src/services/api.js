import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor Request: Sisipkan Bearer Token otomatis jika ada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('singgah_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Handle error global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika 401 (Unauthorized) dan bukan saat mencoba login, logout client
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('singgah_token');
      localStorage.removeItem('singgah_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
