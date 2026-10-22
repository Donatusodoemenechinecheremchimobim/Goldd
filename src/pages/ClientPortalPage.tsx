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

  // Navigation & Mode State
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [workspaceMode, setWorkspaceMode] = useState<'patient' | 'provider'>('patient');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
        // Dispatch real Firebase email verification link to the new user's inbox
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

      // Notify clinic office (info@goldenmindpsychiatry.org) that intake paperwork was signed
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
      <div className="min-h-[75vh] bg-[#FAF9F5] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-8 space-y-4">
          <div className="h-6 w-48 bg-stone-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
          <div className="h-10 w-full bg-stone-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ============================================================================
  // 1. AUTHENTICATION GATEWAY (Signed-Out View — Zero Public Mention of Admin/Provider Portal)
  // ============================================================================
  if (!firebaseUser || !portalUser) {
    return (
      <section className="min-h-[84vh] bg-[#FAF9F5] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xl">
          {/* Left Sanctuary Branding Column */}
          <div className="lg:col-span-5 bg-[#0A0A0A] text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D4AF37]/30">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>HIPAA-Encrypted Client Portal</span>
              </div>

              <h1 className="text-3xl font-serif font-bold text-white leading-tight">
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

            <div className="pt-8 mt-8 border-t border-stone-800 text-[11px] text-stone-400">
              Need immediate crisis support? Call or text{' '}
              <strong className="text-[#D4AF37]">988</strong> for the Suicide & Crisis Lifeline.
            </div>
          </div>

          {/* Right Authentication Form Column */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900">
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
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* 1-Click Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl bg-[#0A0A0A] hover:bg-stone-800 text-[#D4AF37] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 border border-[#D4AF37]/50 transition-all cursor-pointer shadow-sm"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Primary Insurance
                    </label>
                    <select
                      value={insuranceInput}
                      onChange={(e) => setInsuranceInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm cursor-pointer hover:opacity-95 transition-opacity"
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

  const navItems: { id: PortalTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Action Center', icon: LayoutDashboard },
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
      badge: messages.filter((m) => m.senderRole === 'provider' && !m.read).length || undefined,
    },
    {
      id: 'billing',
      label: 'Insurance & Billing',
      icon: CreditCard,
      badge: dueInvoices.length || undefined,
    },
  ];

  return (
    <div className="min-h-[86vh] bg-[#FAF9F5] flex flex-col lg:flex-row">
      {/* Left Structural Obsidian Sidebar (260px Desktop) */}
      <aside className="w-full lg:w-[268px] shrink-0 bg-[#0A0A0A] text-stone-200 border-b lg:border-b-0 lg:border-r border-[#D4AF37]/30 flex flex-col justify-between">
        <div>
          {/* Patient Identity Header */}
          <div className="p-5 border-b border-stone-800 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37] block">
                100% Telehealth Client Portal
              </span>
              <p className="text-sm font-serif font-bold text-white truncate mt-0.5">
                {portalUser.fullName}
              </p>
              <p className="text-[11px] text-stone-400 truncate">{portalUser.email}</p>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-lg border border-stone-700 text-[#D4AF37]"
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1C1917] text-[#D4AF37] border border-[#D4AF37]/50 font-semibold'
                      : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="font-mono tabular-nums text-[11px] font-bold text-[#D4AF37]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Bar — Provider Switch is ONLY rendered if the signed-in email is the authorized provider */}
        <div
          className={`${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          } p-4 border-t border-stone-800 space-y-2.5 bg-[#080808]`}
        >
          {isVerifiedProviderAccount && (
            <button
              onClick={() =>
                setWorkspaceMode(workspaceMode === 'provider' ? 'patient' : 'provider')
              }
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                workspaceMode === 'provider'
                  ? 'bg-gold-gradient text-[#1C1917] border-transparent font-bold'
                  : 'bg-stone-900 text-[#D4AF37] border-[#D4AF37]/40 hover:bg-stone-800'
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
            className="w-full py-2 px-3 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Contextual Header */}
        <div className="bg-white border-b border-stone-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-stone-500 flex items-center gap-2">
            <span className="font-semibold text-stone-800">Golden Mind Psychiatry PLLC</span>
            <span>/</span>
            <span className="text-[#9E7206] font-semibold">
              {workspaceMode === 'provider' && isVerifiedProviderAccount
                ? 'Provider Clinical Command Center'
                : navItems.find((n) => n.id === activeTab)?.label}
            </span>
            <span className="hidden md:inline text-stone-400">
              · Hours: Mon–Thu 8:00 AM – 4:00 PM, Fri 9:00 AM – 1:00 PM
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenBooking()}
              className="px-4 py-2 rounded-xl bg-gold-gradient text-[#1C1917] font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book 100% Telehealth Visit</span>
            </button>
          </div>
        </div>

        {/* Workspace Canvas */}
        <div className="p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Email Verification & Clinic Notification Status Bar */}
          {(!firebaseUser.emailVerified || verificationNotice) && (
            <div className="bg-[#FAF6EA] border border-[#D4AF37] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                    className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-semibold hover:bg-stone-50 cursor-pointer"
                  >
                    Resend Email
                  </button>
                  <button
                    onClick={handleRefreshVerification}
                    className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-semibold cursor-pointer"
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
                  MODULE 1: ACTION CENTER OVERVIEW
                 ================================================================ */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome & Next Telehealth Session Hero Banner */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9E7206]">
                        100% Telehealth Sanctuary · Adults, Teens & Children Across Texas
                      </span>
                      <h1 className="text-2xl font-serif font-bold text-stone-900">
                        Welcome back, {portalUser.fullName}
                      </h1>
                      <p className="text-xs text-stone-600">
                        Provider: <strong>Brenda Hobyani, MSN, APRN, PMHNP-BC</strong> · Hours:
                        Mon–Thu 8:00 AM – 4:00 PM, Fri 9:00 AM – 1:00 PM
                      </p>
                    </div>

                    {nextAppointment ? (
                      <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#D4AF37]/60 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9E7206]">
                            Next 100% Telehealth Session
                          </p>
                          <p className="text-sm font-bold text-stone-900 font-mono tabular-nums mt-0.5">
                            {nextAppointment.preferredDate} · {nextAppointment.preferredTime}
                          </p>
                          <p className="text-xs text-stone-500">{nextAppointment.conditionReason}</p>
                        </div>
                        <button
                          onClick={() => setActiveTelehealthAppt(nextAppointment)}
                          className="px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-800 whitespace-nowrap"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Telehealth Room</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenBooking()}
                        className="px-5 py-3 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center gap-2 cursor-pointer self-start"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule First Telehealth Consultation</span>
                      </button>
                    )}
                  </div>

                  {/* Automated Pre-Visit Check-In & Onboarding Action Bar */}
                  {(pendingIntakes.length > 0 ||
                    (nextAppointment && !nextAppointment.preVisitScreenerCompleted)) && (
                    <div className="bg-[#FAF6EA] border border-[#D4AF37] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#9E7206] uppercase tracking-wider">
                          <Clock className="w-4 h-4" />
                          <span>Automated Pre-Visit Action Items</span>
                        </div>
                        <p className="text-xs text-stone-700">
                          You have{' '}
                          <strong className="font-mono tabular-nums">{pendingIntakes.length}</strong>{' '}
                          pending new-patient intake form(s) and your baseline{' '}
                          <strong>PHQ-9 / GAD-7 symptom check-in</strong> queued for Brenda Hobyani,
                          PMHNP-BC before your telehealth session.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {pendingIntakes.length > 0 && (
                          <button
                            onClick={() => setActiveTab('intakes')}
                            className="px-4 py-2 rounded-xl bg-[#0A0A0A] text-[#D4AF37] text-xs font-semibold cursor-pointer"
                          >
                            Complete Intake Forms ({pendingIntakes.length})
                          </button>
                        )}
                        <button
                          onClick={() => setActiveTab('tracker')}
                          className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                        >
                          Log PHQ-9 / GAD-7 Check-In
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4-Metric Clinical Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-stone-200 rounded-2xl p-5">
                      <p className="text-xs text-stone-500">Latest PHQ-9 Score</p>
                      <p className="text-2xl font-serif font-bold text-stone-900 font-mono tabular-nums mt-1">
                        {latestPHQ9 ? `${latestPHQ9.totalScore} / 27` : 'Not Logged'}
                      </p>
                      <p className="text-xs text-[#9E7206] font-medium mt-1">
                        {latestPHQ9 ? `Severity: ${latestPHQ9.severity}` : 'Complete baseline scale'}
                      </p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5">
                      <p className="text-xs text-stone-500">Latest GAD-7 Score</p>
                      <p className="text-2xl font-serif font-bold text-stone-900 font-mono tabular-nums mt-1">
                        {latestGAD7 ? `${latestGAD7.totalScore} / 21` : 'Not Logged'}
                      </p>
                      <p className="text-xs text-[#9E7206] font-medium mt-1">
                        {latestGAD7 ? `Severity: ${latestGAD7.severity}` : 'Complete baseline scale'}
                      </p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5">
                      <p className="text-xs text-stone-500">Intake Paperwork</p>
                      <p className="text-2xl font-serif font-bold text-stone-900 font-mono tabular-nums mt-1">
                        {intakes.filter((i) => i.status === 'completed').length} / {intakes.length}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {pendingIntakes.length === 0
                          ? 'All required forms complete'
                          : `${pendingIntakes.length} awaiting signature`}
                      </p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5">
                      <p className="text-xs text-stone-500">Account Balance Due</p>
                      <p className="text-2xl font-serif font-bold text-stone-900 font-mono tabular-nums mt-1">
                        $
                        {dueInvoices
                          .reduce((sum, inv) => sum + inv.patientResponsibility, 0)
                          .toFixed(2)}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {portalUser.insuranceProvider || 'Insurance on file'}
                      </p>
                    </div>
                  </div>

                  {/* Recent Messages & Active Medications Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-serif font-bold text-stone-900">
                          Recent Messages from Brenda Hobyani, PMHNP-BC
                        </h2>
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="text-xs font-semibold text-[#9E7206] hover:underline cursor-pointer"
                        >
                          Open Thread →
                        </button>
                      </div>
                      <div className="divide-y divide-stone-200">
                        {messages.slice(0, 2).map((m) => (
                          <div key={m.id} className="py-3 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-stone-900">{m.senderName}</span>
                              <span className="font-mono tabular-nums text-stone-400">
                                {m.createdAt.split('T')[0]}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[#9E7206]">{m.subject}</p>
                            <p className="text-xs text-stone-600 line-clamp-2">{m.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-serif font-bold text-stone-900">
                          Active Medications & Refill Status
                        </h2>
                        <button
                          onClick={() => setActiveTab('medications')}
                          className="text-xs font-semibold text-[#9E7206] hover:underline cursor-pointer"
                        >
                          Manage Refills →
                        </button>
                      </div>
                      {medications.length === 0 ? (
                        <div className="py-4 text-xs text-stone-500 space-y-2">
                          <p>
                            No active prescriptions listed yet. You can add your current medications
                            in the Medications tab to coordinate refills with Brenda Hobyani,
                            PMHNP-BC.
                          </p>
                          <button
                            onClick={() => setActiveTab('medications')}
                            className="px-3.5 py-2 rounded-xl bg-stone-900 text-[#D4AF37] font-semibold text-xs cursor-pointer"
                          >
                            Add Current Medication
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-200">
                          {medications.slice(0, 3).map((med) => (
                            <div
                              key={med.id}
                              className="py-3 flex items-center justify-between gap-4 text-xs"
                            >
                              <div>
                                <p className="font-bold text-stone-900">
                                  {med.medicationName} ({med.dosage})
                                </p>
                                <p className="text-stone-500">
                                  {med.frequency} · {med.pharmacy}
                                </p>
                              </div>
                              <span className="font-semibold text-[#9E7206] uppercase text-[11px]">
                                {med.refillStatus.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================
                  MODULE 2: APPOINTMENTS & 100% TELEHEALTH VIDEO LINKS
                 ================================================================ */}
              {activeTab === 'appointments' && (
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-serif font-bold text-stone-900">
                        100% Telehealth Appointments & Video Room Links
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Practice Hours: Monday – Thursday 8:00 AM – 4:00 PM · Friday 9:00 AM – 1:00 PM
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenBooking()}
                      className="px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Book New Telehealth Visit</span>
                    </button>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
                      <Video className="w-8 h-8 text-[#B8860B] mx-auto" />
                      <h3 className="text-base font-serif font-bold text-stone-900">
                        No Telehealth Visits Scheduled Yet
                      </h3>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        Book your 100% telehealth psychiatric evaluation or medication follow-up
                        to automatically receive your encrypted video link.
                      </p>
                      <button
                        onClick={() => onOpenBooking()}
                        className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
                      >
                        Schedule Consultation Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-stone-900 text-sm">
                                  {appt.serviceType}
                                </span>
                                <span>·</span>
                                <span className="font-semibold text-[#9E7206]">
                                  {appt.conditionReason}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 font-mono tabular-nums">
                                Date: {appt.preferredDate} · Window: {appt.preferredTime} · Status:{' '}
                                <strong className="uppercase">{appt.status}</strong>
                              </p>
                              <p className="text-[11px] text-stone-500 font-mono">
                                HIPAA Room Link: {appt.telehealthUrl}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              {appt.status !== 'cancelled' && (
                                <button
                                  onClick={() => setActiveTelehealthAppt(appt)}
                                  className="px-4 py-2 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-stone-800"
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
                                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => handleCancelAppointment(appt.id)}
                                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
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
                                  className="px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                  New Time Window (Mon–Thu 8–4, Fri 9–1)
                                </label>
                                <select
                                  value={newApptTime}
                                  onChange={(e) => setNewApptTime(e.target.value)}
                                  className="px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                                className="px-4 py-2 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                              >
                                Confirm New Date
                              </button>
                              <button
                                onClick={() => setReschedulingApptId(null)}
                                className="px-3 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
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

              {/* ================================================================
                  MODULE 3: DIGITAL INTAKE FORMS & PSYCHIATRIC QUESTIONNAIRES
                 ================================================================ */}
              {activeTab === 'intakes' && (
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-2xl p-6">
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      Digital Psychiatric Intake Forms & Telehealth Consent
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Automatically assigned upon registration so Brenda Hobyani, PMHNP-BC can
                      review your history prior to your 100% Telehealth session
                    </p>
                  </div>

                  <div className="divide-y divide-stone-200 bg-white border border-stone-200 rounded-2xl overflow-hidden">
                    {intakes.map((intake) => (
                      <div
                        key={intake.id}
                        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-stone-900">{intake.title}</p>
                          <p className="text-xs text-stone-500 font-mono tabular-nums">
                            Assigned: {intake.assignedAt.split('T')[0]} · Status:{' '}
                            <span
                              className={
                                intake.status === 'completed'
                                  ? 'text-emerald-700 font-bold'
                                  : 'text-amber-700 font-bold'
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
                          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
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
                      className="bg-white border-2 border-[#D4AF37] rounded-2xl p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <h3 className="text-lg font-serif font-bold text-stone-900">
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
                              setIntakeAnswers({ ...intakeAnswers, primaryConcern: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                            setIntakeAnswers({ ...intakeAnswers, priorTreatment: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF6EA] border border-[#D4AF37]/60 text-xs text-stone-800 space-y-2">
                        <p className="font-semibold text-[#9E7206]">
                          100% Telehealth Informed Consent & Controlled / Habit-Forming Medication
                          Acknowledgment:
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          I confirm that I am physically located in the State of Texas during all
                          telehealth sessions with Brenda Hobyani, PMHNP-BC, and I understand that
                          some psychiatric and anxiety medications can be habit forming and require
                          careful monitoring and follow-up visits.
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
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-serif"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                      >
                        Sign & Submit Intake Form to Chart
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ================================================================
                  MODULE 4: ACTIVE MEDICATIONS & 1-CLICK REFILL REQUESTS
                 ================================================================ */}
              {activeTab === 'medications' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
                      <h2 className="text-xl font-serif font-bold text-stone-900">
                        Active Medication Regimen & 1-Click Refill Requests
                      </h2>
                      <p className="text-xs text-stone-600">
                        Preferred Texas Pharmacy on File:{' '}
                        <strong className="text-[#9E7206]">{prefPharmacy}</strong>
                      </p>
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong>Important Clinical Safety Notice:</strong> Some psychiatric and
                        anxiety medications are <strong>habit forming</strong>. Brenda Hobyani,
                        PMHNP-BC monitors all refills closely to ensure safe, responsible dosing.
                      </div>
                    </div>

                    {medications.length === 0 ? (
                      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
                        No medications listed yet. Add your current psychiatric medication on the
                        right to request a refill from Brenda Hobyani, PMHNP-BC.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {medications.map((med) => (
                          <div
                            key={med.id}
                            className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <p className="text-base font-serif font-bold text-stone-900">
                                {med.medicationName}{' '}
                                <span className="font-mono tabular-nums text-sm text-[#9E7206]">
                                  ({med.dosage})
                                </span>
                              </p>
                              <p className="text-xs text-stone-600">
                                {med.frequency} · Prescribed by {med.prescribedBy}
                              </p>
                              <p className="text-xs text-stone-500">
                                Pharmacy: {med.pharmacy} ·{' '}
                                <span className="font-mono tabular-nums">
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
                                className={`text-xs font-bold uppercase ${
                                  med.refillStatus === 'approved_sent'
                                    ? 'text-emerald-700'
                                    : med.refillStatus === 'refill_requested'
                                    ? 'text-amber-700'
                                    : med.refillStatus === 'denied'
                                    ? 'text-red-600'
                                    : 'text-stone-700'
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
                                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
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
                  </div>

                  {/* Add Current Medication for Refill Coordination */}
                  <form
                    onSubmit={handleAddPatientMedication}
                    className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-4 self-start"
                  >
                    <h3 className="text-base font-serif font-bold text-stone-900">
                      Add Medication for Refill Coordination
                    </h3>
                    <p className="text-xs text-stone-500">
                      Register a current prescription so you can request electronic refills to your
                      preferred Texas pharmacy.
                    </p>
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Medication Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Escitalopram, Bupropion, Atomoxetine"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono"
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                    >
                      Save Medication & Enable 1-Click Refills
                    </button>
                  </form>
                </div>
              )}

              {/* ================================================================
                  MODULE 5: DAILY MOOD JOURNAL & PHQ-9 / GAD-7 SYMPTOM TRACKER
                 ================================================================ */}
              {activeTab === 'tracker' && (
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-serif font-bold text-stone-900">
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
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
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
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{scaleSuccessBanner}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Interactive Questionnaire Form */}
                    <form
                      onSubmit={handleSubmitAssessment}
                      className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-5"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <div>
                          <h3 className="text-base font-serif font-bold text-stone-900">
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
                        <div className="text-right font-mono tabular-nums">
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
                              className="p-3.5 rounded-xl bg-[#FAF9F5] border border-stone-200 space-y-2"
                            >
                              <p className="text-xs font-semibold text-stone-800">
                                <span className="font-mono tabular-nums text-[#9E7206] mr-1">
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
                                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
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
                              className="p-3.5 rounded-xl bg-[#FAF9F5] border border-stone-200 space-y-2"
                            >
                              <p className="text-xs font-semibold text-stone-800">
                                <span className="font-mono tabular-nums text-[#9E7206] mr-1">
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
                                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
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
                              <span className="font-mono tabular-nums font-bold text-[#9E7206]">
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

                      {/* Sleep, Energy & Medication Adherence */}
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
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
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
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Medication Taken Today?
                          </label>
                          <select
                            value={medTakenToday ? 'yes' : 'no'}
                            onChange={(e) => setMedTakenToday(e.target.value === 'yes')}
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer hover:bg-stone-800"
                      >
                        Save {activeScaleTab} Check-In & Sync with Provider
                      </button>
                    </form>

                    {/* Longitudinal Trend Visualization & History */}
                    <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-4 self-start">
                      <h3 className="text-base font-serif font-bold text-stone-900">
                        Longitudinal Symptom & Mood History
                      </h3>
                      {assessments.length === 0 ? (
                        <p className="text-xs text-stone-500 py-6 text-center">
                          Submit your first PHQ-9, GAD-7, or Daily Mood check-in on the left to
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
                                  <span className="font-mono tabular-nums font-bold text-stone-800">
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
                </div>
              )}

              {/* ================================================================
                  MODULE 6: SECURE DIRECT MESSAGING WITH BRENDA HOBYANI, PMHNP-BC
                 ================================================================ */}
              {activeTab === 'messages' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      Direct Clinical Messaging with Brenda Hobyani, PMHNP-BC
                    </h2>
                    <div className="divide-y divide-stone-200 max-h-[500px] overflow-y-auto">
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
                            <span className="font-mono tabular-nums text-stone-400">
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
                    className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-4 self-start"
                  >
                    <h3 className="text-base font-serif font-bold text-stone-900">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Encrypted Message</span>
                    </button>
                  </form>
                </div>
              )}

              {/* ================================================================
                  MODULE 7: INSURANCE COVERAGE, PHARMACY & BILLING STATEMENTS
                 ================================================================ */}
              {activeTab === 'billing' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Insurance & Texas Pharmacy Card */}
                  <form
                    onSubmit={handleSaveInsuranceProfile}
                    className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-4 self-start"
                  >
                    <h2 className="text-lg font-serif font-bold text-stone-900">
                      Insurance Coverage & Preferred Texas Pharmacy
                    </h2>
                    {profileSavedNotice && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        Insurance & Pharmacy profile updated!
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Primary Insurance Carrier
                      </label>
                      <select
                        value={insCarrier}
                        onChange={(e) => setInsCarrier(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
                      >
                        <option value="Blue Cross Blue Shield (BCBS)">
                          Blue Cross Blue Shield (BCBS)
                        </option>
                        <option value="Aetna">Aetna</option>
                        <option value="Cigna / Evernorth">Cigna / Evernorth</option>
                        <option value="UnitedHealthcare / Optum">UnitedHealthcare / Optum</option>
                        <option value="Medicare">Medicare</option>
                        <option value="Self-Pay / Out-of-Network Superbill">
                          Self-Pay / Out-of-Network Superbill
                        </option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">
                          Member ID
                        </label>
                        <input
                          type="text"
                          value={insMemberId}
                          onChange={(e) => setInsMemberId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                    >
                      Save Insurance & Pharmacy Details
                    </button>
                  </form>

                  {/* Statements & Copays */}
                  <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-serif font-bold text-stone-900">
                      Billing Statements & Copay Ledger
                    </h2>
                    <div className="divide-y divide-stone-200">
                      {invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-stone-900 text-sm">{inv.description}</p>
                            <p className="text-stone-500 font-mono tabular-nums">
                              Service Date: {inv.serviceDate} · Billed: ${inv.amount.toFixed(2)} ·
                              Insurance Adjustment: -${inv.insuranceCoveredAmount.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right font-mono tabular-nums">
                              <p className="text-[11px] text-stone-500">Your Copay / Balance</p>
                              <p className="text-base font-bold text-stone-900">
                                ${inv.patientResponsibility.toFixed(2)}
                              </p>
                            </div>
                            {inv.status === 'paid' ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">
                                Paid
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePayInvoice(inv.id)}
                                className="px-4 py-2 rounded-xl bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
                              >
                                Pay ${inv.patientResponsibility.toFixed(2)}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
