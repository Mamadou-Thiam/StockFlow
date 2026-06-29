import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Input, Select, DatePicker, Tag, Space, Typography,
  Breadcrumb, notification, Tooltip, Dropdown,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, FilePdfOutlined, SendOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { invoiceAPI } from '../services/api';
import type { IInvoice, ISaleItem } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

import { formatCurrency } from '../utils/format';

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

const statusColors: Record<string, string> = {
  draft: 'default',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'default',
};

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.startDate = dateRange[0].toISOString();
      if (dateRange?.[1]) params.endDate = dateRange[1].toISOString();
      const res = await invoiceAPI.getAll(params);
      const data = res.data.data;
      setInvoices(Array.isArray(data) ? data : data.items ?? []);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les factures',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, dateRange]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await invoiceAPI.generatePdf(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de télécharger le PDF',
      });
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      await invoiceAPI.sendByEmail(id);
      notification.success({ message: 'Email envoyé avec succès' });
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || "Impossible d'envoyer l'email",
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await invoiceAPI.updateStatus(id, status);
      notification.success({ message: 'Statut mis à jour' });
      fetchInvoices();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de mettre à jour le statut',
      });
    }
  };

  const getClientName = (client: string | { firstName?: string; lastName?: string } | undefined): string => {
    if (!client) return '-';
    if (typeof client === 'object') return `${client.firstName || ''} ${client.lastName || ''}`.trim() || '-';
    return client;
  };

  const expandedRowRender = (record: IInvoice) => {
    const itemColumns = [
      { title: 'Produit', dataIndex: 'name', key: 'name' },
      { title: 'SKU', dataIndex: 'sku', key: 'sku' },
      { title: 'Qté', dataIndex: 'quantity', key: 'quantity', align: 'right' as const },
      {
        title: 'Prix unitaire',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        align: 'right' as const,
        render: (val: number) => formatCurrency(val),
      },
      {
        title: 'TVA %',
        dataIndex: 'taxRate',
        key: 'taxRate',
        align: 'right' as const,
        render: (val: number) => `${val}%`,
      },
      {
        title: 'Mt TVA',
        dataIndex: 'taxAmount',
        key: 'taxAmount',
        align: 'right' as const,
        render: (val: number) => formatCurrency(val),
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
        dataSource={record.items as ISaleItem[]}
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
      title: 'Facture N°',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a: IInvoice, b: IInvoice) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Client',
      key: 'client',
      width: 180,
      render: (_: unknown, record: IInvoice) => getClientName(record.clientId),
    },
    {
      title: 'Montant',
      dataIndex: 'total',
      key: 'total',
      width: 140,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
      sorter: (a: IInvoice, b: IInvoice) => a.total - b.total,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{statusLabels[status] || status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: IInvoice) => {
        const statusMenuItems = [];
        if (record.status === 'sent' || record.status === 'overdue') {
          statusMenuItems.push({
            key: 'paid',
            icon: <CheckCircleOutlined />,
            label: 'Marquer payée',
            onClick: () => handleUpdateStatus(record._id, 'paid'),
          });
        }
        if (record.status !== 'cancelled') {
          statusMenuItems.push({
            key: 'cancelled',
            icon: <CloseCircleOutlined />,
            label: 'Annuler',
            onClick: () => handleUpdateStatus(record._id, 'cancelled'),
          });
        }

        return (
          <Space size="small">
            <Tooltip title="Voir">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/invoices/${record._id}`)}
              />
            </Tooltip>
            <Tooltip title="Télécharger PDF">
              <Button
                type="link"
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => handleDownloadPdf(record._id)}
              />
            </Tooltip>
            <Tooltip title="Envoyer par email">
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSendEmail(record._id)}
              />
            </Tooltip>
            {statusMenuItems.length > 0 && (
              <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
                <Button size="small">Statut</Button>
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  const rowClassName = (record: IInvoice) => {
    if (record.status === 'overdue') return 'bg-red-50 dark:bg-red-900/10';
    return '';
  };

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ title: 'Factures' }]} className="!mb-2" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">Factures</Title>
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
          className="min-w-[160px]"
        >
          <Select.Option value="draft">Brouillon</Select.Option>
          <Select.Option value="sent">Envoyée</Select.Option>
          <Select.Option value="paid">Payée</Select.Option>
          <Select.Option value="overdue">En retard</Select.Option>
          <Select.Option value="cancelled">Annulée</Select.Option>
        </Select>
      </div>

      <Table
        dataSource={invoices}
        columns={columns}
        rowKey="_id"
        loading={loading}
        rowClassName={rowClassName}
        expandable={{
          expandedRowRender,
          rowExpandable: (record) => (record.items?.length ?? 0) > 0,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (t) => `${t} factures`,
        }}
        scroll={{ x: 1000 }}
        size="middle"
      />
    </div>
  );
};

export default InvoicesPage;
