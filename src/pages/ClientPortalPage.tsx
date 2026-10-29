import React, { useState, useEffect } from 'react';
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
  Sparkles,
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
  appleProvider,
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
    'google' | 'yahoo' | 'microsoft' | 'apple' | null
  >(null);
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

  // Real Email Action Link State (?mode=resetPassword&oobCode=... or ?mode=verifyEmail&oobCode=...)
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

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

  // Handle incoming Firebase Email Action Links (?mode=verifyEmail&oobCode=... or ?mode=resetPassword&oobCode=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const oobParam = params.get('oobCode');
    const emailParam = params.get('email');
    if (emailParam) {
      setEmailInput(emailParam);
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
          }
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
    } else if (modeParam === 'resetPassword' && oobParam) {
      setResetOobCode(oobParam);
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
        } catch (err) {
          console.error('Onboarding initialization error:', err);
        }
      } else {
        setPortalUser(null);
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

  // Unified OAuth Handler for Google, Yahoo Mail, Microsoft (Outlook/Hotmail/Live), and Apple (iCloud)
  const handleOAuthSignIn = async (
    providerType: 'google' | 'yahoo' | 'microsoft' | 'apple'
  ) => {
    setAuthError(null);
    setVerificationNotice(null);
    setOauthLoadingProvider(providerType);

    const providerMap = {
      google: { instance: googleProvider, label: 'Google (Gmail)', defaultDomain: '@gmail.com' },
      yahoo: { instance: yahooProvider, label: 'Yahoo Mail', defaultDomain: '@yahoo.com' },
      microsoft: {
        instance: microsoftProvider,
        label: 'Outlook / Hotmail',
        defaultDomain: '@outlook.com',
      },
      apple: { instance: appleProvider, label: 'Apple / iCloud', defaultDomain: '@icloud.com' },
    };

    const selected = providerMap[providerType];

    try {
      const cred = await signInWithPopup(auth, selected.instance);
      const profile = await ensurePatientOnboarding(cred.user);
      setPortalUser(profile);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, selected.instance);
          return;
        } catch (redirErr: unknown) {
          setAuthError(
            redirErr instanceof Error
              ? redirErr.message
              : `Unable to start ${selected.label} Sign-In redirect.`
          );
        }
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError(null);
      } else if (code === 'auth/account-exists-with-different-credential') {
        const conflictEmail =
          (err as { customData?: { email?: string } })?.customData?.email || emailInput;
        if (conflictEmail) setEmailInput(conflictEmail);
        setAuthError(
          `An account with ${conflictEmail || 'this email address'} already exists. Please sign in using your email and password below.`
        );
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/unauthorized-domain') {
        // Pre-fill the domain in the email field so the client can immediately sign in or register with their email
        if (!emailInput.includes('@')) {
          setEmailInput((prev) => `${prev.trim() || 'yourname'}${selected.defaultDomain}`);
        } else {
          const localPart = emailInput.split('@')[0] || 'yourname';
          setEmailInput(`${localPart}${selected.defaultDomain}`);
        }
        setVerificationNotice(
          `Enter your ${selected.label} email address (${selected.defaultDomain}) and password in the form below to sign in or create your Client Portal account.`
        );
      } else {
        setAuthError(
          err instanceof Error ? err.message : `${selected.label} Sign-In failed. Please use your email and password below.`
        );
      }
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // Passwordless 1-Click Email Link Sign-In (Works for Yahoo, Outlook, AOL, AT&T, iCloud, Gmail, etc.)
  const handleSendMagicSignInLink = async () => {
    setAuthError(null);
    setVerificationNotice(null);
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter your email address below first so we can send your sign-in link.');
      return;
    }
    try {
      await sendSignInLinkToEmail(auth, cleanEmail, {
        url: `${window.location.origin}/?page=portal&email=${encodeURIComponent(cleanEmail)}`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem('gmp_magic_link_email', cleanEmail);
      setVerificationNotice(
        `A 1-click sign-in link has been sent to ${cleanEmail}. Open your email inbox and click the link to sign straight into your Client Portal.`
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setVerificationNotice(
          'Please enter your email address and password in the form below to sign in or create your Client Portal account.'
        );
      } else {
        setAuthError(
          err instanceof Error ? err.message : 'Unable to send sign-in link. Please sign in with your email and password below.'
        );
      }
    }
  };

  // Helper to quick-append a US email provider domain (@yahoo.com, @outlook.com, @aol.com, @att.net, etc.)
  const handleSelectEmailDomain = (domain: string) => {
    setAuthError(null);
    const current = emailInput.trim();
    if (!current) {
      setEmailInput(`yourname${domain}`);
      return;
    }
    const localPart = current.includes('@') ? current.split('@')[0] : current;
    setEmailInput(`${localPart || 'yourname'}${domain}`);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setVerificationNotice(null);

    // 1. Block automated bot submissions via hidden honeypot field
    if (botHoneypot.trim() !== '') {
      return;
    }

    // 2. Enforce login rate limiting after 5 failed attempts
    if (authLockoutUntil > Date.now()) {
      const waitSeconds = Math.ceil((authLockoutUntil - Date.now()) / 1000);
      setAuthError(
        `Too many failed login attempts. For your account security, please wait ${waitSeconds} seconds before trying again.`
      );
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !passwordInput) return;

    const completeAuthenticatedSession = async (user: FirebaseUser, isNewAccount: boolean) => {
      const isProvider = isAuthorizedProviderEmail(user.email);
      if (isProvider) {
        setWorkspaceMode('provider');
      } else if (isNewAccount || !user.emailVerified) {
        try {
          await sendEmailVerification(user, {
            url: 'https://goldenmindpsychiatry.org/?page=portal',
          });
          setVerificationNotice(
            `A verification email has been sent to ${user.email}. Please open your inbox and click the verification link to unlock your Client Portal.`
          );
        } catch {
          // Non-fatal if verification email was recently sent
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

    try {
      if (isRegistering && cleanEmail !== 'beehobs@yahoo.com') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, passwordInput);
        await completeAuthenticatedSession(cred.user, true);
        return;
      } else {
        const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
        await completeAuthenticatedSession(signInCred.user, false);
        return;
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';

      // Auto-provision the primary Admin Provider login (beehobs@yahoo.com / johnbull) on first sign-in if not yet created in Firebase Auth
      if (
        cleanEmail === 'beehobs@yahoo.com' &&
        passwordInput === 'johnbull' &&
        (code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password')
      ) {
        try {
          const adminCred = await createUserWithEmailAndPassword(auth, cleanEmail, passwordInput);
          setIsRegistering(false);
          await completeAuthenticatedSession(adminCred.user, false);
          return;
        } catch {
          // Fall through if account already exists with a different password
        }
      }

      // If user clicked "New Client Registration" with an email that already has a password account, try signing them in
      if (code === 'auth/email-already-in-use') {
        try {
          const existingCred = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
          setIsRegistering(false);
          await completeAuthenticatedSession(existingCred.user, false);
          return;
        } catch {
          setIsRegistering(false);
          setAuthError(
            `An account for ${cleanEmail} already exists. If you previously signed in with Google, click "Continue Instantly with Google Sign-In" above, or click "Forgot Password?" to receive a password reset link in your email inbox.`
          );
          return;
        }
      }

      if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Please click "Continue Instantly with Google (Gmail)" above or contact our clinic at (432) 934-3185 for portal assistance.'
        );
        return;
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
          return;
        }
        setAuthError(
          'Invalid email or password. If you are a new client, switch to the "New Client Registration" tab above, or click "Forgot Password?" to receive a reset link in your email.'
        );
        return;
      }

      setAuthError(
        err instanceof Error ? err.message : 'Unable to authenticate. Please try again.'
      );
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    setAuthError(null);
    setVerificationNotice(null);
    if (!cleanEmail) {
      setAuthError('Please enter your email address first so we can send your password reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail, {
        url: 'https://goldenmindpsychiatry.org/?page=portal',
      });
      setVerificationNotice(
        `A password reset link has been sent to ${cleanEmail}. Please check your email inbox (and Spam/Promotions folder) to set your new password.`
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Unable to send a password reset email right now. Please sign in with Google above or contact our clinic at info@goldenmindpsychiatry.org.'
        );
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Could not send password reset email. Please verify your email address.'
        );
      }
    }
  };

  const handleConfirmPasswordResetFromEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOobCode) return;
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
    try {
      await confirmPasswordReset(auth, resetOobCode, newResetPassword);
      setResetOobCode(null);
      setNewResetPassword('');
      setConfirmResetPassword('');
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
      try {
        await sendEmailVerification(auth.currentUser, {
          url: 'https://goldenmindpsychiatry.org/?page=portal',
        });
        setVerificationNotice(
          `A fresh verification link has been sent to ${auth.currentUser.email}. Please check your inbox and click the link to verify your account.`
        );
      } catch (err: unknown) {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Verification email was recently sent. Please wait a moment and check your inbox.'
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
      await signOut(auth);
    } catch {
      // ignore
    }
    setPortalUser(null);
    setFirebaseUser(null);
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
  if (resetOobCode) {
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

            {/* 1-Click US Email & Identity Providers (Google/Gmail, Yahoo Mail, Microsoft Outlook/Hotmail, Apple/iCloud) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={oauthLoadingProvider !== null}
                className="w-full py-3 px-4 rounded-[12px] bg-[#0A0A0A] hover:bg-stone-800 text-[#D4AF37] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 border border-[#D4AF37]/50 transition-all cursor-pointer shadow-xs disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>
                  {oauthLoadingProvider === 'google'
                    ? 'Connecting to Google...'
                    : 'Continue Instantly with Google (Gmail)'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Yahoo Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('yahoo')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-2.5 px-3 rounded-[12px] bg-[#FAF9F5] hover:bg-[#f2efe6] text-stone-900 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 hover:border-[#6001D2]/50 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span className="w-5 h-5 rounded-md bg-[#6001D2] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    Y!
                  </span>
                  <span>
                    {oauthLoadingProvider === 'yahoo' ? 'Connecting...' : 'Yahoo Mail'}
                  </span>
                </button>

                {/* Microsoft (Outlook / Hotmail / Live) Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('microsoft')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-2.5 px-3 rounded-[12px] bg-[#FAF9F5] hover:bg-[#f2efe6] text-stone-900 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 hover:border-[#0078D4]/50 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span className="w-5 h-5 rounded-md bg-[#0078D4] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    MS
                  </span>
                  <span>
                    {oauthLoadingProvider === 'microsoft'
                      ? 'Connecting...'
                      : 'Outlook / Hotmail'}
                  </span>
                </button>

                {/* Apple (iCloud / Apple ID) Sign-In */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={oauthLoadingProvider !== null}
                  className="py-2.5 px-3 rounded-[12px] bg-[#FAF9F5] hover:bg-[#f2efe6] text-stone-900 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 hover:border-stone-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span className="w-5 h-5 rounded-md bg-stone-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    
                  </span>
                  <span>
                    {oauthLoadingProvider === 'apple' ? 'Connecting...' : 'Apple / iCloud'}
                  </span>
                </button>

                {/* 1-Click Magic Email Link */}
                <button
                  type="button"
                  onClick={handleSendMagicSignInLink}
                  disabled={oauthLoadingProvider !== null}
                  className="py-2.5 px-3 rounded-[12px] bg-[#FAF6EA] hover:bg-[#f3ebd3] text-[#9E7206] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#D4AF37]/50 transition-all cursor-pointer disabled:opacity-60"
                >
                  <MailCheck className="w-4 h-4 text-[#9E7206] shrink-0" />
                  <span>Email Sign-In Link</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-stone-200" />
              <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400">
                Or with Any US Email &amp; Password (Yahoo, AOL, AT&amp;T, Outlook, iCloud)
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
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="(432) 555-0199"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dobInput}
                      onChange={(e) => setDobInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Primary Insurance
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
                    type="email"
                    required
                    placeholder="you@yahoo.com, @outlook.com, @gmail.com..."
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
                      className="text-[11px] font-semibold text-[#9E7206] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
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
                  ? 'Create Account & Send Verification Email'
                  : 'Sign In to Client Portal'}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Only verified provider emails can ever see the Provider View toggle
  const isVerifiedProviderAccount = isAuthorizedProviderEmail(
    firebaseUser?.email || portalUser.email
  );

  // Federated OAuth providers (Google, Yahoo, Microsoft, Apple, Facebook, Twitter) authenticate the user directly with their provider
  const isFederatedOAuthProvider = firebaseUser.providerData.some((p) =>
    ['google.com', 'yahoo.com', 'microsoft.com', 'apple.com', 'facebook.com', 'twitter.com'].includes(
      p.providerId
    )
  );

  // ============================================================================
  // 2. STRICT EMAIL VERIFICATION GATE (Blocks Portal Until User Verifies Their Email)
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
          {/* Top Section with 40px Golden Mind Icon Logo */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[12px] bg-[#0A0A0A] border border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
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
              className="w-10 h-10 rounded-full bg-[#0A0A0A] border-2 border-[#D4AF37] text-[#D4AF37] font-portal-heading font-bold text-xs flex items-center justify-center shrink-0"
              title={portalUser.fullName}
            >
              {userInitials}
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
                              <Sparkles className="w-4 h-4 text-[#9E7206]" />
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
