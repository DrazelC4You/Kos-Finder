import nodemailer from 'nodemailer';

/**
 * Mailer Abstraction (Section 6)
 * Jika konfigurasi SMTP tersedia di environment, email dikirim sungguhan.
 * Jika tidak (default development), isi email dicetak ke console server
 * beserta link reset password agar alur tetap dapat diuji end-to-end.
 *
 * Environment:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 */

const isSmtpConfigured = Boolean(process.env.SMTP_HOST);

let transporter = null;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
}

const FROM = process.env.MAIL_FROM || 'KosFinder <no-reply@kosfinder.local>';

export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const subject = 'Reset Password Akun KosFinder Anda';
  const text = `Halo,\n\nKami menerima permintaan reset password untuk akun Anda.\nKlik tautan berikut untuk membuat password baru (berlaku 1 jam):\n\n${resetUrl}\n\nAbaikan email ini jika Anda tidak merasa memintanya.`;

  if (transporter) {
    await transporter.sendMail({ from: FROM, to: toEmail, subject, text });
    return { delivered: true, via: 'smtp' };
  }

  console.log('----------------------------------------------------------');
  console.log('📧 [MAILER - DEV MODE] SMTP belum dikonfigurasi.');
  console.log(`   Kepada : ${toEmail}`);
  console.log(`   Subjek : ${subject}`);
  console.log(`   Link   : ${resetUrl}`);
  console.log('----------------------------------------------------------');
  return { delivered: true, via: 'console' };
};

export const sendVerificationEmail = async (toEmail, verifyUrl) => {
  const subject = 'Verifikasi Email Akun Pemilik Kos KosFinder';
  const text = `Halo,\n\nTerima kasih telah mendaftar sebagai Pemilik Kos di KosFinder.\nKlik tautan berikut untuk memverifikasi email Anda (berlaku 24 jam):\n\n${verifyUrl}\n\nSetelah terverifikasi, Anda dapat mulai menambahkan listing kos.\nAbaikan email ini jika Anda tidak merasa mendaftar.`;

  if (transporter) {
    await transporter.sendMail({ from: FROM, to: toEmail, subject, text });
    return { delivered: true, via: 'smtp' };
  }

  console.log('----------------------------------------------------------');
  console.log('📧 [MAILER - DEV MODE] SMTP belum dikonfigurasi.');
  console.log(`   Kepada : ${toEmail}`);
  console.log(`   Subjek : ${subject}`);
  console.log(`   Link   : ${verifyUrl}`);
  console.log('----------------------------------------------------------');
  return { delivered: true, via: 'console' };
};
