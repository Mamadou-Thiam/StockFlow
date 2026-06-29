import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Invoice, Company, Client } from '../models';
import { generateInvoicePDF } from '../services/pdfService';
import { sendInvoiceEmail } from '../services/emailService';
import { generateInvoiceNumber, paginate } from '../utils/helpers';

export async function getInvoices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, startDate, endDate } = req.query;
    const { skip, limit: pageLimit } = paginate(Number(page) || 1, Number(limit) || 20);

    const filter: any = { companyId: req.user!.companyId };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const [items, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('clientId', 'firstName lastName email')
        .populate('userId', 'firstName lastName'),
      Invoice.countDocuments(filter),
    ]);

    const currentPage = Number(page) || 1;
    res.json({
      success: true,
      data: {
        items,
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.user!.companyId })
      .populate('clientId')
      .populate('userId', 'firstName lastName email');
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Facture non trouvée' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function generatePdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.user!.companyId });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Facture non trouvée' });
      return;
    }

    const company = await Company.findById(req.user!.companyId);
    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }

    let client = null;
    if (invoice.clientId) {
      client = await Client.findById(invoice.clientId);
    }

    const pdfBuffer = await generateInvoicePDF(invoice, company, client);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export async function sendByEmail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.user!.companyId });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Facture non trouvée' });
      return;
    }

    const company = await Company.findById(req.user!.companyId);
    if (!company) {
      res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
      return;
    }

    let clientEmail = req.body.email;
    let client = null;
    if (!clientEmail && invoice.clientId) {
      client = await Client.findById(invoice.clientId);
      clientEmail = client?.email;
    }

    if (!clientEmail) {
      res.status(400).json({ success: false, message: 'Aucun email destinataire' });
      return;
    }

    let clientObj = null;
    if (invoice.clientId) {
      clientObj = await Client.findById(invoice.clientId);
    }

    const pdfBuffer = await generateInvoicePDF(invoice, company, clientObj);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${client ? `${client.firstName} ${client.lastName}` : 'Valued Customer'},</p>
        <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong>.</p>
        <p>Amount: <strong>${invoice.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CFA</strong></p>
        <p>Status: <strong>${invoice.status}</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">${company.name} - Stockflow</p>
      </div>
    `;

    await sendInvoiceEmail(clientEmail, `Invoice ${invoice.invoiceNumber}`, html, pdfBuffer);

    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      await invoice.save();
    }

    res.json({ success: true, message: 'Email envoyé avec succès' });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;

    const update: any = { $set: { status } };
    if (status === 'paid') {
      update.$set.paidAt = new Date();
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      update,
      { new: true }
    );
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Facture non trouvée' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function getNextInvoiceNumber(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const nextNumber = await generateInvoiceNumber(req.user!.companyId);
    res.json({ success: true, data: { invoiceNumber: nextNumber } });
  } catch (error) {
    next(error);
  }
}
