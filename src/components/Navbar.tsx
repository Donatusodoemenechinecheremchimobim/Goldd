import React, { useState } from 'react';
import { GoldenMindLogo } from './GoldenMindLogo';
import { Menu, X, ChevronDown, Calendar, Phone } from 'lucide-react';
import { conditionsData } from '../data/conditions';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (prefillCondition?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenBooking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [conditionsDropdownOpen, setConditionsDropdownOpen] = useState(false);
  const [mobileConditionsOpen, setMobileConditionsOpen] = useState(false);

  const handleNavClick = (page: string, param?: string) => {
    onNavigate(page, param);
    setMobileMenuOpen(false);
    setConditionsDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Notification / Crisis Assistance Bar */}
      <div className="bg-[#080808] border-b border-stone-800/80 text-xs py-2 px-4 text-center text-stone-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-[11px] md:text-xs font-medium">
          <div className="flex items-center gap-2 mx-auto md:mx-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            <span>Welcoming New Patients Across Texas · 100% Telehealth Visits</span>
          </div>
          <div className="hidden md:flex items-center gap-5 shrink-0 text-[#E6C35C]">
            <a href="tel:+14329343185" className="flex items-center gap-1.5 hover:text-[#FFF4BE] transition-colors">
              <Phone className="w-3 h-3 text-[#D4AF37]" />
              <span>+1 (432) 934-3185</span>
            </a>
            <span className="text-stone-700">|</span>
            <button
              onClick={() => handleNavClick('suicide-prevention')}
              className="text-stone-400 hover:text-[#FFF4BE] transition-colors cursor-pointer"
            >
              Suicide Prevention &amp; Crisis: Dial <strong className="text-[#FFF4BE]">988</strong>
            </button>
            <span className="text-stone-700">|</span>
            <a href="tel:8002221222" className="text-stone-400 hover:text-[#FFF4BE] transition-colors">
              Poison Control (24/7): <strong className="text-[#FFF4BE]">800-222-1222</strong>
            </a>
          </div>
        </div>
      </div>

      {/* Main Top Navigation Bar (Deep Pure Black Background with Radiant Gold Letters) */}
      <header className="sticky top-0 z-40 bg-black border-b border-[#D4AF37]/45 transition-all duration-300 shadow-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-4 xl:gap-8">
          {/* Zone 1: Brand Wordmark / Logo with Gold Letters */}
          <button
            onClick={() => handleNavClick('home')}
            className="shrink-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg p-1 text-left cursor-pointer mr-2 xl:mr-6"
            aria-label="Golden Mind Psychiatric Home"
          >
            <GoldenMindLogo variant="horizontal" size="md" textColor="gold" />
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 2xl:gap-7 text-xs xl:text-sm font-medium text-stone-200 shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'home' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              Home
              {currentPage === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'about' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              About
              {currentPage === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('services')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'services' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              Services
              {currentPage === 'services' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            {/* Conditions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setConditionsDropdownOpen(true)}
              onMouseLeave={() => setConditionsDropdownOpen(false)}
            >
              <button
                onClick={() => handleNavClick('conditions-overview')}
                className={`flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 ${
                  currentPage.startsWith('condition') ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
                }`}
                aria-expanded={conditionsDropdownOpen}
              >
                <span>Conditions</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${conditionsDropdownOpen ? 'rotate-180 text-[#D4AF37]' : 'text-stone-400'}`} />
              </button>

              {conditionsDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[460px] p-4 bg-[#121212] border border-[#D4AF37]/40 rounded-2xl shadow-2xl z-50">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D4AF37]">Individual Condition Pages</span>
                    <button
                      onClick={() => handleNavClick('conditions-overview')}
                      className="text-xs text-stone-400 hover:text-[#D4AF37] transition-colors font-medium cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {conditionsData.map((condition) => (
                      <button
                        key={condition.id}
                        onClick={() => handleNavClick('condition-detail', condition.id)}
                        className="text-left p-2.5 rounded-xl hover:bg-[#1C1C1C] transition-colors group cursor-pointer border border-transparent hover:border-[#D4AF37]/40"
                      >
                        <p className="text-xs font-semibold text-stone-200 group-hover:text-[#D4AF37] truncate">
                          {condition.name.split('(')[0]}
                        </p>
                        <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                          {condition.tagline}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleNavClick('telehealth')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'telehealth' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              Telehealth
              {currentPage === 'telehealth' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('insurance')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'insurance' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              Insurance
              {currentPage === 'insurance' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('resources')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'resources' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              Resources
              {currentPage === 'resources' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('suicide-prevention')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'suicide-prevention' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              Suicide Prevention
              {currentPage === 'suicide-prevention' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'contact' ? 'text-[#D4AF37] font-semibold' : 'text-stone-200'
              }`}
            >
              Contact
              {currentPage === 'contact' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('portal')}
              className={`hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'portal' ? 'text-[#D4AF37] font-semibold' : 'text-[#E6C35C]'
              }`}
            >
              Client Portal
              {currentPage === 'portal' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full"></span>
              )}
            </button>
          </nav>

          {/* Zone 3: Client Portal + Book an Appointment + Mobile Hamburger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleNavClick('portal')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                currentPage === 'portal'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]'
                  : 'bg-stone-900 text-[#D4AF37] border-[#D4AF37]/50 hover:border-[#D4AF37]'
              }`}
            >
              <span>Client Portal</span>
            </button>

            <button
              onClick={() => onOpenBooking()}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.45)] transition-all duration-300 transform active:scale-95 whitespace-nowrap cursor-pointer shadow-md"
            >
              <Calendar className="w-3.5 h-3.5 text-[#1C1917]" />
              <span>Book an Appointment</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-black text-[#D4AF37] hover:bg-stone-900 border-2 border-[#D4AF37]/70 transition-all shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6 text-[#D4AF37]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Matching black & gold luxury aesthetic) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-[#0A0A0A] text-stone-100 overflow-y-auto animate-in fade-in duration-200">
          {/* Mobile Header with Logo and Close 'X' */}
          <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-[#0A0A0A]">
            <button onClick={() => handleNavClick('home')} className="text-left cursor-pointer">
              <GoldenMindLogo variant="horizontal" size="md" textColor="gold" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl text-[#D4AF37] hover:bg-stone-900 border border-[#D4AF37]/35 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Links List */}
          <div className="flex-1 px-6 py-4 space-y-1 bg-[#0A0A0A]">
            <button
              onClick={() => handleNavClick('home')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              Home
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              About
            </button>

            <button
              onClick={() => handleNavClick('services')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              Services
            </button>

            {/* Mobile Conditions Accordion */}
            <div className="border-b border-stone-800/80">
              <button
                onClick={() => setMobileConditionsOpen(!mobileConditionsOpen)}
                className="w-full flex items-center justify-between py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] transition-colors"
              >
                <span>Conditions (Individual Pages)</span>
                <ChevronDown className={`w-5 h-5 text-[#D4AF37] transition-transform ${mobileConditionsOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileConditionsOpen && (
                <div className="pl-4 pb-3 space-y-2 bg-[#121212] rounded-xl my-2 p-3 border border-stone-850">
                  {conditionsData.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleNavClick('condition-detail', c.id)}
                      className="w-full text-left py-1.5 text-sm text-stone-300 hover:text-[#D4AF37] transition-colors flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                      <span className="truncate">{c.name.split('(')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleNavClick('telehealth')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              Telehealth
            </button>

            <button
              onClick={() => handleNavClick('insurance')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              Insurance
            </button>

            <button
              onClick={() => handleNavClick('resources')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              Blog &amp; Resources
            </button>

            <button
              onClick={() => handleNavClick('suicide-prevention')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              Suicide Prevention &amp; Crisis Guide
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className="w-full text-left py-3.5 text-lg font-medium text-stone-200 hover:text-[#D4AF37] border-b border-stone-800/80 transition-colors"
            >
              Contact
            </button>

            <button
              onClick={() => handleNavClick('portal')}
              className="w-full text-left py-3.5 text-lg font-semibold text-[#D4AF37] hover:text-[#FFF4BE] border-b border-stone-800/80 transition-colors"
            >
              Client Portal
            </button>
          </div>

          {/* Mobile Bottom Booking CTA */}
          <div className="p-6 border-t border-stone-800 bg-[#0E0E0E]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-4 rounded-xl text-center font-bold text-[#1C1917] bg-gold-gradient shadow-lg text-base cursor-pointer hover:shadow-xl transition-all"
            >
              Book Now
            </button>

            <div className="mt-4 text-center space-y-1.5">
              <a href="tel:+14329343185" className="text-xs text-stone-400 hover:text-[#D4AF37] flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Call Us: +1 (432) 934-3185</span>
              </a>
              <p className="text-[11px] text-stone-400">
                Crisis Line: <strong className="text-[#D4AF37]">988</strong> · Poison Control (24/7):{' '}
                <a href="tel:8002221222" className="text-[#D4AF37] font-semibold hover:underline">
                  800-222-1222
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
