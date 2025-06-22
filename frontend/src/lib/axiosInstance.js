import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === 'development' ? 'http://localhost:8000/api' : 'https://api.onrender.com/api',
    withCredentials: true,
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
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

// Add response interceptor to handle token storage
axiosInstance.interceptors.response.use(
    (response) => {
        // Store token from login responses
        if (response.data?.data?.token) {
            localStorage.setItem('token', response.data.data.token);
        }
        return response;
    },
    (error) => {
        // Clear token on auth errors
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);