import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, notification } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, ShopOutlined, ShoppingCartOutlined, InboxOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const { Title, Text } = Typography;

interface RegisterForm {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        companyName: values.companyName,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      const { user, company, accessToken, refreshToken } = response.data.data;
      setAuth(user, company, accessToken, refreshToken);
      notification.success({
        message: 'Inscription réussie',
        description: 'Bienvenue sur Stockflow',
      });
      navigate('/', { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || "Une erreur s'est produite lors de l'inscription";
      notification.error({ message: "Erreur d'inscription", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white px-16">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <ShoppingCartOutlined className="text-2xl" />
              </div>
              <span className="text-3xl font-bold">Stockflow</span>
            </div>
            <Title level={2} className="!text-white !mb-4">
              Prêt à booster<br />votre activité ?
            </Title>
            <Text className="!text-white/80 !text-lg">
              Créez votre compte et découvrez une plateforme complète de gestion d'entreprise.
            </Text>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <InboxOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Stock illimité</Text>
              <Text className="!text-white/60 text-sm">Produits & catégories</Text>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <ShoppingCartOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Ventes POS</Text>
              <Text className="!text-white/60 text-sm">Interface rapide</Text>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <FileTextOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Factures PDF</Text>
              <Text className="!text-white/60 text-sm">Génération auto</Text>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <TeamOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Équipe</Text>
              <Text className="!text-white/60 text-sm">Multi-utilisateurs</Text>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Title level={2} className="!mb-1 !text-indigo-700 dark:!text-indigo-400">
              Stockflow
            </Title>
            <Text type="secondary">Créez votre compte entreprise</Text>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="hidden lg:block text-center mb-6">
              <Title level={3} className="!mb-1">Créer un compte</Title>
              <Text type="secondary">Commencez votre essai gratuit</Text>
            </div>

            <Form<RegisterForm>
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="companyName"
                label="Nom de l'entreprise"
                rules={[{ required: true, message: 'Veuillez saisir le nom de votre entreprise' }]}
              >
                <Input prefix={<ShopOutlined />} placeholder="Ma Société" className="!rounded-lg" />
              </Form.Item>

              <div className="flex gap-4">
                <Form.Item
                  name="firstName"
                  label="Prénom"
                  className="flex-1"
                  rules={[{ required: true, message: 'Veuillez saisir votre prénom' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Jean" className="!rounded-lg" />
                </Form.Item>

                <Form.Item
                  name="lastName"
                  label="Nom"
                  className="flex-1"
                  rules={[{ required: true, message: 'Veuillez saisir votre nom' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Dupont" className="!rounded-lg" />
                </Form.Item>
              </div>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Veuillez saisir votre email' },
                  { type: 'email', message: 'Email invalide' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="exemple@email.com" className="!rounded-lg" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mot de passe"
                rules={[
                  { required: true, message: 'Veuillez saisir un mot de passe' },
                  { min: 8, message: 'Minimum 8 caractères' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" className="!rounded-lg" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirmer le mot de passe"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Veuillez confirmer votre mot de passe' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" className="!rounded-lg" />
              </Form.Item>

              <Form.Item className="!mb-2">
                <Button type="primary" htmlType="submit" loading={loading} block className="!h-11 !text-base !font-semibold !rounded-lg !shadow-md">
                  S'inscrire
                </Button>
              </Form.Item>

              <div className="text-center mt-4">
                <Text className="text-gray-500 dark:text-gray-400">Déjà un compte ?</Text>{' '}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                  Se connecter
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
