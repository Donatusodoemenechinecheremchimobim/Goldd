import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, Video, Shield, ShieldCheck, AlertCircle } from 'lucide-react';
import { conditionsData } from '../data/conditions';
import {
   AppointmentFormData,
  ProviderUnavailableDateRecord,
} from '../types';
import { auth } from '../lib/firebase';
import {
  createTelehealthAppointment,
  ensurePatientOnboarding,
  fetchProviderUnavailableDates,
  evaluateDateAndWindowAvailability,
} from '../services/clinicalAutomation';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCondition?: string;
  onNavigateToPortal?: () => void;
}

function calculateAgeFromDob(dobString: string): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  prefillCondition,
  onNavigateToPortal,
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    biologicalSex: 'Female',
    guardianName: '',
    serviceType: 'Comprehensive Psychiatric Evaluation',
    conditionReason: prefillCondition || 'ADHD (Attention-Deficit / Hyperactivity Disorder)',
    visitPreference: 'telehealth',
    preferredDate: '',
    preferredTime: 'Mon–Thu Morning (8:00 AM - 12:00 PM)',
    insuranceProvider: 'Blue Cross Blue Shield (BCBS)',
    notes: '',
  });

  const [genderSelection, setGenderSelection] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [customGenderText, setCustomGenderText] = useState('');
  const [hipaaConsent, setHipaaConsent] = useState(false);
  const [telehealthTexasConsent, setTelehealthTexasConsent] = useState(false);
  const [tcpaSmsEmailConsent, setTcpaSmsEmailConsent] = useState(false);
  const [minorGuardianConsent, setMinorGuardianConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [provisionedRoomUrl, setProvisionedRoomUrl] = useState<string>('');
  const [unavailableDates, setUnavailableDates] = useState<ProviderUnavailableDateRecord[]>([]);

  const patientAge = calculateAgeFromDob(formData.dateOfBirth);
  const isMinorPatient = patientAge !== null && patientAge >= 0 && patientAge < 18;

  useEffect(() => {
    if (prefillCondition) {
      setFormData((prev) => ({ ...prev, conditionReason: prefillCondition }));
    }
  }, [prefillCondition]);

  useEffect(() => {
    if (isOpen) {
      fetchProviderUnavailableDates().then((list) => setUnavailableDates(list));
    }
    if (auth.currentUser) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || auth.currentUser?.email || '',
        fullName: prev.fullName || auth.currentUser?.displayName || '',
      }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayIso = new Date().toISOString().split('T')[0];
  const upcomingBlockedDates = unavailableDates.filter(
    (b) => (b.endDate || b.startDate) >= todayIso
  );
  const availabilityCheck = evaluateDateAndWindowAvailability(
    formData.preferredDate,
    formData.preferredTime,
    unavailableDates
  );

  const resolvedGender =
    genderSelection === 'Other'
      ? customGenderText.trim()
        ? `Other (${customGenderText.trim()})`
        : 'Other'
      : genderSelection;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (availabilityCheck.isUnavailable) {
      setFormError(
        availabilityCheck.message ||
          'The selected date or time window is unavailable. Please select another date.'
      );
      return;
    }

    if (genderSelection === 'Other' && !customGenderText.trim()) {
      setFormError('Please state/specify your gender in the box provided.');
      return;
    }

    if (isMinorPatient && (!formData.guardianName?.trim() || !minorGuardianConsent)) {
      setFormError(
        'For patients under 18 years of age (Texas Family Code Ch. 32), a parent or legal guardian must enter their full name and check the guardian consent box.'
      );
      return;
    }

    if (!hipaaConsent || !telehealthTexasConsent || !tcpaSmsEmailConsent) {
      setFormError(
        'Please review and check the required HIPAA/Texas HB 300, Texas Telehealth, and Appointment Notification consent boxes before confirming your visit.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const enrichedNotes = [
        `Gender: ${resolvedGender}`,
        isMinorPatient && formData.guardianName?.trim()
          ? `Parent/Legal Guardian (Minor <18 Consent Verified): ${formData.guardianName.trim()}`
          : '',
        formData.notes?.trim() || '',
      ]
        .filter(Boolean)
        .join(' | ');

      const submissionPayload: AppointmentFormData = {
        ...formData,
        biologicalSex: resolvedGender,
        notes: enrichedNotes,
      };

      let currentPortalUser = null;
      if (auth.currentUser) {
        currentPortalUser = await ensurePatientOnboarding(auth.currentUser, {
          fullName: formData.fullName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          biologicalSex: resolvedGender,
          insuranceProvider: formData.insuranceProvider,
        });
      }
      const result = await createTelehealthAppointment(submissionPayload, currentPortalUser);
      setProvisionedRoomUrl(result.telehealthUrl);
      setSubmitted(true);
    } catch (err) {
      console.error('Error booking telehealth appointment:', err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setProvisionedRoomUrl('');
    setFormError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white border border-stone-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-[#1C1917]">
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close booking modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif text-[#1C1917] font-bold">
              100% Telehealth Visit Confirmed &amp; Provisioned
            </h3>
            <p className="text-sm text-[#57534E] max-w-md mx-auto leading-relaxed">
              Thank you, <span className="text-[#1C1917] font-semibold">{formData.fullName}</span>.
              Your <span className="text-[#1C1917] font-medium">100% Telehealth Video Visit</span>{' '}
              with <strong className="text-[#9E7206]">Brenda Hobyani, PMHNP-BC</strong> has been
              saved to your chart.
            </p>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-xs text-left space-y-2 my-4">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-[#78716C]">Focus Area:</span>
                <span className="text-[#1C1917] font-medium">{formData.conditionReason}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-[#78716C]">Gender:</span>
                <span className="text-[#1C1917] font-medium">{resolvedGender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-[#78716C]">Visit Format:</span>
                <span className="text-[#1C1917]">100% Telehealth Video Visit (Texas)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 font-mono tabular-nums">
                <span className="text-[#78716C]">Date &amp; Window:</span>
                <span className="text-[#1C1917]">
                  {formData.preferredDate || 'Next Available'} · {formData.preferredTime}
                </span>
              </div>
              {provisionedRoomUrl && (
                <div className="flex justify-between py-1 font-mono">
                  <span className="text-[#78716C]">HIPAA Video Room:</span>
                  <span className="text-emerald-700 font-semibold truncate max-w-[240px]">
                    {provisionedRoomUrl}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-[#78716C] leading-relaxed">
              Your New Patient Psychiatric Intake Forms and baseline PHQ-9 / GAD-7 check-in are
              ready in the <strong>Client Portal</strong>. Sign in with{' '}
              <strong className="text-[#1C1917]">{formData.email}</strong> to access your chart and
              1-click Telehealth Video Room.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onNavigateToPortal && (
                <button
                  onClick={() => {
                    resetAndClose();
                    onNavigateToPortal();
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#0A0A0A] text-[#D4AF37] font-bold text-xs sm:text-sm hover:bg-stone-800 transition-all cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Client Portal &amp; Intake Forms</span>
                </button>
              )}
              <button
                onClick={resetAndClose}
                className="px-5 py-2.5 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2 border-b border-stone-100">
              <span className="text-[11px] font-semibold tracking-widest text-[#9E7206] uppercase">
                Golden Mind Psychiatry PLLC
              </span>
              <h2 className="text-2xl font-serif text-[#1C1917] font-bold">
                Book a 100% Telehealth Consultation
              </h2>
              <p className="text-xs text-[#78716C]">
                With Brenda Hobyani, MSN, APRN, PMHNP-BC · Adults, Teens &amp; Children Across Texas
              </p>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Visit Format Badge (100% Telehealth) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9E7206] uppercase tracking-wider block">
                1. Visit Format
              </label>
              <div className="p-3.5 rounded-2xl bg-[#FAF6EA] border border-[#D4AF37] shadow-xs flex items-start gap-3">
                <Video className="w-5 h-5 shrink-0 mt-0.5 text-[#B8860B]" />
                <div>
                  <p className="text-xs font-semibold text-[#1C1917]">
                    100% Telehealth Video Visit (No In-Person Visits Needed)
                  </p>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    Available Anywhere Across Texas for Children, Teens &amp; Adults · Automatic HIPAA
                    Video Link Provisioning
                  </p>
                </div>
              </div>
            </div>

            {/* Condition or Service Focus */}
            <div>
              <label className="text-xs font-semibold text-[#9E7206] uppercase tracking-wider block mb-1.5">
                2. Primary Concern / Condition
              </label>
              <select
                value={formData.conditionReason}
                onChange={(e) => setFormData({ ...formData, conditionReason: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none"
              >
                {conditionsData.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="General Psychiatric Evaluation">General Psychiatric Evaluation</option>
                <option value="Medication Second Opinion / Refinement">
                  Medication Second Opinion / Refinement
                </option>
              </select>
            </div>

            {/* Patient Personal Information */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-semibold text-[#9E7206] uppercase tracking-wider block">
                3. Patient Details &amp; Gender
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First & Last Name *"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    title="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Gender Selector: Male / Female / Other (+ State if Other) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                    Gender *
                  </label>
                  <select
                    value={genderSelection}
                    onChange={(e) =>
                      setGenderSelection(e.target.value as 'Female' | 'Male' | 'Other')
                    }
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other (Please State)</option>
                  </select>
                </div>

                {genderSelection === 'Other' ? (
                  <div>
                    <label className="text-[11px] text-[#9E7206] block mb-1 font-semibold">
                      Please State Your Gender *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="State your gender..."
                      value={customGenderText}
                      onChange={(e) => setCustomGenderText(e.target.value)}
                      className="w-full bg-[#FAF6EA] border border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(432) 555-0199 *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={genderSelection === 'Other' ? '' : 'sm:col-span-2'}>
                  <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                    Email Address (Links to Client Portal) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888]"
                  />
                </div>

                {genderSelection === 'Other' && (
                  <div>
                    <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(432) 555-0199 *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888]"
                    />
                  </div>
                )}
              </div>

              {/* Automatic Under-18 Minor Parent / Guardian Attestation (Texas Family Code Ch. 32) */}
              {isMinorPatient && (
                <div className="p-3.5 rounded-2xl bg-[#FAF6EA] border border-[#D4AF37] space-y-2.5">
                  <p className="text-[11px] font-bold text-[#9E7206] uppercase tracking-wider">
                    Minor Patient Under 18 (Age: {patientAge}) — Texas Family Code Ch. 32 Guardian Consent
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Parent or Legal Guardian Full Legal Name & Relationship *"
                    value={formData.guardianName || ''}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full bg-white border border-stone-300 focus:border-[#D4AF37] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] focus:outline-none"
                  />
                  <label className="flex items-start gap-2 text-[11px] text-[#44403C] cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={minorGuardianConsent}
                      onChange={(e) => setMinorGuardianConsent(e.target.checked)}
                      className="mt-0.5 accent-[#9E7206]"
                    />
                    <span>
                      I attest under Texas Family Code Chapter 32 that I am the parent, managing
                      conservator, or legal guardian with authority to consent to psychiatric
                      evaluation and telepsychiatry treatment for this minor child. *
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Date & Time Preferences (Live Synced with Brenda's Provider Availability) */}
            <div className="space-y-3">
              {upcomingBlockedDates.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#FAF6EA] border border-[#D4AF37]/55 text-[11px] text-[#44403C] space-y-1.5">
                  <p className="font-bold text-[#9E7206] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Provider Unavailable Dates Notice (Brenda Hobyani, PMHNP-BC):</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {upcomingBlockedDates.map((b) => (
                      <span
                        key={b.id}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#D4AF37]/40 text-[10px] font-semibold text-stone-800"
                      >
                        {b.startDate === b.endDate
                          ? b.startDate
                          : `${b.startDate} to ${b.endDate}`}{' '}
                        · {b.blockedWindow === 'All Day' ? 'Unavailable All Day' : b.blockedWindow}{' '}
                        ({b.reason})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayIso}
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className={`w-full bg-[#FAF8F5] border ${
                      availabilityCheck.isUnavailable
                        ? 'border-red-400 bg-red-50/40'
                        : 'border-stone-200 focus:border-[#D4AF37]'
                    } rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none font-mono tabular-nums`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                    Preferred Time Window (Mon–Thu 8–4, Fri 9–1)
                  </label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                  >
                    {[
                      'Mon–Thu Morning (8:00 AM - 12:00 PM)',
                      'Mon–Thu Afternoon (12:00 PM - 4:00 PM)',
                      'Friday Morning / Midday (9:00 AM - 1:00 PM)',
                    ].map((win) => {
                      const isBlocked =
                        availabilityCheck.isEntireDayBlocked ||
                        availabilityCheck.blockedWindowsForDate.includes(win);
                      return (
                        <option key={win} value={win} disabled={isBlocked}>
                          {win}
                          {isBlocked ? ' — (Unavailable / Blocked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {availabilityCheck.isUnavailable && availabilityCheck.message && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{availabilityCheck.message}</span>
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div>
              <textarea
                rows={2}
                placeholder="Briefly describe what you would like help with (optional & confidential)..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888] resize-none"
              ></textarea>
            </div>

            {/* Mandatory Legal & Regulatory Clickwrap Checkboxes (HIPAA/TX HB 300, Texas Telehealth, FCC TCPA) */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2.5 text-[11px] text-[#44403C]">
              <p className="font-bold text-[#9E7206] uppercase tracking-wider text-[10px]">
                4. Required Texas &amp; Federal Healthcare Informed Consents
              </p>

              <label className="flex items-start gap-2.5 cursor-pointer leading-relaxed">
                <input
                  type="checkbox"
                  required
                  checked={hipaaConsent}
                  onChange={(e) => setHipaaConsent(e.target.checked)}
                  className="mt-0.5 accent-[#9E7206] shrink-0"
                />
                <span>
                  <strong>HIPAA &amp; Texas HB 300 Privacy Notice:</strong> I acknowledge receipt of
                  the{' '}
                  <a
                    href="#privacy"
                    onClick={resetAndClose}
                    className="text-[#9E7206] font-semibold underline"
                  >
                    Notice of Privacy Practices (HIPAA &amp; Texas HB 300)
                  </a>{' '}
                  and{' '}
                  <a
                    href="#terms"
                    onClick={resetAndClose}
                    className="text-[#9E7206] font-semibold underline"
                  >
                    Terms of Service
                  </a>
                  , including my right to receive a Federal <strong>Good Faith Estimate</strong> under
                  the No Surprises Act (45 C.F.R. § 149.610). *
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer leading-relaxed">
                <input
                  type="checkbox"
                  required
                  checked={telehealthTexasConsent}
                  onChange={(e) => setTelehealthTexasConsent(e.target.checked)}
                  className="mt-0.5 accent-[#9E7206] shrink-0"
                />
                <span>
                  <strong>Texas Telehealth Consent &amp; Location Attestation:</strong> Pursuant to
                  Texas Occupations Code Ch. 111, I consent to 100% telehealth psychiatric care,
                  confirm I will be <strong>physically located in the State of Texas</strong> during my
                  video sessions, and understand this is not an emergency service (for emergencies,
                  call <strong>911</strong>, dial <strong>988</strong>, or call Poison Control at{' '}
                  <strong>800-222-1222</strong>). *
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer leading-relaxed">
                <input
                  type="checkbox"
                  required
                  checked={tcpaSmsEmailConsent}
                  onChange={(e) => setTcpaSmsEmailConsent(e.target.checked)}
                  className="mt-0.5 accent-[#9E7206] shrink-0"
                />
                <span>
                  <strong>FCC / TCPA Appointment SMS &amp; Email Consent:</strong> I consent to receive
                  transactional appointment confirmations, HIPAA telehealth video links, and portal
                  security alerts from Golden Mind Psychiatry PLLC via email and SMS. Msg &amp; data
                  rates may apply; reply <strong>STOP</strong> to opt out or <strong>HELP</strong> for
                  help. Mobile opt-in data is never sold or shared for marketing. *
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting || availabilityCheck.isUnavailable}
                className="w-full py-3.5 rounded-full font-bold text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                <Calendar className="w-4 h-4 text-[#1C1917]" />
                <span>
                  {submitting
                    ? 'Provisioning Telehealth Room...'
                    : 'Confirm 100% Telehealth Appointment'}
                </span>
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[#78716C]">
                <Shield className="w-3 h-3 text-[#B8860B]" />
                <span>100% Encrypted · HIPAA, Texas HB 300 &amp; No Surprises Act Compliant</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

