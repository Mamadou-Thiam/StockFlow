import PDFDocument from 'pdfkit';
import { IInvoice, ICompany, IClient } from '../models';
import path from 'path';

export async function generateInvoicePDF(
  invoice: IInvoice,
  company: ICompany,
  client?: IClient | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = company.colors?.primary || '#2563eb';
    const secondaryColor = company.colors?.secondary || '#1e40af';

    const addHeader = () => {
      if (company.logo) {
        try {
          const logoPath = path.resolve(company.logo);
          doc.image(logoPath, 50, 45, { width: 60 });
        } catch {
          // continue without logo
        }
      }

      doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor)
        .text(company.name, company.logo ? 125 : 50, 50, { align: 'left' });

      doc.fontSize(9).font('Helvetica').fillColor('#374151');
      const companyDetails: string[] = [];
      if (company.address?.street) companyDetails.push(company.address.street);
      if (company.address?.city) companyDetails.push(company.address.city);
      if (company.address?.state) companyDetails.push(company.address.state);
      if (company.address?.zip) companyDetails.push(company.address.zip);
      if (company.address?.country) companyDetails.push(company.address.country);
      if (company.email) companyDetails.push(company.email);
      if (company.phone) companyDetails.push(company.phone);

      companyDetails.forEach((line, i) => {
        doc.text(line, company.logo ? 125 : 50, 75 + (i * 12), { align: 'left' });
      });
    };

    const addInvoiceTitle = () => {
      doc.moveDown(3);
      doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryColor)
        .text('INVOICE', { align: 'right' });

      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#374151');

      const rightColX = 400;
      let yPos = doc.y;

      doc.font('Helvetica-Bold').fillColor('#374151').text('Invoice Number:', 320, yPos);
      doc.font('Helvetica').fillColor('#6b7280').text(invoice.invoiceNumber, rightColX, yPos);

      yPos += 18;
      doc.font('Helvetica-Bold').fillColor('#374151').text('Date:', 320, yPos);
      doc.font('Helvetica').fillColor('#6b7280').text(
        new Date(invoice.createdAt).toLocaleDateString('fr-FR'), rightColX, yPos
      );

      if (invoice.dueDate) {
        yPos += 18;
        doc.font('Helvetica-Bold').fillColor('#374151').text('Due Date:', 320, yPos);
        doc.font('Helvetica').fillColor('#6b7280').text(
          new Date(invoice.dueDate).toLocaleDateString('fr-FR'), rightColX, yPos
        );
      }

      yPos += 18;
      doc.font('Helvetica-Bold').fillColor('#374151').text('Status:', 320, yPos);
      doc.font('Helvetica').fillColor(
        invoice.status === 'paid' ? '#059669' : 
        invoice.status === 'overdue' ? '#dc2626' : '#d97706'
      ).text(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1), rightColX, yPos);
    };

    const addClientInfo = () => {
      doc.moveDown(3);
      const yPos = doc.y;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#374151').text('Bill To:', 50, yPos);

      if (client) {
        const addrY = yPos + 20;
        doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
        doc.text(`${client.firstName} ${client.lastName}`, 50, addrY);
        let addrLine = addrY + 14;
        if (client.company) {
          doc.text(client.company, 50, addrLine);
          addrLine += 14;
        }
        if (client.address?.street) {
          doc.text(client.address.street, 50, addrLine);
          addrLine += 14;
        }
        const cityLine = [client.address?.city, client.address?.state, client.address?.zip]
          .filter(Boolean).join(' ');
        if (cityLine) {
          doc.text(cityLine, 50, addrLine);
          addrLine += 14;
        }
        if (client.address?.country) {
          doc.text(client.address.country, 50, addrLine);
          addrLine += 14;
        }
        if (client.email) {
          doc.text(client.email, 50, addrLine);
          addrLine += 14;
        }
        if (client.phone) {
          doc.text(client.phone, 50, addrLine);
        }
      } else {
        doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
          .text('No client information', 50, yPos + 20);
      }
    };

    const addItemsTable = () => {
      doc.moveDown(5);

      const tableTop = doc.y + 10;
      const colWidths = [180, 50, 80, 60, 80];
      const headers = ['Description', 'Qty', 'Unit Price', 'Tax Rate', 'Total'];
      const startX = 50;

      doc.rect(50, tableTop - 6, 500, 22).fill(primaryColor);

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
      let hX = startX;
      headers.forEach((header, i) => {
        doc.text(header, hX + 4, tableTop, { width: colWidths[i], align: 'left' });
        hX += colWidths[i];
      });

      let rowY = tableTop + 28;
      doc.font('Helvetica').fontSize(9).fillColor('#374151');

      invoice.items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(50, rowY - 4, 500, 20).fill('#f9fafb');
        }

        doc.fillColor('#374151');
        doc.text(item.name, 54, rowY, { width: colWidths[0] - 4 });
        doc.text(item.quantity.toString(), 54 + colWidths[0], rowY, { width: colWidths[1], align: 'center' });
        doc.text(formatCurrency(item.unitPrice), 54 + colWidths[0] + colWidths[1], rowY, { width: colWidths[2], align: 'right' });
        doc.text(`${item.taxRate}%`, 54 + colWidths[0] + colWidths[1] + colWidths[2], rowY, { width: colWidths[3], align: 'center' });
        doc.text(formatCurrency(item.total), 54 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowY, { width: colWidths[4], align: 'right' });

        rowY += 22;
      });

      const totalsY = rowY + 10;
      const lineX = 350;

      doc.rect(50, rowY, 500, 0.5).fill('#e5e7eb');

      doc.font('Helvetica').fontSize(10);
      doc.fillColor('#374151').text('Subtotal:', lineX, totalsY);
      doc.fillColor('#6b7280').text(formatCurrency(invoice.subtotal), 450, totalsY, { align: 'right' });

      let tY = totalsY + 18;
      doc.fillColor('#374151').text('Tax Total:', lineX, tY);
      doc.fillColor('#6b7280').text(formatCurrency(invoice.taxTotal), 450, tY, { align: 'right' });

      if (invoice.discount > 0) {
        tY += 18;
        doc.fillColor('#374151').text('Discount:', lineX, tY);
        doc.fillColor('#ef4444').text(`-${formatCurrency(invoice.discount)}`, 450, tY, { align: 'right' });
      }

      tY += 22;
      doc.rect(50, tY - 8, 500, 30).fill(primaryColor);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff');
      doc.text('Total:', 55, tY);
      doc.text(formatCurrency(invoice.total), 450, tY, { align: 'right' });
    };

    const addFooter = () => {
      const bottomY = doc.page.height - 80;
      doc.rect(50, bottomY - 5, 500, 0.5).fill('#e5e7eb');

      doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
      doc.text(company.name, 50, bottomY + 10, { align: 'center' });
      if (company.email || company.phone) {
        doc.text([company.email, company.phone].filter(Boolean).join(' | '), 50, bottomY + 22, { align: 'center' });
      }
      doc.text(`Invoice ${invoice.invoiceNumber} | Generated on ${new Date().toLocaleDateString('fr-FR')}`, 50, bottomY + 34, { align: 'center' });
    };

    const formatCurrency = (amount: number): string => {
      return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' CFA';
    };

    addHeader();
    addInvoiceTitle();
    addClientInfo();
    addItemsTable();
    addFooter();

    doc.end();
  });
}
