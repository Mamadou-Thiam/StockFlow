import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Input, Select, DatePicker, Popconfirm, Tag, Space,
  Typography, Breadcrumb, notification,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, RollbackOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { saleAPI, invoiceAPI } from '../services/api';
import type { ISale } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

import { formatCurrency } from '../utils/format';

const paymentMethodLabels: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  transfer: 'Virement',
  other: 'Autre',
};

const paymentMethodColors: Record<string, string> = {
  cash: 'green',
  card: 'blue',
  transfer: 'purple',
  other: 'default',
};

const statusLabels: Record<string, string> = {
  completed: 'Terminée',
  cancelled: 'Annulée',
  returned: 'Retournée',
};

const statusColors: Record<string, string> = {
  completed: 'green',
  cancelled: 'red',
  returned: 'orange',
};

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.startDate = dateRange[0].toISOString();
      if (dateRange?.[1]) params.endDate = dateRange[1].toISOString();
      const res = await saleAPI.getAll(params);
      const data = res.data.data;
      setSales(Array.isArray(data) ? data : data.items ?? []);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les ventes',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, dateRange]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleReturn = async (id: string) => {
    try {
      await saleAPI.returnSale(id);
      notification.success({ message: 'Retour effectué avec succès' });
      fetchSales();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de retourner la vente',
      });
    }
  };

  const handleViewInvoice = async (sale: ISale) => {
    try {
      const res = await invoiceAPI.getAll({ saleId: sale._id });
      const invoices = res.data.data?.items ?? res.data.data ?? [];
      if (Array.isArray(invoices) && invoices.length > 0) {
        navigate(`/invoices/${invoices[0]._id}`);
      } else {
        notification.info({ message: 'Aucune facture trouvée pour cette vente' });
      }
    } catch {
      notification.info({ message: 'Aucune facture trouvée pour cette vente' });
    }
  };

  const getClientName = (clientId: string | undefined | { firstName?: string; lastName?: string }): string => {
    if (!clientId) return '-';
    if (typeof clientId === 'object') return `${clientId.firstName || ''} ${clientId.lastName || ''}`.trim() || '-';
    return clientId;
  };

  const expandedRowRender = (record: ISale) => {
    const itemColumns = [
      { title: 'Produit', dataIndex: 'name', key: 'name' },
      { title: 'SKU', dataIndex: 'sku', key: 'sku' },
      {
        title: 'Qté',
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'right' as const,
      },
      {
        title: 'Prix unitaire',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        align: 'right' as const,
        render: (val: number) => formatCurrency(val),
      },
      {
        title: 'TVA',
        dataIndex: 'taxRate',
        key: 'taxRate',
        align: 'right' as const,
        render: (val: number) => `${val}%`,
      },
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        align: 'right' as const,
        render: (val: number) => formatCurrency(val),
      },
    ];
    return (
      <Table
        dataSource={record.items}
        columns={itemColumns}
        rowKey={(item) => item.productId + item.sku}
        pagination={false}
        size="small"
        className="!mb-0"
      />
    );
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a: ISale, b: ISale) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Facture',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
    },
    {
      title: 'Client',
      key: 'client',
      width: 180,
      render: (_: unknown, record: ISale) => getClientName(record.clientId),
    },
    {
      title: 'Articles',
      key: 'itemsCount',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: ISale) => record.items?.length ?? 0,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 140,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
      sorter: (a: ISale, b: ISale) => a.total - b.total,
    },
    {
      title: 'Paiement',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 140,
      render: (method: string) => (
        <Tag color={paymentMethodColors[method] || 'default'}>
          {paymentMethodLabels[method] || method}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: ISale) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewInvoice(record)}
            title="Voir la facture"
          />
          {record.status === 'completed' && (
            <Popconfirm
              title="Retourner cette vente ?"
              description="Cela annulera la vente et remettra les produits en stock."
              onConfirm={() => handleReturn(record._id)}
              okText="Oui"
              cancelText="Non"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<RollbackOutlined />}
                title="Retour"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ title: 'Ventes' }]} className="!mb-2" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">Ventes</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales/new')}>
          Nouvelle vente
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher par facture ou client..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
          allowClear
        />
        <RangePicker
          value={dateRange as any}
          onChange={(dates) => { setDateRange(dates as any); setPage(1); }}
          className="min-w-[240px]"
        />
        <Select
          placeholder="Tous les statuts"
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          allowClear
          className="min-w-[150px]"
        >
          <Select.Option value="completed">Terminée</Select.Option>
          <Select.Option value="cancelled">Annulée</Select.Option>
          <Select.Option value="returned">Retournée</Select.Option>
        </Select>
      </div>

      <Table
        dataSource={sales}
        columns={columns}
        rowKey="_id"
        loading={loading}
        expandable={{
          expandedRowRender,
          rowExpandable: (record) => record.items?.length > 0,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (t) => `${t} ventes`,
        }}
        scroll={{ x: 1100 }}
        size="middle"
      />
    </div>
  );
};

export default SalesPage;
