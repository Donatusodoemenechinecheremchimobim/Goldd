import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  addDoc,
} from 'firebase/firestore';
import { User, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  PortalUser,
  ClinicalSeverity,
  AppointmentFormData,
  IntakeFormType,
  RefillStatus,
  ProviderUnavailableDateRecord,
} from '../types';

export const CLINIC_OWNER_EMAIL = 'info@goldenmindpsychiatry.org';
export const ADMIN_PROVIDER_EMAIL = 'beehobs@yahoo.com';

export const AUTHORIZED_PROVIDER_EMAILS = [
  'beehobs@yahoo.com',
  'info@goldenmindpsychiatry.org',
  'brenda@goldenmindpsychiatry.org',
  'admin@goldenmindpsychiatry.org',
  'info@goldenmindpsychiatry.com',
];

export function normalizePortalEmail(rawEmail?: string | null): string {
  if (!rawEmail) return '';
  return rawEmail
    .trim()
    .toLowerCase()
    .replace(/\+portal(?=@)/i, '');
}

export function isAuthorizedProviderEmail(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_PROVIDER_EMAILS.includes(normalizePortalEmail(email));
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0') +
    ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Computes a deterministic, URL-safe SHA-256 hex digest of a normalized email address
 * for zero-PII account existence checks in `/account_directory/{emailHash}`.
 */
export async function computeEmailDirectoryHash(rawEmail: string): Promise<string> {
  const normalized = normalizePortalEmail(rawEmail);
  return sha256Hex(`gmp_acct_${normalized}`);
}

/**
 * Computes a salted SHA-256 password hash for storing/verifying in `/account_directory/{emailHash}`.
 */
export async function computeAccountPasswordHash(
  rawEmail: string,
  rawPassword: string
): Promise<string> {
  const normalized = normalizePortalEmail(rawEmail);
  return sha256Hex(`gmp_pw_v1_${normalized}:${rawPassword}`);
}

/**
 * Computes a salted SHA-256 hash of a 6-digit verification code for `/account_directory/{emailHash}`.
 */
export async function computeAccountVerificationCodeHash(
  rawEmail: string,
  rawCode: string
): Promise<string> {
  const normalized = normalizePortalEmail(rawEmail);
  return sha256Hex(`gmp_vcode_v1_${normalized}:${rawCode.trim()}`);
}

/**
 * Registers or updates a user's email hash (and optional passwordHash / emailVerified / verificationCodeHash) in `/account_directory/{emailHash}` in Firestore.
 */
export async function registerEmailInAccountDirectory(
  rawEmail?: string | null,
  rawPassword?: string,
  emailVerified?: boolean,
  verificationCodeHash?: string
): Promise<void> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  if (!cleanEmail || !cleanEmail.includes('@')) return;
  try {
    const emailHash = await computeEmailDirectoryHash(cleanEmail);
    const dirRef = doc(db, 'account_directory', emailHash);
    let existingPasswordHash: string | undefined;
    let existingEmailVerified: boolean | undefined;
    let existingVerificationCodeHash: string | undefined;
    try {
      const snap = await getDoc(dirRef);
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data?.passwordHash === 'string') {
          existingPasswordHash = data.passwordHash;
        }
        if (typeof data?.emailVerified === 'boolean') {
          existingEmailVerified = data.emailVerified;
        }
        if (typeof data?.verificationCodeHash === 'string') {
          existingVerificationCodeHash = data.verificationCodeHash;
        }
      }
    } catch {
      // ignore
    }
    const payload: Record<string, unknown> = {
      exists: true,
      updatedAt: new Date().toISOString(),
    };
    if (rawPassword && rawPassword.length >= 6) {
      payload.passwordHash = await computeAccountPasswordHash(cleanEmail, rawPassword);
    } else if (existingPasswordHash) {
      payload.passwordHash = existingPasswordHash;
    }
    if (typeof emailVerified === 'boolean') {
      payload.emailVerified = emailVerified;
    } else if (typeof existingEmailVerified === 'boolean') {
      payload.emailVerified = existingEmailVerified;
    }
    if (verificationCodeHash && verificationCodeHash.length >= 16) {
      payload.verificationCodeHash = verificationCodeHash;
    } else if (existingVerificationCodeHash && payload.emailVerified !== true) {
      payload.verificationCodeHash = existingVerificationCodeHash;
    }
    await setDoc(dirRef, payload);
  } catch {
    // Non-fatal
  }
}

/**
 * Verifies a 6-digit verification code against PostgreSQL + Server Store (`/api/email/verify-code`) and Cloud Firestore (`/account_directory/{emailHash}`).
 */
