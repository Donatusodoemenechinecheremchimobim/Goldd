import React from 'react';
import { Shield, Check, FileText, HelpCircle, Calendar, ArrowRight, DollarSign } from 'lucide-react';

interface InsurancePageProps {
  onOpenBooking: () => void;
}

export const InsurancePage: React.FC<InsurancePageProps> = ({ onOpenBooking }) => {
  const insurances = [
    { name: 'Aetna', desc: 'Commercial & Employer-sponsored PPO / HMO plans' },
    { name: 'Blue Cross Blue Shield (BCBS)', desc: 'Texas & Federal Employee health programs' },
    { name: 'Cigna / Evernorth', desc: 'Behavioral Health Network plans' },
    { name: 'UnitedHealthcare / Optum', desc: 'Commercial PPO and Choice plans' },
    { name: 'Medicare', desc: 'Traditional Part B Medicare for seniors & qualifying individuals' },
    { name: 'Humana', desc: 'Select commercial & employer plans' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-200 overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
            Coverage & Transparent Investment · “Where Every Mind Is Golden.”
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1917] tracking-tight">
            Insurance & Affordable Care
          </h1>
          <p className="text-sm sm:text-base font-serif italic font-semibold text-[#9E7206]">
            “Where Every Mind Is Golden.”
          </p>
          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto font-light leading-relaxed">
            We partner with major insurance carriers and provide clear, upfront self-pay pricing with zero surprise medical bills.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Accepted Insurance Plans */}
        <div className="space-y-6">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              In-Network Partners
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Accepted Insurance Plans
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              We verify your co-pay and deductible prior to your first appointment so you have complete financial transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insurances.map((ins, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-[#D4AF37] transition-colors flex items-start gap-3.5 shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#FAF6EA] border border-[#D4AF37]/40 flex items-center justify-center text-[#B8860B] shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917]">{ins.name}</h3>
                  <p className="text-xs text-[#78716C] mt-0.5">{ins.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transparent Self-Pay Fee Schedule */}
        <div className="p-8 md:p-10 rounded-3xl bg-white border border-[#D4AF37]/35 space-y-8 shadow-xs">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Self-Pay & Out-of-Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Transparent Fee Schedule
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              For patients without insurance, high-deductible plans, or those who prefer direct private pay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9E7206]">Initial Visit</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1C1917]">$450</span>
                <span className="text-xs text-[#78716C]">/ Diagnostic Intake</span>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Comprehensive psychiatric diagnostic evaluation, detailed medical history review, treatment plan formulation, and initial prescription orders.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9E7206]">Follow-Up Visit</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1C1917]">$250</span>
                <span className="text-xs text-[#78716C]">/ Medication Follow-Up</span>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Ongoing medication management, dose optimization, response monitoring, symptom tracking, and electronic prescription refills.
              </p>
            </div>
          </div>

          {/* Superbill Assistance Note */}
          <div className="p-4 rounded-xl bg-[#FAF6EA] border border-[#D4AF37]/30 flex items-start gap-3 text-xs text-[#44403C]">
            <FileText className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1C1917]">Superbill Invoices Provided: </strong>
              If you have out-of-network insurance benefits, we provide detailed, coded medical receipts (Superbills) that you can easily submit to your insurer for direct reimbursement.
            </div>
          </div>
        </div>

        {/* Booking CTA */}
        <div className="text-center space-y-4 max-w-xl mx-auto pt-4">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#FAF6EA] border border-[#D4AF37]/45 text-xs font-serif italic font-bold text-[#9E7206]">
            “Where Every Mind Is Golden.”
          </span>
          <h3 className="text-2xl font-serif font-bold text-[#1C1917]">
            Have Questions About Your Coverage?
          </h3>
          <p className="text-xs sm:text-sm text-[#78716C]">
            Our care team is happy to verify your specific insurance benefits before your visit.
          </p>
          <button
            onClick={onOpenBooking}
            className="px-8 py-3.5 rounded-full font-bold text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
          >
            <span>Book with Insurance or Self-Pay</span>
            <ArrowRight className="w-4 h-4 text-[#1C1917]" />
          </button>
        </div>
      </div>
    </div>
  );
};
