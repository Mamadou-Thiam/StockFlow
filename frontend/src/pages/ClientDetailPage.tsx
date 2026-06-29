import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Table, Tag, Button, Space, Spin, Typography,
  Tabs, Statistic, Breadcrumb, notification, Result, Row, Col,
} from 'antd';
import {
  EditOutlined, PlusOutlined, MailOutlined, ShoppingCartOutlined,
  FileTextOutlined, ArrowLeftOutlined, DollarOutlined,
} from '@ant-design/icons';
import { clientAPI, saleAPI, invoiceAPI } from '../services/api';
import type { IClient, ISale, IInvoice } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

import { formatCurrency } from '../utils/format';

const saleStatusLabels: Record<string, string> = {
  completed: 'Terminée',
  cancelled: 'Annulée',
  returned: 'Retournée',
};

const saleStatusColors: Record<string, string> = {
  completed: 'green',
  cancelled: 'red',
  returned: 'orange',
};

const invoiceStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

const invoiceStatusColors: Record<string, string> = {
  draft: 'default',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'default',
};

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<IClient | null>(null);
  const [sales, setSales] = useState<ISale[]>([]);
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [salesTotal, setSalesTotal] = useState(0);
  const [invoicesTotal, setInvoicesTotal] = useState(0);

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await clientAPI.getById(id);
        const data = res.data.data ?? res.data;
        if (!data || !data._id) {
          setNotFound(true);
          return;
        }
        setClient(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          notification.error({
            message: 'Erreur',
            description: err.response?.data?.message || 'Impossible de charger le client',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  useEffect(() => {
    const fetchSales = async () => {
      if (!id) return;
      setSalesLoading(true);
      try {
        const res = await saleAPI.getAll({ clientId: id, limit: 50 });
        const data = res.data.data;
        setSales(Array.isArray(data) ? data : data.items ?? []);
        setSalesTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
      } catch {
        // silent
      } finally {
        setSalesLoading(false);
      }
    };
    fetchSales();
  }, [id]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!id) return;
      setInvoicesLoading(true);
      try {
        const res = await invoiceAPI.getAll({ clientId: id, limit: 50 });
        const data = res.data.data;
        setInvoices(Array.isArray(data) ? data : data.items ?? []);
        setInvoicesTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
      } catch {
        // silent
      } finally {
        setInvoicesLoading(false);
      }
    };
    fetchInvoices();
  }, [id]);

  const saleColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Facture',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
    },
    {
      title: 'Montant',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={saleStatusColors[status] || 'default'}>
          {saleStatusLabels[status] || status}
        </Tag>
      ),
    },
  ];

  const invoiceColumns = [
    {
      title: 'Numéro',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
      render: (val: string, record: IInvoice) => (
        <Button type="link" className="!p-0 !h-auto" onClick={() => navigate(`/invoices/${record._id}`)}>
          {val}
        </Button>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Échéance',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string | undefined) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Montant',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={invoiceStatusColors[status] || 'default'}>
          {invoiceStatusLabels[status] || status}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spin size="large" tip="Chargement du client..." />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <Result
        status="404"
        title="Client introuvable"
        subTitle="Le client demandé n'existe pas ou a été supprimé."
        extra={
          <Button type="primary" onClick={() => navigate('/clients')}>
            Retour aux clients
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/clients')}>Clients</a> },
            { title: `${client.firstName} ${client.lastName}` },
          ]}
          className="!mb-0"
        />
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/clients')}>
            Retour
          </Button>
          <Button icon={<MailOutlined />}>Envoyer email</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/new')}
          >
            Nouvelle vente
          </Button>
        </Space>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <Title level={4} className="!mb-1">
              {client.firstName} {client.lastName}
            </Title>
            <div className="text-gray-500 text-sm space-y-1">
              {client.email && <div>Email: {client.email}</div>}
              {client.phone && <div>Tél: {client.phone}</div>}
              {client.company && <div>Société: {client.company}</div>}
              {client.taxId && <div>N° Fiscal: {client.taxId}</div>}
              {client.address && (
                <div>
                  {client.address.street && <div>{client.address.street}</div>}
                  <div>
                    {client.address.zip} {client.address.city}
                    {client.address.state ? `, ${client.address.state}` : ''}
                    {client.address.country ? `, ${client.address.country}` : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Solde actuel</div>
            <div className={`text-2xl font-bold ${client.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatCurrency(client.balance)}
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total achats"
              value={client.totalPurchases}
              precision={2}
              suffix="FCFA"
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Nombre de factures"
              value={invoicesTotal}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Solde actuel"
              value={client.balance}
              precision={2}
              suffix="FCFA"
              valueStyle={{ color: client.balance > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="purchases"
          items={[
            {
              key: 'purchases',
              label: (
                <span>
                  <ShoppingCartOutlined className="mr-2" />
                  Achats
                </span>
              ),
              children: (
                <Table
                  dataSource={sales}
                  columns={saleColumns}
                  rowKey="_id"
                  loading={salesLoading}
                  pagination={false}
                  size="middle"
                  locale={{ emptyText: 'Aucun achat trouvé' }}
                />
              ),
            },
            {
              key: 'invoices',
              label: (
                <span>
                  <FileTextOutlined className="mr-2" />
                  Factures
                </span>
              ),
              children: (
                <Table
                  dataSource={invoices}
                  columns={invoiceColumns}
                  rowKey="_id"
                  loading={invoicesLoading}
                  pagination={false}
                  size="middle"
                  locale={{ emptyText: 'Aucune facture trouvée' }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ClientDetailPage;
