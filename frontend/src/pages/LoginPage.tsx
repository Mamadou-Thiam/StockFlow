import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Divider, notification } from 'antd';
import { MailOutlined, LockOutlined, ShoppingCartOutlined, InboxOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: values.email,
        password: values.password,
      });
      const { user, company, accessToken, refreshToken } = response.data.data;
      setAuth(user, company, accessToken, refreshToken);
      notification.success({ message: 'Connexion réussie', description: 'Bienvenue sur Stockflow' });
      navigate('/', { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email ou mot de passe incorrect';
      notification.error({ message: 'Erreur de connexion', description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
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
              Gérez votre stock,<br />simplifiez vos ventes
            </Title>
            <Text className="!text-white/80 !text-lg">
              La solution SaaS complète pour la gestion de stock, les ventes et la facturation automatisée.
            </Text>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <InboxOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Gestion de stock</Text>
              <Text className="!text-white/60 text-sm">Suivi en temps réel</Text>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <ShoppingCartOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Ventes rapides</Text>
              <Text className="!text-white/60 text-sm">Point de vente intégré</Text>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <FileTextOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Facturation</Text>
              <Text className="!text-white/60 text-sm">PDF automatique</Text>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <TeamOutlined className="text-2xl mb-2 block" />
              <Text className="!text-white font-semibold block">Multi-entreprise</Text>
              <Text className="!text-white/60 text-sm">Espace dédié</Text>
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
            <Text type="secondary">Gérez votre stock en toute simplicité</Text>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="hidden lg:block text-center mb-6">
              <Title level={3} className="!mb-1">Content de vous revoir</Title>
              <Text type="secondary">Connectez-vous à votre compte</Text>
            </div>

            <Form<LoginForm>
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
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
                  { required: true, message: 'Veuillez saisir votre mot de passe' },
                  { min: 6, message: 'Minimum 6 caractères' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" className="!rounded-lg" />
              </Form.Item>

              <Form.Item className="!mb-2">
                <Button type="primary" htmlType="submit" loading={loading} block className="!h-11 !text-base !font-semibold !rounded-lg !shadow-md">
                  Se connecter
                </Button>
              </Form.Item>

              <div className="text-center mb-4">
                <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Divider className="!my-4" />

              <div className="text-center">
                <Text className="text-gray-500 dark:text-gray-400">Pas encore de compte ?</Text>{' '}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                  Créer un compte
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
