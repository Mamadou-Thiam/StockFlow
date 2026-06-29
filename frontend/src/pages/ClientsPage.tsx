import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Input, Modal, Form, Popconfirm, Tag, Space,
  Typography, Breadcrumb, notification, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
} from '@ant-design/icons';
import { clientAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import type { IClient } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

import { formatCurrency } from '../utils/format';

const ClientsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      const res = await clientAPI.getAll(params);
      const data = res.data.data;
      setClients(Array.isArray(data) ? data : data.items ?? []);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les clients',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openCreateModal = () => {
    setEditingClient(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (client: IClient) => {
    setEditingClient(client);
    form.setFieldsValue({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      company: client.company,
      taxId: client.taxId,
      street: client.address?.street,
      city: client.address?.city,
      state: client.address?.state,
      zip: client.address?.zip,
      country: client.address?.country,
      notes: client.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        company: values.company || undefined,
        taxId: values.taxId || undefined,
        address: {
          street: values.street || '',
          city: values.city || '',
          state: values.state || '',
          zip: values.zip || '',
          country: values.country || '',
        },
        notes: values.notes || undefined,
      };

      if (editingClient) {
        await clientAPI.update(editingClient._id, payload);
        notification.success({ message: 'Client modifié avec succès' });
      } else {
        await clientAPI.create(payload);
        notification.success({ message: 'Client créé avec succès' });
      }

      setModalOpen(false);
      form.resetFields();
      setEditingClient(null);
      fetchClients();
    } catch (err: any) {
      if (err.errorFields) return;
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || "Une erreur s'est produite",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await clientAPI.delete(id);
      notification.success({ message: 'Client supprimé' });
      fetchClients();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de supprimer le client',
      });
    }
  };

  const columns = [
    {
      title: 'Nom complet',
      key: 'fullName',
      ellipsis: true,
      render: (_: unknown, record: IClient) => (
        <Button
          type="link"
          className="!p-0 !h-auto"
          onClick={() => navigate(`/clients/${record._id}`)}
        >
          {record.firstName} {record.lastName}
        </Button>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true, render: (v: string | undefined) => v || '-' },
    { title: 'Téléphone', dataIndex: 'phone', key: 'phone', render: (v: string | undefined) => v || '-' },
    {
      title: 'Achats total',
      dataIndex: 'totalPurchases',
      key: 'totalPurchases',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Solde',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right' as const,
      render: (val: number) => (
        <span className={val > 0 ? 'text-red-500 font-semibold' : 'text-green-600'}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Date création',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: IClient) => (
        <Space>
          {isAdmin && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          )}
          {isAdmin && (
            <Popconfirm
              title="Supprimer ce client ?"
              description="Cette action est réversible (suppression logique)."
              onConfirm={() => handleDelete(record._id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ title: 'Clients' }]} className="!mb-2" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">Clients</Title>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Ajouter un client
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher par nom ou email..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
          allowClear
        />
      </div>

      <Table
        dataSource={clients}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
          showTotal: (t) => `${t} clients`,
        }}
        scroll={{ x: 900 }}
        size="middle"
      />

      <Modal
        title={editingClient ? 'Modifier le client' : 'Ajouter un client'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditingClient(null); form.resetFields(); }}
        confirmLoading={submitting}
        width={640}
        okText={editingClient ? 'Modifier' : 'Créer'}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="firstName" label="Prénom" rules={[{ required: true, message: 'Prénom requis' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Nom" rules={[{ required: true, message: 'Nom requis' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email invalide' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Téléphone">
              <Input />
            </Form.Item>
            <Form.Item name="company" label="Société">
              <Input />
            </Form.Item>
            <Form.Item name="taxId" label="N° Fiscal">
              <Input />
            </Form.Item>
          </div>

          <Text strong className="block mb-2">Adresse</Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="street" label="Rue" className="md:col-span-2">
              <Input />
            </Form.Item>
            <Form.Item name="city" label="Ville">
              <Input />
            </Form.Item>
            <Form.Item name="state" label="État">
              <Input />
            </Form.Item>
            <Form.Item name="zip" label="Code postal">
              <Input />
            </Form.Item>
            <Form.Item name="country" label="Pays">
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientsPage;
