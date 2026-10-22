import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Calendar,
  Users,
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
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  PortalUser,
  AppointmentRecord,
  IntakeRecord,
  AssessmentRecord,
  MedicationRecord,
  MessageRecord,
  InvoiceRecord,
} from '../types';
import { providerProcessRefill } from '../services/clinicalAutomation';

interface ProviderDashboardViewProps {
  currentUser: PortalUser;
  onLaunchTelehealth: (appt: AppointmentRecord) => void;
}

export const ProviderDashboardView: React.FC<ProviderDashboardViewProps> = ({
  currentUser,
  onLaunchTelehealth,
}) => {
  const [patients, setPatients] = useState<PortalUser[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<
    'queue' | 'charts' | 'refills' | 'intakes' | 'messages' | 'billing'
  >('queue');

  // New Medication form state (Provider prescribing)
  const [rxPatientId, setRxPatientId] = useState('');
  const [rxName, setRxName] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('Once daily in the morning');
  const [rxPharmacy, setRxPharmacy] = useState('H-E-B Pharmacy · Texas Statewide e-Rx');
  const [rxRefills, setRxRefills] = useState(3);
  const [rxInstructions, setRxInstructions] = useState(
    'Take as prescribed. Note: Some psychiatric medications can be habit forming; never adjust dosage without consulting Brenda Hobyani, PMHNP-BC.'
  );

  // Provider Reply state
  const [replyPatientId, setReplyPatientId] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');

  // New Invoice state
  const [invPatientId, setInvPatientId] = useState('');
  const [invDesc, setInvDesc] = useState('Follow-Up Telepsychiatry Medication Visit (CPT 99214)');
  const [invTotal, setInvTotal] = useState(165);
  const [invCovered, setInvCovered] = useState(135);

  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as PortalUser);
        setPatients(list);
        if (list.length > 0 && !rxPatientId) {
          setRxPatientId(list[0].uid);
          setReplyPatientId(list[0].uid);
          setInvPatientId(list[0].uid);
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

  const matchesFilter = (patientId: string, patientName: string) => {
    const byPatient = selectedPatientId === 'ALL' || patientId === selectedPatientId;
    const bySearch =
      !searchTerm.trim() ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase());
    return byPatient && bySearch;
  };

  const filteredAppointments = appointments.filter((a) =>
    matchesFilter(a.patientId, a.patientName)
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

  const handleUpdateAppointmentStatus = async (
    id: string,
    status: 'confirmed' | 'completed' | 'cancelled'
  ) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handlePrescribeMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxPatientId || !rxName.trim() || !rxDosage.trim()) return;
    const targetPatient = patients.find((p) => p.uid === rxPatientId);
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'medications'), {
        patientId: rxPatientId,
        patientName: targetPatient?.fullName || 'Patient',
        medicationName: rxName.trim(),
        dosage: rxDosage.trim(),
        frequency: rxFrequency.trim(),
        instructions: rxInstructions.trim(),
        pharmacy: targetPatient?.preferredPharmacy || rxPharmacy,
        refillsRemaining: Number(rxRefills),
        refillStatus: 'active',
        prescribedBy: 'Brenda Hobyani, PMHNP-BC',
        updatedAt: now,
      });
      setRxName('');
      setRxDosage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'medications');
    }
  };

  const handleSendProviderMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyPatientId || !replySubject.trim() || !replyBody.trim()) return;
    const targetPatient = patients.find((p) => p.uid === replyPatientId);
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'messages'), {
        patientId: replyPatientId,
        patientName: targetPatient?.fullName || 'Patient',
        senderId: currentUser.uid,
        senderName: 'Brenda Hobyani, PMHNP-BC',
        senderRole: 'provider',
        subject: replySubject.trim(),
        body: replyBody.trim(),
        read: false,
        createdAt: now,
      });
      setReplySubject('');
      setReplyBody('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invPatientId || !invDesc.trim()) return;
    const targetPatient = patients.find((p) => p.uid === invPatientId);
    const now = new Date().toISOString();
    const total = Number(invTotal) || 0;
    const covered = Number(invCovered) || 0;
    const resp = Math.max(0, total - covered);
    try {
      await addDoc(collection(db, 'invoices'), {
        patientId: invPatientId,
        patientName: targetPatient?.fullName || 'Patient',
        description: invDesc.trim(),
        serviceDate: now.split('T')[0],
        amount: total,
        insuranceCoveredAmount: covered,
        patientResponsibility: resp,
        status: 'due',
        createdAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Summary Bar */}
      <div className="bg-[#0A0A0A] text-white border border-[#D4AF37]/40 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-800">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#D4AF37]">
              Provider Clinical Command Workspace
            </span>
            <h2 className="text-2xl font-serif font-bold text-white mt-0.5">
              Brenda Hobyani, MSN, APRN, PMHNP-BC
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              100% Telehealth Outpatient Practice · Adults, Teens & Children Across Texas
            </p>
          </div>

          {/* Patient Filter & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="ALL">All Patients ({patients.length})</option>
              {patients.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.fullName} ({p.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* High-Density KPI Strip (Tabular Numerals) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800">
            <p className="text-[11px] text-stone-400 uppercase tracking-wider">
              Telehealth Consultations
            </p>
            <p className="text-2xl font-serif font-bold text-[#D4AF37] font-mono tabular-nums mt-1">
              {appointments.length}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {appointments.filter((a) => a.status === 'confirmed').length} confirmed upcoming
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800">
            <p className="text-[11px] text-stone-400 uppercase tracking-wider">
              Refill Requests Pending
            </p>
            <p className="text-2xl font-serif font-bold text-amber-400 font-mono tabular-nums mt-1">
              {pendingRefillsCount}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {medications.length} active prescriptions
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800">
            <p className="text-[11px] text-stone-400 uppercase tracking-wider">
              Completed Intakes & Scales
            </p>
            <p className="text-2xl font-serif font-bold text-emerald-400 font-mono tabular-nums mt-1">
              {completedIntakesCount} / {intakes.length}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {assessments.length} PHQ-9 / GAD-7 logs
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800">
            <p className="text-[11px] text-stone-400 uppercase tracking-wider">
              Patient Messages
            </p>
            <p className="text-2xl font-serif font-bold text-white font-mono tabular-nums mt-1">
              {unreadPatientMsgsCount} unread
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {messages.length} total clinical messages
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'queue', label: '1. Telehealth Queue', icon: Calendar },
          { id: 'refills', label: `2. Rx & Refill Approvals (${pendingRefillsCount})`, icon: Pill },
          { id: 'charts', label: '3. PHQ-9 / GAD-7 Scores', icon: Activity },
          { id: 'intakes', label: '4. Submitted Intake Forms', icon: FileText },
          { id: 'messages', label: '5. Direct Patient Messaging', icon: MessageSquare },
          { id: 'billing', label: '6. Statements & Copays', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/50'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab 1: Telehealth Queue */}
      {activeSubTab === 'queue' && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                100% Telehealth Consultation Queue
              </h3>
              <p className="text-xs text-stone-500">
                Launch HIPAA video rooms, verify pre-visit PHQ-9/GAD-7 screeners, or update visit status
              </p>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              No telehealth appointments match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-[#FAF9F5] text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Service & Focus</th>
                    <th className="py-3 px-4">Date & Window</th>
                    <th className="py-3 px-4">Pre-Visit Screener</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Clinical Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-stone-900">{appt.patientName}</p>
                        <p className="text-[11px] text-stone-500">
                          {appt.patientEmail} {appt.patientPhone ? `· ${appt.patientPhone}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-stone-800">{appt.conditionReason}</p>
                        <p className="text-[11px] text-stone-500">
                          {appt.serviceType} · {appt.insuranceProvider || 'Insurance on file'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-stone-700">
                        {appt.preferredDate} · {appt.preferredTime}
                      </td>
                      <td className="py-3.5 px-4">
                        {appt.preVisitScreenerCompleted ? (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">Awaiting PHQ-9/GAD-7</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium capitalize">
                        <span
                          className={
                            appt.status === 'confirmed'
                              ? 'text-emerald-700'
                              : appt.status === 'completed'
                              ? 'text-stone-600'
                              : appt.status === 'cancelled'
                              ? 'text-red-600'
                              : 'text-amber-700'
                          }
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => onLaunchTelehealth(appt)}
                          className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-[#D4AF37] font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-stone-800 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Launch Video</span>
                        </button>
                        {appt.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appt.id, 'completed')}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Medications & Refill Approvals */}
      {activeSubTab === 'refills' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-900">
              Active Patient Prescriptions & Refill Queue
            </h3>
            {filteredMedications.length === 0 ? (
              <p className="text-xs text-stone-500 py-4">
                No prescriptions on file yet. Use the form on the right to prescribe a medication.
              </p>
            ) : (
              <div className="divide-y divide-stone-200">
                {filteredMedications.map((med) => (
                  <div key={med.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          {med.medicationName} ({med.dosage})
                        </span>
                        <span className="text-xs text-stone-500">· Patient: {med.patientName}</span>
                      </div>
                      <p className="text-xs text-stone-600">
                        {med.frequency} · Pharmacy: {med.pharmacy} ·{' '}
                        <span className="font-mono tabular-nums">
                          {med.refillsRemaining} refills remaining
                        </span>
                      </p>
                      <p className="text-[11px] font-medium">
                        Status:{' '}
                        <span
                          className={
                            med.refillStatus === 'refill_requested'
                              ? 'text-amber-700 font-bold'
                              : med.refillStatus === 'approved_sent'
                              ? 'text-emerald-700 font-bold'
                              : med.refillStatus === 'denied'
                              ? 'text-red-600 font-bold'
                              : 'text-stone-700'
                          }
                        >
                          {med.refillStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Require Follow-Up</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescribe New Medication Card */}
          <form
            onSubmit={handlePrescribeMedication}
            className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#B8860B]" />
              <h3 className="text-base font-serif font-bold text-stone-900">
                Prescribe / Add Patient Medication
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Clinical Reminder: Some psychiatric and anxiety medications can be habit forming.
                Include clear dosing and habit-forming precautions in the patient instructions.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Select Patient</label>
              <select
                value={rxPatientId}
                onChange={(e) => setRxPatientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Frequency</label>
                <input
                  type="text"
                  required
                  value={rxFrequency}
                  onChange={(e) => setRxFrequency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
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
                className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer hover:bg-stone-800 transition-colors"
            >
              Add Prescription to Patient Chart
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 3: Longitudinal PHQ-9, GAD-7 & Daily Mood Scores */}
      {activeSubTab === 'charts' && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h3 className="text-base font-serif font-bold text-stone-900">
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
                  <tr className="border-b border-stone-200 bg-[#FAF9F5] text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Assessment Scale</th>
                    <th className="py-3 px-4 text-right">Score</th>
                    <th className="py-3 px-4">Clinical Severity</th>
                    <th className="py-3 px-4">Sleep & Adherence</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs">
                  {filteredAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50">
                      <td className="py-3 px-4 font-semibold text-stone-900">{a.patientName}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-stone-800">{a.type}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-stone-900">
                        {a.totalScore}
                        {a.type === 'PHQ-9' ? ' / 27' : a.type === 'GAD-7' ? ' / 21' : ' / 10'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            a.severity === 'Severe' || a.severity === 'Moderately Severe'
                              ? 'text-red-600'
                              : a.severity === 'Moderate'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-stone-600">
                        {a.sleepHours ?? 7.5}h sleep · {a.medicationTaken ? 'Med Taken' : 'Skipped'}
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                        {a.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-stone-500">
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
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-serif font-bold text-stone-900">
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
                      <span className="font-bold text-sm text-stone-900">{intake.title}</span>
                      <span className="text-xs text-stone-500 ml-2">
                        · Patient: {intake.patientName}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        intake.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {intake.status === 'completed'
                        ? `Completed (${intake.completedAt?.split('T')[0] || 'Saved'})`
                        : 'Pending Patient Completion'}
                    </span>
                  </div>
                  {intake.responses && Object.keys(intake.responses).length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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

      {/* Sub-Tab 5: Direct Patient Messaging */}
      {activeSubTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-900">
              Clinical Message Log
            </h3>
            <div className="divide-y divide-stone-200 max-h-[460px] overflow-y-auto">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">
                      {msg.senderRole === 'provider'
                        ? `To ${msg.patientName} (From Brenda Hobyani, PMHNP-BC)`
                        : `From Patient: ${msg.patientName}`}
                    </span>
                    <span className="font-mono tabular-nums text-stone-400">
                      {msg.createdAt.split('T')[0]}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#9E7206]">{msg.subject}</p>
                  <p className="text-xs text-stone-600 whitespace-pre-line">{msg.body}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSendProviderMessage}
            className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-base font-serif font-bold text-stone-900">
              Send Direct Message to Patient
            </h3>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Recipient</label>
              <select
                value={replyPatientId}
                onChange={(e) => setReplyPatientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
              >
                {patients.map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="e.g., Follow-Up on Your PHQ-9 Check-In"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Message</label>
              <textarea
                rows={4}
                required
                placeholder="Write a clinical update or care note..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message as Brenda Hobyani, PMHNP-BC</span>
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 6: Billing & Statements */}
      {activeSubTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-stone-900">
              Patient Statements & Copay Ledger
            </h3>
            <div className="divide-y divide-stone-200">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-stone-900">
                      {inv.patientName} · {inv.description}
                    </p>
                    <p className="text-stone-500 font-mono tabular-nums mt-0.5">
                      Service Date: {inv.serviceDate} · Total: ${inv.amount.toFixed(2)} · Insurance
                      Covered: ${inv.insuranceCoveredAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <p className="font-bold text-sm text-stone-900">
                      ${inv.patientResponsibility.toFixed(2)}
                    </p>
                    <span
                      className={`text-[11px] font-semibold uppercase ${
                        inv.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleCreateInvoice}
            className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-base font-serif font-bold text-stone-900">
              Issue New Patient Statement
            </h3>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Patient</label>
              <select
                value={invPatientId}
                onChange={(e) => setInvPatientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border border-stone-200 text-xs font-mono tabular-nums"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs cursor-pointer"
            >
              Post Statement to Patient Portal
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
