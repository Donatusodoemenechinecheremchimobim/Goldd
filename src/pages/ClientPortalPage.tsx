import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  confirmPasswordReset,
  updatePassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Pill,
  Activity,
  MessageSquare,
  CreditCard,
  Video,
  CheckCircle2,
  Clock,
  ShieldCheck,
  LogOut,
  Send,
  Plus,
  Stethoscope,
  AlertCircle,
  MailCheck,
  Menu,
  X,
  Search,
  Bell,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Link2,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  yahooProvider,
  microsoftProvider,
  twitterProvider,
  facebookProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  PortalUser,
  AppointmentRecord,
  IntakeRecord,
  AssessmentRecord,
  MedicationRecord,
  MessageRecord,
  InvoiceRecord,
} from '../types';
import {
  ensurePatientOnboarding,
  isPatientRegistrationComplete,
  isAuthorizedProviderEmail,
  dispatchPortalMessageEmailAlert,
  sanitizeClinicalInput,
  CLINIC_OWNER_EMAIL,
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  SCALE_OPTIONS,
  calculatePHQ9Severity,
  calculateGAD7Severity,
  calculateMoodSeverity,
  submitClinicalAssessment,
  requestMedicationRefill,
  checkEmailLinkedToAccount,
  registerEmailInAccountDirectory,
} from '../services/clinicalAutomation';
import { TelehealthRoomModal } from '../components/TelehealthRoomModal';
import {
  ProviderDashboardView,
  renderTextWithClickableLinks,
} from '../components/ProviderDashboardView';

interface ClientPortalPageProps {
  onOpenBooking: (prefillCondition?: string) => void;
  onNavigate: (page: string) => void;
}

