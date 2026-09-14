import axios from 'axios'

// Cliente axios. La inyección del JWT (Authorization: Bearer <token>) se
// completa en la etapa de programación del frontend, junto con useAuth.ts.

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('oasi_token') // placeholder, reemplazar por Cognito session
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
