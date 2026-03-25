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

export const sendEmail = async (options: MailOptions): Promise<boolean> => {
  if (!process.env.SMTP_USER) {
    logger.warn('SMTP non configuré — email non envoyé:', options.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"SGRH Cabinet" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc?.join(', '),
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email envoyé: ${options.subject} → ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    return true;
  } catch (err) {
    logger.error(`Erreur envoi email "${options.subject}":`, err);
    return false;
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

export const sendUnplannedLeaveAlert = async (
  employeeName: string,
  subtype: string,
  days: number,
  hrEmails: string[]
) => {
  const subtypeLabels: Record<string, string> = {
    MALADIE: 'Maladie',
    DECES_FAMILLE: 'Décès famille',
    URGENCE: 'Urgence',
    AUTRE: 'Autre',
  };
  const label = subtypeLabels[subtype] || subtype || 'Imprévu';

  await sendEmail({
    to: hrEmails,
    subject: `🔔 Imprévu saisi: ${employeeName} — ${label} (${days}j)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">SGRH Cabinet</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #d97706;">🔔 Absence imprévue enregistrée</h3>
          <p>Une absence imprévue a été saisie pour <strong>${employeeName}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background: #fef3c7;">
              <td style="padding: 8px; font-weight: bold;">Motif</td>
              <td style="padding: 8px;">${label}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Durée</td>
              <td style="padding: 8px;">${days} jour(s)</td>
            </tr>
          </table>
          <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">
            Cette absence a été imputée sur le solde de congés du collaborateur.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px;">
          SGRH Cabinet — Système de Gestion des Ressources Humaines
        </div>
      </div>
    `,
  });
};

export const sendLeaveBalanceAlert = async (
  employeeName: string,
  overflowDays: number,
  hrEmails: string[]
) => {
  await sendEmail({
    to: hrEmails,
    subject: `⚠️ Dépassement solde congés: ${employeeName} (${overflowDays}j en dépassement)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">SGRH Cabinet</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #fecaca; background: #fff5f5;">
          <h3 style="color: #dc2626;">⚠️ Dépassement de solde de congés</h3>
          <p><strong>${employeeName}</strong> a dépassé son solde annuel de congés.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background: #fee2e2;">
              <td style="padding: 8px; font-weight: bold; color: #dc2626;">Jours en dépassement</td>
              <td style="padding: 8px; font-weight: bold; color: #dc2626;">${overflowDays} jour(s)</td>
            </tr>
          </table>
          <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">
            Ces jours seront déduits du solde de l'année prochaine lors du report de fin d'année.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px;">
          SGRH Cabinet — Système de Gestion des Ressources Humaines
        </div>
      </div>
    `,
  });
};

export const sendLeaveEndAlert = async (
  employeeName: string,
  endDate: string,
  managerEmail: string | null,
  employeeEmail: string | null
) => {
  const recipients = [managerEmail, employeeEmail].filter(Boolean) as string[];
  if (!recipients.length) return;

  await sendEmail({
    to: recipients,
    subject: `📅 Fin de congé dans 3 jours: ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">SGRH Cabinet</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #2563eb;">📅 Rappel de fin de congé</h3>
          <p>Le congé de <strong>${employeeName}</strong> se termine dans <strong>3 jours</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background: #eff6ff;">
              <td style="padding: 8px; font-weight: bold;">Date de reprise</td>
              <td style="padding: 8px; color: #2563eb; font-weight: bold;">${endDate}</td>
            </tr>
          </table>
          <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">
            Pensez à préparer le retour du collaborateur.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px;">
          SGRH Cabinet — Système de Gestion des Ressources Humaines
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, firstName: string, resetToken: string): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost'}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: '🔐 Réinitialisation de votre mot de passe — SGRH Cabinet',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">SGRH Cabinet</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #1e3a5f;">Réinitialisation de mot de passe</h3>
          <p>Bonjour <strong>${firstName}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #C8102E; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          <p style="color: #9ca3af; font-size: 11px; word-break: break-all;">Lien : ${resetUrl}</p>
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
