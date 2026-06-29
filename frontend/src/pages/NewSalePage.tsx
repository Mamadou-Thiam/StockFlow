import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Input, Button, Select, InputNumber, Radio, Tag,
  Modal, notification, Typography, Divider, Space, Empty, Spin, Breadcrumb,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ShoppingCartOutlined,
  SearchOutlined, UserOutlined,
} from '@ant-design/icons';
import { productAPI, categoryAPI, clientAPI, saleAPI } from '../services/api';
import type { IProduct, ICategory, IClient } from '../types';

const { Title, Text } = Typography;

import { formatCurrency } from '../utils/format';

interface CartItem {
  product: IProduct;
  quantity: number;
}

const NewSalePage: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [clients, setClients] = useState<IClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [clientSearch, setClientSearch] = useState('');

  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (productSearch.trim()) params.search = productSearch.trim();
      if (selectedCategory) params.categoryId = selectedCategory;
      params.isActive = true;
      const res = await productAPI.getAll(params);
      const data = res.data.data;
      setProducts(Array.isArray(data) ? data : data.items ?? []);
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de charger les produits',
      });
    } finally {
      setProductsLoading(false);
    }
  }, [productSearch, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        setCategories(res.data.data?.items ?? res.data.data ?? []);
      } catch { /* silent */ }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const params: Record<string, unknown> = {};
        if (clientSearch.trim()) params.search = clientSearch.trim();
        const res = await clientAPI.getAll(params);
        const data = res.data.data;
        setClients(Array.isArray(data) ? data : data.items ?? []);
      } catch { /* silent */ }
    };
    fetchClients();
  }, [clientSearch]);

  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const taxTotal = useMemo(() =>
    cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity * (item.product.taxRate / 100),
      0,
    ),
    [cartItems]
  );

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return subtotal * (discountValue / 100);
    }
    return discountValue;
  }, [discountValue, discountType, subtotal]);

  const total = useMemo(() =>
    Math.max(0, subtotal + taxTotal - discountAmount),
    [subtotal, taxTotal, discountAmount],
  );

  const change = useMemo(() =>
    Math.max(0, amountReceived - total),
    [amountReceived, total],
  );

  const addToCart = (product: IProduct) => {
    if (product.quantity <= 0) {
      notification.warning({ message: `${product.name} est en rupture de stock` });
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          notification.warning({ message: `Stock insuffisant pour ${product.name}` });
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const validateStock = (): boolean => {
    for (const item of cartItems) {
      if (item.quantity > item.product.quantity) {
        notification.error({
          message: 'Stock insuffisant',
          description: `${item.product.name} - Stock disponible: ${item.product.quantity}`,
        });
        return false;
      }
    }
    return true;
  };

  const handleQuickClientCreate = async () => {
    if (!newClientName.trim()) {
      notification.warning({ message: 'Veuillez saisir un nom pour le client' });
      return;
    }
    try {
      const nameParts = newClientName.trim().split(' ');
      const data: any = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || nameParts[0],
      };
      if (newClientPhone) data.phone = newClientPhone;
      if (newClientEmail) data.email = newClientEmail;
      const res = await clientAPI.create(data);
      const client: IClient = res.data.data;
      setSelectedClientId(client._id);
      setClientSearch(`${client.firstName} ${client.lastName}`);
      setClientModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      notification.success({ message: 'Client créé avec succès' });
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de créer le client',
      });
    }
  };

  const resetForm = () => {
    setCartItems([]);
    setSelectedClientId(undefined);
    setClientSearch('');
    setDiscountValue(0);
    setDiscountType('percentage');
    setAmountReceived(0);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      notification.warning({ message: 'Ajoutez au moins un article au panier' });
      return;
    }
    if (!validateStock()) return;
    if (paymentMethod === 'cash' && amountReceived < total) {
      notification.warning({ message: 'Le montant reçu est insuffisant' });
      return;
    }

    setSubmitting(true);
    try {
      const items = cartItems.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.price,
        taxRate: item.product.taxRate,
        taxAmount: item.product.price * item.quantity * (item.product.taxRate / 100),
        total: item.product.price * item.quantity,
      }));

      const saleData: any = {
        items,
        subtotal,
        taxTotal,
        discount: discountValue,
        discountType,
        total,
        paymentMethod,
        status: 'completed',
        notes: notes.trim() || undefined,
      };
      if (selectedClientId) saleData.clientId = selectedClientId;

      const res = await saleAPI.create(saleData);
      const sale = res.data.data;
      setLastSaleId(sale._id ?? sale.id);
      setSuccessModalOpen(true);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de finaliser la vente',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStockColor = (product: IProduct): string => {
    if (product.quantity > 10) return 'green';
    if (product.quantity > product.minStock) return 'gold';
    return 'red';
  };

  const clientOptions = clients.map((c) => ({
    label: `${c.firstName} ${c.lastName}${c.phone ? ` - ${c.phone}` : ''}`,
    value: c._id,
  }));

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/sales')}>Ventes</a> },
          { title: 'Nouvelle vente' },
        ]}
        className="!mb-2"
      />
      <Title level={4}>Point de vente</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card className="h-full">
            <div className="space-y-4">
              <Input
                placeholder="Rechercher un produit par nom ou SKU..."
                prefix={<SearchOutlined />}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                allowClear
                size="large"
              />
              <div className="flex flex-wrap gap-2">
                <Tag
                  color={selectedCategory === null ? 'blue' : 'default'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => setSelectedCategory(null)}
                >
                  Tous
                </Tag>
                {categories.map((cat) => (
                  <Tag
                    key={cat._id}
                    color={selectedCategory === cat._id ? 'blue' : 'default'}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => setSelectedCategory(cat._id)}
                  >
                    {cat.name}
                  </Tag>
                ))}
              </div>
              {productsLoading ? (
                <div className="flex justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : products.length === 0 ? (
                <Empty description="Aucun produit trouvé" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1">
                  {products.map((product) => (
                    <Card
                      key={product._id}
                      size="small"
                      hoverable
                      className="product-card"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingCartOutlined className="text-2xl text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 w-full">
                          <Text strong className="text-sm block truncate">{product.name}</Text>
                          <Text className="text-base font-bold text-blue-600 dark:text-blue-400 block">
                            {formatCurrency(product.price)}
                          </Text>
                        </div>
                        <Tag color={getStockColor(product)} className="text-xs">
                          {product.quantity} {product.unit}
                        </Tag>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            className="h-full"
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Panier ({cartItems.length})</span>
              </Space>
            }
          >
            <div className="flex flex-col min-h-[500px]">
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 mb-4">
                {cartItems.length === 0 ? (
                  <Empty description="Panier vide" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  cartItems.map((item) => (
                    <Card key={item.product._id} size="small" className="!mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <Text strong className="text-sm block truncate">{item.product.name}</Text>
                          <Text type="secondary" className="text-xs">
                            {formatCurrency(item.product.price)} / {item.product.unit}
                          </Text>
                        </div>
                        <Space>
                          <InputNumber
                            min={1}
                            max={item.product.quantity}
                            value={item.quantity}
                            onChange={(val) => updateQuantity(item.product._id, val ?? 0)}
                            className="w-16"
                            size="small"
                          />
                          <Text strong className="text-sm w-16 text-right">
                            {formatCurrency(item.product.price * item.quantity)}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeFromCart(item.product._id)}
                          />
                        </Space>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              <div className="mb-3">
                <Text strong className="text-xs block mb-1">Client</Text>
                <Space className="w-full">
                  <Select
                    showSearch
                    placeholder="Rechercher un client..."
                    value={selectedClientId}
                    onSearch={(val) => setClientSearch(val)}
                    onChange={(val) => setSelectedClientId(val)}
                    filterOption={false}
                    options={clientOptions}
                    allowClear
                    className="flex-1"
                    notFoundContent={
                      <Empty description="Aucun client" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    }
                  />
                  <Button
                    icon={<UserOutlined />}
                    onClick={() => setClientModalOpen(true)}
                    title="Ajouter un client rapide"
                  />
                </Space>
              </div>

              <div className="mb-3">
                <Text strong className="text-xs block mb-1">Remise</Text>
                <Space>
                  <InputNumber
                    min={0}
                    max={discountType === 'percentage' ? 100 : undefined}
                    value={discountValue}
                    onChange={(val) => setDiscountValue(val ?? 0)}
                    className="w-24"
                    prefix={discountType === 'percentage' ? '%' : 'FCFA'}
                  />
                  <Select
                    value={discountType}
                    onChange={(val) => { setDiscountType(val); setDiscountValue(0); }}
                    className="w-36"
                  >
                    <Select.Option value="percentage">Pourcentage</Select.Option>
                    <Select.Option value="fixed">Montant fixe</Select.Option>
                  </Select>
                </Space>
              </div>

              <div className="mb-3">
                <Text strong className="text-xs block mb-1">Mode de paiement</Text>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full"
                >
                  <Radio.Button value="cash" className="flex-1 text-center">Espèces</Radio.Button>
                  <Radio.Button value="card" className="flex-1 text-center">Carte</Radio.Button>
                  <Radio.Button value="transfer" className="flex-1 text-center">Virement</Radio.Button>
                  <Radio.Button value="other" className="flex-1 text-center">Autre</Radio.Button>
                </Radio.Group>
              </div>

              {paymentMethod === 'cash' && (
                <div className="mb-3">
                  <Text strong className="text-xs block mb-1">Montant reçu</Text>
                  <InputNumber
                    min={0}
                    step={0.01}
                    value={amountReceived}
                    onChange={(val) => setAmountReceived(val ?? 0)}
                    className="w-full"
                    addonBefore="FCFA"
                    size="large"
                  />
                  {amountReceived >= total && total > 0 && (
                    <Text className="text-green-600 block mt-1">
                      Monnaie à rendre: {formatCurrency(change)}
                    </Text>
                  )}
                </div>
              )}

              <div className="mb-3">
                <Text strong className="text-xs block mb-1">Notes</Text>
                <Input.TextArea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optionnel)"
                />
              </div>

              <Divider className="!my-3" />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <Text type="secondary">Sous-total HT</Text>
                  <Text>{formatCurrency(subtotal)}</Text>
                </div>
                <div className="flex justify-between text-sm">
                  <Text type="secondary">TVA</Text>
                  <Text>{formatCurrency(taxTotal)}</Text>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <Text type="secondary">Remise</Text>
                    <Text className="text-red-500">-{formatCurrency(discountAmount)}</Text>
                  </div>
                )}
                <Divider className="!my-2" />
                <div className="flex justify-between text-base font-bold">
                  <Text strong>Total TTC</Text>
                  <Text strong className="text-lg">{formatCurrency(total)}</Text>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                className="mt-4"
                onClick={handleSubmit}
                loading={submitting}
                disabled={cartItems.length === 0}
              >
                Finaliser la vente
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Ajouter un client rapide"
        open={clientModalOpen}
        onCancel={() => setClientModalOpen(false)}
        onOk={handleQuickClientCreate}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <div className="space-y-4">
          <Input
            placeholder="Nom complet *"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
          <Input
            placeholder="Téléphone"
            value={newClientPhone}
            onChange={(e) => setNewClientPhone(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={newClientEmail}
            onChange={(e) => setNewClientEmail(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Vente effectuée"
        open={successModalOpen}
        onCancel={() => { setSuccessModalOpen(false); }}
        footer={
          <Space>
            <Button onClick={() => { setSuccessModalOpen(false); navigate('/sales'); }}>
              Voir les ventes
            </Button>
            <Button
              type="primary"
              onClick={() => { setSuccessModalOpen(false); }}
            >
              Nouvelle vente
            </Button>
          </Space>
        }
      >
        <div className="text-center py-4">
          <div className="text-5xl text-green-500 mb-4">&#10003;</div>
          <Title level={4}>Vente finalisée avec succès !</Title>
          <Text type="secondary">Montant total: {formatCurrency(total)}</Text>
        </div>
      </Modal>
    </div>
  );
};

export default NewSalePage;
