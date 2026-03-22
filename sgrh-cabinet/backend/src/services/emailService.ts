import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
}

export const sendEmail = async (options: MailOptions) => {
  if (!process.env.SMTP_USER) {
    logger.warn('SMTP non configuré — email non envoyé:', options.subject);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"SGRH Cabinet" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc?.join(', '),
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email envoyé: ${options.subject}`);
  } catch (err) {
    logger.error('Erreur envoi email:', err);
  }
};

export const sendBirthdayAlert = async (employeeName: string, recipientEmail: string, isToday: boolean) => {
  const subject = isToday
    ? `🎂 Anniversaire aujourd'hui: ${employeeName}`
    : `🔔 Anniversaire demain: ${employeeName}`;

  await sendEmail({
    to: recipientEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">SGRH Cabinet</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #1e3a5f;">
            ${isToday ? '🎂 Anniversaire du jour' : '🔔 Anniversaire demain'}
          </h3>
          <p>${isToday ? 'Aujourd\'hui, c\'est l\'anniversaire de' : 'Demain, c\'est l\'anniversaire de'} <strong>${employeeName}</strong>.</p>
          <p>Pensez à lui transmettre vos voeux !</p>
        </div>
        <div style="background: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px;">
          SGRH Cabinet — Système de Gestion des Ressources Humaines
        </div>
      </div>
    `,
  });
};

export const sendContractExpiryAlert = async (
  employeeName: string,
  contractType: string,
  expiryDate: string,
  daysRemaining: number,
  recipientEmails: string[]
) => {
  await sendEmail({
    to: recipientEmails,
    subject: `⚠️ Contrat à renouveler: ${employeeName} (${daysRemaining} jours)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">SGRH Cabinet</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #dc2626;">⚠️ Alerte Contrat</h3>
          <p>Le contrat de <strong>${employeeName}</strong> arrive à échéance dans <strong>${daysRemaining} jours</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">Type de contrat</td>
              <td style="padding: 8px;">${contractType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Date d'échéance</td>
              <td style="padding: 8px; color: #dc2626;">${expiryDate}</td>
            </tr>
            <tr style="background: #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">Jours restants</td>
              <td style="padding: 8px;">${daysRemaining}</td>
            </tr>
          </table>
          <p style="margin-top: 16px;">Veuillez prendre les dispositions nécessaires.</p>
        </div>
        <div style="background: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px;">
          SGRH Cabinet — Système de Gestion des Ressources Humaines
        </div>
      </div>
    `,
  });
};

export const sendMonthlyReport = async (year: number, month: number, filePath: string, recipients: string[]) => {
  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const monthName = monthNames[month - 1];

  await sendEmail({
    to: recipients,
    subject: `📊 Rapport RH Mensuel - ${monthName} ${year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">SGRH Cabinet</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #1e3a5f;">📊 Rapport RH Mensuel</h3>
          <p>Veuillez trouver ci-joint le rapport des données RH du mois de <strong>${monthName} ${year}</strong>.</p>
          <p>Ce rapport contient :</p>
          <ul>
            <li>KPIs annuels (YTD et TARGET)</li>
            <li>Effectifs par ligne de service</li>
            <li>Formations du mois</li>
          </ul>
        </div>
        <div style="background: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px;">
          SGRH Cabinet — Rapport généré automatiquement
        </div>
      </div>
    `,
  });
};
