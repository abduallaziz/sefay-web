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
    register: (body: { name: string; email: string; password: string; phone?: string }) =>
      axiosInstance.post('/auth/register', body),
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
    refund: (id: string, body: { mode: 'full' | 'partial'; refund_amount?: number; items?: { service_name: string; price: number; qty: number }[] }) =>
      axiosInstance.patch(`/orders/${id}/refund`, body),
    create: (body: any) =>
      axiosInstance.post('/orders', body),
  },
  items: {
    getAll: () => axiosInstance.get('/items/all'),
    getActive: () => axiosInstance.get('/items'),
    create: (body: any) => axiosInstance.post('/items', body),
    update: (id: string, body: any) => axiosInstance.put(`/items/${id}`, body),
    delete: (id: string) => axiosInstance.delete(`/items/${id}`),
    hardDelete: (id: string) => axiosInstance.delete(`/items/${id}/hard`),
  },
  variants: {
    getGroups: (itemId: string) =>
      axiosInstance.get(`/items/${itemId}/variants`),
    createGroup: (itemId: string, body: any) =>
      axiosInstance.post(`/items/${itemId}/variants`, body),
    updateGroup: (groupId: string, body: any) =>
      axiosInstance.put(`/items/variants/groups/${groupId}`, body),
    deleteGroup: (groupId: string) =>
      axiosInstance.delete(`/items/variants/groups/${groupId}`),
    createOption: (groupId: string, body: any) =>
      axiosInstance.post(`/items/variants/groups/${groupId}/options`, body),
    updateOption: (optionId: string, body: any) =>
      axiosInstance.put(`/items/variants/options/${optionId}`, body),
    deleteOption: (optionId: string) =>
      axiosInstance.delete(`/items/variants/options/${optionId}`),
    adjustStock: (optionId: string, body: any) =>
      axiosInstance.post(`/items/variants/options/${optionId}/stock`, body),
    getLogs: (itemId: string) =>
      axiosInstance.get(`/items/${itemId}/inventory-logs`),
    getLowStock: () =>
      axiosInstance.get('/items/low-stock/alerts'),
  },
  customers: {
    getAll: () => axiosInstance.get('/customers'),
    search: (q: string) =>
      axiosInstance.get(`/customers/search?q=${q}`),
  },
  coupons: {
    getAll: () => axiosInstance.get('/coupons'),
    create: (body: any) => axiosInstance.post('/coupons', body),
    update: (id: string, body: any) => axiosInstance.put(`/coupons/${id}`, body),
    toggle: (id: string, active: boolean) =>
      axiosInstance.put(`/coupons/${id}`, { active }),
  },
  shifts: {
    current: () => axiosInstance.get('/shifts/current'),
  },
  expenses: {
    getAll: (from?: string, to?: string) =>
      axiosInstance.get(`/expenses${from && to ? `?from=${from}&to=${to}` : ''}`),
    create: (body: any) => axiosInstance.post('/expenses', body),
    update: (id: string, body: any) => axiosInstance.put(`/expenses/${id}`, body),
    delete: (id: string) => axiosInstance.delete(`/expenses/${id}`),
  },


  appointments: {
    getAll: (date?: string) =>
      axiosInstance.get(`/appointments${date ? `?date=${date}` : ''}`),
    create: (body: any) =>
      axiosInstance.post('/appointments', body),
    update: (id: string, body: any) =>
      axiosInstance.patch(`/appointments/${id}`, body),
    delete: (id: string) =>
      axiosInstance.delete(`/appointments/${id}`),
    getSlots: (worker_id: string, date: string) =>
      axiosInstance.get(`/appointments/slots?worker_id=${worker_id}&date=${date}`),
    getAvailability: (worker_id?: string) =>
      axiosInstance.get(`/appointments/availability${worker_id ? `?worker_id=${worker_id}` : ''}`),
    setAvailability: (body: any) =>
      axiosInstance.post('/appointments/availability', body),
  },
  workers: {
    getAll: () => axiosInstance.get('/workers'),
  },
}

export default axiosInstance