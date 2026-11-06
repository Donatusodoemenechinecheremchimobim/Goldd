import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  PortalUser,
  ProviderPatientNoteRecord,
  ProviderNoteCategory,
  AppointmentRecord,
  IntakeRecord,
  AssessmentRecord,
  MedicationRecord,
  InvoiceRecord,
} from '../types';

interface ProviderPatientNotesManagerProps {
  patients: PortalUser[];
  lockedPatient?: PortalUser | null;
  appointments: AppointmentRecord[];
  intakes: IntakeRecord[];
  assessments: AssessmentRecord[];
  medications: MedicationRecord[];
  invoices: InvoiceRecord[];
  onShowBanner?: (msg: string) => void;
}

const NOTE_CATEGORIES: ProviderNoteCategory[] = [
  'SOAP / Session Note',
  'Psychotherapy Process Note (HIPAA § 164.501 Private)',
  'Medication & Side-Effect Log',
  'Risk & Safety Assessment Log',
  'Phone / Care Coordination Log',
  'Billing / Administrative Log',
];

export const ProviderPatientNotesManager: React.FC<ProviderPatientNotesManagerProps> = ({
  patients,
  lockedPatient,
  appointments,
  intakes,
  assessments,
  medications,
  invoices,
  onShowBanner,
}) => {
  const [notes, setNotes] = useState<ProviderPatientNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    lockedPatient?.uid || patients[0]?.uid || ''
  );
  const [filterPatientId, setFilterPatientId] = useState<string>(
    lockedPatient?.uid || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [category, setCategory] = useState<ProviderNoteCategory>('SOAP / Session Note');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [cptCode, setCptCode] = useState('99214');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [title, setTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lockedPatient?.uid) {
      setSelectedPatientId(lockedPatient.uid);
      setFilterPatientId(lockedPatient.uid);
      if (lockedPatient.diagnosis && !diagnosisCode) {
        setDiagnosisCode(lockedPatient.diagnosis);
      }
    } else if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].uid);
    }
  }, [lockedPatient?.uid, patients]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/provider/notes');
      const data = await res.json();
      if (data?.ok && Array.isArray(data.notes)) {
        setNotes(data.notes as ProviderPatientNoteRecord[]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const targetPatient =
    lockedPatient || patients.find((p) => p.uid === selectedPatientId) || null;

  const handleInsertTemplate = (type: 'soap' | 'meds' | 'process') => {
    if (type === 'soap') {
      setCategory('SOAP / Session Note');
      if (!title) setTitle('Telehealth Psychiatric Follow-Up SOAP Note');
      setNoteBody(
        `SUBJECTIVE (S):\nChief Complaint / Interval History:\nMood / Anxiety / Sleep / Appetite:\nMedication Adherence & Side Effects:\n\nOBJECTIVE (O):\nMental Status Exam (MSE): Alert, oriented x4, cooperative, speech normal rate/rhythm, affect congruent, thought process linear.\nSafety / SI / HI Risk: Denies suicidal or homicidal ideation, intent, or plan.\n\nASSESSMENT (A):\nPrimary Diagnosis & Clinical Impression:\n\nPLAN (P):\n1. Medications / Rx:\n2. Supportive Psychotherapy / Behavioral Interventions:\n3. Safety Plan & Emergency Contacts (988 / Poison Control 800-222-1222) reviewed.\n4. Return to Telehealth Clinic in 4 weeks.`
      );
    } else if (type === 'meds') {
      setCategory('Medication & Side-Effect Log');
      if (!title) setTitle('Medication Titration & Side-Effect Review');
      setNoteBody(
        `Current Regimen Reviewed:\nTherapeutic Response:\nReported Side Effects (GI, sleep, activation, vitals):\nPDMP / Controlled Substance Check (if applicable):\nPlan / Dosage Adjustment:`
      );
    } else {
      setCategory('Psychotherapy Process Note (HIPAA § 164.501 Private)');
      if (!title) setTitle('Private Psychotherapy Process Note (HIPAA § 164.501)');
      setNoteBody(
        `Session Themes & Psychodynamic / CBT Observations:\nKey Stressors & Coping Mechanisms Discussed:\nClinician Private Reflections for Next Session:`
      );
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePat = lockedPatient || patients.find((p) => p.uid === selectedPatientId);
    if (!activePat || !noteBody.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/provider/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNoteId || undefined,
          patientId: activePat.uid,
          patientName: activePat.fullName,
          patientEmail: activePat.email,
          category,
          sessionDate,
          cptCode: cptCode.trim(),
          diagnosisCode: diagnosisCode.trim() || activePat.diagnosis || '',
          title: title.trim() || `${category} (${sessionDate})`,
          noteBody: noteBody.trim(),
          authorName: 'Brenda Hobyani, MSN, APRN, PMHNP-BC',
        }),
      });
      const data = await res.json();
      if (data?.ok && data.note) {
        const saved = data.note as ProviderPatientNoteRecord;
        setNotes((prev) => {
          const filtered = prev.filter((n) => n.id !== saved.id);
          return [saved, ...filtered];
        });
        setEditingNoteId(null);
        setTitle('');
        setNoteBody('');
        if (onShowBanner) {
          onShowBanner(
            `Private clinician note saved to ${activePat.fullName}'s log in PostgreSQL (goldenmind_db).`
          );
        }
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = (note: ProviderPatientNoteRecord) => {
    setEditingNoteId(note.id);
    setSelectedPatientId(note.patientId);
    setCategory(note.category);
    setSessionDate(note.sessionDate);
    setCptCode(note.cptCode || '99214');
    setDiagnosisCode(note.diagnosisCode || '');
    setTitle(note.title);
    setNoteBody(note.noteBody);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`/api/provider/notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (onShowBanner) {
        onShowBanner('Private clinician note removed from log.');
      }
    } catch {
      // ignore
    }
  };

  const visibleNotes = notes.filter((n) => {
    const matchesPatient =
      lockedPatient
        ? n.patientId === lockedPatient.uid
        : filterPatientId === 'ALL' || n.patientId === filterPatientId;
    if (!matchesPatient) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.patientName.toLowerCase().includes(q) ||
      n.title.toLowerCase().includes(q) ||
      n.noteBody.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q) ||
      (n.diagnosisCode || '').toLowerCase().includes(q)
    );
  });

  // 1-Click CSV Export of Patient Notes & Logs
  const handleDownloadCsv = () => {
    const headers = [
      'Note ID',
      'Session Date',
      'Patient Name',
      'Patient Email',
      'Category',
      'CPT Code',
      'Diagnosis / ICD-10',
      'Title',
      'Private Clinical Note',
      'Author Clinician',
      'Recorded At',
    ];
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const rows = visibleNotes.map((n) =>
      [
        n.id,
        n.sessionDate,
        n.patientName,
        n.patientEmail || '',
        n.category,
        n.cptCode || '',
        n.diagnosisCode || '',
        n.title,
        n.noteBody,
        n.authorName,
        n.createdAt,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const label = lockedPatient
      ? lockedPatient.fullName.replace(/\s+/g, '_')
      : filterPatientId !== 'ALL'
      ? (patients.find((p) => p.uid === filterPatientId)?.fullName || 'Patient').replace(/\s+/g, '_')
      : 'All_Patients';
    a.href = url;
    a.download = `GoldenMind_Clinical_Notes_Logs_${label}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1-Click Complete Patient Dossier & Clinical Activity Log Export (.TXT)
  const handleDownloadDossierTxt = () => {
    const scopePatients = lockedPatient
      ? [lockedPatient]
      : filterPatientId !== 'ALL'
      ? patients.filter((p) => p.uid === filterPatientId)
      : patients;

    const sections: string[] = [
      '================================================================================',
      'GOLDEN MIND PSYCHIATRY PLLC — CONFIDENTIAL PROVIDER CLINICAL LOG & DOSSIER',
      'Compiled By: Brenda Hobyani, MSN, APRN, PMHNP-BC',
      `Export Timestamp: ${new Date().toLocaleString()}`,
      'HIPAA 45 C.F.R. § 164.501 & Texas Health & Safety Code Ch. 611 Protected Record',
      '================================================================================\n',
    ];

    scopePatients.forEach((pat) => {
      const pNotes = notes.filter((n) => n.patientId === pat.uid);
      const pAppts = appointments.filter((a) => a.patientId === pat.uid);
      const pMeds = medications.filter((m) => m.patientId === pat.uid);
      const pAssess = assessments.filter((a) => a.patientId === pat.uid);
      const pIntakes = intakes.filter((i) => i.patientId === pat.uid);
      const pInvs = invoices.filter((i) => i.patientId === pat.uid);

      sections.push(
        `--------------------------------------------------------------------------------`,
        `PATIENT CHART: ${pat.fullName.toUpperCase()} (UID: ${pat.uid})`,
        `DOB: ${pat.dateOfBirth || 'On File'} · Sex: ${pat.biologicalSex || 'On File'} · Phone: ${pat.phone || 'On File'} · Email: ${pat.email}`,
        `Insurance: ${pat.insuranceProvider || 'N/A'} ${pat.insuranceMemberId ? `(#${pat.insuranceMemberId})` : ''} · Pharmacy: ${pat.preferredPharmacy || 'N/A'}`,
        `Primary Diagnosis / Focus: ${pat.diagnosis || pat.primaryConcern || 'Not specified'}`,
        `--------------------------------------------------------------------------------`
      );

      sections.push(`\n[1] BRENDA'S PRIVATE CLINICIAN NOTES & LOGS (${pNotes.length}):`);
      if (pNotes.length === 0) {
        sections.push('  • No private clinician notes recorded yet.');
      } else {
        pNotes.forEach((n, idx) => {
          sections.push(
            `  ${idx + 1}. [${n.sessionDate}] ${n.category} — ${n.title} ${
              n.cptCode ? `(CPT ${n.cptCode})` : ''
            } ${n.diagnosisCode ? `[Dx: ${n.diagnosisCode}]` : ''}`,
            `     Recorded: ${n.createdAt} by ${n.authorName}`,
            `     Note:\n${n.noteBody
              .split('\n')
              .map((line) => `       ${line}`)
              .join('\n')}\n`
          );
        });
      }

      sections.push(`\n[2] ACTIVE & HISTORICAL MEDICATIONS (${pMeds.length}):`);
      pMeds.forEach((m) => {
        sections.push(
          `  • ${m.medicationName} ${m.dosage} (${m.frequency}) — Status: ${m.refillStatus} · Refills: ${m.refillsRemaining} · Pharmacy: ${m.pharmacy}`
        );
      });

      sections.push(`\n[3] TELEHEALTH APPOINTMENTS (${pAppts.length}):`);
      pAppts.forEach((a) => {
        sections.push(
          `  • ${a.preferredDate} (${a.preferredTime}) — ${a.serviceType} · Status: ${a.status} · Reason: ${a.conditionReason}`
        );
      });

      sections.push(`\n[4] PHQ-9 / GAD-7 / MOOD CHECK-IN LOGS (${pAssess.length}):`);
      pAssess.forEach((as) => {
        sections.push(
          `  • [${as.createdAt.split('T')[0]}] ${as.type}: Score ${as.totalScore} (${as.severity}) · Sleep: ${as.sleepHours ?? 7.5}h`
        );
      });

      sections.push(`\n[5] SIGNED DIGITAL INTAKES (${pIntakes.length}):`);
      pIntakes.forEach((i) => {
        sections.push(`  • ${i.title} — Status: ${i.status} (${i.completedAt || i.assignedAt})`);
      });

      sections.push(`\n[6] BILLING & PAYMENT LEDGER (${pInvs.length}):`);
      pInvs.forEach((inv) => {
        sections.push(
          `  • [${inv.serviceDate}] CPT ${inv.cptCode || '99214'} · ${inv.description} — Charge: $${inv.amount.toFixed(2)} | Ins Adj: -$${inv.insuranceCoveredAmount.toFixed(2)} | Patient Resp: $${inv.patientResponsibility.toFixed(2)} | Status: ${inv.status.toUpperCase()} ${inv.transactionId ? `(Tx: ${inv.transactionId})` : ''}`
        );
      });

      sections.push('\n');
    });

    const blob = new Blob([sections.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const label = lockedPatient
      ? lockedPatient.fullName.replace(/\s+/g, '_')
      : filterPatientId !== 'ALL'
      ? (patients.find((p) => p.uid === filterPatientId)?.fullName || 'Patient').replace(/\s+/g, '_')
      : 'Complete_Practice';
    a.href = url;
    a.download = `GoldenMind_Patient_Dossier_And_Logs_${label}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Download Bar */}
      <div className="bg-white portal-card p-6 space-y-5 border border-[#D4AF37]/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9E7206]">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                Provider-Only Confidential Notebook · HIPAA 45 C.F.R. § 164.501 Isolated
              </span>
            </div>
            <h3 className="text-lg font-bold font-portal-heading text-stone-900 mt-1">
              {lockedPatient
                ? `Brenda's Private Clinical Notes & Logs for ${lockedPatient.fullName}`
                : "Brenda's Private Patient Notes & Downloadable Clinical Logs"}
            </h3>
            <p className="text-xs text-stone-500">
              These notes are stored in your private PostgreSQL table (`provider_patient_notes`)
              and are <strong>never visible to the client</strong> in the Client Portal. Download
              logs anytime as CSV, TXT Dossier, or Printable PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3.5 py-2.5 rounded-[12px] bg-[#FAF6EA] border border-[#D4AF37]/50 text-[#9E7206] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#f3ebd3] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Notes (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDossierTxt}
              className="px-3.5 py-2.5 rounded-[12px] bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs inline-flex items-center gap-1.5 hover:bg-stone-800 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Full Patient Log &amp; Dossier (.TXT)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-[12px] bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* New / Edit Private Note Form */}
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-800">
              {editingNoteId
                ? 'Editing Private Clinical Note'
                : `Record New Private Note ${
                    targetPatient ? `for ${targetPatient.fullName}` : ''
                  }`}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-stone-500 mr-1">Quick Templates:</span>
              <button
                type="button"
                onClick={() => handleInsertTemplate('soap')}
                className="px-2.5 py-1 rounded-[8px] bg-[#FAF9F5] border border-stone-200 text-[11px] font-semibold text-stone-800 hover:border-[#D4AF37] cursor-pointer"
              >
                + SOAP Session Template
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('meds')}
                className="px-2.5 py-1 rounded-[8px] bg-[#FAF9F5] border border-stone-200 text-[11px] font-semibold text-stone-800 hover:border-[#D4AF37] cursor-pointer"
              >
                + Medication Log Template
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('process')}
                className="px-2.5 py-1 rounded-[8px] bg-[#FAF9F5] border border-stone-200 text-[11px] font-semibold text-stone-800 hover:border-[#D4AF37] cursor-pointer"
              >
                + Psychotherapy Process Note
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {!lockedPatient && (
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Patient *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
                >
                  {patients.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.fullName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={lockedPatient ? 'sm:col-span-5' : 'sm:col-span-4'}>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Note / Log Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProviderNoteCategory)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
              >
                {NOTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={lockedPatient ? 'sm:col-span-3' : 'sm:col-span-2'}>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Session Date *
              </label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
              />
            </div>

            <div className={lockedPatient ? 'sm:col-span-4' : 'sm:col-span-2'}>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                CPT Code
              </label>
              <input
                type="text"
                value={cptCode}
                onChange={(e) => setCptCode(e.target.value)}
                placeholder="99214"
                className="w-full px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs font-portal-heading tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Note Subject / Summary Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 4-Week Follow-Up SOAP Note — Sertraline Titration & Anxiety Review"
                className="w-full px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                ICD-10 / Clinical Diagnosis Reference
              </label>
              <input
                type="text"
                value={diagnosisCode}
                onChange={(e) => setDiagnosisCode(e.target.value)}
                placeholder="e.g., F41.1 Generalized Anxiety Disorder"
                className="w-full px-3 py-2 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Private Clinician Note &amp; Session Log (Strictly Hidden from Patient Portal) *
            </label>
            <textarea
              rows={6}
              required
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Write your private clinical observations, SOAP note, psychotherapy process notes, or phone call log here..."
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-stone-200 text-xs font-mono leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            {editingNoteId && (
              <button
                type="button"
                onClick={() => {
                  setEditingNoteId(null);
                  setTitle('');
                  setNoteBody('');
                }}
                className="px-4 py-2.5 rounded-[12px] border border-stone-200 text-xs font-semibold text-stone-600 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-[12px] bg-gold-gradient text-[#1C1917] font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {editingNoteId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {saving
                  ? 'Saving to PostgreSQL...'
                  : editingNoteId
                  ? 'Update Private Note'
                  : 'Save Private Note to Patient Log'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Saved Private Notes & Logs Timeline */}
      <div className="bg-white portal-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div>
            <h4 className="text-base font-bold font-portal-heading text-stone-900">
              Saved Private Clinician Notes &amp; Logs ({visibleNotes.length})
            </h4>
            <p className="text-xs text-stone-500">
              Chronological archive of Brenda's private notes stored in PostgreSQL
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!lockedPatient && (
              <select
                value={filterPatientId}
                onChange={(e) => setFilterPatientId(e.target.value)}
                className="px-3 py-1.5 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
              >
                <option value="ALL">All Patients ({notes.length})</option>
                {patients.map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, CPT, Dx..."
                className="pl-8 pr-3 py-1.5 rounded-[10px] bg-[#FAF9F5] border border-stone-200 text-xs"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-stone-500 py-4 text-center">Loading private notes...</p>
        ) : visibleNotes.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">
            No private clinical notes recorded yet for this selection. Use the form above to record
            a SOAP note, psychotherapy process note, or medication log.
          </p>
        ) : (
          <div className="divide-y divide-stone-200">
            {visibleNotes.map((note) => (
              <div key={note.id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-stone-900 text-sm">{note.title}</span>
                      <span className="text-stone-400">·</span>
                      <span className="font-semibold text-[#9E7206]">{note.category}</span>
                      {note.cptCode && (
                        <>
                          <span className="text-stone-400">·</span>
                          <span className="font-portal-heading tabular-nums text-stone-700 font-semibold">
                            CPT {note.cptCode}
                          </span>
                        </>
                      )}
                      {note.diagnosisCode && (
                        <>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-600">Dx: {note.diagnosisCode}</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 font-portal-heading tabular-nums mt-0.5">
                      Patient: <strong className="text-stone-800">{note.patientName}</strong> ·
                      Session Date: {note.sessionDate} · Logged:{' '}
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditNote(note)}
                      className="px-2.5 py-1 rounded-[8px] bg-[#FAF9F5] border border-stone-200 text-xs font-semibold text-stone-700 hover:border-[#D4AF37] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="px-2.5 py-1 rounded-[8px] bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-[14px] bg-[#FAF9F5] border border-stone-200 text-xs text-stone-800 whitespace-pre-line font-mono leading-relaxed">
                  {note.noteBody}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
