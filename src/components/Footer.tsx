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
      {/* 988 Emergency / Crisis Banner */}
      <div className="bg-[#FAF7F0] border-b border-[#D4AF37]/25 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#B8860B]/15 text-[#9E7206]">
              <Heart className="w-3.5 h-3.5 fill-[#B8860B]" />
            </span>
            <span className="text-[#292524]">
              <strong className="text-[#1C1917]">In Immediate Crisis?</strong> If you or a loved one is in danger or experiencing severe suicidal thoughts, please call or text <strong className="text-[#9E7206]">988</strong> immediately.
            </span>
          </div>
          <div className="text-[#78716C] text-[11px] font-medium">
            Available 24 hours a day, 7 days a week. Free & Confidential.
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
                <a href="tel:+14329343185" className="hover:text-[#B8860B] transition-colors font-medium">+1 (432) 934-3185</a>
              </div>
              <div className="flex items-center gap-2 text-[#44403C]">
                <Mail className="w-4 h-4 text-[#B8860B] shrink-0" />
                <a href="mailto:info@goldenmindpsychiatry.org" className="hover:text-[#B8860B] transition-colors font-medium">info@goldenmindpsychiatry.org</a>
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
                  Mental Health Guides & FAQ
                </button>
              </li>
              <li>
                <button onClick={() => handleLink('contact')} className="text-[#57534E] hover:text-[#9E7206] transition-colors cursor-pointer">
                  Contact Our Office
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Medical Disclaimer */}
        <div className="mt-14 pt-8 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#78716C]">
          <p>© {new Date().getFullYear()} Golden Mind Psychiatry PLLC. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>HIPAA Compliant Practice</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>ANCC Board Certified</span>
            </span>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-[#888] leading-relaxed text-center md:text-left">
          Notice: Information provided on this website is for informational and educational purposes only and does not constitute a formal doctor-patient relationship until an initial clinical evaluation is conducted. For medical or psychiatric emergencies, call 911 or visit the nearest emergency room.
        </div>
      </div>
    </footer>
  );
};
