import React, { useState } from 'react';
import {
  Phone,
  Heart,
  Shield,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Copy,
  Check,
  Printer,
  RotateCcw,
  MessageSquare,
  LifeBuoy,
  Users,
  Lock,
  Sparkles,
} from 'lucide-react';

interface SuicidePreventionPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (prefillCondition?: string) => void;
}

interface SafetyPlanState {
  warningSigns: string;
  copingStrategies: string;
  distractionPeoplePlaces: string;
  trustedContacts: string;
  environmentSafety: string;
  reasonForLiving: string;
}

const DEFAULT_SAFETY_PLAN: SafetyPlanState = {
  warningSigns: '',
  copingStrategies: '',
  distractionPeoplePlaces: '',
  trustedContacts: '',
  environmentSafety: '',
  reasonForLiving: '',
};

const SAMPLE_SAFETY_PLAN: SafetyPlanState = {
  warningSigns:
    'Feeling overwhelmed or hopeless, isolating from family, racing negative thoughts late at night, skipping meals or sleep.',
  copingStrategies:
    '4-7-8 slow breathing for 5 minutes, stepping outside for fresh air, holding an ice cube or splashing cold water on my face, listening to a calming playlist.',
  distractionPeoplePlaces:
    'Sitting in the living room with family, walking at the local park during daylight, visiting a quiet coffee shop.',
  trustedContacts:
    'Spouse / Partner, Best Friend, Sister — let them know I need company and someone to talk with right now.',
  environmentSafety:
    'Keep all prescription and over-the-counter medications locked in a secure box with a trusted family member; remove any harmful objects from my immediate space.',
  reasonForLiving:
    'My family, my future recovery, and knowing that intense emotional waves pass with support and treatment.',
};

