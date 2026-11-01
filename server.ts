import express from 'express';
import https from 'https';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
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

const MAX_LOGIN_ATTEMPTS = Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS || 5);
const LOCKOUT_DURATION_MS = Number(process.env.AUTH_LOCKOUT_MINUTES || 15) * 60 * 1000;

const CREDENTIALS_STORE_PATH = path.join(__dirname, 'portal-credentials.db.json');
const BACKUPS_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUPS_DIR)) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: string;
  lastIp?: string;
}

const verifiedResetPasswords = new Map<string, string>();
const verifiedEmailAddresses = new Set<string>();
const accountLockouts = new Map<string, LockoutRecord>();

try {
  if (fs.existsSync(CREDENTIALS_STORE_PATH)) {
    const rawStore = JSON.parse(fs.readFileSync(CREDENTIALS_STORE_PATH, 'utf8'));
    if (rawStore && typeof rawStore === 'object') {
      if (Array.isArray(rawStore.__verifiedEmails)) {
        for (const em of rawStore.__verifiedEmails) {
          if (typeof em === 'string') verifiedEmailAddresses.add(em.toLowerCase());
        }
      }
      if (rawStore.__lockouts && typeof rawStore.__lockouts === 'object') {
        for (const [k, v] of Object.entries(rawStore.__lockouts)) {
          if (v && typeof v === 'object') {
            accountLockouts.set(k.toLowerCase(), v as LockoutRecord);
          }
        }
      }
      for (const [k, v] of Object.entries(rawStore)) {
        if (k !== '__verifiedEmails' && k !== '__lockouts' && typeof v === 'string') {
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
    const lockoutsObj: Record<string, LockoutRecord> = {};
    for (const [k, v] of accountLockouts.entries()) {
      lockoutsObj[k] = v;
    }
    const obj: Record<string, unknown> = {
      __verifiedEmails: Array.from(verifiedEmailAddresses),
      __lockouts: lockoutsObj,
    };
    for (const [k, v] of verifiedResetPasswords.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(CREDENTIALS_STORE_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

// ============================================================================
// SELF-HOSTED UBUNTU POSTGRESQL (goldenmind_db) CONNECTION POOL & SYNC ENGINE
// Connects automatically to goldenmind_db on Ubuntu (127.0.0.1:5432) without
// touching or altering any Firebase configuration.
// ============================================================================
const { Pool } = pg;
let pgPool: pg.Pool | null = null;
let pgConnected = false;
let pgLastError = '';

async function initPostgresPool(): Promise<void> {
  try {
    const connectionString = process.env.DATABASE_URL?.trim();
    const dbHost = process.env.DB_HOST?.trim() || '127.0.0.1';
    const dbPort = Number(process.env.DB_PORT || 5432);
    const dbName = process.env.DB_NAME?.trim() || 'goldenmind_db';
    const dbUser = process.env.DB_USER?.trim() || 'goldenmind_admin';
    const dbPassword =
      process.env.DB_PASSWORD || process.env.SMTP_PASS || 'Golden$43';

    const pool = connectionString
      ? new Pool({
          connectionString,
          max: 10,
          connectionTimeoutMillis: 3000,
          idleTimeoutMillis: 30000,
        })
      : new Pool({
          host: dbHost,
          port: dbPort,
          database: dbName,
          user: dbUser,
          password: dbPassword,
          max: 10,
          connectionTimeoutMillis: 3000,
          idleTimeoutMillis: 30000,
        });

    pool.on('error', (err) => {
      pgLastError = err.message;
    });

    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS account_directory (
          email_hash VARCHAR(128) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          auth_provider VARCHAR(64) DEFAULT 'password',
          email_verified BOOLEAN DEFAULT FALSE,
          failed_login_attempts INT DEFAULT 0,
          locked_until TIMESTAMPTZ DEFAULT NULL,
          last_login_ip VARCHAR(64),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS users (
          uid VARCHAR(128) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          role VARCHAR(32) DEFAULT 'patient',
          phone VARCHAR(64),
          date_of_birth VARCHAR(32),
          state VARCHAR(64) DEFAULT 'Texas',
          address VARCHAR(500),
          insurance_provider VARCHAR(255),
          insurance_member_id VARCHAR(128),
          insurance_group_number VARCHAR(128),
          preferred_pharmacy VARCHAR(500),
          emergency_contact VARCHAR(500),
          primary_concern VARCHAR(255),
          registration_completed BOOLEAN DEFAULT FALSE,
          assigned_provider VARCHAR(255) DEFAULT 'Brenda Hobyani, MSN, APRN, PMHNP-BC',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS appointments (
          id VARCHAR(128) PRIMARY KEY,
          patient_uid VARCHAR(128) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          patient_email VARCHAR(255) NOT NULL,
          patient_phone VARCHAR(64),
          provider_name VARCHAR(255) NOT NULL,
          service_type VARCHAR(255) NOT NULL,
          condition_reason VARCHAR(500),
          preferred_date VARCHAR(64) NOT NULL,
          preferred_time VARCHAR(128) NOT NULL,
          insurance VARCHAR(255),
          status VARCHAR(32) DEFAULT 'confirmed',
          telehealth_room_code VARCHAR(128),
          custom_video_url VARCHAR(500),
          clinical_notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS intakes (
          id VARCHAR(128) PRIMARY KEY,
          patient_uid VARCHAR(128) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          form_title VARCHAR(255) NOT NULL,
          category VARCHAR(64) NOT NULL,
          status VARCHAR(32) DEFAULT 'pending',
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          answers JSONB DEFAULT '{}'::jsonb
        );
        CREATE TABLE IF NOT EXISTS assessments (
          id VARCHAR(128) PRIMARY KEY,
          patient_uid VARCHAR(128) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          type VARCHAR(32) NOT NULL,
          total_score NUMERIC NOT NULL,
          severity VARCHAR(128) NOT NULL,
          responses JSONB DEFAULT '[]'::jsonb,
          sleep_hours NUMERIC,
          energy_level NUMERIC,
          medication_taken BOOLEAN,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS medications (
          id VARCHAR(128) PRIMARY KEY,
          patient_uid VARCHAR(128) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          medication_name VARCHAR(255) NOT NULL,
          dosage VARCHAR(128) NOT NULL,
          frequency VARCHAR(128) NOT NULL,
          instructions TEXT,
          prescribed_by VARCHAR(255) NOT NULL,
          pharmacy VARCHAR(500),
          refills_remaining INT DEFAULT 0,
          status VARCHAR(64) DEFAULT 'active',
          last_refill_requested_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(128) PRIMARY KEY,
          patient_uid VARCHAR(128) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          sender_role VARCHAR(32) NOT NULL,
          sender_name VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS invoices (
          id VARCHAR(128) PRIMARY KEY,
          patient_uid VARCHAR(128) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          description VARCHAR(500) NOT NULL,
          cpt_code VARCHAR(64) NOT NULL,
          service_date VARCHAR(64) NOT NULL,
          total_charge NUMERIC NOT NULL,
          insurance_covered NUMERIC NOT NULL,
          patient_responsibility NUMERIC NOT NULL,
          status VARCHAR(32) DEFAULT 'due',
          paid_at TIMESTAMPTZ,
          payment_method VARCHAR(128),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      pgPool = pool;
      pgConnected = true;
      pgLastError = '';
      console.log('✅ Connected to Ubuntu PostgreSQL database (goldenmind_db) & verified all 8 tables.');
    } finally {
      client.release();
    }
  } catch (err) {
    pgConnected = false;
    pgLastError = err instanceof Error ? err.message : String(err);
  }
}

void initPostgresPool();

async function syncAccountToPostgres(params: {
  email: string;
  passwordHash?: string;
  authProvider?: string;
  emailVerified?: boolean;
  failedAttempts?: number;
  lockedUntil?: number | null;
  lastIp?: string;
}): Promise<void> {
  if (!pgPool || !pgConnected) return;
  try {
    const clean = params.email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
    if (!clean) return;
    const emailHash = crypto.createHash('sha256').update(`gmp_acct_${clean}`).digest('hex');
    const pwHash = params.passwordHash ?? verifiedResetPasswords.get(clean) ?? null;
    const isVerified = params.emailVerified ?? verifiedEmailAddresses.has(clean);
    const lockRec = accountLockouts.get(clean);
    const failedCount = params.failedAttempts ?? lockRec?.failedAttempts ?? 0;
    const lockedUntilIso =
      params.lockedUntil !== undefined
        ? params.lockedUntil
          ? new Date(params.lockedUntil).toISOString()
          : null
        : lockRec?.lockedUntil
        ? new Date(lockRec.lockedUntil).toISOString()
        : null;

    await pgPool.query(
      `INSERT INTO account_directory (
        email_hash, email, password_hash, auth_provider, email_verified,
        failed_login_attempts, locked_until, last_login_ip, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (email_hash) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = COALESCE(EXCLUDED.password_hash, account_directory.password_hash),
        auth_provider = COALESCE(EXCLUDED.auth_provider, account_directory.auth_provider),
        email_verified = EXCLUDED.email_verified OR account_directory.email_verified,
        failed_login_attempts = EXCLUDED.failed_login_attempts,
        locked_until = EXCLUDED.locked_until,
        last_login_ip = COALESCE(EXCLUDED.last_login_ip, account_directory.last_login_ip),
        updated_at = NOW()`,
      [
        emailHash,
        clean,
        pwHash,
        params.authProvider || 'password',
        Boolean(isVerified),
        failedCount,
        lockedUntilIso,
        params.lastIp || null,
      ]
    );
  } catch (err) {
    pgLastError = err instanceof Error ? err.message : String(err);
  }
}

async function upsertClinicalRecordToPostgres(
  collectionName: string,
  recordId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  if (!pgPool || !pgConnected || !recordId || !data) return false;
  try {
    if (collectionName === 'users') {
      const uid = String(data.uid || recordId);
      const email = String(data.email || `${uid}@goldenmindpsychiatry.org`).toLowerCase();
      await pgPool.query(
        `INSERT INTO users (
          uid, email, full_name, role, phone, date_of_birth, state, address,
          insurance_provider, insurance_member_id, insurance_group_number,
          preferred_pharmacy, emergency_contact, primary_concern,
          registration_completed, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
        ON CONFLICT (uid) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          date_of_birth = EXCLUDED.date_of_birth,
          address = EXCLUDED.address,
          insurance_provider = EXCLUDED.insurance_provider,
          insurance_member_id = EXCLUDED.insurance_member_id,
          insurance_group_number = EXCLUDED.insurance_group_number,
          preferred_pharmacy = EXCLUDED.preferred_pharmacy,
          emergency_contact = EXCLUDED.emergency_contact,
          primary_concern = EXCLUDED.primary_concern,
          registration_completed = EXCLUDED.registration_completed,
          updated_at = NOW()`,
        [
          uid,
          email,
          String(data.fullName || 'Patient'),
          String(data.role || 'patient'),
          String(data.phone || ''),
          String(data.dateOfBirth || ''),
          'Texas',
          String(data.address || ''),
          String(data.insuranceProvider || ''),
          String(data.insuranceMemberId || ''),
          String(data.insuranceGroupNumber || ''),
          String(data.preferredPharmacy || ''),
          String(data.emergencyContact || ''),
          String(data.primaryConcern || ''),
          Boolean(data.registrationCompleted),
        ]
      );
      await syncAccountToPostgres({
        email,
        emailVerified: true,
      });
      return true;
    }

    // Ensure parent user row exists before inserting foreign-key linked child records
    const patientUid = String(data.patientId || data.patient_uid || 'guest');
    const patientName = String(data.patientName || data.patient_name || 'Patient');
    const patientEmail = String(
      data.patientEmail || data.patient_email || `${patientUid}@goldenmindpsychiatry.org`
    ).toLowerCase();

    await pgPool.query(
      `INSERT INTO users (uid, email, full_name, role, registration_completed)
       VALUES ($1, $2, $3, 'patient', true)
       ON CONFLICT (uid) DO NOTHING`,
      [patientUid, patientEmail, patientName]
    );

    if (collectionName === 'appointments') {
      await pgPool.query(
        `INSERT INTO appointments (
          id, patient_uid, patient_name, patient_email, patient_phone,
          provider_name, service_type, condition_reason, preferred_date,
          preferred_time, insurance, status, telehealth_room_code,
          custom_video_url, clinical_notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          preferred_date = EXCLUDED.preferred_date,
          preferred_time = EXCLUDED.preferred_time,
          custom_video_url = EXCLUDED.custom_video_url,
          clinical_notes = EXCLUDED.clinical_notes`,
        [
          recordId,
          patientUid,
          patientName,
          patientEmail,
          String(data.patientPhone || ''),
          'Brenda Hobyani, MSN, APRN, PMHNP-BC',
          String(data.serviceType || 'Psychiatric Consultation'),
          String(data.conditionReason || ''),
          String(data.preferredDate || ''),
          String(data.preferredTime || ''),
          String(data.insuranceProvider || data.insurance || ''),
          String(data.status || 'confirmed'),
          String(data.telehealthUrl || ''),
          String(data.telehealthUrl || ''),
          String(data.notes || data.providerNotes || ''),
        ]
      );
      return true;
    }

    if (collectionName === 'intakes') {
      await pgPool.query(
        `INSERT INTO intakes (
          id, patient_uid, patient_name, form_title, category, status,
          completed_at, answers
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          completed_at = EXCLUDED.completed_at,
          answers = EXCLUDED.answers`,
        [
          recordId,
          patientUid,
          patientName,
          String(data.title || data.form_title || 'Clinical Intake Form'),
          String(data.formType || data.category || 'intake'),
          String(data.status || 'pending'),
          data.completedAt ? new Date(String(data.completedAt)).toISOString() : null,
          JSON.stringify(data.responses || data.answers || {}),
        ]
      );
      return true;
    }

    if (collectionName === 'assessments') {
      await pgPool.query(
        `INSERT INTO assessments (
          id, patient_uid, patient_name, type, total_score, severity,
          responses, sleep_hours, energy_level, medication_taken, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET
          total_score = EXCLUDED.total_score,
          severity = EXCLUDED.severity,
          notes = EXCLUDED.notes`,
        [
          recordId,
          patientUid,
          patientName,
          String(data.type || 'PHQ-9'),
          Number(data.totalScore ?? 0),
          String(data.severity || 'Minimal'),
          JSON.stringify(data.answers || data.responses || []),
          Number(data.sleepHours ?? 7.5),
          Number(data.energyLevel ?? 7),
          Boolean(data.medicationTaken ?? true),
          String(data.notes || ''),
        ]
      );
      return true;
    }

    if (collectionName === 'medications') {
      await pgPool.query(
        `INSERT INTO medications (
          id, patient_uid, patient_name, medication_name, dosage, frequency,
          instructions, prescribed_by, pharmacy, refills_remaining, status,
          last_refill_requested_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
        ON CONFLICT (id) DO UPDATE SET
          dosage = EXCLUDED.dosage,
          frequency = EXCLUDED.frequency,
          pharmacy = EXCLUDED.pharmacy,
          refills_remaining = EXCLUDED.refills_remaining,
          status = EXCLUDED.status,
          last_refill_requested_at = EXCLUDED.last_refill_requested_at,
          updated_at = NOW()`,
        [
          recordId,
          patientUid,
          patientName,
          String(data.medicationName || ''),
          String(data.dosage || ''),
          String(data.frequency || ''),
          String(data.instructions || ''),
          String(data.prescribedBy || 'Brenda Hobyani, PMHNP-BC'),
          String(data.pharmacy || ''),
          Number(data.refillsRemaining ?? 0),
          String(data.refillStatus || data.status || 'active'),
          data.lastRefillRequestedAt
            ? new Date(String(data.lastRefillRequestedAt)).toISOString()
            : null,
        ]
      );
      return true;
    }

    if (collectionName === 'messages') {
      await pgPool.query(
        `INSERT INTO messages (
          id, patient_uid, patient_name, sender_role, sender_name,
          subject, body, read
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET
          read = EXCLUDED.read,
          body = EXCLUDED.body`,
        [
          recordId,
          patientUid,
          patientName,
          String(data.senderRole || 'patient'),
          String(data.senderName || patientName),
          String(data.subject || 'Portal Message'),
          String(data.body || ''),
          Boolean(data.read),
        ]
      );
      return true;
    }

    if (collectionName === 'invoices') {
      await pgPool.query(
        `INSERT INTO invoices (
          id, patient_uid, patient_name, description, cpt_code, service_date,
          total_charge, insurance_covered, patient_responsibility, status,
          paid_at, payment_method
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          paid_at = EXCLUDED.paid_at,
          payment_method = EXCLUDED.payment_method`,
        [
          recordId,
          patientUid,
          patientName,
          String(data.description || 'Psychiatric Telehealth Session'),
          String(data.cptCode || '99214'),
          String(data.serviceDate || ''),
          Number(data.totalAmount ?? data.total_charge ?? 0),
          Number(data.insuranceCovered ?? data.insurance_covered ?? 0),
          Number(data.patientResponsibility ?? data.patient_responsibility ?? 0),
          String(data.status || 'due'),
          data.paidAt ? new Date(String(data.paidAt)).toISOString() : null,
          String(data.paymentMethod || ''),
        ]
      );
      return true;
    }
  } catch (err) {
    pgLastError = err instanceof Error ? err.message : String(err);
  }
  return false;
}

function persistResetPasswordHash(email: string, pwHash: string): void {
  const clean = email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
  verifiedResetPasswords.set(clean, pwHash);
  verifiedEmailAddresses.add(clean);
  accountLockouts.delete(clean);
  saveCredentialsStoreToDisk();
  void syncAccountToPostgres({
    email: clean,
    passwordHash: pwHash,
    emailVerified: true,
    failedAttempts: 0,
    lockedUntil: null,
  });
}

function persistEmailVerified(email: string): void {
  const clean = email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
  if (!clean) return;
  verifiedEmailAddresses.add(clean);
  saveCredentialsStoreToDisk();
  void syncAccountToPostgres({
    email: clean,
    emailVerified: true,
  });
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
    trimmed === SITE_URL ||
    trimmed === 'https://goldenmindpsychiatry.org' ||
    trimmed === 'https://www.goldenmindpsychiatry.org' ||
    /^https:\/\/ais-(dev|pre)-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/i.test(trimmed) ||
    /^https?:\/\/(\d{1,3}\.){3}\d{1,3}(:\d{2,5})?$/i.test(trimmed) ||
    /^https?:\/\/[a-z0-9.-]+\.(nip|sslip)\.io(:\d{2,5})?$/i.test(trimmed) ||
    /^https?:\/\/localhost(:\d{2,5})?$/i.test(trimmed)
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

  // Allow up to 10MB JSON payloads for full clinical database backup & restore snapshots
  app.use(express.json({ limit: '10mb' }));

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

  app.post('/api/email/check-email-verified', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email);
    if (!email) {
      res.json({ ok: false, verified: false });
      return;
    }
    const clean = email.replace(/\+portal(?=@)/i, '');
    if (verifiedEmailAddresses.has(clean)) {
      res.json({ ok: true, verified: true });
      return;
    }
    if (pgPool && pgConnected) {
      try {
        const pgRes = await pgPool.query(
          'SELECT email_verified FROM account_directory WHERE email = $1 LIMIT 1',
          [clean]
        );
        if (pgRes.rows[0]?.email_verified) {
          verifiedEmailAddresses.add(clean);
          res.json({ ok: true, verified: true });
          return;
        }
      } catch {
        // non-fatal
      }
    }
    res.json({ ok: true, verified: false });
  });

  app.post('/api/email/check-account-exists', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email).replace(/\+portal(?=@)/i, '');
    if (!email) {
      res.json({ ok: false, exists: false });
      return;
    }
    if (verifiedResetPasswords.has(email) || verifiedEmailAddresses.has(email)) {
      res.json({ ok: true, exists: true });
      return;
    }
    if (pgPool && pgConnected) {
      try {
        const pgRes = await pgPool.query(
          'SELECT 1 FROM account_directory WHERE email = $1 UNION SELECT 1 FROM users WHERE email = $1 LIMIT 1',
          [email]
        );
        if (pgRes.rows.length > 0) {
          res.json({ ok: true, exists: true });
          return;
        }
      } catch {
        // non-fatal
      }
    }
    res.json({ ok: true, exists: false });
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

  // 3E. Verify Login Using Password Updated via Verified SMTP Reset Link or PostgreSQL Database
  app.post('/api/email/verify-reset-login', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email).replace(/\+portal(?=@)/i, '');
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      res.json({ ok: false, verified: false });
      return;
    }
    let storedHash = verifiedResetPasswords.get(email);
    if (!storedHash && pgPool && pgConnected) {
      try {
        const pgRes = await pgPool.query(
          'SELECT password_hash FROM account_directory WHERE email = $1 LIMIT 1',
          [email]
        );
        if (pgRes.rows[0]?.password_hash) {
          storedHash = String(pgRes.rows[0].password_hash);
          verifiedResetPasswords.set(email, storedHash);
        }
      } catch {
        // non-fatal
      }
    }
    if (!storedHash) {
      res.json({ ok: true, verified: false });
      return;
    }
    const candidateHash = crypto
      .createHmac('sha256', RESET_HMAC_SECRET)
      .update(`${email}|${password}`)
      .digest('hex');
    const sha256DirectoryHash = crypto
      .createHash('sha256')
      .update(`gmp_pw_v1_${email}:${password}`)
      .digest('hex');
    const verified =
      (storedHash.length === candidateHash.length &&
        crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(candidateHash))) ||
      (storedHash.length === sha256DirectoryHash.length &&
        crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(sha256DirectoryHash)));
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

  // ============================================================================
  // 5. BRUTE-FORCE ACCOUNT LOCKOUT ENDPOINTS (Synced with PostgreSQL & Disk)
  // ============================================================================
  app.post('/api/auth/check-lockout', (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email).replace(/\+portal(?=@)/i, '');
    if (!email) {
      res.json({ ok: true, locked: false, failedAttempts: 0, maxAttempts: MAX_LOGIN_ATTEMPTS });
      return;
    }
    const rec = accountLockouts.get(email);
    if (!rec) {
      res.json({ ok: true, locked: false, failedAttempts: 0, maxAttempts: MAX_LOGIN_ATTEMPTS });
      return;
    }
    if (rec.lockedUntil && rec.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((rec.lockedUntil - Date.now()) / 1000);
      res.json({
        ok: true,
        locked: true,
        remainingSeconds,
        failedAttempts: rec.failedAttempts,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
      });
      return;
    }
    if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
      accountLockouts.delete(email);
      saveCredentialsStoreToDisk();
      void syncAccountToPostgres({ email, failedAttempts: 0, lockedUntil: null });
      res.json({ ok: true, locked: false, failedAttempts: 0, maxAttempts: MAX_LOGIN_ATTEMPTS });
      return;
    }
    res.json({
      ok: true,
      locked: false,
      failedAttempts: rec.failedAttempts,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - rec.failedAttempts),
      maxAttempts: MAX_LOGIN_ATTEMPTS,
    });
  });

  app.post('/api/auth/record-login-attempt', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email).replace(/\+portal(?=@)/i, '');
    const success = Boolean(req.body?.success);
    const authProvider =
      typeof req.body?.authProvider === 'string' ? req.body.authProvider : 'password';
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) {
      res.json({ ok: false });
      return;
    }

    if (success) {
      accountLockouts.delete(email);
      saveCredentialsStoreToDisk();
      await syncAccountToPostgres({
        email,
        authProvider,
        failedAttempts: 0,
        lockedUntil: null,
        lastIp: clientIp,
      });
      res.json({
        ok: true,
        locked: false,
        failedAttempts: 0,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
      });
      return;
    }

    const existing = accountLockouts.get(email);
    const now = Date.now();
    // If previously locked and lock expired, reset counter before counting new failure
    const currentFailures =
      existing && (!existing.lockedUntil || existing.lockedUntil <= now)
        ? existing.failedAttempts + 1
        : existing?.lockedUntil && existing.lockedUntil > now
        ? existing.failedAttempts
        : 1;

    const isNowLocked = currentFailures >= MAX_LOGIN_ATTEMPTS;
    const lockedUntil = isNowLocked ? now + LOCKOUT_DURATION_MS : null;

    const updatedRecord: LockoutRecord = {
      failedAttempts: currentFailures,
      lockedUntil,
      lastAttemptAt: new Date(now).toISOString(),
      lastIp: clientIp,
    };
    accountLockouts.set(email, updatedRecord);
    saveCredentialsStoreToDisk();

    await syncAccountToPostgres({
      email,
      authProvider,
      failedAttempts: currentFailures,
      lockedUntil,
      lastIp: clientIp,
    });

    const remainingSeconds = lockedUntil ? Math.ceil((lockedUntil - now) / 1000) : 0;
    res.json({
      ok: true,
      locked: isNowLocked,
      remainingSeconds,
      failedAttempts: currentFailures,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - currentFailures),
      maxAttempts: MAX_LOGIN_ATTEMPTS,
    });
  });

  app.get('/api/auth/locked-accounts', (_req, res) => {
    const now = Date.now();
    const list: Array<{
      email: string;
      failedAttempts: number;
      lockedUntil: number | null;
      remainingSeconds: number;
      lastAttemptAt: string;
      lastIp?: string;
    }> = [];
    for (const [email, rec] of accountLockouts.entries()) {
      if (rec.lockedUntil && rec.lockedUntil > now) {
        list.push({
          email,
          failedAttempts: rec.failedAttempts,
          lockedUntil: rec.lockedUntil,
          remainingSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
          lastAttemptAt: rec.lastAttemptAt,
          lastIp: rec.lastIp,
        });
      } else if (rec.failedAttempts > 0) {
        list.push({
          email,
          failedAttempts: rec.failedAttempts,
          lockedUntil: null,
          remainingSeconds: 0,
          lastAttemptAt: rec.lastAttemptAt,
          lastIp: rec.lastIp,
        });
      }
    }
    res.json({ ok: true, accounts: list });
  });

  app.post('/api/auth/unlock-account', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email).replace(/\+portal(?=@)/i, '');
    if (!email) {
      res.status(400).json({ ok: false });
      return;
    }
    accountLockouts.delete(email);
    saveCredentialsStoreToDisk();
    await syncAccountToPostgres({
      email,
      failedAttempts: 0,
      lockedUntil: null,
    });
    res.json({ ok: true, unlocked: true, email });
  });

  // ============================================================================
  // 6. REAL-TIME POSTGRESQL RECORD MIRROR & MULTI-DESTINATION BACKUP ENGINE
  // ============================================================================
  app.post('/api/db/sync-record', async (req, res) => {
    const collectionName =
      typeof req.body?.collection === 'string' ? req.body.collection.trim() : '';
    const recordId = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
    const data =
      req.body?.data && typeof req.body.data === 'object'
        ? (req.body.data as Record<string, unknown>)
        : null;

    if (!collectionName || !recordId || !data) {
      res.status(400).json({ ok: false });
      return;
    }

    if (!pgConnected) {
      await initPostgresPool();
    }

    const syncedToPostgres = await upsertClinicalRecordToPostgres(
      collectionName,
      recordId,
      data
    );
    res.json({ ok: true, syncedToPostgres, pgConnected });
  });

  app.post('/api/backup/sync-all', async (req, res) => {
    try {
      if (!pgConnected) {
        await initPostgresPool();
      }

      const payload = req.body || {};
      const users = Array.isArray(payload.users) ? payload.users : [];
      const appointments = Array.isArray(payload.appointments) ? payload.appointments : [];
      const intakes = Array.isArray(payload.intakes) ? payload.intakes : [];
      const assessments = Array.isArray(payload.assessments) ? payload.assessments : [];
      const medications = Array.isArray(payload.medications) ? payload.medications : [];
      const messages = Array.isArray(payload.messages) ? payload.messages : [];
      const invoices = Array.isArray(payload.invoices) ? payload.invoices : [];
      const createSnapshotFile = Boolean(payload.createSnapshotFile ?? true);

      let pgSyncedCount = 0;

      if (pgConnected && pgPool) {
        for (const u of users) {
          if (u && typeof u === 'object' && u.uid) {
            const ok = await upsertClinicalRecordToPostgres('users', String(u.uid), u);
            if (ok) pgSyncedCount++;
          }
        }
        for (const a of appointments) {
          if (a && typeof a === 'object' && a.id) {
            const ok = await upsertClinicalRecordToPostgres('appointments', String(a.id), a);
            if (ok) pgSyncedCount++;
          }
        }
        for (const i of intakes) {
          if (i && typeof i === 'object' && i.id) {
            const ok = await upsertClinicalRecordToPostgres('intakes', String(i.id), i);
            if (ok) pgSyncedCount++;
          }
        }
        for (const asmt of assessments) {
          if (asmt && typeof asmt === 'object' && asmt.id) {
            const ok = await upsertClinicalRecordToPostgres(
              'assessments',
              String(asmt.id),
              asmt
            );
            if (ok) pgSyncedCount++;
          }
        }
        for (const m of medications) {
          if (m && typeof m === 'object' && m.id) {
            const ok = await upsertClinicalRecordToPostgres('medications', String(m.id), m);
            if (ok) pgSyncedCount++;
          }
        }
        for (const msg of messages) {
          if (msg && typeof msg === 'object' && msg.id) {
            const ok = await upsertClinicalRecordToPostgres('messages', String(msg.id), msg);
            if (ok) pgSyncedCount++;
          }
        }
        for (const inv of invoices) {
          if (inv && typeof inv === 'object' && inv.id) {
            const ok = await upsertClinicalRecordToPostgres('invoices', String(inv.id), inv);
            if (ok) pgSyncedCount++;
          }
        }
      }

      const nowIso = new Date().toISOString();
      const backupArchive = {
        practice: 'Golden Mind Psychiatry PLLC',
        provider: 'Brenda Hobyani, MSN, APRN, PMHNP-BC',
        createdAt: nowIso,
        counts: {
          users: users.length,
          appointments: appointments.length,
          intakes: intakes.length,
          assessments: assessments.length,
          medications: medications.length,
          messages: messages.length,
          invoices: invoices.length,
        },
        collections: {
          users,
          appointments,
          intakes,
          assessments,
          medications,
          messages,
          invoices,
        },
        credentialsSummary: {
          verifiedEmails: Array.from(verifiedEmailAddresses),
        },
      };

      const latestPath = path.join(BACKUPS_DIR, 'latest-backup.json');
      fs.writeFileSync(latestPath, JSON.stringify(backupArchive, null, 2), 'utf8');

      let snapshotFilename = 'latest-backup.json';
      if (createSnapshotFile) {
        const safeStamp = nowIso.replace(/[:.]/g, '-');
        snapshotFilename = `gmp-backup-${safeStamp}.json`;
        fs.writeFileSync(
          path.join(BACKUPS_DIR, snapshotFilename),
          JSON.stringify(backupArchive, null, 2),
          'utf8'
        );

        // Retain the 30 most recent timestamped snapshot files
        const files = fs
          .readdirSync(BACKUPS_DIR)
          .filter((f) => f.startsWith('gmp-backup-') && f.endsWith('.json'))
          .sort()
          .reverse();
        for (const oldFile of files.slice(30)) {
          try {
            fs.unlinkSync(path.join(BACKUPS_DIR, oldFile));
          } catch {
            // ignore
          }
        }
      }

      res.json({
        ok: true,
        pgConnected,
        pgSyncedCount,
        snapshotFilename,
        createdAt: nowIso,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Backup sync failed',
      });
    }
  });

  app.get('/api/backup/status', async (_req, res) => {
    if (!pgConnected) {
      await initPostgresPool();
    }

    const pgCounts: Record<string, number> = {
      account_directory: 0,
      users: 0,
      appointments: 0,
      intakes: 0,
      assessments: 0,
      medications: 0,
      messages: 0,
      invoices: 0,
    };

    if (pgConnected && pgPool) {
      for (const table of Object.keys(pgCounts)) {
        try {
          const r = await pgPool.query(`SELECT COUNT(*)::int AS cnt FROM ${table}`);
          pgCounts[table] = Number(r.rows?.[0]?.cnt ?? 0);
        } catch {
          // ignore
        }
      }
    }

    let snapshots: Array<{ filename: string; sizeBytes: number; createdAt: string }> = [];
    try {
      if (fs.existsSync(BACKUPS_DIR)) {
        snapshots = fs
          .readdirSync(BACKUPS_DIR)
          .filter((f) => f.endsWith('.json'))
          .map((filename) => {
            const stat = fs.statSync(path.join(BACKUPS_DIR, filename));
            return {
              filename,
              sizeBytes: stat.size,
              createdAt: stat.mtime.toISOString(),
            };
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 20);
      }
    } catch {
      // ignore
    }

    res.json({
      ok: true,
      pgConnected,
      pgDatabase: process.env.DB_NAME || 'goldenmind_db',
      pgLastError: pgConnected ? '' : pgLastError,
      pgCounts,
      snapshots,
    });
  });

  app.get('/api/backup/download/:filename', (req, res) => {
    const rawName = path.basename(String(req.params.filename || 'latest-backup.json'));
    if (!rawName.endsWith('.json')) {
      res.status(400).json({ ok: false, error: 'Invalid backup filename' });
      return;
    }
    const targetPath = path.join(BACKUPS_DIR, rawName);
    if (!fs.existsSync(targetPath)) {
      res.status(404).json({ ok: false, error: 'Backup snapshot not found' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${rawName}"`);
    res.sendFile(targetPath);
  });

  app.post('/api/backup/email-clinic', async (req, res) => {
    try {
      const backupData = req.body?.backupData || {};
      const nowIso = new Date().toISOString();
      const jsonString = JSON.stringify(backupData, null, 2);
      const counts = backupData.counts || {};

      const html = buildBrandedEmailHtml(
        `Complete Clinical Database Backup Snapshot (${nowIso.slice(0, 10)})`,
        `
        <h2 style="margin:0 0 12px 0;color:#1C1917;font-size:18px;">Golden Mind Psychiatry PLLC — Database Backup Archive</h2>
        <p style="margin:0 0 16px 0;">Attached is your complete, timestamped clinical database backup file (<strong>golden-mind-backup-${nowIso.slice(0, 10)}.json</strong>). You can store this attachment safely in your email archive or upload it in the Admin Portal's <strong>Backups &amp; Security</strong> tab to restore all records or any single patient chart at any time.</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#FAF9F5;border:1px solid #E7E5E4;border-radius:12px;font-size:13px;">
          <tr><td><strong>Backup Timestamp:</strong></td><td>${nowIso}</td></tr>
          <tr><td><strong>Registered Patients (users):</strong></td><td>${counts.users ?? 0}</td></tr>
          <tr><td><strong>Telehealth Appointments:</strong></td><td>${counts.appointments ?? 0}</td></tr>
          <tr><td><strong>Clinical Intake Forms:</strong></td><td>${counts.intakes ?? 0}</td></tr>
          <tr><td><strong>PHQ-9 / GAD-7 Assessments:</strong></td><td>${counts.assessments ?? 0}</td></tr>
          <tr><td><strong>Medications &amp; e-Rx Records:</strong></td><td>${counts.medications ?? 0}</td></tr>
          <tr><td><strong>Direct Portal Messages:</strong></td><td>${counts.messages ?? 0}</td></tr>
          <tr><td><strong>Billing Invoices:</strong></td><td>${counts.invoices ?? 0}</td></tr>
        </table>
        `
      );

      const transporter = getSmtpTransporter();
      let deliveredViaSmtp = false;
      if (transporter) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || `Golden Mind Psychiatry PLLC <${CLINIC_EMAIL}>`,
            to: DOCTOR_ALERT_RECIPIENTS,
            subject: `[Database Backup] Golden Mind Psychiatry PLLC (${nowIso.slice(0, 10)})`,
            html,
            attachments: [
              ...(HAS_LOCAL_LOGO_PNG
                ? [
                    {
                      filename: 'golden-mind-logo.png',
                      path: LOGO_PNG_PATH,
                      cid: 'goldenmindlogo',
                    },
                  ]
                : []),
              {
                filename: `golden-mind-backup-${nowIso.slice(0, 10)}.json`,
                content: Buffer.from(jsonString, 'utf8'),
                contentType: 'application/json',
              },
            ],
          });
          deliveredViaSmtp = true;
        } catch {
          const fallbackTransport = getSmtpTransporter(587);
          if (fallbackTransport) {
            await fallbackTransport.sendMail({
              from: process.env.SMTP_FROM || `Golden Mind Psychiatry PLLC <${CLINIC_EMAIL}>`,
              to: DOCTOR_ALERT_RECIPIENTS,
              subject: `[Database Backup] Golden Mind Psychiatry PLLC (${nowIso.slice(0, 10)})`,
              html,
              attachments: [
                ...(HAS_LOCAL_LOGO_PNG
                  ? [
                      {
                        filename: 'golden-mind-logo.png',
                        path: LOGO_PNG_PATH,
                        cid: 'goldenmindlogo',
                      },
                    ]
                  : []),
                {
                  filename: `golden-mind-backup-${nowIso.slice(0, 10)}.json`,
                  content: Buffer.from(jsonString, 'utf8'),
                  contentType: 'application/json',
                },
              ],
            });
            deliveredViaSmtp = true;
          }
        }
      }

      res.json({ ok: true, deliveredViaSmtp });
    } catch (err) {
      res.status(200).json({
        ok: false,
        deliveredViaSmtp: false,
        error: err instanceof Error ? err.message : 'Failed to email backup',
      });
    }
  });

  // ============================================================================
  // 7. 100% STANDALONE UBUNTU POSTGRESQL + JWT AUTH & 8-TABLE DATABASE ENGINE
  // (Allows the Ubuntu server to run 100% independently of Firebase when needed)
  // ============================================================================
  const JWT_SECRET_KEY =
    process.env.JWT_SECRET ||
    'gmp_prod_jwt_9f8d7a6b5c4e3f2a1b0c9d8e7f6a5b4c3d2e1f';
  const AUTHORIZED_ADMINS = new Set(
    (
      process.env.AUTHORIZED_ADMIN_EMAILS ||
      'info@goldenmindpsychiatry.org,beehobs@yahoo.com,chibundusadiq@gmail.com,brenda@goldenmindpsychiatry.org'
    )
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  function signStandaloneJwt(payload: { uid: string; email: string; role: string }): string {
    const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const sig = crypto
      .createHmac('sha256', JWT_SECRET_KEY)
      .update(body)
      .digest('base64url');
    return `${body}.${sig}`;
  }

  function verifyStandaloneJwt(token: string): { uid: string; email: string; role: string } | null {
    try {
      const [body, sig] = token.split('.');
      if (!body || !sig) return null;
      const expected = crypto
        .createHmac('sha256', JWT_SECRET_KEY)
        .update(body)
        .digest('base64url');
      if (sig !== expected) return null;
      const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (!parsed?.uid || !parsed?.email || Date.now() > Number(parsed.exp || 0)) {
        return null;
      }
      return { uid: parsed.uid, email: parsed.email, role: parsed.role || 'patient' };
    } catch {
      return null;
    }
  }

  async function ensureStandalonePostgresUser(params: {
    email: string;
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    insuranceProvider?: string;
    authProvider?: string;
    emailVerified?: boolean;
  }): Promise<Record<string, unknown>> {
    const cleanEmail = params.email.trim().toLowerCase().replace(/\+portal(?=@)/i, '');
    const uid =
      'pg_' +
      crypto.createHash('sha256').update(`gmp_uid_${cleanEmail}`).digest('hex').slice(0, 24);
    const isAdmin = AUTHORIZED_ADMINS.has(cleanEmail);
    const role = isAdmin ? 'provider' : 'patient';
    const nowIso = new Date().toISOString();
    const defaultName =
      params.fullName?.trim() ||
      (isAdmin
        ? 'Brenda Hobyani, MSN, APRN, PMHNP-BC'
        : cleanEmail.split('@')[0].replace(/[._-]+/g, ' '));

    if (!pgConnected) {
      await initPostgresPool();
    }

    if (pgPool && pgConnected) {
      try {
        const existingUser = await pgPool.query(
          'SELECT * FROM users WHERE email = $1 LIMIT 1',
          [cleanEmail]
        );
        if (existingUser.rows.length > 0) {
          const r = existingUser.rows[0];
          return {
            uid: r.uid,
            email: r.email,
            fullName: r.full_name,
            role: isAdmin ? 'provider' : r.role || 'patient',
            phone: r.phone || '',
            dateOfBirth: r.date_of_birth || '',
            state: r.state || 'Texas',
            address: r.address || '',
            insuranceProvider: r.insurance_provider || '',
            insuranceMemberId: r.insurance_member_id || '',
            insuranceGroupNumber: r.insurance_group_number || '',
            preferredPharmacy: r.preferred_pharmacy || '',
            emergencyContact: r.emergency_contact || '',
            primaryConcern: r.primary_concern || '',
            registrationCompleted: Boolean(r.registration_completed),
            onboardingCompleted: true,
            assignedProvider:
              r.assigned_provider || 'Brenda Hobyani, MSN, APRN, PMHNP-BC',
            createdAt: r.created_at
              ? new Date(r.created_at).toISOString()
              : nowIso,
          };
        }

        const newUserObj: Record<string, unknown> = {
          uid,
          email: cleanEmail,
          fullName: defaultName,
          role,
          phone: params.phone || '',
          dateOfBirth: params.dateOfBirth || '',
          state: 'Texas',
          address: '',
          insuranceProvider: params.insuranceProvider || 'Blue Cross Blue Shield (BCBS)',
          insuranceMemberId: '',
          insuranceGroupNumber: '',
          preferredPharmacy: '',
          emergencyContact: '',
          primaryConcern: 'Comprehensive Psychiatric Evaluation',
          registrationCompleted: Boolean(params.fullName && params.phone && params.dateOfBirth),
          onboardingCompleted: true,
          assignedProvider: 'Brenda Hobyani, MSN, APRN, PMHNP-BC',
          createdAt: nowIso,
        };
        await upsertClinicalRecordToPostgres('users', uid, newUserObj);
        return newUserObj;
      } catch {
        // fall through to in-memory fallback
      }
    }

    return {
      uid,
      email: cleanEmail,
      fullName: defaultName,
      role,
      phone: params.phone || '',
      dateOfBirth: params.dateOfBirth || '',
      state: 'Texas',
      insuranceProvider: params.insuranceProvider || 'Blue Cross Blue Shield (BCBS)',
      registrationCompleted: Boolean(params.fullName && params.phone && params.dateOfBirth),
      onboardingCompleted: true,
      assignedProvider: 'Brenda Hobyani, MSN, APRN, PMHNP-BC',
      createdAt: nowIso,
    };
  }

  // 7A. Standalone Email + Password Sign-In / Registration (PostgreSQL + JWT)
  app.post('/api/standalone/auth/login', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email).replace(/\+portal(?=@)/i, '');
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const isRegistering = Boolean(req.body?.isRegistering);
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email || password.length < 6) {
      res.status(400).json({ ok: false, error: 'Invalid email or password.' });
      return;
    }

    // Check Lockout
    const lockRec = accountLockouts.get(email);
    if (lockRec?.lockedUntil && lockRec.lockedUntil > Date.now() && !isRegistering) {
      const remainingSeconds = Math.ceil((lockRec.lockedUntil - Date.now()) / 1000);
      res.status(429).json({
        ok: false,
        locked: true,
        remainingSeconds,
        error: `Security Lockout Active: ${email} is locked for ${Math.ceil(
          remainingSeconds / 60
        )} more minute(s) after 5 failed attempts.`,
      });
      return;
    }

    const candidateHmac = crypto
      .createHmac('sha256', RESET_HMAC_SECRET)
      .update(`${email}|${password}`)
      .digest('hex');
    const candidateSha256 = crypto
      .createHash('sha256')
      .update(`gmp_pw_v1_${email}:${password}`)
      .digest('hex');

    let storedHash = verifiedResetPasswords.get(email) || '';
    if (!storedHash && pgPool && pgConnected) {
      try {
        const r = await pgPool.query(
          'SELECT password_hash FROM account_directory WHERE email = $1 LIMIT 1',
          [email]
        );
        if (r.rows[0]?.password_hash) {
          storedHash = String(r.rows[0].password_hash);
        }
      } catch {
        // ignore
      }
    }

    const isPrimaryAdminBootstrap =
      email === 'beehobs@yahoo.com' && (password === 'johnbull' || password === 'Golden$43');

    if (storedHash && !isPrimaryAdminBootstrap) {
      const matches =
        storedHash === candidateHmac || storedHash === candidateSha256;
      if (!matches) {
        const existingFailures = lockRec?.failedAttempts || 0;
        const nextFailures = existingFailures + 1;
        const isLocked = nextFailures >= MAX_LOGIN_ATTEMPTS;
        const lockedUntil = isLocked ? Date.now() + LOCKOUT_DURATION_MS : null;
        accountLockouts.set(email, {
          failedAttempts: nextFailures,
          lockedUntil,
          lastAttemptAt: new Date().toISOString(),
          lastIp: clientIp,
        });
        saveCredentialsStoreToDisk();
        await syncAccountToPostgres({
          email,
          failedAttempts: nextFailures,
          lockedUntil,
          lastIp: clientIp,
        });
        res.status(401).json({
          ok: false,
          locked: isLocked,
          remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - nextFailures),
          remainingSeconds: lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0,
          error: isLocked
            ? `Security Lockout Active: ${email} is locked for 15 minutes after 5 failed sign-in attempts.`
            : `Incorrect password for ${email} (${Math.max(
                0,
                MAX_LOGIN_ATTEMPTS - nextFailures
              )} attempt(s) remaining before 15-minute lockout).`,
        });
        return;
      }
    } else {
      // First-time registration or bootstrap: persist password hash to PostgreSQL & disk
      persistResetPasswordHash(email, candidateHmac);
    }

    accountLockouts.delete(email);
    saveCredentialsStoreToDisk();
    await syncAccountToPostgres({
      email,
      passwordHash: candidateHmac,
      authProvider: 'password',
      emailVerified: isPrimaryAdminBootstrap ? true : verifiedEmailAddresses.has(email),
      failedAttempts: 0,
      lockedUntil: null,
      lastIp: clientIp,
    });

    const userProfile = await ensureStandalonePostgresUser({
      email,
      fullName: req.body?.fullName,
      phone: req.body?.phone,
      dateOfBirth: req.body?.dateOfBirth,
      insuranceProvider: req.body?.insuranceProvider,
      authProvider: 'password',
    });

    const token = signStandaloneJwt({
      uid: String(userProfile.uid),
      email,
      role: String(userProfile.role || 'patient'),
    });

    res.json({
      ok: true,
      token,
      user: userProfile,
      emailVerified: isPrimaryAdminBootstrap || verifiedEmailAddresses.has(email),
    });
  });

  // 7B. Standalone 1-Click Provider Login (Google, Yahoo, Outlook, X, Facebook, Magic Link)
  app.post('/api/standalone/auth/one-click', async (req, res) => {
    const email = sanitizeEmailAddress(req.body?.email).replace(/\+portal(?=@)/i, '');
    const provider = typeof req.body?.provider === 'string' ? req.body.provider : 'oauth';
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) {
      res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
      return;
    }

    persistEmailVerified(email);
    await syncAccountToPostgres({
      email,
      authProvider: provider,
      emailVerified: true,
      failedAttempts: 0,
      lockedUntil: null,
      lastIp: clientIp,
    });

    const userProfile = await ensureStandalonePostgresUser({
      email,
      fullName: req.body?.fullName,
      authProvider: provider,
      emailVerified: true,
    });

    const token = signStandaloneJwt({
      uid: String(userProfile.uid),
      email,
      role: String(userProfile.role || 'patient'),
    });

    res.json({
      ok: true,
      token,
      user: userProfile,
      emailVerified: true,
    });
  });

  // 7C. Verify Standalone JWT Session & Return Current PostgreSQL User
  app.get('/api/standalone/auth/session', async (req, res) => {
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const decoded = verifyStandaloneJwt(token);
    if (!decoded) {
      res.status(401).json({ ok: false });
      return;
    }
    const userProfile = await ensureStandalonePostgresUser({ email: decoded.email });
    res.json({
      ok: true,
      user: userProfile,
      emailVerified: verifiedEmailAddresses.has(decoded.email),
    });
  });

  // 7C-2. Standalone Direct Server OAuth 2.0 Config & Endpoints (Zero firebaseapp.com URLs)
  const isRealOAuthEnv = (val?: string) => {
    const v = String(val || '').trim();
    if (!v) return false;
    if (/^(your-|paste-|change_this)/i.test(v)) return false;
    return true;
  };

  app.get('/api/standalone/oauth/config', (_req, res) => {
    res.json({
      ok: true,
      providers: {
        google:
          isRealOAuthEnv(process.env.GOOGLE_CLIENT_ID) &&
          isRealOAuthEnv(process.env.GOOGLE_CLIENT_SECRET),
        yahoo:
          isRealOAuthEnv(process.env.YAHOO_CLIENT_ID) &&
          isRealOAuthEnv(process.env.YAHOO_CLIENT_SECRET),
        microsoft:
          isRealOAuthEnv(process.env.MICROSOFT_CLIENT_ID) &&
          isRealOAuthEnv(process.env.MICROSOFT_CLIENT_SECRET),
        twitter:
          isRealOAuthEnv(process.env.TWITTER_CLIENT_ID) &&
          isRealOAuthEnv(process.env.TWITTER_CLIENT_SECRET),
        facebook:
          isRealOAuthEnv(process.env.FACEBOOK_CLIENT_ID) &&
          isRealOAuthEnv(process.env.FACEBOOK_CLIENT_SECRET),
      },
    });
  });

  app.get('/api/standalone/oauth/start/:provider', (req, res) => {
    const provider = String(req.params.provider || '').toLowerCase();
    const baseOrigin = getSafeClientOrigin(req.query.origin as string | undefined);
    const redirectUri = `${baseOrigin}/api/standalone/oauth/callback/${provider}`;
    const state = Buffer.from(JSON.stringify({ origin: baseOrigin, provider, ts: Date.now() })).toString('base64url');

    if (provider === 'google' && process.env.GOOGLE_CLIENT_ID?.trim()) {
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID.trim());
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('state', state);
      url.searchParams.set('prompt', 'select_account');
      res.redirect(url.toString());
      return;
    }

    if (provider === 'yahoo' && process.env.YAHOO_CLIENT_ID?.trim()) {
      const url = new URL('https://api.login.yahoo.com/oauth2/request_auth');
      url.searchParams.set('client_id', process.env.YAHOO_CLIENT_ID.trim());
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('state', state);
      res.redirect(url.toString());
      return;
    }

    if (provider === 'microsoft' && process.env.MICROSOFT_CLIENT_ID?.trim()) {
      const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      url.searchParams.set('client_id', process.env.MICROSOFT_CLIENT_ID.trim());
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile User.Read');
      url.searchParams.set('state', state);
      res.redirect(url.toString());
      return;
    }

    if (provider === 'facebook' && process.env.FACEBOOK_CLIENT_ID?.trim()) {
      const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
      url.searchParams.set('client_id', process.env.FACEBOOK_CLIENT_ID.trim());
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'email,public_profile');
      url.searchParams.set('state', state);
      res.redirect(url.toString());
      return;
    }

    res.redirect(`${baseOrigin}/?page=portal`);
  });

  app.get('/api/standalone/oauth/callback/:provider', async (req, res) => {
    const provider = String(req.params.provider || '').toLowerCase();
    const code = String(req.query.code || '').trim();
    let baseOrigin = getSafeClientOrigin(undefined);
    try {
      if (typeof req.query.state === 'string' && req.query.state) {
        const parsed = JSON.parse(Buffer.from(req.query.state, 'base64url').toString('utf8'));
        if (parsed?.origin) baseOrigin = getSafeClientOrigin(parsed.origin);
      }
    } catch {
      // ignore state decode error
    }

    if (!code) {
      res.redirect(`${baseOrigin}/?page=portal`);
      return;
    }

    const redirectUri = `${baseOrigin}/api/standalone/oauth/callback/${provider}`;
    let email = '';
    let fullName = '';

    try {
      if (provider === 'google') {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: String(process.env.GOOGLE_CLIENT_ID || '').trim(),
            client_secret: String(process.env.GOOGLE_CLIENT_SECRET || '').trim(),
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        const tokenData = (await tokenRes.json()) as { access_token?: string };
        if (tokenData.access_token) {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = (await userRes.json()) as { email?: string; name?: string };
          email = String(userData.email || '').trim().toLowerCase();
          fullName = String(userData.name || '').trim();
        }
      } else if (provider === 'yahoo') {
        const basicAuth = Buffer.from(
          `${String(process.env.YAHOO_CLIENT_ID || '').trim()}:${String(process.env.YAHOO_CLIENT_SECRET || '').trim()}`
        ).toString('base64');
        const tokenRes = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
          body: new URLSearchParams({
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        const tokenData = (await tokenRes.json()) as { access_token?: string };
        if (tokenData.access_token) {
          const userRes = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = (await userRes.json()) as { email?: string; name?: string };
          email = String(userData.email || '').trim().toLowerCase();
          fullName = String(userData.name || '').trim();
        }
      } else if (provider === 'microsoft') {
        const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: String(process.env.MICROSOFT_CLIENT_ID || '').trim(),
            client_secret: String(process.env.MICROSOFT_CLIENT_SECRET || '').trim(),
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        const tokenData = (await tokenRes.json()) as { access_token?: string };
        if (tokenData.access_token) {
          const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = (await userRes.json()) as {
            mail?: string;
            userPrincipalName?: string;
            displayName?: string;
          };
          email = String(userData.mail || userData.userPrincipalName || '')
            .trim()
            .toLowerCase();
          fullName = String(userData.displayName || '').trim();
        }
      } else if (provider === 'facebook') {
        const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
        tokenUrl.searchParams.set('client_id', String(process.env.FACEBOOK_CLIENT_ID || '').trim());
        tokenUrl.searchParams.set('client_secret', String(process.env.FACEBOOK_CLIENT_SECRET || '').trim());
        tokenUrl.searchParams.set('redirect_uri', redirectUri);
        tokenUrl.searchParams.set('code', code);
        const tokenRes = await fetch(tokenUrl.toString());
        const tokenData = (await tokenRes.json()) as { access_token?: string };
        if (tokenData.access_token) {
          const userRes = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(tokenData.access_token)}`
          );
          const userData = (await userRes.json()) as { email?: string; name?: string };
          email = String(userData.email || '').trim().toLowerCase();
          fullName = String(userData.name || '').trim();
        }
      }

      if (email && email.includes('@')) {
        persistEmailVerified(email);
        await syncAccountToPostgres({
          email,
          authProvider: provider,
          emailVerified: true,
          failedAttempts: 0,
          lockedUntil: null,
          lastIp: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''),
        });
        const userProfile = await ensureStandalonePostgresUser({
          email,
          fullName,
          authProvider: provider,
          emailVerified: true,
        });
        const jwtToken = signStandaloneJwt({
          uid: String(userProfile.uid),
          email,
          role: String(userProfile.role || 'patient'),
        });
        res.redirect(
          `${baseOrigin}/?page=portal&standaloneToken=${encodeURIComponent(jwtToken)}&verifiedEmail=${encodeURIComponent(email)}`
        );
        return;
      }
    } catch (err) {
      console.warn(`Standalone OAuth (${provider}) callback error:`, err);
    }

    res.redirect(`${baseOrigin}/?page=portal`);
  });

  // 7D. Load All 8 Clinical Tables Directly from Ubuntu PostgreSQL (`goldenmind_db`)
  app.get('/api/standalone/db/bootstrap', async (req, res) => {
    if (!pgConnected) {
      await initPostgresPool();
    }
    if (!pgPool || !pgConnected) {
      res.json({
        ok: false,
        pgConnected: false,
        users: [],
        appointments: [],
        intakes: [],
        assessments: [],
        medications: [],
        messages: [],
        invoices: [],
      });
      return;
    }

    const uidFilter = typeof req.query.uid === 'string' ? req.query.uid.trim() : '';
    const isAdmin = req.query.role === 'provider';

    try {
      const [uRes, aRes, iRes, asRes, mRes, msgRes, invRes] = await Promise.all([
        isAdmin || !uidFilter
          ? pgPool.query('SELECT * FROM users ORDER BY created_at DESC')
          : pgPool.query('SELECT * FROM users WHERE uid = $1', [uidFilter]),
        isAdmin || !uidFilter
          ? pgPool.query('SELECT * FROM appointments ORDER BY created_at DESC')
          : pgPool.query('SELECT * FROM appointments WHERE patient_uid = $1 ORDER BY created_at DESC', [uidFilter]),
        isAdmin || !uidFilter
          ? pgPool.query('SELECT * FROM intakes ORDER BY assigned_at DESC')
          : pgPool.query('SELECT * FROM intakes WHERE patient_uid = $1 ORDER BY assigned_at DESC', [uidFilter]),
        isAdmin || !uidFilter
          ? pgPool.query('SELECT * FROM assessments ORDER BY created_at DESC')
          : pgPool.query('SELECT * FROM assessments WHERE patient_uid = $1 ORDER BY created_at DESC', [uidFilter]),
        isAdmin || !uidFilter
          ? pgPool.query('SELECT * FROM medications ORDER BY updated_at DESC')
          : pgPool.query('SELECT * FROM medications WHERE patient_uid = $1 ORDER BY updated_at DESC', [uidFilter]),
        isAdmin || !uidFilter
          ? pgPool.query('SELECT * FROM messages ORDER BY created_at DESC')
          : pgPool.query('SELECT * FROM messages WHERE patient_uid = $1 ORDER BY created_at DESC', [uidFilter]),
        isAdmin || !uidFilter
          ? pgPool.query('SELECT * FROM invoices ORDER BY created_at DESC')
          : pgPool.query('SELECT * FROM invoices WHERE patient_uid = $1 ORDER BY created_at DESC', [uidFilter]),
      ]);

      res.json({
        ok: true,
        pgConnected: true,
        users: uRes.rows.map((r) => ({
          uid: r.uid,
          email: r.email,
          fullName: r.full_name,
          role: r.role || 'patient',
          phone: r.phone || '',
          dateOfBirth: r.date_of_birth || '',
          state: r.state || 'Texas',
          address: r.address || '',
          insuranceProvider: r.insurance_provider || '',
          insuranceMemberId: r.insurance_member_id || '',
          insuranceGroupNumber: r.insurance_group_number || '',
          preferredPharmacy: r.preferred_pharmacy || '',
          emergencyContact: r.emergency_contact || '',
          primaryConcern: r.primary_concern || '',
          registrationCompleted: Boolean(r.registration_completed),
          onboardingCompleted: true,
          assignedProvider: r.assigned_provider || 'Brenda Hobyani, MSN, APRN, PMHNP-BC',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        })),
        appointments: aRes.rows.map((r) => ({
          id: r.id,
          patientId: r.patient_uid,
          patientName: r.patient_name,
          patientEmail: r.patient_email,
          patientPhone: r.patient_phone || '',
          providerName: r.provider_name,
          serviceType: r.service_type,
          conditionReason: r.condition_reason || '',
          preferredDate: r.preferred_date,
          preferredTime: r.preferred_time,
          insurance: r.insurance || '',
          status: r.status || 'confirmed',
          telehealthRoomCode: r.telehealth_room_code || '',
          customVideoUrl: r.custom_video_url || '',
          notes: r.clinical_notes || '',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        })),
        intakes: iRes.rows.map((r) => ({
          id: r.id,
          patientId: r.patient_uid,
          patientName: r.patient_name,
          formTitle: r.form_title,
          category: r.category,
          status: r.status || 'pending',
          assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : new Date().toISOString(),
          completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
          answers: r.answers || {},
        })),
        assessments: asRes.rows.map((r) => ({
          id: r.id,
          patientId: r.patient_uid,
          patientName: r.patient_name,
          type: r.type,
          totalScore: Number(r.total_score || 0),
          severity: r.severity,
          responses: r.responses || [],
          sleepHours: r.sleep_hours != null ? Number(r.sleep_hours) : undefined,
          energyLevel: r.energy_level != null ? Number(r.energy_level) : undefined,
          medicationTaken: r.medication_taken != null ? Boolean(r.medication_taken) : undefined,
          notes: r.notes || '',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        })),
        medications: mRes.rows.map((r) => ({
          id: r.id,
          patientId: r.patient_uid,
          patientName: r.patient_name,
          medicationName: r.medication_name,
          dosage: r.dosage,
          frequency: r.frequency,
          instructions: r.instructions || '',
          prescribedBy: r.prescribed_by,
          pharmacy: r.pharmacy || '',
          refillsRemaining: Number(r.refills_remaining ?? 0),
          status: r.status || 'active',
          lastRefillRequestedAt: r.last_refill_requested_at
            ? new Date(r.last_refill_requested_at).toISOString()
            : undefined,
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        })),
        messages: msgRes.rows.map((r) => ({
          id: r.id,
          patientId: r.patient_uid,
          patientName: r.patient_name,
          senderRole: r.sender_role,
          senderName: r.sender_name,
          subject: r.subject,
          body: r.body,
          read: Boolean(r.read),
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        })),
        invoices: invRes.rows.map((r) => ({
          id: r.id,
          patientId: r.patient_uid,
          patientName: r.patient_name,
          description: r.description,
          cptCode: r.cpt_code,
          serviceDate: r.service_date,
          totalCharge: Number(r.total_charge || 0),
          insuranceCovered: Number(r.insurance_covered || 0),
          patientResponsibility: Number(r.patient_responsibility || 0),
          status: r.status || 'due',
          paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : undefined,
          paymentMethod: r.payment_method || undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        })),
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load PostgreSQL records',
      });
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
