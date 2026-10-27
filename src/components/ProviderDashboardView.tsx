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
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxPharmacy, setRxPharmacy] = useState('');
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
  const [invDesc, setInvDesc] = useState('');
  const [invTotal, setInvTotal] = useState(0);
  const [invCovered, setInvCovered] = useState(0);

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
    <div className="space-y-6 font-portal-body">
      {/* Top 4-Column Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Primary Dark Bento Card with Decorative Circle */}
        <div className="bg-[#0A0A0A] text-white rounded-[32px] p-6 border border-[#D4AF37]/40 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-24 h-24 bg-white/5 absolute -right-4 -bottom-4 rounded-full pointer-events-none" />
          <div className="w-16 h-16 bg-[#D4AF37]/10 absolute right-8 -top-6 rounded-full pointer-events-none" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Telehealth Consultations
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-white mt-2">
            {appointments.length} Total Visits
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-[#D4AF37] mt-3 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {appointments.filter((a) => a.status === 'confirmed').length} Confirmed Upcoming
            </span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white portal-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Rx & Refill Approvals
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
            {pendingRefillsCount} Pending
          </p>
          <p className="text-[12px] text-[#9E7206] font-semibold mt-3">
            {medications.length} active prescriptions on chart
          </p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white portal-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Completed Intakes & Scales
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
            {completedIntakesCount} / {intakes.length}
          </p>
          <p className="text-[12px] text-emerald-700 font-semibold mt-3">
            {assessments.length} PHQ-9 / GAD-7 logs synced
          </p>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white portal-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Disbursed & Statements
          </p>
          <p className="text-[24px] font-bold font-portal-heading tabular-nums text-stone-900 mt-2">
            ${totalRevenueDisbursed.toFixed(2)}
          </p>
          <p className="text-[12px] text-stone-500 font-medium mt-3">
            {unreadPatientMsgsCount} unread patient message(s)
          </p>
        </div>
      </div>

      {/* Filter & Sub-Navigation Controls */}
      <div className="bg-white portal-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'queue', label: 'Engagement Requests', icon: Calendar },
            { id: 'refills', label: `Rx & Refills (${pendingRefillsCount})`, icon: Pill },
            { id: 'charts', label: 'PHQ-9 / GAD-7 Scales', icon: Activity },
            { id: 'intakes', label: 'Intake Forms', icon: FileText },
            { id: 'messages', label: 'Patient Messages', icon: MessageSquare },
            { id: 'billing', label: 'Payment History', icon: CreditCard },
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
              placeholder="Filter patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full bg-[#FAF9F5] border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3.5 py-2 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#D4AF37]"
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

      {/* Main 70/30 Two-Column Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 70% Column */}
        <div className="xl:col-span-8 space-y-6">
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

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                  Active Patient Prescriptions & Refill Queue
                </h3>
                {filteredMedications.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4">
                    No prescriptions on file yet. Use the form below to prescribe a medication.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {filteredMedications.map((med) => (
                      <div
                        key={med.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm font-portal-heading text-stone-900">
                              {med.medicationName} ({med.dosage})
                            </span>
                            <span className="text-xs text-stone-500">
                              · Patient: {med.patientName}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600">
                            {med.frequency} · Pharmacy: {med.pharmacy} ·{' '}
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
                            className="px-3.5 py-2 rounded-[12px] border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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

              <form
                onSubmit={handlePrescribeMedication}
                className="bg-white portal-card p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#B8860B]" />
                  <h3 className="text-base font-bold font-portal-heading text-stone-900">
                    Prescribe / Add Patient Medication
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
                          <td className="py-4 px-5 font-bold text-stone-900">{a.patientName}</td>
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
                          <span className="text-xs text-stone-500 ml-2">
                            · Patient: {intake.patientName}
                          </span>
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

          {/* Sub-Tab 5: Direct Patient Messaging */}
          {activeSubTab === 'messages' && (
            <div className="space-y-6">
              <div className="bg-white portal-card p-6 space-y-4">
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Clinical Message Log
                </h3>
                <div className="divide-y divide-stone-200 max-h-[420px] overflow-y-auto">
                  {filteredMessages.map((msg) => (
                    <div key={msg.id} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900">
                          {msg.senderRole === 'provider'
                            ? `To ${msg.patientName} (From Brenda Hobyani, PMHNP-BC)`
                            : `From Patient: ${msg.patientName}`}
                        </span>
                        <span className="font-portal-heading tabular-nums text-stone-400">
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
                className="bg-white portal-card p-6 space-y-4"
              >
                <h3 className="text-base font-bold font-portal-heading text-stone-900">
                  Send Direct Message to Patient
                </h3>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Recipient
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
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Follow-Up on Your PHQ-9 Check-In"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
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
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message as Brenda Hobyani, PMHNP-BC</span>
                </button>
              </form>
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
                  <p className="text-[14px] font-bold text-stone-900 mt-0.5">{appt.patientName}</p>
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
              100% Telehealth outpatient psychiatry across Texas. Emergency lines: Call/Text{' '}
              <strong className="text-[#D4AF37]">988</strong> (Suicide &amp; Crisis Lifeline) or{' '}
              <strong className="text-[#D4AF37]">800-222-1222</strong> (Poison Control 24/7).
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
