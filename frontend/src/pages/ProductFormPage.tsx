import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, InputNumber, Select, Upload, Button, notification,
  Spin, Typography, Breadcrumb, Card, Space,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { productAPI, categoryAPI } from '../services/api';
import type { IProduct, ICategory } from '../types';

const { Title } = Typography;
const { TextArea } = Input;

const units = [
  { value: 'pcs', label: 'Pièce(s)' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'L', label: 'Litre' },
  { value: 'sac', label: 'Sac' },
  { value: 'boîte', label: 'Boîte' },
  { value: 'carton', label: 'Carton' },
];

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const isEditing = Boolean(id);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        setCategories(res.data.data?.items ?? res.data.data ?? []);
      } catch {
        notification.error({ message: 'Erreur', description: 'Impossible de charger les catégories' });
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productAPI.getById(id);
        const product: IProduct = res.data.data;
        form.setFieldsValue({
          name: product.name,
          description: product.description,
          sku: product.sku,
          barcode: product.barcode,
          categoryId: typeof product.categoryId === 'object'
            ? (product.categoryId as ICategory)._id
            : product.categoryId,
          price: product.price,
          costPrice: product.costPrice,
          taxRate: product.taxRate,
          unit: product.unit,
          quantity: product.quantity,
          minStock: product.minStock,
        });
        if (product.image) {
          setImageUrl(product.image);
        }
      } catch (err: any) {
        notification.error({
          message: 'Erreur',
          description: err.response?.data?.message || 'Impossible de charger le produit',
        });
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, form, navigate]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const hasFile = fileList.length > 0 && fileList[0].originFileObj;
      let payload: any;

      if (hasFile) {
        payload = new FormData();
        Object.entries(values).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            payload.append(key, String(val));
          }
        });
        payload.append('image', fileList[0].originFileObj);
      } else {
        payload = { ...values };
        if (imageUrl && !fileList.length) {
          payload.image = imageUrl;
        }
      }

      if (isEditing) {
        await productAPI.update(id!, payload);
        notification.success({ message: 'Produit mis à jour avec succès' });
      } else {
        await productAPI.create(payload);
        notification.success({ message: 'Produit créé avec succès' });
      }
      navigate('/products');
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Une erreur est survenue',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const reader = new FileReader();
      reader.onload = (e) => setImageUrl(e.target?.result as string);
      reader.readAsDataURL(newFileList[0].originFileObj);
    } else if (newFileList.length === 0) {
      setImageUrl(undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/products')}>Produits</a> },
          { title: isEditing ? 'Modifier le produit' : 'Nouveau produit' },
        ]}
        className="!mb-2"
      />
      <Title level={4}>{isEditing ? 'Modifier le produit' : 'Nouveau produit'}</Title>

      <Card className="max-w-3xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ taxRate: 0, minStock: 5, unit: 'pcs' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="name"
              label="Nom"
              rules={[{ required: true, message: 'Le nom est requis' }]}
            >
              <Input placeholder="Nom du produit" />
            </Form.Item>

            <Form.Item name="sku" label="SKU">
              <Input placeholder="Auto-généré si vide" />
            </Form.Item>

            <Form.Item name="categoryId" label="Catégorie">
              <Select placeholder="Sélectionner une catégorie" allowClear>
                {categories.map((cat) => (
                  <Select.Option key={cat._id} value={cat._id}>{cat.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="barcode" label="Code-barres">
              <Input placeholder="Code-barres" />
            </Form.Item>

            <Form.Item
              name="price"
              label="Prix de vente"
              rules={[{ required: true, message: 'Le prix de vente est requis' }]}
            >
              <InputNumber min={0} step={0.01} className="w-full" suffix="FCFA" />
            </Form.Item>

            <Form.Item name="costPrice" label="Prix d'achat">
              <InputNumber min={0} step={0.01} className="w-full" suffix="FCFA" />
            </Form.Item>

            <Form.Item name="taxRate" label="TVA (%)">
              <InputNumber min={0} max={100} step={0.1} className="w-full" />
            </Form.Item>

            <Form.Item name="unit" label="Unité">
              <Select>
                {units.map((u) => (
                  <Select.Option key={u.value} value={u.value}>{u.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="quantity" label="Quantité en stock">
              <InputNumber min={0} step={1} className="w-full" />
            </Form.Item>

            <Form.Item name="minStock" label="Stock minimum d'alerte">
              <InputNumber min={0} step={1} className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Description du produit" />
          </Form.Item>

          <Form.Item label="Image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false}
              onRemove={() => { setFileList([]); setImageUrl(undefined); }}
              accept="image/*"
            >
              {fileList.length === 0 && !imageUrl && (
                <div>
                  <PlusOutlined />
                  <div className="mt-1">Upload</div>
                </div>
              )}
            </Upload>
            {!fileList.length && imageUrl && (
              <div className="mt-2 inline-block rounded overflow-hidden border border-gray-200">
                <img src={imageUrl} alt="Aperçu" className="w-24 h-24 object-cover" />
              </div>
            )}
          </Form.Item>

          <div className="flex justify-end gap-3">
            <Button onClick={() => navigate('/products')}>Annuler</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEditing ? 'Mettre à jour' : 'Créer le produit'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ProductFormPage;
