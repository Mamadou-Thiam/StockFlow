import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post('/api/auth/refresh-token', { refreshToken });
        const { accessToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { companyName: string; email: string; password: string; firstName: string; lastName: string }) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
};

export const productAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData | any) => api.post('/products', data),
  update: (id: string, data: FormData | any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  importExcel: (data: FormData) => api.post('/products/import', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  exportExcel: () => api.get('/products/export', { responseType: 'blob' }),
};

export const categoryAPI = {
  getAll: (params?: any) => api.get('/categories', { params }),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const clientAPI = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const saleAPI = {
  getAll: (params?: any) => api.get('/sales', { params }),
  getById: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  returnSale: (id: string, data?: any) => api.post(`/sales/${id}/return`, data),
  getStats: (params?: any) => api.get('/sales/stats', { params }),
};

export const invoiceAPI = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  generatePdf: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  sendByEmail: (id: string) => api.post(`/invoices/${id}/send`),
  updateStatus: (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  getNextNumber: () => api.get('/invoices/next-number'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenue: (params?: any) => api.get('/dashboard/revenue', { params }),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getRecentSales: () => api.get('/dashboard/recent-sales'),
  getStockStats: () => api.get('/dashboard/stock-stats'),
};

export const userAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const companyAPI = {
  get: () => api.get('/company'),
  update: (data: any) => api.put('/company', data),
  uploadLogo: (data: FormData) => api.post('/company/logo', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const activityAPI = {
  getAll: (params?: any) => api.get('/activities', { params }),
};

export const adminAPI = {
  getCompanies: (params?: any) => api.get('/admin/companies', { params }),
  getCompany: (id: string) => api.get(`/admin/companies/${id}`),
  updateCompany: (id: string, data: any) => api.put(`/admin/companies/${id}`, data),
  deleteCompany: (id: string) => api.delete(`/admin/companies/${id}`),
  getCompanyUsers: (id: string, params?: any) => api.get(`/admin/companies/${id}/users`, { params }),
  getStats: () => api.get('/admin/stats'),
};

export default api;
