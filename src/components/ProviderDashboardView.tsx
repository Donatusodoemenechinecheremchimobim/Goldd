import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Users,
  Calendar,
  Pill,
  FileText,
  Activity,
  MessageSquare,
  CreditCard,
  Video,
  CheckCircle2,
  XCircle,
  Send,
  Plus,
  Search,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  Link2,
  Edit3,
  Trash2,
  ClipboardCheck,
  UserCheck,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  PortalUser,
  AppointmentRecord,
  IntakeRecord,
  IntakeFormType,
  AssessmentRecord,
  MedicationRecord,
  RefillStatus,
  MessageRecord,
  InvoiceRecord,
  SharedPatientResource,
} from '../types';
import {
  providerProcessRefill,
  dispatchPortalMessageEmailAlert,
  generateTelehealthRoomUrl,
  sanitizeClinicalInput,
  isAuthorizedProviderEmail,
  registerEmailInAccountDirectory,
} from '../services/clinicalAutomation';

export type AdminSubTab =
  | 'patients'
  | 'patient-page'
  | 'queue'
  | 'charts'
  | 'refills'
  | 'intakes'
  | 'messages'
  | 'billing';

interface ProviderDashboardViewProps {
  currentUser: PortalUser;
  onLaunchTelehealth: (appt: AppointmentRecord) => void;
  externalSubTab?: AdminSubTab;
  onChangeSubTab?: (tab: AdminSubTab) => void;
}

/**
 * Renders text content and converts any http:// or https:// URLs into clickable links
 */
