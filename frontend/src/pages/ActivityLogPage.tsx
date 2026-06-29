import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Table, Button, Select, DatePicker, Input, Space, Typography, Breadcrumb,
  notification, Switch, Tag, Tooltip, Popconfirm,
} from 'antd';
import {
  SearchOutlined, DeleteOutlined, ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { activityAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import type { IActivityLog } from '../types';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const actionTranslations: Record<string, { label: string; color: string }> = {
  'product.created': { label: 'Produit créé', color: 'green' },
  'product.updated': { label: 'Produit modifié', color: 'blue' },
  'product.deleted': { label: 'Produit supprimé', color: 'red' },
  'product.imported': { label: 'Produits importés', color: 'geekblue' },
  'sale.completed': { label: 'Vente effectuée', color: 'green' },
  'sale.cancelled': { label: 'Vente annulée', color: 'red' },
  'sale.returned': { label: 'Vente retournée', color: 'orange' },
  'user.login': { label: 'Connexion', color: 'cyan' },
  'user.logout': { label: 'Déconnexion', color: 'cyan' },
  'user.created': { label: 'Utilisateur créé', color: 'green' },
  'user.updated': { label: 'Utilisateur modifié', color: 'blue' },
  'user.deleted': { label: 'Utilisateur supprimé', color: 'red' },
  'company.registered': { label: 'Entreprise inscrite', color: 'purple' },
  'company.updated': { label: 'Entreprise modifiée', color: 'purple' },
  'invoice.created': { label: 'Facture créée', color: 'geekblue' },
  'invoice.sent': { label: 'Facture envoyée', color: 'blue' },
  'invoice.paid': { label: 'Facture payée', color: 'green' },
  'invoice.overdue': { label: 'Facture en retard', color: 'red' },
  'invoice.cancelled': { label: 'Facture annulée', color: 'default' },
  'client.created': { label: 'Client créé', color: 'green' },
  'client.updated': { label: 'Client modifié', color: 'blue' },
  'client.deleted': { label: 'Client supprimé', color: 'red' },
  'category.created': { label: 'Catégorie créée', color: 'green' },
  'category.updated': { label: 'Catégorie modifiée', color: 'blue' },
  'category.deleted': { label: 'Catégorie supprimée', color: 'red' },
  'payment.received': { label: 'Paiement reçu', color: 'green' },
  'stock.adjusted': { label: 'Stock ajusté', color: 'orange' },
  'export.performed': { label: 'Export effectué', color: 'geekblue' },
};

const entityTypeLabels: Record<string, string> = {
  product: 'Produit',
  sale: 'Vente',
  invoice: 'Facture',
  user: 'Utilisateur',
  client: 'Client',
  category: 'Catégorie',
  company: 'Entreprise',
  payment: 'Paiement',
  stock: 'Stock',
};

const formatDateTime = (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss');

const getActionInfo = (action: string) => {
  const found = actionTranslations[action];
  if (found) return found;
  const readable = action
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { label: readable, color: 'default' };
};

const getEntityLabel = (type?: string) => {
  if (!type) return '-';
  return entityTypeLabels[type] || type;
};

const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return '?';
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

const ActivityLogPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [activities, setActivities] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearing, setClearing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      if (dateRange?.[0]) params.startDate = dateRange[0].toISOString();
      if (dateRange?.[1]) params.endDate = dateRange[1].toISOString();
      const res = await activityAPI.getAll(params);
      const data = res.data.data;
      setActivities(Array.isArray(data) ? data : data.items ?? []);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les activités',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, actionFilter, dateRange]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchActivities();
      }, 30000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchActivities]);

  const handleClear = async () => {
    setClearing(true);
    try {
      await activityAPI.getAll({ clear: true });
      notification.success({ message: 'Journal d\'activités effacé' });
      setPage(1);
      fetchActivities();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible d\'effacer le journal',
      });
    } finally {
      setClearing(false);
    }
  };

  const actionOptions = Object.keys(actionTranslations).map((key) => ({
    value: key,
    label: actionTranslations[key].label,
  }));

  const columns = [
    {
      title: 'Date / Heure',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => (
        <Space size={4}>
          <ClockCircleOutlined className="text-gray-400 text-xs" />
          <span>{formatDateTime(date)}</span>
        </Space>
      ),
      sorter: (a: IActivityLog, b: IActivityLog) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Utilisateur',
      key: 'user',
      width: 180,
      render: (_: unknown, record: IActivityLog) => {
        const userObj = record.userId as
          | { firstName?: string; lastName?: string; email?: string }
          | undefined;
        if (!userObj) return <span className="text-gray-400">Système</span>;
        const firstName = userObj.firstName || '';
        const lastName = userObj.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || userObj.email || 'Inconnu';
        return (
          <Tooltip title={userObj.email || fullName}>
            <Space size={8}>
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300 flex-shrink-0">
                {getInitials(firstName, lastName)}
              </div>
              <span className="truncate max-w-[120px]">{fullName}</span>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 180,
      render: (action: string) => {
        const info = getActionInfo(action);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: actionOptions.map((o) => ({ text: o.label, value: o.value })),
      filterMultiple: true,
      onFilter: (value: React.Key | boolean, record: IActivityLog) =>
        record.action === value,
    },
    {
      title: "Type d'entité",
      dataIndex: 'entityType',
      key: 'entityType',
      width: 140,
      render: (type?: string) => getEntityLabel(type),
    },
    {
      title: 'Détails',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details?: string) => details || '-',
    },
    {
      title: 'Adresse IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      render: (ip?: string) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {ip || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ title: "Journal d'activités" }]} className="!mb-2" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">Journal d'activités</Title>
        <Space wrap>
          <Space size={4}>
            <Switch
              size="small"
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Auto 30s
            </span>
          </Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => { setPage(1); fetchActivities(); }}
          >
            Actualiser
          </Button>
          {isSuperAdmin && (
            <Popconfirm
              title="Effacer le journal d'activités ?"
              description="Cette action est irréversible."
              onConfirm={handleClear}
              okText="Oui, effacer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={clearing}
              >
                Effacer
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DatePicker.RangePicker
          value={dateRange as any}
          onChange={(dates) => { setDateRange(dates as any); setPage(1); }}
          className="min-w-[240px]"
        />
        <Select
          placeholder="Toutes les actions"
          value={actionFilter}
          onChange={(val) => { setActionFilter(val); setPage(1); }}
          allowClear
          showSearch
          className="min-w-[200px]"
          options={actionOptions}
        />
        <Input.Search
          placeholder="Rechercher par utilisateur ou détails..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
          allowClear
        />
      </div>

      <Table
        dataSource={activities}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (t) => `${t} activités`,
        }}
        scroll={{ x: 1000 }}
        size="middle"
      />
    </div>
  );
};

export default ActivityLogPage;
