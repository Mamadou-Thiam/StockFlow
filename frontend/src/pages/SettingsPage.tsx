import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Tabs, Upload, ColorPicker, Spin,
  Typography, Breadcrumb, notification, Space,
  Divider,
} from 'antd';
import {
  SaveOutlined, UploadOutlined,
} from '@ant-design/icons';
import { companyAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import type { ICompany } from '../types';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const { company, setCompany } = useAuthStore();
  const [infoForm] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(company?.colors?.primary || '#1677ff');
  const [secondaryColor, setSecondaryColor] = useState(company?.colors?.secondary || '#52c41a');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(company?.logo);
  const [logoLoading, setLogoLoading] = useState(false);

  useEffect(() => {
    if (company) {
      infoForm.setFieldsValue({
        name: company.name,
        email: company.email,
        phone: company.phone,
      });
      addressForm.setFieldsValue({
        street: company.address?.street,
        city: company.address?.city,
        state: company.address?.state,
        zip: company.address?.zip,
        country: company.address?.country,
      });
      setPrimaryColor(company.colors?.primary || '#1677ff');
      setSecondaryColor(company.colors?.secondary || '#52c41a');
      setLogoUrl(company.logo);
    }
  }, [company, infoForm, addressForm]);

  const handleSaveInfo = async () => {
    try {
      const values = await infoForm.validateFields();
      setSavingInfo(true);
      const res = await companyAPI.update({ name: values.name, email: values.email, phone: values.phone });
      const updated = res.data.data ?? res.data;
      setCompany({ ...company!, ...updated });
      notification.success({ message: 'Informations mises à jour' });
    } catch (err: any) {
      if (err.errorFields) return;
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de sauvegarder',
      });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const values = await addressForm.validateFields();
      setSavingAddress(true);
      const res = await companyAPI.update({
        address: {
          street: values.street || '',
          city: values.city || '',
          state: values.state || '',
          zip: values.zip || '',
          country: values.country || '',
        },
      });
      const updated = res.data.data ?? res.data;
      setCompany({ ...company!, ...updated });
      notification.success({ message: 'Adresse mise à jour' });
    } catch (err: any) {
      if (err.errorFields) return;
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de sauvegarder',
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveColors = async () => {
    setSavingColors(true);
    try {
      const res = await companyAPI.update({
        colors: { primary: primaryColor, secondary: secondaryColor },
      });
      const updated = res.data.data ?? res.data;
      setCompany({ ...company!, ...updated });
      notification.success({ message: 'Couleurs mises à jour' });
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de sauvegarder',
      });
    } finally {
      setSavingColors(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoLoading(true);
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await companyAPI.uploadLogo(formData);
      const data = res.data.data ?? res.data;
      if (data.logo) setLogoUrl(data.logo);
      setCompany({ ...company!, ...data });
      notification.success({ message: 'Logo mis à jour' });
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de télécharger le logo',
      });
    } finally {
      setLogoLoading(false);
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ title: 'Paramètres' }]} className="!mb-2" />
      <Title level={4} className="!mb-0">Paramètres</Title>

      <Card>
        <Tabs
          defaultActiveKey="general"
          items={[
            {
              key: 'general',
              label: 'Informations générales',
              children: (
                <Form form={infoForm} layout="vertical" className="max-w-lg mt-2">
                  <Form.Item name="name" label="Nom de l'entreprise" rules={[{ required: true, message: 'Nom requis' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email invalide' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="phone" label="Téléphone">
                    <Input />
                  </Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveInfo} loading={savingInfo}>
                    Enregistrer
                  </Button>
                </Form>
              ),
            },
            {
              key: 'address',
              label: 'Adresse',
              children: (
                <Form form={addressForm} layout="vertical" className="max-w-lg mt-2">
                  <Form.Item name="street" label="Rue">
                    <Input />
                  </Form.Item>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAddress} loading={savingAddress}>
                    Enregistrer
                  </Button>
                </Form>
              ),
            },
            {
              key: 'customization',
              label: 'Personnalisation',
              children: (
                <div className="max-w-lg mt-2 space-y-6">
                  <div>
                    <Text strong className="block mb-3">Logo</Text>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Text type="secondary" className="text-xs">Aucun logo</Text>
                        )}
                      </div>
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={(file) => { handleLogoUpload(file); return false; }}
                      >
                        <Button icon={<UploadOutlined />} loading={logoLoading}>
                          Télécharger
                        </Button>
                      </Upload>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <Text strong className="block mb-3">Couleurs</Text>
                    <div className="flex items-center gap-6">
                      <div>
                        <Text className="block mb-2 text-sm">Couleur primaire</Text>
                        <ColorPicker value={primaryColor} onChange={(c) => setPrimaryColor(c.toHexString())} />
                      </div>
                      <div>
                        <Text className="block mb-2 text-sm">Couleur secondaire</Text>
                        <ColorPicker value={secondaryColor} onChange={(c) => setSecondaryColor(c.toHexString())} />
                      </div>
                    </div>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveColors}
                      loading={savingColors}
                      className="mt-4"
                    >
                      Enregistrer les couleurs
                    </Button>
                  </div>
                </div>
              ),
            },

          ]}
        />
      </Card>
    </div>
  );
};

export default SettingsPage;
