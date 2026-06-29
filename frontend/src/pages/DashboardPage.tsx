import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Spin, Progress, Tag, Space, DatePicker } from 'antd';
import {
  ShoppingOutlined,
  InboxOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  totalClients: number;
  outstandingInvoices: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  revenue: number;
  quantity: number;
}

interface RecentSale {
  _id: string;
  createdAt: string;
  invoiceNumber: string;
  clientId?: { firstName: string; lastName: string } | null;
  total: number;
  status: string;
}

interface StockCategory {
  name: string;
  value: number;
  color?: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  quantity: number;
  minStock: number;
}

const PIE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

import { formatCurrency } from '../utils/format';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(value);

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [stockCategories, setStockCategories] = useState<StockCategory[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, revenueRes, topRes, salesRes, stockRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRevenue({ period: 30 }),
          dashboardAPI.getTopProducts(),
          dashboardAPI.getRecentSales(),
          dashboardAPI.getStockStats(),
        ]);

        setStats(statsRes.data.data);
        setRevenue(revenueRes.data.data);
        setTopProducts(topRes.data.data);
        setRecentSales(salesRes.data.data);
        setStockCategories(stockRes.data.data.categories ?? stockRes.data.data);
        setLowStockProducts(stockRes.data.data.lowStock ?? []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement du tableau de bord');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="shadow-md">
          <div className="text-center">
            <WarningOutlined className="text-4xl text-red-500 mb-4" />
            <Title level={4} type="danger">{error}</Title>
          </div>
        </Card>
      </div>
    );
  }

  const salesColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Numéro facture',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Client',
      dataIndex: 'clientId',
      key: 'clientId',
      render: (client: { firstName: string; lastName: string } | null | undefined) =>
        client ? `${client.firstName} ${client.lastName}` : '-',
    },
    {
      title: 'Montant',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          completed: 'green',
          cancelled: 'red',
          returned: 'orange',
          draft: 'default',
          sent: 'blue',
          paid: 'green',
          overdue: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  const lowStockColumns = [
    {
      title: 'Produit',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: LowStockProduct) => (
        <Space>
          <WarningOutlined className="text-amber-500" />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (value: number) => (
        <span className={value <= 0 ? 'text-red-500 font-semibold' : 'text-amber-500'}>{value}</span>
      ),
    },
    {
      title: 'Seuil',
      dataIndex: 'minStock',
      key: 'minStock',
      align: 'right' as const,
      render: (value: number) => value,
    },
    {
      title: 'Progression',
      key: 'progress',
      render: (_: unknown, record: LowStockProduct) => (
        <Progress
          percent={record.minStock > 0 ? Math.min(100, (record.quantity / record.minStock) * 100) : 100}
          size="small"
          status={record.quantity <= record.minStock ? 'exception' : 'active'}
          showInfo={false}
        />
      ),
    },
  ];

  const totalStock = stockCategories.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <div className="space-y-6">
      <Title level={3} className="!mb-6">Tableau de bord</Title>

      {/* Top Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card className="stat-card" hoverable style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}>
            <div className="flex items-center justify-between">
              <Statistic
                title="Chiffre d'affaires du jour"
                value={stats?.revenueToday ?? 0}
                formatter={(v) => formatCurrency(Number(v))}
                valueStyle={{ color: '#22c55e' }}
              />
              <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <DollarOutlined className="text-green-500 text-xl" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card className="stat-card" hoverable style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}>
            <div className="flex items-center justify-between">
              <Statistic
                title="Ventes du jour"
                value={stats?.totalSalesToday ?? 0}
                formatter={(v) => formatNumber(Number(v))}
                valueStyle={{ color: '#1677ff' }}
              />
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <ShoppingOutlined className="text-blue-500 text-xl" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card className="stat-card" hoverable style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}>
            <div className="flex items-center justify-between">
              <Statistic
                title="Produits en stock"
                value={stats?.totalProducts ?? 0}
                formatter={(v) => formatNumber(Number(v))}
                valueStyle={{ color: '#722ed1' }}
              />
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <InboxOutlined className="text-purple-500 text-xl" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card className="stat-card" hoverable style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}>
            <div className="flex items-center justify-between">
              <Statistic
                title="Clients"
                value={stats?.totalClients ?? 0}
                formatter={(v) => formatNumber(Number(v))}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <TeamOutlined className="text-orange-500 text-xl" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Card
        title="Évolution des ventes (30 jours)"
        className="stat-card"
        hoverable
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={revenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={(val: string) => dayjs(val).format('DD/MM')}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrency(v)} />
            <Tooltip
              labelFormatter={(val: string) => dayjs(val).format('DD/MM/YYYY')}
              formatter={(value: number) => [formatCurrency(value), 'Revenu']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1677ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Products & Recent Sales */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title="Top 5 produits par revenu" className="stat-card" hoverable style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topProducts.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenu']} />
                <Bar dataKey="revenue" fill="#1677ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title="Dernières ventes" className="stat-card" hoverable style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}>
            <Table
              dataSource={recentSales.slice(0, 10)}
              columns={salesColumns}
              rowKey="_id"
              pagination={false}
              size="small"
              scroll={{ x: 500 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Stock Stats & Low Stock */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title="Répartition du stock par catégorie" className="stat-card" hoverable style={{ flex: 1, display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}>
            {stockCategories.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stockCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stockCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatNumber(value), 'Articles']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                  {stockCategories.map((cat, index) => (
                    <Space key={cat.name} size={4}>
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {cat.name} ({formatNumber(cat.value)})
                      </span>
                    </Space>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">Aucune donnée de stock</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card
            title={
              <Space>
                <WarningOutlined className="text-amber-500" />
                <span>Produits en rupture de stock</span>
              </Space>
            }
            className="stat-card"
            hoverable
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
          >
            {lowStockProducts.length > 0 ? (
              <Table
                dataSource={lowStockProducts}
                columns={lowStockColumns}
                rowKey="_id"
                pagination={false}
                size="small"
                scroll={{ x: 400 }}
              />
            ) : (
              <div className="text-center py-8">
                <RiseOutlined className="text-3xl text-green-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Tous les produits sont bien approvisionnés</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
