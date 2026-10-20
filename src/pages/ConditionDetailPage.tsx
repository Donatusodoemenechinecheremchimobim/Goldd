import React from 'react';
import { conditionsData } from '../data/conditions';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Shield,
  HeartHandshake,
  ChevronRight,
  Pill,
  Brain,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ConditionDetailPageProps {
  conditionId: string;
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (conditionName?: string) => void;
}

export const ConditionDetailPage: React.FC<ConditionDetailPageProps> = ({
  conditionId,
  onNavigate,
  onOpenBooking,
}) => {
  const condition = conditionsData.find((c) => c.id === conditionId) || conditionsData[0];
  const otherConditions = conditionsData.filter((c) => c.id !== condition.id);

  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* Mobile-Optimized Breadcrumb Header */}
      <div className="bg-white border-b border-stone-200 py-3 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => {
              onNavigate('conditions-overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#FAF0D4] border border-stone-200 hover:border-[#D4AF37] text-xs font-semibold text-[#1C1917] hover:text-[#9E7206] transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            aria-label="Back to all conditions"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
            <span className="whitespace-nowrap">All Conditions</span>
          </button>

          <div className="flex items-center gap-1.5 text-[#78716C] min-w-0 overflow-hidden">
            <span className="hidden sm:inline">Conditions</span>
            <span className="hidden sm:inline text-stone-300">/</span>
            <span className="text-[#9E7206] font-semibold truncate text-xs sm:text-sm">
              {condition.name.split('(')[0].trim()}
            </span>
          </div>

          <button
            onClick={() => onOpenBooking(condition.name)}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] bg-gold-gradient px-4 py-1.5 rounded-full hover:shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-[#1C1917]" />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      {/* Hero Section for Condition */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center overflow-hidden border-b border-stone-200 bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-full max-w-[300px] sm:max-w-[340px] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-stone-800/80 bg-black">
              <img
                src="/golden_mind_card.webp"
                alt="Golden Mind Psychiatry PLLC"
                className="w-full h-auto object-cover block"
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1C1917] tracking-tight leading-tight">
            {condition.name}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gold-bright max-w-2xl mx-auto font-light leading-relaxed">
            "{condition.tagline}"
          </p>

          <p className="text-sm sm:text-base text-[#44403C] max-w-3xl mx-auto leading-relaxed font-light">
            {condition.overview}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenBooking(condition.name)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Calendar className="w-4 h-4 text-[#1C1917]" />
              <span>Book Appointment for {condition.name.split(' ')[0]}</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('symptoms-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-stone-300 bg-white text-sm font-medium text-[#292524] hover:text-[#9E7206] hover:bg-[#FAF8F5] transition-colors cursor-pointer shadow-xs"
            >
              Review Symptoms & Treatments ↓
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-16">
        {/* Symptoms & Common Presentations */}
        <section id="symptoms-section" className="space-y-6">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Clinical Presentation
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Common Symptoms & Diagnostic Indicators
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              Symptoms vary across individuals and developmental stages. A thorough evaluation determines how they interact with your daily life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {condition.symptoms.map((symptom, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-stone-200 flex items-start gap-3.5 hover:border-[#D4AF37]/50 transition-colors shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#FAF6EA] border border-[#D4AF37]/40 flex items-center justify-center text-[#B8860B] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs sm:text-sm text-[#292524] leading-relaxed">
                  {symptom}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Treatment Approach at Golden Mind */}
        <section className="p-8 md:p-10 rounded-3xl bg-white border border-[#D4AF37]/35 relative overflow-hidden space-y-8 shadow-xs">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Our Clinical Model
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              How Brenda Hobyani, PMHNP-BC Treats {condition.name.split('(')[0]}
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              A collaborative, multi-step care plan designed to restore stability without rushing or over-medicating.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {condition.treatmentApproach.map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-3"
              >
                <span className="text-xs font-mono font-bold text-[#9E7206]">
                  STEP 0{idx + 1}
                </span>
                <h3 className="text-lg font-serif font-bold text-[#1C1917]">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Medication Management Spotlight */}
          <div className="p-6 rounded-2xl bg-[#FAF6EA] border border-[#D4AF37]/40 space-y-2">
            <div className="flex items-center gap-2 text-[#9E7206]">
              <Pill className="w-5 h-5" />
              <h4 className="font-semibold text-sm uppercase tracking-wider text-[#1C1917]">
                Evidence-Based Medication Management Details
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[#44403C] leading-relaxed font-light">
              {condition.medicationInfo}
            </p>
          </div>
        </section>

        {/* Drivers and Holistic Support Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Causes and Triggers */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#9E7206]">
              <Layers className="w-5 h-5" />
              <h3 className="text-lg font-serif font-bold text-[#1C1917]">
                Biological & Environmental Drivers
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#57534E]">
              {condition.causesAndTriggers.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] mt-2 shrink-0"></span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Holistic & Lifestyle Supports */}
          <div className="p-7 rounded-3xl bg-white border border-stone-200 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#9E7206]">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-lg font-serif font-bold text-[#1C1917]">
                Integrative & Lifestyle Pillars
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#57534E]">
              {condition.holisticSupport.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] mt-2 shrink-0"></span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <section className="space-y-6 pt-4">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Common Inquiries
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Frequently Asked Questions About {condition.name.split('(')[0]}
            </h2>
          </div>

          <div className="space-y-4">
            {condition.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-stone-200 space-y-2 text-left shadow-xs"
              >
                <div className="flex items-start gap-2.5 text-[#1C1917]">
                  <HelpCircle className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                  <h4 className="font-semibold text-sm sm:text-base">
                    {faq.question}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-[#57534E] pl-7 leading-relaxed font-light">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Provider Commitment Banner */}
        <div className="p-8 rounded-3xl bg-[#FAF7F0] border border-[#D4AF37]/40 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left shadow-xs">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-serif font-bold text-[#1C1917]">
              Ready to Discuss a Personalized Plan with Brenda Hobyani, PMHNP-BC?
            </h3>
            <p className="text-xs sm:text-sm text-[#57534E]">
              Schedule your comprehensive diagnostic intake. Available via secure Telehealth across Texas from the comfort of your home.
            </p>
          </div>

          <button
            onClick={() => onOpenBooking(condition.name)}
            className="px-8 py-3.5 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-sm hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all shrink-0 cursor-pointer shadow-sm"
          >
            Schedule Consultation
          </button>
        </div>

        {/* Explore Other Conditions Switcher */}
        <section className="pt-8 border-t border-stone-200 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
            Explore Other Clinical Specialties
          </h3>
          <div className="flex flex-wrap gap-2">
            {otherConditions.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onNavigate('condition-detail', c.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-[#D4AF37] text-xs font-medium text-[#44403C] hover:text-[#9E7206] transition-all cursor-pointer shadow-2xs"
              >
                {c.name.split('(')[0]}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
