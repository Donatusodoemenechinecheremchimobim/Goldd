import React from 'react';
import { GoldenMindLogo } from './GoldenMindLogo';
import { conditionsData } from '../data/conditions';
import { Phone, Mail, MapPin, Shield, Heart, Award, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (conditionId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenBooking }) => {
  const handleLink = (page: string, param?: string) => {
    onNavigate(page, param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-stone-200 text-[#57534E] text-sm relative overflow-hidden">
      {/* 988 Emergency & Poison Control Banner */}
      <div className="bg-[#FAF7F0] border-b border-[#D4AF37]/25 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#B8860B]/15 text-[#9E7206] shrink-0">
              <Heart className="w-3.5 h-3.5 fill-[#B8860B]" />
            </span>
            <span className="text-[#292524]">
              <strong className="text-[#1C1917]">In Immediate Crisis?</strong> Call or text <strong className="text-[#9E7206]">988</strong> for the Suicide &amp; Crisis Lifeline, or call <strong className="text-[#1C1917]">Poison Control</strong> at{' '}
              <a href="tel:8002221222" className="text-[#9E7206] font-bold hover:underline">
                800-222-1222
              </a>
              .
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-[#78716C] text-[11px] font-medium shrink-0">
            <span>Available 24/7 · Free &amp; Confidential</span>
            <button
              onClick={() => handleLink('suicide-prevention')}
              className="text-[#9E7206] hover:text-[#1C1917] font-bold underline cursor-pointer whitespace-nowrap"
            >
              Suicide Prevention &amp; Safety Plan →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Column 1: Brand & Head Owner */}
          <div className="lg:col-span-2 space-y-4">
            <button onClick={() => handleLink('home')} className="text-left cursor-pointer">
              <GoldenMindLogo variant="horizontal" size="md" textColor="dark" />
            </button>
            <p className="text-xs md:text-sm text-[#57534E] leading-relaxed max-w-sm">
              Compassionate, expert psychiatric evaluations and medication management led by <span className="text-[#1C1917] font-semibold">Brenda Hobyani, PMHNP-BC</span>. Dedicated to healing minds, restoring balance, and guiding you toward lasting mental wellness.
            </p>

            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#44403C]">
                <MapPin className="w-4 h-4 text-[#B8860B] shrink-0" />
                <span>Texas · Telehealth Services from the Comfort of Your Home</span>
              </div>
              <div className="flex items-center gap-2 text-[#44403C]">
                <Phone className="w-4 h-4 text-[#B8860B] shrink-0" />
                <a href="tel:+14323006667" className="hover:text-[#B8860B] transition-colors font-medium">(432) 300-6667</a>
              </div>
              <div className="flex items-center gap-2 text-[#44403C]">
                <Mail className="w-4 h-4 text-[#B8860B] shrink-0" />
                <a href="mailto:info@goldenmindpsychiatry.org" className="hover:text-[#B8860B] transition-colors font-medium">info@goldenmindpsychiatry.org</a>
              </div>
              <div className="flex items-center gap-2 text-[#44403C] pt-1 font-medium">
                <span className="text-[#9E7206] font-semibold">Hours:</span>
                <span>Mon – Thu: 8:00 AM – 4:00 PM · Fri: 9:00 AM – 1:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-[#44403C] font-medium">
                <span className="text-[#9E7206] font-semibold">Poison Control (24/7):</span>
                <a href="tel:8002221222" className="hover:text-[#B8860B] transition-colors font-semibold">800-222-1222</a>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => onOpenBooking()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all cursor-pointer shadow-xs"
              >
                <span>Schedule a Consultation</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#1C1917]" />
              </button>
            </div>
          </div>

          {/* Column 2: Individual Condition Pages */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#9E7206] mb-4">
              Conditions We Treat
            </h4>
            <ul className="space-y-2 text-xs">
              {conditionsData.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleLink('condition-detail', c.id)}
                    className="text-[#57534E] hover:text-[#9E7206] transition-colors text-left cursor-pointer font-medium"
                  >
                    {c.name.split('(')[0]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: More Conditions */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#9E7206] mb-4">
              Specialized Care
            </h4>
            <ul className="space-y-2 text-xs">
              {conditionsData.slice(5).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleLink('condition-detail', c.id)}
                    className="text-[#57534E] hover:text-[#9E7206] transition-colors text-left cursor-pointer font-medium"
                  >
                    {c.name.split('(')[0]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Quick Navigation & Practice Info */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#9E7206] mb-4">
              Practice Information
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button onClick={() => handleLink('about')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  About Brenda Hobyani, PMHNP-BC
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('services')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  All Clinical Services
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('telehealth')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  Telehealth Across Texas
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('insurance')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  Insurance & Self-Pay Fees
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('resources')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  Mental Health Guides &amp; FAQ
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('suicide-prevention')} className="text-[#9E7206] hover:text-[#1C1917] font-semibold transition-colors cursor-pointer">
                  Suicide Prevention &amp; Crisis Guide
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('contact')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  Contact Our Office
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('privacy')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  Privacy Policy (HIPAA &amp; TX HB 300)
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('terms')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  Terms of Service &amp; Telehealth Consent
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Conspicuous Texas HB 4224 / Tex. Health & Safety Code § 181.105 & Texas APRN Disclosure Box */}
        <div className="mt-12 p-5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35 space-y-3 text-[11px] text-[#44403C]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
            <span className="font-bold uppercase tracking-wider text-[#9E7206]">
              Texas Mandatory Patient Notice (Texas HB 4224 · Tex. Health &amp; Safety Code § 181.105 · Tex. Occ. Code § 104.003)
            </span>
            <button
              onClick={() => handleLink('portal')}
              className="text-[#9E7206] font-bold underline cursor-pointer"
            >
              Request Electronic Medical Records in Client Portal (15-Day Turnaround) →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 leading-relaxed">
            <div>
              <strong className="text-[#1C1917] block">1. How to Request Your Medical Records (Texas HB 300):</strong>
              Patients may request an electronic copy of their health records at any time via the{' '}
              <button onClick={() => handleLink('portal')} className="text-[#9E7206] font-semibold underline cursor-pointer">
                Client Portal
              </button>
              , by emailing{' '}
              <a href="mailto:info@goldenmindpsychiatry.org" className="text-[#9E7206] font-semibold underline">
                info@goldenmindpsychiatry.org
              </a>
              , or by calling <a href="tel:+14323006667" className="text-[#9E7206] font-semibold">(432) 300-6667</a>. Electronic records are delivered within 15 business days.
            </div>
            <div>
              <strong className="text-[#1C1917] block">2. Licensing Council &amp; Regulatory Contact:</strong>
              Brenda Hobyani, MSN, APRN, PMHNP-BC is licensed as an Advanced Practice Registered Nurse (Psychiatric Mental Health Nurse Practitioner) by the <strong>Texas Board of Nursing</strong> (1801 Congress Ave, Ste 10-200, Austin, TX 78701 · 512-305-7400 ·{' '}
              <a href="https://www.bon.texas.gov" target="_blank" rel="noreferrer" className="text-[#9E7206] underline">
                bon.texas.gov
              </a>
              ) and Texas HHSC (<a href="https://www.hhs.texas.gov" target="_blank" rel="noreferrer" className="text-[#9E7206] underline">hhs.texas.gov</a>).
            </div>
            <div>
              <strong className="text-[#1C1917] block">3. Consumer Protection &amp; Privacy Complaints:</strong>
              To file a consumer or medical privacy complaint under Texas HB 300 / HB 4224, contact the <strong>Office of the Texas Attorney General — Consumer Protection Division</strong> at 1-800-621-0508 or{' '}
              <a href="https://www.texasattorneygeneral.gov/consumer-protection" target="_blank" rel="noreferrer" className="text-[#9E7206] underline">
                texasattorneygeneral.gov/consumer-protection
              </a>
              .
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Medical Disclaimer */}
        <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#78716C]">
          <p>© {new Date().getFullYear()} Golden Mind Psychiatry PLLC. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>HIPAA, Texas HB 300 &amp; HB 4224 Compliant</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>ANCC Board Certified · Zero Ad-Trackers</span>
            </span>
            <button
              onClick={() => handleLink('privacy')}
              className="text-[#78716C] hover:text-[#9E7206] transition-colors underline underline-offset-2 cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleLink('terms')}
              className="text-[#78716C] hover:text-[#9E7206] transition-colors underline underline-offset-2 cursor-pointer"
            >
              Terms, No Surprises Act &amp; ADA Notice
            </button>
            <a
              href="/sitemap.xml"
              className="text-[#78716C] hover:text-[#9E7206] transition-colors underline underline-offset-2"
            >
              XML Sitemap
            </a>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-[#888] leading-relaxed text-center md:text-left space-y-1">
          <p>
            <strong>Medical, Telehealth &amp; APRN Disclosure:</strong> Information provided on this website is for informational and educational purposes only and does not constitute a formal clinician-patient relationship until an initial synchronous clinical evaluation is conducted. Clinical psychiatric evaluations and medication management are provided by Brenda Hobyani, MSN, APRN, PMHNP-BC in accordance with Texas Occupations Code Chapters 104, 111, and 157. For medical or psychiatric emergencies, call 911, dial 988, call Poison Control at 800-222-1222 (24/7), or visit the nearest emergency room.
          </p>
          <p>
            <strong>ACA Section 1557 Non-Discrimination &amp; ADA WCAG 2.1 Accessibility Notice:</strong> Golden Mind Psychiatry PLLC complies with applicable Federal civil rights laws and does not discriminate on the basis of race, color, national origin, age, disability, or sex. Free language assistance and reasonable disability accommodations are available by calling (432) 300-6667 or emailing info@goldenmindpsychiatry.org.
          </p>
        </div>
      </div>
    </footer>
  );
};
