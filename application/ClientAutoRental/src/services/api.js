import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utilise l'URL Render en production, ou l'IP locale si tu testes sur ta machine
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://adrware-backend.onrender.com/api/'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;