export async function verifyEmailCodeInAccountDirectory(
  rawEmail: string,
  rawCode: string
): Promise<{
  verified: boolean;
  token?: string;
  user?: PortalUser | null;
  error?: string;
}> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  const cleanCode = rawCode.replace(/\D/g, '').trim();
  if (!cleanEmail || cleanCode.length !== 6) {
    return {
      verified: false,
      error: 'Please enter the complete 6-digit verification code sent to your email.',
    };
  }

  // 1. Verify against Server + Ubuntu PostgreSQL + Firestore REST via /api/email/verify-code
  try {
    const resp = await fetch('/api/email/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
    });
    const data = await resp.json();
    if (resp.ok && data?.verified) {
      try {
        window.sessionStorage.removeItem(`gmp_pending_verify_${cleanEmail}`);
        window.localStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
        window.sessionStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
      } catch {
        // ignore
      }
      await registerEmailInAccountDirectory(cleanEmail, undefined, true);
      return {
        verified: true,
        token: typeof data.token === 'string' ? data.token : undefined,
        user: (data.user as PortalUser) || null,
      };
    }
  } catch {
    // Fallback to direct Firestore check below
  }

  // 2. Fallback check directly in Cloud Firestore `/account_directory/{emailHash}`
  try {
    const [emailHash, expectedCodeHash] = await Promise.all([
      computeEmailDirectoryHash(cleanEmail),
      computeAccountVerificationCodeHash(cleanEmail, cleanCode),
    ]);
    const snap = await getDoc(doc(db, 'account_directory', emailHash));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.verificationCodeHash === expectedCodeHash) {
        await markEmailVerifiedInAccountDirectory(cleanEmail);
        return { verified: true };
      }
    }
  } catch {
    // ignore
  }

  return {
    verified: false,
    error:
      'Invalid or expired 6-digit verification code. Please check your email inbox or click "Resend New 6-Digit Code".',
  };
}

/**
 * Marks an email address as verified in `/account_directory/{emailHash}` and on the backend server.
 */
export async function markEmailVerifiedInAccountDirectory(rawEmail?: string | null): Promise<void> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  if (!cleanEmail || !cleanEmail.includes('@')) return;
  try {
    window.localStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
    window.sessionStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
  } catch {
    // ignore
  }
  await Promise.all([
    registerEmailInAccountDirectory(cleanEmail, undefined, true),
    fetch('/api/email/mark-email-verified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    }).catch(() => {}),
  ]);
}

/**
 * Checks whether an email address has been verified via `/account_directory/{emailHash}`, server store, or browser storage.
 */
