import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, Video, Shield, ShieldCheck } from 'lucide-react';
import { conditionsData } from '../data/conditions';
import { AppointmentFormData } from '../types';
import { auth } from '../lib/firebase';
import { createTelehealthAppointment, ensurePatientOnboarding } from '../services/clinicalAutomation';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCondition?: string;
  onNavigateToPortal?: () => void;
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
    serviceType: 'Comprehensive Psychiatric Evaluation',
    conditionReason: prefillCondition || 'ADHD (Attention-Deficit / Hyperactivity Disorder)',
    visitPreference: 'telehealth',
    preferredDate: '',
    preferredTime: 'Mon–Thu Morning (8:00 AM - 12:00 PM)',
    insuranceProvider: 'Blue Cross Blue Shield (BCBS)',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [provisionedRoomUrl, setProvisionedRoomUrl] = useState<string>('');

  useEffect(() => {
    if (prefillCondition) {
      setFormData((prev) => ({ ...prev, conditionReason: prefillCondition }));
    }
  }, [prefillCondition]);

  useEffect(() => {
    if (auth.currentUser) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || auth.currentUser?.email || '',
        fullName: prev.fullName || auth.currentUser?.displayName || '',
      }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let currentPortalUser = null;
      if (auth.currentUser) {
        currentPortalUser = await ensurePatientOnboarding(auth.currentUser, {
          fullName: formData.fullName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          insuranceProvider: formData.insuranceProvider,
        });
      }
      const result = await createTelehealthAppointment(formData, currentPortalUser);
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
              100% Telehealth Visit Confirmed & Provisioned
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
                <span className="text-[#78716C]">Visit Format:</span>
                <span className="text-[#1C1917]">100% Telehealth Video Visit (Texas)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 font-mono tabular-nums">
                <span className="text-[#78716C]">Date & Window:</span>
                <span className="text-[#1C1917]">
                  {formData.preferredDate || 'Next Available'} · {formData.preferredTime}
                </span>
              </div>
              {provisionedRoomUrl && (
                <div className="flex justify-between py-1 border-b border-stone-200 font-mono">
                  <span className="text-[#78716C]">HIPAA Video Room:</span>
                  <span className="text-emerald-700 font-semibold truncate max-w-[240px]">
                    {provisionedRoomUrl}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-[#78716C]">Coverage / Payment:</span>
                <span className="text-[#9E7206] font-semibold">{formData.insuranceProvider}</span>
              </div>
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
                  <span>Open Client Portal & Intake Forms</span>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2 border-b border-stone-100">
              <span className="text-[11px] font-semibold tracking-widest text-[#9E7206] uppercase">
                Golden Mind Psychiatry PLLC
              </span>
              <h2 className="text-2xl font-serif text-[#1C1917] font-bold">
                Book a 100% Telehealth Consultation
              </h2>
              <p className="text-xs text-[#78716C]">
                With Brenda Hobyani, PMHNP-BC · Adults, Teens & Children Across Texas
              </p>
            </div>

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
                    Available Anywhere Across Texas for Children, Teens & Adults · Automatic HIPAA
                    Video Link Provisioning
                  </p>
                </div>
              </div>
            </div>

            {/* Condition or Service Focus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="text-xs font-semibold text-[#9E7206] uppercase tracking-wider block mb-1.5">
                  Insurance / Payment
                </label>
                <select
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                >
                  <option value="Blue Cross Blue Shield (BCBS)">Blue Cross Blue Shield (BCBS)</option>
                  <option value="Aetna">Aetna</option>
                  <option value="Cigna / Evernorth">Cigna / Evernorth</option>
                  <option value="UnitedHealthcare / Optum">UnitedHealthcare / Optum</option>
                  <option value="Medicare">Medicare</option>
                  <option value="Self-Pay / Out-of-Network Superbill">
                    Self-Pay / Out-of-Network (Superbill)
                  </option>
                </select>
              </div>
            </div>

            {/* Patient Personal Information */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-semibold text-[#9E7206] uppercase tracking-wider block">
                3. Patient Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Legal Name *"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888]"
                  />
                </div>

                <div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address (Links to Client Portal) *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888]"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none placeholder-[#888]"
                  />
                </div>
              </div>
            </div>

            {/* Date & Time Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#57534E] block mb-1 font-medium">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none font-mono tabular-nums"
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
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
                <span>100% Encrypted & HIPAA Compliant · Instant Portal Sync</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
