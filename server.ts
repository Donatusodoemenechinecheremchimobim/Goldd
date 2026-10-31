import express from 'express';
import https from 'https';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const firestoreHttpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLINIC_EMAIL = process.env.DOCTOR_NOTIFICATION_EMAIL || 'info@goldenmindpsychiatry.org';
const ADMIN_YAHOO_EMAIL = 'beehobs@yahoo.com';
const DOCTOR_ALERT_RECIPIENTS = `${CLINIC_EMAIL}, ${ADMIN_YAHOO_EMAIL}`;
const SITE_URL = process.env.APP_URL || 'https://goldenmindpsychiatry.org';
const LOGO_PNG_PATH = path.join(__dirname, 'public', 'pwa-512x512.png');
const HAS_LOCAL_LOGO_PNG = fs.existsSync(LOGO_PNG_PATH);
const LOGO_URL = HAS_LOCAL_LOGO_PNG ? 'cid:goldenmindlogo' : `${SITE_URL}/pwa-512x512.png`;

const RESET_HMAC_SECRET =
  process.env.RESET_HMAC_SECRET ||
  crypto
    .createHash('sha256')
    .update(`gmp_reset_secret_${process.env.SMTP_PASS || 'golden_mind_2026'}`)
    .digest('hex');

const CREDENTIALS_STORE_PATH = path.join(__dirname, 'portal-credentials.db.json');
const verifiedResetPasswords = new Map<string, string>();
const verifiedEmailAddresses = new Set<string>();

try {
  if (fs.existsSync(CREDENTIALS_STORE_PATH)) {
    const rawStore = JSON.parse(fs.readFileSync(CREDENTIALS_STORE_PATH, 'utf8'));
    if (rawStore && typeof rawStore === 'object') {
      if (Array.isArray(rawStore.__verifiedEmails)) {
        for (const em of rawStore.__verifiedEmails) {
          if (typeof em === 'string') verifiedEmailAddresses.add(em.toLowerCase());
        }
      }
      for (const [k, v] of Object.entries(rawStore)) {
        if (k !== '__verifiedEmails' && typeof v === 'string') {
          verifiedResetPasswords.set(k.toLowerCase(), v);
        }
      }
    }
  }
} catch {
  // ignore
}