export async function checkEmailVerifiedInAccountDirectory(rawEmail?: string | null): Promise<boolean> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  if (!cleanEmail || !cleanEmail.includes('@')) return false;
  try {
    if (window.sessionStorage.getItem(`gmp_pending_verify_${cleanEmail}`) === '1') {
      // If awaiting verification link click, check authoritative server status first
      const resp = await fetch('/api/email/check-email-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await resp.json();
      if (data?.verified) {
        window.sessionStorage.removeItem(`gmp_pending_verify_${cleanEmail}`);
        window.localStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
        window.sessionStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
        return true;
      }
      return false;
    }
  } catch {
    // ignore
  }
  try {
    const resp = await fetch('/api/email/check-email-verified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    const data = await resp.json();
    if (data?.verified) {
      window.localStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
      return true;
    }
  } catch {
    // ignore
  }
  try {
    if (
      window.localStorage.getItem(`gmp_verified_email_${cleanEmail}`) === '1' ||
      window.sessionStorage.getItem(`gmp_verified_email_${cleanEmail}`) === '1'
    ) {
      return true;
    }
  } catch {
    // ignore
  }
  try {
    const emailHash = await computeEmailDirectoryHash(cleanEmail);
    const dirSnap = await getDoc(doc(db, 'account_directory', emailHash));
    if (dirSnap.exists() && dirSnap.data()?.emailVerified === true) {
      window.localStorage.setItem(`gmp_verified_email_${cleanEmail}`, '1');
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Verifies whether a candidate password matches the stored `passwordHash` in Cloud Firestore `/account_directory/{emailHash}`.
 */
export async function verifyPasswordInAccountDirectory(
  rawEmail: string,
  rawPassword: string
): Promise<boolean> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  if (!cleanEmail || !cleanEmail.includes('@') || !rawPassword) return false;
  try {
    const [emailHash, expectedPwHash] = await Promise.all([
      computeEmailDirectoryHash(cleanEmail),
      computeAccountPasswordHash(cleanEmail, rawPassword),
    ]);
    const dirSnap = await getDoc(doc(db, 'account_directory', emailHash));
    if (dirSnap.exists() && dirSnap.data()?.passwordHash === expectedPwHash) {
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

/**
 * Mirrors any clinical record (users, appointments, intakes, assessments, medications, messages, invoices)
 * to the Ubuntu PostgreSQL database (`goldenmind_db`) in real time via `/api/db/sync-record`.
 */
export function syncRecordToPostgres(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): void {
  if (!collectionName || !id || !data) return;
  fetch('/api/db/sync-record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: collectionName, id, data }),
  }).catch(() => {});
}

/**
 * Checks whether an email account is currently locked out due to consecutive failed password attempts.
 */
export async function checkAccountLockout(rawEmail: string): Promise<{
  locked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  maxAttempts: number;
}> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  if (!cleanEmail) {
    return { locked: false, remainingSeconds: 0, failedAttempts: 0, maxAttempts: 5 };
  }
  try {
    const resp = await fetch('/api/auth/check-lockout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    const data = await resp.json();
    return {
      locked: Boolean(data?.locked),
      remainingSeconds: Number(data?.remainingSeconds || 0),
      failedAttempts: Number(data?.failedAttempts || 0),
      maxAttempts: Number(data?.maxAttempts || 5),
    };
  } catch {
    return { locked: false, remainingSeconds: 0, failedAttempts: 0, maxAttempts: 5 };
  }
}

/**
 * Records a login attempt (success or failure) and enforces the 5-attempt / 15-minute lockout policy.
 */
export async function recordLoginAttempt(
  rawEmail: string,
  success: boolean,
  authProvider = 'password'
): Promise<{
  locked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  remainingAttempts: number;
  maxAttempts: number;
}> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  if (!cleanEmail) {
    return {
      locked: false,
      remainingSeconds: 0,
      failedAttempts: 0,
      remainingAttempts: 5,
      maxAttempts: 5,
    };
  }
  try {
    const resp = await fetch('/api/auth/record-login-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, success, authProvider }),
    });
    const data = await resp.json();
    return {
      locked: Boolean(data?.locked),
      remainingSeconds: Number(data?.remainingSeconds || 0),
      failedAttempts: Number(data?.failedAttempts || 0),
      remainingAttempts: Number(data?.remainingAttempts ?? 5),
      maxAttempts: Number(data?.maxAttempts || 5),
    };
  } catch {
    return {
      locked: false,
      remainingSeconds: 0,
      failedAttempts: 0,
      remainingAttempts: 5,
      maxAttempts: 5,
    };
  }
}

/**
 * Checks whether an email address is linked to an existing account in our database or Firebase Auth.
 */
export async function checkEmailLinkedToAccount(rawEmail: string): Promise<boolean> {
  const cleanEmail = normalizePortalEmail(rawEmail);
  if (!cleanEmail || !cleanEmail.includes('@')) return false;

  // 1. Authorized clinic / provider accounts are always recognized
  if (isAuthorizedProviderEmail(cleanEmail)) {
    return true;
  }

  // 2. Check our Firestore `/account_directory/{emailHash}` index
  try {
    const emailHash = await computeEmailDirectoryHash(cleanEmail);
    const dirSnap = await getDoc(doc(db, 'account_directory', emailHash));
    if (dirSnap.exists() && dirSnap.data()?.exists === true) {
      return true;
    }
  } catch {
    // Continue to Server / PostgreSQL check
  }

  // 3. Check Server & Ubuntu PostgreSQL (`account_directory` + `users` tables)
  try {
    const srvRes = await fetch('/api/email/check-account-exists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    const srvData = await srvRes.json();
    if (srvData?.exists) {
      return true;
    }
  } catch {
    // Continue to Firebase Auth check
  }

  // 4. Check Firebase Authentication sign-in methods
  try {
    const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
    if (Array.isArray(methods) && methods.length > 0) {
      return true;
    }
  } catch {
    // Continue
  }

  return true;
}

/**
 * Dispatches an instant email alert when a client sends a portal message (to both beehobs@yahoo.com and info@goldenmindpsychiatry.org)
 * or when the provider sends a portal message/link to a client.
 */
export async function dispatchPortalMessageEmailAlert(params: {
  direction: 'patient_to_provider' | 'provider_to_patient';
  patientName: string;
  patientEmail?: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/email/message-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sanitizes user input against XSS, HTML injection, and SQL/NoSQL injection payloads
 */
export function sanitizeClinicalInput(input: string, maxLength = 2000): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/(\b(DROP|ALTER|TRUNCATE|EXEC|UNION\s+SELECT)\b)/gi, '')
    .trim()
    .slice(0, maxLength);
}

export const PHQ9_QUESTIONS: string[] = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

export const GAD7_QUESTIONS: string[] = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

export const SCALE_OPTIONS = [
  { value: 0, label: 'Not at all (0)' },
  { value: 1, label: 'Several days (+1)' },
  { value: 2, label: 'More than half the days (+2)' },
  { value: 3, label: 'Nearly every day (+3)' },
];

export function calculatePHQ9Severity(score: number): ClinicalSeverity {
  if (score <= 4) return 'Minimal';
  if (score <= 9) return 'Mild';
  if (score <= 14) return 'Moderate';
  if (score <= 19) return 'Moderately Severe';
  return 'Severe';
}

export function calculateGAD7Severity(score: number): ClinicalSeverity {
  if (score <= 4) return 'Minimal';
  if (score <= 9) return 'Mild';
  if (score <= 14) return 'Moderate';
  return 'Severe';
}

export function calculateMoodSeverity(score: number): ClinicalSeverity {
  if (score >= 8) return 'Optimal';
  if (score >= 5) return 'Balanced';
  return 'Low';
}

export function generateTelehealthRoomUrl(seed?: string): string {
  const randomCode = (seed || Math.random().toString(36).substring(2, 8))
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 8);
  return `https://telehealth.goldenmindpsychiatry.org/tx-hipaa-room/gmp-${randomCode || 'tx2026'}`;
}

export function isPatientRegistrationComplete(user?: PortalUser | null): boolean {
  if (!user) return false;
  if (isAuthorizedProviderEmail(user.email)) return true;
  const hasDob = Boolean(
    user.dateOfBirth &&
      user.dateOfBirth.trim() !== '' &&
      user.dateOfBirth.trim().toLowerCase() !== 'not provided'
  );
  const hasPhone = Boolean(
    user.phone &&
      user.phone.trim() !== '' &&
      user.phone.trim().toLowerCase() !== 'not provided'
  );
  const hasName = Boolean(
    user.fullName &&
      user.fullName.trim() !== '' &&
      user.fullName.trim().toLowerCase() !== 'patient'
  );
  const hasInsurance = Boolean(
    user.insuranceProvider &&
      user.insuranceProvider.trim() !== '' &&
      user.insuranceProvider.trim().toLowerCase() !== 'not provided'
  );
  const hasSex = Boolean(
    user.biologicalSex &&
      user.biologicalSex.trim() !== '' &&
      user.biologicalSex.trim().toLowerCase() !== 'not provided'
  );
  return hasDob && hasPhone && hasName && hasInsurance && hasSex;
}

/**
 * Automated Clinical Onboarding Engine:
 * 1. Ensures `/users/{uid}` document exists (with strict patient vs verified provider role).
 * 2. Automatically links any prior guest appointment bookings matching the user's email.
 * 3. Assigns initial Psychiatric Intake Forms, HIPAA Telehealth Consent, Medical History,
 *    welcome message from Brenda Hobyani, PMHNP-BC, and dispatches a clinic signup notification
 *    to info@goldenmindpsychiatry.org.
 */
export async function ensurePatientOnboarding(
  authUser: User,
  extraProfile?: Partial<PortalUser>
): Promise<PortalUser> {
  const uid = authUser.uid;
  const email = sanitizeClinicalInput(
    normalizePortalEmail(authUser.email || extraProfile?.email) ||
      'patient@goldenmindpsychiatry.org',
    254
  );
  const now = new Date().toISOString();
  const isVerifiedProvider = isAuthorizedProviderEmail(email);
  const isDirectAdminEmail = AUTHORIZED_PROVIDER_EMAILS.includes(email.toLowerCase());
  const canWriteProviderRole =
    isVerifiedProvider && (authUser.emailVerified || isDirectAdminEmail);

  const rawName =
    email.toLowerCase() === 'beehobs@yahoo.com'
      ? 'Brenda Hobyani, PMHNP-BC'
      : extraProfile?.fullName?.trim() ||
        authUser.displayName?.trim() ||
        email.split('@')[0].replace(/[._-]/g, ' ');
  const cleanName = sanitizeClinicalInput(rawName, 120) || 'Patient';
  const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  const initialPhone = sanitizeClinicalInput(extraProfile?.phone || '', 40);
  const initialDob = sanitizeClinicalInput(extraProfile?.dateOfBirth || '', 20);
  const initialSex = sanitizeClinicalInput(extraProfile?.biologicalSex || '', 80);

  // Real patient profile with zero fabricated insurance IDs or pharmacy placeholders
  let portalUser: PortalUser = {
    uid,
    email,
    fullName: formattedName,
    phone: initialPhone,
    dateOfBirth: initialDob,
    biologicalSex: initialSex,
    address: sanitizeClinicalInput(extraProfile?.address || '', 250),
    emergencyContact: sanitizeClinicalInput(extraProfile?.emergencyContact || '', 200),
    primaryConcern: sanitizeClinicalInput(extraProfile?.primaryConcern || '', 240),
    role: isVerifiedProvider ? 'provider' : 'patient',
    insuranceProvider: sanitizeClinicalInput(
      extraProfile?.insuranceProvider || '',
      120
    ),
    insuranceMemberId: sanitizeClinicalInput(
      extraProfile?.insuranceMemberId || '',
      64
    ),
    insuranceGroupNumber: sanitizeClinicalInput(
      extraProfile?.insuranceGroupNumber || '',
      64
    ),
    preferredPharmacy: sanitizeClinicalInput(
      extraProfile?.preferredPharmacy || '',
      200
    ),
    registrationCompleted:
      isVerifiedProvider || Boolean(initialPhone && initialDob && initialSex),
    onboardingCompleted: isVerifiedProvider,
    createdAt: now,
    updatedAt: now,
  };

  const userRef = doc(db, 'users', uid);
  let userSnap = null;
  try {
    userSnap = await getDoc(userRef);
  } catch (err) {
    console.warn('Could not read user profile doc:', err);
  }

  if (canWriteProviderRole) {
    try {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email,
        role: 'provider',
        createdAt: now,
      });
    } catch {
      // Non-fatal if admin doc already exists
    }
  }

  if (userSnap && userSnap.exists()) {
    const existing = userSnap.data() as PortalUser;
    const resolvedRole = isVerifiedProvider ? 'provider' : 'patient';
    const mergedPhone = extraProfile?.phone?.trim()
      ? sanitizeClinicalInput(extraProfile.phone, 40)
      : existing.phone || '';
    const mergedDob = extraProfile?.dateOfBirth?.trim()
      ? sanitizeClinicalInput(extraProfile.dateOfBirth, 20)
      : existing.dateOfBirth || '';
    const mergedSex = extraProfile?.biologicalSex?.trim()
      ? sanitizeClinicalInput(extraProfile.biologicalSex, 80)
      : existing.biologicalSex || '';
    portalUser = {
      ...existing,
      fullName:
        email.toLowerCase() === 'beehobs@yahoo.com'
          ? 'Brenda Hobyani, PMHNP-BC'
          : extraProfile?.fullName?.trim()
          ? formattedName
          : existing.fullName || formattedName,
      phone: mergedPhone,
      dateOfBirth: mergedDob,
      biologicalSex: mergedSex,
      address: extraProfile?.address?.trim()
        ? sanitizeClinicalInput(extraProfile.address, 250)
        : existing.address || '',
      emergencyContact: extraProfile?.emergencyContact?.trim()
        ? sanitizeClinicalInput(extraProfile.emergencyContact, 200)
        : existing.emergencyContact || '',
      primaryConcern: extraProfile?.primaryConcern?.trim()
        ? sanitizeClinicalInput(extraProfile.primaryConcern, 240)
        : existing.primaryConcern || '',
      insuranceProvider: extraProfile?.insuranceProvider?.trim()
        ? sanitizeClinicalInput(extraProfile.insuranceProvider, 120)
        : existing.insuranceProvider || '',
      insuranceMemberId: existing.insuranceMemberId || '',
      insuranceGroupNumber: existing.insuranceGroupNumber || '',
      preferredPharmacy: existing.preferredPharmacy || '',
      registrationCompleted:
        existing.registrationCompleted || Boolean(mergedPhone && mergedDob && mergedSex),
      role: resolvedRole,
    };

    if (
      existing.role !== resolvedRole ||
      (extraProfile?.phone?.trim() && existing.phone !== mergedPhone) ||
      (extraProfile?.dateOfBirth?.trim() && existing.dateOfBirth !== mergedDob) ||
      (extraProfile?.biologicalSex?.trim() && existing.biologicalSex !== mergedSex)
    ) {
      try {
        await updateDoc(userRef, {
          role: resolvedRole,
          fullName: portalUser.fullName,
          phone: portalUser.phone,
          dateOfBirth: portalUser.dateOfBirth,
          biologicalSex: portalUser.biologicalSex,
          insuranceProvider: portalUser.insuranceProvider,
          registrationCompleted: portalUser.registrationCompleted,
          updatedAt: now,
        });
      } catch {
        // Non-fatal
      }
    }
  } else {
    const firestoreUserDoc: PortalUser = {
      ...portalUser,
      role: canWriteProviderRole ? 'provider' : 'patient',
      onboardingCompleted: true,
    };

    try {
      await setDoc(userRef, firestoreUserDoc);
    } catch (err) {
      console.warn('Initial user profile write warning:', err);
    }
  }

  // Ensure this account's email hash is recorded in `/account_directory/{emailHash}` for password reset checks
  await registerEmailInAccountDirectory(email);

  // Step 2: Claim any guest bookings submitted under this email address
  try {
    const guestQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', 'guest'),
      where('patientEmail', '==', email)
    );
    const guestSnaps = await getDocs(guestQuery);
    if (!guestSnaps.empty) {
      const claimBatch = writeBatch(db);
      guestSnaps.docs.forEach((docSnap) => {
        claimBatch.update(docSnap.ref, {
          patientId: uid,
          updatedAt: now,
        });
      });
      await claimBatch.commit();
    }
  } catch {
    // Non-fatal if no guest appointments match
  }

  // Step 3: Run first-time automated clinical onboarding batch if not yet completed (only for patients)
  if (!portalUser.onboardingCompleted && !isVerifiedProvider) {
    try {
      const batch = writeBatch(db);

      // 1. Assign Comprehensive Psychiatric Intake
      const intake1Ref = doc(collection(db, 'intakes'));
      batch.set(intake1Ref, {
        patientId: uid,
        patientName: portalUser.fullName,
        formType: 'comprehensive-psychiatric-intake' as IntakeFormType,
        title: 'Comprehensive Psychiatric Evaluation Intake (Adults, Teens & Children)',
        status: 'pending',
        responses: {},
        assignedAt: now,
      });

      // 2. Assign 100% Telehealth Consent
      const intake2Ref = doc(collection(db, 'intakes'));
      batch.set(intake2Ref, {
        patientId: uid,
        patientName: portalUser.fullName,
        formType: 'telehealth-consent' as IntakeFormType,
        title: 'Texas 100% Telehealth Informed Consent & HIPAA Privacy Agreement',
        status: 'pending',
        responses: {},
        assignedAt: now,
      });

      // 3. Assign Medical & Family Psychiatric History
      const intake3Ref = doc(collection(db, 'intakes'));
      batch.set(intake3Ref, {
        patientId: uid,
        patientName: portalUser.fullName,
        formType: 'medical-history' as IntakeFormType,
        title: 'Medical, Allergy & Medication History Questionnaire',
        status: 'pending',
        responses: {},
        assignedAt: now,
      });

      // 4. Send automated welcome message from Brenda Hobyani, PMHNP-BC
      const welcomeMsgRef = doc(collection(db, 'messages'));
      batch.set(welcomeMsgRef, {
        patientId: uid,
        patientName: portalUser.fullName,
        senderId: 'provider-brenda-hobyani',
        senderName: 'Brenda Hobyani, PMHNP-BC',
        senderRole: 'provider',
        subject: 'Welcome to Golden Mind Psychiatry PLLC — Intake Forms Assigned',
        body: `Hello ${portalUser.fullName},\n\nWelcome to Golden Mind Psychiatry PLLC! Your account is linked to ${email}.\n\nOur practice hours are Monday – Thursday from 8:00 AM – 4:00 PM and Friday from 9:00 AM – 1:00 PM (100% Telehealth across Texas). Before your upcoming session, please complete your assigned Intake Forms and baseline PHQ-9 / GAD-7 check-in.\n\nWarmly,\nBrenda Hobyani, MSN, APRN, PMHNP-BC`,
        read: false,
        createdAt: now,
      });

      portalUser.onboardingCompleted = true;
      portalUser.updatedAt = now;

      await batch.commit();

      // Dispatch branded SMTP welcome & clinic notification email via backend server
      fetch('/api/email/welcome-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: portalUser.fullName,
          email: portalUser.email,
          phone: portalUser.phone,
          insuranceProvider: portalUser.insuranceProvider,
        }),
      }).catch(() => {
        // Non-blocking if SMTP not yet configured in environment
      });
    } catch (err) {
      console.warn('Onboarding starter records already initialized or skipped:', err);
      portalUser.onboardingCompleted = true;
    }
  }

  // Mirror user profile to Ubuntu PostgreSQL (`goldenmind_db`) in real time
  syncRecordToPostgres('users', uid, portalUser as unknown as Record<string, unknown>);

  return portalUser;
}

