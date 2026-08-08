import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login (if not already on a login page)
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      
      const isAuthPage = window.location.pathname.includes('login') || window.location.pathname.includes('signup');
      if (!isAuthPage) {
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
