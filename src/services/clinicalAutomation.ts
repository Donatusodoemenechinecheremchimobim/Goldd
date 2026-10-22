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

export const BOOTSTRAPPED_ADMIN_EMAIL = 'chibundusadiq@gmail.com';

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
  return `https://telehealth.goldenmindpsychiatry.com/tx-hipaa-room/gmp-${randomCode || 'tx2026'}`;
}

/**
 * Automated Clinical Onboarding Engine:
 * 1. Ensures `/users/{uid}` document exists.
 * 2. Automatically links any prior guest appointment bookings matching the user's email.
 * 3. Assigns initial Psychiatric Intake Forms, HIPAA Telehealth Consent, Medical History,
 *    welcome message from Brenda Hobyani, PMHNP-BC, and initial statement if onboarding hasn't run.
 */
export async function ensurePatientOnboarding(
  authUser: User,
  extraProfile?: Partial<PortalUser>
): Promise<PortalUser> {
  const uid = authUser.uid;
  const email = (authUser.email || extraProfile?.email || 'patient@goldenmind.com').trim();
  const now = new Date().toISOString();
  const isDefaultProvider = email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

  const userRef = doc(db, 'users', uid);
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
  }

  // Also check if an admin document exists for this user
  let isRegisteredAdmin = isDefaultProvider;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (adminSnap.exists()) {
      isRegisteredAdmin = true;
    } else if (isDefaultProvider) {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email,
        role: 'provider',
        createdAt: now,
      });
    }
  } catch {
    // Ignore admin check errors for standard patients
  }

  let portalUser: PortalUser;

  if (userSnap && userSnap.exists()) {
    const existing = userSnap.data() as PortalUser;
    portalUser = {
      ...existing,
      role: isRegisteredAdmin ? 'provider' : existing.role,
    };
  } else {
    const fullName =
      extraProfile?.fullName?.trim() ||
      authUser.displayName?.trim() ||
      email.split('@')[0].replace(/[._-]/g, ' ');

    portalUser = {
      uid,
      email,
      fullName: fullName.charAt(0).toUpperCase() + fullName.slice(1),
      phone: extraProfile?.phone || '',
      dateOfBirth: extraProfile?.dateOfBirth || '',
      role: isRegisteredAdmin ? 'provider' : 'patient',
      insuranceProvider: extraProfile?.insuranceProvider || 'Blue Cross Blue Shield (BCBS)',
      insuranceMemberId: extraProfile?.insuranceMemberId || 'TXM-8849201',
      insuranceGroupNumber: extraProfile?.insuranceGroupNumber || 'GRP-44210',
      preferredPharmacy:
        extraProfile?.preferredPharmacy || 'H-E-B Pharmacy · Austin / Texas Statewide e-Rx',
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(userRef, portalUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
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

  // Step 3: Run first-time automated clinical onboarding batch if not yet completed
  if (!portalUser.onboardingCompleted) {
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
        subject: 'Welcome to Golden Mind Psychiatry PLLC — Your 100% Telehealth Sanctuary',
        body: `Hello ${portalUser.fullName},\n\nWelcome to Golden Mind Psychiatry PLLC. I am honored to partner with you on your mental wellness journey. Because our practice is 100% Telehealth-Only for children, teens, and adults across Texas, you can complete all of your intake paperwork, log your pre-visit PHQ-9 and GAD-7 symptom check-ins, request medication refills, and join our encrypted video sessions directly from this portal.\n\nBefore your upcoming appointment, please complete your assigned Intake Forms and baseline PHQ-9 / GAD-7 assessment in the Action Center. Feel free to reply directly to this thread if you have any questions!\n\nWarmly,\nBrenda Hobyani, MSN, APRN, PMHNP-BC`,
        read: false,
        createdAt: now,
      });

      // 5. Create an initial transparent billing statement / copay estimate
      const invoiceRef = doc(collection(db, 'invoices'));
      batch.set(invoiceRef, {
        patientId: uid,
        patientName: portalUser.fullName,
        description: 'Initial Comprehensive Telepsychiatry Evaluation (CPT 90792) — Copay Estimate',
        serviceDate: now.split('T')[0],
        amount: 250,
        insuranceCoveredAmount: 215,
        patientResponsibility: 35,
        status: 'due',
        createdAt: now,
      });

      // Mark onboarding completed
      portalUser.onboardingCompleted = true;
      portalUser.updatedAt = now;
      batch.update(userRef, {
        onboardingCompleted: true,
        updatedAt: now,
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'onboarding-batch');
    }
  }

  return portalUser;
}

/**
 * Creates a 100% Telehealth Appointment in Firestore (supports both authenticated patients and public guests)
 */
export async function createTelehealthAppointment(
  formData: AppointmentFormData,
  currentUser?: PortalUser | null
): Promise<{ id: string; telehealthUrl: string }> {
  const now = new Date().toISOString();
  const patientId = currentUser?.uid || 'guest';
  const telehealthUrl = generateTelehealthRoomUrl(formData.fullName + now);

  const payload = {
    patientId,
    patientName: formData.fullName.trim(),
    patientEmail: formData.email.trim(),
    patientPhone: formData.phone.trim(),
    dateOfBirth: formData.dateOfBirth || '',
    serviceType: formData.serviceType || 'Comprehensive Psychiatric Evaluation',
    conditionReason: formData.conditionReason || 'General Psychiatric Evaluation',
    preferredDate:
      formData.preferredDate ||
      new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    preferredTime: formData.preferredTime || 'Morning (9:00 AM - 12:00 PM)',
    insuranceProvider: formData.insuranceProvider || 'Blue Cross Blue Shield (BCBS)',
    status: 'confirmed',
    telehealthUrl,
    preVisitScreenerCompleted: false,
    notes: formData.notes || '100% Telehealth Video Consultation across Texas',
    providerNotes: 'Telehealth room provisioned automatically upon booking.',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'appointments'), payload);
    return { id: docRef.id, telehealthUrl };
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
      patientName: params.patientName,
      type: params.type,
      totalScore: params.totalScore,
      severity,
      sleepHours: params.sleepHours ?? 7.5,
      energyLevel: params.energyLevel ?? 7,
      medicationTaken: params.medicationTaken ?? true,
      notes: params.notes || '',
      answers: params.answers || [],
      createdAt: now,
    });

    // If PHQ-9 or GAD-7 was completed, mark upcoming appointments as preVisitScreenerCompleted = true
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
      pharmacy,
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
          : `Hello ${params.patientName},\n\nBefore we authorize the next refill for ${params.medicationName} (${params.dosage}), please schedule a brief 100% telehealth follow-up session so we can review your current response and dosage safety.\n\nWarmly,\nBrenda Hobyani, PMHNP-BC`,
      read: false,
      createdAt: now,
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `medications/${params.medicationId}`);
  }
}

/**
 * Enables or disables Provider Clinical Dashboard access for the current authenticated user
 */
export async function enableProviderWorkspaceAccess(user: PortalUser): Promise<PortalUser> {
  const now = new Date().toISOString();
  try {
    await setDoc(doc(db, 'admins', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'provider',
      createdAt: now,
    });
    await updateDoc(doc(db, 'users', user.uid), {
      role: 'provider',
      updatedAt: now,
    });
    return { ...user, role: 'provider', updatedAt: now };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${user.uid}`);
  }
}
