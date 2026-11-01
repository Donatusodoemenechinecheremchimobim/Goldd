import React from 'react';
import { Scale, AlertTriangle, Video, FileCheck, CreditCard, ShieldCheck, Phone, Mail } from 'lucide-react';

interface TermsOfServicePageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (conditionId?: string) => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1C1917] pt-28 pb-24">
      {/* Header Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white rounded-3xl border border-[#D4AF37]/30 p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8860B]/10 text-[#9E7206] text-xs font-bold uppercase tracking-wider mb-4">
            <Scale className="w-4 h-4" />
            <span>Texas Occupations Code Ch. 111 · Federal No Surprises Act · Telepsychiatry Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1C1917] tracking-tight mb-4">
            Terms of Service &amp; Texas Telehealth Informed Consent
          </h1>
          <p className="text-base sm:text-lg text-[#57534E] leading-relaxed mb-6">
            Please read these Terms of Service and Telehealth Informed Consent carefully before using the Golden Mind Psychiatry PLLC website (<code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded">https://goldenmindpsychiatry.org</code>), Client Portal, or virtual psychiatric services.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#78716C] border-t border-stone-200 pt-5">
            <span><strong>Practice Entity:</strong> Golden Mind Psychiatry PLLC (State of Texas)</span>
            <span>•</span>
            <span><strong>Lead Clinician:</strong> Brenda Hobyani, MSN, APRN, PMHNP-BC</span>
            <span>•</span>
            <span><strong>Effective Date:</strong> January 1, 2025 (Last Updated: November 2026)</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section 1: Emergency Disclaimer */}
        <div className="bg-white rounded-2xl border-2 border-[#B8860B]/40 p-6 sm:p-8 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-[#9E7206]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              1. Medical &amp; Psychiatric Emergency Disclaimer (Not an Emergency Service)
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
            <strong>GOLDEN MIND PSYCHIATRY PLLC AND ITS CLIENT PORTAL ARE NOT FOR ACUTE MEDICAL OR LIFE-THREATENING PSYCHIATRIC EMERGENCIES.</strong> If you or someone you know is experiencing a medical emergency, active suicidal intent, homicidal ideation, acute psychosis, or severe medication overdose:
          </p>
          <ul className="space-y-1.5 text-sm font-semibold text-[#1C1917] pl-4 list-disc">
            <li>Call <strong>911</strong> immediately or go to the nearest hospital emergency department.</li>
            <li>Call or text <strong>988</strong> to reach the 24/7 free and confidential <strong>Suicide &amp; Crisis Lifeline</strong>.</li>
            <li>Call <strong>Poison Control</strong> at <strong>1-800-222-1222</strong> (24/7) for any suspected medication overdose or adverse ingestion.</li>
          </ul>
          <p className="text-xs text-[#57534E] pt-1">
            Portal messages and email communications are monitored during normal clinic hours (Monday–Thursday 8:00 AM – 4:00 PM CST; Friday 9:00 AM – 1:00 PM CST) and must never be used for urgent crisis intervention.
          </p>
        </div>

        {/* Section 2: Texas Telemedicine Informed Consent */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#9E7206]">
              <Video className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              2. Texas Telehealth &amp; Telepsychiatry Informed Consent (Tex. Occ. Code Ch. 111)
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
            Pursuant to <strong>Texas Occupations Code Chapter 111</strong> and <strong>Texas Administrative Code Title 22</strong>, telepsychiatry involves the delivery of psychiatric evaluations, diagnostic assessments, psychotherapy, and medication management using interactive real-time audio and video telecommunications technology. By scheduling an appointment or using our Client Portal, you acknowledge and agree to the following:
          </p>
          <ul className="space-y-2.5 text-sm text-[#44403C] pl-4 list-disc">
            <li>
              <strong>Physical Location in Texas Required:</strong> Our clinician holds board certification and licensure in the State of Texas. You must be physically located within the <strong>State of Texas</strong> at the time of each synchronous telehealth video consultation and will verify your current physical location and emergency contact at the start of your visit.
            </li>
            <li>
              <strong>Establishment of Practitioner-Patient Relationship:</strong> Browsing this website, creating a Client Portal account, or sending an inquiry does <em>not</em> establish a formal clinician-patient relationship. A formal practitioner-patient relationship is established only after Brenda Hobyani, MSN, APRN, PMHNP-BC conducts an initial synchronous psychiatric evaluation and mutually agrees to assume your clinical care.
            </li>
            <li>
              <strong>Benefits &amp; Limitations of Telehealth:</strong> Telehealth improves access to board-certified psychiatric care from home, but technical disruptions (internet outages, audio/video latency) may occasionally occur, and virtual visits do not permit hands-on physical examinations. If our clinician determines that your clinical needs require in-person evaluation or higher-level care, we will provide appropriate Texas referrals.
            </li>
            <li>
              <strong>Privacy During Virtual Visits:</strong> You agree to join telehealth sessions from a private, quiet, well-lit space and never while operating a motor vehicle. Recording of any telehealth session by audio, video, or screenshot without express written consent of all parties is strictly prohibited.
            </li>
          </ul>
        </div>

        {/* Section 3: Prescribing & Texas PMP */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#9E7206]">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              3. Medication Management, e-Prescribing &amp; Texas PMP Compliance
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
            All prescribing decisions are made solely at the independent clinical judgment of your treating Psychiatric Mental Health Nurse Practitioner following a comprehensive diagnostic evaluation:
          </p>
          <ul className="space-y-2.5 text-sm text-[#44403C] pl-4 list-disc">
            <li>
              <strong>Texas Prescription Monitoring Program (PMP):</strong> In compliance with Texas State Board of Pharmacy and Texas Board of Nursing regulations, our practice queries the official Texas PMP database prior to prescribing controlled substances or when clinically indicated.
            </li>
            <li>
              <strong>Refill Requests &amp; Follow-Up Visits:</strong> Medication refills require active participation in scheduled follow-up appointments. Please submit refill requests through the Client Portal at least <strong>3 to 5 business days</strong> before running out of medication.
            </li>
            <li>
              <strong>Federal &amp; State Telemedicine Prescribing Laws:</strong> Prescriptions for any controlled medications strictly follow current U.S. Drug Enforcement Administration (DEA), Ryan Haight Act, and Texas Health &amp; Safety Code Chapter 481 regulations. Booking an evaluation does not guarantee that any specific medication or controlled substance will be prescribed.
            </li>
          </ul>
        </div>

        {/* Section 4: Billing, Insurance, No-Show Policy & Federal No Surprises Act */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#9E7206]">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              4. Financial Agreement, Insurance Assignment &amp; Federal “No Surprises Act” Notice
            </h2>
          </div>
          <ul className="space-y-2.5 text-sm text-[#44403C] pl-4 list-disc">
            <li>
              <strong>Insurance &amp; Patient Responsibility:</strong> If you use health insurance, you authorize Golden Mind Psychiatry PLLC to release necessary billing information to your insurer and assign insurance benefits directly to the Practice. You are financially responsible for all applicable deductibles, co-payments, co-insurance, or non-covered services.
            </li>
            <li>
              <strong>24-Hour Cancellation &amp; Late/No-Show Policy:</strong> Your appointment time is reserved exclusively for you. We require at least <strong>24 hours’ advance notice</strong> to cancel or reschedule an appointment. Missed appointments (“no-shows”) or cancellations made less than 24 hours before the scheduled visit may incur a late cancellation/no-show fee, which is not covered by insurance.
            </li>
            <li>
              <strong>Federal No Surprises Act — Right to a “Good Faith Estimate” (45 C.F.R. § 149.610):</strong> Under United States federal law, patients who don’t have insurance or who choose not to use insurance (self-pay) have the right to receive a <strong>Good Faith Estimate</strong> explaining how much their medical and psychiatric care will cost prior to scheduled services. If you receive a bill that is at least $400 more than your Good Faith Estimate, you have the right to dispute the bill at <a href="https://www.cms.gov/nosurprises" target="_blank" rel="noreferrer" className="text-[#9E7206] underline">www.cms.gov/nosurprises</a> or by calling 1-800-985-3059.
            </li>
          </ul>
        </div>

        {/* Section 5: Account Security & Governing Law */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#9E7206]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              5. Portal Account Security, Intellectual Property &amp; Texas Governing Law
            </h2>
          </div>
          <p className="text-sm text-[#44403C] leading-relaxed">
            You are responsible for maintaining the confidentiality of your Client Portal login credentials (whether using email/password or OAuth 2.0 single sign-on via Google, Yahoo, Microsoft/Outlook, Facebook, or X) and for all activities conducted under your account. All website content, clinical guides, branding, and software on <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded">goldenmindpsychiatry.org</code> are the exclusive property of Golden Mind Psychiatry PLLC.
          </p>
          <p className="text-sm text-[#44403C] leading-relaxed">
            <strong>Governing Law &amp; Venue:</strong> These Terms of Service and any dispute arising out of your use of this website or services provided by Golden Mind Psychiatry PLLC shall be governed by and construed in accordance with the laws of the <strong>State of Texas</strong> and applicable federal laws of the United States of America, without regard to conflict-of-law principles.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#44403C]">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#B8860B]" />
                <a href="tel:+14329343185" className="text-[#9E7206] font-semibold hover:underline">+1 (432) 934-3185</a>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#B8860B]" />
                <a href="mailto:info@goldenmindpsychiatry.org" className="text-[#9E7206] font-semibold hover:underline">info@goldenmindpsychiatry.org</a>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('privacy')}
                className="text-xs sm:text-sm font-bold text-[#9E7206] hover:text-[#1C1917] underline cursor-pointer"
              >
                ← View HIPAA &amp; Texas HB 300 Privacy Policy
              </button>
              <button
                onClick={() => onNavigate('portal')}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-[#1C1917] bg-gold-gradient hover:shadow-md transition-all cursor-pointer"
              >
                Return to Client Portal
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
