import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle2, Video, MapPin, Shield, User, Mail, Phone } from 'lucide-react';
import { conditionsData } from '../data/conditions';
import { AppointmentFormData } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCondition?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  prefillCondition,
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
    preferredTime: 'Morning (9:00 AM - 12:00 PM)',
    insuranceProvider: 'Self-Pay / Out-of-Network',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (prefillCondition) {
      setFormData((prev) => ({ ...prev, conditionReason: prefillCondition }));
    }
  }, [prefillCondition]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setSubmitted(false);
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
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif text-[#1C1917] font-bold">
              Appointment Request Received
            </h3>
            <p className="text-sm text-[#57534E] max-w-md mx-auto leading-relaxed">
              Thank you, <span className="text-[#1C1917] font-semibold">{formData.fullName}</span>. Your request for a <span className="text-[#1C1917] font-medium">Telehealth Video Visit</span> with <strong className="text-[#9E7206]">Brenda Hobyani, PMHNP-BC</strong> has been logged.
            </p>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-xs text-left space-y-2 my-4">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-[#78716C]">Focus Area:</span>
                <span className="text-[#1C1917] font-medium">{formData.conditionReason}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-[#78716C]">Visit Format:</span>
                <span className="text-[#1C1917]">100% Telehealth Video Visit</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-[#78716C]">Requested Date & Window:</span>
                <span className="text-[#1C1917]">{formData.preferredDate || 'Next Available'} · {formData.preferredTime}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#78716C]">Coverage / Payment:</span>
                <span className="text-[#9E7206] font-semibold">{formData.insuranceProvider}</span>
              </div>
            </div>

            <p className="text-xs text-[#78716C] leading-relaxed">
              Our clinical coordinator will contact you at <strong className="text-[#1C1917]">{formData.phone || formData.email}</strong> within 1 business day with your intake paperwork and portal link.
            </p>

            <button
              onClick={resetAndClose}
              className="mt-4 px-6 py-2.5 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-sm hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all cursor-pointer shadow-xs"
            >
              Done & Return to Site
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2 border-b border-stone-100">
              <span className="text-[11px] font-semibold tracking-widest text-[#9E7206] uppercase">
                Golden Mind Psychiatry PLLC
              </span>
              <h2 className="text-2xl font-serif text-[#1C1917] font-bold">
                Book a Consultation
              </h2>
              <p className="text-xs text-[#78716C]">
                With Brenda Hobyani, PMHNP-BC · Confidential & Compassionate
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
                    100% Telehealth Video Visit
                  </p>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    Available Anywhere Across Texas · Encrypted HIPAA Video Room from the Comfort of Your Home
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
                  <option value="Medication Second Opinion / Refinement">Medication Second Opinion / Refinement</option>
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
                  <option value="Aetna">Aetna</option>
                  <option value="Blue Cross Blue Shield (BCBS)">Blue Cross Blue Shield (BCBS)</option>
                  <option value="Cigna / Evernorth">Cigna / Evernorth</option>
                  <option value="UnitedHealthcare / Optum">UnitedHealthcare / Optum</option>
                  <option value="Medicare">Medicare</option>
                  <option value="Self-Pay / Out-of-Network Superbill">Self-Pay / Out-of-Network (Superbill)</option>
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
                    className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address *"
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
                <label className="text-[11px] text-[#57534E] block mb-1 font-medium">Preferred Date</label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#57534E] block mb-1 font-medium">Preferred Time Window</label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none"
                >
                  <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1:00 PM - 4:00 PM)</option>
                  <option value="Late Afternoon (4:00 PM - 6:30 PM)">Late Afternoon (4:00 PM - 6:30 PM)</option>
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
                className="w-full py-3.5 rounded-full font-bold text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Calendar className="w-4 h-4 text-[#1C1917]" />
                <span>Confirm Appointment Request</span>
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[#78716C]">
                <Shield className="w-3 h-3 text-[#B8860B]" />
                <span>100% Encrypted & HIPAA Compliant Patient Intake</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
