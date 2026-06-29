import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Input, Select, Checkbox, Popconfirm, Upload,
  notification, Tag, Card, Space, Typography, Breadcrumb, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  DownloadOutlined, SearchOutlined, WarningOutlined,
} from '@ant-design/icons';
import { productAPI, categoryAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import useAuthStore from '../store/authStore';
import type { IProduct, ICategory } from '../types';

const { Title } = Typography;

const ProductsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.data?.items ?? res.data.data ?? []);
    } catch {
      // silent fail
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.categoryId = categoryFilter;
      if (lowStockOnly) params.lowStock = true;
      const res = await productAPI.getAll(params);
      const data = res.data.data;
      setProducts(Array.isArray(data) ? data : data.items ?? []);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les produits',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter, lowStockOnly]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    try {
      await productAPI.delete(id);
      notification.success({ message: 'Produit supprimé' });
      fetchProducts();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de supprimer le produit',
      });
    }
  };

  const handleExport = async () => {
    try {
      const res = await productAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'produits.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      notification.error({ message: 'Erreur', description: "Impossible d'exporter les produits" });
    }
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await productAPI.importExcel(formData);
      notification.success({ message: 'Import réussi' });
      fetchProducts();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || "Impossible d'importer le fichier",
      });
    }
    return false;
  };

  const getCategoryName = (catId: string | ICategory | undefined): string => {
    if (!catId) return '-';
    if (typeof catId === 'object') return catId.name;
    const cat = categories.find((c) => c._id === catId);
    return cat?.name || '-';
  };

  const isLowStock = (product: IProduct) => product.quantity <= product.minStock;

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (img: string | undefined) => (
        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">N/A</span>
          )}
        </div>
      ),
    },
    { title: 'Nom', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    {
      title: 'Catégorie',
      key: 'categoryId',
      render: (_: unknown, record: IProduct) => getCategoryName(record.categoryId),
    },
    {
      title: 'Prix',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (val: number, record: IProduct) => (
        <span className={isLowStock(record) ? 'text-red-500 font-semibold' : ''}>
          {isLowStock(record) && <WarningOutlined className="mr-1" />}
          {val} {record.unit}
        </span>
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
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: IProduct) => (
        <Space>
          {isAdmin && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/products/${record._id}/edit`)}
            />
          )}
          {isAdmin && (
            <Popconfirm
              title="Supprimer le produit ?"
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

  const renderMobileCard = (product: IProduct) => {
    const lowStock = isLowStock(product);
    return (
      <Card key={product._id} className="mb-3" size="small">
        <div className="flex gap-3">
          <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
            {product.image ? (
              <img src={product.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-xs">N/A</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <Typography.Text strong className="block truncate">{product.name}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">{product.sku}</Typography.Text>
              </div>
              <Tag color={product.isActive ? 'green' : 'default'} className="shrink-0">
                {product.isActive ? 'Actif' : 'Inactif'}
              </Tag>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold">{formatCurrency(product.price)}</span>
              <span className={lowStock ? 'text-red-500 font-semibold' : ''}>
                {lowStock && <WarningOutlined className="mr-1" />}
                Stock: {product.quantity} {product.unit}
              </span>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              {isAdmin && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/products/${product._id}/edit`)}
                />
              )}
              {isAdmin && (
                <Popconfirm
                  title="Supprimer ?"
                  onConfirm={() => handleDelete(product._id)}
                  okText="Oui"
                  cancelText="Non"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ title: 'Produits' }]} className="!mb-2" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">Produits</Title>
        <Space wrap>
          {isAdmin && (
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => { handleImport(file); return false; }}
            >
              <Button icon={<UploadOutlined />}>Importer</Button>
            </Upload>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Exporter</Button>
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
              Ajouter un produit
            </Button>
          )}
        </Space>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher par nom ou SKU..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
          allowClear
        />
        <Select
          placeholder="Toutes les catégories"
          value={categoryFilter}
          onChange={(val) => { setCategoryFilter(val); setPage(1); }}
          allowClear
          className="min-w-[180px]"
        >
          {categories.map((cat) => (
            <Select.Option key={cat._id} value={cat._id}>{cat.name}</Select.Option>
          ))}
        </Select>
        <Checkbox checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}>
          Stock faible
        </Checkbox>
      </div>

      {loading && products.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : isMobile ? (
        <div className="space-y-0">
          {products.map(renderMobileCard)}
          {products.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">Aucun produit trouvé</div>
          )}
        </div>
      ) : (
        <Table
          dataSource={products}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showSizeChanger: true,
            showTotal: (t) => `${t} produits`,
          }}
          scroll={{ x: 900 }}
          size="middle"
        />
      )}
    </div>
  );
};

export default ProductsPage;
