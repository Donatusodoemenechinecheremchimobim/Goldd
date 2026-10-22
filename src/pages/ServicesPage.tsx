import React from 'react';
import { servicesData } from '../data/services';
import { conditionsData } from '../data/conditions';
import { Clock, CheckCircle2, ArrowRight, Calendar, Sparkles } from 'lucide-react';

interface ServicesPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (serviceName?: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate, onOpenBooking }) => {
  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-200 overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
            Clinical Services & Programs
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1917] tracking-tight">
            Comprehensive Psychiatric Medicine
          </h1>
          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto font-light leading-relaxed">
            Comprehensive psychiatric evaluations, precision psychopharmacology, and integrative mental healthcare delivered with warmth and dignity.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesData.map((service) => (
            <div
              key={service.id}
              className="p-8 rounded-3xl bg-white border border-stone-200 hover:border-[#D4AF37] transition-all space-y-6 flex flex-col justify-between shadow-xs hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9E7206] uppercase tracking-wider">
                    {service.name.split(' ')[0]} Care
                  </span>
                  {service.serviceCategory && (
                    <span className="text-xs text-[#57534E] px-3 py-1 rounded-full bg-[#FAF8F5] border border-stone-200 font-medium">
                      {service.serviceCategory}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-serif font-bold text-[#1C1917]">
                  {service.name}
                </h2>

                <p className="text-xs sm:text-sm text-[#44403C] leading-relaxed font-light whitespace-pre-line">
                  {service.details}
                </p>

                <div className="pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E7206] mb-2.5">
                    Key Clinical Highlights:
                  </h3>
                  <ul className="space-y-2 text-xs text-[#44403C]">
                    {service.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <button
                  onClick={() => onOpenBooking(service.name)}
                  className="w-full py-3 rounded-full font-bold text-xs sm:text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Calendar className="w-4 h-4 text-[#1C1917]" />
                  <span>Schedule {service.name.split(' ')[0]} Visit</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Banner Linking to Individual Condition Pages */}
        <div className="p-8 md:p-10 rounded-3xl bg-[#FAF7F0] border border-[#D4AF37]/35 text-center space-y-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
            Looking for a Specific Condition?
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
            We Feature Dedicated Guides for Every Condition
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] max-w-2xl mx-auto">
            From ADHD and Women's Mental Health to PTSD, Panic Disorders, and Sleep Architecture, explore individual diagnosis and treatment pages.
          </p>

          <div className="pt-3 flex flex-wrap justify-center gap-2">
            {conditionsData.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onNavigate('condition-detail', c.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:border-[#D4AF37] text-xs font-medium text-[#292524] hover:text-[#9E7206] transition-colors cursor-pointer shadow-2xs"
              >
                {c.name.split('(')[0]} →
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
