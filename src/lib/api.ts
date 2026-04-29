import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('session')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const api = {
  auth: {
    login: (email: string, password: string) =>
      axiosInstance.post('/auth/login', { email, password }),
  },
  orders: {
    getAll: (date?: string) =>
      axiosInstance.get(`/orders${date ? `?date=${date}` : ''}`),
    summary: (date?: string) =>
      axiosInstance.get(`/orders/summary${date ? `?date=${date}` : ''}`),
    getByRange: (from: string, to: string) =>
      axiosInstance.get(`/orders/range?from=${from}&to=${to}`),
    summaryByRange: (from: string, to: string) =>
      axiosInstance.get(`/orders/summary/range?from=${from}&to=${to}`),
  },
  services: {
    getAll: () => axiosInstance.get('/services/all'),
    getActive: () => axiosInstance.get('/services'),
    create: (body: any) => axiosInstance.post('/services', body),
    update: (id: string, body: any) => axiosInstance.put(`/services/${id}`, body),
    delete: (id: string) => axiosInstance.delete(`/services/${id}`),
    hardDelete: (id: string) => axiosInstance.delete(`/services/${id}/hard`),
  },
  customers: {
    getAll: () => axiosInstance.get('/customers'),
    search: (plate: string, tenant_id: string) =>
      axiosInstance.get(`/customers/search?plate=${plate}&tenant_id=${tenant_id}`),
  },
  coupons: {
    getAll: () => axiosInstance.get('/coupons'),
    create: (body: any) => axiosInstance.post('/coupons', body),
    update: (id: string, body: any) => axiosInstance.put(`/coupons/${id}`, body),
    toggle: (id: string, active: boolean) =>
      axiosInstance.put(`/coupons/${id}`, { active }),
    delete: (id: string) => axiosInstance.delete(`/coupons/${id}`),
  },
  shifts: {
    current: () => axiosInstance.get('/shifts/current'),
  },
  expenses: {
    getAll: (from?: string, to?: string) =>
      axiosInstance.get(`/expenses${from && to ? `?from=${from}&to=${to}` : ''}`),
    create: (body: any) => axiosInstance.post('/expenses', body),
    delete: (id: string) => axiosInstance.delete(`/expenses/${id}`),
  },
}

export default axiosInstance