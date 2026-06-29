import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions, Card, Tag, Button, Spin, Space, Typography,
  Statistic, Row, Col, Table, Switch, message, Modal,
} from 'antd';
import {
  ArrowLeftOutlined, BankOutlined, UserOutlined,
  ShoppingOutlined, TeamOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../services/api';

const { Title } = Typography;

interface AdminCompanyDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: { street?: string; city?: string; state?: string; zip?: string; country?: string };
  isActive: boolean;
  colors?: { primary?: string; secondary?: string };
  logo?: string;
  stats: {
    userCount: number;
    productCount: number;
    clientCount: number;
    saleCount: number;
    invoiceCount: number;
  };
  users: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  createdAt: string;
}

const AdminCompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<AdminCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminAPI.getCompany(id);
      setCompany(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const handleToggleActive = async (active: boolean) => {
    if (!id || !company) return;
    try {
      await adminAPI.updateCompany(id, { isActive: active });
      message.success(`Entreprise ${active ? 'activée' : 'désactivée'}`);
      fetchCompany();
    } catch {
      message.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Modal.confirm({
      title: 'Désactiver cette entreprise ?',
      content: 'Tous les utilisateurs de cette entreprise seront désactivés.',
      okText: 'Confirmer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await adminAPI.deleteCompany(id);
          message.success('Entreprise désactivée');
          navigate('/admin/companies');
        } catch {
          message.error('Erreur lors de la désactivation');
        }
      },
    });
  };

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />;
  if (!company) return <div className="text-center mt-20">Entreprise non trouvée</div>;

  const userColumns = [
    { title: 'Nom', key: 'name', render: (_: any, r: any) => `${r.firstName} ${r.lastName}` },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rôle', dataIndex: 'role', key: 'role',
      render: (role: string) => (
        <Tag color={role === 'super_admin' ? 'red' : role === 'admin' ? 'blue' : 'default'}>
          {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Caissier'}
        </Tag>
      ),
    },
    {
      title: 'Statut', dataIndex: 'isActive', key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
  ];

  return (
    <div>
      <Space className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/companies')}>
          Retour
        </Button>
      </Space>

      <div className="flex items-center justify-between mb-4">
        <Title level={4} className="!mb-0">{company.name}</Title>
        <Button danger onClick={handleDelete}>Désactiver</Button>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Utilisateurs" value={company.stats.userCount} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Produits" value={company.stats.productCount} prefix={<ShoppingOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Clients" value={company.stats.clientCount} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Ventes" value={company.stats.saleCount} prefix={<BankOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Factures" value={company.stats.invoiceCount} prefix={<FileTextOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="Informations" className="mb-4">
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Email">{company.email}</Descriptions.Item>
          <Descriptions.Item label="Téléphone">{company.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Statut">
            <Switch checked={company.isActive} onChange={handleToggleActive} />
            <Tag color={company.isActive ? 'green' : 'red'} className="ml-2">
              {company.isActive ? 'Actif' : 'Inactif'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Date création">
            {new Date(company.createdAt).toLocaleDateString('fr-FR')}
          </Descriptions.Item>
          <Descriptions.Item label="Adresse">
            {company.address
              ? `${company.address.street || ''}, ${company.address.city || ''}`.trim() || '-'
              : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Utilisateurs">
        <Table
          dataSource={company.users}
          columns={userColumns}
          rowKey="_id"
          pagination={company.users.length > 10 ? { pageSize: 10 } : false}
        />
      </Card>
    </div>
  );
};

export default AdminCompanyDetailPage;
