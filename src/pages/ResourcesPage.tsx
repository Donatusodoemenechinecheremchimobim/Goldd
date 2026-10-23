import React from 'react';
import { SymptomScreener } from '../components/SymptomScreener';
import { BookOpen, Heart, Phone, FileText, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ResourcesPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (prefillCondition?: string) => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ onNavigate, onOpenBooking }) => {
  const articles = [
    {
      title: '5 Signs Your Psychiatric Medication May Need a Precision Adjustment',
      category: 'Medication Management',
      date: 'Clinical Update',
      readTime: '4 min read',
      excerpt: 'Psychiatric medications are not one-size-fits-all. Learn how subtle changes in sleep, afternoon energy slumps, or emotional flattening signal it’s time to consult with your provider.',
      conditionId: 'medication-management'
    },
    {
      title: 'Unmasking Adult ADHD: Why It Is Frequently Overlooked in Women and High Achievers',
      category: 'ADHD Insights',
      date: 'Diagnostic Guide',
      readTime: '6 min read',
      excerpt: 'How compensatory coping mechanisms, anxiety masking, and internalized hyperactivity lead many brilliant adults to miss their ADHD diagnosis until adulthood.',
      conditionId: 'adhd'
    },
    {
      title: 'The Biological Gut-Brain Axis: How Nutrition and Inflammation Influence Mood',
      category: 'Integrative Psychiatry',
      date: 'Mind-Body Wellness',
      readTime: '5 min read',
      excerpt: 'Why addressing systemic inflammation, microbiome diversity, and key micronutrient co-factors like magnesium and L-methylfolate amplifies the benefits of conventional psychiatric medicine.',
      conditionId: 'holistic-integrative'
    },
    {
      title: 'Navigating Perinatal and Postpartum Mood Shifts with Compassion and Safety',
      category: 'Women\'s Mental Health',
      date: 'Maternal Care',
      readTime: '5 min read',
      excerpt: 'A science-backed guide to understanding reproductive neurosteroids, postpartum anxiety, and how safe modern psychiatric treatments protect both mother and infant bonding.',
      conditionId: 'womens-mental-health'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-200 overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
            Mental Health Education & Support
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1917] tracking-tight">
            Resources, Guides & Crisis Support
          </h1>
          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto font-light leading-relaxed">
            Empowering patients and families with clear, destigmatized psychiatric knowledge, clinical articles, and immediate support channels.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Immediate Crisis Hotlines Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-rose-50 border border-rose-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs tracking-wider uppercase">
            <Heart className="w-4 h-4 fill-rose-600" />
            <span>Emergency &amp; 24/7 Crisis Support Numbers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-rose-600 font-semibold block uppercase">Suicide &amp; Crisis Lifeline</span>
              <strong className="text-[#1C1917] text-lg font-serif">Dial 988</strong>
              <p className="text-[#57534E] mt-1">Available 24/7 across the US. Free, confidential phone and text support.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-rose-600 font-semibold block uppercase">Poison Control (24/7)</span>
              <a href="tel:8002221222" className="text-[#1C1917] hover:text-rose-700 transition-colors text-lg font-serif font-bold block">
                800-222-1222
              </a>
              <p className="text-[#57534E] mt-1">Available 24 hours, 7 days a week for medication overdose or poison emergencies.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-rose-600 font-semibold block uppercase">Crisis Text Line</span>
              <strong className="text-[#1C1917] text-lg font-serif">Text HOME to 741741</strong>
              <p className="text-[#57534E] mt-1">Free 24/7 crisis support via SMS with a trained crisis counselor.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-rose-600 font-semibold block uppercase">Veterans Crisis Line</span>
              <strong className="text-[#1C1917] text-lg font-serif">Dial 988, Press 1</strong>
              <p className="text-[#57534E] mt-1">Dedicated, confidential support for service members and veterans.</p>
            </div>
          </div>
        </div>

        {/* Clinical Articles & Guides */}
        <div className="space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              From the Desk of Brenda Hobyani, PMHNP-BC
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Clinical Articles & Psychiatric Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((art, idx) => (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white border border-stone-200 hover:border-[#D4AF37] transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#78716C]">
                    <span className="text-[#9E7206] font-semibold">{art.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{art.readTime}</span>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-[#1C1917] hover:text-[#9E7206] transition-colors">
                    {art.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed font-light">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (art.conditionId) {
                        onNavigate('condition-detail', art.conditionId);
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold text-[#9E7206] hover:text-[#1C1917] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Read Related Condition Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Embedded Symptom Screener Tool */}
        <div className="space-y-4">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Interactive Tool
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Preliminary Self-Assessment
            </h2>
          </div>
          <SymptomScreener onOpenBooking={onOpenBooking} />
        </div>
      </div>
    </div>
  );
};