export const SuicidePreventionPage: React.FC<SuicidePreventionPageProps> = ({
  onNavigate,
  onOpenBooking,
}) => {
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlanState>(DEFAULT_SAFETY_PLAN);
  const [copiedPlan, setCopiedPlan] = useState(false);

  const handleLoadSample = () => {
    setSafetyPlan(SAMPLE_SAFETY_PLAN);
  };

  const handleResetPlan = () => {
    setSafetyPlan(DEFAULT_SAFETY_PLAN);
    setCopiedPlan(false);
  };

  const handleCopySafetyPlan = () => {
    const formatted = [
      'MY PERSONAL SUICIDE PREVENTION SAFETY PLAN',
      'Golden Mind Psychiatry PLLC · Emergency Crisis Reference',
      '--------------------------------------------------------',
      `1. Warning Signs I Should Watch For:\n${safetyPlan.warningSigns || '(Not specified)'}`,
      `\n2. Internal Coping Strategies:\n${safetyPlan.copingStrategies || '(Not specified)'}`,
      `\n3. Safe People & Places for Healthy Distraction:\n${safetyPlan.distractionPeoplePlaces || '(Not specified)'}`,
      `\n4. Trusted Loved Ones I Can Reach Out To:\n${safetyPlan.trustedContacts || '(Not specified)'}`,
      '\n5. 24/7 Emergency & Clinical Contacts:',
      '   • Suicide & Crisis Lifeline: Call or Text 988 (24/7)',
      '   • Poison Control Center: Call 800-222-1222 (24/7)',
      '   • Crisis Text Line: Text HOME to 741741 (24/7)',
      '   • Golden Mind Psychiatry PLLC (Brenda Hobyani, PMHNP-BC): +1 (432) 934-3185',
      '   • Immediate Medical Emergency: Call 911 or visit nearest ER',
      `\n6. Steps to Keep My Environment Safe:\n${safetyPlan.environmentSafety || '(Not specified)'}`,
      `\n7. What Matters Most to Me & Reasons for Living:\n${safetyPlan.reasonForLiving || '(Not specified)'}`,
    ].join('\n');

    navigator.clipboard.writeText(formatted);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 3500);
  };

  const handlePrintSafetyPlan = () => {
    window.print();
  };

  const emergencyLines = [
    {
      label: '24/7 National Lifeline',
      title: '988 Suicide & Crisis Lifeline',
      numberDisplay: 'Call or Text 988',
      href: 'tel:988',
      secondaryHref: 'sms:988',
      secondaryLabel: 'Text 988',
      description:
        'Free, confidential 24/7 support for anyone experiencing suicidal thoughts, emotional distress, or a mental health crisis. Available in English and Spanish across the United States.',
    },
    {
      label: '24/7 Overdose & Poison Help',
      title: 'Poison Control Center',
      numberDisplay: '800-222-1222',
      href: 'tel:8002221222',
      description:
        'Available 24 hours a day, 7 days a week for suspected medication overdose, adverse drug interactions, or poison emergencies. Free, expert medical toxicology guidance.',
    },
    {
      label: '24/7 SMS Crisis Support',
      title: 'Crisis Text Line',
      numberDisplay: 'Text HOME to 741741',
      href: 'sms:741741',
      description:
        'Connect via text message with a trained crisis counselor 24/7 if speaking out loud feels overwhelming or you need quiet, confidential support.',
    },
    {
      label: 'Military & Veterans (24/7)',
      title: 'Veterans Crisis Line',
      numberDisplay: 'Dial 988, Press 1',
      href: 'tel:988',
      secondaryHref: 'sms:838255',
      secondaryLabel: 'Text 838255',
      description:
        'Dedicated, confidential 24/7 crisis support for U.S. service members, National Guard and Reserve members, veterans, and their loved ones.',
    },
    {
      label: 'Mental Health & Substance Support (24/7)',
      title: 'SAMHSA National Helpline',
      numberDisplay: '800-662-4357',
      href: 'tel:8006624357',
      description:
        '24/7, 365-day-a-year free and confidential treatment referral and information service for individuals and families facing mental health or substance use disorders.',
    },
    {
      label: 'Perinatal & Postpartum (24/7)',
      title: 'Maternal Mental Health Hotline',
      numberDisplay: '833-852-6262',
      href: 'tel:8338526262',
      description:
        '24/7 free, confidential voice and text support for pregnant and new mothers facing severe postpartum depression, anxiety, or overwhelming distress.',
    },
  ];

  const warningSignGroups = [
    {
      category: 'Emotional & Verbal Indicators',
      items: [
        'Talking about wanting to die, disappear, or go to sleep and never wake up',
        'Expressing feelings of being a heavy burden to family, friends, or partners',
        'Describing unbearable emotional or physical pain that feels inescapable',
        'Expressing deep hopelessness, emptiness, or having no reason to live',
        'Sudden, unexplained calm or relief after a period of severe depression',
      ],
    },
    {
      category: 'Behavioral Changes',
      items: [
        'Withdrawing from loved ones, cancelling plans, and isolating at home',
        'Giving away cherished possessions, writing farewell messages, or settling affairs',
        'Searching online for lethal means or stockpiling prescription medications',
        'Increased use of alcohol, prescription sedatives, or other substances',
        'Extreme changes in sleep patterns (severe insomnia or sleeping all day)',
      ],
    },
    {
      category: 'Clinical & Situational Risk Factors',
      items: [
        'Untreated or worsening Major Depression, Bipolar Disorder, PTSD, or Panic Disorder',
        'Recent painful loss, relationship breakdown, trauma, or financial/work crisis',
        'Abruptly stopping or changing psychiatric medications without clinical guidance',
        'Chronic physical pain, postpartum hormonal shifts, or severe sleep deprivation',
        'Prior history of self-harm or a family history of suicide',
      ],
    },
  ];

  const actionSteps = [
    {
      num: '01.',
      title: 'Ask Directly & With Compassion',
      desc: 'Asking someone directly if they are thinking about suicide does NOT put the idea in their head. In fact, clinical research shows it reduces anxiety and opens the door to relief. Ask gently: "I care about you so much—have you been having thoughts of hurting yourself or ending your life?"',
    },
    {
      num: '02.',
      title: 'Listen Without Judgment or Minimizing',
      desc: 'Allow the person to share their pain openly without lecturing, arguing, or offering quick platitudes. Validate how heavy their pain feels and reassure them that they do not have to carry it alone.',
    },
    {
      num: '03.',
      title: 'Create a Safe Environment (Lethal Means Safety)',
      desc: 'Putting time and distance between a person in crisis and lethal means saves lives. Safely lock away or remove firearms, sharp objects, alcohol, and all prescription or over-the-counter medications. If an overdose is suspected, call Poison Control at 800-222-1222 or 911 immediately.',
    },
    {
      num: '04.',
      title: 'Connect Them to Immediate Help',
      desc: 'Stay with the person (in person or on the phone) while connecting them to 988, a local psychiatric emergency service, or their mental health provider. Never leave someone in acute danger alone.',
    },
    {
      num: '05.',
      title: 'Follow Up & Support Ongoing Psychiatric Care',
      desc: 'Checking in during the days and weeks after a crisis significantly lowers ongoing risk. Encourage and help coordinate a comprehensive psychiatric evaluation and medication management plan.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* =========================================================================
          HERO SECTION: COMPASSIONATE SANCTUARY & IMMEDIATE 1-CLICK LIFELINES
      ========================================================================= */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-stone-200 bg-[#FAF8F4]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
            Suicide Prevention &amp; 24/7 Crisis Sanctuary · Golden Mind Psychiatry PLLC
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-[#1C1917] tracking-tight leading-tight max-w-4xl mx-auto"
            style={{ textWrap: 'balance' }}
          >
            You Are Not Alone. Your Life Has Profound Value.
          </h1>

          <p className="text-base sm:text-lg text-[#44403C] max-w-2xl mx-auto leading-relaxed font-normal">
            If you or someone you love is walking through overwhelming darkness, emotional pain, or
            thoughts of self-harm, please know that help is available right now. Suicidal thoughts
            are a treatable medical and emotional signal—not a permanent state.
          </p>

          {/* Immediate Emergency Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5">
            <a
              href="tel:988"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>Call or Text 988 (Suicide &amp; Crisis Lifeline)</span>
            </a>

            <a
              href="tel:8002221222"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#0A0A0A] hover:bg-stone-800 text-[#D4AF37] border border-[#D4AF37]/50 font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>Poison Control (24/7): 800-222-1222</span>
            </a>

            <a
              href="tel:911"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white hover:bg-stone-100 text-[#1C1917] border border-stone-300 font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Immediate Danger: Call 911</span>
            </a>
          </div>

          <div className="pt-2 text-xs text-[#57534E]">
            <span>All crisis lines are available 24 hours a day, 7 days a week</span>
            <span aria-hidden="true"> · </span>
            <span>100% Free &amp; Confidential</span>
            <span aria-hidden="true"> · </span>
            <span>English &amp; Spanish Support</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* =========================================================================
            SECTION 1: 24/7 NATIONAL & SPECIALIZED CRISIS DIRECTORY
        ========================================================================= */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
                Immediate 24/7 Lifelines
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
                Emergency Crisis &amp; Poison Control Directory
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#57534E] max-w-md">
              Click any number below to dial or text directly from your phone. Trained crisis
              counselors and medical specialists are standing by 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emergencyLines.map((line, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-[#9E7206]">{line.label}</div>
                  <h3 className="text-lg font-serif font-bold text-[#1C1917]">{line.title}</h3>
                  <div className="pt-1">
                    <a
                      href={line.href}
                      className="text-2xl font-serif font-bold text-[#991B1B] hover:underline font-mono tabular-nums inline-block"
                    >
                      {line.numberDisplay}
                    </a>
                  </div>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                    {line.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center gap-3">
                  <a
                    href={line.href}
                    className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#FAF0D4] border border-stone-200 hover:border-[#D4AF37] text-xs font-semibold text-[#1C1917] transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#9E7206]" />
                    <span>{line.href.startsWith('sms:') ? 'Send Text' : 'Call Now'}</span>
                  </a>
                  {line.secondaryHref && line.secondaryLabel && (
                    <a
                      href={line.secondaryHref}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 text-xs font-medium text-[#57534E] transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#9E7206]" />
                      <span>{line.secondaryLabel}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: INTERACTIVE PERSONAL SAFETY PLAN BUILDER (STANLEY-BROWN MODEL)
        ========================================================================= */}
        <section className="p-6 sm:p-10 rounded-3xl bg-[#FAF8F5] border border-stone-200 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
                Evidence-Based Clinical Tool · Stanley-Brown Framework
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
                Build Your Personal Suicide Prevention Safety Plan
              </h2>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                Having a written, step-by-step safety plan prepared ahead of time helps guide you or
                a loved one through moments when emotional pain feels overwhelming. Everything typed
                here stays 100% private in your browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-xs font-semibold text-[#1C1917] transition-colors cursor-pointer whitespace-nowrap"
              >
                Load Example Plan
              </button>
              <button
                type="button"
                onClick={handleResetPlan}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-xs font-medium text-[#57534E] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                01. My Personal Warning Signs
              </label>
              <p className="text-xs text-[#78716C]">
                What thoughts, moods, physical sensations, or situations signal that a crisis may be
                developing?
              </p>
              <textarea
                rows={3}
                value={safetyPlan.warningSigns}
                onChange={(e) => setSafetyPlan({ ...safetyPlan, warningSigns: e.target.value })}
                placeholder="e.g., Feeling completely exhausted, pulling away from family, racing thoughts at night..."
                className="w-full rounded-xl bg-white border border-stone-200 focus:border-[#D4AF37] p-3.5 text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none"
              />
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                02. Internal Coping &amp; Grounding Strategies
              </label>
              <p className="text-xs text-[#78716C]">
                What calming activities can I do on my own to soothe my nervous system for 15
                minutes?
              </p>
              <textarea
                rows={3}
                value={safetyPlan.copingStrategies}
                onChange={(e) => setSafetyPlan({ ...safetyPlan, copingStrategies: e.target.value })}
                placeholder="e.g., Deep slow breathing, taking a warm shower, holding an ice cube, walking outside..."
                className="w-full rounded-xl bg-white border border-stone-200 focus:border-[#D4AF37] p-3.5 text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none"
              />
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                03. Safe People &amp; Places for Distraction
              </label>
              <p className="text-xs text-[#78716C]">
                Who can I be around, or what safe public environment can I visit, so I am not alone?
              </p>
              <textarea
                rows={3}
                value={safetyPlan.distractionPeoplePlaces}
                onChange={(e) =>
                  setSafetyPlan({ ...safetyPlan, distractionPeoplePlaces: e.target.value })
                }
                placeholder="e.g., Sitting in the living room with my partner, calling a cousin, visiting a daytime park..."
                className="w-full rounded-xl bg-white border border-stone-200 focus:border-[#D4AF37] p-3.5 text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none"
              />
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                04. Trusted Family or Friends I Can Ask for Help
              </label>
              <p className="text-xs text-[#78716C]">
                List 1–3 trusted people you can tell: &ldquo;I am having a hard time and need
                support right now.&rdquo;
              </p>
              <textarea
                rows={3}
                value={safetyPlan.trustedContacts}
                onChange={(e) => setSafetyPlan({ ...safetyPlan, trustedContacts: e.target.value })}
                placeholder="e.g., Mom, spouse, best friend, mentor (include names and phone numbers)..."
                className="w-full rounded-xl bg-white border border-stone-200 focus:border-[#D4AF37] p-3.5 text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none"
              />
            </div>

            {/* Step 5 */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                05. Making My Environment Safe (Medication &amp; Home Safety)
              </label>
              <p className="text-xs text-[#78716C]">
                How can I secure medications, alcohol, or harmful items right now?
              </p>
              <textarea
                rows={3}
                value={safetyPlan.environmentSafety}
                onChange={(e) =>
                  setSafetyPlan({ ...safetyPlan, environmentSafety: e.target.value })
                }
                placeholder="e.g., Have a family member hold my medication organizer; keep Poison Control (800-222-1222) saved..."
                className="w-full rounded-xl bg-white border border-stone-200 focus:border-[#D4AF37] p-3.5 text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none"
              />
            </div>

            {/* Step 6 */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                06. What Matters Most to Me &amp; Reasons for Living
              </label>
              <p className="text-xs text-[#78716C]">
                What anchors, loved ones, hopes, or values remind me that my presence matters?
              </p>
              <textarea
                rows={3}
                value={safetyPlan.reasonForLiving}
                onChange={(e) => setSafetyPlan({ ...safetyPlan, reasonForLiving: e.target.value })}
                placeholder="e.g., My children, my partner, my faith, my pets, and the future ahead of me..."
                className="w-full rounded-xl bg-white border border-stone-200 focus:border-[#D4AF37] p-3.5 text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Pre-Included Professional Crisis Contacts in Plan + Actions */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-[#44403C]">
              <p className="font-bold text-[#1C1917]">
                Always Included in Your Safety Plan: 24/7 Professional Lifelines
              </p>
              <p>
                <strong>Suicide &amp; Crisis Lifeline:</strong> 988 ·{' '}
                <strong>Poison Control (24/7):</strong> 800-222-1222 ·{' '}
                <strong>Crisis Text Line:</strong> Text HOME to 741741 ·{' '}
                <strong>Golden Mind Psychiatry PLLC:</strong> +1 (432) 934-3185
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCopySafetyPlan}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-stone-800 text-[#D4AF37] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedPlan ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPlan ? 'Safety Plan Copied!' : 'Copy My Safety Plan'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintSafetyPlan}
                className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#1C1917] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: RECOGNIZING THE WARNING SIGNS
        ========================================================================= */}
        <section className="space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              Clinical Awareness &amp; Early Recognition
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Recognizing Warning Signs in Yourself or a Loved One
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
              Most individuals who experience suicidal thoughts give warning signs—either through
              words, shifts in behavior, or overwhelming life circumstances. Recognizing these
              signals early allows for compassionate, life-saving intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {warningSignGroups.map((group, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-stone-200 space-y-4"
              >
                <h3 className="text-lg font-serif font-bold text-[#1C1917] border-b border-stone-100 pb-3">
                  {group.category}
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-[#44403C]">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: 5 EVIDENCE-BASED STEPS TO HELP SOMEONE IN CRISIS
        ========================================================================= */}
        <section className="space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
              NIMH Evidence-Based Action Guide
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              5 Steps to Help Someone Who May Be Struggling
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
              You do not need to be a clinician to help save a life. Following these five proven
              steps provides structured, compassionate support when someone you care about is
              hurting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actionSteps.map((step, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3 ${
                  i === 4 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <span className="text-xs font-mono font-bold text-[#9E7206]">{step.num}</span>
                <h3 className="text-lg font-serif font-bold text-[#1C1917]">{step.title}</h3>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: PROACTIVE PSYCHIATRIC CARE AT GOLDEN MIND PSYCHIATRY PLLC
        ========================================================================= */}
        <section className="p-8 sm:p-12 rounded-3xl bg-[#0A0A0A] text-white border border-[#D4AF37]/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Compassionate Ongoing Care Across Texas · 100% Telehealth
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                Treating the Root Causes of Despair with Personalized Psychiatric Care
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
                Overwhelming hopelessness is frequently driven by treatable neurobiological and
                psychiatric conditions—including Major Depressive Disorder, Bipolar Spectrum
                Disorders, PTSD, severe Panic Disorder, Postpartum Depression, or unaddressed
                medication side effects. At{' '}
                <strong className="text-[#D4AF37]">Golden Mind Psychiatry PLLC</strong>,{' '}
                <strong className="text-white">Brenda Hobyani, PMHNP-BC</strong> partners with
                adults, teens, and children across Texas to provide unhurried evaluations,
                precision medication management, and pharmacogenomic testing from the safety and
                privacy of home.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-stone-300">
                <span>Comprehensive Diagnostic Evaluations</span>
                <span aria-hidden="true">·</span>
                <span>Precision Medication Management</span>
                <span aria-hidden="true">·</span>
                <span>100% Telehealth Across Texas</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <button
                onClick={() => onOpenBooking('Depression & Mood Evaluation')}
                className="w-full py-4 px-6 rounded-xl bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-[#1C1917]" />
                <span>Schedule a Psychiatric Evaluation</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('resources');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
              >
                <span>Take a Preliminary Self-Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-stone-400 text-center pt-1">
                Note: Outpatient telehealth appointments are for non-emergency care. If you are in
                immediate danger, please dial <strong>988</strong> or <strong>911</strong>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
