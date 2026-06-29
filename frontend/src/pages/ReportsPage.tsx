import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card, Row, Col, Table, Button, DatePicker, Select, Tabs, Typography,
  Space, Spin, Empty, notification, Statistic,
} from 'antd';
import {
  FilePdfOutlined, FileExcelOutlined,
  BarChartOutlined, InboxOutlined, TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { productAPI, categoryAPI, saleAPI, invoiceAPI, clientAPI } from '../services/api';
import type { IProduct, ICategory, IClient } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SaleStats {
  totalSales: number;
  totalAmount: number;
  averageCart: number;
  chartData: { date: string; amount: number; count: number }[];
}

interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface TopClient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  totalPurchases: number;
  totalRevenue: number;
}

import { formatCurrency } from '../utils/format';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(value);

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ title: 'Rapports' }]} />
      <Title level={4} className="!mb-0">Rapports & exportations</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <InventoryReport />
        </Col>
        <Col xs={24} xl={12}>
          <SalesReport />
        </Col>
        <Col xs={24} xl={12}>
          <InvoiceReport />
        </Col>
        <Col xs={24} xl={12}>
          <ClientReport />
        </Col>
      </Row>
    </div>
  );
};

const Breadcrumb: React.FC<{ items: { title: string }[] }> = ({ items }) => (
  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
    {items.map((item, i) => (
      <span key={i}>
        {i > 0 && <span className="mx-1">/</span>}
        <span>{item.title}</span>
      </span>
    ))}
  </div>
);

const InventoryReport: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productAPI.getAll({ limit: 1000 }),
        categoryAPI.getAll(),
      ]);
      const prodData = prodRes.data.data;
      setProducts(Array.isArray(prodData) ? prodData : prodData.items ?? []);
      const catData = catRes.data.data;
      setCategories(Array.isArray(catData) ? catData : catData.items ?? []);
    } catch {
      notification.error({ message: 'Erreur', description: 'Impossible de charger les données' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!categoryFilter) return products;
    return products.filter((p) => {
      if (!p.categoryId) return false;
      if (typeof p.categoryId === 'object') return p.categoryId._id === categoryFilter;
      return p.categoryId === categoryFilter;
    });
  }, [products, categoryFilter]);

  const columns = [
    { title: 'Produit', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    {
      title: 'Catégorie',
      key: 'categoryId',
      render: (_: unknown, r: IProduct) => {
        if (!r.categoryId) return '-';
        if (typeof r.categoryId === 'object') return r.categoryId.name;
        const cat = categories.find((c) => c._id === r.categoryId);
        return cat?.name || '-';
      },
    },
    {
      title: 'Stock actuel',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (val: number, r: IProduct) => (
        <span className={val <= r.minStock ? 'text-red-500 font-semibold' : ''}>{val}</span>
      ),
      sorter: (a: IProduct, b: IProduct) => a.quantity - b.quantity,
    },
    {
      title: 'Stock min.',
      dataIndex: 'minStock',
      key: 'minStock',
      align: 'right' as const,
    },
    {
      title: 'Valeur',
      key: 'value',
      align: 'right' as const,
      render: (_: unknown, r: IProduct) => formatCurrency(r.price * r.quantity),
      sorter: (a: IProduct, b: IProduct) => a.price * a.quantity - b.price * b.quantity,
    },
  ];

  const exportExcel = () => {
    const headers = ['Produit', 'SKU', 'Catégorie', 'Stock actuel', 'Stock min.', 'Prix', 'Valeur'];
    const rows = filtered.map((p) => {
      const catName = (() => {
        if (!p.categoryId) return '';
        if (typeof p.categoryId === 'object') return p.categoryId.name;
        const cat = categories.find((c) => c._id === p.categoryId);
        return cat?.name || '';
      })();
      return [p.name, p.sku, catName, p.quantity, p.minStock, p.price, p.price * p.quantity];
    });
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport-stock-${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    notification.success({ message: 'Export réussi', description: 'Fichier CSV téléchargé' });
  };

  const exportPdf = () => {
    notification.info({
      message: 'Génération PDF',
      description: 'La génération PDF sera disponible prochainement.',
    });
  };

  return (
    <Card
      title={
        <Space>
          <InboxOutlined />
          <span>Rapport de stock</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={exportPdf}>Export PDF</Button>
          <Button icon={<FileExcelOutlined />} onClick={exportExcel}>Export Excel</Button>
        </Space>
      }
      className="stat-card"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          placeholder="Toutes les catégories"
          value={categoryFilter}
          onChange={setCategoryFilter}
          allowClear
          className="min-w-[180px]"
        >
          {categories.map((cat) => (
            <Select.Option key={cat._id} value={cat._id}>{cat.name}</Select.Option>
          ))}
        </Select>
        <Text type="secondary">{filtered.length} produit{filtered.length > 1 ? 's' : ''}</Text>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : filtered.length === 0 ? (
        <Empty description="Aucun produit trouvé" />
      ) : (
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10, showTotal: (t) => `${t} produits` }}
          size="small"
          scroll={{ x: 700 }}
        />
      )}
    </Card>
  );
};

const SalesReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(7, 'day'), dayjs(),
  ]);
  const [periodTab, setPeriodTab] = useState('daily');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (dateRange[0]) params.startDate = dateRange[0].toISOString();
      if (dateRange[1]) params.endDate = dateRange[1].toISOString();
      if (periodTab) params.period = periodTab;
      const res = await saleAPI.getStats(params);
      setStats(res.data.data);
    } catch {
      notification.error({ message: 'Erreur', description: 'Impossible de charger les statistiques' });
    } finally {
      setLoading(false);
    }
  }, [dateRange, periodTab]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const exportExcel = () => {
    if (!stats) return;
    const headers = ['Date', 'Montant', 'Nombre de ventes'];
    const rows = (stats.chartData || []).map((d) => [
      dayjs(d.date).format('DD/MM/YYYY'),
      d.amount,
      d.count,
    ]);
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport-ventes-${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    notification.success({ message: 'Export réussi', description: 'Fichier CSV téléchargé' });
  };

  const exportPdf = () => {
    notification.info({
      message: 'Génération PDF',
      description: 'La génération PDF sera disponible prochainement.',
    });
  };

  const chartData = useMemo(() => {
    if (!stats?.chartData) return [];
    return stats.chartData.map((d) => ({
      ...d,
      label: dayjs(d.date).format(periodTab === 'daily' ? 'DD/MM' : periodTab === 'weekly' ? 'DD/MM' : 'MMM YYYY'),
    }));
  }, [stats, periodTab]);

  const tabItems = [
    { key: 'daily', label: 'Journalier' },
    { key: 'weekly', label: 'Hebdomadaire' },
    { key: 'monthly', label: 'Mensuel' },
  ];

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined />
          <span>Rapport des ventes</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={exportExcel}>Export Excel</Button>
          <Button icon={<FilePdfOutlined />} onClick={exportPdf}>Export PDF</Button>
        </Space>
      }
      className="stat-card"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <RangePicker
          value={dateRange as any}
          onChange={(dates) => setDateRange(dates as any)}
          className="min-w-[220px]"
        />
        <div className="!mb-0">
          <Tabs
            activeKey={periodTab}
            onChange={setPeriodTab}
            items={tabItems}
            size="small"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : !stats ? (
        <Empty description="Aucune donnée disponible" />
      ) : (
        <>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={8}>
              <Statistic
                title="Total ventes"
                value={stats.totalSales}
                formatter={(v) => formatNumber(Number(v))}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="Montant total"
                value={stats.totalAmount}
                formatter={(v) => formatCurrency(Number(v))}
                valueStyle={{ color: '#22c55e' }}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="Panier moyen"
                value={stats.averageCart}
                formatter={(v) => formatCurrency(Number(v))}
                valueStyle={{ color: '#1677ff' }}
              />
            </Col>
          </Row>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v)} />
                <RechartsTooltip
                  formatter={(value: number) => [formatCurrency(value), 'Montant']}
                />
                <Bar dataKey="amount" fill="#1677ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Aucune donnée pour la période sélectionnée" />
          )}
        </>
      )}
    </Card>
  );
};

const InvoiceReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 1000 };
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.startDate = dateRange[0].toISOString();
      if (dateRange?.[1]) params.endDate = dateRange[1].toISOString();
      const res = await invoiceAPI.getAll(params);
      const items = Array.isArray(res.data.data)
        ? res.data.data
        : res.data.data?.items ?? [];
      const totalAmount = items.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const paidAmount = items
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const unpaidAmount = items
        .filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      setSummary({
        totalInvoices: items.length,
        totalAmount,
        paidAmount,
        unpaidAmount,
      });
    } catch {
      notification.error({ message: 'Erreur', description: 'Impossible de charger les factures' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateRange]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const exportExcel = () => {
    if (!summary) return;
    const headers = ['Indicateur', 'Valeur'];
    const rows = [
      ['Total factures émises', summary.totalInvoices],
      ['Montant total', summary.totalAmount],
      ['Montant payé', summary.paidAmount],
      ['Montant impayé', summary.unpaidAmount],
    ];
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport-factures-${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    notification.success({ message: 'Export réussi', description: 'Fichier CSV téléchargé' });
  };

  const statusOptions = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyée' },
    { value: 'paid', label: 'Payée' },
    { value: 'overdue', label: 'En retard' },
    { value: 'cancelled', label: 'Annulée' },
  ];

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Rapport des factures</span>
        </Space>
      }
      extra={
        <Button icon={<FileExcelOutlined />} onClick={exportExcel}>Export Excel</Button>
      }
      className="stat-card"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          placeholder="Tous les statuts"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          className="min-w-[150px]"
          options={statusOptions}
        />
        <RangePicker
          value={dateRange as any}
          onChange={(dates) => setDateRange(dates as any)}
          className="min-w-[220px]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : !summary ? (
        <Empty description="Aucune donnée disponible" />
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" className="text-center">
              <Statistic
                title="Factures émises"
                value={summary.totalInvoices}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" className="text-center">
              <Statistic
                title="Montant total"
                value={summary.totalAmount}
                formatter={(v) => formatCurrency(Number(v))}
                valueStyle={{ fontSize: 24, color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" className="text-center">
              <Statistic
                title="Montant payé"
                value={summary.paidAmount}
                formatter={(v) => formatCurrency(Number(v))}
                valueStyle={{ fontSize: 24, color: '#22c55e' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" className="text-center">
              <Statistic
                title="Montant impayé"
                value={summary.unpaidAmount}
                formatter={(v) => formatCurrency(Number(v))}
                valueStyle={{ fontSize: 24, color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}
    </Card>
  );
};

const ClientReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [topClients, setTopClients] = useState<TopClient[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientAPI.getAll({ limit: 1000 });
      const items = Array.isArray(res.data.data) ? res.data.data : res.data.data?.items ?? [];
      const sorted = items
        .filter((c: IClient) => c.totalPurchases > 0)
        .sort((a: IClient, b: IClient) => b.totalPurchases - a.totalPurchases)
        .slice(0, 20)
        .map((c: IClient) => ({
          _id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          totalPurchases: c.totalPurchases,
          totalRevenue: c.totalPurchases,
        }));
      setTopClients(sorted);
    } catch {
      notification.error({ message: 'Erreur', description: 'Impossible de charger les clients' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    {
      title: 'Client',
      key: 'name',
      render: (_: unknown, r: TopClient) => (
        <span>{r.firstName} {r.lastName}</span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v?: string) => v || '-',
    },
    {
      title: 'Total achats',
      dataIndex: 'totalPurchases',
      key: 'totalPurchases',
      align: 'right' as const,
      render: (val: number) => formatNumber(val),
      sorter: (a: TopClient, b: TopClient) => a.totalPurchases - b.totalPurchases,
    },
    {
      title: 'Revenu généré',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
      sorter: (a: TopClient, b: TopClient) => a.totalRevenue - b.totalRevenue,
    },
  ];

  const exportExcel = () => {
    const headers = ['Client', 'Email', 'Total achats', 'Revenu généré'];
    const rows = topClients.map((c) => [
      `${c.firstName} ${c.lastName}`,
      c.email || '',
      c.totalPurchases,
      c.totalRevenue,
    ]);
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport-clients-${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    notification.success({ message: 'Export réussi', description: 'Fichier CSV téléchargé' });
  };

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <span>Rapport des clients</span>
        </Space>
      }
      extra={
        <Button icon={<FileExcelOutlined />} onClick={exportExcel}>Export Excel</Button>
      }
      className="stat-card"
    >
      {loading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : topClients.length === 0 ? (
        <Empty description="Aucun client avec achats" />
      ) : (
        <Table
          dataSource={topClients}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10, showTotal: (t) => `${t} clients` }}
          size="small"
          scroll={{ x: 500 }}
        />
      )}
    </Card>
  );
};

export default ReportsPage;
