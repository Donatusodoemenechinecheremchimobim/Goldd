import React from 'react';
import { Video, Shield, Laptop, CheckCircle2, Clock, Calendar } from 'lucide-react';

interface TelehealthPageProps {
  onOpenBooking: () => void;
}

export const TelehealthPage: React.FC<TelehealthPageProps> = ({ onOpenBooking }) => {
  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-200 overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F0] border border-[#D4AF37]/35 text-xs font-semibold uppercase tracking-wider text-[#9E7206]">
            <Video className="w-3.5 h-3.5 text-[#B8860B]" />
            <span>Statewide Telepsychiatry Care</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1917] tracking-tight">
            Expert Psychiatric Care, <br />
            <span className="text-gold-bright">From the Comfort of Home.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto font-light leading-relaxed">
            Convenient, confidential, and secure HIPAA-compliant virtual psychiatry appointments with Brenda Hobyani, PMHNP-BC anywhere in Texas.
          </p>

          <div className="pt-2 flex justify-center">
            <button
              onClick={onOpenBooking}
              className="px-8 py-3.5 rounded-full font-bold text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Calendar className="w-4 h-4 text-[#1C1917]" />
              <span>Schedule a Telehealth Visit</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* The 4 Advantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: '100% Confidential',
              desc: 'Encrypted, HIPAA-compliant telehealth platform with zero downloads required on standard browsers.',
              icon: Shield,
            },
            {
              title: 'No Commute or Traffic',
              desc: 'Join your appointment from your home, private office, or wherever you feel most at ease.',
              icon: Laptop,
            },
            {
              title: 'Direct E-Prescriptions',
              desc: 'Prescriptions are transmitted electronically in real time to your preferred local pharmacy.',
              icon: CheckCircle2,
            },
            {
              title: 'Punctual & Respectful',
              desc: 'We value your time. Appointments start promptly without sitting in crowded waiting rooms.',
              icon: Clock,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#FAF6EA] border border-[#D4AF37]/40 flex items-center justify-center text-[#B8860B]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#1C1917]">{item.title}</h3>
                <p className="text-xs text-[#57534E] leading-relaxed font-light">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* How It Works Step by Step */}
        <div className="p-8 md:p-10 rounded-3xl bg-white border border-[#D4AF37]/35 space-y-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              How Virtual Care Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-2.5">
              <span className="text-xs font-mono font-bold text-[#9E7206]">STEP 01</span>
              <h3 className="text-base font-bold text-[#1C1917]">Book Online & Complete Intake</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Choose a time that works for you. You will receive an email link to complete simple, secure digital intake forms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-2.5">
              <span className="text-xs font-mono font-bold text-[#9E7206]">STEP 02</span>
              <h3 className="text-base font-bold text-[#1C1917]">1-Click Video Consultation</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Click your private link from any smartphone, tablet, or laptop. No complicated app downloads required.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-2.5">
              <span className="text-xs font-mono font-bold text-[#9E7206]">STEP 03</span>
              <h3 className="text-base font-bold text-[#1C1917]">Prescriptions & Ongoing Care</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Medications are sent directly to your pharmacy. Schedule regular virtual follow-ups to track your progress.
              </p>
            </div>
          </div>
        </div>

        {/* Telehealth FAQ */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h3 className="text-xl font-serif font-bold text-[#1C1917] text-center mb-6">
            Frequently Asked Questions About Telehealth
          </h3>

          {[
            {
              q: 'Can ADHD or controlled medications be prescribed via Telehealth in Texas?',
              a: 'Yes, licensed psychiatric nurse practitioners with active DEA and state registrations can evaluate and prescribe indicated medications via telehealth following state medical board and federal telehealth rules.'
            },
            {
              q: 'What do I need to prepare for my virtual appointment?',
              a: 'You simply need a private, quiet room with adequate lighting and a stable internet connection on a smartphone, tablet, or computer with a camera and microphone.'
            },
            {
              q: 'Does insurance cover telepsychiatry visits?',
              a: 'Yes! Major commercial insurers (Aetna, BCBS, Cigna, UnitedHealthcare) and Medicare cover telehealth psychiatric visits with parity in Texas.'
            }
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-stone-200 space-y-1.5 shadow-2xs">
              <h4 className="text-sm font-semibold text-[#1C1917]">{item.q}</h4>
              <p className="text-xs text-[#57534E] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
