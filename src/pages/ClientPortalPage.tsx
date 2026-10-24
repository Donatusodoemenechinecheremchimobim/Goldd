import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
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
  sanitizeClinicalInput,
  CLINIC_OWNER_EMAIL,
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  SCALE_OPTIONS,
  calculatePHQ9Severity,
  calculateGAD7Severity,
  submitClinicalAssessment,
  requestMedicationRefill,
} from '../services/clinicalAutomation';
import { TelehealthRoomModal } from '../components/TelehealthRoomModal';
import { ProviderDashboardView } from '../components/ProviderDashboardView';

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
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [insuranceInput, setInsuranceInput] = useState('Blue Cross Blue Shield (BCBS)');

  // Navigation, Search & Mode State
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [workspaceMode, setWorkspaceMode] = useState<'patient' | 'provider'>('patient');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [portalSearchQuery, setPortalSearchQuery] = useState('');
  const [activeTelehealthAppt, setActiveTelehealthAppt] =
    useState<AppointmentRecord | null>(null);

  // Real-time Patient Data Collections (Strictly isolated to firebaseUser.uid)
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

  // Insurance & Pharmacy Profile Editor
  const [insCarrier, setInsCarrier] = useState('');
  const [insMemberId, setInsMemberId] = useState('');
  const [insGroupId, setInsGroupId] = useState('');
  const [prefPharmacy, setPrefPharmacy] = useState('');
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  // Listen to Firebase Auth state & trigger automated clinical onboarding
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await ensurePatientOnboarding(user, {
            fullName: fullNameInput || undefined,
            phone: phoneInput || undefined,
            dateOfBirth: dobInput || undefined,
            insuranceProvider: insuranceInput || undefined,
          });
          setPortalUser(profile);
          setInsCarrier(profile.insuranceProvider || 'Blue Cross Blue Shield (BCBS)');
          setInsMemberId(profile.insuranceMemberId || 'TXM-8849201');
          setInsGroupId(profile.insuranceGroupNumber || 'GRP-44210');
          setPrefPharmacy(
            profile.preferredPharmacy || 'H-E-B Pharmacy · Austin / Texas Statewide e-Rx'
          );

          // Stealth Provider Routing: Automatically open Provider Dashboard ONLY when the specific authorized Gmail/email logs in
          if (isAuthorizedProviderEmail(user.email)) {
            setWorkspaceMode('provider');
          } else {
            setWorkspaceMode('patient');
          }
        } catch (err) {
          console.error('Onboarding initialization error:', err);
        }
      } else {
        setPortalUser(null);
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
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MessageRecord, 'id'>),
        }));
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
      unsubAppts();
      unsubIntakes();
      unsubAssessments();
      unsubMeds();
      unsubMsgs();
      unsubInvoices();
    };
  }, [firebaseUser]);

  // Authentication Handlers
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setVerificationNotice(null);
    try {
      if (isRegistering) {
        const cred = await createUserWithEmailAndPassword(
          auth,
          emailInput.trim(),
          passwordInput
        );
        try {
          await sendEmailVerification(cred.user);
          setVerificationNotice(
            `A verification email has been sent to ${cred.user.email}, and a new-patient registration alert has been sent to ${CLINIC_OWNER_EMAIL}.`
          );
        } catch {
          // Non-fatal if verification email throttled
        }
      } else {
        await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      }
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error
          ? err.message.replace('Firebase: ', '')
          : 'Authentication failed. Please check your credentials.'
      );
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationNotice(
        `Verification link re-sent to ${auth.currentUser.email}. Please check your inbox and spam folder.`
      );
    } catch {
      setVerificationNotice(
        'Verification email was recently sent. Please check your inbox or wait a moment before retrying.'
      );
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setFirebaseUser({ ...auth.currentUser });
    if (auth.currentUser.emailVerified) {
      setVerificationNotice('Your email address has been verified!');
      setTimeout(() => setVerificationNotice(null), 4000);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setWorkspaceMode('patient');
  };

  // Complete Digital Intake Form (with input sanitization)
  const handleCompleteIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntake || !portalUser) return;
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
        subject: `[Automated Alert -> ${CLINIC_OWNER_EMAIL}] Completed Intake: ${editingIntake.title}`,
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

  // Reschedule or Cancel Appointment
  const handleSaveReschedule = async (apptId: string) => {
    if (!newApptDate) return;
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        preferredDate: sanitizeClinicalInput(newApptDate, 30),
        preferredTime: sanitizeClinicalInput(newApptTime, 80),
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
      });
      setReschedulingApptId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${apptId}`);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${apptId}`);
    }
  };

  // Submit PHQ-9, GAD-7, or Daily Mood
  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser) return;

    const totalScore =
      activeScaleTab === 'PHQ-9'
        ? phq9Scores.reduce((acc, v) => acc + v, 0)
        : activeScaleTab === 'GAD-7'
        ? gad7Scores.reduce((acc, v) => acc + v, 0)
        : moodScore;

    await submitClinicalAssessment({
      patientId: portalUser.uid,
      patientName: portalUser.fullName,
      type: activeScaleTab,
      totalScore,
      answers:
        activeScaleTab === 'PHQ-9'
          ? phq9Scores
          : activeScaleTab === 'GAD-7'
          ? gad7Scores
          : [moodScore],
      sleepHours,
      energyLevel,
      medicationTaken: medTakenToday,
      notes: assessmentNotes,
    });

    setAssessmentNotes('');
    setScaleSuccessBanner(
      `${activeScaleTab} Assessment logged (${totalScore} pts) and synced to Brenda Hobyani, PMHNP-BC's clinical chart.`
    );
    setTimeout(() => setScaleSuccessBanner(null), 5000);
  };

  // Patient adds an active medication for refill coordination
  const handleAddPatientMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser || !newMedName.trim() || !newMedDosage.trim()) return;
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
          prefPharmacy ||
            portalUser.preferredPharmacy ||
            'H-E-B Pharmacy · Austin / Texas Statewide e-Rx',
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

  // Send secure message to Brenda Hobyani & info@goldenmindpsychiatry.org
  const handleSendPatientMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser || !msgSubject.trim() || !msgBody.trim()) return;
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'messages'), {
        patientId: portalUser.uid,
        patientName: portalUser.fullName,
        senderId: portalUser.uid,
        senderName: portalUser.fullName,
        senderRole: 'patient',
        subject: sanitizeClinicalInput(msgSubject, 200),
        body: sanitizeClinicalInput(msgBody, 4000),
        read: false,
        createdAt: now,
      });
      setMsgSubject('');
      setMsgBody('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  // Save Insurance & Preferred Texas Pharmacy
  const handleSaveInsuranceProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser) return;
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
      setPortalUser({
        ...portalUser,
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

  // Pay Copay Statement in 1 click
  const handlePayInvoice = async (invoiceId: string) => {
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
                    <strong>Automated Email Verification & Intake:</strong> Instant verification
                    link sent to your email and automated notification to{' '}
                    <span className="text-[#D4AF37]">{CLINIC_OWNER_EMAIL}</span>.
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
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold font-portal-heading text-stone-900">
                  {isRegistering ? 'Create Your Client Portal Account' : 'Sign In to Client Portal'}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  {isRegistering
                    ? 'Self-register to receive your verification email and unlock your private chart'
                    : 'Access your private appointments, intake forms, medications, and messages'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError(null);
                }}
                className="text-xs font-semibold text-[#9E7206] hover:underline cursor-pointer"
              >
                {isRegistering ? 'Already have an account? Sign In' : 'New Patient? Register'}
              </button>
            </div>

            {authError && (
              <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* 1-Click Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-[12px] bg-[#0A0A0A] hover:bg-stone-800 text-[#D4AF37] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 border border-[#D4AF37]/50 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Continue Instantly with Google Sign-In</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-stone-200" />
              <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-400">
                Or with Email & Password
              </span>
              <div className="grow border-t border-stone-200" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
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
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Password *
                  </label>
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
  const isVerifiedProviderAccount = isAuthorizedProviderEmail(firebaseUser.email);

  // Computed Metrics for Patient Portal Overview
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
          SIDEBAR NAVIGATION (256px width, #FFFFFF surface, 1px border, 40px icon logo,
          12px padding & radius links, 4px solid right-border active indicator,
          'Practice Verified' bottom status card & red-500 logout button)
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

          {/* Navigation Links (stacked vertically with 4px spacing, 12px padding, 12px radius) */}
          <nav
            className={`${
              mobileSidebarOpen ? 'block' : 'hidden lg:block'
            } p-3 space-y-1`}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = workspaceMode === 'patient' && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setWorkspaceMode('patient');
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
            })}
          </nav>
        </div>

        {/* Bottom Section: 'Practice Verified' Card + Stealth Provider Switch + Red-500 Logout */}
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

          {isVerifiedProviderAccount && (
            <button
              onClick={() =>
                setWorkspaceMode(workspaceMode === 'provider' ? 'patient' : 'provider')
              }
              className={`w-full p-3 rounded-[12px] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                workspaceMode === 'provider'
                  ? 'bg-gold-gradient text-[#1C1917] border-transparent'
                  : 'bg-[#0A0A0A] text-[#D4AF37] border-[#D4AF37]/40 hover:bg-stone-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>
                {workspaceMode === 'provider'
                  ? 'Switch to Patient View'
                  : 'Provider Command View'}
              </span>
            </button>
          )}

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
          FLUID MAIN CONTENT AREA (Sticky Glassmorphism Header + 1280px Max-Width Container)
         ========================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky 72px Glassmorphism Header */}
        <header className="sticky top-0 z-30 min-h-[72px] bg-white/90 backdrop-blur-md border-b border-stone-200 px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Left-Aligned Title (18px Bold) & Subtitle (12px Slate/Stone-500) Stack */}
          <div>
            <h1 className="text-[18px] font-bold font-portal-heading text-stone-900 leading-tight">
              {workspaceMode === 'provider' && isVerifiedProviderAccount
                ? 'Provider Clinical Command Center'
                : navItems.find((n) => n.id === activeTab)?.label || 'Client Portal Dashboard'}
            </h1>
            <p className="text-[12px] text-stone-500">
              Golden Mind Psychiatry PLLC · Brenda Hobyani, PMHNP-BC · Mon–Thu 8–4, Fri 9–1
            </p>
          </div>

          {/* Right-Aligned Utility Bar: Pill Search, Notification Bell with Red Dot, Book CTA, 40px Avatar */}
          <div className="flex items-center gap-3">
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
          {/* Email Verification Banner (if unverified) */}
          {(!firebaseUser.emailVerified || verificationNotice) && (
            <div className="bg-[#FAF6EA] border border-[#D4AF37] rounded-[24px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MailCheck className="w-4 h-4 text-[#9E7206] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">
                    {firebaseUser.emailVerified
                      ? 'Email Verified & Synced'
                      : 'Verify Your Email Address'}
                  </p>
                  <p className="text-stone-600 mt-0.5">
                    {verificationNotice ||
                      `We sent an automated verification link to ${firebaseUser.email} and notified our clinic coordinator at ${CLINIC_OWNER_EMAIL}.`}
                  </p>
                </div>
              </div>
              {!firebaseUser.emailVerified && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResendVerification}
                    className="px-3.5 py-2 rounded-[12px] bg-white border border-stone-300 text-stone-800 font-semibold hover:bg-stone-50 cursor-pointer"
                  >
                    Resend Email
                  </button>
                  <button
                    onClick={handleRefreshVerification}
                    className="px-3.5 py-2 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-semibold cursor-pointer"
                  >
                    I've Verified — Refresh
                  </button>
                </div>
              )}
            </div>
          )}

          {workspaceMode === 'provider' && isVerifiedProviderAccount ? (
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
                              {filteredInvoices.map((inv) => (
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
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

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
                                <p className="text-xs text-stone-600 line-clamp-2">{m.body}</p>
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
                          <strong className="text-[#9E7206]">{prefPharmacy}</strong>
                        </p>
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
                                  Pharmacy: {med.pharmacy} ·{' '}
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
                                  onClick={() => requestMedicationRefill(med.id, prefPharmacy)}
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
                                {msg.body}
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
                          {invoices.map((inv) => (
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
                          ))}
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
                            Insurance & Pharmacy profile updated!
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
                            ? `Verified · ${prefPharmacy}`
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
        viewerRole={workspaceMode}
      />
    </div>
  );
};