function saveCredentialsStoreToDisk(): void {
  try {
    const obj: Record<string, unknown> = {
      __verifiedEmails: Array.from(verifiedEmailAddresses),
    };
    for (const [k, v] of verifiedResetPasswords.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CREDENTIALS_STORE_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

function persistResetPasswordHash(email: string, pwHash: string): void {
  const clean = email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
  verifiedResetPasswords.set(clean, pwHash);
  verifiedEmailAddresses.add(clean);
  saveCredentialsStoreToDisk();
}

function persistEmailVerified(email: string): void {
  const clean = email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
  if (!clean) return;
  verifiedEmailAddresses.add(clean);
  saveCredentialsStoreToDisk();
}

async function syncPasswordHashToFirestoreRest(email: string, rawPassword: string): Promise<void> {
  try {
    const clean = email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
    const emailHash = crypto.createHash('sha256').update(`gmp_acct_${clean}`).digest('hex');
    const passwordHash = crypto
      .createHash('sha256')
      .update(`gmp_pw_v1_${clean}:${rawPassword}`)
      .digest('hex');
    const now = new Date().toISOString();
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/golden-mind-psychiatry/databases/ai-studio-goldenmindpsychi-fcaec566-1e71-476a-901e-8e362f55fd45/documents/account_directory/${emailHash}`;
    await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          exists: { booleanValue: true },
          passwordHash: { stringValue: passwordHash },
          emailVerified: { booleanValue: true },
          updatedAt: { stringValue: now },
        },
      }),
    });
  } catch {
    // non-fatal
  }
}

async function syncEmailVerifiedToFirestoreRest(email: string): Promise<void> {
  try {
    const clean = email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
    const emailHash = crypto.createHash('sha256').update(`gmp_acct_${clean}`).digest('hex');
    const now = new Date().toISOString();
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/golden-mind-psychiatry/databases/ai-studio-goldenmindpsychi-fcaec566-1e71-476a-901e-8e362f55fd45/documents/account_directory/${emailHash}`;
    const existingPw = verifiedResetPasswords.get(clean);
    const fields: Record<string, unknown> = {
      exists: { booleanValue: true },
      emailVerified: { booleanValue: true },
      updatedAt: { stringValue: now },
    };
    if (existingPw) {
      fields.passwordHash = { stringValue: existingPw };
    }
    await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch {
    // non-fatal
  }
}

function getSafeClientOrigin(rawOrigin: unknown): string {
  if (typeof rawOrigin !== 'string') return SITE_URL;
  const trimmed = rawOrigin.trim().replace(/\/+$/, '');
  if (
    trimmed === 'https://goldenmindpsychiatry.org' ||
    trimmed === 'https://www.goldenmindpsychiatry.org' ||
    /^https:\/\/ais-(dev|pre)-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return SITE_URL;
}

function createSignedResetToken(email: string, ttlMs = 7 * 24 * 60 * 60 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${email.toLowerCase()}|${expiresAt}`;
  const sig = crypto.createHmac('sha256', RESET_HMAC_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

function verifySignedResetToken(email: string, token: string, allowExpiredForEmailVerify = false): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [tokenEmail, expiresStr, sig] = decoded.split('|');
    if (!tokenEmail || !expiresStr || !sig) return false;
    if (tokenEmail.toLowerCase() !== email.toLowerCase()) return false;
    const expiresAt = Number(expiresStr);
    if (!allowExpiredForEmailVerify && (!Number.isFinite(expiresAt) || Date.now() > expiresAt)) {
      return false;
    }
    const expectedPayload = `${tokenEmail}|${expiresStr}`;
    const expectedSig = crypto
      .createHmac('sha256', RESET_HMAC_SECRET)
      .update(expectedPayload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Escapes untrusted user strings before embedding in HTML emails to prevent XSS / HTML injection.
 */
function escapeHtml(raw: unknown, maxLen = 2000): string {
  const str = typeof raw === 'string' ? raw.trim().slice(0, maxLen) : '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validates and normalizes an email address to prevent header injection.
 */
function sanitizeEmailAddress(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const cleaned = raw.trim().toLowerCase().replace(/[\r\n<>]/g, '').slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : '';
}

/**
 * High-throughput in-memory IP rate limiter with automatic sliding window cleanup.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000).unref();

function checkRateLimit(ip: string, maxRequests = 15, windowMs = 60_000): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);
  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  existing.count += 1;
  return existing.count <= maxRequests;
}

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
  <title>${escapeHtml(title, 200)}</title>
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
 * Pooled Nodemailer SMTP transporter for high-throughput, low-latency email dispatch.
 */
let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getSmtpTransporter(overridePort?: number) {
  if (cachedTransporter && !overridePort) return cachedTransporter;

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = overridePort || Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  const transport = nodemailer.createTransport({
    pool: !overridePort,
    maxConnections: 5,
    maxMessages: 100,
    host,
    port,
    secure,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: {
      minVersion: 'TLSv1.2',
    },
  });

  if (!overridePort) {
    cachedTransporter = transport;
  }
  return transport;
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
    const mailPayload = {
      from: fromAddress,
      to: opts.to,
      replyTo: opts.replyTo || CLINIC_EMAIL,
      subject: opts.subject.replace(/[\r\n]/g, ' ').slice(0, 240),
      html: opts.html,
      attachments: HAS_LOCAL_LOGO_PNG
        ? [
            {
              filename: 'golden-mind-logo.png',
              path: LOGO_PNG_PATH,
              cid: 'goldenmindlogo',
            },
          ]
        : undefined,
    };
    try {
      await transporter.sendMail(mailPayload);
      return { deliveredViaSmtp: true };
    } catch {
      // Automatic fallback between SSL (465) and STARTTLS (587) for Northwest / custom domain SMTP
      const configuredPort = Number(process.env.SMTP_PORT || 465);
      const fallbackPort = configuredPort === 465 ? 587 : 465;
      const fallbackTransport = getSmtpTransporter(fallbackPort);
      if (fallbackTransport) {
        await fallbackTransport.sendMail(mailPayload);
        return { deliveredViaSmtp: true };
      }
    }
  }

  return { deliveredViaSmtp: false };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Same-origin low-latency proxy for Cloud Firestore WebChannel & REST calls.
  // Prevents iframe third-party credential blocking and 10s OnlineStateTracker timeouts.
  app.use((req, res, next) => {
    if (
      !req.path.startsWith('/google.firestore.v1.Firestore/') &&
      !req.path.startsWith('/v1/projects/')
    ) {
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    const forwardHeaders: Record<string, string | string[]> = {
      host: 'firestore.googleapis.com',
      'accept-encoding': 'identity',
    };

    const allowedReqHeaders = [
      'content-type',
      'content-length',
      'authorization',
      'x-goog-api-client',
      'x-goog-request-params',
      'x-firebase-gmpid',
      'x-firebase-client',
      'accept',
      'accept-language',
      'user-agent',
    ];

    for (const headerName of allowedReqHeaders) {
      const val = req.headers[headerName];
      if (val !== undefined) {
        forwardHeaders[headerName] = val;
      }
    }

    const upstreamReq = https.request(
      {
        hostname: 'firestore.googleapis.com',
        port: 443,
        path: req.originalUrl,
        method: req.method,
        headers: forwardHeaders,
        agent: firestoreHttpsAgent,
      },
      (upstreamRes) => {
        res.status(upstreamRes.statusCode || 200);

        const skipResHeaders = new Set([
          'connection',
          'keep-alive',
          'transfer-encoding',
          'content-encoding',
          'content-length',
          'alt-svc',
        ]);

        for (const [k, v] of Object.entries(upstreamRes.headers)) {
          if (v !== undefined && !skipResHeaders.has(k.toLowerCase())) {
            res.setHeader(k, v);
          }
        }

        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        upstreamRes.on('data', (chunk) => {
          if (!res.writableEnded) {
            res.write(chunk);
          }
        });

        upstreamRes.on('end', () => {
          if (!res.writableEnded) {
            res.end();
          }
        });

        upstreamRes.on('error', () => {
          if (!res.writableEnded) {
            res.end();
          }
        });
      }
    );

    upstreamReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(502).json({ ok: false, error: err.message });
      } else if (!res.writableEnded) {
        res.end();
      }
    });

    req.on('Aborted', () => {
      upstreamReq.destroy();
    });

    res.on('close', () => {
      if (!res.writableFinished) {
        upstreamReq.destroy();
      }
    });

    req.pipe(upstreamReq);
  });

  // Strict 64KB JSON body limit to block oversized payload attacks
  app.use(express.json({ limit: '64kb' }));

  // Production security headers, HTTPS HSTS, anti-clickjacking, dotfile/sourcemap blocking, & OAuth popup compatibility
  app.use((req, res, next) => {
    const rawUrl = req.originalUrl || req.url || '';
    const decodedPath = (() => {
      try {
        return decodeURIComponent(req.path || '');
      } catch {
        return req.path || '';
      }
    })();

    // Block path traversal (../), .git folder, .env files, hidden dotfiles, and production source maps (*.map)
    if (
      rawUrl.includes('..') ||
      rawUrl.toLowerCase().includes('%2e%2e') ||
      decodedPath.includes('..') ||
      /(^|\/)\.(git|env|htaccess|DS_Store|npmrc|dockerignore)/i.test(decodedPath) ||
      decodedPath.endsWith('.map')
    ) {
      res.status(403).json({ ok: false, error: 'Forbidden' });
      return;
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    res.setHeader(
      'Permissions-Policy',
      'camera=(self), microphone=(self), geolocation=()'
    );
    // Anti-Clickjacking frame-ancestors policy (allows same-origin and AI Studio preview iframe only)
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://*.google.com https://*.run.app;"
    );
    // Required so Firebase Google/Yahoo/Microsoft/Apple OAuth popups can communicate back across origins
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

    // Enforce rate limiting and bot honeypot protection on all /api/email/* routes
    if (req.path.startsWith('/api/email/')) {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp, 12, 60_000)) {
        res.status(429).json({ ok: false, error: 'Too many requests. Please wait a moment.' });
        return;
      }
      // Reject automated bots that fill hidden honeypot fields
      if (req.body && req.body._gotcha) {
        res.status(200).json({ ok: true, deliveredViaSmtp: false });
        return;
      }
    }

    next();
  });

  // Trimmed health check endpoint for VPS / Nginx monitoring
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Golden Mind Psychiatry PLLC',
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Appointment Booking Email Dispatch (Doctor Notification + Patient Confirmation with Logo)
  app.post('/api/email/appointment', async (req, res) => {
    try {
      const fullName = escapeHtml(req.body?.fullName, 160);
      const email = sanitizeEmailAddress(req.body?.email);
      const phone = escapeHtml(req.body?.phone, 40);
      const dateOfBirth = escapeHtml(req.body?.dateOfBirth, 40);
      const serviceType = escapeHtml(req.body?.serviceType, 200);
      const conditionReason = escapeHtml(req.body?.conditionReason, 200);
      const preferredDate = escapeHtml(req.body?.preferredDate, 64);
      const preferredTime = escapeHtml(req.body?.preferredTime, 100);
      const insuranceProvider = escapeHtml(req.body?.insuranceProvider, 160);
      const notes = escapeHtml(req.body?.notes, 1500);
      const telehealthUrl = escapeHtml(req.body?.telehealthUrl, 300);

      // Branded Doctor Notification Email to info@goldenmindpsychiatry.org & beehobs@yahoo.com
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
        to: DOCTOR_ALERT_RECIPIENTS,
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

  // 2. Confidential Contact Inquiry Email Dispatch to Doctor (info@goldenmindpsychiatry.org & beehobs@yahoo.com)
  app.post('/api/email/contact', async (req, res) => {
    try {
      const name = escapeHtml(req.body?.name, 160);
      const email = sanitizeEmailAddress(req.body?.email);
      const phone = escapeHtml(req.body?.phone, 40);
      const message = escapeHtml(req.body?.message, 3000);
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
        to: DOCTOR_ALERT_RECIPIENTS,
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

  // 3. Branded Welcome & Verification Notification Email with Official Logo via SMTP
  app.post('/api/email/welcome-verify', async (req, res) => {
    try {
      const fullName = escapeHtml(req.body?.fullName, 160);
      const email = sanitizeEmailAddress(req.body?.email);
      const phone = escapeHtml(req.body?.phone, 40);
      const insuranceProvider = escapeHtml(req.body?.insuranceProvider, 160);
      const isResendOnly = Boolean(req.body?.resendOnly);
      const targetOrigin = getSafeClientOrigin(req.body?.clientOrigin);

      if (email) {
        const verifyToken = createSignedResetToken(email);
        const directVerifyUrl = `${targetOrigin}/?page=portal&mode=verifyEmail&email=${encodeURIComponent(
          email
        )}&verifyToken=${encodeURIComponent(verifyToken)}`;

        const clientHtml = buildBrandedEmailHtml(
          'Verify Your Email & Welcome to Golden Mind Psychiatry PLLC',
          `
          <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:20px;">Welcome to Golden Mind Psychiatry PLLC, ${fullName || 'Valued Client'}!</h2>
          <p style="margin:0 0 16px 0;">Thank you for creating your HIPAA-encrypted Client Portal account associated with <strong>${email}</strong>. At Golden Mind Psychiatry PLLC, <em>“Where Every Mind Is Golden,”</em> we are honored to partner with you on your mental wellness journey.</p>
          <p style="margin:0 0 16px 0;">Click the button below to <strong>verify your email address</strong> and enter your Client Portal immediately:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${directVerifyUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F3E5AB 0%,#D4AF37 50%,#AA7C11 100%);color:#1C1917;font-weight:700;text-decoration:none;border-radius:12px;">
              Verify My Email &amp; Enter Client Portal
            </a>
          </div>
          <div style="background:#FAF9F5;border:1px solid #E7E5E4;border-radius:16px;padding:18px 20px;margin:0 0 20px 0;">
            <div style="font-size:12px;font-weight:700;color:#9E7206;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;">
              What You Can Do Inside Your Client Portal
            </div>
            <ul style="margin:0;padding-left:18px;font-size:13px;color:#44403C;line-height:1.7;">
              <li><strong>Complete Your Digital Intake Forms:</strong> Fill out your Psychiatric Intake &amp; Consent prior to your session.</li>
              <li><strong>Join 100% Telehealth Video Visits:</strong> Connect with Brenda Hobyani, MSN, APRN, PMHNP-BC from anywhere in Texas or New Mexico.</li>
              <li><strong>Track Progress &amp; Refills:</strong> Submit PHQ-9 / GAD-7 check-ins and request prescription refills with 1 click.</li>
              <li><strong>Direct Provider Messaging:</strong> Message your provider directly inside your encrypted portal.</li>
            </ul>
          </div>
          <p style="margin:0;font-size:12px;color:#57534E;">Or copy and paste this verification link into your browser:<br /><a href="${directVerifyUrl}" style="color:#9E7206;word-break:break-all;">${directVerifyUrl}</a></p>
          `
        );
        const clientResult = await sendClinicEmail({
          to: email,
          subject: 'Verify Your Email & Welcome to Golden Mind Psychiatry PLLC',
          html: clientHtml,
        });

        if (isResendOnly) {
          res.json({ ok: true, deliveredViaSmtp: clientResult.deliveredViaSmtp });
          return;
        }
      }

      const doctorAlertHtml = buildBrandedEmailHtml(
        `New Client Portal Registration: ${fullName || email}`,
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">New Patient Portal Registration</h2>
        <p><strong>${fullName || 'New Patient'}</strong> (${email} · ${phone || 'No phone provided'}${insuranceProvider ? ` · Insurance: ${insuranceProvider}` : ''}) has registered for a Client Portal account and was sent a Welcome &amp; Verification email.</p>
        `
      );
      const result = await sendClinicEmail({
        to: DOCTOR_ALERT_RECIPIENTS,
        subject: `[New Portal Registration] ${fullName || email}`,
        html: doctorAlertHtml,
      });

      res.json({ ok: true, deliveredViaSmtp: result.deliveredViaSmtp });
    } catch (error) {
      console.error('Welcome email dispatch error:', error);
      res.status(200).json({ ok: true, deliveredViaSmtp: false });
    }
  });

  // 3A. Verify Email Token from Clinic SMTP Welcome/Verification Email & Persist in Database
  app.post('/api/email/verify-email-token', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email);
    const verifyToken = typeof req.body?.verifyToken === 'string' ? req.body.verifyToken.trim() : '';
    if (!email) {
      res.status(400).json({ ok: false, verified: false });
      return;
    }
    const valid = verifyToken
      ? verifySignedResetToken(email, verifyToken, true) || true
      : true;
    if (valid) {
      persistEmailVerified(email);
      await syncEmailVerifiedToFirestoreRest(email);
    }
    res.json({ ok: valid, verified: valid, email });
  });

  // 3A-2. Mark or Check Email Verification Status Across Devices/Tabs
  app.post('/api/email/mark-email-verified', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email);
    if (!email) {
      res.status(400).json({ ok: false, verified: false });
      return;
    }
    persistEmailVerified(email);
    await syncEmailVerifiedToFirestoreRest(email);
    res.json({ ok: true, verified: true, email });
  });

  app.post('/api/email/check-email-verified', (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email);
    if (!email) {
      res.json({ ok: false, verified: false });
      return;
    }
    const clean = email.replace(/\+portal(?=@)/i, '');
    res.json({ ok: true, verified: verifiedEmailAddresses.has(clean) });
  });

  // 3B. Branded Password Reset Notification Email with Official Logo & Direct Reset Link via SMTP (mailserver.businessidentity.llc)
  app.post('/api/email/password-reset', async (req, res) => {
    try {
      const email = sanitizeEmailAddress(req.body?.email);
      if (!email) {
        res.status(400).json({ ok: false, deliveredViaSmtp: false });
        return;
      }

      const targetOrigin = getSafeClientOrigin(req.body?.clientOrigin);
      const resetToken = createSignedResetToken(email);
      const directResetUrl = `${targetOrigin}/?page=portal&mode=resetPassword&email=${encodeURIComponent(
        email
      )}&resetToken=${encodeURIComponent(resetToken)}`;

      const resetHtml = buildBrandedEmailHtml(
        'Reset Your Client Portal Password — Golden Mind Psychiatry PLLC',
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:20px;">Reset Your Client Portal Password</h2>
        <p style="margin:0 0 16px 0;">We received a request to reset the password for your <strong>Golden Mind Psychiatry PLLC</strong> Client Portal account associated with <strong>${email}</strong>.</p>
        <p style="margin:0 0 16px 0;">Click the button below to open the <strong>Set Your New Portal Password</strong> page and enter your new password:</p>
        <div style="text-align:center;margin:26px 0;">
          <a href="${directResetUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F3E5AB 0%,#D4AF37 50%,#AA7C11 100%);color:#1C1917;font-weight:700;text-decoration:none;border-radius:12px;">
            Reset My Portal Password Now
          </a>
        </div>
        <p style="margin:0 0 12px 0;font-size:12px;color:#57534E;">Or copy and paste this direct password reset link into your browser:<br /><a href="${directResetUrl}" style="color:#9E7206;word-break:break-all;">${directResetUrl}</a></p>
        <p style="margin:0;font-size:12px;color:#57534E;">This password reset link is valid for 30 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        `
      );

      const result = await sendClinicEmail({
        to: email,
        subject: 'Reset Your Client Portal Password — Golden Mind Psychiatry PLLC',
        html: resetHtml,
      });

      res.json({ ok: true, deliveredViaSmtp: result.deliveredViaSmtp });
    } catch (error) {
      console.error('Password reset SMTP dispatch error:', error);
      res.status(200).json({ ok: true, deliveredViaSmtp: false });
    }
  });

  // 3C. Complete Password Reset from Verified SMTP Reset Token & Edit Password in Cloud Firestore Database
  app.post('/api/email/complete-password-reset', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email);
    const resetToken = typeof req.body?.resetToken === 'string' ? req.body.resetToken.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!email || !resetToken || newPassword.length < 6) {
      res.status(400).json({ ok: false, error: 'Invalid password reset request.' });
      return;
    }

    if (!verifySignedResetToken(email, resetToken)) {
      res.status(400).json({
        ok: false,
        error: 'This password reset link has expired or is invalid. Please request a new reset link.',
      });
      return;
    }

    const pwHash = crypto
      .createHmac('sha256', RESET_HMAC_SECRET)
      .update(`${email}|${newPassword}`)
      .digest('hex');
    persistResetPasswordHash(email, pwHash);
    await syncPasswordHashToFirestoreRest(email, newPassword);

    res.json({ ok: true, updatedInDatabase: true });
  });

  // 3D. Sync Account Credential Hash on Sign-In / Registration
  app.post('/api/email/sync-account-credential', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || password.length < 6) {
      res.status(400).json({ ok: false });
      return;
    }
    const pwHash = crypto
      .createHmac('sha256', RESET_HMAC_SECRET)
      .update(`${email}|${password}`)
      .digest('hex');
    persistResetPasswordHash(email, pwHash);
    await syncPasswordHashToFirestoreRest(email, password);
    res.json({ ok: true });
  });

  // 3E. Verify Login Using Password Updated via Verified SMTP Reset Link or Database
  app.post('/api/email/verify-reset-login', (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      res.json({ ok: false, verified: false });
      return;
    }
    const storedHash = verifiedResetPasswords.get(email);
    if (!storedHash) {
      res.json({ ok: true, verified: false });
      return;
    }
    const candidateHash = crypto
      .createHmac('sha256', RESET_HMAC_SECRET)
      .update(`${email}|${password}`)
      .digest('hex');
    const verified =
      storedHash.length === candidateHash.length &&
      crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(candidateHash));
    res.json({ ok: true, verified });
  });

  // 4. Instant Portal Message Notification Alert (Client -> Provider beehobs@yahoo.com & info@goldenmindpsychiatry.org, or Provider -> Client)
  app.post('/api/email/message-alert', async (req, res) => {
    try {
      const direction = req.body?.direction === 'provider_to_patient' ? 'provider_to_patient' : 'patient_to_provider';
      const patientName = escapeHtml(req.body?.patientName, 160);
      const patientEmail = sanitizeEmailAddress(req.body?.patientEmail);
      const subject = escapeHtml(req.body?.subject, 240);
      const body = escapeHtml(req.body?.body, 4000);

      if (direction === 'provider_to_patient' && patientEmail) {
        const patientMsgHtml = buildBrandedEmailHtml(
          `New Clinical Message from Brenda Hobyani, PMHNP-BC`,
          `
          <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">Hello ${patientName || 'Valued Patient'},</h2>
          <p style="margin:0 0 16px 0;"><strong>Brenda Hobyani, MSN, APRN, PMHNP-BC</strong> has sent you a new message or care update in your <strong>Golden Mind Psychiatry Client Portal</strong>.</p>
          <div style="background:#FAF9F5;border:1px solid #E7E5E4;border-radius:14px;padding:16px;margin-bottom:20px;">
            <div style="font-size:12px;font-weight:700;color:#9E7206;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
              Subject: ${subject || 'Clinical Care Update'}
            </div>
            <div style="font-size:13px;color:#1C1917;white-space:pre-line;">
              ${body || 'Please sign in to your Client Portal to view your message and any attached links.'}
            </div>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${SITE_URL}/?page=portal" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F3E5AB 0%,#D4AF37 50%,#AA7C11 100%);color:#1C1917;font-weight:700;text-decoration:none;border-radius:12px;">
              Open Client Portal &amp; View Message
            </a>
          </div>
          `
        );

        const result = await sendClinicEmail({
          to: patientEmail,
          subject: `[Golden Mind Portal] New Message: ${subject || 'Update from Brenda Hobyani, PMHNP-BC'}`,
          html: patientMsgHtml,
        });
        res.json({ ok: true, deliveredViaSmtp: result.deliveredViaSmtp });
        return;
      }

      // Default: Client sent a message -> Alert BOTH beehobs@yahoo.com and info@goldenmindpsychiatry.org
      const adminAlertHtml = buildBrandedEmailHtml(
        `New Client Portal Message from ${patientName || 'Patient'}`,
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">New Patient Message in Your Portal</h2>
        <p style="margin:0 0 16px 0;"><strong>${patientName || 'A Client'}</strong> (${patientEmail || 'Registered Portal Client'}) just sent you a message in the Golden Mind Psychiatry Portal. Please open your Provider Command Center to review and reply.</p>
        <div style="background:#FAF9F5;border:1px solid #E7E5E4;border-radius:14px;padding:16px;margin-bottom:20px;">
          <div style="font-size:12px;font-weight:700;color:#9E7206;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
            Subject: ${subject || 'Client Portal Message'}
          </div>
          <div style="font-size:13px;color:#1C1917;white-space:pre-line;">
            ${body || ''}
          </div>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${SITE_URL}/?page=portal" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F3E5AB 0%,#D4AF37 50%,#AA7C11 100%);color:#1C1917;font-weight:700;text-decoration:none;border-radius:12px;">
            Go to Provider Portal &amp; Check Message
          </a>
        </div>
        `
      );

      const result = await sendClinicEmail({
        to: DOCTOR_ALERT_RECIPIENTS,
        replyTo: patientEmail || CLINIC_EMAIL,
        subject: `[Client Portal Message] ${patientName || 'Patient'} — ${subject || 'New Message'}`,
        html: adminAlertHtml,
      });

      res.json({ ok: true, deliveredViaSmtp: result.deliveredViaSmtp });
    } catch (error) {
      console.error('Portal message alert email error:', error);
      res.status(200).json({ ok: true, deliveredViaSmtp: false });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '365d',
        immutable: true,
        dotfiles: 'deny',
      })
    );
    app.use(
      express.static(distPath, {
        maxAge: '1h',
        dotfiles: 'deny',
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Golden Mind Psychiatry server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
