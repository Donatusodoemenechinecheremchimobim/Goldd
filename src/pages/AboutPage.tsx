import React from 'react';
import { providerBrenda, aboutUsOfficial } from '../data/provider';
import { Award, Shield, CheckCircle2, Heart, BookOpen, Clock, Calendar, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onOpenBooking }) => {
  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-200 overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
            About Golden Mind Psychiatry PLLC
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1917] tracking-tight">
            Accessible, Compassionate <br />
            <span className="text-gold-bright">& Personalized Psychiatric Care.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto font-light leading-relaxed">
            Dedicated to supporting individuals on their journey to emotional well-being, mental stability, and enhanced quality of life.
          </p>
        </div>
      </section>

      {/* Official Practice Overview Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="p-8 md:p-10 rounded-3xl bg-[#FAF9F5] border border-[#D4AF37]/35 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Our Foundation & Purpose
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Committed to Understanding Your Unique Needs
            </h2>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-[#3F3F46] leading-relaxed font-normal">
            <p className="p-5 rounded-2xl bg-white border-l-4 border-[#D4AF37] text-[#1C1917] shadow-xs">
              {aboutUsOfficial.paragraph1}
            </p>
            <p className="p-5 rounded-2xl bg-white border border-stone-200 text-[#1C1917] shadow-xs">
              {aboutUsOfficial.paragraph2}
            </p>
          </div>
        </div>
      </section>

      {/* Head Owner Spotlight: Brenda Hobyani, PMHNP-BC */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Portrait Container */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-xl group bg-white">
              <img
                src="/brenda_hobyani.jpg"
                alt="Brenda Hobyani, PMHNP-BC - Board-Certified Psychiatric Mental Health Nurse Practitioner and Head Owner of Golden Mind Psychiatry"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D4AF37]/40 text-center shadow-md">
                <h3 className="font-serif text-lg font-bold text-[#1C1917]">
                  Brenda Hobyani
                </h3>
                <p className="text-xs font-bold text-[#9E7206]">
                  PMHNP-BC
                </p>
                <p className="text-[11px] text-[#57534E] font-medium">
                  Head Owner & Clinical Director
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[#78716C]">
              <Award className="w-4 h-4 text-[#B8860B]" />
              <span className="font-medium text-[#44403C]">ANCC Board-Certified · DEA Licensed</span>
            </div>
          </div>

          {/* Detailed Biography & Clinical Vision */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
                Clinical Leadership
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#1C1917]">
                Meet Brenda Hobyani, PMHNP-BC
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 italic text-sm text-[#44403C] leading-relaxed shadow-xs">
              "{providerBrenda.philosophy}"
            </div>

            <div className="space-y-3 text-sm text-[#57534E] leading-relaxed font-normal">
              <p>
                With extensive clinical training across inpatient psychiatric hospitals, outpatient community health centers, and telepsychiatry, Brenda Hobyani founded Golden Mind Psychiatry PLLC to create a warm, dignified, and scientifically grounded environment where patients are truly heard.
              </p>
              <p>
                Brenda specializes in treating complex mood disorders, adult and pediatric ADHD, trauma/PTSD, and perinatal mental health. Her practice harmonizes evidence-based psychopharmacology with integrative lifestyle interventions, restoring the clarity, resilience, and emotional peace needed to thrive.
              </p>
            </div>

            {/* Certifications and Licensure */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E7206] mb-3">
                Licensure & Professional Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#44403C]">
                {providerBrenda.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                    <span className="font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={onOpenBooking}
                className="px-7 py-3 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Calendar className="w-4 h-4 text-[#1C1917]" />
                <span>Schedule With Brenda</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect During Your First Visit */}
      <section className="py-16 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
              Patient Journey
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#1C1917]">
              What to Expect at Golden Mind
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              We know scheduling a psychiatric evaluation can feel intimidating. Here is how we ensure a calm, supportive experience from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#B8860B]">STEP 1</span>
              <h3 className="text-lg font-serif font-bold text-[#1C1917]">Effortless Digital Intake</h3>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                Complete your medical history and clinical questionnaires at your own pace from your phone or computer before your visit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#B8860B]">STEP 2</span>
              <h3 className="text-lg font-serif font-bold text-[#1C1917]">Comprehensive Clinical Consultation</h3>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                Brenda sits with you attentively. No judgment, no rushing. We thoroughly review your symptoms, biology, and personal goals.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#B8860B]">STEP 3</span>
              <h3 className="text-lg font-serif font-bold text-[#1C1917]">Collaborative Roadmap</h3>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                You receive clear diagnostic explanations, personalized medication options, lifestyle guidance, and direct follow-up scheduling.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
