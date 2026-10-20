import React from 'react';
import { GoldenMindLogo } from '../components/GoldenMindLogo';
import { conditionsData } from '../data/conditions';
import { providerBrenda, aboutUsOfficial } from '../data/provider';
import { SymptomScreener } from '../components/SymptomScreener';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Video,
  MapPin,
  Calendar,
  CheckCircle,
  Star,
  Award,
  ChevronRight,
  Heart,
  Clock,
  UserCheck
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (conditionId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenBooking }) => {
  // Condition tag buttons matching Radiant Souls screenshot 2
  const quickConditionTags = [
    { label: 'Psychiatric Evaluations', page: 'services', id: 'psychiatric-evaluations' },
    { label: 'Medication Management', page: 'services', id: 'medication-management' },
    { label: 'ADHD', page: 'condition-detail', id: 'adhd' },
    { label: 'Women\'s Mental Health', page: 'condition-detail', id: 'womens-mental-health' },
    { label: 'Child & Adolescent', page: 'condition-detail', id: 'child-adolescent' },
    { label: 'Anxiety & Stress', page: 'condition-detail', id: 'anxiety-stress' },
    { label: 'Depression', page: 'condition-detail', id: 'depression' },
    { label: 'Trauma & PTSD', page: 'condition-detail', id: 'trauma-ptsd' },
    { label: 'Telepsychiatry', page: 'telehealth', id: 'telepsychiatry' },
    { label: 'Holistic & Integrative', page: 'condition-detail', id: 'holistic-integrative' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1C1917]">
      {/* =========================================================================
          HERO SECTION WITH PROMINENT HERO SANCTUARY IMAGE & CENTERED LAYOUT
          (Matching Radiant Souls structure on a clean, luminous white aesthetic)
      ========================================================================= */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden text-center px-4 sm:px-6 lg:px-8 border-b border-stone-200 bg-white">
        {/* Subtle warm ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-5xl mx-auto relative z-10 space-y-6">

          {/* Prominent Large Golden Mind Logo in place of "Healing Minds..." */}
          <div className="py-2">
            <GoldenMindLogo variant="hero" size="hero" className="mx-auto" />
          </div>

          {/* Centered Descriptive Lead Paragraph */}
          <p className="text-base sm:text-lg md:text-xl text-[#57534E] max-w-2xl mx-auto leading-relaxed font-light">
            Compassionate, expert psychiatric care designed to help you find balance and thrive in a calm, supportive, and confidential environment.
          </p>

          {/* Centered Primary & Secondary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => onOpenBooking()}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm sm:text-base text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_24px_rgba(212,175,55,0.4)] transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Book an Appointment</span>
              <ArrowRight className="w-4 h-4 text-[#1C1917]" />
            </button>

            <button
              onClick={() => {
                onNavigate('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-4 rounded-full font-medium text-sm sm:text-base text-[#292524] bg-white border border-stone-300 hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all cursor-pointer text-center shadow-xs"
            >
              Our Services
            </button>
          </div>

          {/* Quick Credential Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#78716C]">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#B8860B]" />
              <span className="font-medium text-[#44403C]">Board-Certified Provider</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#B8860B]" />
              <span className="font-medium text-[#44403C]">In-Person & Telehealth</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#B8860B]" />
              <span className="font-medium text-[#44403C]">Major Insurances Accepted</span>
            </span>
          </div>

          {/* =========================================================================
              FEATURE HERO IMAGE IN THE HOME PAGE
              (Prominent high-impact serene clinic interior)
          ========================================================================= */}
          <div className="pt-6">
            <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/45 shadow-xl max-w-4xl mx-auto group bg-white">
              <img
                src="/assets/aistudio/Screenshot_20261020-090011_87b3cf71.jpg"
                alt="Golden Mind Psychiatric Hero Clinic Interior - A Peaceful Sanctuary in Mesquite, Texas"
                className="w-full h-[320px] sm:h-[460px] md:h-[500px] object-cover object-center transition-transform duration-700 group-hover:scale-102"
              />
              {/* Subtle gentle bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 flex items-center justify-between text-left">
                <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#D4AF37]/40 text-xs shadow-md">
                  <span className="text-[#9E7206] font-semibold block text-[10px] uppercase tracking-wider">A Peaceful Sanctuary</span>
                  <span className="text-[#1C1917] text-xs sm:text-sm font-semibold">Designed for Calm, Supportive Healing in Mesquite, TX</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              INTERACTIVE CONDITION & SERVICE BUTTONS
              (Exact matching layout from Radiant Souls screenshot 2)
              Every condition links directly to its own individual page!
          ========================================================================= */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="mb-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-[#9E7206]">
                Explore Our Core Clinical Specialties
              </span>
              <p className="text-xs text-[#78716C] mt-1">
                Select any condition below to view its dedicated, in-depth care page
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {quickConditionTags.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => {
                    if (tag.page === 'condition-detail') {
                      onNavigate('condition-detail', tag.id);
                    } else {
                      onNavigate(tag.page, tag.id);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:border-[#D4AF37] hover:bg-[#FFFDF9] text-xs sm:text-sm font-medium text-[#292524] hover:text-[#9E7206] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm active:scale-95"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ABOUT US SECTION (Using the user's EXACT provided text & Brenda Hobyani's profile)
      ========================================================================= */}
      <section className="py-20 bg-white border-y border-stone-200 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
              About Golden Mind Psychiatry PLLC
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1C1917] font-bold">
              Accessible, Personalized & Compassionate Care
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              Committed to understanding each individual’s unique needs and restoring emotional balance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Picture of the Head Owner: Brenda Hobyani, PMHNP-BC */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[360px] aspect-[4/5] rounded-3xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-xl group bg-white">
                {/* Provider Portrait */}
                <img
                  src="/brenda_hobyani.jpg"
                  alt="Brenda Hobyani, PMHNP-BC - Board-Certified Psychiatric Mental Health Nurse Practitioner and Head Owner of Golden Mind Psychiatry"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-102"
                />
                
                {/* Overlay framing */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-85"></div>

                {/* Name Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D4AF37]/40 text-center shadow-md">
                  <h3 className="font-serif text-lg font-bold text-[#1C1917]">
                    Brenda Hobyani
                  </h3>
                  <p className="text-xs font-bold text-[#9E7206] tracking-wider">
                    PMHNP-BC
                  </p>
                  <p className="text-[11px] text-[#57534E] mt-0.5 font-medium">
                    Head Owner & Lead Psychiatric Clinician
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-[#78716C]">
                <Award className="w-4 h-4 text-[#B8860B]" />
                <span className="font-medium text-[#44403C]">ANCC Board-Certified · Prescriptive Authority</span>
              </div>
            </div>

            {/* Official About Us Text (EXACT text from user prompt) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#9E7206] tracking-widest uppercase">
                  Our Mission & Practice Overview
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif text-[#1C1917] font-bold">
                  Dedicated to Supporting Your Emotional Well-Being
                </h3>
              </div>

              {/* Exact Paragraph 1 from user */}
              <div className="p-5 rounded-2xl bg-[#FAF8F2] border-l-4 border-[#D4AF37] text-sm text-[#292524] leading-relaxed shadow-2xs">
                {aboutUsOfficial.paragraph1}
              </div>

              {/* Exact Paragraph 2 from user */}
              <p className="text-sm text-[#44403C] leading-relaxed font-normal">
                {aboutUsOfficial.paragraph2}
              </p>

              {/* Specialties checklist */}
              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9E7206] mb-3">
                  Conditions & Treatments We Specialize In
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#44403C]">
                  {[
                    'ADHD Testing & Medication Management',
                    'Anxiety & Stress Disorders',
                    'Major & Persistent Depression',
                    'Bipolar & Mood Spectrum Disorders',
                    'PTSD & Trauma Recovery',
                    'Women\'s Reproductive Mental Health',
                    'Comprehensive Psychiatric Evaluations',
                    'Telehealth Video Appointments'
                  ].map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#B8860B] shrink-0" />
                      <span className="font-medium">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenBooking()}
                  className="px-6 py-3.5 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <Calendar className="w-4 h-4 text-[#1C1917]" />
                  <span>Book a Consultation with Brenda</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-3.5 rounded-full border border-stone-300 bg-white hover:border-[#D4AF37] hover:bg-[#FAF8F5] text-xs sm:text-sm font-medium text-[#292524] transition-colors cursor-pointer shadow-xs"
                >
                  Read More About Our Practice
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INDIVIDUAL CONDITION PAGES SHOWCASE
          (User specified: "also let every condition have it's own individual page")
      ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
            Specialized Conditions We Treat
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#1C1917] font-bold">
            Every Mind is Unique. Every Care Plan is Individualized.
          </h2>
          <p className="text-sm text-[#78716C]">
            Explore our dedicated clinical guides detailing symptoms, modern medication management options, and personalized recovery roadmaps for each condition.
          </p>
        </div>

        {/* 10 Condition Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conditionsData.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-white border border-stone-200 hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 flex flex-col justify-between group shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-[#FAF6EA] border border-[#D4AF37]/40 flex items-center justify-center text-[#9E7206] text-xs font-bold">
                    {c.name.charAt(0)}
                  </span>
                  <span className="text-[11px] text-[#78716C] group-hover:text-[#9E7206] transition-colors flex items-center gap-1 font-medium">
                    <span>Individual Page</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                <h3 className="text-lg font-serif font-bold text-[#1C1917] group-hover:text-[#9E7206] transition-colors">
                  {c.name}
                </h3>

                <p className="text-xs text-[#57534E] leading-relaxed line-clamp-3">
                  {c.shortDescription}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    onNavigate('condition-detail', c.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-[#9E7206] hover:text-[#1C1917] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Read Full Guide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenBooking(c.name)}
                  className="text-[11px] px-3.5 py-1.5 rounded-full bg-[#FAF7F0] hover:bg-[#D4AF37] hover:text-[#1C1917] text-[#44403C] transition-all font-semibold cursor-pointer border border-[#D4AF37]/30"
                >
                  Book for {c.name.split(' ')[0]}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          THE THREE PILLARS OF CARE AT GOLDEN MIND
      ========================================================================= */}
      <section className="py-20 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
              Our Clinical Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1C1917] font-bold">
              Modern Science. Compassionate Heart.
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              A balanced approach to mental healthcare designed to treat the whole person, not just isolated symptoms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-stone-200/90 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF4E2] border border-[#D4AF37]/40 flex items-center justify-center text-[#9E7206]">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1C1917]">
                01. Thorough Diagnostic Insight
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                We dedicate unhurried, comprehensive care during your initial evaluation to understand your life story, ruling out medical masqueraders and identifying precise neurological drivers.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-stone-200/90 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF4E2] border border-[#D4AF37]/40 flex items-center justify-center text-[#9E7206]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1C1917]">
                02. Precision Pharmacotherapy
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                Conservative, thoughtful medication prescribing tailored to your biology. We avoid over-medication, closely monitor side effects, and optimize therapeutic balance.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-stone-200/90 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF4E2] border border-[#D4AF37]/40 flex items-center justify-center text-[#9E7206]">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1C1917]">
                03. Integrative Nervous System Support
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                Incorporating evidence-informed lifestyle adjustments—circadian sleep alignment, gut-brain nutrition, and stress resilience—for durable, lifelong well-being.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TELEHEALTH VS IN-PERSON CARE SECTION
      ========================================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
              Flexible Clinical Access
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1C1917] font-bold leading-tight">
              Care That Fits Seamlessly Into Your Life
            </h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Whether you prefer visiting our serene outpatient practice in Mesquite, Texas or connecting from the privacy of your home or office via secure telehealth, Brenda Hobyani provides the same attentive, high-touch psychiatric medicine.
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-3">
                <Video className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#1C1917]">Telepsychiatry Across Texas</h4>
                  <p className="text-[#57534E] text-xs mt-0.5">
                    Encrypted HIPAA-compliant video visits. No driving, no waiting rooms, and electronic prescriptions sent directly to your pharmacy.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#1C1917]">In-Person Outpatient Office</h4>
                  <p className="text-[#57534E] text-xs mt-0.5">
                    Comfortable, distraction-free clinical setting in Mesquite, Texas for patients who thrive on in-person connection.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenBooking()}
                className="px-6 py-3.5 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm hover:shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <span>Select Your Visit Format</span>
                <ArrowRight className="w-4 h-4 text-[#1C1917]" />
              </button>
            </div>
          </div>

          {/* Interactive Screener Widget Integration */}
          <div>
            <SymptomScreener onOpenBooking={onOpenBooking} />
          </div>
        </div>
      </section>

      {/* =========================================================================
          PATIENT TESTIMONIALS & REVIEWS
      ========================================================================= */}
      <section className="py-20 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="flex items-center justify-center gap-1 text-[#B8860B] mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#B8860B]" />
              ))}
            </div>
            <h2 className="text-3xl font-serif text-[#1C1917] font-bold">
              Voices of Hope and Transformation
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              What patients share about their psychiatric care journey with Brenda Hobyani, PMHNP-BC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "For years I felt like doctors only saw me for 5 minutes and pushed pills. Brenda actually sat and listened to my full story. She adjusted my medication with so much care, and for the first time in years, my anxiety is quiet.",
                author: "Sarah M.",
                detail: "Treated for Generalized Anxiety & Panic",
                rating: 5,
              },
              {
                quote: "Being diagnosed with adult ADHD in my late 30s felt overwhelming. Brenda made me feel validated instead of broken. Her treatment plan gave me my focus and self-esteem back in my career and family life.",
                author: "Marcus T.",
                detail: "Treated for Adult ADHD & Executive Functioning",
                rating: 5,
              },
              {
                quote: "Postpartum depression made me feel like I was failing my newborn. Brenda's gentle, evidence-based approach and telehealth check-ins saved me. She is an angel for mothers who are struggling silently.",
                author: "Elena R.",
                detail: "Treated for Perinatal & Postpartum Mood Disorder",
                rating: 5,
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#FAF8F5] border border-stone-200 space-y-4 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#B8860B]">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#B8860B]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#44403C] italic leading-relaxed font-light">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200">
                  <p className="text-xs font-bold text-[#1C1917]">{t.author}</p>
                  <p className="text-[11px] text-[#78716C]">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CLOSING CENTERED CALL TO ACTION
      ========================================================================= */}
      <section className="py-24 text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#FAF9F5] border-t border-[#D4AF37]/25">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          {/* Logo in Card Format */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border border-stone-800 bg-black">
              <img
                src="/golden_mind_card.webp"
                alt="Golden Mind Psychiatry PLLC"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1C1917] font-bold leading-tight">
            Your Journey to Clarity Begins With a Conversation
          </h2>

          <p className="text-base text-[#57534E] max-w-xl mx-auto font-light leading-relaxed">
            Take the first step toward lasting emotional balance. Schedule your confidential consultation with Brenda Hobyani, PMHNP-BC today.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenBooking()}
              className="w-full sm:w-auto px-9 py-4 rounded-full font-bold text-sm sm:text-base text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_24px_rgba(212,175,55,0.4)] transition-all transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>Book Your Appointment Today</span>
              <ArrowRight className="w-4 h-4 text-[#1C1917]" />
            </button>
          </div>

          <p className="text-xs text-[#78716C] pt-2">
            Insurance Accepted · Telehealth Across Texas & In-Person Outpatient Visits
          </p>
        </div>
      </section>
    </div>
  );
};