export function renderTextWithClickableLinks(text: string): React.ReactNode {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-[#9E7206] underline hover:text-stone-900 break-all"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline" />
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const ProviderDashboardView: React.FC<ProviderDashboardViewProps> = ({
  currentUser,
  onLaunchTelehealth,
  externalSubTab,
  onChangeSubTab,
}) => {
  const [patients, setPatients] = useState<PortalUser[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>('ALL');
  const [activeChartPatientId, setActiveChartPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTabState] = useState<AdminSubTab>(externalSubTab || 'patients');
  const [patientPageSection, setPatientPageSection] = useState<
    | 'all'
    | 'demographics'
    | 'careplan'
    | 'medications'
    | 'appointments'
    | 'intakes'
    | 'messages'
    | 'billing'
  >('all');

  const setActiveSubTab = (tab: AdminSubTab) => {
    setActiveSubTabState(tab);
    if (onChangeSubTab) {
      onChangeSubTab(tab);
    }
    if (tab === 'patient-page' && !activeChartPatientId && patients.length > 0) {
      setActiveChartPatientId(patients[0].uid);
    } else if (tab !== 'patient-page') {
      setActiveChartPatientId(null);
    }
  };

  useEffect(() => {
    if (externalSubTab && externalSubTab !== activeSubTab) {
      setActiveSubTabState(externalSubTab);
      if (externalSubTab === 'patient-page' && !activeChartPatientId && patients.length > 0) {
        setActiveChartPatientId(patients[0].uid);
      } else if (externalSubTab !== 'patient-page') {
        setActiveChartPatientId(null);
      }
    }
  }, [externalSubTab, patients]);

  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Patient Demographics Inline Editor State (for Dedicated Patient Page)
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);
  const [demoFullName, setDemoFullName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoDob, setDemoDob] = useState('');
  const [demoSex, setDemoSex] = useState('Female');
  const [demoAddress, setDemoAddress] = useState('');
  const [demoEmergencyContact, setDemoEmergencyContact] = useState('');
  const [demoInsurance, setDemoInsurance] = useState('Blue Cross Blue Shield (BCBS)');
  const [demoMemberId, setDemoMemberId] = useState('');
  const [demoGroupNumber, setDemoGroupNumber] = useState('');
  const [demoPharmacy, setDemoPharmacy] = useState('');
  const [demoPrimaryConcern, setDemoPrimaryConcern] = useState('');

  // Add New Patient Modal State (for Admin Portal)
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatFullName, setNewPatFullName] = useState('');
  const [newPatEmail, setNewPatEmail] = useState('');
  const [newPatPhone, setNewPatPhone] = useState('');
  const [newPatDob, setNewPatDob] = useState('');
  const [newPatSex, setNewPatSex] = useState('Female');
  const [newPatAddress, setNewPatAddress] = useState('');
  const [newPatInsurance, setNewPatInsurance] = useState('Blue Cross Blue Shield (BCBS)');
  const [newPatPharmacy, setNewPatPharmacy] = useState('');
  const [newPatDiagnosis, setNewPatDiagnosis] = useState('');

  // Schedule Follow-Up Appointment for Dedicated Patient State
  const [apptServiceType, setApptServiceType] = useState(
    'Follow-Up Telehealth Medication & Therapy Session'
  );
  const [apptReason, setApptReason] = useState('Psychiatric Follow-Up & Medication Management');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('Mon–Thu Morning (9:00 AM - 12:00 PM)');

  // New Medication form state (Provider prescribing)
  const [rxPatientId, setRxPatientId] = useState('');
  const [rxName, setRxName] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxPharmacy, setRxPharmacy] = useState('');
  const [rxRefills, setRxRefills] = useState(3);
  const [rxInstructions, setRxInstructions] = useState(
    'Take as prescribed. Note: Some psychiatric medications can be habit forming; never adjust dosage without consulting Brenda Hobyani, PMHNP-BC.'
  );

  // Editing existing medication state
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editMedName, setEditMedName] = useState('');
  const [editMedDosage, setEditMedDosage] = useState('');
  const [editMedFrequency, setEditMedFrequency] = useState('');
  const [editMedInstructions, setEditMedInstructions] = useState('');
  const [editMedPharmacy, setEditMedPharmacy] = useState('');
  const [editMedRefills, setEditMedRefills] = useState(0);
  const [editMedStatus, setEditMedStatus] = useState<RefillStatus>('active');

  // Individual Patient Care Plan Editor State
  const [careDiagnosis, setCareDiagnosis] = useState('');
  const [careRecommendations, setCareRecommendations] = useState('');
  const [careTreatmentNotes, setCareTreatmentNotes] = useState('');
  const [careResources, setCareResources] = useState<SharedPatientResource[]>([]);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');

  // Provider Reply / Direct Message + Link state
  const [replyPatientId, setReplyPatientId] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [customLinkToInsert, setCustomLinkToInsert] = useState('');

  // New Invoice state
  const [invPatientId, setInvPatientId] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invTotal, setInvTotal] = useState(0);
  const [invCovered, setInvCovered] = useState(0);

  const showBanner = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 4500);
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const allUsers = snap.docs.map((d) => d.data() as PortalUser);
        allUsers.forEach((u) => {
          if (u.email) {
            registerEmailInAccountDirectory(u.email);
          }
        });
        const list = allUsers.filter((u) => !isAuthorizedProviderEmail(u.email));
        // Order patient accounts by most recently updated
        list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        setPatients(list);
        const firstPatient = list[0];
        if (firstPatient && !rxPatientId) {
          setRxPatientId(firstPatient.uid);
          setReplyPatientId(firstPatient.uid);
          setInvPatientId(firstPatient.uid);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    const unsubAppts = onSnapshot(
      query(collection(db, 'appointments'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAppointments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppointmentRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'appointments')
    );

    const unsubIntakes = onSnapshot(
      collection(db, 'intakes'),
      (snap) => {
        setIntakes(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IntakeRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'intakes')
    );

    const unsubAssessments = onSnapshot(
      query(collection(db, 'assessments'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAssessments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AssessmentRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'assessments')
    );

    const unsubMeds = onSnapshot(
      collection(db, 'medications'),
      (snap) => {
        setMedications(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MedicationRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'medications')
    );

    const unsubMsgs = onSnapshot(
      query(collection(db, 'messages'), orderBy('createdAt', 'desc')),
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MessageRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
    );

    const unsubInvoices = onSnapshot(
      query(collection(db, 'invoices'), orderBy('createdAt', 'desc')),
      (snap) => {
        setInvoices(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InvoiceRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'invoices')
    );

    return () => {
      unsubUsers();
      unsubAppts();
      unsubIntakes();
      unsubAssessments();
      unsubMeds();
      unsubMsgs();
      unsubInvoices();
    };
  }, []);

  // Synchronize care plan & demographic fields when opening an individual patient chart
  const activeChartPatient =
    patients.find((p) => p.uid === activeChartPatientId) ||
    (activeSubTab === 'patient-page' && patients.length > 0 ? patients[0] : null);

  useEffect(() => {
    if (activeChartPatient) {
      setCareDiagnosis(activeChartPatient.diagnosis || '');
      setCareRecommendations(activeChartPatient.clinicalRecommendations || '');
      setCareTreatmentNotes(activeChartPatient.treatmentPlanNotes || '');
      setCareResources(activeChartPatient.sharedResources || []);
      setRxPatientId(activeChartPatient.uid);
      setReplyPatientId(activeChartPatient.uid);
      setInvPatientId(activeChartPatient.uid);
      setRxPharmacy(activeChartPatient.preferredPharmacy || '');

      // Sync demographic edit fields
      setDemoFullName(activeChartPatient.fullName || '');
      setDemoEmail(activeChartPatient.email || '');
      setDemoPhone(activeChartPatient.phone || '');
      setDemoDob(activeChartPatient.dateOfBirth || '');
      setDemoSex(activeChartPatient.biologicalSex || 'Female');
      setDemoAddress(activeChartPatient.address || '');
      setDemoEmergencyContact(activeChartPatient.emergencyContact || '');
      setDemoInsurance(activeChartPatient.insuranceProvider || 'Blue Cross Blue Shield (BCBS)');
      setDemoMemberId(activeChartPatient.insuranceMemberId || '');
      setDemoGroupNumber(activeChartPatient.insuranceGroupNumber || '');
      setDemoPharmacy(activeChartPatient.preferredPharmacy || '');
      setDemoPrimaryConcern(
        activeChartPatient.primaryConcern || 'Comprehensive Psychiatric Evaluation'
      );
    }
  }, [
    activeChartPatient?.uid,
    activeChartPatient?.diagnosis,
    activeChartPatient?.clinicalRecommendations,
    activeChartPatient?.treatmentPlanNotes,
    activeChartPatient?.sharedResources,
  ]);

  const openPatientChart = (patientId: string) => {
    setActiveChartPatientId(patientId);
    setActiveSubTabState('patient-page');
    if (onChangeSubTab) {
      onChangeSubTab('patient-page');
    }
    setRxPatientId(patientId);
    setReplyPatientId(patientId);
    setInvPatientId(patientId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePatientDemographics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChartPatient) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', activeChartPatient.uid), {
        fullName: sanitizeClinicalInput(demoFullName.trim(), 140),
        phone: sanitizeClinicalInput(demoPhone.trim(), 40),
        dateOfBirth: sanitizeClinicalInput(demoDob.trim(), 30),
        biologicalSex: sanitizeClinicalInput(demoSex.trim(), 40),
        address: sanitizeClinicalInput(demoAddress.trim(), 250),
        emergencyContact: sanitizeClinicalInput(demoEmergencyContact.trim(), 200),
        insuranceProvider: sanitizeClinicalInput(demoInsurance.trim(), 140),
        insuranceMemberId: sanitizeClinicalInput(demoMemberId.trim(), 80),
        insuranceGroupNumber: sanitizeClinicalInput(demoGroupNumber.trim(), 80),
        preferredPharmacy: sanitizeClinicalInput(demoPharmacy.trim(), 200),
        primaryConcern: sanitizeClinicalInput(demoPrimaryConcern.trim(), 200),
        registrationCompleted: true,
        updatedAt: now,
      });
      setIsEditingDemographics(false);
      showBanner(`Updated ${demoFullName.trim()}'s demographic & insurance profile in real time!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${activeChartPatient.uid}`);
    }
  };

  const handleCreateNewPatientRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatFullName.trim() || !newPatEmail.trim()) return;
    const now = new Date().toISOString();
    const cleanEmail = newPatEmail.trim().toLowerCase();
    const generatedUid = `pat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'users', generatedUid), {
        uid: generatedUid,
        email: cleanEmail,
        fullName: sanitizeClinicalInput(newPatFullName.trim(), 140),
        phone: sanitizeClinicalInput(newPatPhone.trim(), 40),
        dateOfBirth: sanitizeClinicalInput(newPatDob.trim(), 30),
        biologicalSex: sanitizeClinicalInput(newPatSex.trim(), 40),
        address: sanitizeClinicalInput(newPatAddress.trim() || 'Texas (Telehealth)', 240),
        insuranceProvider: sanitizeClinicalInput(newPatInsurance.trim(), 140),
        preferredPharmacy: sanitizeClinicalInput(newPatPharmacy.trim(), 200),
        diagnosis: sanitizeClinicalInput(newPatDiagnosis.trim(), 250),
        role: 'patient',
        registrationCompleted: Boolean(newPatDob.trim() && newPatPhone.trim()),
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      });
      await registerEmailInAccountDirectory(cleanEmail, undefined, true);
      setShowAddPatientModal(false);
      setNewPatFullName('');
      setNewPatEmail('');
      setNewPatPhone('');
      setNewPatDob('');
      setNewPatAddress('');
      setNewPatPharmacy('');
      setNewPatDiagnosis('');
      openPatientChart(generatedUid);
      showBanner(`Created dedicated patient record for ${newPatFullName.trim()}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${generatedUid}`);
    }
  };

  const handleSchedulePatientAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChartPatient || !apptDate.trim()) return;
    const now = new Date().toISOString();
    const roomUrl = generateTelehealthRoomUrl(activeChartPatient.fullName);
    try {
      await addDoc(collection(db, 'appointments'), {
        patientId: activeChartPatient.uid,
        patientName: activeChartPatient.fullName,
        patientEmail: activeChartPatient.email,
        patientPhone: activeChartPatient.phone || '',
        dateOfBirth: activeChartPatient.dateOfBirth || '',
        serviceType: sanitizeClinicalInput(apptServiceType, 180),
        conditionReason: sanitizeClinicalInput(apptReason, 180),
        preferredDate: sanitizeClinicalInput(apptDate, 40),
        preferredTime: sanitizeClinicalInput(apptTime, 90),
        insuranceProvider: activeChartPatient.insuranceProvider || 'Verified on File',
        status: 'confirmed',
        telehealthUrl: roomUrl,
        preVisitScreenerCompleted: false,
        createdAt: now,
        updatedAt: now,
      });
      setApptDate('');
      showBanner(
        `Scheduled confirmed telehealth visit for ${activeChartPatient.fullName} and synced to their Client Portal!`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }
  };

  const matchesFilter = (patientId: string, patientName: string, email?: string) => {
    const byPatient = selectedPatientId === 'ALL' || patientId === selectedPatientId;
    const q = searchTerm.trim().toLowerCase();
    const bySearch =
      !q ||
      patientName.toLowerCase().includes(q) ||
      (email ? email.toLowerCase().includes(q) : false);
    return byPatient && bySearch;
  };

  const filteredPatients = patients.filter((p) =>
    matchesFilter(p.uid, p.fullName, p.email)
  );
  const filteredAppointments = appointments.filter((a) =>
    matchesFilter(a.patientId, a.patientName, a.patientEmail)
  );
  const filteredMedications = medications.filter((m) =>
    matchesFilter(m.patientId, m.patientName)
  );
  const filteredIntakes = intakes.filter((i) => matchesFilter(i.patientId, i.patientName));
  const filteredAssessments = assessments.filter((a) =>
    matchesFilter(a.patientId, a.patientName)
  );
  const filteredMessages = messages.filter((m) => matchesFilter(m.patientId, m.patientName));
  const filteredInvoices = invoices.filter((i) => matchesFilter(i.patientId, i.patientName));

  const pendingRefillsCount = medications.filter(
    (m) => m.refillStatus === 'refill_requested'
  ).length;
  const completedIntakesCount = intakes.filter((i) => i.status === 'completed').length;
  const unreadPatientMsgsCount = messages.filter(
    (m) => m.senderRole === 'patient' && !m.read
  ).length;
  const totalRevenueDisbursed = invoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.amount, 0);

  const handleUpdateAppointmentStatus = async (
    id: string,
    status: 'confirmed' | 'completed' | 'cancelled'
  ) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status,
        updatedAt: new Date().toISOString(),
      });
      showBanner(`Appointment marked as ${status}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleSavePatientCarePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChartPatient) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', activeChartPatient.uid), {
        diagnosis: sanitizeClinicalInput(careDiagnosis, 300),
        clinicalRecommendations: sanitizeClinicalInput(careRecommendations, 2000),
        treatmentPlanNotes: sanitizeClinicalInput(careTreatmentNotes, 3000),
        sharedResources: careResources,
        updatedAt: now,
      });
      showBanner(
        `Care Plan, Recommended Medications & Links published live to ${activeChartPatient.fullName}'s Client Portal!`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${activeChartPatient.uid}`);
    }
  };

  const handleAddSharedResourceToPlan = () => {
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
    const formattedUrl = newResourceUrl.trim().startsWith('http')
      ? newResourceUrl.trim()
      : `https://${newResourceUrl.trim()}`;
    const updated: SharedPatientResource[] = [
      ...careResources,
      {
        title: sanitizeClinicalInput(newResourceTitle.trim(), 140),
        url: formattedUrl,
        addedAt: new Date().toISOString(),
      },
    ];
    setCareResources(updated);
    setNewResourceTitle('');
    setNewResourceUrl('');
  };

  const handleRemoveSharedResource = (idx: number) => {
    setCareResources(careResources.filter((_, i) => i !== idx));
  };

  const handlePrescribeMedication = async (e: React.FormEvent, targetOverrideId?: string) => {
    e.preventDefault();
    const targetId = targetOverrideId || rxPatientId;
    if (!targetId || !rxName.trim() || !rxDosage.trim()) return;
    const targetPatient = patients.find((p) => p.uid === targetId);
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'medications'), {
        patientId: targetId,
        patientName: targetPatient?.fullName || 'Patient',
        medicationName: sanitizeClinicalInput(rxName.trim(), 180),
        dosage: sanitizeClinicalInput(rxDosage.trim(), 90),
        frequency: sanitizeClinicalInput(rxFrequency.trim(), 140),
        instructions: sanitizeClinicalInput(rxInstructions.trim(), 1000),
        pharmacy: sanitizeClinicalInput(
          rxPharmacy.trim() || targetPatient?.preferredPharmacy || 'On File',
          200
        ),
        refillsRemaining: Number(rxRefills),
        refillStatus: 'active',
        prescribedBy: 'Brenda Hobyani, PMHNP-BC',
        updatedAt: now,
      });
      setRxName('');
      setRxDosage('');
      showBanner(
        `Added ${rxName.trim()} (${rxDosage.trim()}) to ${
          targetPatient?.fullName || 'patient'
        }'s portal chart!`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'medications');
    }
  };

  const startEditingMedication = (med: MedicationRecord) => {
    setEditingMedId(med.id);
    setEditMedName(med.medicationName);
    setEditMedDosage(med.dosage);
    setEditMedFrequency(med.frequency);
    setEditMedInstructions(med.instructions || '');
    setEditMedPharmacy(med.pharmacy || '');
    setEditMedRefills(med.refillsRemaining);
    setEditMedStatus(med.refillStatus);
  };

  const handleSaveEditedMedication = async (medId: string) => {
    if (!editMedName.trim() || !editMedDosage.trim()) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'medications', medId), {
        medicationName: sanitizeClinicalInput(editMedName.trim(), 180),
        dosage: sanitizeClinicalInput(editMedDosage.trim(), 90),
        frequency: sanitizeClinicalInput(editMedFrequency.trim(), 140),
        instructions: sanitizeClinicalInput(editMedInstructions.trim(), 1000),
        pharmacy: sanitizeClinicalInput(editMedPharmacy.trim(), 200),
        refillsRemaining: Math.max(0, Math.min(99, Number(editMedRefills) || 0)),
        refillStatus: editMedStatus,
        updatedAt: now,
      });
      setEditingMedId(null);
      showBanner('Medication updated in real time on the client portal.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `medications/${medId}`);
    }
  };

  const handleDiscontinueOrDeleteMedication = async (
    med: MedicationRecord,
    mode: 'discontinue' | 'delete'
  ) => {
    try {
      if (mode === 'delete') {
        await deleteDoc(doc(db, 'medications', med.id));
        showBanner(`Removed ${med.medicationName} from ${med.patientName}'s chart.`);
      } else {
        await updateDoc(doc(db, 'medications', med.id), {
          refillStatus: 'discontinued',
          refillsRemaining: 0,
          updatedAt: new Date().toISOString(),
        });
        showBanner(`Marked ${med.medicationName} as discontinued on ${med.patientName}'s portal.`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `medications/${med.id}`);
    }
  };

  const handleSendProviderMessage = async (
    e: React.FormEvent,
    targetOverrideId?: string
  ) => {
    e.preventDefault();
    const targetId = targetOverrideId || replyPatientId;
    if (!targetId || !replySubject.trim() || !replyBody.trim()) return;
    const targetPatient = patients.find((p) => p.uid === targetId);
    const now = new Date().toISOString();
    const cleanSubject = sanitizeClinicalInput(replySubject.trim(), 200);
    const cleanBody = replyBody.trim().slice(0, 4500);
    try {
      await addDoc(collection(db, 'messages'), {
        patientId: targetId,
        patientName: targetPatient?.fullName || 'Patient',
        senderId: currentUser.uid,
        senderName: 'Brenda Hobyani, PMHNP-BC',
        senderRole: 'provider',
        subject: cleanSubject,
        body: cleanBody,
        read: false,
        createdAt: now,
      });

      // Also notify the patient via email that Brenda Hobyani sent a portal message/link
      if (targetPatient?.email) {
        dispatchPortalMessageEmailAlert({
          direction: 'provider_to_patient',
          patientName: targetPatient.fullName,
          patientEmail: targetPatient.email,
          subject: cleanSubject,
          body: cleanBody,
        });
      }

      setReplySubject('');
      setReplyBody('');
      showBanner(
        `Message delivered to ${targetPatient?.fullName || 'Patient'}'s Portal & Email!`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  const handleAssignIntakeForm = async (
    patient: PortalUser,
    formType: IntakeFormType
  ) => {
    const titles: Record<IntakeFormType, string> = {
      'comprehensive-psychiatric-intake':
        'Comprehensive Psychiatric Evaluation Intake (Adults, Teens & Children)',
      'telehealth-consent':
        'Texas 100% Telehealth Informed Consent & HIPAA Privacy Agreement',
      'medical-history': 'Medical, Allergy & Medication History Questionnaire',
    };
    try {
      await addDoc(collection(db, 'intakes'), {
        patientId: patient.uid,
        patientName: patient.fullName,
        formType,
        title: titles[formType],
        status: 'pending',
        responses: {},
        assignedAt: new Date().toISOString(),
      });
      showBanner(`Assigned "${titles[formType]}" to ${patient.fullName}'s Client Portal.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'intakes');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent, targetOverrideId?: string) => {
    e.preventDefault();
    const targetId = targetOverrideId || invPatientId;
    if (!targetId || !invDesc.trim()) return;
    const targetPatient = patients.find((p) => p.uid === targetId);
    const now = new Date().toISOString();
    const total = Number(invTotal) || 0;
    const covered = Number(invCovered) || 0;
    const resp = Math.max(0, total - covered);
    try {
      await addDoc(collection(db, 'invoices'), {
        patientId: targetId,
        patientName: targetPatient?.fullName || 'Patient',
        description: sanitizeClinicalInput(invDesc.trim(), 220),
        serviceDate: now.split('T')[0],
        amount: total,
        insuranceCoveredAmount: covered,
        patientResponsibility: resp,
        status: 'due',
        createdAt: now,
      });
      setInvDesc('');
      setInvTotal(0);
      setInvCovered(0);
      showBanner(`Billing statement posted to ${targetPatient?.fullName || 'patient'}'s portal.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    }
  };

  const handleMarkInvoicePaid = async (invId: string) => {
    try {
      await updateDoc(doc(db, 'invoices', invId), {
        status: 'paid',
        paidAt: new Date().toISOString(),
      });
      showBanner('Statement marked as Paid.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invId}`);
    }
  };

  const insertLinkIntoReply = (label: string, url: string) => {
    const snippet = `\n${label}: ${url}\n`;
    setReplyBody((prev) => `${prev}${snippet}`);
  };

  // ============================================================================
  // ADD NEW PATIENT MODAL (Accessible from Patients Directory & Dedicated Patient Page)
  // ============================================================================
  const renderAddPatientModal = () =>
    showAddPatientModal ? (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white border border-stone-200 rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E7206]">
                Admin Clinical Registry
              </span>
              <h3 className="text-lg font-bold font-portal-heading text-stone-900">
                Add / Register New Patient to Database
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPatientModal(false)}
              className="px-3 py-1.5 rounded-[10px] bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700 cursor-pointer"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleCreateNewPatientRecord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Jenkins"
                  value={newPatFullName}
                  onChange={(e) => setNewPatFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Patient Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="patient@example.com"
                  value={newPatEmail}
                  onChange={(e) => setNewPatEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(432) 555-0199"
                  value={newPatPhone}
                  onChange={(e) => setNewPatPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={newPatDob}
                  onChange={(e) => setNewPatDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Biological Sex
                </label>
                <select
                  value={newPatSex}
                  onChange={(e) => setNewPatSex(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Primary Insurance
                </label>
                <select
                  value={newPatInsurance}
                  onChange={(e) => setNewPatInsurance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Preferred Texas Pharmacy
                </label>
                <input
                  type="text"
                  placeholder="e.g., H-E-B / Walgreens / CVS (Texas)"
                  value={newPatPharmacy}
                  onChange={(e) => setNewPatPharmacy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Initial Diagnosis / Clinical Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g., GAD, ADHD, MDD"
                  value={newPatDiagnosis}
                  onChange={(e) => setNewPatDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Residential Address (Texas Telehealth Location)
              </label>
              <input
                type="text"
                placeholder="Street Address, City, TX ZIP"
                value={newPatAddress}
                onChange={(e) => setNewPatAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPatientModal(false)}
                className="px-4 py-2.5 rounded-[12px] border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer shadow-xs"
              >
                Create Patient &amp; Open Dedicated Page →
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  // ============================================================================
  // DEDICATED INDIVIDUAL PATIENT PAGE (Full-Screen Admin Patient Command Center)
  // ============================================================================
  if (activeChartPatient || activeSubTab === 'patient-page') {
    if (!activeChartPatient) {
      return (
        <div className="space-y-6 font-portal-body">
          {renderAddPatientModal()}
          <div className="bg-white portal-card p-8 text-center space-y-4">
            <h2 className="text-xl font-bold font-portal-heading text-stone-900">
              Dedicated Patient Page
            </h2>
            <p className="text-xs text-stone-600 max-w-md mx-auto">
              Select a registered patient or create a new patient chart to open their dedicated
              clinical workspace.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddPatientModal(true)}
                className="px-5 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
              >
                + Add / Register New Patient
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('patients')}
                className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
              >
                View All Patients Directory
              </button>
            </div>
          </div>
        </div>
      );
    }

    const patientEmailLower = (activeChartPatient.email || '').toLowerCase();
    const patientAppts = appointments.filter(
      (a) =>
        a.patientId === activeChartPatient.uid ||
        (patientEmailLower && (a.patientEmail || '').toLowerCase() === patientEmailLower)
    );
    const patientMeds = medications.filter((m) => m.patientId === activeChartPatient.uid);
    const patientMsgs = messages.filter((m) => m.patientId === activeChartPatient.uid);
    const patientIntakes = intakes.filter((i) => i.patientId === activeChartPatient.uid);
    const patientAssessments = assessments.filter((a) => a.patientId === activeChartPatient.uid);
    const patientInvoices = invoices.filter((i) => i.patientId === activeChartPatient.uid);
    const patientRoomUrl =
      patientAppts[0]?.telehealthUrl || generateTelehealthRoomUrl(activeChartPatient.fullName);

    const handleLaunchDedicatedPatientVideo = () => {
      if (patientAppts[0]) {
        onLaunchTelehealth(patientAppts[0]);
      } else {
        const now = new Date().toISOString();
        onLaunchTelehealth({
          id: `instant_${activeChartPatient.uid}`,
          patientId: activeChartPatient.uid,
          patientName: activeChartPatient.fullName,
          patientEmail: activeChartPatient.email,
          patientPhone: activeChartPatient.phone || '',
          serviceType: '100% Telehealth Video Consultation',
          conditionReason: activeChartPatient.diagnosis || 'Psychiatric Evaluation & Follow-Up',
          preferredDate: now.split('T')[0],
          preferredTime: 'Live Instant Session',
          insuranceProvider: activeChartPatient.insuranceProvider || 'Verified',
          status: 'confirmed',
          telehealthUrl: patientRoomUrl,
          preVisitScreenerCompleted: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    };

    return (
      <div className="space-y-6 font-portal-body">
        {renderAddPatientModal()}

        {statusFeedback && (
          <div className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
            <button
              onClick={() => setStatusFeedback(null)}
              className="text-emerald-700 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Dedicated Patient Page Header & Quick Patient Switcher */}
        <div className="bg-[#0A0A0A] text-white rounded-[32px] p-6 sm:p-8 border border-[#D4AF37]/40 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <button
              type="button"
              onClick={() => {
                setActiveChartPatientId(null);
                setActiveSubTab('patients');
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#D4AF37] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Patients Directory</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Switch Patient:
              </label>
              <select
                value={activeChartPatient.uid}
                onChange={(e) => openPatientChart(e.target.value)}
                className="px-3.5 py-2 rounded-[12px] bg-white/10 border border-[#D4AF37]/50 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {patients.map((p) => (
                  <option key={p.uid} value={p.uid} className="text-stone-900 bg-white">
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddPatientModal(true)}
                className="px-3 py-2 rounded-[12px] bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Patient</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-[12px] bg-[#D4AF37] text-[#1C1917] text-[11px] font-bold uppercase tracking-wider">
                  Dedicated Patient Page
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-portal-heading text-white">
                  {activeChartPatient.fullName}
                </h2>
                {activeChartPatient.diagnosis && (
                  <span className="px-3 py-1 rounded-[12px] bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold">
                    Dx: {activeChartPatient.diagnosis}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-[10px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold">
                  {activeChartPatient.registrationCompleted
                    ? 'Full Profile Verified'
                    : 'Active Portal Account'}
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                DOB:{' '}
                <strong className="text-[#D4AF37]">
                  {activeChartPatient.dateOfBirth || 'Not entered yet'}
                </strong>{' '}
                {activeChartPatient.biologicalSex ? (
                  <>
                    · Sex: <strong className="text-white">{activeChartPatient.biologicalSex}</strong>{' '}
                  </>
                ) : null}
                · Phone:{' '}
                <strong className="text-white">{activeChartPatient.phone || 'Not listed'}</strong> ·
                Email: <strong className="text-white">{activeChartPatient.email}</strong>
                <br />
                Address:{' '}
                <strong className="text-white">
                  {activeChartPatient.address || 'Texas (Telehealth)'}
                </strong>{' '}
                · Emergency Contact:{' '}
                <strong className="text-white">
                  {activeChartPatient.emergencyContact || 'Not listed'}
                </strong>
                <br />
                Insurance:{' '}
                <strong className="text-[#D4AF37]">
                  {activeChartPatient.insuranceProvider || 'Self-Pay / Unspecified'}
                  {activeChartPatient.insuranceMemberId
                    ? ` (Member ID: ${activeChartPatient.insuranceMemberId}${
                        activeChartPatient.insuranceGroupNumber
                          ? `, Grp: ${activeChartPatient.insuranceGroupNumber}`
                          : ''
                      })`
                    : ''}
                </strong>{' '}
                · Pharmacy:{' '}
                <strong className="text-white">
                  {activeChartPatient.preferredPharmacy || 'Not set'}
                </strong>
                {activeChartPatient.primaryConcern ? (
                  <>
                    {' '}
                    · Chief Concern:{' '}
                    <strong className="text-[#D4AF37]">{activeChartPatient.primaryConcern}</strong>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingDemographics(!isEditingDemographics)}
                className="px-4 py-2.5 rounded-[12px] bg-white/10 hover:bg-white/15 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {isEditingDemographics ? 'Close Profile Editor' : 'Edit Patient Demographics'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLaunchDedicatedPatientVideo}
                className="px-4 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Video className="w-4 h-4" />
                <span>Launch Patient Video Room</span>
              </button>
            </div>
          </div>

          {/* Quick Patient KPI Summary Strip inside Dedicated Page Header */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-[16px] bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Active Medications
              </p>
              <p className="text-lg font-bold font-portal-heading tabular-nums text-[#D4AF37] mt-0.5">
                {patientMeds.length} Rx
              </p>
            </div>
            <div className="p-3 rounded-[16px] bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Telehealth Visits
              </p>
              <p className="text-lg font-bold font-portal-heading tabular-nums text-white mt-0.5">
                {patientAppts.length} Visit(s)
              </p>
            </div>
            <div className="p-3 rounded-[16px] bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Signed Intakes
              </p>
              <p className="text-lg font-bold font-portal-heading tabular-nums text-white mt-0.5">
                {patientIntakes.filter((i) => i.status === 'completed').length} /{' '}
                {patientIntakes.length}
              </p>
            </div>
            <div className="p-3 rounded-[16px] bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                PHQ-9 / GAD-7 Logs
              </p>
              <p className="text-lg font-bold font-portal-heading tabular-nums text-white mt-0.5">
                {patientAssessments.length} Submitted
              </p>
            </div>
            <div className="p-3 rounded-[16px] bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Direct Messages
              </p>
              <p className="text-lg font-bold font-portal-heading tabular-nums text-[#D4AF37] mt-0.5">
                {patientMsgs.length} Thread(s)
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Patient Page Section Sub-Navigation Bar */}
        <div className="bg-white portal-card p-3.5 flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Complete Patient Overview (All-in-One)' },
            { id: 'demographics', label: 'Demographics & Insurance' },
            { id: 'careplan', label: 'Care Plan & Portal Links' },
            { id: 'medications', label: `Medications (${patientMeds.length})` },
            { id: 'appointments', label: `Visits & Telehealth (${patientAppts.length})` },
            {
              id: 'intakes',
              label: `Intakes & Scales (${patientIntakes.length + patientAssessments.length})`,
            },
            { id: 'messages', label: `1-on-1 Messages (${patientMsgs.length})` },
            { id: 'billing', label: `Billing (${patientInvoices.length})` },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setPatientPageSection(sec.id as typeof patientPageSection);
                if (sec.id === 'demographics') {
                  setIsEditingDemographics(true);
                }
              }}
              className={`px-3.5 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                patientPageSection === sec.id
                  ? 'bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/50 shadow-xs'
                  : 'bg-[#FAF9F5] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Editable Patient Demographics & Insurance Record Panel */}
        {(isEditingDemographics || patientPageSection === 'demographics') && (
          <form
            onSubmit={handleSavePatientDemographics}
            className="bg-white portal-card p-6 space-y-4 border border-[#D4AF37]"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E7206]">
                  Patient Registration Record
                </span>
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Edit {activeChartPatient.fullName}'s Demographics, Insurance &amp; Pharmacy
                </h3>
              </div>
              {patientPageSection !== 'demographics' && (
                <button
                  type="button"
                  onClick={() => setIsEditingDemographics(false)}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Close Editor
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={demoFullName}
                  onChange={(e) => setDemoFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={demoDob}
                  onChange={(e) => setDemoDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Biological Sex
                </label>
                <select
                  value={demoSex}
                  onChange={(e) => setDemoSex(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={demoPhone}
                  onChange={(e) => setDemoPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Email Address (Account ID)
                </label>
                <input
                  type="email"
                  disabled
                  value={demoEmail}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-stone-100 border border-stone-200 text-xs text-stone-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Emergency Contact (Name &amp; Phone)
                </label>
                <input
                  type="text"
                  value={demoEmergencyContact}
                  onChange={(e) => setDemoEmergencyContact(e.target.value)}
                  placeholder="Name (Relationship) - Phone"
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Residential Address (Texas Telehealth Location)
                </label>
                <input
                  type="text"
                  value={demoAddress}
                  onChange={(e) => setDemoAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Preferred Texas Pharmacy
                </label>
                <input
                  type="text"
                  value={demoPharmacy}
                  onChange={(e) => setDemoPharmacy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Primary Insurance Carrier
                </label>
                <input
                  type="text"
                  value={demoInsurance}
                  onChange={(e) => setDemoInsurance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Member / Policy ID
                </label>
                <input
                  type="text"
                  value={demoMemberId}
                  onChange={(e) => setDemoMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Group Number
                </label>
                <input
                  type="text"
                  value={demoGroupNumber}
                  onChange={(e) => setDemoGroupNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Primary Clinical Concern
                </label>
                <input
                  type="text"
                  value={demoPrimaryConcern}
                  onChange={(e) => setDemoPrimaryConcern(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Patient Demographics &amp; Insurance Record
              </button>
            </div>
          </form>
        )}

        {/* Two-Column Patient Chart Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Care Plan, Medications, Visits, Intakes & Billing */}
          <div className="xl:col-span-7 space-y-6">
            {/* 1. Care Plan, Diagnosis, Drug Recommendations & Shared Links (Reflects on Client Portal) */}
            {(patientPageSection === 'all' || patientPageSection === 'careplan') && (
              <form
                onSubmit={handleSavePatientCarePlan}
                className="bg-white portal-card p-6 space-y-4 border border-[#D4AF37]/40"
              >
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#9E7206]" />
                    <div>
                      <h3 className="text-base font-bold font-portal-heading text-stone-900">
                        Patient Care Plan, Recommended Drugs &amp; Portal Links
                      </h3>
                      <p className="text-xs text-stone-500">
                        Everything saved here reflects immediately on {activeChartPatient.fullName}'s
                        Client Portal Overview &amp; Medications tabs
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[10px]">
                    Live Client Sync
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Clinical Diagnosis / Primary Focus
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Generalized Anxiety Disorder (GAD), ADHD Combined Type, Major Depressive Disorder"
                    value={careDiagnosis}
                    onChange={(e) => setCareDiagnosis(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Recommended Medications &amp; Dosing Regimen Summary (Visible on Client Portal)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Continue Sertraline 50mg every morning with food. Optional Hydroxyzine 25mg as needed for acute evening anxiety."
                    value={careRecommendations}
                    onChange={(e) => setCareRecommendations(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Treatment Plan Notes, Therapy Goals &amp; Follow-Up Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Complete PHQ-9 & GAD-7 weekly, maintain 7.5 hours sleep hygiene, schedule 4-week telehealth follow-up."
                    value={careTreatmentNotes}
                    onChange={(e) => setCareTreatmentNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>

                {/* Pinned Links / Resources for this Client */}
                <div className="p-4 rounded-[20px] bg-[#FAF9F5] border border-stone-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-[#9E7206]" />
                      <span>Pinned Links on {activeChartPatient.fullName}'s Portal</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setNewResourceTitle('Join HIPAA Telehealth Video Room');
                          setNewResourceUrl(patientRoomUrl);
                        }}
                        className="px-2.5 py-1 rounded-[8px] bg-white border border-stone-200 text-[10px] font-semibold text-[#9E7206] hover:border-[#D4AF37] cursor-pointer"
                      >
                        + Preset: Video Room Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewResourceTitle('Schedule Next Telehealth Follow-Up');
                          setNewResourceUrl('https://goldenmindpsychiatry.org/?page=telehealth');
                        }}
                        className="px-2.5 py-1 rounded-[8px] bg-white border border-stone-200 text-[10px] font-semibold text-[#9E7206] hover:border-[#D4AF37] cursor-pointer"
                      >
                        + Preset: Booking Link
                      </button>
                    </div>
                  </div>

                  {careResources.length > 0 && (
                    <div className="space-y-2">
                      {careResources.map((res, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-[12px] border border-stone-200 text-xs"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-bold text-stone-900">{res.title}: </span>
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#9E7206] underline"
                            >
                              {res.url}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSharedResource(idx)}
                            className="text-red-600 hover:text-red-800 text-[11px] font-semibold shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Link Title (e.g., Telehealth Video Room or Lab Order)"
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                      className="sm:col-span-5 px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                      className="sm:col-span-5 px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSharedResourceToPlan}
                      className="sm:col-span-2 py-2 px-3 rounded-[10px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                    >
                      Add Link
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save &amp; Publish Care Plan to {activeChartPatient.fullName}'s Portal
                </button>
              </form>
            )}

            {/* 2. Patient's Recommended Medications & Prescriptions (Add, Edit, Approve, Discontinue) */}
            {(patientPageSection === 'all' || patientPageSection === 'medications') && (
              <div className="bg-white portal-card p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold font-portal-heading text-stone-900">
                      {activeChartPatient.fullName}'s Medications &amp; Prescriptions (
                      {patientMeds.length})
                    </h3>
                    <p className="text-xs text-stone-500">
                      Add, edit dosage/instructions, approve refills, or discontinue drugs in real
                      time
                    </p>
                  </div>
                </div>

                {patientMeds.length === 0 ? (
                  <p className="text-xs text-stone-500 py-2">
                    No medications on {activeChartPatient.fullName}'s chart yet. Use the form below
                    to add a recommended medication.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {patientMeds.map((med) => (
                      <div key={med.id} className="py-4 space-y-3">
                        {editingMedId === med.id ? (
                          <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-[#D4AF37] space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                  Drug Name
                                </label>
                                <input
                                  type="text"
                                  value={editMedName}
                                  onChange={(e) => setEditMedName(e.target.value)}
                                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                  Dosage
                                </label>
                                <input
                                  type="text"
                                  value={editMedDosage}
                                  onChange={(e) => setEditMedDosage(e.target.value)}
                                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs font-portal-heading tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                  Frequency
                                </label>
                                <input
                                  type="text"
                                  value={editMedFrequency}
                                  onChange={(e) => setEditMedFrequency(e.target.value)}
                                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                  Pharmacy
                                </label>
                                <input
                                  type="text"
                                  value={editMedPharmacy}
                                  onChange={(e) => setEditMedPharmacy(e.target.value)}
                                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                  Refills Remaining
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={99}
                                  value={editMedRefills}
                                  onChange={(e) => setEditMedRefills(Number(e.target.value))}
                                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs font-portal-heading tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                  Status
                                </label>
                                <select
                                  value={editMedStatus}
                                  onChange={(e) => setEditMedStatus(e.target.value as RefillStatus)}
                                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                                >
                                  <option value="active">Active</option>
                                  <option value="approved_sent">Approved &amp; Sent to Pharmacy</option>
                                  <option value="refill_requested">Refill Requested</option>
                                  <option value="denied">Follow-Up Required</option>
                                  <option value="discontinued">Discontinued</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                                Patient Instructions
                              </label>
                              <input
                                type="text"
                                value={editMedInstructions}
                                onChange={(e) => setEditMedInstructions(e.target.value)}
                                className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEditedMedication(med.id)}
                                className="px-4 py-2 rounded-[10px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                              >
                                Save Changes to Portal
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingMedId(null)}
                                className="px-3 py-2 rounded-[10px] border border-stone-300 text-stone-600 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm font-portal-heading text-stone-900">
                                  {med.medicationName} ({med.dosage})
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-[10px] text-[10px] font-bold uppercase ${
                                    med.refillStatus === 'approved_sent'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : med.refillStatus === 'refill_requested'
                                      ? 'bg-[#FAF6EA] text-[#9E7206]'
                                      : med.refillStatus === 'discontinued' ||
                                        med.refillStatus === 'denied'
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {med.refillStatus.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600">
                                {med.frequency} · Pharmacy: {med.pharmacy || 'On File'} ·{' '}
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

                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditingMedication(med)}
                                className="px-3 py-1.5 rounded-[10px] border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Drug / Dose</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  providerProcessRefill({
                                    medicationId: med.id,
                                    patientId: med.patientId,
                                    patientName: med.patientName,
                                    medicationName: med.medicationName,
                                    dosage: med.dosage,
                                    pharmacy: med.pharmacy,
                                    currentRefills: med.refillsRemaining,
                                    decision: 'approved_sent',
                                  })
                                }
                                className="px-3 py-1.5 rounded-[10px] bg-[#0A0A0A] text-[#D4AF37] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve Refill</span>
                              </button>
                              {med.refillStatus !== 'discontinued' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDiscontinueOrDeleteMedication(med, 'discontinue')
                                  }
                                  className="px-2.5 py-1.5 rounded-[10px] border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold cursor-pointer"
                                >
                                  Discontinue
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDiscontinueOrDeleteMedication(med, 'delete')}
                                className="p-1.5 rounded-[10px] border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Remove medication from chart"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Recommended Medication directly to this patient's chart */}
                <form
                  onSubmit={(e) => handlePrescribeMedication(e, activeChartPatient.uid)}
                  className="pt-4 border-t border-stone-200 space-y-3"
                >
                  <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#9E7206]" />
                    <span>Add / Recommend New Medication for {activeChartPatient.fullName}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Drug Name (e.g. Sertraline)"
                      value={rxName}
                      onChange={(e) => setRxName(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Dosage (e.g. 50 mg)"
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Frequency (e.g. Once daily)"
                      value={rxFrequency}
                      onChange={(e) => setRxFrequency(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Pharmacy (e.g. Walgreens / CVS)"
                      value={rxPharmacy}
                      onChange={(e) => setRxPharmacy(e.target.value)}
                      className="sm:col-span-2 px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                    <input
                      type="number"
                      min={0}
                      max={12}
                      placeholder="Refills"
                      value={rxRefills}
                      onChange={(e) => setRxRefills(Number(e.target.value))}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Clinical dosing & safety instructions"
                    value={rxInstructions}
                    onChange={(e) => setRxInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                  >
                    Add Medication to {activeChartPatient.fullName}'s Portal
                  </button>
                </form>
              </div>
            )}

            {/* 3. Dedicated Patient Telehealth Visits & Appointment Scheduler */}
            {(patientPageSection === 'all' || patientPageSection === 'appointments') && (
              <div className="bg-white portal-card p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold font-portal-heading text-stone-900">
                      Telehealth Visits &amp; Appointment Scheduler ({patientAppts.length})
                    </h3>
                    <p className="text-xs text-stone-500">
                      Manage {activeChartPatient.fullName}'s visits or schedule a new telehealth
                      session
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLaunchDedicatedPatientVideo}
                    className="px-3.5 py-2 rounded-[10px] bg-gold-gradient text-[#1C1917] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Launch Video Room</span>
                  </button>
                </div>

                {patientAppts.length === 0 ? (
                  <p className="text-xs text-stone-500">
                    No appointments scheduled yet for {activeChartPatient.fullName}. Use the form
                    below to schedule a session.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {patientAppts.map((appt) => (
                      <div
                        key={appt.id}
                        className="p-4 rounded-[16px] bg-[#FAF9F5] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs font-portal-heading text-stone-900">
                              {appt.serviceType}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-[8px] text-[10px] font-bold uppercase ${
                                appt.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : appt.status === 'completed'
                                  ? 'bg-stone-200 text-stone-700'
                                  : 'bg-[#FAF6EA] text-[#9E7206]'
                              }`}
                            >
                              {appt.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 font-portal-heading tabular-nums">
                            {appt.preferredDate} · {appt.preferredTime} · Focus:{' '}
                            {appt.conditionReason}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onLaunchTelehealth(appt)}
                            className="px-3 py-1.5 rounded-[10px] bg-[#0A0A0A] text-[#D4AF37] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video</span>
                          </button>
                          {appt.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAppointmentStatus(appt.id, 'confirmed')}
                              className="px-2.5 py-1.5 rounded-[10px] border border-emerald-300 text-emerald-700 text-xs font-semibold cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                          {appt.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAppointmentStatus(appt.id, 'completed')}
                              className="px-2.5 py-1.5 rounded-[10px] border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleSchedulePatientAppointment}
                  className="pt-3 border-t border-stone-200 space-y-3"
                >
                  <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#9E7206]" />
                    <span>Schedule New Telehealth Visit for {activeChartPatient.fullName}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <select
                      value={apptServiceType}
                      onChange={(e) => setApptServiceType(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    >
                      <option value="Follow-Up Telehealth Medication & Therapy Session">
                        Follow-Up Telehealth Medication &amp; Therapy Session
                      </option>
                      <option value="Comprehensive Psychiatric Evaluation (60 Min)">
                        Comprehensive Psychiatric Evaluation (60 Min)
                      </option>
                      <option value="ADHD Clinical Evaluation & Treatment Review">
                        ADHD Clinical Evaluation &amp; Treatment Review
                      </option>
                    </select>
                    <input
                      type="text"
                      placeholder="Clinical Focus"
                      value={apptReason}
                      onChange={(e) => setApptReason(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                    <input
                      type="date"
                      required
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                    <select
                      value={apptTime}
                      onChange={(e) => setApptTime(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    >
                      <option value="Mon–Thu Morning (9:00 AM - 12:00 PM)">
                        Mon–Thu Morning (9:00 AM - 12:00 PM)
                      </option>
                      <option value="Mon–Thu Afternoon (12:00 PM - 4:00 PM)">
                        Mon–Thu Afternoon (12:00 PM - 4:00 PM)
                      </option>
                      <option value="Friday Morning (9:00 AM - 1:00 PM)">
                        Friday Morning (9:00 AM - 1:00 PM)
                      </option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                  >
                    Confirm &amp; Publish Visit to {activeChartPatient.fullName}'s Portal
                  </button>
                </form>
              </div>
            )}

            {/* 4. Intake Forms, PHQ-9/GAD-7 & Billing Controls for this Patient */}
            {(patientPageSection === 'all' ||
              patientPageSection === 'intakes' ||
              patientPageSection === 'billing') && (
              <div className="bg-white portal-card p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold font-portal-heading text-stone-900">
                      Intake Forms, PHQ-9/GAD-7 &amp; Billing ({activeChartPatient.fullName})
                    </h3>
                    <p className="text-xs text-stone-500">
                      Assign intake questionnaires or post a copay statement to this patient's portal
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleAssignIntakeForm(
                          activeChartPatient,
                          'comprehensive-psychiatric-intake'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-[10px] bg-[#FAF6EA] border border-[#D4AF37]/40 text-[#9E7206] font-bold text-[11px] cursor-pointer"
                    >
                      + Assign Psychiatric Intake
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAssignIntakeForm(activeChartPatient, 'telehealth-consent')
                      }
                      className="px-2.5 py-1.5 rounded-[10px] bg-[#FAF6EA] border border-[#D4AF37]/40 text-[#9E7206] font-bold text-[11px] cursor-pointer"
                    >
                      + Assign Telehealth Consent
                    </button>
                  </div>
                </div>

                {/* Intakes Summary */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-800">
                    Assigned Intake Forms ({patientIntakes.length})
                  </p>
                  {patientIntakes.map((intake) => (
                    <div
                      key={intake.id}
                      className="p-3 rounded-[14px] bg-[#FAF9F5] border border-stone-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{intake.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-[8px] text-[10px] font-bold uppercase ${
                            intake.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#FAF6EA] text-[#9E7206]'
                          }`}
                        >
                          {intake.status}
                        </span>
                      </div>
                      {intake.responses && Object.keys(intake.responses).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-stone-600">
                          {Object.entries(intake.responses).map(([k, v]) => (
                            <div key={k}>
                              <strong className="text-stone-800 capitalize">
                                {k.replace(/([A-Z])/g, ' $1')}:{' '}
                              </strong>
                              <span>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recent PHQ-9 / GAD-7 Assessments */}
                {patientAssessments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <p className="text-xs font-bold text-stone-800">
                      Submitted PHQ-9 / GAD-7 &amp; Mood Logs ({patientAssessments.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {patientAssessments.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-stone-900">{a.type}</span>
                            <span className="text-[#9E7206] font-semibold ml-1.5">
                              ({a.severity})
                            </span>
                            <p className="text-[10px] text-stone-500">
                              {a.createdAt.split('T')[0]}
                            </p>
                          </div>
                          <span className="font-portal-heading tabular-nums font-bold text-sm text-stone-900">
                            {a.totalScore} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Billing Statement Form for this Patient */}
                <form
                  onSubmit={(e) => handleCreateInvoice(e, activeChartPatient.uid)}
                  className="pt-3 border-t border-stone-200 space-y-3"
                >
                  <p className="text-xs font-bold text-stone-800">
                    Issue Copay / Billing Statement to {activeChartPatient.fullName}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Service Description (e.g. Follow-Up)"
                      value={invDesc}
                      onChange={(e) => setInvDesc(e.target.value)}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Total Charge ($)"
                      value={invTotal || ''}
                      onChange={(e) => setInvTotal(Number(e.target.value))}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                    <input
                      type="number"
                      placeholder="Insurance Covered ($)"
                      value={invCovered || ''}
                      onChange={(e) => setInvCovered(Number(e.target.value))}
                      className="px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                  >
                    Post Statement to {activeChartPatient.fullName}'s Portal
                  </button>
                </form>

                {patientInvoices.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {patientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between text-xs p-2.5 rounded-[10px] bg-[#FAF9F5] border border-stone-200"
                      >
                        <div>
                          <span className="font-bold text-stone-900">{inv.description}</span>
                          <span className="text-stone-500 ml-2 font-portal-heading tabular-nums">
                            Copay: ${inv.patientResponsibility.toFixed(2)}
                          </span>
                        </div>
                        {inv.status === 'paid' ? (
                          <span className="text-emerald-700 font-bold text-[11px] uppercase">
                            Paid
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkInvoicePaid(inv.id)}
                            className="px-2.5 py-1 rounded-[8px] bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Direct 1-on-1 Patient Messaging & Link Sender */}
          <div className="xl:col-span-5 space-y-6">
            <div className="bg-white portal-card p-6 space-y-4 border border-[#D4AF37]/40">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-base font-bold font-portal-heading text-stone-900">
                    1-on-1 Portal Messaging with {activeChartPatient.fullName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Send messages and clickable links directly to {activeChartPatient.email}
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => handleSendProviderMessage(e, activeChartPatient.uid)}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Update for ${activeChartPatient.fullName}`}
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>

                {/* Quick-Insert Link Toolbar */}
                <div className="p-3 rounded-[14px] bg-[#FAF6EA] border border-[#D4AF37]/40 space-y-2">
                  <p className="text-[11px] font-bold text-[#9E7206] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>1-Click Insert Clickable Link into Message:</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        insertLinkIntoReply('Join Your HIPAA Telehealth Video Room', patientRoomUrl)
                      }
                      className="px-2.5 py-1 rounded-[8px] bg-white border border-[#D4AF37]/50 text-[11px] font-semibold text-stone-800 hover:bg-[#0A0A0A] hover:text-[#D4AF37] cursor-pointer"
                    >
                      + Telehealth Video Link
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertLinkIntoReply(
                          'Book Your Next Telehealth Follow-Up',
                          'https://goldenmindpsychiatry.org/?page=telehealth'
                        )
                      }
                      className="px-2.5 py-1 rounded-[8px] bg-white border border-[#D4AF37]/50 text-[11px] font-semibold text-stone-800 hover:bg-[#0A0A0A] hover:text-[#D4AF37] cursor-pointer"
                    >
                      + Booking Link
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertLinkIntoReply(
                          'Open Client Portal & PHQ-9 Check-In',
                          'https://goldenmindpsychiatry.org/?page=portal'
                        )
                      }
                      className="px-2.5 py-1 rounded-[8px] bg-white border border-[#D4AF37]/50 text-[11px] font-semibold text-stone-800 hover:bg-[#0A0A0A] hover:text-[#D4AF37] cursor-pointer"
                    >
                      + Portal Link
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Paste any custom link (https://...)"
                      value={customLinkToInsert}
                      onChange={(e) => setCustomLinkToInsert(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-white border border-stone-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!customLinkToInsert.trim()) return;
                        const formatted = customLinkToInsert.trim().startsWith('http')
                          ? customLinkToInsert.trim()
                          : `https://${customLinkToInsert.trim()}`;
                        insertLinkIntoReply('Shared Resource Link', formatted);
                        setCustomLinkToInsert('');
                      }}
                      className="px-3 py-1.5 rounded-[8px] bg-[#0A0A0A] text-[#D4AF37] text-xs font-bold cursor-pointer shrink-0"
                    >
                      Insert URL
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Message &amp; Clinical Links *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={`Write your message to ${activeChartPatient.fullName}... Any https:// link will automatically be clickable on their portal.`}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to {activeChartPatient.fullName}'s Portal &amp; Email</span>
                </button>
              </form>

              {/* Message Thread History for this Patient */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Message History with {activeChartPatient.fullName} ({patientMsgs.length})
                </h4>
                <div className="divide-y divide-stone-200 max-h-[420px] overflow-y-auto pr-1">
                  {patientMsgs.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">
                      No messages with this patient yet.
                    </p>
                  ) : (
                    patientMsgs.map((msg) => (
                      <div key={msg.id} className="py-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-bold ${
                              msg.senderRole === 'provider' ? 'text-[#9E7206]' : 'text-stone-900'
                            }`}
                          >
                            {msg.senderRole === 'provider'
                              ? 'Brenda Hobyani, PMHNP-BC (You)'
                              : `Patient: ${msg.senderName}`}
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-portal-body">
      {renderAddPatientModal()}

      {statusFeedback && (
        <div className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="text-emerald-700 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 4-Column Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Primary Dark Bento Card with Decorative Circle */}
        <div
          onClick={() => setActiveSubTab('patient-page')}
          className="bg-[#0A0A0A] text-white rounded-[32px] p-6 border border-[#D4AF37]/40 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
        >
          <div className="w-24 h-24 bg-white/5 absolute -right-4 -bottom-4 rounded-full pointer-events-none" />
          <div className="w-16 h-16 bg-[#D4AF37]/10 absolute right-8 -top-6 rounded-full pointer-events-none" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Dedicated Patient Pages
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-white mt-2">
            {patients.length} Registered
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-[#D4AF37] mt-3 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Open Dedicated Patient Page →</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div
          onClick={() => setActiveSubTab('refills')}
          className="bg-white portal-card p-6 cursor-pointer"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Rx &amp; Refill Approvals
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
            {pendingRefillsCount} Pending
          </p>
          <p className="text-[12px] text-[#9E7206] font-semibold mt-3">
            {medications.length} active prescriptions on chart
          </p>
        </div>

        {/* Stat Card 3 */}
        <div
          onClick={() => setActiveSubTab('intakes')}
          className="bg-white portal-card p-6 cursor-pointer"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Completed Intakes &amp; Scales
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
            {completedIntakesCount} / {intakes.length}
          </p>
          <p className="text-[12px] text-emerald-700 font-semibold mt-3">
            {assessments.length} PHQ-9 / GAD-7 logs synced
          </p>
        </div>

        {/* Stat Card 4 */}
        <div
          onClick={() => setActiveSubTab('messages')}
          className="bg-white portal-card p-6 cursor-pointer"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Patient Communications
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
            {unreadPatientMsgsCount} Unread
          </p>
          <p className="text-[12px] text-stone-500 font-medium mt-3">
            ${totalRevenueDisbursed.toFixed(2)} disbursed statements
          </p>
        </div>
      </div>

      {/* Filter & Sub-Navigation Controls */}
      <div className="bg-white portal-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'patients', label: `Patients Directory (${patients.length})`, icon: Users },
            { id: 'patient-page', label: 'Dedicated Patient Page', icon: UserCheck },
            { id: 'queue', label: 'Telehealth Queue', icon: Calendar },
            { id: 'refills', label: `Rx & Drugs (${medications.length})`, icon: Pill },
            { id: 'messages', label: `Messages & Links (${messages.length})`, icon: MessageSquare },
            { id: 'charts', label: 'PHQ-9 / GAD-7 Scales', icon: Activity },
            { id: 'intakes', label: 'Intake Forms', icon: FileText },
            { id: 'billing', label: 'Billing & Copays', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`px-4 py-2.5 rounded-[12px] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/50 shadow-xs'
                    : 'bg-[#FAF9F5] text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full bg-[#FAF9F5] border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <select
            value={selectedPatientId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedPatientId(val);
              if (val !== 'ALL') {
                setRxPatientId(val);
                setReplyPatientId(val);
                setInvPatientId(val);
                openPatientChart(val);
              }
            }}
            className="px-3.5 py-2 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">Jump to Patient Dedicated Page ({patients.length})</option>
            {patients.map((p) => (
              <option key={p.uid} value={p.uid}>
                {p.fullName} ({p.email})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAddPatientModal(true)}
            className="px-3.5 py-2 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Main 70/30 Two-Column Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 70% Column */}
        <div className="xl:col-span-8 space-y-6">
          {/* Sub-Tab 0: All Patients Database Directory */}
          {activeSubTab === 'patients' && (
            <div className="bg-white portal-card overflow-hidden">
              <div className="px-6 py-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold font-portal-heading text-stone-900">
                    All Registered Patients Directory &amp; Dedicated Pages
                  </h3>
                  <p className="text-xs text-stone-500">
                    Every patient has a dedicated, isolated clinical page. Click "Open Dedicated
                    Patient Page" to manage their demographics, diagnosis, medications, visits, and
                    messages.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/40 text-[#9E7206] text-xs font-bold">
                    {filteredPatients.length} Patient(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPatientModal(true)}
                    className="px-3.5 py-1.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Patient</span>
                  </button>
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-xs text-stone-500">
                    No patient records match your current search filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddPatientModal(true)}
                    className="px-4 py-2 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer"
                  >
                    + Register New Patient Record
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {filteredPatients.map((patient) => {
                    const pMeds = medications.filter((m) => m.patientId === patient.uid);
                    const pAppts = appointments.filter(
                      (a) =>
                        a.patientId === patient.uid ||
                        (a.patientEmail &&
                          patient.email &&
                          a.patientEmail.toLowerCase() === patient.email.toLowerCase())
                    );
                    const pMsgs = messages.filter((m) => m.patientId === patient.uid);
                    const pIntakes = intakes.filter((i) => i.patientId === patient.uid);
                    const initials = (patient.fullName || 'P')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={patient.uid}
                        className="p-6 hover:bg-stone-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#0A0A0A] border-2 border-[#D4AF37] text-[#D4AF37] font-portal-heading font-bold text-sm flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold font-portal-heading text-stone-900">
                                {patient.fullName}
                              </h4>
                              <span className="text-xs text-stone-500">{patient.email}</span>
                              {patient.role === 'provider' && (
                                <span className="px-2 py-0.5 rounded-[8px] bg-[#0A0A0A] text-[#D4AF37] text-[10px] font-bold uppercase">
                                  Admin / Provider
                                </span>
                              )}
                              {patient.diagnosis && (
                                <span className="px-2.5 py-0.5 rounded-[10px] bg-[#FAF6EA] border border-[#D4AF37]/40 text-[#9E7206] text-[11px] font-bold">
                                  Dx: {patient.diagnosis}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              DOB: <strong>{patient.dateOfBirth || 'Pending'}</strong>
                              {patient.biologicalSex ? ` (${patient.biologicalSex})` : ''} · Phone:{' '}
                              <strong>{patient.phone || 'Not listed'}</strong> · Insurance:{' '}
                              <strong>{patient.insuranceProvider || 'Not specified'}</strong>
                              {patient.insuranceMemberId ? ` (#${patient.insuranceMemberId})` : ''} ·
                              Pharmacy: {patient.preferredPharmacy || 'Not set'}
                              {patient.address ? ` · Address: ${patient.address}` : ''}
                              {patient.emergencyContact
                                ? ` · Emergency: ${patient.emergencyContact}`
                                : ''}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 font-portal-heading tabular-nums pt-0.5">
                              <span>{pMeds.length} Medication(s)</span>
                              <span>·</span>
                              <span>{pAppts.length} Visit(s)</span>
                              <span>·</span>
                              <span>
                                {pIntakes.filter((i) => i.status === 'completed').length}/
                                {pIntakes.length} Intakes Signed
                              </span>
                              <span>·</span>
                              <span>{pMsgs.length} Message(s)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openPatientChart(patient.uid)}
                            className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-stone-800 cursor-pointer shadow-xs"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Open Dedicated Patient Page →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 1: Engagement Requests & Payment History */}
          {activeSubTab === 'queue' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-lg font-bold font-portal-heading text-stone-900">
                      Patient Engagement Requests & Telehealth Queue
                    </h3>
                    <p className="text-xs text-stone-500">
                      Review new patient evaluations, verify PHQ-9/GAD-7 screeners, or launch video rooms
                    </p>
                  </div>
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="bg-white portal-card p-8 text-center text-xs text-stone-500">
                    No telehealth appointments match the current filter.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appt) => {
                      const initials = appt.patientName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <div key={appt.id} className="bg-white portal-card p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#0A0A0A] border-2 border-[#D4AF37] text-[#D4AF37] font-portal-heading font-bold text-sm flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-bold font-portal-heading text-stone-900">
                                    {appt.patientName}
                                  </h4>
                                  <span className="px-2.5 py-0.5 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[#9E7206] text-[11px] font-bold">
                                    {appt.serviceType}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-[12px] text-[11px] font-bold uppercase ${
                                      appt.status === 'confirmed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {appt.status}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-stone-800">
                                  Focus: {appt.conditionReason} ·{' '}
                                  <span className="text-stone-500 font-normal">
                                    {appt.insuranceProvider || 'Insurance Verified'}
                                  </span>
                                </p>
                                <p className="text-xs font-portal-heading tabular-nums text-stone-500">
                                  {appt.preferredDate} · {appt.preferredTime} ·{' '}
                                  {appt.preVisitScreenerCompleted
                                    ? 'Pre-Visit PHQ-9/GAD-7 Completed'
                                    : 'Awaiting Pre-Visit Screener'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {appt.patientId && appt.patientId !== 'guest' && (
                                <button
                                  type="button"
                                  onClick={() => openPatientChart(appt.patientId)}
                                  className="px-3.5 py-2.5 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[#9E7206] font-bold text-xs cursor-pointer"
                                >
                                  Open Chart
                                </button>
                              )}
                              <button
                                onClick={() => onLaunchTelehealth(appt)}
                                className="px-4 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-stone-800 cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Launch Video</span>
                              </button>
                              {appt.status !== 'completed' && (
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(appt.id, 'completed')}
                                  className="px-3.5 py-2.5 rounded-[12px] border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
                                >
                                  Mark Completed
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payment History Table */}
              <div className="bg-white portal-card overflow-hidden">
                <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold font-portal-heading text-stone-900">
                      Payment & Statement History
                    </h3>
                    <p className="text-xs text-stone-500">
                      Insurance disbursements and patient copay ledger
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('billing')}
                    className="px-3.5 py-2 rounded-[12px] bg-[#FAF6EA] text-[#9E7206] font-bold text-xs cursor-pointer"
                  >
                    Issue Statement
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF9F5] border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        <th className="py-3.5 px-5">Patient & Service</th>
                        <th className="py-3.5 px-5">Date</th>
                        <th className="py-3.5 px-5 text-right">Billed / Covered</th>
                        <th className="py-3.5 px-5 text-right">Copay</th>
                        <th className="py-3.5 px-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-xs">
                      {filteredInvoices.slice(0, 6).map((inv) => (
                        <tr key={inv.id} className="hover:bg-stone-50/80">
                          <td className="py-4 px-5">
                            <p className="font-bold text-stone-900">{inv.patientName}</p>
                            <p className="text-[11px] text-stone-500">{inv.description}</p>
                          </td>
                          <td className="py-4 px-5 font-portal-heading tabular-nums text-stone-600">
                            {inv.serviceDate}
                          </td>
                          <td className="py-4 px-5 text-right font-portal-heading tabular-nums text-stone-600">
                            ${inv.amount.toFixed(2)} / -${inv.insuranceCoveredAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-5 text-right font-portal-heading tabular-nums font-bold text-stone-900">
                            ${inv.patientResponsibility.toFixed(2)}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <span
                              className={`px-3 py-1 rounded-[12px] text-[11px] font-bold uppercase ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#FAF6EA] text-[#9E7206]'
                              }`}
                            >
                              {inv.status === 'paid' ? 'Disbursed' : 'Due'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Sub-Tab 2: Medications & Refill Approvals */}
          {activeSubTab === 'refills' && (
            <div className="space-y-6">
              <div className="bg-white portal-card p-6 space-y-4">
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Active Patient Prescriptions & Recommended Drugs
                </h3>
                {filteredMedications.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4">
                    No prescriptions on file yet. Use the form below to prescribe or recommend a
                    medication.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {filteredMedications.map((med) => (
                      <div key={med.id} className="py-4 space-y-3">
                        {editingMedId === med.id ? (
                          <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-[#D4AF37] space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <input
                                type="text"
                                value={editMedName}
                                onChange={(e) => setEditMedName(e.target.value)}
                                placeholder="Drug Name"
                                className="px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                              />
                              <input
                                type="text"
                                value={editMedDosage}
                                onChange={(e) => setEditMedDosage(e.target.value)}
                                placeholder="Dosage"
                                className="px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                              />
                              <input
                                type="text"
                                value={editMedFrequency}
                                onChange={(e) => setEditMedFrequency(e.target.value)}
                                placeholder="Frequency"
                                className="px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                              />
                            </div>
                            <input
                              type="text"
                              value={editMedInstructions}
                              onChange={(e) => setEditMedInstructions(e.target.value)}
                              placeholder="Instructions"
                              className="w-full px-3 py-2 rounded-[10px] bg-white border border-stone-200 text-xs"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEditedMedication(med.id)}
                                className="px-4 py-2 rounded-[10px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                              >
                                Save Drug Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingMedId(null)}
                                className="px-3 py-2 rounded-[10px] border border-stone-300 text-stone-600 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm font-portal-heading text-stone-900">
                                  {med.medicationName} ({med.dosage})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openPatientChart(med.patientId)}
                                  className="text-xs font-bold text-[#9E7206] hover:underline cursor-pointer"
                                >
                                  · Patient: {med.patientName} (Open Chart)
                                </button>
                              </div>
                              <p className="text-xs text-stone-600">
                                {med.frequency} · Pharmacy: {med.pharmacy || 'On File'} ·{' '}
                                <span className="font-portal-heading tabular-nums font-semibold">
                                  {med.refillsRemaining} refills remaining
                                </span>
                              </p>
                              <p className="text-[11px] font-medium">
                                Status:{' '}
                                <span
                                  className={
                                    med.refillStatus === 'refill_requested'
                                      ? 'text-[#9E7206] font-bold'
                                      : med.refillStatus === 'approved_sent'
                                      ? 'text-emerald-700 font-bold'
                                      : med.refillStatus === 'denied' ||
                                        med.refillStatus === 'discontinued'
                                      ? 'text-red-600 font-bold'
                                      : 'text-stone-700'
                                  }
                                >
                                  {med.refillStatus.replace('_', ' ').toUpperCase()}
                                </span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditingMedication(med)}
                                className="px-3 py-2 rounded-[12px] border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  providerProcessRefill({
                                    medicationId: med.id,
                                    patientId: med.patientId,
                                    patientName: med.patientName,
                                    medicationName: med.medicationName,
                                    dosage: med.dosage,
                                    pharmacy: med.pharmacy,
                                    currentRefills: med.refillsRemaining,
                                    decision: 'approved_sent',
                                  })
                                }
                                className="px-3.5 py-2 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve & e-Rx</span>
                              </button>
                              <button
                                onClick={() =>
                                  providerProcessRefill({
                                    medicationId: med.id,
                                    patientId: med.patientId,
                                    patientName: med.patientName,
                                    medicationName: med.medicationName,
                                    dosage: med.dosage,
                                    pharmacy: med.pharmacy,
                                    currentRefills: med.refillsRemaining,
                                    decision: 'denied',
                                  })
                                }
                                className="px-3 py-2 rounded-[12px] border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Follow-Up</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form
                onSubmit={handlePrescribeMedication}
                className="bg-white portal-card p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#B8860B]" />
                  <h3 className="text-base font-bold font-portal-heading text-stone-900">
                    Prescribe / Add Recommended Patient Medication
                  </h3>
                </div>

                <div className="p-3.5 rounded-[16px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[11px] text-stone-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#9E7206] shrink-0 mt-0.5" />
                  <span>
                    Clinical Reminder: Some psychiatric and anxiety medications can be habit forming.
                    Include clear dosing and habit-forming precautions in the patient instructions.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Select Patient
                  </label>
                  <select
                    value={rxPatientId}
                    onChange={(e) => setRxPatientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  >
                    {patients.map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.fullName} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Sertraline or Buspirone"
                      value={rxName}
                      onChange={(e) => setRxName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Dosage</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 50 mg"
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      required
                      value={rxFrequency}
                      onChange={(e) => setRxFrequency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Authorized Refills
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={rxRefills}
                      onChange={(e) => setRxRefills(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Clinical & Habit-Forming Safety Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={rxInstructions}
                    onChange={(e) => setRxInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer hover:bg-stone-800 transition-colors"
                >
                  Add Prescription to Patient Chart
                </button>
              </form>
            </div>
          )}

          {/* Sub-Tab 3: Longitudinal PHQ-9, GAD-7 & Daily Mood Scores */}
          {activeSubTab === 'charts' && (
            <div className="bg-white portal-card overflow-hidden">
              <div className="px-6 py-5 border-b border-stone-200">
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Patient PHQ-9, GAD-7 & Mood Symptom Logs
                </h3>
                <p className="text-xs text-stone-500">
                  Standardized rating scales submitted by patients prior to their telehealth visits
                </p>
              </div>
              {filteredAssessments.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  No symptom assessments logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 bg-[#FAF9F5] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        <th className="py-3.5 px-5">Patient</th>
                        <th className="py-3.5 px-5">Scale</th>
                        <th className="py-3.5 px-5 text-right">Score</th>
                        <th className="py-3.5 px-5">Severity</th>
                        <th className="py-3.5 px-5">Sleep & Meds</th>
                        <th className="py-3.5 px-5 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-xs">
                      {filteredAssessments.map((a) => (
                        <tr key={a.id} className="hover:bg-stone-50">
                          <td className="py-4 px-5 font-bold text-stone-900">
                            <button
                              type="button"
                              onClick={() => openPatientChart(a.patientId)}
                              className="hover:text-[#9E7206] hover:underline cursor-pointer"
                            >
                              {a.patientName}
                            </button>
                          </td>
                          <td className="py-4 px-5 font-portal-heading font-bold text-stone-800">
                            {a.type}
                          </td>
                          <td className="py-4 px-5 text-right font-portal-heading tabular-nums font-bold text-stone-900">
                            {a.totalScore}
                            {a.type === 'PHQ-9' ? ' / 27' : a.type === 'GAD-7' ? ' / 21' : ' / 10'}
                          </td>
                          <td className="py-4 px-5">
                            <span className="px-2.5 py-1 rounded-[12px] bg-[#FAF6EA] text-[#9E7206] font-bold text-[11px]">
                              {a.severity}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-portal-heading tabular-nums text-stone-600">
                            {a.sleepHours ?? 7.5}h · {a.medicationTaken ? 'Taken' : 'Skipped'}
                          </td>
                          <td className="py-4 px-5 text-right font-portal-heading tabular-nums text-stone-500">
                            {a.createdAt.split('T')[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 4: Submitted Digital Intake Forms */}
          {activeSubTab === 'intakes' && (
            <div className="bg-white portal-card p-6 space-y-4">
              <h3 className="text-base font-bold font-portal-heading text-stone-900">
                Patient Psychiatric Intake Forms & Telehealth Consents
              </h3>
              {filteredIntakes.length === 0 ? (
                <p className="text-xs text-stone-500">No intake forms assigned yet.</p>
              ) : (
                <div className="divide-y divide-stone-200">
                  {filteredIntakes.map((intake) => (
                    <div key={intake.id} className="py-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm font-portal-heading text-stone-900">
                            {intake.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPatientChart(intake.patientId)}
                            className="text-xs font-bold text-[#9E7206] hover:underline ml-2 cursor-pointer"
                          >
                            · Patient: {intake.patientName} (Open Chart)
                          </button>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-[12px] text-[11px] font-bold ${
                            intake.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#FAF6EA] text-[#9E7206]'
                          }`}
                        >
                          {intake.status === 'completed'
                            ? `Completed (${intake.completedAt?.split('T')[0] || 'Saved'})`
                            : 'Pending Completion'}
                        </span>
                      </div>
                      {intake.responses && Object.keys(intake.responses).length > 0 && (
                        <div className="p-4 rounded-[20px] bg-[#FAF9F5] border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {Object.entries(intake.responses).map(([k, v]) => (
                            <div key={k}>
                              <span className="font-semibold text-stone-700 capitalize">
                                {k.replace(/([A-Z])/g, ' $1')}:{' '}
                              </span>
                              <span className="text-stone-600">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 5: Direct Patient Messaging & Link Sharing */}
          {activeSubTab === 'messages' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSendProviderMessage}
                className="bg-white portal-card p-6 space-y-4 border border-[#D4AF37]/40"
              >
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Send Direct Portal Message & Links to Patient
                </h3>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Recipient Patient
                  </label>
                  <select
                    value={replyPatientId}
                    onChange={(e) => setReplyPatientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  >
                    {patients.map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.fullName} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick-Insert Link Bar */}
                <div className="p-3 rounded-[14px] bg-[#FAF6EA] border border-[#D4AF37]/40 space-y-2">
                  <p className="text-[11px] font-bold text-[#9E7206] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Quick-Insert Clickable Link into Message:</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        insertLinkIntoReply(
                          'Join Your HIPAA Telehealth Video Room',
                          generateTelehealthRoomUrl(replyPatientId)
                        )
                      }
                      className="px-2.5 py-1 rounded-[8px] bg-white border border-[#D4AF37]/50 text-[11px] font-semibold text-stone-800 hover:bg-[#0A0A0A] hover:text-[#D4AF37] cursor-pointer"
                    >
                      + Insert Telehealth Video Link
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertLinkIntoReply(
                          'Schedule Your Telehealth Follow-Up',
                          'https://goldenmindpsychiatry.org/?page=telehealth'
                        )
                      }
                      className="px-2.5 py-1 rounded-[8px] bg-white border border-[#D4AF37]/50 text-[11px] font-semibold text-stone-800 hover:bg-[#0A0A0A] hover:text-[#D4AF37] cursor-pointer"
                    >
                      + Insert Booking Link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Follow-Up on Your Medication & Telehealth Room Link"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Message (Any https:// link will be clickable for the client)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write a clinical update, care note, or paste any https:// link..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message & Email Alert as Brenda Hobyani, PMHNP-BC</span>
                </button>
              </form>

              <div className="bg-white portal-card p-6 space-y-4">
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Clinical Message Log
                </h3>
                <div className="divide-y divide-stone-200 max-h-[420px] overflow-y-auto">
                  {filteredMessages.map((msg) => (
                    <div key={msg.id} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => openPatientChart(msg.patientId)}
                          className="font-bold text-stone-900 hover:text-[#9E7206] hover:underline cursor-pointer text-left"
                        >
                          {msg.senderRole === 'provider'
                            ? `To ${msg.patientName} (From Brenda Hobyani, PMHNP-BC)`
                            : `From Patient: ${msg.patientName} (Click to Open Chart)`}
                        </button>
                        <span className="font-portal-heading tabular-nums text-stone-400">
                          {msg.createdAt.split('T')[0]}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#9E7206]">{msg.subject}</p>
                      <p className="text-xs text-stone-600 whitespace-pre-line">
                        {renderTextWithClickableLinks(msg.body)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 6: Billing & Statements */}
          {activeSubTab === 'billing' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateInvoice} className="bg-white portal-card p-6 space-y-4">
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Issue New Patient Statement
                </h3>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Patient</label>
                  <select
                    value={invPatientId}
                    onChange={(e) => setInvPatientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  >
                    {patients.map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.fullName} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Service Description
                  </label>
                  <input
                    type="text"
                    required
                    value={invDesc}
                    onChange={(e) => setInvDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Total Charge ($)
                    </label>
                    <input
                      type="number"
                      value={invTotal}
                      onChange={(e) => setInvTotal(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Insurance Covered ($)
                    </label>
                    <input
                      type="number"
                      value={invCovered}
                      onChange={(e) => setInvCovered(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
                >
                  Post Statement to Patient Portal
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right 30% Side Widgets Column */}
        <div className="xl:col-span-4 space-y-6">
          {/* Schedule Status-Timeline Widget */}
          <div className="bg-white portal-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Provider Schedule
                </h3>
                <p className="text-xs text-stone-500">Status-Timeline · Texas Telehealth</p>
              </div>
              <span className="px-2.5 py-1 rounded-[12px] bg-[#FAF6EA] text-[#9E7206] text-[10px] font-bold uppercase">
                Live Sync
              </span>
            </div>

            <div className="space-y-4">
              {filteredAppointments.slice(0, 4).map((appt) => (
                <div key={appt.id} className="pl-6 relative py-1">
                  <div
                    className={`w-[2px] absolute left-0 top-0 bottom-0 rounded-full ${
                      appt.status === 'confirmed' ? 'bg-[#D4AF37]' : 'bg-[#9E7206]'
                    }`}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-wider font-portal-heading text-[#9E7206]">
                    {appt.preferredDate} · {appt.preferredTime}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      appt.patientId && appt.patientId !== 'guest'
                        ? openPatientChart(appt.patientId)
                        : undefined
                    }
                    className="text-[14px] font-bold text-stone-900 hover:text-[#9E7206] mt-0.5 block text-left cursor-pointer"
                  >
                    {appt.patientName}
                  </button>
                  <p className="text-[12px] text-stone-500">
                    {appt.serviceType} · {appt.conditionReason}
                  </p>
                </div>
              ))}

              <div className="pl-6 relative py-1">
                <div className="w-[2px] absolute left-0 top-0 bottom-0 rounded-full bg-stone-300" />
                <p className="text-[10px] font-bold uppercase tracking-wider font-portal-heading text-stone-400">
                  MON–THU 8:00 AM – 4:00 PM · FRI 9:00 AM – 1:00 PM
                </p>
                <p className="text-[14px] font-bold text-stone-900 mt-0.5">
                  Chart & e-Prescription Review Window
                </p>
                <p className="text-[12px] text-stone-500">
                  {pendingRefillsCount} refill(s) & {unreadPatientMsgsCount} message(s) in queue
                </p>
              </div>
            </div>
          </div>

          {/* Dark Obsidian-Gold Support & Clinical Protocol CTA Card with Corner Ghost Icon */}
          <div className="bg-[#0A0A0A] text-white rounded-[32px] p-6 border border-[#D4AF37]/40 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg space-y-3">
            <ShieldCheck className="w-24 h-24 text-white/5 absolute -right-3 -bottom-3 pointer-events-none" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
              Practice Verified · HIPAA Telehealth
            </span>
            <h4 className="text-base font-bold font-portal-heading text-white">
              Brenda Hobyani, PMHNP-BC Clinical Sanctuary
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              100% Telehealth outpatient psychiatry across Texas. Client messages automatically
              trigger email alerts to <strong className="text-[#D4AF37]">beehobs@yahoo.com</strong>{' '}
              and <strong className="text-[#D4AF37]">info@goldenmindpsychiatry.org</strong>.
            </p>
            <button
              onClick={() => setActiveSubTab('messages')}
              className="px-4 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer relative z-10"
            >
              Open Patient Communications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