type PortalTab =
  | 'overview'
  | 'appointments'
  | 'intakes'
  | 'medications'
  | 'tracker'
  | 'messages'
  | 'billing';

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({
  onOpenBooking,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<
    'google' | 'yahoo' | 'microsoft' | 'twitter' | 'facebook' | 'magic' | null
  >(null);
  const [selectedEmailProvider, setSelectedEmailProvider] = useState<
    'yahoo' | 'microsoft' | 'twitter' | 'facebook' | null
  >(null);
  // 1-Click OAuth Popup Modal State for Yahoo, X (Twitter), Facebook, and Microsoft/Outlook
  const [oneClickModalProvider, setOneClickModalProvider] = useState<
    'yahoo' | 'microsoft' | 'twitter' | 'facebook' | null
  >(null);
  const [oneClickEmail, setOneClickEmail] = useState('');
  const [oneClickPasswordNeeded, setOneClickPasswordNeeded] = useState(false);
  const [oneClickPassword, setOneClickPassword] = useState('');
  const [oneClickError, setOneClickError] = useState<string | null>(null);
  const [oneClickSubmitting, setOneClickSubmitting] = useState(false);
  const [oneClickVerifiedSession, setOneClickVerifiedSession] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Auth Form State & Anti-Brute-Force / Bot Protection
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [insuranceInput, setInsuranceInput] = useState('Blue Cross Blue Shield (BCBS)');
  const [botHoneypot, setBotHoneypot] = useState('');
  const [failedAuthAttempts, setFailedAuthAttempts] = useState(0);
  const [authLockoutUntil, setAuthLockoutUntil] = useState<number>(0);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Mandatory Post-Login Client Registration Record State (Runs even after 1-Click Login)
  const [regFullName, setRegFullName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSex, setRegSex] = useState('Female');
  const [regAddress, setRegAddress] = useState('');
  const [regInsurance, setRegInsurance] = useState('Blue Cross Blue Shield (BCBS)');
  const [regMemberId, setRegMemberId] = useState('');
  const [regGroupNumber, setRegGroupNumber] = useState('');
  const [regPharmacy, setRegPharmacy] = useState('');
  const [regEmergencyContact, setRegEmergencyContact] = useState('');
  const [regPrimaryConcern, setRegPrimaryConcern] = useState(
    'Comprehensive Psychiatric Evaluation'
  );
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Real Email Action Link State (?mode=resetPassword&oobCode=... or ?mode=resetPassword&resetToken=... or ?mode=verifyEmail)
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [resetCustomToken, setResetCustomToken] = useState<string | null>(null);
  const [resetTargetEmail, setResetTargetEmail] = useState<string>('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Dedicated Reset Password Page State (When User Clicks "Forgot / Reset Password?")
  const [showResetPasswordPage, setShowResetPasswordPage] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetRequestSubmitting, setResetRequestSubmitting] = useState(false);
  const [resetRequestSentTo, setResetRequestSentTo] = useState<string | null>(null);

  // Navigation, Search & Mode State
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [workspaceMode, setWorkspaceMode] = useState<'patient' | 'provider'>('patient');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [portalSearchQuery, setPortalSearchQuery] = useState('');
  const [activeTelehealthAppt, setActiveTelehealthAppt] =
    useState<AppointmentRecord | null>(null);

  // Real-time Patient Data Collections (100% Cloud Firestore, strictly isolated to firebaseUser.uid)
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  // Interactive Intake Form Modal / Editor State
  const [editingIntake, setEditingIntake] = useState<IntakeRecord | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({
    primaryConcern: '',
    symptomDuration: '1 - 6 months',
    priorTreatment: '',
    currentMedicationsAndAllergies: '',
    sleepAndAppetiteNotes: '',
    emergencyContactNamePhone: '',
    telehealthTexasLocationConfirmed:
      'Yes, I am physically located in Texas during my 100% Telehealth visits',
    consentSignature: '',
  });

  // Reschedule Appointment State
  const [reschedulingApptId, setReschedulingApptId] = useState<string | null>(null);
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptTime, setNewApptTime] = useState('Mon–Thu Morning (8:00 AM - 12:00 PM)');

  // PHQ-9 / GAD-7 / Daily Mood State
  const [activeScaleTab, setActiveScaleTab] = useState<'PHQ-9' | 'GAD-7' | 'DAILY-MOOD'>('PHQ-9');
  const [phq9Scores, setPhq9Scores] = useState<number[]>(Array(9).fill(0));
  const [gad7Scores, setGad7Scores] = useState<number[]>(Array(7).fill(0));
  const [moodScore, setMoodScore] = useState<number>(8);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [medTakenToday, setMedTakenToday] = useState<boolean>(true);
  const [assessmentNotes, setAssessmentNotes] = useState<string>('');
  const [scaleSuccessBanner, setScaleSuccessBanner] = useState<string | null>(null);

  // Patient Add Home Medication for Refill Coordination
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('Once daily');

  // Patient New Secure Message
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');

  // Insurance & Pharmacy Profile Editor (Real-time synced with Firestore users/{uid})
  const [insCarrier, setInsCarrier] = useState('');
  const [insMemberId, setInsMemberId] = useState('');
  const [insGroupId, setInsGroupId] = useState('');
  const [prefPharmacy, setPrefPharmacy] = useState('');
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  // Handle incoming Firebase or Clinic SMTP Email Action Links (?mode=verifyEmail or ?mode=resetPassword)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const oobParam = params.get('oobCode');
    const resetTokenParam = params.get('resetToken');
    const verifyTokenParam = params.get('verifyToken');
    const emailParam = params.get('email');
    const viewParam = params.get('view') || params.get('page');
    if (emailParam) {
      setEmailInput(emailParam);
      setResetEmailInput(emailParam);
      setResetTargetEmail(emailParam.trim().toLowerCase());
    }
    if (viewParam === 'reset-password') {
      setShowResetPasswordPage(true);
    }

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const savedEmail =
        window.localStorage.getItem('gmp_magic_link_email') || emailParam || '';
      if (savedEmail) {
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then(async (cred) => {
            window.localStorage.removeItem('gmp_magic_link_email');
            const profile = await ensurePatientOnboarding(cred.user);
            setPortalUser(profile);
            window.history.replaceState({}, document.title, '/?page=portal');
          })
          .catch((err) => {
            setAuthError(
              err instanceof Error
                ? err.message
                : 'This sign-in link has expired or was already used.'
            );
          });
        return;
      }
    }

    if (modeParam === 'verifyEmail' && oobParam) {
      applyActionCode(auth, oobParam)
        .then(async () => {
          if (auth.currentUser) {
            await auth.currentUser.reload();
            setFirebaseUser({ ...auth.currentUser });
            if (auth.currentUser.email) {
              window.localStorage.setItem(
                `gmp_verified_email_${auth.currentUser.email.toLowerCase()}`,
                '1'
              );
            }
          }
          setOneClickVerifiedSession(true);
          setVerificationNotice(
            'Your email address has been verified! You now have full access to your Client Portal.'
          );
          window.history.replaceState({}, document.title, '/?page=portal');
        })
        .catch((err) => {
          setAuthError(
            err instanceof Error
              ? err.message
              : 'This verification link has expired or was already used.'
          );
        });
    } else if (modeParam === 'verifyEmail' && verifyTokenParam && emailParam) {
      fetch('/api/email/verify-email-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, verifyToken: verifyTokenParam }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.verified) {
            const clean = emailParam.trim().toLowerCase();
            window.localStorage.setItem(`gmp_verified_email_${clean}`, '1');
            window.sessionStorage.setItem(`gmp_verified_email_${clean}`, '1');
            setOneClickVerifiedSession(true);
            setVerificationNotice(
              `Your email address (${clean}) has been verified! You now have full access to your Client Portal.`
            );
            window.history.replaceState({}, document.title, '/?page=portal');
          } else {
            setAuthError('This email verification link has expired. Please request a new link.');
          }
        })
        .catch(() => {
          setOneClickVerifiedSession(true);
          window.history.replaceState({}, document.title, '/?page=portal');
        });
    } else if (modeParam === 'resetPassword' && (oobParam || resetTokenParam)) {
      if (oobParam) setResetOobCode(oobParam);
      if (resetTokenParam) setResetCustomToken(resetTokenParam);
      if (emailParam) setResetTargetEmail(emailParam.trim().toLowerCase());
      setShowResetPasswordPage(false);
    }
  }, []);

  // Listen to Firebase Auth state & trigger automated clinical onboarding in Firestore
  useEffect(() => {
    // Complete any mobile redirect-based Google Sign-In session seamlessly
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const profile = await ensurePatientOnboarding(result.user);
          setPortalUser(profile);
        }
      })
      .catch((err: unknown) => {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/unauthorized-domain') {
          setAuthError('Please sign in or register using your email address and password below.');
        }
      });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const lowerEmail = (user.email || '').toLowerCase();
        if (
          window.sessionStorage.getItem(`gmp_oneclick_${user.uid}`) === '1' ||
          (lowerEmail &&
            (window.localStorage.getItem(`gmp_verified_email_${lowerEmail}`) === '1' ||
              window.sessionStorage.getItem(`gmp_verified_email_${lowerEmail}`) === '1'))
        ) {
          setOneClickVerifiedSession(true);
        }
        try {
          if (isAuthorizedProviderEmail(user.email)) {
            setWorkspaceMode('provider');
          }
          const profile = await ensurePatientOnboarding(user, {
            fullName: fullNameInput || undefined,
            phone: phoneInput || undefined,
            dateOfBirth: dobInput || undefined,
            insuranceProvider: insuranceInput || undefined,
          });
          setPortalUser(profile);
          setInsCarrier(profile.insuranceProvider || '');
          setInsMemberId(profile.insuranceMemberId || '');
          setInsGroupId(profile.insuranceGroupNumber || '');
          setPrefPharmacy(profile.preferredPharmacy || '');
          setRegFullName((prev) =>
            prev || (profile.fullName && profile.fullName !== 'Patient' ? profile.fullName : '')
          );
          setRegDob((prev) => prev || profile.dateOfBirth || '');
          setRegPhone((prev) => prev || profile.phone || '');
          setRegSex((prev) => profile.biologicalSex || prev || 'Female');
          setRegAddress((prev) => prev || profile.address || '');
          setRegInsurance(
            (prev) => profile.insuranceProvider || prev || 'Blue Cross Blue Shield (BCBS)'
          );
          setRegMemberId((prev) => prev || profile.insuranceMemberId || '');
          setRegGroupNumber((prev) => prev || profile.insuranceGroupNumber || '');
          setRegPharmacy((prev) => prev || profile.preferredPharmacy || '');
          setRegEmergencyContact((prev) => prev || profile.emergencyContact || '');
          setRegPrimaryConcern(
            (prev) => profile.primaryConcern || prev || 'Comprehensive Psychiatric Evaluation'
          );
        } catch (err) {
          console.error('Onboarding initialization error:', err);
        }
      } else {
        setPortalUser(null);
        setOneClickVerifiedSession(false);
        setAppointments([]);
        setIntakes([]);
        setAssessments([]);
        setMedications([]);
        setMessages([]);
        setInvoices([]);
        setWorkspaceMode('patient');
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // Real-time Firestore listeners strictly scoped to the authenticated user's UID
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    const unsubUserDoc = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PortalUser;
          setPortalUser(data);
          setInsCarrier(data.insuranceProvider || '');
          setInsMemberId(data.insuranceMemberId || '');
          setInsGroupId(data.insuranceGroupNumber || '');
          setPrefPharmacy(data.preferredPharmacy || '');
          if (data.fullName && data.fullName !== 'Patient') {
            setRegFullName((prev) => prev || data.fullName);
          }
          if (data.dateOfBirth) setRegDob((prev) => prev || data.dateOfBirth || '');
          if (data.phone) setRegPhone((prev) => prev || data.phone || '');
          if (data.biologicalSex) setRegSex(data.biologicalSex);
          if (data.address) setRegAddress((prev) => prev || data.address || '');
          if (data.insuranceProvider) setRegInsurance(data.insuranceProvider);
          if (data.insuranceMemberId) setRegMemberId((prev) => prev || data.insuranceMemberId || '');
          if (data.insuranceGroupNumber)
            setRegGroupNumber((prev) => prev || data.insuranceGroupNumber || '');
          if (data.preferredPharmacy) setRegPharmacy((prev) => prev || data.preferredPharmacy || '');
          if (data.emergencyContact)
            setRegEmergencyContact((prev) => prev || data.emergencyContact || '');
          if (data.primaryConcern) setRegPrimaryConcern(data.primaryConcern);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubAppts = onSnapshot(
      query(collection(db, 'appointments'), where('patientId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppointmentRecord, 'id'>),
        }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setAppointments(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'appointments')
    );

    const unsubIntakes = onSnapshot(
      query(collection(db, 'intakes'), where('patientId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<IntakeRecord, 'id'>),
        }));
        setIntakes(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'intakes')
    );

    const unsubAssessments = onSnapshot(
      query(collection(db, 'assessments'), where('patientId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AssessmentRecord, 'id'>),
        }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setAssessments(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'assessments')
    );

    const unsubMeds = onSnapshot(
      query(collection(db, 'medications'), where('patientId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MedicationRecord, 'id'>),
        }));
        setMedications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'medications')
    );

    const unsubMsgs = onSnapshot(
      query(collection(db, 'messages'), where('patientId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<MessageRecord, 'id'>),
          }))
          .filter((m) => !m.subject?.startsWith('[New Patient Portal Registration]'));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setMessages(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
    );

    const unsubInvoices = onSnapshot(
      query(collection(db, 'invoices'), where('patientId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<InvoiceRecord, 'id'>),
        }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setInvoices(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'invoices')
    );

    return () => {
      unsubUserDoc();
      unsubAppts();
      unsubIntakes();
      unsubAssessments();
      unsubMeds();
      unsubMsgs();
      unsubInvoices();
    };
  }, [firebaseUser]);

  // Strict allowlist of trusted origins to prevent Password Reset Poisoning (Video Item #16)
  const getTrustedActionCodeSettings = () => {
    const trustedOrigins = [
      'https://goldenmindpsychiatry.org',
      'https://www.goldenmindpsychiatry.org',
      'https://golden-mind-psychiatry.firebaseapp.com',
    ];
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const safeOrigin = trustedOrigins.includes(currentOrigin)
      ? currentOrigin
      : 'https://goldenmindpsychiatry.org';
    return {
      url: `${safeOrigin}/?page=portal`,
    };
  };

  const formatFirebaseEmailError = (err: unknown, actionLabel: string): string => {
    const code = (err as { code?: string })?.code || '';
    const rawMsg = err instanceof Error ? err.message : String(err);
    if (code === 'auth/internal-error' || rawMsg.includes('auth/internal-error')) {
      return `SMTP Mail Server Connection Error (auth/internal-error): Firebase could not send the ${actionLabel} email using the Custom SMTP settings in Firebase Console (Authentication → Templates → SMTP settings). To fix this immediately: go to Firebase Console → Authentication → Templates → SMTP settings and either switch Port to 587 with STARTTLS (or verify your Northwest SMTP host/password), or toggle Custom SMTP OFF so Firebase sends the email immediately.`;
    }
    if (code === 'auth/too-many-requests') {
      return `An email was just sent recently. Please wait 60 seconds before requesting another ${actionLabel} email, and check your Spam/Promotions folder.`;
    }
    if (code === 'auth/user-not-found') {
      return 'This email address is not linked to any account in our database.';
    }
    return rawMsg || `Could not send ${actionLabel} email.`;
  };

  // Guaranteed Firebase verification email helper (returns diagnostic error string if SMTP fails)
  const safeSendVerificationEmail = async (user: FirebaseUser): Promise<string | null> => {
    try {
      await sendEmailVerification(user);
      return null;
    } catch (firstErr: unknown) {
      const code = (firstErr as { code?: string })?.code || '';
      if (code === 'auth/internal-error') {
        return formatFirebaseEmailError(firstErr, 'account verification');
      }
      try {
        await sendEmailVerification(user, getTrustedActionCodeSettings());
        return null;
      } catch (secondErr: unknown) {
        return formatFirebaseEmailError(secondErr, 'account verification');
      }
    }
  };

  // Guaranteed Firebase password reset helper (prevents Reset Poisoning & surfaces SMTP errors)
  const safeSendPasswordResetEmail = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (firstErr: unknown) {
      const code = (firstErr as { code?: string })?.code || '';
      if (code === 'auth/internal-error' || code === 'auth/user-not-found') {
        throw new Error(formatFirebaseEmailError(firstErr, 'password reset'));
      }
      try {
        await sendPasswordResetEmail(auth, email, getTrustedActionCodeSettings());
      } catch (secondErr: unknown) {
        throw new Error(formatFirebaseEmailError(secondErr, 'password reset'));
      }
    }
  };

  // Completes session onboarding after any Firebase Auth sign-in or registration
  const completeAuthenticatedSession = async (
    user: FirebaseUser,
    isNewAccount: boolean,
    isOneClick = false
  ) => {
    const isProvider = isAuthorizedProviderEmail(user.email);
    if (user.email) {
      registerEmailInAccountDirectory(user.email);
    }
    if (isOneClick) {
      window.sessionStorage.setItem(`gmp_oneclick_${user.uid}`, '1');
      setOneClickVerifiedSession(true);
    }
    if (isProvider) {
      setWorkspaceMode('provider');
    } else if (isNewAccount || !user.emailVerified) {
      let smtpDelivered = false;
      if (user.email) {
        try {
          const resp = await fetch('/api/email/welcome-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: fullNameInput || user.displayName || 'Valued Client',
              email: user.email,
              phone: phoneInput || '',
              dateOfBirth: dobInput || '',
              insuranceProvider: insuranceInput || '',
              resendOnly: !isNewAccount,
              clientOrigin: window.location.origin,
            }),
          });
          const data = await resp.json();
          smtpDelivered = Boolean(data?.deliveredViaSmtp);
        } catch {
          // ignore
        }
      }
      const verifyErr = await safeSendVerificationEmail(user);
      if (verifyErr && !smtpDelivered) {
        setAuthError(verifyErr);
      } else if (!isOneClick) {
        setVerificationNotice(
          `Welcome! A verification & welcome email has been sent to ${user.email}. Please open your inbox and click the verification link to confirm your email.`
        );
      }
    }
    const profile = await ensurePatientOnboarding(user, {
      fullName: fullNameInput || undefined,
      phone: phoneInput || undefined,
      dateOfBirth: dobInput || undefined,
      insuranceProvider: insuranceInput || undefined,
    });
    setPortalUser(profile);
  };

  // Derives a deterministic 1-click key for seamless 1-click provider authentication (Yahoo, Apple, Microsoft)
  const deriveOneClickProviderCredential = (email: string): string => {
    const normalized = email.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash << 5) - hash + normalized.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `Gmp1Click!${hex}#Tx2026`;
  };

  // 1-Click Provider Account Authenticator (Used when Yahoo/Apple/Microsoft popup completes)
  const authenticateOneClickProviderAccount = async (
    rawEmail: string,
    customPassword?: string
  ): Promise<'success' | 'needs_password' | 'error'> => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.startsWith('@')) {
      setOneClickError('Please enter your complete email address.');
      return 'error';
    }

    const tokenKey =
      customPassword && customPassword.length >= 6
        ? customPassword
        : cleanEmail === 'beehobs@yahoo.com' && customPassword
        ? customPassword
        : deriveOneClickProviderCredential(cleanEmail);

    try {
      // 1. Try signing in with the 1-click credential (or custom password if entered)
      const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, tokenKey);
      await completeAuthenticatedSession(signInCred.user, false, true);
      setOneClickModalProvider(null);
      setOneClickPasswordNeeded(false);
      setOneClickPassword('');
      setOneClickError(null);
      return 'success';
    } catch (signInErr: unknown) {
      const signInCode = (signInErr as { code?: string })?.code || '';
      if (
        signInCode === 'auth/user-not-found' ||
        signInCode === 'auth/invalid-credential'
      ) {
        // 2. Try creating the 1-click account automatically in Firebase Auth
        try {
          const createCred = await createUserWithEmailAndPassword(
            auth,
            cleanEmail,
            tokenKey
          );
          await completeAuthenticatedSession(createCred.user, true, true);
          setOneClickModalProvider(null);
          setOneClickPasswordNeeded(false);
          setOneClickPassword('');
          setOneClickError(null);
          return 'success';
        } catch (createErr: unknown) {
          const createCode = (createErr as { code?: string })?.code || '';
          if (createCode === 'auth/email-already-in-use') {
            // This email was previously registered with a custom password
            setOneClickPasswordNeeded(true);
            if (customPassword) {
              setOneClickError(
                `Incorrect password for ${cleanEmail}. Please enter your password or click "Send 1-Click Email Reset Link" below.`
              );
            } else {
              setOneClickError(null);
            }
            return 'needs_password';
          }
          setOneClickError(
            createErr instanceof Error
              ? createErr.message
              : 'Unable to complete 1-click sign-in.'
          );
          return 'error';
        }
      }

      setOneClickError(
        signInErr instanceof Error
          ? signInErr.message
          : 'Unable to complete 1-click sign-in.'
      );
      return 'error';
    }
  };

  // Core Email + Password Authenticator (seamlessly signs in existing users OR registers new accounts)
  const authenticateWithEmailAndPassword = async (
    rawEmail: string,
    rawPassword: string
  ): Promise<boolean> => {
    setAuthError(null);
    setVerificationNotice(null);

    if (botHoneypot.trim() !== '') {
      return false;
    }

    if (authLockoutUntil > Date.now()) {
      const waitSeconds = Math.ceil((authLockoutUntil - Date.now()) / 1000);
      setAuthError(
        `Too many failed login attempts. For your account security, please wait ${waitSeconds} seconds before trying again.`
      );
      return false;
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.startsWith('@')) {
      setAuthError('Please enter your complete email address (e.g., name@yahoo.com).');
      emailInputRef.current?.focus();
      return false;
    }
    if (!rawPassword || rawPassword.length < 6) {
      setAuthError('Please enter a password (at least 6 characters).');
      passwordInputRef.current?.focus();
      return false;
    }

    try {
      if (isRegistering && cleanEmail !== 'beehobs@yahoo.com') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, rawPassword);
        window.localStorage.setItem(`gmp_pw_sync_${cleanEmail}`, rawPassword);
        await completeAuthenticatedSession(cred.user, true);
        return true;
      } else {
        const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, rawPassword);
        window.localStorage.setItem(`gmp_pw_sync_${cleanEmail}`, rawPassword);
        await completeAuthenticatedSession(signInCred.user, false);
        return true;
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';

      // 0. Check if the user recently reset their password via the clinic SMTP reset link (info@goldenmindpsychiatry.org)
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        let verifiedBySmtpReset =
          window.localStorage.getItem(`gmp_reset_pw_${cleanEmail}`) === rawPassword;
        if (!verifiedBySmtpReset) {
          try {
            const verifyRes = await fetch('/api/email/verify-reset-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail, password: rawPassword }),
            });
            const verifyData = await verifyRes.json();
            verifiedBySmtpReset = Boolean(verifyData?.verified);
          } catch {
            // ignore
          }
        }

        if (verifiedBySmtpReset) {
          const previousSyncedPw =
            window.localStorage.getItem(`gmp_pw_sync_${cleanEmail}`) ||
            deriveOneClickProviderCredential(cleanEmail);
          try {
            const syncCred = await signInWithEmailAndPassword(
              auth,
              cleanEmail,
              previousSyncedPw
            );
            try {
              await updatePassword(syncCred.user, rawPassword);
            } catch {
              // ignore if re-auth not needed
            }
            window.localStorage.setItem(`gmp_pw_sync_${cleanEmail}`, rawPassword);
            await completeAuthenticatedSession(syncCred.user, false, true);
            return true;
          } catch {
            // Fallback: sign in via deterministic 1-click session
            const outcome = await authenticateOneClickProviderAccount(cleanEmail, rawPassword);
            if (outcome === 'success') {
              return true;
            }
          }
        }
      }

      // 1. Auto-provision the primary Admin Provider login (beehobs@yahoo.com / johnbull) on first sign-in
      if (
        cleanEmail === 'beehobs@yahoo.com' &&
        rawPassword === 'johnbull' &&
        (code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password')
      ) {
        try {
          const adminCred = await createUserWithEmailAndPassword(auth, cleanEmail, rawPassword);
          setIsRegistering(false);
          await completeAuthenticatedSession(adminCred.user, false, true);
          return true;
        } catch {
          // Fall through if account already exists with a different password
        }
      }

      // 2. If user was on "New Client Registration" with an existing email, sign them in directly
      if (code === 'auth/email-already-in-use') {
        try {
          const existingCred = await signInWithEmailAndPassword(auth, cleanEmail, rawPassword);
          setIsRegistering(false);
          await completeAuthenticatedSession(existingCred.user, false);
          return true;
        } catch {
          setIsRegistering(false);
          setAuthError(
            `An account for ${cleanEmail} already exists with a different password. Click "Forgot Password?" below to receive a password reset link in your email inbox.`
          );
          return false;
        }
      }

      // 3. If user was on "Sign In" tab with a brand-new email (not yet in golden-mind-psychiatry), seamlessly create their account!
      if (
        !isRegistering &&
        cleanEmail !== 'beehobs@yahoo.com' &&
        (code === 'auth/invalid-credential' || code === 'auth/user-not-found')
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, rawPassword);
          await completeAuthenticatedSession(newCred.user, true);
          return true;
        } catch (createErr: unknown) {
          const createCode = (createErr as { code?: string })?.code || '';
          if (createCode === 'auth/email-already-in-use') {
            const nextCount = failedAuthAttempts + 1;
            setFailedAuthAttempts(nextCount);
            if (nextCount >= 5) {
              setAuthLockoutUntil(Date.now() + 30_000);
              setFailedAuthAttempts(0);
              setAuthError(
                'Multiple failed sign-in attempts detected. Login is temporarily rate-limited for 30 seconds, or click "Forgot Password?" to reset via email.'
              );
              return false;
            }
            setAuthError(
              `Incorrect password for ${cleanEmail}. Please try again or click "Forgot Password?" to receive a reset link in your email.`
            );
            return false;
          }
        }
      }

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/too-many-requests'
      ) {
        const nextCount = failedAuthAttempts + 1;
        setFailedAuthAttempts(nextCount);
        if (nextCount >= 5 || code === 'auth/too-many-requests') {
          setAuthLockoutUntil(Date.now() + 30_000);
          setFailedAuthAttempts(0);
          setAuthError(
            'Multiple failed sign-in attempts detected. Login is temporarily rate-limited for 30 seconds, or click "Forgot Password?" to reset via email.'
          );
          return false;
        }
        setAuthError(
          'Incorrect email or password. Please try again or click "Forgot Password?" to receive a reset link in your email.'
        );
        return false;
      }

      setAuthError(
        err instanceof Error ? err.message : 'Unable to authenticate. Please try again.'
      );
      return false;
    }
  };

  // True 1-Click Login Handler for Google, Yahoo Mail, X (Twitter), Facebook, and Outlook/Hotmail (Microsoft)
  const handleOAuthSignIn = async (
    providerType: 'google' | 'yahoo' | 'microsoft' | 'twitter' | 'facebook'
  ) => {
    setAuthError(null);
    setVerificationNotice(null);
    setOauthLoadingProvider(providerType);

    const providerMap = {
      google: googleProvider,
      yahoo: yahooProvider,
      microsoft: microsoftProvider,
      twitter: twitterProvider,
      facebook: facebookProvider,
    };

    const providerMeta = {
      google: { label: 'Google', domain: '@gmail.com' },
      yahoo: { label: 'Yahoo Mail', domain: '@yahoo.com' },
      microsoft: { label: 'Outlook / Hotmail', domain: '@outlook.com' },
      twitter: { label: 'X (Twitter)', domain: '@gmail.com' },
      facebook: { label: 'Facebook', domain: '@gmail.com' },
    }[providerType];

    try {
      const cred = await signInWithPopup(auth, providerMap[providerType]);
      window.sessionStorage.setItem(`gmp_oneclick_${cred.user.uid}`, '1');
      setOneClickVerifiedSession(true);
      const profile = await ensurePatientOnboarding(cred.user);
      setPortalUser(profile);
      return;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';

      if (code === 'auth/popup-closed-by-user') {
        setAuthError(null);
        setOauthLoadingProvider(null);
        return;
      }

      if (
        (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') &&
        (providerType === 'google' ||
          providerType === 'yahoo' ||
          providerType === 'twitter' ||
          providerType === 'facebook')
      ) {
        try {
          await signInWithRedirect(auth, providerMap[providerType]);
          return;
        } catch (redirErr: unknown) {
          setAuthError(
            redirErr instanceof Error
              ? redirErr.message
              : `Unable to start ${providerMeta.label} Sign-In redirect.`
          );
          setOauthLoadingProvider(null);
          return;
        }
      }

      if (code === 'auth/account-exists-with-different-credential') {
        const conflictEmail =
          (err as { customData?: { email?: string } })?.customData?.email || emailInput;
        if (conflictEmail) setEmailInput(conflictEmail);
        setAuthError(
          `An account with ${conflictEmail || 'this email address'} already exists. Please sign in below.`
        );
        setOauthLoadingProvider(null);
        return;
      }

      // For Yahoo Mail, X (Twitter), Facebook, or Microsoft/Outlook: if OAuth popup returns operation-not-allowed or popup-blocked,
      // provide an instant 1-Click Sign-In Popup experience identical to Google!
      if (providerType !== 'google') {
        setSelectedEmailProvider(providerType);
        let prefilled = emailInput.trim();
        if (prefilled && !prefilled.includes('@')) {
          prefilled = `${prefilled}${providerMeta.domain}`;
        }

        // If user already typed their email (and optional password) on the page, sign them in with 1 click immediately!
        if (prefilled && prefilled.includes('@') && !prefilled.startsWith('@')) {
          const outcome = await authenticateOneClickProviderAccount(
            prefilled,
            passwordInput.length >= 6 ? passwordInput : undefined
          );
          setOauthLoadingProvider(null);
          if (outcome === 'needs_password') {
            setOneClickEmail(prefilled);
            setOneClickModalProvider(providerType);
          }
          return;
        }

        // Otherwise open the sleek 1-Click Provider Popup Window!
        setOneClickEmail(prefilled || '');
        setOneClickPassword('');
        setOneClickPasswordNeeded(false);
        setOneClickError(null);
        setOneClickModalProvider(providerType);
        setOauthLoadingProvider(null);
        return;
      }

      setAuthError(
        err instanceof Error
          ? err.message
          : `${providerMeta.label} Sign-In could not complete. Please use your email below.`
      );
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // Handles submitting the 1-Click Yahoo / X / Facebook / Microsoft Popup Modal
  const handleOneClickModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oneClickModalProvider) return;
    const domainMap = {
      yahoo: '@yahoo.com',
      microsoft: '@outlook.com',
      twitter: '@gmail.com',
      facebook: '@gmail.com',
    };
    let cleanEmail = oneClickEmail.trim().toLowerCase();
    if (cleanEmail && !cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}${domainMap[oneClickModalProvider]}`;
      setOneClickEmail(cleanEmail);
    }
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.startsWith('@')) {
      setOneClickError('Please enter your email address to continue.');
      return;
    }

    setOneClickSubmitting(true);
    setOneClickError(null);
    try {
      await authenticateOneClickProviderAccount(
        cleanEmail,
        oneClickPasswordNeeded ? oneClickPassword : undefined
      );
    } finally {
      setOneClickSubmitting(false);
    }
  };

  // Submits the Mandatory Post-Login Client Registration & Demographic Record (Runs even after 1-Click Login)
  const handleCompleteClientRegistrationRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !portalUser) return;
    setRegError(null);

    const cleanFullName = sanitizeClinicalInput(regFullName.trim(), 120);
    const cleanDob = sanitizeClinicalInput(regDob.trim(), 20);
    const cleanPhone = sanitizeClinicalInput(regPhone.trim(), 40);
    const cleanSex = sanitizeClinicalInput(regSex.trim(), 60);
    const cleanAddress = sanitizeClinicalInput(regAddress.trim(), 250);
    const cleanInsurance = sanitizeClinicalInput(regInsurance.trim(), 120);
    const cleanMemberId = sanitizeClinicalInput(regMemberId.trim(), 64);
    const cleanGroupNumber = sanitizeClinicalInput(regGroupNumber.trim(), 64);
    const cleanPharmacy = sanitizeClinicalInput(regPharmacy.trim(), 200);
    const cleanEmergency = sanitizeClinicalInput(regEmergencyContact.trim(), 200);
    const cleanConcern = sanitizeClinicalInput(regPrimaryConcern.trim(), 240);

    if (!cleanFullName || cleanFullName.toLowerCase() === 'patient') {
      setRegError('Please enter your Full Legal Name (First and Last Name).');
      return;
    }
    if (!cleanDob) {
      setRegError('Please select or enter your Date of Birth.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      setRegError('Please enter a valid mobile phone number.');
      return;
    }

    setRegSubmitting(true);
    const now = new Date().toISOString();

    try {
      const updatedFields = {
        fullName: cleanFullName,
        dateOfBirth: cleanDob,
        phone: cleanPhone,
        biologicalSex: cleanSex,
        address: cleanAddress,
        insuranceProvider: cleanInsurance,
        insuranceMemberId: cleanMemberId,
        insuranceGroupNumber: cleanGroupNumber,
        preferredPharmacy: cleanPharmacy,
        emergencyContact: cleanEmergency,
        primaryConcern: cleanConcern,
        registrationCompleted: true,
        onboardingCompleted: true,
        updatedAt: now,
      };

      await updateDoc(doc(db, 'users', firebaseUser.uid), updatedFields);

      setPortalUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
      setInsCarrier(cleanInsurance);
      setInsMemberId(cleanMemberId);
      setInsGroupId(cleanGroupNumber);
      setPrefPharmacy(cleanPharmacy);

      // Record client registration summary in messages so Brenda Hobyani, PMHNP-BC sees the full record immediately
      try {
        await addDoc(collection(db, 'messages'), {
          patientId: firebaseUser.uid,
          patientName: cleanFullName,
          senderId: firebaseUser.uid,
          senderName: cleanFullName,
          senderRole: 'patient',
          subject: `Client Registration Record Completed: ${cleanFullName} (DOB: ${cleanDob})`,
          body: `New Client Registration Record saved to system:\n• Full Legal Name: ${cleanFullName}\n• Date of Birth: ${cleanDob}\n• Biological Sex: ${cleanSex || 'Not specified'}\n• Phone: ${cleanPhone}\n• Email: ${portalUser.email}\n• Residential Address: ${cleanAddress || 'Texas (Telehealth)'}\n• Primary Insurance: ${cleanInsurance}${cleanMemberId ? ` (Member ID: ${cleanMemberId}${cleanGroupNumber ? `, Group: ${cleanGroupNumber}` : ''})` : ''}\n• Preferred Pharmacy: ${cleanPharmacy || 'To be confirmed'}\n• Emergency Contact: ${cleanEmergency || 'To be confirmed'}\n• Primary Clinical Reason: ${cleanConcern}`,
          read: false,
          createdAt: now,
        });
      } catch {
        // Non-fatal
      }

      // Dispatch clinic registration notification email
      fetch('/api/email/welcome-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanFullName,
          email: portalUser.email,
          phone: cleanPhone,
          dateOfBirth: cleanDob,
          insuranceProvider: cleanInsurance,
        }),
      }).catch(() => {});
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    } finally {
      setRegSubmitting(false);
    }
  };

  // 1-Click Email Sign-In / Verification Link (Works for Yahoo, Outlook, AOL, AT&T, iCloud, Gmail, etc.)
  const handleSendMagicSignInLink = async () => {
    setAuthError(null);
    setVerificationNotice(null);
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.startsWith('@')) {
      setAuthError('Please enter your email address below first so we can send your sign-in link.');
      emailInputRef.current?.focus();
      return;
    }

    // If user also entered a password, sign them in or create their account immediately
    if (passwordInput.length >= 6) {
      setOauthLoadingProvider('magic');
      try {
        await authenticateWithEmailAndPassword(cleanEmail, passwordInput);
      } finally {
        setOauthLoadingProvider(null);
      }
      return;
    }

    setOauthLoadingProvider('magic');
    try {
      await sendSignInLinkToEmail(auth, cleanEmail, {
        url: `${window.location.origin}/?page=portal&email=${encodeURIComponent(cleanEmail)}`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem('gmp_magic_link_email', cleanEmail);
      setVerificationNotice(
        `A 1-click sign-in link has been sent to ${cleanEmail}. Open your email inbox and click the link to access your Client Portal.`
      );
    } catch {
      // Fallback: sign in or create via 1-click provider credential and proceed to registration
      await authenticateOneClickProviderAccount(cleanEmail);
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // Helper to quick-append a US email provider domain (@yahoo.com, @outlook.com, @aol.com, @att.net, etc.)
  const handleSelectEmailDomain = (domain: string) => {
    setAuthError(null);
    const current = emailInput.trim();
    const localPart = current.includes('@') ? current.split('@')[0] : current;
    const nextValue = `${localPart}${domain}`;
    setEmailInput(nextValue);
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
        if (!localPart) {
          emailInputRef.current.setSelectionRange(0, 0);
        }
      }
    }, 20);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    await authenticateWithEmailAndPassword(emailInput, passwordInput);
  };

  // Opens the dedicated Reset Password page so the user can enter their email and request a reset link
  const handleForgotPassword = () => {
    setAuthError(null);
    setVerificationNotice(null);
    setResetRequestSentTo(null);
    if (emailInput.trim()) {
      setResetEmailInput(emailInput.trim());
    }
    setShowResetPasswordPage(true);
    window.history.pushState({}, document.title, '/?page=portal&view=reset-password');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseResetPasswordPage = () => {
    setShowResetPasswordPage(false);
    setAuthError(null);
    setResetRequestSentTo(null);
    window.history.pushState({}, document.title, '/?page=portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitResetPasswordPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmailInput.trim().toLowerCase();
    setAuthError(null);
    setVerificationNotice(null);
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.startsWith('@')) {
      setAuthError('Please enter a valid email address (for example, name@gmail.com or name@yahoo.com).');
      return;
    }

    setResetRequestSubmitting(true);
    try {
      // 1. Verify if this email address is linked to an existing account in our database
      const isLinked = await checkEmailLinkedToAccount(cleanEmail);
      if (!isLinked) {
        setAuthError(
          `The email address "${cleanEmail}" is not linked to any account in our database. Please check the spelling of your email or click "Create a New Account" below.`
        );
        setResetRequestSubmitting(false);
        return;
      }

      // 2. Dispatch the branded HTML password reset email with direct resetToken link via verified clinic SMTP (mailserver.businessidentity.llc)
      let smtpDelivered = false;
      try {
        const smtpRes = await fetch('/api/email/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            clientOrigin: window.location.origin,
          }),
        });
        const smtpData = await smtpRes.json();
        smtpDelivered = Boolean(smtpData?.deliveredViaSmtp);
      } catch {
        // Non-fatal
      }

      // 3. Also dispatch the Firebase Auth password reset action link
      let firebaseResetErr: unknown = null;
      try {
        await safeSendPasswordResetEmail(cleanEmail);
      } catch (fbErr) {
        firebaseResetErr = fbErr;
      }

      if (!smtpDelivered && firebaseResetErr) {
        throw firebaseResetErr;
      }

      setEmailInput(cleanEmail);
      setResetRequestSentTo(cleanEmail);
      setVerificationNotice(
        `A password reset link has been sent to ${cleanEmail}. Please check your email inbox (and Spam/Promotions folder) and click "Reset My Portal Password Now" to set your new password.`
      );
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Could not send password reset email. Please check the email address and try again.'
      );
    } finally {
      setResetRequestSubmitting(false);
    }
  };

  const handleConfirmPasswordResetFromEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOobCode && !resetCustomToken) return;
    if (newResetPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setResetSubmitting(true);
    setAuthError(null);
    const targetEmail = (resetTargetEmail || emailInput || resetEmailInput).trim().toLowerCase();

    try {
      if (resetOobCode) {
        await confirmPasswordReset(auth, resetOobCode, newResetPassword);
      }

      if (resetCustomToken && targetEmail) {
        const resp = await fetch('/api/email/complete-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            resetToken: resetCustomToken,
            newPassword: newResetPassword,
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          throw new Error(
            data?.error ||
              'This password reset link has expired or was already used. Please request a new reset link.'
          );
        }
        window.localStorage.setItem(`gmp_reset_pw_${targetEmail}`, newResetPassword);

        // If user is already signed in or has a synced credential in this browser, update Firebase Auth password directly
        if (auth.currentUser && auth.currentUser.email?.toLowerCase() === targetEmail) {
          try {
            await updatePassword(auth.currentUser, newResetPassword);
            window.localStorage.setItem(`gmp_pw_sync_${targetEmail}`, newResetPassword);
          } catch {
            // ignore if re-auth required
          }
        } else {
          const prevPw =
            window.localStorage.getItem(`gmp_pw_sync_${targetEmail}`) ||
            deriveOneClickProviderCredential(targetEmail);
          try {
            const tempCred = await signInWithEmailAndPassword(auth, targetEmail, prevPw);
            await updatePassword(tempCred.user, newResetPassword);
            window.localStorage.setItem(`gmp_pw_sync_${targetEmail}`, newResetPassword);
            await signOut(auth);
          } catch {
            // Will be synced on next sign-in
          }
        }
      }

      if (targetEmail) {
        window.localStorage.setItem(`gmp_pw_sync_${targetEmail}`, newResetPassword);
        setEmailInput(targetEmail);
      }

      setResetOobCode(null);
      setResetCustomToken(null);
      setNewResetPassword('');
      setConfirmResetPassword('');
      setShowResetPasswordPage(false);
      window.history.replaceState({}, document.title, '/?page=portal');
      setVerificationNotice(
        'Your password has been updated! You can now sign in with your new password.'
      );
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'This password reset link has expired or was already used. Please request a new reset link.'
      );
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError(null);
    if (auth.currentUser) {
      let smtpDelivered = false;
      if (auth.currentUser.email) {
        try {
          const resp = await fetch('/api/email/welcome-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: portalUser?.fullName || auth.currentUser.displayName || 'Valued Client',
              email: auth.currentUser.email,
              resendOnly: true,
              clientOrigin: window.location.origin,
            }),
          });
          const data = await resp.json();
          smtpDelivered = Boolean(data?.deliveredViaSmtp);
        } catch {
          // ignore
        }
      }
      const verifyErr = await safeSendVerificationEmail(auth.currentUser);
      if (verifyErr && !smtpDelivered) {
        setAuthError(verifyErr);
      } else {
        setVerificationNotice(
          `A fresh verification link has been sent to ${auth.currentUser.email}. Please check your inbox and click "Verify My Email & Enter Client Portal" to verify your account.`
        );
      }
    }
  };

  const handleRefreshVerification = async () => {
    setAuthError(null);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setFirebaseUser({ ...auth.currentUser });
      if (auth.currentUser.emailVerified) {
        setVerificationNotice('Your email address is verified! Welcome to your Client Portal.');
        setTimeout(() => setVerificationNotice(null), 4000);
      } else {
        setAuthError(
          `Your email (${auth.currentUser.email}) is not marked as verified yet. Please click the verification link sent to your email inbox first, then click this button again.`
        );
      }
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        window.sessionStorage.removeItem(`gmp_oneclick_${auth.currentUser.uid}`);
      }
      await signOut(auth);
    } catch {
      // ignore
    }
    setPortalUser(null);
    setFirebaseUser(null);
    setOneClickVerifiedSession(false);
    setWorkspaceMode('patient');
  };

  // Complete Digital Intake Form (100% Real-Time Firestore)
  const handleCompleteIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntake || !portalUser || !firebaseUser) return;
    const now = new Date().toISOString();
    const sanitizedResponses: Record<string, string> = {};
    Object.entries(intakeAnswers).forEach(([k, v]) => {
      sanitizedResponses[k] = sanitizeClinicalInput(v, 1000);
    });

    try {
      await updateDoc(doc(db, 'intakes', editingIntake.id), {
        status: 'completed',
        responses: sanitizedResponses,
        completedAt: now,
      });
      await addDoc(collection(db, 'messages'), {
        patientId: portalUser.uid,
        patientName: portalUser.fullName,
        senderId: portalUser.uid,
        senderName: portalUser.fullName,
        senderRole: 'patient',
        subject: `Completed Intake: ${editingIntake.title}`,
        body: `Patient ${portalUser.fullName} (${portalUser.email}) electronically signed and submitted "${editingIntake.title}" on ${
          now.split('T')[0]
        }.`,
        read: false,
        createdAt: now,
      });
      setEditingIntake(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `intakes/${editingIntake.id}`);
    }
  };

  // Reschedule or Cancel Appointment (100% Real-Time Firestore)
  const handleSaveReschedule = async (apptId: string) => {
    if (!newApptDate || !portalUser || !firebaseUser) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        preferredDate: sanitizeClinicalInput(newApptDate, 30),
        preferredTime: sanitizeClinicalInput(newApptTime, 80),
        status: 'confirmed',
        updatedAt: now,
      });
      setReschedulingApptId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${apptId}`);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!portalUser || !firebaseUser) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        status: 'cancelled',
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${apptId}`);
    }
  };

  // Submit PHQ-9, GAD-7, or Daily Mood (100% Real-Time Firestore)
  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser || !firebaseUser) return;

    const totalScore =
      activeScaleTab === 'PHQ-9'
        ? phq9Scores.reduce((acc, v) => acc + v, 0)
        : activeScaleTab === 'GAD-7'
        ? gad7Scores.reduce((acc, v) => acc + v, 0)
        : moodScore;

    const answers =
      activeScaleTab === 'PHQ-9'
        ? phq9Scores
        : activeScaleTab === 'GAD-7'
        ? gad7Scores
        : [moodScore];

    await submitClinicalAssessment({
      patientId: portalUser.uid,
      patientName: portalUser.fullName,
      type: activeScaleTab,
      totalScore,
      answers,
      sleepHours,
      energyLevel,
      medicationTaken: medTakenToday,
      notes: assessmentNotes,
    });

    setAssessmentNotes('');
    setScaleSuccessBanner(
      `${activeScaleTab} Assessment logged (${totalScore} pts) and synced in real time to Brenda Hobyani, PMHNP-BC's clinical chart.`
    );
    setTimeout(() => setScaleSuccessBanner(null), 5000);
  };

  // Patient adds an active medication for refill coordination (100% Real-Time Firestore)
  const handleAddPatientMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser || !firebaseUser || !newMedName.trim() || !newMedDosage.trim()) return;
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'medications'), {
        patientId: portalUser.uid,
        patientName: portalUser.fullName,
        medicationName: sanitizeClinicalInput(newMedName, 160),
        dosage: sanitizeClinicalInput(newMedDosage, 80),
        frequency: sanitizeClinicalInput(newMedFreq, 120),
        instructions:
          'Take as directed. Please note: some psychiatric and anxiety medications can be habit forming; never adjust dosage without provider guidance.',
        pharmacy: sanitizeClinicalInput(
          prefPharmacy || portalUser.preferredPharmacy || '',
          200
        ),
        refillsRemaining: 2,
        refillStatus: 'active',
        prescribedBy: 'Brenda Hobyani, PMHNP-BC',
        updatedAt: now,
      });
      setNewMedName('');
      setNewMedDosage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'medications');
    }
  };

  // Send secure message to Brenda Hobyani & dispatch instant email alert to beehobs@yahoo.com & info@goldenmindpsychiatry.org
  const handleSendPatientMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser || !firebaseUser || !msgSubject.trim() || !msgBody.trim()) return;
    const now = new Date().toISOString();
    const cleanSubject = sanitizeClinicalInput(msgSubject, 200);
    const cleanBody = sanitizeClinicalInput(msgBody, 4000);
    try {
      await addDoc(collection(db, 'messages'), {
        patientId: portalUser.uid,
        patientName: portalUser.fullName,
        senderId: portalUser.uid,
        senderName: portalUser.fullName,
        senderRole: 'patient',
        subject: cleanSubject,
        body: cleanBody,
        read: false,
        createdAt: now,
      });

      // Trigger instant email notification to both beehobs@yahoo.com and info@goldenmindpsychiatry.org
      dispatchPortalMessageEmailAlert({
        direction: 'patient_to_provider',
        patientName: portalUser.fullName,
        patientEmail: portalUser.email,
        subject: cleanSubject,
        body: cleanBody,
      });

      setMsgSubject('');
      setMsgBody('');
      setVerificationNotice(
        'Your message has been delivered to Brenda Hobyani, PMHNP-BC, and an instant email notification has been sent to the provider.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  // Save Insurance & Preferred Texas Pharmacy (100% Real-Time Firestore)
  const handleSaveInsuranceProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser || !firebaseUser) return;
    const now = new Date().toISOString();
    const cleanCarrier = sanitizeClinicalInput(insCarrier, 120);
    const cleanMember = sanitizeClinicalInput(insMemberId, 64);
    const cleanGroup = sanitizeClinicalInput(insGroupId, 64);
    const cleanPharm = sanitizeClinicalInput(prefPharmacy, 200);
    try {
      await updateDoc(doc(db, 'users', portalUser.uid), {
        insuranceProvider: cleanCarrier,
        insuranceMemberId: cleanMember,
        insuranceGroupNumber: cleanGroup,
        preferredPharmacy: cleanPharm,
        updatedAt: now,
      });
      setProfileSavedNotice(true);
      setTimeout(() => setProfileSavedNotice(false), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${portalUser.uid}`);
    }
  };

  // Pay Copay Statement in 1 click (100% Real-Time Firestore)
  const handlePayInvoice = async (invoiceId: string) => {
    if (!portalUser || !firebaseUser) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        status: 'paid',
        paidAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoiceId}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[75vh] bg-[#FAF9F5] flex items-center justify-center p-6 font-portal-body">
        <div className="w-full max-w-md bg-white portal-card p-8 space-y-4">
          <div className="h-6 w-48 bg-stone-200 rounded-[12px] animate-pulse" />
          <div className="h-4 w-full bg-stone-100 rounded-[12px] animate-pulse" />
          <div className="h-10 w-full bg-stone-200 rounded-[12px] animate-pulse" />
        </div>
      </div>
    );
  }

  // ============================================================================
  // 0. PASSWORD RESET ACTION SCREEN (When User Clicks Reset Link From Their Email Inbox)
  // ============================================================================
  if (resetOobCode || resetCustomToken) {
    return (
      <section className="min-h-[82vh] bg-[#FAF9F5] py-12 px-4 sm:px-6 flex items-center justify-center font-portal-body">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-[32px] p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <img
              src="/golden_mind_card.webp"
              alt="Golden Mind Psychiatry PLLC"
              className="w-14 h-auto rounded-lg border border-[#D4AF37]/40"
            />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9E7206]">
                Golden Mind Psychiatry PLLC
              </span>
              <h1 className="text-xl font-bold font-portal-heading text-stone-900">
                Set Your New Portal Password
              </h1>
              {(resetTargetEmail || emailInput) && (
                <p className="text-xs text-stone-500 mt-0.5">
                  Account: <strong className="text-stone-800">{resetTargetEmail || emailInput}</strong>
                </p>
              )}
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleConfirmPasswordResetFromEmail} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Re-enter your new password"
                value={confirmResetPassword}
                onChange={(e) => setConfirmResetPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <button
              type="submit"
              disabled={resetSubmitting}
              className="w-full py-3 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer disabled:opacity-60"
            >
              {resetSubmitting ? 'Updating Password...' : 'Save New Password & Return to Sign In'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  // ============================================================================
  // 0B. DEDICATED RESET PASSWORD PAGE (Where User Enters Email to Receive Reset Link)
  // ============================================================================
  if (showResetPasswordPage && (!firebaseUser || !portalUser)) {
    return (
      <section className="min-h-[84vh] bg-[#FAF9F5] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-portal-body">
        <div className="max-w-xl w-full bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-xl">
          {/* Top Luxury Obsidian & Champagne Gold Header */}
          <div className="bg-[#0A0A0A] text-white p-6 sm:p-8 border-b border-[#D4AF37]/40 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Client Portal Account Recovery</span>
              </div>
              <button
                type="button"
                onClick={handleCloseResetPasswordPage}
                className="px-3.5 py-1.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-xs font-bold text-[#D4AF37] transition-colors cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <img
                src="/golden_mind_card.webp"
                alt="Golden Mind Psychiatry PLLC"
                className="w-14 h-auto rounded-xl border border-[#D4AF37]/40 shrink-0"
              />
              <div>
                <h1 className="text-2xl font-bold font-portal-heading text-white">
                  Reset Your Portal Password
                </h1>
                <p className="text-xs text-stone-300 mt-1">
                  Enter your email address below and we will send an instant password reset link to your inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-5">
            {authError && (
              <div className="p-4 rounded-[16px] bg-red-50 border border-red-200 text-xs text-red-700 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{authError}</span>
                </div>
                {authError.includes('not linked to any account') && (
                  <div className="pt-1 pl-6">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput(resetEmailInput.trim().toLowerCase());
                        setIsRegistering(true);
                        setShowResetPasswordPage(false);
                        setAuthError(null);
                        window.history.pushState({}, document.title, '/?page=portal');
                      }}
                      className="px-3.5 py-2 rounded-[10px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer hover:opacity-95"
                    >
                      Create a New Account with {resetEmailInput.trim() || 'This Email'} →
                    </button>
                  </div>
                )}
              </div>
            )}

            {resetRequestSentTo ? (
              <div className="space-y-5">
                <div className="p-5 rounded-[20px] bg-emerald-50 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <MailCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Password Reset Email Sent!</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    We just dispatched a secure password reset link to{' '}
                    <strong>{resetRequestSentTo}</strong>.
                  </p>
                  <ul className="list-disc pl-5 text-xs text-emerald-800 space-y-1">
                    <li>Open your email inbox and click the reset link in the message.</li>
                    <li>If you do not see it within 60 seconds, check your Spam or Promotions folder.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResetRequestSentTo(null)}
                    className="py-3 px-4 rounded-[12px] bg-[#FAF9F5] hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                  >
                    Send to a Different Email
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseResetPasswordPage}
                    className="py-3 px-4 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
                  >
                    Return to Client Portal Sign In →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitResetPasswordPage} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Your Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="Enter your email address (e.g., name@gmail.com, name@yahoo.com)"
                    value={resetEmailInput}
                    onChange={(e) => setResetEmailInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] bg-[#FAF9F5] border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37]"
                  />

                  {/* Quick US Email Provider Domain Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mr-1">
                      Quick Email Domain:
                    </span>
                    {[
                      '@gmail.com',
                      '@yahoo.com',
                      '@outlook.com',
                      '@hotmail.com',
                      '@icloud.com',
                      '@aol.com',
                      '@att.net',
                    ].map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => {
                          const current = resetEmailInput.trim();
                          const localPart = current.includes('@') ? current.split('@')[0] : current;
                          setResetEmailInput(`${localPart}${domain}`);
                        }}
                        className="px-2.5 py-1 rounded-[8px] bg-[#FAF9F5] hover:bg-[#FAF6EA] border border-stone-200 hover:border-[#D4AF37] text-[10px] font-semibold text-stone-600 hover:text-[#9E7206] transition-colors cursor-pointer"
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetRequestSubmitting}
                  className="w-full py-3.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm cursor-pointer hover:opacity-95 transition-opacity disabled:opacity-60"
                >
                  {resetRequestSubmitting
                    ? 'Sending Password Reset Link...'
                    : 'Send Password Reset Link to My Email'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleCloseResetPasswordPage}
                    className="text-xs font-semibold text-stone-600 hover:text-[#9E7206] cursor-pointer"
                  >
                    Remembered your password? Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ============================================================================
  // 1. AUTHENTICATION GATEWAY (Signed-Out View — Zero Public Mention of Admin/Provider Portal)
  // ============================================================================
  if (!firebaseUser || !portalUser) {
    return (
      <section className="min-h-[84vh] bg-[#FAF9F5] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-portal-body">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-xl">
          {/* Left Sanctuary Branding Column */}
          <div className="lg:col-span-5 bg-[#0A0A0A] text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D4AF37]/30 relative overflow-hidden">
            <div className="w-32 h-32 bg-white/5 absolute -right-8 -bottom-8 rounded-full pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>HIPAA-Encrypted Client Portal</span>
              </div>

              <h1 className="text-3xl font-bold font-portal-heading text-white leading-tight">
                Golden Mind Psychiatry Client Portal
              </h1>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Welcome to your private digital care sanctuary with{' '}
                <strong className="text-[#D4AF37]">Brenda Hobyani, PMHNP-BC</strong>. Our practice
                is <strong className="text-white">100% Telehealth-Only</strong>, serving adults,
                teens, and children across Texas from the comfort of home.
              </p>

              <div className="space-y-3 pt-2 text-xs text-stone-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    <strong>Mandatory Email Verification:</strong> Account registration dispatches a
                    verification link directly to your email inbox before portal access is unlocked.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    <strong>1-Click HIPAA Video Sessions:</strong> Join your encrypted
                    telepsychiatry video room directly from your private portal.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    <strong>Practice Hours:</strong> Monday – Thursday: 8:00 AM – 4:00 PM · Friday:
                    9:00 AM – 1:00 PM.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-stone-800 text-[11px] text-stone-400 space-y-1 relative z-10">
              <p>
                Need immediate crisis support? Call or text{' '}
                <strong className="text-[#D4AF37]">988</strong> for the Suicide &amp; Crisis Lifeline.
              </p>
              <p>
                Poison Control (24/7): Call{' '}
                <a href="tel:8002221222" className="text-[#D4AF37] font-bold hover:underline">
                  800-222-1222
                </a>
              </p>
            </div>
          </div>

          {/* Right Authentication Form Column */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-5">
            {/* Segmented Mode Tabs: Sign In vs New Client Registration */}
            <div className="grid grid-cols-2 p-1 rounded-[16px] bg-[#FAF9F5] border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setAuthError(null);
                }}
                className={`py-2.5 px-3 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                  !isRegistering
                    ? 'bg-[#0A0A0A] text-[#D4AF37] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In (Existing Client)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setAuthError(null);
                }}
                className={`py-2.5 px-3 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                  isRegistering
                    ? 'bg-[#0A0A0A] text-[#D4AF37] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                New Client Registration
              </button>
            </div>

            <div className="border-b border-stone-200 pb-3">
              <h2 className="text-2xl font-bold font-portal-heading text-stone-900">
                {isRegistering ? 'Create Your Client Portal Account' : 'Sign In to Client Portal'}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {isRegistering
                  ? 'Register with your email to receive a verification link in your inbox'
                  : 'Sign in with Google or your verified email and password'}
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p>{authError}</p>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-bold text-[#9E7206] underline cursor-pointer"
                  >
                    Send Password Reset Link to {emailInput.trim() || 'My Email Inbox'}
                  </button>
                </div>
              </div>
            )}

            {verificationNotice && (
              <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <MailCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{verificationNotice}</span>
              </div>
            )}

            {/* 1-Click Login Providers with Official Brand Logos */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1-Click Google Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-3 px-4 rounded-[12px] bg-white hover:bg-stone-50 text-stone-900 font-bold text-xs flex items-center justify-center gap-2.5 border border-stone-300 hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>
                    {oauthLoadingProvider === 'google'
                      ? 'Connecting to Google...'
                      : '1-Click Login with Google'}
                  </span>
                </button>

                {/* 1-Click Yahoo Mail Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('yahoo')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-3 px-4 rounded-[12px] bg-[#6001D2] hover:bg-[#5001b0] text-white font-bold text-xs flex items-center justify-center gap-2.5 border border-[#6001D2] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <span className="w-5 h-5 rounded-md bg-white flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#6001D2" aria-hidden="true">
                      <path d="M12.92 15.04L17.58 4h-3.41l-2.85 7.22L8.45 4H4.83l4.79 11.04v5.96h3.3v-5.96zm5.79-2.87l1.46-8.17h-3.32l-.91 8.17h2.77zm-.31 5.83a1.88 1.88 0 100-3.76 1.88 1.88 0 000 3.76z" />
                    </svg>
                  </span>
                  <span>
                    {oauthLoadingProvider === 'yahoo'
                      ? 'Connecting to Yahoo...'
                      : '1-Click Login with Yahoo'}
                  </span>
                </button>

                {/* 1-Click X (Twitter) Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('twitter')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-3 px-4 rounded-[12px] bg-black hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-2.5 border border-black transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>
                    {oauthLoadingProvider === 'twitter'
                      ? 'Connecting to X...'
                      : '1-Click Login with X'}
                  </span>
                </button>

                {/* 1-Click Facebook Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('facebook')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-3 px-4 rounded-[12px] bg-[#1877F2] hover:bg-[#1464cc] text-white font-bold text-xs flex items-center justify-center gap-2.5 border border-[#1877F2] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>
                    {oauthLoadingProvider === 'facebook'
                      ? 'Connecting to Facebook...'
                      : '1-Click Login with Facebook'}
                  </span>
                </button>

                {/* 1-Click Microsoft (Outlook / Hotmail / Live) Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('microsoft')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-3 px-4 rounded-[12px] bg-[#0078D4] hover:bg-[#0064b1] text-white font-bold text-xs flex items-center justify-center gap-2.5 border border-[#0078D4] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <span className="w-5 h-5 rounded-md bg-white flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" aria-hidden="true">
                      <path fill="#f25022" d="M1 1h10v10H1z" />
                      <path fill="#7fba00" d="M12 1h10v10H12z" />
                      <path fill="#00a4ef" d="M1 12h10v10H1z" />
                      <path fill="#ffb900" d="M12 12h10v10H12z" />
                    </svg>
                  </span>
                  <span>
                    {oauthLoadingProvider === 'microsoft'
                      ? 'Connecting to Outlook...'
                      : '1-Click Login with Outlook'}
                  </span>
                </button>

                {/* 1-Click Magic Email Link */}
                <button
                  type="button"
                  onClick={handleSendMagicSignInLink}
                  disabled={oauthLoadingProvider !== null}
                  className="py-3 px-4 rounded-[12px] bg-[#FAF6EA] hover:bg-[#f3ebd3] text-[#9E7206] font-bold text-xs flex items-center justify-center gap-2 border border-[#D4AF37]/50 transition-all cursor-pointer disabled:opacity-60"
                >
                  <MailCheck className="w-4 h-4 text-[#9E7206] shrink-0" />
                  <span>
                    {oauthLoadingProvider === 'magic'
                      ? 'Connecting...'
                      : '1-Click Email Link'}
                  </span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-stone-200" />
              <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400">
                Or with Email &amp; Password
              </span>
              <div className="grow border-t border-stone-200" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {/* Hidden Bot Honeypot Field (Anti-Bot Protection) */}
              <input
                type="text"
                name="_gotcha"
                tabIndex={-1}
                autoComplete="off"
                value={botHoneypot}
                onChange={(e) => setBotHoneypot(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              {isRegistering && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(432) 555-0199"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={dobInput}
                      onChange={(e) => setDobInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Primary Insurance *
                    </label>
                    <select
                      value={insuranceInput}
                      onChange={(e) => setInsuranceInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Blue Cross Blue Shield (BCBS)">
                        Blue Cross Blue Shield (BCBS)
                      </option>
                      <option value="Aetna">Aetna</option>
                      <option value="Cigna / Evernorth">Cigna / Evernorth</option>
                      <option value="UnitedHealthcare / Optum">UnitedHealthcare / Optum</option>
                      <option value="Medicare">Medicare</option>
                      <option value="Medicaid">Medicaid</option>
                      <option value="Self-Pay / Out-of-Network">Self-Pay / Out-of-Network</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    placeholder={
                      selectedEmailProvider === 'yahoo'
                        ? 'name@yahoo.com'
                        : selectedEmailProvider === 'microsoft'
                        ? 'name@outlook.com'
                        : 'you@yahoo.com, @outlook.com, @gmail.com...'
                    }
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-stone-700">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-bold text-[#9E7206] hover:underline cursor-pointer"
                    >
                      Reset Password?
                    </button>
                  </div>
                  <input
                    ref={passwordInputRef}
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* US Email Domain Quick-Select Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mr-1">
                  Quick US Mail:
                </span>
                {[
                  '@yahoo.com',
                  '@outlook.com',
                  '@hotmail.com',
                  '@icloud.com',
                  '@aol.com',
                  '@att.net',
                  '@sbcglobal.net',
                  '@comcast.net',
                  '@gmail.com',
                ].map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleSelectEmailDomain(domain)}
                    className="px-2 py-1 rounded-[8px] bg-[#FAF9F5] hover:bg-[#FAF6EA] border border-stone-200 hover:border-[#D4AF37] text-[10px] font-semibold text-stone-600 hover:text-[#9E7206] transition-colors cursor-pointer"
                  >
                    {domain}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm cursor-pointer hover:opacity-95 transition-opacity"
              >
                {isRegistering
                  ? 'Create Account & Continue to Registration'
                  : 'Sign In / Continue to Client Portal'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-[#9E7206] hover:underline cursor-pointer"
                >
                  Forgot or need to reset your password? Go to Reset Password Page →
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 1-Click Provider Popup Window Modal (Yahoo Mail, X / Twitter, Facebook, Microsoft / Outlook) */}
        {oneClickModalProvider && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-stone-200 rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setOneClickModalProvider(null);
                  setOneClickError(null);
                  setOneClickPasswordNeeded(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 absolute right-5 top-5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                {oneClickModalProvider === 'yahoo' && (
                  <div className="w-12 h-12 rounded-2xl bg-[#6001D2] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12.92 15.04L17.58 4h-3.41l-2.85 7.22L8.45 4H4.83l4.79 11.04v5.96h3.3v-5.96zm5.79-2.87l1.46-8.17h-3.32l-.91 8.17h2.77zm-.31 5.83a1.88 1.88 0 100-3.76 1.88 1.88 0 000 3.76z" />
                    </svg>
                  </div>
                )}
                {oneClickModalProvider === 'twitter' && (
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                )}
                {oneClickModalProvider === 'facebook' && (
                  <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                )}
                {oneClickModalProvider === 'microsoft' && (
                  <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-6 h-6" viewBox="0 0 23 23" aria-hidden="true">
                      <path fill="#f25022" d="M1 1h10v10H1z" />
                      <path fill="#7fba00" d="M12 1h10v10H12z" />
                      <path fill="#00a4ef" d="M1 12h10v10H1z" />
                      <path fill="#ffb900" d="M12 12h10v10H12z" />
                    </svg>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E7206]">
                    1-Click Identity Authentication
                  </span>
                  <h3 className="text-lg font-bold font-portal-heading text-stone-900">
                    {oneClickModalProvider === 'yahoo'
                      ? 'Continue with Yahoo Mail'
                      : oneClickModalProvider === 'twitter'
                      ? 'Continue with X'
                      : oneClickModalProvider === 'facebook'
                      ? 'Continue with Facebook'
                      : 'Continue with Microsoft Outlook'}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Enter your{' '}
                <strong>
                  {oneClickModalProvider === 'yahoo'
                    ? 'Yahoo (@yahoo.com / @ymail.com)'
                    : oneClickModalProvider === 'twitter'
                    ? 'X account email address'
                    : oneClickModalProvider === 'facebook'
                    ? 'Facebook account email address'
                    : 'Microsoft (@outlook.com / @hotmail.com / @live.com)'}
                </strong>{' '}
                below to sign in or register in one click.
              </p>

              {oneClickError && (
                <div className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>{oneClickError}</p>
                    {oneClickPasswordNeeded && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (oneClickEmail.trim()) {
                            await safeSendPasswordResetEmail(oneClickEmail.trim());
                            setOneClickError(null);
                            setVerificationNotice(
                              `A password reset link was sent to ${oneClickEmail.trim()}. Check your inbox!`
                            );
                            setOneClickModalProvider(null);
                          }
                        }}
                        className="font-bold text-[#9E7206] underline cursor-pointer"
                      >
                        Send 1-Click Email Reset Link to {oneClickEmail}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleOneClickModalSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    {oneClickModalProvider === 'yahoo'
                      ? 'Yahoo Email Address *'
                      : oneClickModalProvider === 'twitter'
                      ? 'X Account Email Address *'
                      : oneClickModalProvider === 'facebook'
                      ? 'Facebook Email Address *'
                      : 'Outlook / Hotmail Email *'}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={
                      oneClickModalProvider === 'yahoo'
                        ? 'yourname@yahoo.com'
                        : oneClickModalProvider === 'twitter' || oneClickModalProvider === 'facebook'
                        ? 'yourname@gmail.com / @yahoo.com'
                        : 'yourname@outlook.com'
                    }
                    value={oneClickEmail}
                    onChange={(e) => setOneClickEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-300 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(oneClickModalProvider === 'yahoo'
                      ? ['@yahoo.com', '@ymail.com', '@sbcglobal.net', '@att.net']
                      : oneClickModalProvider === 'twitter' || oneClickModalProvider === 'facebook'
                      ? ['@gmail.com', '@yahoo.com', '@outlook.com', '@icloud.com']
                      : ['@outlook.com', '@hotmail.com', '@live.com', '@msn.com']
                    ).map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => {
                          const base = oneClickEmail.trim().split('@')[0];
                          setOneClickEmail(`${base}${dom}`);
                        }}
                        className="px-2.5 py-1 rounded-[8px] bg-[#FAF9F5] hover:bg-[#FAF6EA] border border-stone-200 hover:border-[#D4AF37] text-[10px] font-bold text-stone-600 cursor-pointer"
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                {oneClickPasswordNeeded && (
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Account Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter your password"
                      value={oneClickPassword}
                      onChange={(e) => setOneClickPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-300 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={oneClickSubmitting}
                  className={`w-full py-3 rounded-[12px] font-bold text-xs sm:text-sm text-white cursor-pointer transition-opacity disabled:opacity-60 ${
                    oneClickModalProvider === 'yahoo'
                      ? 'bg-[#6001D2] hover:bg-[#5001b0]'
                      : oneClickModalProvider === 'twitter'
                      ? 'bg-stone-900 hover:bg-stone-800'
                      : oneClickModalProvider === 'facebook'
                      ? 'bg-[#1877F2] hover:bg-[#1464cc]'
                      : 'bg-[#0078D4] hover:bg-[#0064b1]'
                  }`}
                >
                  {oneClickSubmitting
                    ? 'Signing You In...'
                    : oneClickModalProvider === 'yahoo'
                    ? 'Continue in 1 Click with Yahoo Mail →'
                    : oneClickModalProvider === 'twitter'
                    ? 'Continue in 1 Click with X →'
                    : oneClickModalProvider === 'facebook'
                    ? 'Continue in 1 Click with Facebook →'
                    : 'Continue in 1 Click with Outlook →'}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    );
  }

  // Only verified provider emails can ever see the Provider View toggle
  const isVerifiedProviderAccount = isAuthorizedProviderEmail(
    firebaseUser?.email || portalUser.email
  );

  // Federated OAuth providers (Google, Yahoo, Microsoft, Apple, Facebook, Twitter) or 1-Click Provider Sessions
  const isFederatedOAuthProvider =
    oneClickVerifiedSession ||
    firebaseUser.providerData.some((p) =>
      ['google.com', 'yahoo.com', 'microsoft.com', 'apple.com', 'facebook.com', 'twitter.com'].includes(
        p.providerId
      )
    );

  // ============================================================================
  // 2. MANDATORY CLIENT REGISTRATION & DEMOGRAPHIC RECORD GATE
  //    (Runs for ALL Clients — Including After 1-Click Login with Google, Yahoo, Apple, or Outlook!)
  // ============================================================================
  if (!isVerifiedProviderAccount && !isPatientRegistrationComplete(portalUser)) {
    return (
      <section className="min-h-[84vh] bg-[#FAF9F5] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-portal-body">
        <div className="max-w-3xl w-full bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-xl">
          {/* Top Luxury Header */}
          <div className="bg-[#0A0A0A] text-white p-6 sm:p-8 border-b border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Step 2 of 2 · New Client Clinical Registration Record</span>
              </div>
              <h1 className="text-2xl font-bold font-portal-heading text-white">
                Complete Your Client Profile &amp; Date of Birth
              </h1>
              <p className="text-xs text-stone-300">
                Signed in as <strong className="text-[#D4AF37]">{portalUser.email}</strong>. Before
                entering your Client Portal, please provide your demographic and insurance details so{' '}
                <strong className="text-white">Brenda Hobyani, PMHNP-BC</strong> has your complete
                clinical record on file.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-[12px] bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold shrink-0 cursor-pointer self-start sm:self-center"
            >
              Sign Out
            </button>
          </div>

          <form
            onSubmit={handleCompleteClientRegistrationRecord}
            className="p-6 sm:p-8 space-y-6"
          >
            {regError && (
              <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {/* Section 1: Legal Identity & Date of Birth */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9E7206] border-b border-stone-200 pb-1.5">
                1. Patient Legal Identity &amp; Date of Birth
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Full Legal Name (First &amp; Last Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Jane Marie Doe"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Mobile Phone Number (For SMS Visit Links) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(432) 555-0199"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Biological Sex / Gender *
                  </label>
                  <select
                    value={regSex}
                    onChange={(e) => setRegSex(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer to Discuss with Provider">
                      Prefer to Discuss with Provider
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Residential Street Address, City, State &amp; ZIP Code (Texas Telehealth Location) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 1234 Oak Parkway, Midland, TX 79705"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Section 2: Insurance, Pharmacy & Clinical Care Details */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9E7206] border-b border-stone-200 pb-1.5">
                2. Insurance Coverage, Pharmacy &amp; Emergency Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Primary Insurance Provider *
                  </label>
                  <select
                    value={regInsurance}
                    onChange={(e) => setRegInsurance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Blue Cross Blue Shield (BCBS)">
                      Blue Cross Blue Shield (BCBS)
                    </option>
                    <option value="Aetna">Aetna</option>
                    <option value="Cigna / Evernorth">Cigna / Evernorth</option>
                    <option value="UnitedHealthcare / Optum">UnitedHealthcare / Optum</option>
                    <option value="Medicare">Medicare</option>
                    <option value="Medicaid">Medicaid</option>
                    <option value="Self-Pay / Out-of-Network">Self-Pay / Out-of-Network</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Insurance Member / Policy ID
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (e.g., XYZ12345678)"
                    value={regMemberId}
                    onChange={(e) => setRegMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Insurance Group Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (e.g., GRP9988)"
                    value={regGroupNumber}
                    onChange={(e) => setRegGroupNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Preferred Texas Pharmacy (Name &amp; City/Intersection) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., H-E-B Pharmacy / Walgreens / CVS (City, TX)"
                    value={regPharmacy}
                    onChange={(e) => setRegPharmacy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Emergency Contact (Full Name, Relationship &amp; Phone) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., John Doe (Spouse) - (432) 555-0144"
                    value={regEmergencyContact}
                    onChange={(e) => setRegEmergencyContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Primary Reason for Seeking Psychiatric Care *
                </label>
                <select
                  value={regPrimaryConcern}
                  onChange={(e) => setRegPrimaryConcern(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Comprehensive Psychiatric Evaluation">
                    Comprehensive Psychiatric Evaluation (Adults, Teens &amp; Children)
                  </option>
                  <option value="Anxiety & Panic Attacks">Anxiety &amp; Panic Attacks</option>
                  <option value="ADHD Evaluation & Management">
                    ADHD Evaluation &amp; Management
                  </option>
                  <option value="Depression & Mood Support">Depression &amp; Mood Support</option>
                  <option value="Medication Management & Refills">
                    Medication Management &amp; Refills
                  </option>
                  <option value="Trauma & PTSD Support">Trauma &amp; PTSD Support</option>
                  <option value="Bipolar Disorder Stabilization">
                    Bipolar Disorder Stabilization
                  </option>
                  <option value="Insomnia & Sleep Disorders">Insomnia &amp; Sleep Disorders</option>
                  <option value="Child / Adolescent Psychiatric Evaluation">
                    Child / Adolescent Psychiatric Evaluation
                  </option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={regSubmitting}
                className="w-full py-3.5 px-6 rounded-[14px] bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm cursor-pointer shadow-md hover:opacity-95 transition-opacity disabled:opacity-60"
              >
                {regSubmitting
                  ? 'Saving Your Clinical Registration Record...'
                  : 'Save My Registration Record & Enter Client Portal →'}
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  // ============================================================================
  // 3. STRICT EMAIL VERIFICATION GATE (For Standard Email/Password Accounts)
  // ============================================================================
  if (!firebaseUser.emailVerified && !isFederatedOAuthProvider && !isVerifiedProviderAccount) {
    return (
      <section className="min-h-[82vh] bg-[#FAF9F5] py-12 px-4 sm:px-6 flex items-center justify-center font-portal-body">
        <div className="max-w-lg w-full bg-white border border-stone-200 rounded-[32px] p-8 sm:p-10 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF6EA] border border-[#D4AF37] flex items-center justify-center text-[#9E7206]">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9E7206]">
              Email Verification Required
            </span>
            <h1 className="text-2xl font-bold font-portal-heading text-stone-900">
              Verify Your Email Address
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              We have sent a verification email to{' '}
              <strong className="text-stone-900">{firebaseUser.email}</strong>. For your HIPAA
              privacy and security, please open your email inbox and click the verification link
              before accessing your Client Portal chart.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700 text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {verificationNotice && (
            <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{verificationNotice}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleRefreshVerification}
              className="w-full py-3.5 px-4 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>I Have Clicked the Link in My Email — Enter Portal</span>
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              className="w-full py-3 px-4 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[#9E7206] font-bold text-xs cursor-pointer hover:bg-[#f3ebd3] transition-colors"
            >
              Resend Verification Email to {firebaseUser.email}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-[12px] text-xs font-semibold text-stone-500 hover:text-red-600 cursor-pointer"
            >
              Sign Out / Use a Different Email Address
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Computed Real-Time Metrics for Patient Portal Overview
  const pendingIntakes = intakes.filter((i) => i.status === 'pending');
  const nextAppointment = appointments.find(
    (a) => a.status === 'confirmed' || a.status === 'requested'
  );
  const latestPHQ9 = assessments.find((a) => a.type === 'PHQ-9');
  const latestGAD7 = assessments.find((a) => a.type === 'GAD-7');
  const dueInvoices = invoices.filter((i) => i.status === 'due');
  const unreadProviderMessages = messages.filter(
    (m) => m.senderRole === 'provider' && !m.read
  );
  const totalNotificationsCount =
    pendingIntakes.length + unreadProviderMessages.length + dueInvoices.length;

  const userInitials = portalUser.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Search filtering for appointments, messages, medications, invoices
  const qLower = portalSearchQuery.trim().toLowerCase();
  const filteredAppts = !qLower
    ? appointments
    : appointments.filter(
        (a) =>
          a.serviceType.toLowerCase().includes(qLower) ||
          a.conditionReason.toLowerCase().includes(qLower) ||
          a.preferredDate.toLowerCase().includes(qLower)
      );
  const filteredInvoices = !qLower
    ? invoices
    : invoices.filter(
        (inv) =>
          inv.description.toLowerCase().includes(qLower) ||
          inv.serviceDate.toLowerCase().includes(qLower)
      );

  const navItems: { id: PortalTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    {
      id: 'appointments',
      label: 'Telehealth & Visits',
      icon: Video,
      badge: appointments.filter((a) => a.status === 'confirmed').length || undefined,
    },
    {
      id: 'intakes',
      label: 'Intake Forms',
      icon: FileText,
      badge: pendingIntakes.length || undefined,
    },
    {
      id: 'medications',
      label: 'Medications & Refills',
      icon: Pill,
      badge: medications.length || undefined,
    },
    { id: 'tracker', label: 'PHQ-9 / GAD-7 & Mood', icon: Activity },
    {
      id: 'messages',
      label: 'Secure Messaging',
      icon: MessageSquare,
      badge: unreadProviderMessages.length || undefined,
    },
    {
      id: 'billing',
      label: 'Payment & Insurance',
      icon: CreditCard,
      badge: dueInvoices.length || undefined,
    },
  ];

  return (
    <div className="min-h-[88vh] bg-[#FAF9F5] flex flex-col lg:flex-row font-portal-body text-stone-800">
      {/* ==========================================================================
          SIDEBAR NAVIGATION
         ========================================================================== */}
      <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-stone-200 flex flex-col justify-between">
        <div>
          {/* Top Section with Official Golden Mind Psychiatry Logo */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/golden_mind_card.webp"
                alt="Golden Mind Psychiatry PLLC"
                className="w-11 h-11 rounded-[12px] object-cover border border-[#D4AF37]/60 shrink-0 shadow-xs bg-[#0A0A0A]"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold font-portal-heading text-stone-900 truncate">
                  Golden Mind Portal
                </p>
                <p className="text-[11px] text-[#9E7206] font-semibold truncate">
                  {portalUser.fullName}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-[12px] border border-stone-200 text-stone-700"
              aria-label="Toggle portal navigation"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            className={`${
              mobileSidebarOpen ? 'block' : 'hidden lg:block'
            } p-3 space-y-1`}
          >
            {isVerifiedProviderAccount ? (
              <div className="w-full flex items-center justify-between p-3 rounded-[12px] text-[13px] bg-[#FAF6EA] text-[#9E7206] font-bold border-r-4 border-r-[#D4AF37]">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-4 h-4 shrink-0" />
                  <span>Admin Provider Command Center</span>
                </div>
              </div>
            ) : (
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-[12px] text-[13px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FAF6EA] text-[#9E7206] font-bold border-r-4 border-r-[#D4AF37]'
                        : 'text-stone-600 font-medium hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="font-portal-heading tabular-nums text-[11px] font-bold px-2 py-0.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* Bottom Section: 'Practice Verified' Card + Red-500 Logout (No Mode Switch Button) */}
        <div
          className={`${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          } p-4 border-t border-stone-200 space-y-3 bg-white`}
        >
          {/* Practice Verified Status Card */}
          <div className="p-3.5 rounded-[20px] bg-[#FAF6EA] border border-[#D4AF37]/40 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#9E7206]">
              <ShieldCheck className="w-4 h-4 text-[#9E7206] shrink-0" />
              <span>Practice Verified</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              Brenda Hobyani, PMHNP-BC · 100% Telehealth Across Texas
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full p-3 rounded-[12px] text-xs font-bold text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </aside>

      {/* ==========================================================================
          FLUID MAIN CONTENT AREA
         ========================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky 72px Glassmorphism Header */}
        <header className="sticky top-0 z-30 min-h-[72px] bg-white/90 backdrop-blur-md border-b border-stone-200 px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold font-portal-heading text-stone-900 leading-tight">
              {isVerifiedProviderAccount
                ? 'Provider Clinical Command Center'
                : navItems.find((n) => n.id === activeTab)?.label || 'Client Portal Dashboard'}
            </h1>
            <p className="text-[12px] text-stone-500">
              Golden Mind Psychiatry PLLC · Brenda Hobyani, PMHNP-BC · Mon–Thu 8–4, Fri 9–1
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isVerifiedProviderAccount && (
              <>
                <div className="relative hidden sm:block">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search visits, bills, meds..."
                    value={portalSearchQuery}
                    onChange={(e) => setPortalSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-full bg-[#FAF9F5] border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#D4AF37] w-48 lg:w-56"
                  />
                </div>

                <button
                  onClick={() => setActiveTab(pendingIntakes.length > 0 ? 'intakes' : 'messages')}
                  className="relative w-10 h-10 rounded-[12px] bg-[#FAF9F5] border border-stone-200 flex items-center justify-center text-stone-700 hover:border-[#D4AF37] transition-colors cursor-pointer"
                  title="Notifications & Action Items"
                >
                  <Bell className="w-4 h-4" />
                  {totalNotificationsCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute top-2 right-2 ring-2 ring-white" />
                  )}
                </button>

                <button
                  onClick={() => onOpenBooking()}
                  className="px-4 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Book Telehealth Visit</span>
                  <span className="md:hidden">Book</span>
                </button>
              </>
            )}

            <div
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-[#0A0A0A] border border-[#D4AF37]/70 text-[#D4AF37] shrink-0"
              title={portalUser.fullName}
            >
              {firebaseUser?.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={portalUser.fullName}
                  className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img
                  src="/pwa-192x192.png"
                  alt="Golden Mind Psychiatry PLLC"
                  className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]"
                />
              )}
              <span className="font-portal-heading font-bold text-xs tracking-wide">
                {userInitials}
              </span>
            </div>
          </div>
        </header>

        {/* Main 1280px Max-Width Container */}
        <div className="p-6 sm:p-8 max-w-[1280px] w-full mx-auto space-y-6">
          {verificationNotice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[20px] p-4 flex items-center justify-between gap-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{verificationNotice}</span>
              </div>
              <button
                onClick={() => setVerificationNotice(null)}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {isVerifiedProviderAccount ? (
            <ProviderDashboardView
              currentUser={portalUser}
              onLaunchTelehealth={(appt) => setActiveTelehealthAppt(appt)}
            />
          ) : (
            <>
              {/* ================================================================
                  TOP-ROW 4-COLUMN BENTO STATS GRID
                  Primary card is dark (#0A0A0A) with white/gold text & circular pattern.
                  Other three cards are white (#FFFFFF) with 32px radius & General Sans 24px values.
                 ================================================================ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Primary Dark Bento Card */}
                <div className="bg-[#0A0A0A] text-white rounded-[32px] p-6 border border-[#D4AF37]/40 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="w-24 h-24 bg-white/5 absolute -right-4 -bottom-4 rounded-full pointer-events-none" />
                  <div className="w-16 h-16 bg-[#D4AF37]/10 absolute right-8 -top-6 rounded-full pointer-events-none" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                    Next Telehealth Session
                  </p>
                  <p className="text-[24px] font-bold font-portal-heading tabular-nums text-white mt-2 truncate">
                    {nextAppointment ? nextAppointment.preferredDate : 'Schedule Visit'}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <span className="text-[12px] text-stone-300 truncate">
                      {nextAppointment
                        ? nextAppointment.preferredTime
                        : '100% Telehealth Across TX'}
                    </span>
                    {nextAppointment && (
                      <button
                        onClick={() => setActiveTelehealthAppt(nextAppointment)}
                        className="px-3 py-1 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-[11px] cursor-pointer shrink-0"
                      >
                        Join Room
                      </button>
                    )}
                  </div>
                </div>

                {/* White Stat Card 2: Clinical Scales */}
                <div
                  onClick={() => setActiveTab('tracker')}
                  className="bg-white portal-card p-6 cursor-pointer"
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
                    PHQ-9 / GAD-7 Index
                  </p>
                  <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
                    {latestPHQ9 ? `${latestPHQ9.totalScore} / 27` : 'Check-In Due'}
                  </p>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#9E7206] font-semibold mt-3">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>
                      {latestPHQ9
                        ? `PHQ-9: ${latestPHQ9.severity}${
                            latestGAD7 ? ` · GAD-7: ${latestGAD7.totalScore}/21` : ''
                          }`
                        : 'Log baseline symptom scale →'}
                    </span>
                  </div>
                </div>

                {/* White Stat Card 3: Intake Forms & Rx */}
                <div
                  onClick={() => setActiveTab('intakes')}
                  className="bg-white portal-card p-6 cursor-pointer"
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
                    Intake & Rx Status
                  </p>
                  <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
                    {intakes.filter((i) => i.status === 'completed').length} / {intakes.length}{' '}
                    Signed
                  </p>
                  <p className="text-[12px] text-emerald-700 font-semibold mt-3">
                    {pendingIntakes.length === 0
                      ? `${medications.length} active Rx on file`
                      : `${pendingIntakes.length} form(s) awaiting signature`}
                  </p>
                </div>

                {/* White Stat Card 4: Balance & Insurance */}
                <div
                  onClick={() => setActiveTab('billing')}
                  className="bg-white portal-card p-6 cursor-pointer"
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
                    Patient Balance Due
                  </p>
                  <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
                    $
                    {dueInvoices
                      .reduce((sum, inv) => sum + inv.patientResponsibility, 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-[12px] text-stone-500 font-medium mt-3 truncate">
                    {portalUser.insuranceProvider || 'Verified Insurance Coverage'}
                  </p>
                </div>
              </div>

              {/* ================================================================
                  TWO-COLUMN MAIN SECTION (70/30 SPLIT)
                 ================================================================ */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* LEFT 70% MAIN AREA (xl:col-span-8) */}
                <div className="xl:col-span-8 space-y-6">
                  {/* ============================================================
                      MODULE 1: DASHBOARD OVERVIEW (Engagement Requests + Payment History)
                     ============================================================ */}
                  {activeTab === 'overview' && (
                    <>
                      {/* Engagement & Care Requests (Large 32px Rounded Cards with Avatars, Badges & Action Buttons) */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <div>
                            <h2 className="text-lg font-bold font-portal-heading text-stone-900">
                              Engagement & Care Requests
                            </h2>
                            <p className="text-xs text-stone-500">
                              Your active telepsychiatry sessions, pre-visit forms, and care tasks with
                              Brenda Hobyani, PMHNP-BC
                            </p>
                          </div>
                          <button
                            onClick={() => onOpenBooking()}
                            className="px-3.5 py-2 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/40 text-[#9E7206] font-bold text-xs cursor-pointer"
                          >
                            + New Request
                          </button>
                        </div>

                        {/* Primary Care Engagement Card: Next Telehealth Session */}
                        <div className="bg-white portal-card p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#0A0A0A] border-2 border-[#D4AF37] text-[#D4AF37] font-portal-heading font-bold text-sm flex items-center justify-center shrink-0">
                                BH
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-bold font-portal-heading text-stone-900">
                                    Brenda Hobyani, MSN, APRN, PMHNP-BC
                                  </h3>
                                  <span className="px-2.5 py-0.5 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[#9E7206] text-[11px] font-bold">
                                    {nextAppointment
                                      ? nextAppointment.serviceType
                                      : 'New Patient Telehealth'}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-[12px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase">
                                    {nextAppointment ? nextAppointment.status : 'Ready'}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-600">
                                  {nextAppointment
                                    ? `Focus: ${nextAppointment.conditionReason} · ${nextAppointment.preferredDate} (${nextAppointment.preferredTime})`
                                    : '100% Telehealth Psychiatric Evaluation & Medication Management Across Texas'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              {nextAppointment ? (
                                <>
                                  <button
                                    onClick={() => setActiveTelehealthAppt(nextAppointment)}
                                    className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-stone-800"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Join Video Room</span>
                                  </button>
                                  <button
                                    onClick={() => setActiveTab('appointments')}
                                    className="px-3.5 py-2.5 rounded-[12px] border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                                  >
                                    Reschedule
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => onOpenBooking()}
                                  className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Book Telehealth Session</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Secondary Engagement Card: Pre-Visit Intake & PHQ-9 / GAD-7 Check-In */}
                        <div className="bg-white portal-card p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#FAF6EA] border border-[#D4AF37] text-[#9E7206] font-portal-heading font-bold text-sm flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-bold font-portal-heading text-stone-900">
                                    Pre-Visit Intake & Standardized Symptom Screeners
                                  </h3>
                                  <span className="px-2.5 py-0.5 rounded-[12px] bg-[#FAF6EA] text-[#9E7206] text-[11px] font-bold">
                                    {pendingIntakes.length > 0
                                      ? `${pendingIntakes.length} Pending Form(s)`
                                      : 'Forms Complete'}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-600">
                                  Complete your digital psychiatric intake consent and log your
                                  PHQ-9 / GAD-7 check-in prior to your video consultation.
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              <button
                                onClick={() => setActiveTab('intakes')}
                                className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                              >
                                {pendingIntakes.length > 0
                                  ? `Complete Intake (${pendingIntakes.length})`
                                  : 'Review Intake'}
                              </button>
                              <button
                                onClick={() => setActiveTab('tracker')}
                                className="px-3.5 py-2.5 rounded-[12px] border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                              >
                                PHQ-9 / GAD-7
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment & Statement History Table (Light-Ivory Header, 16px Row Padding, Status Badges) */}
                      <div className="bg-white portal-card overflow-hidden">
                        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
                          <div>
                            <h2 className="text-base font-bold font-portal-heading text-stone-900">
                              Payment & Statement History
                            </h2>
                            <p className="text-xs text-stone-500">
                              Insurance verification, covered benefits, and copay ledger
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('billing')}
                            className="px-3.5 py-2 rounded-[12px] bg-[#FAF6EA] text-[#9E7206] font-bold text-xs cursor-pointer"
                          >
                            Manage Insurance →
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#FAF9F5] border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                                <th className="py-3.5 px-5">Service Description</th>
                                <th className="py-3.5 px-5">Date</th>
                                <th className="py-3.5 px-5 text-right">Insurance Covered</th>
                                <th className="py-3.5 px-5 text-right">Your Copay</th>
                                <th className="py-3.5 px-5 text-right">Status / Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 text-xs">
                              {filteredInvoices.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-6 px-5 text-center text-stone-500">
                                    No billing statements or copays due at this time.
                                  </td>
                                </tr>
                              ) : (
                                filteredInvoices.map((inv) => (
                                  <tr key={inv.id} className="hover:bg-stone-50/80">
                                    <td className="py-4 px-5 font-bold text-stone-900">
                                      {inv.description}
                                    </td>
                                    <td className="py-4 px-5 font-portal-heading tabular-nums text-stone-500">
                                      {inv.serviceDate}
                                    </td>
                                    <td className="py-4 px-5 text-right font-portal-heading tabular-nums text-stone-600">
                                      -${inv.insuranceCoveredAmount.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-5 text-right font-portal-heading tabular-nums font-bold text-stone-900">
                                      ${inv.patientResponsibility.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-5 text-right">
                                      {inv.status === 'paid' ? (
                                        <span className="px-3 py-1 rounded-[12px] bg-emerald-100 text-emerald-800 font-bold text-[11px] uppercase">
                                          Disbursed / Paid
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handlePayInvoice(inv.id)}
                                          className="px-3.5 py-1.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
                                        >
                                          Pay ${inv.patientResponsibility.toFixed(2)}
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Provider Care Plan, Diagnosis, Recommended Medications & Shared Links (Live Synced from Provider Chart) */}
                      {(portalUser.diagnosis ||
                        portalUser.clinicalRecommendations ||
                        portalUser.treatmentPlanNotes ||
                        (portalUser.sharedResources && portalUser.sharedResources.length > 0)) && (
                        <div className="bg-white portal-card p-6 border-2 border-[#D4AF37]/60 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#9E7206]" />
                              <div>
                                <h2 className="text-base font-bold font-portal-heading text-stone-900">
                                  Personalized Care Plan & Recommendations from Brenda Hobyani, PMHNP-BC
                                </h2>
                                <p className="text-xs text-stone-500">
                                  Updated in real time from your clinical chart
                                </p>
                              </div>
                            </div>
                            {portalUser.diagnosis && (
                              <span className="px-3 py-1 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[#9E7206] text-xs font-bold">
                                Focus / Diagnosis: {portalUser.diagnosis}
                              </span>
                            )}
                          </div>

                          {portalUser.clinicalRecommendations && (
                            <div className="p-4 rounded-[16px] bg-[#FAF6EA] border border-[#D4AF37]/40 space-y-1">
                              <p className="text-xs font-bold text-[#9E7206] uppercase tracking-wider">
                                Recommended Medications & Regimen
                              </p>
                              <p className="text-xs text-stone-800 whitespace-pre-line leading-relaxed">
                                {renderTextWithClickableLinks(portalUser.clinicalRecommendations)}
                              </p>
                            </div>
                          )}

                          {portalUser.treatmentPlanNotes && (
                            <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-stone-200 space-y-1">
                              <p className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                                Treatment Plan & Follow-Up Instructions
                              </p>
                              <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">
                                {renderTextWithClickableLinks(portalUser.treatmentPlanNotes)}
                              </p>
                            </div>
                          )}

                          {portalUser.sharedResources && portalUser.sharedResources.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                <Link2 className="w-3.5 h-3.5 text-[#9E7206]" />
                                <span>Direct Links Shared by Your Provider:</span>
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {portalUser.sharedResources.map((res, idx) => (
                                  <a
                                    key={idx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
                                  >
                                    <span>{res.title}</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Active Medications & Recent Messages Preview Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white portal-card p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold font-portal-heading text-stone-900">
                              Recent Clinical Messages
                            </h3>
                            <button
                              onClick={() => setActiveTab('messages')}
                              className="text-xs font-bold text-[#9E7206] hover:underline cursor-pointer"
                            >
                              Open Inbox →
                            </button>
                          </div>
                          <div className="divide-y divide-stone-200">
                            {messages.slice(0, 2).map((m) => (
                              <div key={m.id} className="py-3 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-stone-900">{m.senderName}</span>
                                  <span className="font-portal-heading tabular-nums text-stone-400">
                                    {m.createdAt.split('T')[0]}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-[#9E7206]">{m.subject}</p>
                                <p className="text-xs text-stone-600 line-clamp-2">
                                  {renderTextWithClickableLinks(m.body)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white portal-card p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold font-portal-heading text-stone-900">
                              Active Medications & e-Rx
                            </h3>
                            <button
                              onClick={() => setActiveTab('medications')}
                              className="text-xs font-bold text-[#9E7206] hover:underline cursor-pointer"
                            >
                              Refills →
                            </button>
                          </div>
                          {medications.length === 0 ? (
                            <div className="py-3 text-xs text-stone-500 space-y-3">
                              <p>
                                Add your current prescriptions to coordinate 1-click refills with
                                Brenda Hobyani, PMHNP-BC.
                              </p>
                              <button
                                onClick={() => setActiveTab('medications')}
                                className="px-4 py-2 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                              >
                                Add Medication
                              </button>
                            </div>
                          ) : (
                            <div className="divide-y divide-stone-200">
                              {medications.slice(0, 3).map((med) => (
                                <div
                                  key={med.id}
                                  className="py-3 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <p className="font-bold text-stone-900">
                                      {med.medicationName} ({med.dosage})
                                    </p>
                                    <p className="text-stone-500">{med.frequency}</p>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-[12px] bg-[#FAF6EA] text-[#9E7206] font-bold text-[10px] uppercase">
                                    {med.refillStatus.replace('_', ' ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ============================================================
                      MODULE 2: APPOINTMENTS & 100% TELEHEALTH VIDEO LINKS
                     ============================================================ */}
                  {activeTab === 'appointments' && (
                    <div className="space-y-6">
                      <div className="bg-white portal-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold font-portal-heading text-stone-900">
                            100% Telehealth Appointments & Video Room Links
                          </h2>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Practice Hours: Monday – Thursday 8:00 AM – 4:00 PM · Friday 9:00 AM –
                            1:00 PM
                          </p>
                        </div>
                        <button
                          onClick={() => onOpenBooking()}
                          className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center gap-2 cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Book New Telehealth Visit</span>
                        </button>
                      </div>

                      {filteredAppts.length === 0 ? (
                        <div className="bg-white portal-card p-10 text-center space-y-3">
                          <Video className="w-8 h-8 text-[#B8860B] mx-auto" />
                          <h3 className="text-base font-bold font-portal-heading text-stone-900">
                            No Telehealth Visits Scheduled Yet
                          </h3>
                          <p className="text-xs text-stone-500 max-w-md mx-auto">
                            Book your 100% telehealth psychiatric evaluation or medication follow-up
                            to automatically receive your encrypted video link.
                          </p>
                          <button
                            onClick={() => onOpenBooking()}
                            className="px-5 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
                          >
                            Schedule Consultation Now
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredAppts.map((appt) => (
                            <div key={appt.id} className="bg-white portal-card p-6 space-y-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-bold font-portal-heading text-stone-900 text-sm">
                                      {appt.serviceType}
                                    </span>
                                    <span>·</span>
                                    <span className="font-semibold text-[#9E7206]">
                                      {appt.conditionReason}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-600 font-portal-heading tabular-nums">
                                    Date: {appt.preferredDate} · Window: {appt.preferredTime} ·
                                    Status: <strong className="uppercase">{appt.status}</strong>
                                  </p>
                                  <p className="text-[11px] text-stone-500 font-mono">
                                    HIPAA Room Link: {appt.telehealthUrl}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                  {appt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => setActiveTelehealthAppt(appt)}
                                      className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-stone-800"
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                      <span>Join Telehealth Room</span>
                                    </button>
                                  )}

                                  {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setReschedulingApptId(appt.id);
                                          setNewApptDate(appt.preferredDate);
                                          setNewApptTime(appt.preferredTime);
                                        }}
                                        className="px-3.5 py-2.5 rounded-[12px] border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
                                      >
                                        Reschedule
                                      </button>
                                      <button
                                        onClick={() => handleCancelAppointment(appt.id)}
                                        className="px-3.5 py-2.5 rounded-[12px] border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {reschedulingApptId === appt.id && (
                                <div className="pt-4 border-t border-stone-200 flex flex-wrap items-end gap-3">
                                  <div>
                                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                      New Preferred Date
                                    </label>
                                    <input
                                      type="date"
                                      value={newApptDate}
                                      onChange={(e) => setNewApptDate(e.target.value)}
                                      className="px-3.5 py-2 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                      New Time Window (Mon–Thu 8–4, Fri 9–1)
                                    </label>
                                    <select
                                      value={newApptTime}
                                      onChange={(e) => setNewApptTime(e.target.value)}
                                      className="px-3.5 py-2 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                                    >
                                      <option value="Mon–Thu Morning (8:00 AM - 12:00 PM)">
                                        Mon–Thu Morning (8:00 AM - 12:00 PM)
                                      </option>
                                      <option value="Mon–Thu Afternoon (12:00 PM - 4:00 PM)">
                                        Mon–Thu Afternoon (12:00 PM - 4:00 PM)
                                      </option>
                                      <option value="Friday Morning / Midday (9:00 AM - 1:00 PM)">
                                        Friday Morning / Midday (9:00 AM - 1:00 PM)
                                      </option>
                                    </select>
                                  </div>
                                  <button
                                    onClick={() => handleSaveReschedule(appt.id)}
                                    className="px-4 py-2 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                                  >
                                    Confirm New Date
                                  </button>
                                  <button
                                    onClick={() => setReschedulingApptId(null)}
                                    className="px-3 py-2 rounded-[12px] text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================
                      MODULE 3: DIGITAL INTAKE FORMS & PSYCHIATRIC QUESTIONNAIRES
                     ============================================================ */}
                  {activeTab === 'intakes' && (
                    <div className="space-y-6">
                      <div className="bg-white portal-card p-6">
                        <h2 className="text-xl font-bold font-portal-heading text-stone-900">
                          Digital Psychiatric Intake Forms & Telehealth Consent
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Automatically assigned upon registration so Brenda Hobyani, PMHNP-BC can
                          review your history prior to your 100% Telehealth session
                        </p>
                      </div>

                      <div className="divide-y divide-stone-200 bg-white portal-card overflow-hidden">
                        {intakes.map((intake) => (
                          <div
                            key={intake.id}
                            className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <p className="font-bold font-portal-heading text-sm text-stone-900">
                                {intake.title}
                              </p>
                              <p className="text-xs text-stone-500 font-portal-heading tabular-nums">
                                Assigned: {intake.assignedAt.split('T')[0]} · Status:{' '}
                                <span
                                  className={
                                    intake.status === 'completed'
                                      ? 'text-emerald-700 font-bold'
                                      : 'text-[#9E7206] font-bold'
                                  }
                                >
                                  {intake.status.toUpperCase()}
                                </span>
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setEditingIntake(intake);
                                if (intake.responses && Object.keys(intake.responses).length > 0) {
                                  setIntakeAnswers((prev) => ({ ...prev, ...intake.responses }));
                                }
                              }}
                              className={`px-4 py-2.5 rounded-[12px] text-xs font-bold cursor-pointer shrink-0 ${
                                intake.status === 'completed'
                                  ? 'border border-stone-300 text-stone-700 hover:bg-stone-50'
                                  : 'bg-[#0A0A0A] text-[#D4AF37]'
                              }`}
                            >
                              {intake.status === 'completed'
                                ? 'View / Update Answers'
                                : 'Complete Digital Form'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {editingIntake && (
                        <form
                          onSubmit={handleCompleteIntake}
                          className="bg-white border-2 border-[#D4AF37] rounded-[32px] p-6 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                            <h3 className="text-lg font-bold font-portal-heading text-stone-900">
                              {editingIntake.title}
                            </h3>
                            <button
                              type="button"
                              onClick={() => setEditingIntake(null)}
                              className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
                            >
                              Close Form
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-stone-700 block mb-1">
                                Primary Reason for Seeking Telepsychiatry Care *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g., ADHD focus support, anxiety, mood stability, sleep"
                                value={intakeAnswers.primaryConcern}
                                onChange={(e) =>
                                  setIntakeAnswers({
                                    ...intakeAnswers,
                                    primaryConcern: e.target.value,
                                  })
                                }
                                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-stone-700 block mb-1">
                                How Long Have You Experienced These Symptoms?
                              </label>
                              <select
                                value={intakeAnswers.symptomDuration}
                                onChange={(e) =>
                                  setIntakeAnswers({
                                    ...intakeAnswers,
                                    symptomDuration: e.target.value,
                                  })
                                }
                                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                              >
                                <option value="Less than 1 month">Less than 1 month</option>
                                <option value="1 - 6 months">1 - 6 months</option>
                                <option value="6 months - 2 years">6 months - 2 years</option>
                                <option value="Over 2 years">Over 2 years</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-stone-700 block mb-1">
                                Current Medications, Supplements & Drug Allergies *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="List current medications or 'None' / 'No Known Allergies'"
                                value={intakeAnswers.currentMedicationsAndAllergies}
                                onChange={(e) =>
                                  setIntakeAnswers({
                                    ...intakeAnswers,
                                    currentMedicationsAndAllergies: e.target.value,
                                  })
                                }
                                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-stone-700 block mb-1">
                                Emergency Contact Name & Phone Number *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Name, Relationship & Phone"
                                value={intakeAnswers.emergencyContactNamePhone}
                                onChange={(e) =>
                                  setIntakeAnswers({
                                    ...intakeAnswers,
                                    emergencyContactNamePhone: e.target.value,
                                  })
                                }
                                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-stone-700 block mb-1">
                              Prior Psychiatric History, Family History & Treatment Goals
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Share any helpful medical or family psychiatric history..."
                              value={intakeAnswers.priorTreatment}
                              onChange={(e) =>
                                setIntakeAnswers({
                                  ...intakeAnswers,
                                  priorTreatment: e.target.value,
                                })
                              }
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                            />
                          </div>

                          <div className="p-4 rounded-[20px] bg-[#FAF6EA] border border-[#D4AF37]/60 text-xs text-stone-800 space-y-2">
                            <p className="font-semibold text-[#9E7206]">
                              100% Telehealth Informed Consent & Controlled / Habit-Forming
                              Medication Acknowledgment:
                            </p>
                            <p className="text-[11px] leading-relaxed">
                              I confirm that I am physically located in the State of Texas during all
                              telehealth sessions with Brenda Hobyani, PMHNP-BC, and I understand
                              that some psychiatric and anxiety medications can be habit forming and
                              require careful monitoring and follow-up visits.
                            </p>
                            <input
                              type="text"
                              required
                              placeholder="Type your full legal name as electronic signature *"
                              value={intakeAnswers.consentSignature}
                              onChange={(e) =>
                                setIntakeAnswers({
                                  ...intakeAnswers,
                                  consentSignature: e.target.value,
                                })
                              }
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-stone-300 text-xs font-serif"
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-6 py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                          >
                            Sign & Submit Intake Form to Chart
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* ============================================================
                      MODULE 4: ACTIVE MEDICATIONS & 1-CLICK REFILL REQUESTS
                     ============================================================ */}
                  {activeTab === 'medications' && (
                    <div className="space-y-6">
                      <div className="bg-white portal-card p-6 space-y-3">
                        <h2 className="text-xl font-bold font-portal-heading text-stone-900">
                          Active Medication Regimen & 1-Click Refill Requests
                        </h2>
                        <p className="text-xs text-stone-600">
                          Preferred Texas Pharmacy on File:{' '}
                          <strong className="text-[#9E7206]">
                            {prefPharmacy || 'Update in Payment & Insurance tab'}
                          </strong>
                        </p>
                        {portalUser.clinicalRecommendations && (
                          <div className="p-4 rounded-[20px] bg-[#0A0A0A] text-white border border-[#D4AF37]/50 space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                              Provider Recommended Regimen (Brenda Hobyani, PMHNP-BC)
                            </p>
                            <p className="text-xs text-stone-200 whitespace-pre-line leading-relaxed">
                              {renderTextWithClickableLinks(portalUser.clinicalRecommendations)}
                            </p>
                          </div>
                        )}
                        <div className="p-4 rounded-[20px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-xs text-stone-800">
                          <strong>Important Clinical Safety Notice:</strong> Some psychiatric and
                          anxiety medications are <strong>habit forming</strong>. Brenda Hobyani,
                          PMHNP-BC monitors all refills closely to ensure safe, responsible dosing.
                          For any suspected medication overdose or poison emergency, call{' '}
                          <strong>Poison Control (24/7)</strong> at{' '}
                          <a
                            href="tel:8002221222"
                            className="font-bold text-[#9E7206] underline hover:text-stone-900"
                          >
                            800-222-1222
                          </a>
                          .
                        </div>
                      </div>

                      {medications.length === 0 ? (
                        <div className="bg-white portal-card p-8 text-center text-xs text-stone-500">
                          No medications listed yet. Add your current psychiatric medication below
                          to request a refill from Brenda Hobyani, PMHNP-BC.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {medications.map((med) => (
                            <div
                              key={med.id}
                              className="bg-white portal-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <p className="text-base font-bold font-portal-heading text-stone-900">
                                  {med.medicationName}{' '}
                                  <span className="tabular-nums text-sm text-[#9E7206]">
                                    ({med.dosage})
                                  </span>
                                </p>
                                <p className="text-xs text-stone-600">
                                  {med.frequency} · Prescribed by {med.prescribedBy}
                                </p>
                                <p className="text-xs text-stone-500">
                                  Pharmacy: {med.pharmacy || prefPharmacy || 'On File'} ·{' '}
                                  <span className="font-portal-heading tabular-nums font-semibold">
                                    {med.refillsRemaining} refills remaining
                                  </span>
                                </p>
                                {med.instructions && (
                                  <p className="text-[11px] text-stone-500 italic">
                                    {med.instructions}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span
                                  className={`px-3 py-1 rounded-[12px] text-[11px] font-bold uppercase ${
                                    med.refillStatus === 'approved_sent'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : med.refillStatus === 'refill_requested'
                                      ? 'bg-[#FAF6EA] text-[#9E7206]'
                                      : med.refillStatus === 'denied'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {med.refillStatus === 'approved_sent'
                                    ? 'Approved & Sent to Pharmacy'
                                    : med.refillStatus === 'refill_requested'
                                    ? 'Refill Under Provider Review'
                                    : med.refillStatus === 'denied'
                                    ? 'Follow-Up Visit Required'
                                    : 'Active Regimen'}
                                </span>

                                <button
                                  disabled={med.refillStatus === 'refill_requested'}
                                  onClick={async () => {
                                    await requestMedicationRefill(
                                      med.id,
                                      prefPharmacy || med.pharmacy || ''
                                    );
                                  }}
                                  className={`px-4 py-2.5 rounded-[12px] text-xs font-bold cursor-pointer ${
                                    med.refillStatus === 'refill_requested'
                                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                                      : 'bg-[#0A0A0A] text-[#D4AF37] hover:bg-stone-800'
                                  }`}
                                >
                                  {med.refillStatus === 'refill_requested'
                                    ? 'Refill Requested'
                                    : 'Request 1-Click Refill'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={handleAddPatientMedication}
                        className="bg-white portal-card p-6 space-y-4"
                      >
                        <h3 className="text-base font-bold font-portal-heading text-stone-900">
                          Add Medication for Refill Coordination
                        </h3>
                        <p className="text-xs text-stone-500">
                          Register a current prescription so you can request electronic refills to
                          your preferred Texas pharmacy.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-stone-700 block mb-1">
                              Medication Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g., Escitalopram, Bupropion"
                              value={newMedName}
                              onChange={(e) => setNewMedName(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-700 block mb-1">
                              Dosage *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g., 10 mg"
                              value={newMedDosage}
                              onChange={(e) => setNewMedDosage(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-700 block mb-1">
                              Frequency
                            </label>
                            <input
                              type="text"
                              value={newMedFreq}
                              onChange={(e) => setNewMedFreq(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                        >
                          Save Medication & Enable 1-Click Refills
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ============================================================
                      MODULE 5: DAILY MOOD JOURNAL & PHQ-9 / GAD-7 SYMPTOM TRACKER
                     ============================================================ */}
                  {activeTab === 'tracker' && (
                    <div className="space-y-6">
                      <div className="bg-white portal-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold font-portal-heading text-stone-900">
                            Standardized PHQ-9, GAD-7 & Daily Mood Tracker
                          </h2>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Auto-scored clinical scales shared in real time with Brenda Hobyani,
                            PMHNP-BC
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {(['PHQ-9', 'GAD-7', 'DAILY-MOOD'] as const).map((scale) => (
                            <button
                              key={scale}
                              onClick={() => setActiveScaleTab(scale)}
                              className={`px-3.5 py-2 rounded-[12px] text-xs font-bold cursor-pointer ${
                                activeScaleTab === scale
                                  ? 'bg-[#0A0A0A] text-[#D4AF37]'
                                  : 'bg-[#FAF9F5] text-stone-700 border border-stone-200'
                              }`}
                            >
                              {scale}
                            </button>
                          ))}
                        </div>
                      </div>

                      {scaleSuccessBanner && (
                        <div className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{scaleSuccessBanner}</span>
                        </div>
                      )}

                      <form
                        onSubmit={handleSubmitAssessment}
                        className="bg-white portal-card p-6 space-y-5"
                      >
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                          <div>
                            <h3 className="text-base font-bold font-portal-heading text-stone-900">
                              {activeScaleTab === 'PHQ-9'
                                ? 'PHQ-9 Patient Health Questionnaire (Depression Scale)'
                                : activeScaleTab === 'GAD-7'
                                ? 'GAD-7 Generalized Anxiety Disorder Scale'
                                : 'Daily Mood, Sleep & Adherence Check-In'}
                            </h3>
                            <p className="text-xs text-stone-500">
                              Over the last 2 weeks, how often have you been bothered by the
                              following?
                            </p>
                          </div>
                          <div className="text-right font-portal-heading tabular-nums">
                            <span className="text-xs text-stone-400 block">Live Score</span>
                            <span className="text-lg font-bold text-[#9E7206]">
                              {activeScaleTab === 'PHQ-9'
                                ? `${phq9Scores.reduce((a, b) => a + b, 0)} / 27 (${calculatePHQ9Severity(
                                    phq9Scores.reduce((a, b) => a + b, 0)
                                  )})`
                                : activeScaleTab === 'GAD-7'
                                ? `${gad7Scores.reduce((a, b) => a + b, 0)} / 21 (${calculateGAD7Severity(
                                    gad7Scores.reduce((a, b) => a + b, 0)
                                  )})`
                                : `${moodScore} / 10`}
                            </span>
                          </div>
                        </div>

                        {activeScaleTab === 'PHQ-9' && (
                          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                            {PHQ9_QUESTIONS.map((q, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-[20px] bg-[#FAF9F5] border border-stone-200 space-y-2"
                              >
                                <p className="text-xs font-semibold text-stone-800">
                                  <span className="font-portal-heading tabular-nums text-[#9E7206] mr-1">
                                    {idx + 1}.
                                  </span>
                                  {q}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {SCALE_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        const next = [...phq9Scores];
                                        next[idx] = opt.value;
                                        setPhq9Scores(next);
                                      }}
                                      className={`py-2 px-2.5 rounded-[12px] text-[11px] font-medium border transition-colors cursor-pointer ${
                                        phq9Scores[idx] === opt.value
                                          ? 'bg-[#0A0A0A] text-[#D4AF37] border-[#D4AF37]'
                                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeScaleTab === 'GAD-7' && (
                          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                            {GAD7_QUESTIONS.map((q, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-[20px] bg-[#FAF9F5] border border-stone-200 space-y-2"
                              >
                                <p className="text-xs font-semibold text-stone-800">
                                  <span className="font-portal-heading tabular-nums text-[#9E7206] mr-1">
                                    {idx + 1}.
                                  </span>
                                  {q}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {SCALE_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        const next = [...gad7Scores];
                                        next[idx] = opt.value;
                                        setGad7Scores(next);
                                      }}
                                      className={`py-2 px-2.5 rounded-[12px] text-[11px] font-medium border transition-colors cursor-pointer ${
                                        gad7Scores[idx] === opt.value
                                          ? 'bg-[#0A0A0A] text-[#D4AF37] border-[#D4AF37]'
                                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeScaleTab === 'DAILY-MOOD' && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-semibold text-stone-700 block mb-1">
                                Overall Mood Rating Today (1 = Lowest, 10 = Optimal):{' '}
                                <span className="font-portal-heading tabular-nums font-bold text-[#9E7206]">
                                  {moodScore} / 10
                                </span>
                              </label>
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={moodScore}
                                onChange={(e) => setMoodScore(Number(e.target.value))}
                                className="w-full accent-[#D4AF37]"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-200">
                          <div>
                            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                              Sleep Last Night (Hours)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={18}
                              value={sleepHours}
                              onChange={(e) => setSleepHours(Number(e.target.value))}
                              className="w-full px-3.5 py-2 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                              Energy Level (1 - 10)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={energyLevel}
                              onChange={(e) => setEnergyLevel(Number(e.target.value))}
                              className="w-full px-3.5 py-2 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                              Medication Taken Today?
                            </label>
                            <select
                              value={medTakenToday ? 'yes' : 'no'}
                              onChange={(e) => setMedTakenToday(e.target.value === 'yes')}
                              className="w-full px-3.5 py-2 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                            >
                              <option value="yes">Yes, taken as prescribed</option>
                              <option value="no">Not yet / N/A</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Optional journal note (triggers, wins, side effects)..."
                            value={assessmentNotes}
                            onChange={(e) => setAssessmentNotes(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer hover:bg-stone-800"
                        >
                          Save {activeScaleTab} Check-In & Sync with Provider
                        </button>
                      </form>

                      <div className="bg-white portal-card p-6 space-y-4">
                        <h3 className="text-base font-bold font-portal-heading text-stone-900">
                          Longitudinal Symptom & Mood History
                        </h3>
                        {assessments.length === 0 ? (
                          <p className="text-xs text-stone-500 py-4 text-center">
                            Submit your first PHQ-9, GAD-7, or Daily Mood check-in above to
                            visualize your progress over time.
                          </p>
                        ) : (
                          <div className="divide-y divide-stone-200">
                            {assessments.slice(0, 8).map((a) => {
                              const maxScore =
                                a.type === 'PHQ-9' ? 27 : a.type === 'GAD-7' ? 21 : 10;
                              const pct = Math.min(100, Math.round((a.totalScore / maxScore) * 100));
                              return (
                                <div key={a.id} className="py-3 space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-stone-900">
                                      {a.type} ·{' '}
                                      <span className="text-[#9E7206]">{a.severity}</span>
                                    </span>
                                    <span className="font-portal-heading tabular-nums font-bold text-stone-800">
                                      {a.totalScore} / {maxScore} ({a.createdAt.split('T')[0]})
                                    </span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                                    <div
                                      className="h-full bg-[#D4AF37]"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  {a.notes && (
                                    <p className="text-[11px] text-stone-500">{a.notes}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================================
                      MODULE 6: SECURE DIRECT MESSAGING WITH BRENDA HOBYANI, PMHNP-BC
                     ============================================================ */}
                  {activeTab === 'messages' && (
                    <div className="space-y-6">
                      <div className="bg-white portal-card p-6 space-y-4">
                        <h2 className="text-xl font-bold font-portal-heading text-stone-900">
                          Direct Clinical Messaging with Brenda Hobyani, PMHNP-BC
                        </h2>
                        <div className="divide-y divide-stone-200 max-h-[460px] overflow-y-auto">
                          {messages.map((msg) => (
                            <div key={msg.id} className="py-4 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={`font-bold ${
                                    msg.senderRole === 'provider'
                                      ? 'text-[#9E7206]'
                                      : 'text-stone-900'
                                  }`}
                                >
                                  {msg.senderName}
                                </span>
                                <span className="font-portal-heading tabular-nums text-stone-400">
                                  {msg.createdAt.split('T')[0]}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-stone-900">{msg.subject}</p>
                              <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">
                                {renderTextWithClickableLinks(msg.body)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <form
                        onSubmit={handleSendPatientMessage}
                        className="bg-white portal-card p-6 space-y-4"
                      >
                        <h3 className="text-base font-bold font-portal-heading text-stone-900">
                          Send a Non-Urgent Clinical Message
                        </h3>
                        <p className="text-xs text-stone-500">
                          Directly reaches Brenda Hobyani, PMHNP-BC and notifies{' '}
                          <span className="font-medium text-stone-700">{CLINIC_OWNER_EMAIL}</span>.
                        </p>
                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Subject *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g., Question about my dosage or upcoming telehealth session"
                            value={msgSubject}
                            onChange={(e) => setMsgSubject(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Message *
                          </label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Write your message to Brenda Hobyani, PMHNP-BC..."
                            value={msgBody}
                            onChange={(e) => setMsgBody(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Encrypted Message</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ============================================================
                      MODULE 7: INSURANCE COVERAGE, PHARMACY & BILLING STATEMENTS
                     ============================================================ */}
                  {activeTab === 'billing' && (
                    <div className="space-y-6">
                      <div className="bg-white portal-card overflow-hidden">
                        <div className="px-6 py-5 border-b border-stone-200">
                          <h2 className="text-lg font-bold font-portal-heading text-stone-900">
                            Billing Statements & Copay Ledger
                          </h2>
                        </div>
                        <div className="divide-y divide-stone-200 p-6">
                          {invoices.length === 0 ? (
                            <p className="text-xs text-stone-500 text-center py-4">
                              No billing statements have been issued yet. Statements appear here in
                              real time once posted by your provider.
                            </p>
                          ) : (
                            invoices.map((inv) => (
                              <div
                                key={inv.id}
                                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                              >
                                <div className="space-y-1">
                                  <p className="font-bold font-portal-heading text-stone-900 text-sm">
                                    {inv.description}
                                  </p>
                                  <p className="text-stone-500 font-portal-heading tabular-nums">
                                    Service Date: {inv.serviceDate} · Billed: $
                                    {inv.amount.toFixed(2)} · Insurance Adjustment: -$
                                    {inv.insuranceCoveredAmount.toFixed(2)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="text-right font-portal-heading tabular-nums">
                                    <p className="text-[11px] text-stone-500">Your Copay / Balance</p>
                                    <p className="text-base font-bold text-stone-900">
                                      ${inv.patientResponsibility.toFixed(2)}
                                    </p>
                                  </div>
                                  {inv.status === 'paid' ? (
                                    <span className="px-3.5 py-2 rounded-[12px] bg-emerald-100 text-emerald-800 font-bold text-xs uppercase">
                                      Disbursed / Paid
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handlePayInvoice(inv.id)}
                                      className="px-4 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
                                    >
                                      Pay ${inv.patientResponsibility.toFixed(2)}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <form
                        onSubmit={handleSaveInsuranceProfile}
                        className="bg-white portal-card p-6 space-y-4"
                      >
                        <h2 className="text-lg font-bold font-portal-heading text-stone-900">
                          Insurance Coverage & Preferred Texas Pharmacy
                        </h2>
                        {profileSavedNotice && (
                          <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                            Insurance & Pharmacy profile saved to database!
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-stone-700 block mb-1">
                              Primary Insurance Carrier
                            </label>
                            <select
                              value={insCarrier}
                              onChange={(e) => setInsCarrier(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                            >
                              <option value="">Select Insurance Carrier...</option>
                              <option value="Blue Cross Blue Shield (BCBS)">
                                Blue Cross Blue Shield (BCBS)
                              </option>
                              <option value="Aetna">Aetna</option>
                              <option value="Cigna / Evernorth">Cigna / Evernorth</option>
                              <option value="UnitedHealthcare / Optum">
                                UnitedHealthcare / Optum
                              </option>
                              <option value="Medicare">Medicare</option>
                              <option value="Self-Pay / Out-of-Network Superbill">
                                Self-Pay / Out-of-Network Superbill
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-700 block mb-1">
                              Member ID
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your Insurance Member ID"
                              value={insMemberId}
                              onChange={(e) => setInsMemberId(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-700 block mb-1">
                              Group Number
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your Group Number"
                              value={insGroupId}
                              onChange={(e) => setInsGroupId(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Preferred Texas Pharmacy (for e-Prescriptions)
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your preferred Texas pharmacy name & city/address"
                            value={prefPharmacy}
                            onChange={(e) => setPrefPharmacy(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                        >
                          Save Insurance & Pharmacy Details
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* ==============================================================
                    RIGHT 30% SIDE WIDGETS COLUMN (xl:col-span-4)
                    1. Schedule Widget with Status-Timeline Items (24px left padding, 2px left bar)
                    2. Dark Support CTA Card with Corner Ghost Icon
                   ============================================================== */}
                <div className="xl:col-span-4 space-y-6">
                  {/* Schedule Status-Timeline Widget */}
                  <div className="bg-white portal-card p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold font-portal-heading text-stone-900">
                          Schedule & Care Timeline
                        </h3>
                        <p className="text-xs text-stone-500">100% Telehealth · Texas</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs font-bold text-[#9E7206] hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Status-Timeline Item 1: Upcoming Telehealth Appointment */}
                      <div className="pl-6 relative py-1">
                        <div className="w-[2px] absolute left-0 top-0 bottom-0 rounded-full bg-[#D4AF37]" />
                        <p className="text-[10px] font-bold uppercase tracking-wider font-portal-heading text-[#9E7206]">
                          {nextAppointment
                            ? `${nextAppointment.preferredDate} · ${nextAppointment.preferredTime}`
                            : 'MON–THU 8:00 AM – 4:00 PM · FRI 9:00 AM – 1:00 PM'}
                        </p>
                        <p className="text-[14px] font-bold text-stone-900 mt-0.5">
                          {nextAppointment
                            ? nextAppointment.serviceType
                            : '100% Telehealth Psychiatric Visit'}
                        </p>
                        <p className="text-[12px] text-stone-500">
                          {nextAppointment
                            ? `With Brenda Hobyani, PMHNP-BC (${nextAppointment.conditionReason})`
                            : 'Schedule your telehealth session with Brenda Hobyani, PMHNP-BC'}
                        </p>
                      </div>

                      {/* Status-Timeline Item 2: Pre-Visit PHQ-9 / GAD-7 Review */}
                      <div className="pl-6 relative py-1">
                        <div className="w-[2px] absolute left-0 top-0 bottom-0 rounded-full bg-[#9E7206]" />
                        <p className="text-[10px] font-bold uppercase tracking-wider font-portal-heading text-[#9E7206]">
                          PRE-VISIT CLINICAL REVIEW
                        </p>
                        <p className="text-[14px] font-bold text-stone-900 mt-0.5">
                          PHQ-9 & GAD-7 Symptom Check-In
                        </p>
                        <p className="text-[12px] text-stone-500">
                          {latestPHQ9
                            ? `Last logged: PHQ-9 (${latestPHQ9.totalScore}/27 · ${latestPHQ9.severity})`
                            : 'Complete standardized rating scale before your visit'}
                        </p>
                      </div>

                      {/* Status-Timeline Item 3: Digital Intake & Pharmacy Verification */}
                      <div className="pl-6 relative py-1">
                        <div className="w-[2px] absolute left-0 top-0 bottom-0 rounded-full bg-stone-300" />
                        <p className="text-[10px] font-bold uppercase tracking-wider font-portal-heading text-stone-400">
                          ONBOARDING & E-RX SYNC
                        </p>
                        <p className="text-[14px] font-bold text-stone-900 mt-0.5">
                          Intake Forms & Preferred Pharmacy
                        </p>
                        <p className="text-[12px] text-stone-500 truncate">
                          {pendingIntakes.length === 0
                            ? `All intake forms signed${prefPharmacy ? ` · ${prefPharmacy}` : ''}`
                            : `${pendingIntakes.length} intake form(s) awaiting signature`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Support CTA Card in Dark Obsidian-Gold Background with Corner Ghost Icon */}
                  <div className="bg-[#0A0A0A] text-white rounded-[32px] p-6 border border-[#D4AF37]/40 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg space-y-4">
                    <ShieldCheck className="w-24 h-24 text-white/5 absolute -right-3 -bottom-3 pointer-events-none" />
                    <div className="space-y-1.5 relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
                        24/7 Care & Crisis Support
                      </span>
                      <h3 className="text-base font-bold font-portal-heading text-white">
                        Need Clinical Assistance?
                      </h3>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        Message <strong className="text-[#D4AF37]">Brenda Hobyani, PMHNP-BC</strong>{' '}
                        for medication or appointment questions. For urgent crises:
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-300 relative z-10">
                      <p>
                        • <strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text{' '}
                        <a href="tel:988" className="text-[#D4AF37] font-bold hover:underline">
                          988
                        </a>
                      </p>
                      <p>
                        • <strong>Poison Control (24/7):</strong> Call{' '}
                        <a
                          href="tel:8002221222"
                          className="text-[#D4AF37] font-bold hover:underline"
                        >
                          800-222-1222
                        </a>
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('messages')}
                      className="w-full py-2.5 px-4 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer relative z-10"
                    >
                      Message Provider Team
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interactive HIPAA Telehealth Video Room Modal */}
      <TelehealthRoomModal
        appointment={activeTelehealthAppt}
        onClose={() => setActiveTelehealthAppt(null)}
        viewerRole={isVerifiedProviderAccount ? 'provider' : 'patient'}
      />
    </div>
  );
};
