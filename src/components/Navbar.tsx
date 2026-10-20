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
      <div className="bg-[#FAF7F0] border-b border-[#D4AF37]/25 text-xs py-2 px-4 text-center text-[#5C4A1E]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-[11px] md:text-xs font-medium">
          <div className="flex items-center gap-2 mx-auto md:mx-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]"></span>
            <span>Welcoming New Patients Across Texas · Telehealth & In-Person Appointments Available</span>
          </div>
          <div className="hidden md:flex items-center gap-6 shrink-0 text-[#7C5E0D]">
            <a href="tel:4695550188" className="flex items-center gap-1.5 hover:text-[#B8860B] transition-colors">
              <Phone className="w-3 h-3 text-[#B8860B]" />
              <span>(469) 555-0188</span>
            </a>
            <span className="text-[#D6CEBE]">|</span>
            <span className="text-[#665D4F]">Crisis Support: Dial <strong className="text-[#1A1817]">988</strong></span>
          </div>
        </div>
      </div>

      {/* Main Top Navigation Bar (Strict 3-Zone Contract on Clean White Background) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all duration-300 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark / Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg p-1 text-left cursor-pointer"
            aria-label="Golden Mind Psychiatric Home"
          >
            <GoldenMindLogo variant="horizontal" size="md" />
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-[#292524]">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'home' ? 'text-[#B8860B] font-semibold' : ''
              }`}
            >
              Home
              {currentPage === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className={`hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'about' ? 'text-[#B8860B] font-semibold' : ''
              }`}
            >
              About
              {currentPage === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('services')}
              className={`hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'services' ? 'text-[#B8860B] font-semibold' : ''
              }`}
            >
              Services
              {currentPage === 'services' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full"></span>
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
                className={`flex items-center gap-1.5 hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 ${
                  currentPage.startsWith('condition') ? 'text-[#B8860B] font-semibold' : ''
                }`}
                aria-expanded={conditionsDropdownOpen}
              >
                <span>Conditions</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${conditionsDropdownOpen ? 'rotate-180 text-[#B8860B]' : ''}`} />
              </button>

              {conditionsDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[460px] p-4 bg-white border border-[#D4AF37]/35 rounded-2xl shadow-xl z-50">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-[#B8860B]">Individual Condition Pages</span>
                    <button
                      onClick={() => handleNavClick('conditions-overview')}
                      className="text-xs text-[#57534E] hover:text-[#B8860B] transition-colors font-medium cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {conditionsData.map((condition) => (
                      <button
                        key={condition.id}
                        onClick={() => handleNavClick('condition-detail', condition.id)}
                        className="text-left p-2.5 rounded-xl hover:bg-[#FAF8F2] transition-colors group cursor-pointer border border-transparent hover:border-[#D4AF37]/30"
                      >
                        <p className="text-xs font-semibold text-[#1C1917] group-hover:text-[#B8860B] truncate">
                          {condition.name.split('(')[0]}
                        </p>
                        <p className="text-[10px] text-[#78716C] line-clamp-1 mt-0.5">
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
              className={`hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'telehealth' ? 'text-[#B8860B] font-semibold' : ''
              }`}
            >
              Telehealth
              {currentPage === 'telehealth' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('insurance')}
              className={`hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'insurance' ? 'text-[#B8860B] font-semibold' : ''
              }`}
            >
              Insurance
              {currentPage === 'insurance' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('resources')}
              className={`hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'resources' ? 'text-[#B8860B] font-semibold' : ''
              }`}
            >
              Blog & Resources
              {currentPage === 'resources' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className={`hover:text-[#B8860B] transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                currentPage === 'contact' ? 'text-[#B8860B] font-semibold' : ''
              }`}
            >
              Contact
              {currentPage === 'contact' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full"></span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action (Book an Appointment) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenBooking()}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all duration-300 transform active:scale-95 whitespace-nowrap cursor-pointer shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-[#1C1917]" />
              <span>Book an Appointment</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#1C1917] hover:bg-[#FAF8F5] border border-stone-200 transition-colors"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#B8860B]" /> : <Menu className="w-6 h-6 text-[#1C1917]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Matching Radiant Souls mobile menu layout on white/clean background) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white text-[#1C1917] overflow-y-auto animate-in fade-in duration-200">
          {/* Mobile Header with Logo and Close 'X' */}
          <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-white">
            <button onClick={() => handleNavClick('home')} className="text-left cursor-pointer">
              <GoldenMindLogo variant="horizontal" size="md" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-[#57534E] hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* Mobile Links List (exact style from radiant souls screenshot) */}
          <div className="flex-1 px-6 py-4 space-y-1 bg-white">
            <button
              onClick={() => handleNavClick('home')}
              className="w-full text-left py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] border-b border-stone-100 transition-colors"
            >
              Home
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className="w-full text-left py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] border-b border-stone-100 transition-colors"
            >
              About
            </button>

            <button
              onClick={() => handleNavClick('services')}
              className="w-full text-left py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] border-b border-stone-100 transition-colors"
            >
              Services
            </button>

            {/* Mobile Conditions Accordion */}
            <div className="border-b border-stone-100">
              <button
                onClick={() => setMobileConditionsOpen(!mobileConditionsOpen)}
                className="w-full flex items-center justify-between py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] transition-colors"
              >
                <span>Conditions (Individual Pages)</span>
                <ChevronDown className={`w-5 h-5 text-[#B8860B] transition-transform ${mobileConditionsOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileConditionsOpen && (
                <div className="pl-4 pb-3 space-y-2">
                  {conditionsData.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleNavClick('condition-detail', c.id)}
                      className="w-full text-left py-1.5 text-sm text-[#57534E] hover:text-[#B8860B] transition-colors flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]"></span>
                      <span className="truncate">{c.name.split('(')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleNavClick('telehealth')}
              className="w-full text-left py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] border-b border-stone-100 transition-colors"
            >
              Telehealth
            </button>

            <button
              onClick={() => handleNavClick('insurance')}
              className="w-full text-left py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] border-b border-stone-100 transition-colors"
            >
              Insurance
            </button>

            <button
              onClick={() => handleNavClick('resources')}
              className="w-full text-left py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] border-b border-stone-100 transition-colors"
            >
              Blog & Resources
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className="w-full text-left py-3.5 text-lg font-medium text-[#1C1917] hover:text-[#B8860B] border-b border-stone-100 transition-colors"
            >
              Contact
            </button>
          </div>

          {/* Mobile Bottom Booking CTA */}
          <div className="p-6 border-t border-stone-200 bg-[#FAF8F5]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-4 rounded-xl text-center font-bold text-[#1C1917] bg-gold-gradient shadow-md text-base cursor-pointer hover:shadow-lg transition-all"
            >
              Book Now
            </button>

            <div className="mt-4 text-center">
              <a href="tel:4695550188" className="text-xs text-[#57534E] hover:text-[#B8860B] flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Call Us: (469) 555-0188</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
