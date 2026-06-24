// utils/request.js
import axios from "axios";

export const server = import.meta.env.VITE_SERVER

const connect = axios.create({
    baseURL: server,
});

// Injeta o token em toda requisição automaticamente
connect.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token");
    if (token) config.headers["Access-Token"] = token;
    config.headers["Content-Type"] = 'application/json'
    return config;
    
});

connect.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default connect;