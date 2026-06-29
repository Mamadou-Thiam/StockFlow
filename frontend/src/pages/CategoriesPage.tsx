import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Modal, Form, Input, Popconfirm, notification,
  Typography, Breadcrumb, Space, Spin, ColorPicker,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { categoryAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import type { ICategory } from '../types';

const { Title } = Typography;

const predefinedColors = [
  '#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911',
];

const CategoriesPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.data?.items ?? res.data.data ?? []);
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les catégories',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (category: ICategory) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      color: category.color || '#1677ff',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryAPI.delete(id);
      notification.success({ message: 'Catégorie supprimée' });
      fetchCategories();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de supprimer la catégorie',
      });
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const color = typeof values.color === 'string'
        ? values.color
        : values.color?.toHexString?.() || '#1677ff';
      const payload = { name: values.name, description: values.description, color };
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, payload);
        notification.success({ message: 'Catégorie mise à jour' });
      } else {
        await categoryAPI.create(payload);
        notification.success({ message: 'Catégorie créée' });
      }
      setModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Une erreur est survenue',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Couleur',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string | undefined) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
            style={{ backgroundColor: color || '#1677ff' }}
          />
          <span className="text-xs text-gray-400 font-mono hidden sm:inline">
            {color || '#1677ff'}
          </span>
        </div>
      ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ICategory) => (
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-8 rounded-full"
            style={{ backgroundColor: record.color || '#1677ff' }}
          />
          <span className="font-semibold text-gray-800 dark:text-gray-200">{name}</span>
        </div>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Produits',
      key: 'productCount',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: any) => {
        const count = record.productCount ?? 0;
        return (
          <span className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full text-xs font-semibold ${
            count > 0
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
          }`}>
            {count}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: ICategory) => (
        <Space>
          {isAdmin && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />}
          {isAdmin && (
            <Popconfirm
              title="Supprimer cette catégorie ?"
              description="Les produits associés ne seront pas supprimés."
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
      <Breadcrumb items={[{ title: 'Catégories' }]} className="!mb-2" />
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">Catégories</Title>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Ajouter une catégorie
          </Button>
        )}
      </div>

      <Table
        dataSource={categories}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `${t} catégories` }}
        scroll={{ x: 600 }}
      />

      <Modal
        title={editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ color: '#1677ff' }}
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input placeholder="Nom de la catégorie" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description (optionnelle)" />
          </Form.Item>

          <Form.Item name="color" label="Couleur">
            <ColorPicker showText presets={[{ label: 'Prédéfinies', colors: predefinedColors }]} />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Annuler</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingCategory ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
