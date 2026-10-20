import React, { useState } from 'react';
import { generalConditionsList } from '../data/generalConditions';
import { conditionsData } from '../data/conditions';
import { GoldenMindLogo } from '../components/GoldenMindLogo';
import {
  Search,
  Brain,
  ArrowRight,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface ConditionsOverviewPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (conditionName?: string) => void;
}

export const ConditionsOverviewPage: React.FC<ConditionsOverviewPageProps> = ({
  onNavigate,
  onOpenBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Filter categories and sub-conditions based on search term and category filter
  const filteredCategories = generalConditionsList
    .filter((cat) => selectedCategoryFilter === 'all' || cat.id === selectedCategoryFilter)
    .filter((cat) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(term);
      const matchOverview = cat.overview.toLowerCase().includes(term);
      const matchSub = cat.subConditions.some(
        (s) => s.name.toLowerCase().includes(term) || s.shortDesc.toLowerCase().includes(term)
      );
      return matchName || matchOverview || matchSub;
    });

  const handleSubConditionClick = (targetConditionId: string) => {
    onNavigate('condition-detail', targetConditionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* =========================================================================
          HERO SECTION & CATEGORY BUTTONS
          (Matching the pill button style from Radiant Souls screenshot)
      ========================================================================= */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-200 overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#D4AF37]/10 blur-[140px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFDF7] border border-[#D4AF37]/40 text-xs font-semibold uppercase tracking-wider text-[#9E7206] shadow-xs">
            <Brain className="w-3.5 h-3.5 text-[#B8860B]" />
            <span>General Conditions & Sub-Specialties Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-[#1C1917] tracking-tight leading-tight">
            Comprehensive Conditions <br />
            <span className="text-gold-bright">& Sub-Conditions We Treat</span>
          </h1>

          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto font-light leading-relaxed">
            Explore our general psychiatric clinical categories below. Each condition features specific sub-conditions and its own dedicated in-depth care guide led by Brenda Hobyani, PMHNP-BC.
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#B8860B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any condition, sub-condition, or symptom (e.g. PMDD, Adult ADHD, Panic)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-300 focus:border-[#D4AF37] rounded-full text-xs sm:text-sm text-[#1C1917] focus:outline-none shadow-xs placeholder-[#888]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* =========================================================================
              QUICK CATEGORY SELECTOR PILL BUTTONS (Matching Radiant Souls Screenshot style)
          ========================================================================= */}
          <div className="pt-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3 text-xs font-semibold tracking-wider uppercase text-[#9E7206]">
              <Filter className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Select Category to Filter</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-gold-gradient text-[#1C1917] font-bold border border-[#D4AF37]'
                    : 'bg-white border border-stone-200 text-[#292524] hover:border-[#D4AF37] hover:bg-[#FFFDF9]'
                }`}
              >
                All General Conditions ({generalConditionsList.length})
              </button>

              {generalConditionsList.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-gold-gradient text-[#1C1917] font-bold border border-[#D4AF37]'
                      : 'bg-white border border-stone-200 text-[#292524] hover:border-[#D4AF37] hover:bg-[#FFFDF9]'
                  }`}
                >
                  {cat.name.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DETAILED GENERAL CONDITIONS & SUB-CONDITIONS LIST
          (Each sub-condition displayed with the exact pill button style from screenshot)
      ========================================================================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            id={category.id}
            className="p-6 sm:p-8 md:p-10 rounded-3xl bg-white border border-stone-200 hover:border-[#D4AF37]/60 transition-all duration-300 shadow-xs hover:shadow-md space-y-6"
          >
            {/* Category Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
              <div className="space-y-1 max-w-2xl">
                <span className="text-xs font-semibold text-[#9E7206] uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>General Condition</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
                  {category.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#9E7206] italic font-normal">
                  "{category.tagline}"
                </p>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed pt-1 font-light">
                  {category.overview}
                </p>
              </div>

              {/* Main condition guide link */}
              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
                <button
                  onClick={() => handleSubConditionClick(category.mainConditionId)}
                  className="px-5 py-2.5 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Open Full Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#1C1917]" />
                </button>

                <button
                  onClick={() => onOpenBooking(category.name)}
                  className="px-5 py-2.5 rounded-full bg-white border border-stone-300 hover:border-[#D4AF37] hover:bg-[#FAF8F5] text-xs font-medium text-[#292524] transition-all cursor-pointer text-center shadow-2xs"
                >
                  Book for {category.name.split(' ')[0]}
                </button>
              </div>
            </div>

            {/* =========================================================================
                SUB-CONDITIONS BUTTONS SECTION
                (Styled in the exact pill button layout from the user screenshot)
            ========================================================================= */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9E7206]">
                  Specific Sub-Conditions & Diagnostic Presentations:
                </h3>
                <span className="text-[11px] text-[#78716C]">
                  Tap any button to open dedicated care page
                </span>
              </div>

              {/* Pill Button Grid in user's requested style */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {category.subConditions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubConditionClick(sub.targetConditionId)}
                    title={sub.shortDesc}
                    className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl border border-stone-200 bg-white hover:border-[#D4AF37] hover:bg-[#FFFDF9] text-xs sm:text-sm font-medium text-[#292524] hover:text-[#9E7206] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 inline-flex items-center gap-2 group text-left"
                  >
                    <span>{sub.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#B8860B] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-16 space-y-3 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
            <p className="text-[#78716C] text-sm">No condition or sub-condition matching "{searchTerm}" found.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategoryFilter('all');
              }}
              className="text-xs text-[#9E7206] font-semibold underline cursor-pointer"
            >
              Reset Filters & Show All Conditions
            </button>
          </div>
        )}

        {/* Closing Sanctuary Call to Action */}
        <div className="p-8 md:p-12 rounded-3xl bg-[#FAF9F5] border border-[#D4AF37]/35 text-center space-y-6 shadow-sm">
          <div className="flex justify-center">
            <GoldenMindLogo variant="icon" size="lg" />
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Not Certain Which Diagnosis Applies to You?
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
              Psychiatric symptoms frequently overlap. During your comprehensive diagnostic evaluation, Brenda Hobyani, PMHNP-BC takes the time to listen to your entire health story to identify root causes and craft a personalized path forward.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenBooking()}
              className="px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Calendar className="w-4 h-4 text-[#1C1917]" />
              <span>Schedule a Consultation</span>
            </button>

            <button
              onClick={() => {
                onNavigate('resources');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-full border border-stone-300 bg-white hover:border-[#D4AF37] hover:bg-[#FAF8F5] text-xs sm:text-sm font-medium text-[#292524] transition-all cursor-pointer shadow-xs"
            >
              Take Free Confidential Screener
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