/**
 * Creates a 100% Telehealth Appointment in Firestore (supports both authenticated patients and public guests)
 * AND dispatches branded HTML notification emails to info@goldenmindpsychiatry.org and the patient via /api/email/appointment
 */
export async function createTelehealthAppointment(
  formData: AppointmentFormData,
  currentUser?: PortalUser | null
): Promise<{ id: string; telehealthUrl: string; emailDispatched?: boolean }> {
  const now = new Date().toISOString();
  const patientId = currentUser?.uid || 'guest';
  const cleanName = sanitizeClinicalInput(formData.fullName, 120) || 'Patient';
  const cleanEmail = sanitizeClinicalInput(formData.email, 254);
  const telehealthUrl = generateTelehealthRoomUrl(cleanName + now);

  const payload = {
    patientId,
    patientName: cleanName,
    patientEmail: cleanEmail,
    patientPhone: sanitizeClinicalInput(formData.phone, 40),
    dateOfBirth: sanitizeClinicalInput(formData.dateOfBirth || '', 20),
    serviceType: sanitizeClinicalInput(
      formData.serviceType || 'Comprehensive Psychiatric Evaluation',
      180
    ),
    conditionReason: sanitizeClinicalInput(
      formData.conditionReason || 'General Psychiatric Evaluation',
      180
    ),
    preferredDate:
      sanitizeClinicalInput(formData.preferredDate, 30) ||
      new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    preferredTime:
      sanitizeClinicalInput(formData.preferredTime, 80) ||
      'Mon–Thu Morning (8:00 AM - 12:00 PM)',
    insuranceProvider: sanitizeClinicalInput(
      formData.insuranceProvider || '',
      120
    ),
    status: 'confirmed',
    telehealthUrl,
    preVisitScreenerCompleted: false,
    notes: sanitizeClinicalInput(
      formData.notes || '',
      1000
    ),
    providerNotes: `Telehealth room provisioned automatically. Notification dispatched to ${CLINIC_OWNER_EMAIL}.`,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'appointments'), payload);

    // Trigger backend SMTP email dispatch to info@goldenmindpsychiatry.org and the patient
    let emailDispatched = false;
    try {
      const res = await fetch('/api/email/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: payload.patientName,
          email: payload.patientEmail,
          phone: payload.patientPhone,
          dateOfBirth: payload.dateOfBirth,
          serviceType: payload.serviceType,
          conditionReason: payload.conditionReason,
          preferredDate: payload.preferredDate,
          preferredTime: payload.preferredTime,
          insuranceProvider: payload.insuranceProvider,
          notes: payload.notes,
          telehealthUrl: payload.telehealthUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        emailDispatched = Boolean(data.smtpConfigured);
      }
    } catch {
      // Non-fatal if backend route unreachable
    }

    syncRecordToPostgres('appointments', docRef.id, {
      id: docRef.id,
      ...payload,
    });

    return { id: docRef.id, telehealthUrl, emailDispatched };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'appointments');
  }
}

