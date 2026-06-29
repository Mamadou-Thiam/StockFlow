import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Popconfirm, Tag, Space,
  Typography, Breadcrumb, notification, Switch as AntSwitch,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { userAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import type { IUser } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  cashier: 'Caissier',
};

const roleColors: Record<string, string> = {
  super_admin: 'red',
  admin: 'blue',
  cashier: 'green',
};

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      const data = res.data.data;
      setUsers(Array.isArray(data) ? data : data.items ?? []);
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les utilisateurs',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (user: IUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role === 'super_admin' ? 'admin' : user.role,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingUser) {
        const payload: Record<string, unknown> = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: values.role,
        };
        if (values.password) payload.password = values.password;
        await userAPI.update(editingUser._id, payload);
        notification.success({ message: 'Utilisateur modifié avec succès' });
      } else {
        await userAPI.create({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          role: values.role,
        });
        notification.success({ message: 'Utilisateur créé avec succès' });
      }

      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers();
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

  const handleToggleActive = async (record: IUser) => {
    try {
      await userAPI.update(record._id, { isActive: !record.isActive });
      notification.success({
        message: record.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé',
      });
      fetchUsers();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de modifier le statut',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userAPI.delete(id);
      notification.success({ message: 'Utilisateur supprimé' });
      fetchUsers();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de supprimer',
      });
    }
  };

  const columns = [
    {
      title: 'Nom',
      key: 'fullName',
      render: (_: unknown, record: IUser) => (
        <span>
          {record.firstName} {record.lastName}
          {record._id === currentUser?._id && (
            <Tag className="ml-2" color="geekblue">Vous</Tag>
          )}
        </span>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>
          {roleLabels[role] || role}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
    {
      title: 'Dernière connexion',
      dataIndex: 'updatedAt',
      key: 'lastLogin',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: IUser) => {
        const isSelf = record._id === currentUser?._id;
        const canDelete = (isSuperAdmin || isAdmin) && !isSelf;
        const canEdit = isSuperAdmin || isAdmin;

        return (
          <Space>
            {canEdit && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            )}
            <AntSwitch
              checked={record.isActive}
              onChange={() => handleToggleActive(record)}
              size="small"
              disabled={isSelf}
            />
            {canDelete && (
              <Popconfirm
                title="Supprimer cet utilisateur ?"
                onConfirm={() => handleDelete(record._id)}
                okText="Oui"
                cancelText="Non"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ title: 'Utilisateurs' }]} className="!mb-2" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">Utilisateurs</Title>
        {(isSuperAdmin || isAdmin) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Ajouter un utilisateur
          </Button>
        )}
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ showSizeChanger: true, showTotal: (t) => `${t} utilisateurs` }}
        scroll={{ x: 800 }}
        size="middle"
      />

      <Modal
        title={editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditingUser(null); form.resetFields(); }}
        confirmLoading={submitting}
        okText={editingUser ? 'Modifier' : 'Créer'}
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
          </div>
          <Form.Item name="email" label="Email" rules={[
            { required: true, message: 'Email requis' },
            { type: 'email', message: 'Email invalide' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
            rules={editingUser ? [] : [
              { required: true, message: 'Mot de passe requis' },
              { min: 6, message: 'Minimum 6 caractères' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true, message: 'Rôle requis' }]}>
            <Select>
              <Select.Option value="admin">Administrateur</Select.Option>
              <Select.Option value="cashier">Caissier</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
