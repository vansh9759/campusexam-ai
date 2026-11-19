import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusexam_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid infinite redirect if already on login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('campusexam_token');
        localStorage.removeItem('campusexam_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
