import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Tag, Input, Select, Space, Typography, Badge, Button } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { adminAPI } from '../services/api';

const { Title } = Typography;

interface CompanyStats {
  userCount: number;
  productCount: number;
  saleCount: number;
}

interface AdminCompany {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  stats: CompanyStats;
  createdAt: string;
}

const AdminCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const navigate = useNavigate();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await adminAPI.getCompanies(params);
      setCompanies(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, status]);

  useEffect(() => {
    setPage(1);
    fetchCompanies();
  }, [search]);

  const columns = [
    {
      title: 'Entreprise',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AdminCompany) => (
        <Button type="link" onClick={() => navigate(`/admin/companies/${record._id}`)}>
          {name}
        </Button>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Statut',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
    {
      title: 'Utilisateurs',
      dataIndex: ['stats', 'userCount'],
      key: 'users',
      align: 'center' as const,
    },
    {
      title: 'Produits',
      dataIndex: ['stats', 'productCount'],
      key: 'products',
      align: 'center' as const,
    },
    {
      title: 'Ventes',
      dataIndex: ['stats', 'saleCount'],
      key: 'sales',
      align: 'center' as const,
    },
    {
      title: 'Date création',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Title level={4} className="!mb-0">
          Gestion des entreprises
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchCompanies}>
          Actualiser
        </Button>
      </div>

      <Card>
        <Space className="mb-4" wrap>
          <Input
            placeholder="Rechercher par nom ou email..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filtrer par statut"
            value={status || undefined}
            onChange={(val) => setStatus(val || '')}
            style={{ width: 160 }}
            allowClear
          >
            <Select.Option value="active">Actif</Select.Option>
            <Select.Option value="inactive">Inactif</Select.Option>
          </Select>
        </Space>

        <Table
          dataSource={companies}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: 15,
            total,
            onChange: setPage,
            showTotal: (t) => `${t} entreprises`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default AdminCompaniesPage;
