import nodemailer from 'nodemailer';

// User profile type used for email notifications
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  educationLevel: string;
  preferences: any;
  createdAt: string;
  updatedAt: string;
  status: string;
}

// Configure nodemailer transport using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Default "from" address for all outgoing e‑mails
const defaultSender = 'andaokuanlaoku@gmail.com';

/**
 * Send e‑mail to admins notifying that a new user registration is pending verification.
 */
export async function sendAdminNotification(profile: UserProfile): Promise<void> {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    console.warn('No ADMIN_EMAILS configured – skipping admin notification');
    return;
  }

  const mailOptions = {
    from: defaultSender,
    to: adminEmails,
    subject: `[AndaOku] Yeni kullanıcı kaydı bekliyor: ${profile.displayName}`,
    text: `Yeni bir kullanıcı kaydı oluşturuldu ve onay bekliyor.\n\nKullanıcı: ${profile.displayName}\nE‑posta: ${profile.email}\nRol: ${profile.role}\nEğitim seviyesi: ${profile.educationLevel}\n\nLütfen yönetim panelinden onaylayın.`,
  };
  await transporter.sendMail(mailOptions);
}

/**
 * Send e‑mail to a user informing that their account has been approved.
 */
export async function sendUserApprovalEmail(email: string, name: string): Promise<void> {
  const mailOptions = {
    from: defaultSender,
    to: email,
    subject: '[AndaOku] Üyeliğiniz onaylandı',
    text: `Merhaba ${name},\n\nÜyeliğiniz onaylandı ve platforma giriş yapabilirsiniz.\n\nİyi okumalar!`,
  };
  await transporter.sendMail(mailOptions);
}

/**
 * Send e‑mail to a user informing that their role (account type) has changed.
 * Example: "Hesap türünüz öğretmen olarak değiştirildi".
 */
export async function sendRoleChangeEmail(email: string, name: string, newRole: string): Promise<void> {
  const mailOptions = {
    from: defaultSender,
    to: email,
    subject: '[AndaOku] Hesap türünüz değiştirildi',
    text: `Merhaba ${name},\n\nHesap türünüz **${newRole}** olarak değiştirildi.\nArtık yeni yetkileri kullanabilirsiniz.\n\nİyi okumalar!`,
  };
  await transporter.sendMail(mailOptions);
}
