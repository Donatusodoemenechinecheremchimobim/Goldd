import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, Phone, Mail, AlertCircle, Scale, Building2 } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (conditionId?: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1C1917] pt-28 pb-24">
      {/* Header Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white rounded-3xl border border-[#D4AF37]/30 p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8860B]/10 text-[#9E7206] text-xs font-bold uppercase tracking-wider mb-4">
            <Shield className="w-4 h-4" />
            <span>HIPAA · Texas HB 300 (TMRPA) · 42 CFR Part 2 · TDPSA Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1C1917] tracking-tight mb-4">
            Privacy Policy &amp; Notice of Privacy Practices
          </h1>
          <p className="text-base sm:text-lg text-[#57534E] leading-relaxed mb-6">
            <strong>THIS NOTICE DESCRIBES HOW MEDICAL AND PSYCHIATRIC INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</strong>
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#78716C] border-t border-stone-200 pt-5">
            <span><strong>Practice Name:</strong> Golden Mind Psychiatry PLLC</span>
            <span>•</span>
            <span><strong>Lead Clinical Director &amp; Privacy Officer:</strong> Brenda Hobyani, MSN, APRN, PMHNP-BC</span>
            <span>•</span>
            <span><strong>Jurisdiction:</strong> State of Texas &amp; United States Federal Law</span>
            <span>•</span>
            <span><strong>Effective Date:</strong> January 1, 2025 (Last Updated: November 2026)</span>
          </div>
        </div>
      </section>

      {/* Main Legal Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section 1 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#9E7206]">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              1. Our Legal Duty Under Federal &amp; Texas Law
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
            Golden Mind Psychiatry PLLC (“Practice,” “we,” “us,” or “our”) is committed to protecting the confidentiality, integrity, and security of your Protected Health Information (“PHI”) and personal data. We strictly comply with:
          </p>
          <ul className="space-y-2.5 text-sm text-[#44403C] pl-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>Federal HIPAA Privacy, Security, and Breach Notification Rules</strong> (45 C.F.R. Parts 160 and 164) and the <strong>HITECH Act</strong>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>Texas Medical Records Privacy Act (TMRPA) / Texas House Bill 300</strong> (Texas Health &amp; Safety Code Chapter 181), which provides stricter privacy protections for Texas residents than federal law.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>Texas Mental Health Code Confidentiality Provisions</strong> (Texas Health &amp; Safety Code Chapter 611), governing privileged communications and records between a patient and a mental health professional.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>42 C.F.R. Part 2</strong> (Federal Confidentiality of Substance Use Disorder Patient Records), where applicable.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>Texas Data Privacy and Security Act (TDPSA)</strong> (Texas Business &amp; Commerce Code Chapter 541) and the <strong>21st Century Cures Act</strong>.</span>
            </li>
          </ul>
          <p className="text-sm text-[#57534E] bg-[#FAF7F0] p-4 rounded-xl border border-[#D4AF37]/25">
            <strong>Strict Prohibition Under Texas Law (Tex. Health &amp; Safety Code § 181.153):</strong> Golden Mind Psychiatry PLLC <strong>never sells, rents, or leases</strong> your Protected Health Information, mental health records, email address, phone number, or OAuth identity data to third parties or marketers for financial or other remuneration. We do not use your PHI for marketing purposes without your explicit, signed written authorization.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#9E7206]">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              2. How We May Use and Disclose Your Protected Health Information (PHI)
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
            In accordance with HIPAA and Texas Health &amp; Safety Code Chapters 181 and 611, we may use or disclose your health information for the following core purposes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <h3 className="font-bold text-[#1C1917] text-sm mb-1.5">A. Psychiatric Treatment &amp; e-Prescribing</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                To provide, coordinate, or manage your psychiatric evaluation, telepsychiatry care, pharmacogenomic testing, laboratory referrals, and electronic prescriptions (e-Rx) sent to your designated Texas pharmacy.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <h3 className="font-bold text-[#1C1917] text-sm mb-1.5">B. Insurance Billing &amp; Payment</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                To verify insurance eligibility, submit claims, generate CPT superbills, and process co-pays or self-pay invoices with your health plan (such as Blue Cross Blue Shield of Texas, Aetna, Cigna, or UnitedHealthcare).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <h3 className="font-bold text-[#1C1917] text-sm mb-1.5">C. Healthcare Operations &amp; Care Reminders</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                For clinical quality assurance, licensure compliance, secure Client Portal notifications, appointment confirmations, PHQ-9/GAD-7 clinical check-ins, and medication refill status updates.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <h3 className="font-bold text-[#1C1917] text-sm mb-1.5">D. Disclosures Required by Texas or Federal Law</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Only when mandated by statute, including imminent threat of serious physical harm to self or others, mandatory reporting of suspected abuse/neglect of a child, elderly, or disabled person under Texas law, or valid court order.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: OAuth, Client Portal & Website Data */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/10 text-[#9E7206]">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              3. Client Portal, OAuth 2.0 Single Sign-On &amp; Website Data Privacy
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
            When you access <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded">https://goldenmindpsychiatry.org</code> or sign in to the Golden Mind Psychiatry Client Portal using email/password or 1-Click OAuth 2.0 authentication (Google, Yahoo, Microsoft/Outlook, Facebook, or X):
          </p>
          <ul className="space-y-2.5 text-sm text-[#44403C] pl-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>Limited OAuth Scope Use (Google API Services User Data Policy):</strong> When you sign in with Google or another identity provider, we request only your basic identity profile (<code className="text-xs bg-stone-100 px-1 py-0.5 rounded">openid</code>, <code className="text-xs bg-stone-100 px-1 py-0.5 rounded">email</code>, <code className="text-xs bg-stone-100 px-1 py-0.5 rounded">profile</code>) solely to authenticate your patient or provider account and link you to your encrypted clinical chart. Golden Mind Psychiatry PLLC’s use and transfer of information received from Google APIs adheres strictly to the <strong>Google API Services User Data Policy</strong>, including the <strong>Limited Use requirements</strong>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>Encryption &amp; Brute-Force Protection:</strong> All portal sessions are transmitted over TLS/HTTPS encryption, protected by signed JWT session tokens, and guarded by automated brute-force account lockout after 5 failed password attempts.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0 mt-1" />
              <span><strong>SMS &amp; Email Communications Consent:</strong> By providing your phone number or email address, you consent to receive transactional appointment confirmations, telehealth video room links, verification codes, and password reset links. You may opt out of non-essential reminders at any time. Mobile opt-in data and phone numbers are never shared with third parties or affiliates for marketing.</span>
            </li>
          </ul>
        </div>

        {/* Section 4: Your Rights Under Texas HB 300 & HIPAA */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
            4. Your Patient Rights Under Texas HB 300 (TMRPA) &amp; Federal HIPAA
          </h2>
          <p className="text-sm text-[#44403C] leading-relaxed">
            As a patient of Golden Mind Psychiatry PLLC, you have the following enforceable legal rights regarding your medical and psychiatric records:
          </p>
          <ul className="space-y-3 text-sm text-[#44403C]">
            <li>
              <strong>• Right to Electronic Copy Within 15 Business Days (Texas Health &amp; Safety Code § 181.102):</strong> Under Texas HB 300, when you submit a written request for your electronic health records maintained in our electronic health record system, we will provide an electronic copy within <strong>15 business days</strong> of receiving your request (faster than the 30-day federal HIPAA window).
            </li>
            <li>
              <strong>• Right to Request Amendments:</strong> If you believe clinical information in your chart is inaccurate or incomplete, you may submit a written request to amend your record.
            </li>
            <li>
              <strong>• Right to an Accounting of Disclosures:</strong> You have the right to request a list of non-routine disclosures of your PHI made by our practice over the preceding six (6) years.
            </li>
            <li>
              <strong>• Right to Request Confidential Communications &amp; Restrictions:</strong> You may request that we contact you only at a specific email address, phone number, or mailing address. If you pay for a psychiatric service out-of-pocket in full, you have the right to require that we not disclose information about that visit to your health insurance plan.
            </li>
            <li>
              <strong>• Right to Breach Notification:</strong> You have the right to be notified promptly in accordance with HIPAA and Texas Business &amp; Commerce Code § 521.053 in the event of any unauthorized acquisition or breach of your unsecured PHI.
            </li>
          </ul>
        </div>

        {/* Section 5: Texas Mandatory Complaint & Regulatory Contact Notice */}
        <div className="bg-white rounded-2xl border border-[#D4AF37]/40 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8860B]/15 text-[#9E7206]">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
              5. Privacy Officer Contact &amp; Texas / Federal Complaint Procedures
            </h2>
          </div>
          <p className="text-sm text-[#44403C] leading-relaxed">
            If you have questions about this Notice of Privacy Practices, wish to request your records, or believe your privacy rights have been violated, please contact our Privacy Officer directly. You will never be retaliated against for filing a complaint.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D4AF37]/30 space-y-1.5">
              <p className="font-bold text-[#1C1917]">Golden Mind Psychiatry PLLC — Privacy Officer</p>
              <p className="text-[#44403C]">Attn: Brenda Hobyani, MSN, APRN, PMHNP-BC</p>
              <p className="text-[#44403C] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#B8860B]" />
                <a href="tel:+14329343185" className="text-[#9E7206] font-semibold hover:underline">+1 (432) 934-3185</a>
              </p>
              <p className="text-[#44403C] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#B8860B]" />
                <a href="mailto:info@goldenmindpsychiatry.org" className="text-[#9E7206] font-semibold hover:underline">info@goldenmindpsychiatry.org</a>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs text-[#44403C]">
              <p className="font-bold text-[#1C1917]">Texas &amp; Federal Regulatory Agencies:</p>
              <p>• <strong>Texas Board of Nursing (APRN Licensing &amp; Complaints):</strong> 1801 Congress Ave, Suite 10-200, Austin, TX 78701 · (512) 305-7400 · <a href="https://www.bon.texas.gov" target="_blank" rel="noreferrer" className="text-[#9E7206] underline">bon.texas.gov</a></p>
              <p>• <strong>Office of the Texas Attorney General (Consumer Protection / HB 300):</strong> P.O. Box 12548, Austin, TX 78711 · 1-800-621-0508 · <a href="https://www.texasattorneygeneral.gov" target="_blank" rel="noreferrer" className="text-[#9E7206] underline">texasattorneygeneral.gov</a></p>
              <p>• <strong>U.S. Dept. of Health &amp; Human Services — Office for Civil Rights (OCR):</strong> 200 Independence Ave SW, Washington, DC 20201 · 1-877-696-6775 · <a href="https://www.hhs.gov/ocr/privacy" target="_blank" rel="noreferrer" className="text-[#9E7206] underline">hhs.gov/ocr/privacy</a></p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200">
            <button
              onClick={() => onNavigate('terms')}
              className="text-xs sm:text-sm font-bold text-[#9E7206] hover:text-[#1C1917] underline cursor-pointer"
            >
              View Terms of Service &amp; Texas Telehealth Informed Consent →
            </button>
            <button
              onClick={() => onNavigate('portal')}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[#1C1917] bg-gold-gradient hover:shadow-md transition-all cursor-pointer"
            >
              Return to Client Portal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
