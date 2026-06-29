import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const smtpConfigured = (): boolean => {
  return !!(config.smtp.user && config.smtp.pass);
};

export async function sendInvoiceEmail(
  to: string,
  subject: string,
  html: string,
  pdfBuffer?: Buffer
): Promise<void> {
  if (!smtpConfigured()) {
    console.log('[DEV] Invoice email would be sent to:', to);
    console.log('[DEV] Subject:', subject);
    console.log('[DEV] PDF size:', pdfBuffer ? `${(pdfBuffer.length / 1024).toFixed(2)} KB` : 'N/A');
    return;
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Stockflow" <${config.smtp.user}>`,
    to,
    subject,
    html,
  };

  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: `invoice.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];
  }

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>You have requested to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
      <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">Stockflow - Inventory Management</p>
    </div>
  `;

  if (!smtpConfigured()) {
    console.log('[DEV] Password reset email to:', to);
    console.log('[DEV] Reset URL:', resetUrl);
    return;
  }

  await transporter.sendMail({
    from: `"Stockflow" <${config.smtp.user}>`,
    to,
    subject: 'Password Reset - Stockflow',
    html,
  });
}

export async function sendWelcomeEmail(
  to: string,
  companyName: string
): Promise<void> {
  const dashboardUrl = `${config.frontendUrl}/dashboard`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Stockflow!</h2>
      <p>Hello <strong>${companyName}</strong>,</p>
      <p>Your account has been successfully created. You can now start managing your inventory, sales, and invoices.</p>
      <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Go to Dashboard</a>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">Stockflow - Inventory Management</p>
    </div>
  `;

  if (!smtpConfigured()) {
    console.log('[DEV] Welcome email to:', to);
    return;
  }

  await transporter.sendMail({
    from: `"Stockflow" <${config.smtp.user}>`,
    to,
    subject: 'Welcome to Stockflow!',
    html,
  });
}
