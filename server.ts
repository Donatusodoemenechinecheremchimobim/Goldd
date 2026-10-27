import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLINIC_EMAIL = process.env.DOCTOR_NOTIFICATION_EMAIL || 'info@goldenmindpsychiatry.org';
const SITE_URL = process.env.APP_URL || 'https://goldenmindpsychiatry.org';
const LOGO_URL = `${SITE_URL}/golden_mind_card.webp`;

/**
 * Wraps email body HTML inside the official Golden Mind Psychiatry PLLC
 * corporate HTML email template with the practice logo and Brenda Hobyani's signature.
 */
function buildBrandedEmailHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:24px;background-color:#FAF9F5;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#1C1917;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #E7E5E4;">
    <tr>
      <td style="background:#080808;padding:28px 32px;text-align:center;border-bottom:2px solid #D4AF37;">
        <img src="${LOGO_URL}" alt="Golden Mind Psychiatry PLLC" style="width:180px;height:auto;border-radius:12px;border:1px solid rgba(212,175,55,0.4);display:block;margin:0 auto 12px auto;" />
        <div style="color:#D4AF37;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">
          Golden Mind Psychiatry PLLC
        </div>
        <div style="color:#FFFFFF;font-size:18px;font-weight:700;margin-top:4px;">
          “Where Every Mind Is Golden.”
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;font-size:14px;line-height:1.6;color:#44403C;">
        ${bodyHtml}
        <hr style="border:none;border-top:1px solid #E7E5E4;margin:28px 0 20px 0;" />
        <p style="margin:0;font-size:12px;color:#57534E;line-height:1.6;">
          Warmly,<br />
          <strong style="color:#1C1917;">Brenda Hobyani, MSN, APRN, PMHNP-BC</strong><br />
          Founder &amp; Lead Clinical Director · Golden Mind Psychiatry PLLC<br />
          100% Telehealth Across Texas · Mon–Thu 8:00 AM – 4:00 PM, Fri 9:00 AM – 1:00 PM<br />
          Phone: <a href="tel:+14329343185" style="color:#9E7206;text-decoration:none;">(432) 934-3185</a> ·
          Email: <a href="mailto:${CLINIC_EMAIL}" style="color:#9E7206;text-decoration:none;">${CLINIC_EMAIL}</a> ·
          <a href="${SITE_URL}" style="color:#9E7206;text-decoration:none;">goldenmindpsychiatry.org</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Creates Nodemailer SMTP transporter if SMTP_HOST / SMTP_USER / SMTP_PASS are configured in .env
 */
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE !== 'false' && port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendClinicEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ deliveredViaSmtp: boolean }> {
  const transporter = getSmtpTransporter();
  const fromAddress =
    process.env.SMTP_FROM || `Golden Mind Psychiatry PLLC <${CLINIC_EMAIL}>`;

  if (transporter) {
    await transporter.sendMail({
      from: fromAddress,
      to: opts.to,
      replyTo: opts.replyTo || CLINIC_EMAIL,
      subject: opts.subject,
      html: opts.html,
    });
    return { deliveredViaSmtp: true };
  }

  return { deliveredViaSmtp: false };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Appointment Booking Email Dispatch (Doctor Notification + Patient Confirmation with Logo)
  app.post('/api/email/appointment', async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        dateOfBirth,
        serviceType,
        conditionReason,
        preferredDate,
        preferredTime,
        insuranceProvider,
        notes,
        telehealthUrl,
      } = req.body || {};

      // Branded Doctor Notification Email to info@goldenmindpsychiatry.org
      const doctorHtml = buildBrandedEmailHtml(
        `New Telehealth Appointment Booking: ${fullName}`,
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">New 100% Telehealth Appointment Booked</h2>
        <p style="margin:0 0 16px 0;">A patient has booked a telehealth consultation on <strong>goldenmindpsychiatry.org</strong> and the record has been saved in real time to your Provider Portal.</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#FAF9F5;border:1px solid #E7E5E4;border-radius:12px;font-size:13px;">
          <tr><td><strong>Patient Name:</strong></td><td>${fullName || 'N/A'}</td></tr>
          <tr><td><strong>Date of Birth:</strong></td><td>${dateOfBirth || 'N/A'}</td></tr>
          <tr><td><strong>Patient Email:</strong></td><td>${email || 'N/A'}</td></tr>
          <tr><td><strong>Phone Number:</strong></td><td>${phone || 'N/A'}</td></tr>
          <tr><td><strong>Service Type:</strong></td><td>${serviceType || 'Comprehensive Psychiatric Evaluation'}</td></tr>
          <tr><td><strong>Primary Concern:</strong></td><td>${conditionReason || 'General Psychiatric Evaluation'}</td></tr>
          <tr><td><strong>Preferred Date &amp; Window:</strong></td><td>${preferredDate || 'Next Available'} · ${preferredTime || ''}</td></tr>
          <tr><td><strong>Insurance / Coverage:</strong></td><td>${insuranceProvider || 'N/A'}</td></tr>
          <tr><td><strong>HIPAA Video Room:</strong></td><td><a href="${telehealthUrl || SITE_URL}" style="color:#9E7206;">${telehealthUrl || 'Provisioned in Portal'}</a></td></tr>
          <tr><td><strong>Patient Notes:</strong></td><td>${notes || 'None provided'}</td></tr>
        </table>
        <div style="text-align:center;margin:24px 0 8px 0;">
          <a href="${SITE_URL}/?page=portal" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#F3E5AB 0%,#D4AF37 50%,#AA7C11 100%);color:#1C1917;font-weight:700;text-decoration:none;border-radius:12px;">
            Open Provider Clinical Command Center
          </a>
        </div>
        `
      );

      // Branded Patient Confirmation Email with Golden Mind Logo
      const patientHtml = buildBrandedEmailHtml(
        'Your 100% Telehealth Appointment Confirmation — Golden Mind Psychiatry PLLC',
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">Hello ${fullName || 'Valued Patient'},</h2>
        <p style="margin:0 0 16px 0;">Your <strong>100% Telehealth Video Consultation</strong> with <strong>Brenda Hobyani, MSN, APRN, PMHNP-BC</strong> at <strong>Golden Mind Psychiatry PLLC</strong> has been received and saved to your chart.</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#FAF9F5;border:1px solid #E7E5E4;border-radius:12px;font-size:13px;">
          <tr><td><strong>Focus Area:</strong></td><td>${conditionReason || 'Psychiatric Evaluation'}</td></tr>
          <tr><td><strong>Date &amp; Time Window:</strong></td><td>${preferredDate || 'Next Available'} · ${preferredTime || ''}</td></tr>
          <tr><td><strong>Insurance / Payment:</strong></td><td>${insuranceProvider || 'N/A'}</td></tr>
          <tr><td><strong>HIPAA Video Link:</strong></td><td><a href="${telehealthUrl || SITE_URL}" style="color:#9E7206;">${telehealthUrl || 'Available in Client Portal'}</a></td></tr>
        </table>
        <p style="margin:16px 0;">Please sign in to your <strong>Client Portal</strong> using <strong>${email}</strong> to complete your Digital Psychiatric Intake Forms and baseline PHQ-9 / GAD-7 check-in prior to your session:</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${SITE_URL}/?page=portal" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F3E5AB 0%,#D4AF37 50%,#AA7C11 100%);color:#1C1917;font-weight:700;text-decoration:none;border-radius:12px;">
            Access Client Portal &amp; Intake Forms
          </a>
        </div>
        `
      );

      const doctorResult = await sendClinicEmail({
        to: CLINIC_EMAIL,
        replyTo: email || CLINIC_EMAIL,
        subject: `[New Appointment] ${fullName} — ${conditionReason} (${preferredDate || 'Next Available'})`,
        html: doctorHtml,
      });

      if (email) {
        await sendClinicEmail({
          to: email,
          subject: 'Appointment Confirmation — Golden Mind Psychiatry PLLC',
          html: patientHtml,
        });
      }

      res.json({ ok: true, deliveredViaSmtp: doctorResult.deliveredViaSmtp });
    } catch (error) {
      console.error('Appointment email dispatch error:', error);
      res.status(200).json({ ok: true, deliveredViaSmtp: false });
    }
  });

  // 2. Confidential Contact Inquiry Email Dispatch to Doctor (info@goldenmindpsychiatry.org)
  app.post('/api/email/contact', async (req, res) => {
    try {
      const { name, email, phone, message } = req.body || {};
      const html = buildBrandedEmailHtml(
        `New Confidential Inquiry from ${name}`,
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">New Patient Contact Inquiry</h2>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#FAF9F5;border:1px solid #E7E5E4;border-radius:12px;font-size:13px;">
          <tr><td><strong>Name:</strong></td><td>${name || 'N/A'}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${email || 'N/A'}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${phone || 'N/A'}</td></tr>
          <tr><td><strong>Message:</strong></td><td>${message || ''}</td></tr>
        </table>
        `
      );

      const result = await sendClinicEmail({
        to: CLINIC_EMAIL,
        replyTo: email || CLINIC_EMAIL,
        subject: `[Website Inquiry] ${name} — Golden Mind Psychiatry PLLC`,
        html,
      });

      res.json({ ok: true, deliveredViaSmtp: result.deliveredViaSmtp });
    } catch (error) {
      console.error('Contact email dispatch error:', error);
      res.status(200).json({ ok: true, deliveredViaSmtp: false });
    }
  });

  // 3. Branded Welcome & Verification Notification Email via SMTP
  app.post('/api/email/welcome-verify', async (req, res) => {
    try {
      const { fullName, email, phone } = req.body || {};
      if (email) {
        const clientHtml = buildBrandedEmailHtml(
          'Verify Your Client Portal Account — Golden Mind Psychiatry PLLC',
          `
          <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">Welcome to Golden Mind Psychiatry PLLC, ${fullName || 'Valued Patient'}!</h2>
          <p style="margin:0 0 16px 0;">Thank you for creating your HIPAA-encrypted Client Portal account associated with <strong>${email}</strong>.</p>
          <p style="margin:0 0 16px 0;">Please click the verification link sent to your inbox to confirm your email address, then open your Client Portal to complete your assigned Psychiatric Intake Forms:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/?page=portal" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F3E5AB 0%,#D4AF37 50%,#AA7C11 100%);color:#1C1917;font-weight:700;text-decoration:none;border-radius:12px;">
              Open Golden Mind Client Portal
            </a>
          </div>
          `
        );
        await sendClinicEmail({
          to: email,
          subject: 'Welcome to Golden Mind Psychiatry PLLC — Verify Your Portal Account',
          html: clientHtml,
        });
      }

      const doctorAlertHtml = buildBrandedEmailHtml(
        `New Client Portal Registration: ${fullName || email}`,
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">New Patient Portal Registration</h2>
        <p><strong>${fullName || 'New Patient'}</strong> (${email} · ${phone || 'No phone provided'}) has registered for a Client Portal account and was sent an email verification link.</p>
        `
      );
      const result = await sendClinicEmail({
        to: CLINIC_EMAIL,
        subject: `[New Portal Registration] ${fullName || email}`,
        html: doctorAlertHtml,
      });

      res.json({ ok: true, deliveredViaSmtp: result.deliveredViaSmtp });
    } catch (error) {
      console.error('Welcome email dispatch error:', error);
      res.status(200).json({ ok: true, deliveredViaSmtp: false });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Golden Mind Psychiatry server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
