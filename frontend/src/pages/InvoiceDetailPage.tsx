import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Table, Tag, Button, Space, Spin, Typography,
  Divider, Breadcrumb, notification, Result,
} from 'antd';
import {
  FilePdfOutlined, SendOutlined, CheckCircleOutlined,
  PrinterOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { invoiceAPI, companyAPI } from '../services/api';
import type { IInvoice, ICompany, ISaleItem } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

import { formatCurrency } from '../utils/format';

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

const statusColors: Record<string, string> = {
  draft: 'default',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'default',
};

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [company, setCompany] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [invoiceRes, companyRes] = await Promise.all([
          invoiceAPI.getById(id),
          companyAPI.get(),
        ]);
        const invData = invoiceRes.data.data ?? invoiceRes.data;
        if (!invData || !invData._id) {
          setNotFound(true);
          return;
        }
        setInvoice(invData);
        setCompany(companyRes.data.data ?? companyRes.data ?? null);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          notification.error({
            message: 'Erreur',
            description: err.response?.data?.message || 'Impossible de charger la facture',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    setActionLoading('pdf');
    try {
      const res = await invoiceAPI.generatePdf(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${invoice?.invoiceNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de télécharger le PDF',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!id) return;
    setActionLoading('email');
    try {
      await invoiceAPI.sendByEmail(id);
      notification.success({ message: 'Email envoyé avec succès' });
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || "Impossible d'envoyer l'email",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;
    setActionLoading('paid');
    try {
      await invoiceAPI.updateStatus(id, 'paid');
      notification.success({ message: 'Facture marquée comme payée' });
      const res = await invoiceAPI.getById(id);
      setInvoice(res.data.data ?? res.data);
    } catch (err: any) {
      notification.error({
        message: 'Erreur',
        description: err.response?.data?.message || 'Impossible de mettre à jour le statut',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spin size="large" tip="Chargement de la facture..." />
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <Result
        status="404"
        title="Facture introuvable"
        subTitle="La facture demandée n'existe pas ou a été supprimée."
        extra={
          <Button type="primary" onClick={() => navigate('/invoices')}>
            Retour aux factures
          </Button>
        }
      />
    );
  }

  const client = invoice.clientId && typeof invoice.clientId === 'object' ? invoice.clientId : null;
  const canMarkPaid = invoice.status === 'sent' || invoice.status === 'overdue';

  const itemColumns = [
    {
      title: 'Description',
      key: 'description',
      render: (_: unknown, record: ISaleItem) => (
        <div>
          <div>{record.name}</div>
          <Text type="secondary" className="text-xs">SKU: {record.sku}</Text>
        </div>
      ),
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'TVA %',
      dataIndex: 'taxRate',
      key: 'taxRate',
      width: 80,
      align: 'right' as const,
      render: (val: number) => `${val}%`,
    },
    {
      title: 'Mt TVA',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
  ];

  return (
    <div className="space-y-4 print:space-y-2">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; font-size: 12px; }
          .ant-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .ant-table-thead > tr > th { background: #f3f4f6 !important; }
        }
        @page { margin: 15mm; }
      `}</style>

      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/invoices')}>Factures</a> },
            { title: `${invoice.invoiceNumber}` },
          ]}
          className="!mb-0"
        />
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/invoices')}>
            Retour
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={handleDownloadPdf}
            loading={actionLoading === 'pdf'}
          >
            Télécharger PDF
          </Button>
          <Button
            icon={<SendOutlined />}
            onClick={handleSendEmail}
            loading={actionLoading === 'email'}
          >
            Envoyer par email
          </Button>
          {canMarkPaid && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAsPaid}
              loading={actionLoading === 'paid'}
            >
              Marquer comme payée
            </Button>
          )}
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Imprimer
          </Button>
        </Space>
      </div>

      <Card className="print:shadow-none">
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6 print:flex-row">
          <div>
            {company?.logo && (
              <img
                src={company.logo}
                alt="Logo"
                className="h-16 mb-3 object-contain"
              />
            )}
            <Title level={4} className="!mb-1">{company?.name || 'Entreprise'}</Title>
            {company && (
              <div className="text-gray-500 text-sm space-y-0.5">
                {company.address?.street && <div>{company.address.street}</div>}
                {company.address && (
                  <div>
                    {company.address.zip} {company.address.city}
                    {company.address.state ? `, ${company.address.state}` : ''}
                  </div>
                )}
                {company.phone && <div>Tél: {company.phone}</div>}
                {company.email && <div>Email: {company.email}</div>}
              </div>
            )}
          </div>

          <div className="text-left md:text-right print:text-right">
            <Title level={2} className="!mb-2">FACTURE</Title>
            <div className="text-lg font-semibold">{invoice.invoiceNumber}</div>
          </div>
        </div>

        <Divider className="!my-4 print:!my-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2">
          <div>
            <Text strong className="block mb-2">Facturé à</Text>
            {client ? (
              <div className="text-gray-600 text-sm space-y-0.5">
                <div className="font-semibold text-gray-800">
                  {client.firstName} {client.lastName}
                </div>
                {client.company && <div>{client.company}</div>}
                {client.address?.street && <div>{client.address.street}</div>}
                {client.address && (
                  <div>
                    {client.address.zip} {client.address.city}
                  </div>
                )}
                {client.phone && <div>Tél: {client.phone}</div>}
                {client.email && <div>Email: {client.email}</div>}
                {client.taxId && <div>N° TVA: {client.taxId}</div>}
              </div>
            ) : (
              <Text type="secondary">Client non spécifié</Text>
            )}
          </div>

          <div className="text-left md:text-right print:text-right">
            <Descriptions
              column={1}
              size="small"
              colon={false}
              className="print:!text-xs"
              labelStyle={{ fontWeight: 500, whiteSpace: 'nowrap' }}
            >
              <Descriptions.Item label="Date d'émission">
                {dayjs(invoice.createdAt).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Date d'échéance">
                {invoice.dueDate
                  ? dayjs(invoice.dueDate).format('DD/MM/YYYY')
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={statusColors[invoice.status] || 'default'}>
                  {statusLabels[invoice.status] || invoice.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>

        <Table
          dataSource={invoice.items as ISaleItem[]}
          columns={itemColumns}
          rowKey={(record) => record.productId + record.sku}
          pagination={false}
          size="middle"
          className="!mb-4 print:!mb-2"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  <Text strong>Sous-total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>{formatCurrency(invoice.taxTotal)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong>{formatCurrency(invoice.subtotal)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              {invoice.discount > 0 && (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <Text>Remise</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text>{formatCurrency(invoice.discount)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  <Text className="text-base font-bold">Total général</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text className="text-base font-bold">{formatCurrency(invoice.taxTotal)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text className="text-base font-bold">{formatCurrency(invoice.total)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <Divider className="!my-4 print:!my-2" />

        <Descriptions
          column={1}
          size="small"
          colon={false}
          className="print:!text-xs"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Méthode de paiement">
            {invoice.status === 'paid'
              ? (invoice as any).paymentMethod
                ? (invoice as any).paymentMethod === 'cash' ? 'Espèces'
                  : (invoice as any).paymentMethod === 'card' ? 'Carte bancaire'
                  : (invoice as any).paymentMethod === 'transfer' ? 'Virement'
                  : (invoice as any).paymentMethod
                : 'N/A'
              : 'En attente'}
          </Descriptions.Item>
          {invoice.paidAt && (
            <Descriptions.Item label="Date de paiement">
              {dayjs(invoice.paidAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          )}
        </Descriptions>

        {invoice.notes && (
          <>
            <Divider className="!my-4 print:!my-2" />
            <div>
              <Text strong className="block mb-1">Notes</Text>
              <Text className="text-gray-600">{invoice.notes}</Text>
            </div>
          </>
        )}

        <Divider className="!my-4 print:!my-2" />

        <div className="text-center text-gray-400 text-xs space-y-1 print:text-gray-600">
          {company && (
            <>
              <div>{company.name} - {company.email} - {company.phone}</div>
              {company.address && (
                <div>
                  {company.address.street}, {company.address.zip} {company.address.city}
                  {company.address.state ? `, ${company.address.state}` : ''}
                  {company.address.country ? `, ${company.address.country}` : ''}
                </div>
              )}
            </>
          )}
          <div>Document généré le {dayjs().format('DD/MM/YYYY [à] HH:mm')}</div>
        </div>
      </Card>
    </div>
  );
};

export default InvoiceDetailPage;
