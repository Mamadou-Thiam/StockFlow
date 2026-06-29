import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Table, Tag } from 'antd';
import {
  BankOutlined, UserOutlined, ShoppingOutlined,
  FileTextOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../services/api';

const { Title } = Typography;

interface AdminStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalInvoices: number;
  recentCompanies: Array<{
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    stats: { userCount: number };
  }>;
}

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getStats();
        setStats(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />;

  const companyColumns = [
    {
      title: 'Entreprise', dataIndex: 'name', key: 'name',
    },
    {
      title: 'Email', dataIndex: 'email', key: 'email',
    },
    {
      title: 'Statut', dataIndex: 'isActive', key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
    {
      title: 'Utilisateurs', key: 'users',
      render: (_: any, record: any) => record.stats?.userCount || 0,
      align: 'center' as const,
    },
    {
      title: 'Inscrit le', dataIndex: 'createdAt', key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <div>
      <Title level={4}>Tableau de bord — Administration</Title>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Entreprises" value={stats?.totalCompanies} prefix={<BankOutlined />} suffix={`dont ${stats?.activeCompanies} actives`} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Actives" value={stats?.activeCompanies} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Inactives" value={(stats?.totalCompanies || 0) - (stats?.activeCompanies || 0)} prefix={<StopOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Utilisateurs" value={stats?.totalUsers} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Produits" value={stats?.totalProducts} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Factures" value={stats?.totalInvoices} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="Dernières entreprises inscrites">
        <Table
          dataSource={stats?.recentCompanies || []}
          columns={companyColumns}
          rowKey="_id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
