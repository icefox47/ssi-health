import axios from 'axios';

export const getApiBase = () => {
  const host = window.location.hostname;
  const port = window.location.protocol === 'https:' ? '8001' : '8000';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}:${port}`;
};

const API_URL = `${getApiBase()}/api/issuer`;

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('issuer_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('issuer_token');
      // Attempt to go to login. We'll handle this primarily in React state, but this is a fallback
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