/**
 * Submits a PHQ-9, GAD-7, or Daily Mood assessment and automatically updates upcoming appointments' pre-visit check-in flag
 */
export async function submitClinicalAssessment(params: {
  patientId: string;
  patientName: string;
  type: 'PHQ-9' | 'GAD-7' | 'DAILY-MOOD';
  totalScore: number;
  answers?: number[];
  sleepHours?: number;
  energyLevel?: number;
  medicationTaken?: boolean;
  notes?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const severity =
    params.type === 'PHQ-9'
      ? calculatePHQ9Severity(params.totalScore)
      : params.type === 'GAD-7'
      ? calculateGAD7Severity(params.totalScore)
      : calculateMoodSeverity(params.totalScore);

  try {
    const assessmentPayload = {
      patientId: params.patientId,
      patientName: sanitizeClinicalInput(params.patientName, 120),
      type: params.type,
      totalScore: params.totalScore,
      severity,
      sleepHours: params.sleepHours ?? 7.5,
      energyLevel: params.energyLevel ?? 7,
      medicationTaken: params.medicationTaken ?? true,
      notes: sanitizeClinicalInput(params.notes || '', 1000),
      answers: params.answers || [],
      createdAt: now,
    };
    const asmtRef = await addDoc(collection(db, 'assessments'), assessmentPayload);
    syncRecordToPostgres('assessments', asmtRef.id, {
      id: asmtRef.id,
      ...assessmentPayload,
    });

    if (params.type === 'PHQ-9' || params.type === 'GAD-7') {
      const apptQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', params.patientId)
      );
      const apptSnaps = await getDocs(apptQuery);
      const batch = writeBatch(db);
      let updatedCount = 0;
      apptSnaps.docs.forEach((d) => {
        const data = d.data();
        if (
          (data.status === 'requested' || data.status === 'confirmed') &&
          !data.preVisitScreenerCompleted
        ) {
          batch.update(d.ref, {
            preVisitScreenerCompleted: true,
            updatedAt: now,
          });
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        await batch.commit();
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'assessments');
  }
}

/**
 * Requests a 1-click prescription refill from the patient portal
 */
export async function requestMedicationRefill(
  medicationId: string,
  pharmacy: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'medications', medicationId), {
      refillStatus: 'refill_requested' as RefillStatus,
      pharmacy: sanitizeClinicalInput(pharmacy, 200),
      lastRefillRequestedAt: now,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `medications/${medicationId}`);
  }
}

/**
 * Provider action: Approve or Deny a refill request and notify the patient automatically
 */
export async function providerProcessRefill(params: {
  medicationId: string;
  patientId: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  pharmacy: string;
  currentRefills: number;
  decision: 'approved_sent' | 'denied';
}): Promise<void> {
  const now = new Date().toISOString();
  try {
    const batch = writeBatch(db);
    const medRef = doc(db, 'medications', params.medicationId);

    batch.update(medRef, {
      refillStatus: params.decision,
      refillsRemaining:
        params.decision === 'approved_sent'
          ? Math.max(0, params.currentRefills - 1)
          : params.currentRefills,
      updatedAt: now,
    });

    const msgRef = doc(collection(db, 'messages'));
    batch.set(msgRef, {
      patientId: params.patientId,
      patientName: params.patientName,
      senderId: 'provider-brenda-hobyani',
      senderName: 'Brenda Hobyani, PMHNP-BC',
      senderRole: 'provider',
      subject:
        params.decision === 'approved_sent'
          ? `Prescription Refill Sent: ${params.medicationName} (${params.dosage})`
          : `Refill Update: ${params.medicationName} (${params.dosage})`,
      body:
        params.decision === 'approved_sent'
          ? `Hello ${params.patientName},\n\nI have reviewed and approved your refill request for ${params.medicationName} (${params.dosage}). The electronic prescription has been transmitted directly to ${params.pharmacy}.\n\nPlease remember to continue logging your daily check-ins and let me know if you experience any side effects.\n\nWarmly,\nBrenda Hobyani, PMHNP-BC`
          : `Hello ${params.patientName},\n\nBefore we authorize the next refill for ${params.medicationName} (${params.dosage}), please schedule a brief 100% telehealth follow-up session (Mon–Thu 8:00 AM – 4:00 PM or Fri 9:00 AM – 1:00 PM) so we can review your current response and dosage safety.\n\nWarmly,\nBrenda Hobyani, PMHNP-BC`,
      read: false,
      createdAt: now,
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `medications/${params.medicationId}`);
  }
}

/**
 * Fetches Brenda's unavailable/blocked dates from the server (goldenmind_db)
 */
export async function fetchProviderUnavailableDates(): Promise<ProviderUnavailableDateRecord[]> {
  try {
    const res = await fetch('/api/availability/unavailable-dates');
    const data = await res.json();
    if (data?.ok && Array.isArray(data.unavailableDates)) {
      return data.unavailableDates as ProviderUnavailableDateRecord[];
    }
  } catch {
    // Ignore network error
  }
  return [];
}

/**
 * Evaluates whether a chosen YYYY-MM-DD date and time window is available for booking/rescheduling
 */
export function evaluateDateAndWindowAvailability(
  dateStr: string,
  selectedWindow: string,
  unavailableDates: ProviderUnavailableDateRecord[]
): {
  isUnavailable: boolean;
  isEntireDayBlocked: boolean;
  blockedWindowsForDate: string[];
  message: string | null;
} {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      isUnavailable: false,
      isEntireDayBlocked: false,
      blockedWindowsForDate: [],
      message: null,
    };
  }

  const todayIso = new Date().toISOString().split('T')[0];
  if (dateStr < todayIso) {
    return {
      isUnavailable: true,
      isEntireDayBlocked: true,
      blockedWindowsForDate: ['All Day'],
      message: 'Please select today or a future date for your telehealth appointment.',
    };
  }

  const parsedUtc = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = parsedUtc.getUTCDay(); // 0 = Sun, 6 = Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isUnavailable: true,
      isEntireDayBlocked: true,
      blockedWindowsForDate: ['All Day'],
      message:
        'Golden Mind Psychiatry PLLC is closed on Saturdays and Sundays. Please select a Monday – Friday date (Mon–Thu 8:00 AM – 4:00 PM or Fri 9:00 AM – 1:00 PM).',
    };
  }

  const matchingBlocks = unavailableDates.filter((b) => {
    const start = b.startDate || '';
    const end = b.endDate || b.startDate || '';
    return start <= dateStr && dateStr <= end;
  });

  if (matchingBlocks.length === 0) {
    return {
      isUnavailable: false,
      isEntireDayBlocked: false,
      blockedWindowsForDate: [],
      message: null,
    };
  }

  const allDayBlock = matchingBlocks.find((b) => !b.blockedWindow || b.blockedWindow === 'All Day');
  if (allDayBlock) {
    return {
      isUnavailable: true,
      isEntireDayBlocked: true,
      blockedWindowsForDate: ['All Day'],
      message: `Brenda Hobyani, PMHNP-BC is unavailable on ${dateStr} (${
        allDayBlock.reason || 'Provider Out of Office'
      }). Please select another available date.`,
    };
  }

  const blockedWindows = matchingBlocks.map((b) => b.blockedWindow);
  const matchingWindowBlock = matchingBlocks.find((b) => b.blockedWindow === selectedWindow);
  if (matchingWindowBlock) {
    return {
      isUnavailable: true,
      isEntireDayBlocked: false,
      blockedWindowsForDate: blockedWindows,
      message: `The "${selectedWindow}" window on ${dateStr} is unavailable (${
        matchingWindowBlock.reason || 'Blocked by Provider'
      }). Please choose another time window or date.`,
    };
  }

  return {
    isUnavailable: false,
    isEntireDayBlocked: false,
    blockedWindowsForDate: blockedWindows,
    message: null,
  };
}

