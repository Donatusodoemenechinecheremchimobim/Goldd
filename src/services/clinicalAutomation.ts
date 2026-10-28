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
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  PortalUser,
  ClinicalSeverity,
  AppointmentFormData,
  IntakeFormType,
  RefillStatus,
} from '../types';

export const CLINIC_OWNER_EMAIL = 'info@goldenmindpsychiatry.org';
export const ADMIN_PROVIDER_EMAIL = 'beehobs@yahoo.com';

export const AUTHORIZED_PROVIDER_EMAILS = [
  'beehobs@yahoo.com',
  'info@goldenmindpsychiatry.org',
  'info@goldenmindpsychiatry.com',
];

export function isAuthorizedProviderEmail(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_PROVIDER_EMAILS.includes(email.trim().toLowerCase());
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
    authUser.email || extraProfile?.email || 'patient@goldenmindpsychiatry.org',
    254
  );
  const now = new Date().toISOString();
  const isVerifiedProvider = isAuthorizedProviderEmail(email);
  const isDirectAdminEmail = [
    'beehobs@yahoo.com',
    'info@goldenmindpsychiatry.org',
    'info@goldenmindpsychiatry.com',
  ].includes(email.toLowerCase());
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

  // Real patient profile with zero fabricated insurance IDs or pharmacy placeholders
  let portalUser: PortalUser = {
    uid,
    email,
    fullName: formattedName,
    phone: sanitizeClinicalInput(extraProfile?.phone || '', 40),
    dateOfBirth: sanitizeClinicalInput(extraProfile?.dateOfBirth || '', 20),
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
    portalUser = {
      ...existing,
      fullName:
        email.toLowerCase() === 'beehobs@yahoo.com'
          ? 'Brenda Hobyani, PMHNP-BC'
          : extraProfile?.fullName?.trim()
          ? formattedName
          : existing.fullName || formattedName,
      phone: extraProfile?.phone?.trim()
        ? sanitizeClinicalInput(extraProfile.phone, 40)
        : existing.phone || '',
      dateOfBirth: extraProfile?.dateOfBirth?.trim()
        ? sanitizeClinicalInput(extraProfile.dateOfBirth, 20)
        : existing.dateOfBirth || '',
      insuranceProvider: extraProfile?.insuranceProvider?.trim()
        ? sanitizeClinicalInput(extraProfile.insuranceProvider, 120)
        : existing.insuranceProvider || '',
      insuranceMemberId: existing.insuranceMemberId || '',
      insuranceGroupNumber: existing.insuranceGroupNumber || '',
      preferredPharmacy: existing.preferredPharmacy || '',
      role: resolvedRole,
    };

    if (existing.role !== resolvedRole) {
      try {
        await updateDoc(userRef, { role: resolvedRole, updatedAt: now });
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
    await addDoc(collection(db, 'assessments'), {
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
