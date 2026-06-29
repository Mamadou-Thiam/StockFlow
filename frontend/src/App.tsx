import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import CategoriesPage from './pages/CategoriesPage';
import SalesPage from './pages/SalesPage';
import NewSalePage from './pages/NewSalePage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import ReportsPage from './pages/ReportsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCompaniesPage from './pages/AdminCompaniesPage';
import AdminCompanyDetailPage from './pages/AdminCompanyDetailPage';
import useAuthStore from './store/authStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

const HomeRoute: React.FC = () => {
  const { user } = useAuthStore();
  if (user?.role === 'super_admin') return <AdminDashboardPage />;
  return <DashboardPage />;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<HomeRoute />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProtectedRoute roles={['super_admin', 'admin']}><ProductFormPage /></ProtectedRoute>} />
        <Route path="products/:id/edit" element={<ProtectedRoute roles={['super_admin', 'admin']}><ProductFormPage /></ProtectedRoute>} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<NewSalePage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="users" element={<ProtectedRoute roles={['super_admin', 'admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="activity" element={<ProtectedRoute roles={['super_admin', 'admin']}><ActivityLogPage /></ProtectedRoute>} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="admin/companies" element={<ProtectedRoute roles={['super_admin']}><AdminCompaniesPage /></ProtectedRoute>} />
        <Route path="admin/companies/:id" element={<ProtectedRoute roles={['super_admin']}><AdminCompanyDetailPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
