import React, { useState, useEffect } from 'react';
import { GoldenMindLogo } from './GoldenMindLogo';
import {
  X,
  ChevronDown,
  Calendar,
  Phone,
  ArrowUpRight,
  Lock,
  Shield,
} from 'lucide-react';
import { conditionsData } from '../data/conditions';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
  onOpenBooking: (prefillCondition?: string) => void;
}

const MOBILE_CORE_NAV = [
  { num: '01', id: 'home', label: 'Home' },
  { num: '02', id: 'about', label: 'About' },
  { num: '03', id: 'services', label: 'Services' },
  { num: '04', id: 'telehealth', label: 'Telehealth' },
  { num: '05', id: 'resources', label: 'Resources' },
  { num: '06', id: 'contact', label: 'Contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenBooking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [conditionsDropdownOpen, setConditionsDropdownOpen] = useState(false);
  const [mobileConditionsOpen, setMobileConditionsOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (page: string, param?: string) => {
    onNavigate(page, param);
    setMobileMenuOpen(false);
    setMobileConditionsOpen(false);
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
            <a href="tel:+14323006667" className="flex items-center gap-1.5 hover:text-[#FFF4BE] transition-colors">
              <Phone className="w-3 h-3 text-[#D4AF37]" />
              <span>(432) 300-6667</span>
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

      {/* Main Top Navigation Bar: Floating Frosted Obsidian Glass on Mobile, Architectural Black Bar on Desktop */}
      <header className="sticky top-2.5 lg:top-0 z-40 mx-3 lg:mx-0 rounded-2xl lg:rounded-none bg-[#09090B]/75 lg:bg-black backdrop-blur-2xl backdrop-saturate-150 lg:backdrop-blur-none border border-[#D4AF37]/35 lg:border-x-0 lg:border-t-0 lg:border-b lg:border-[#D4AF37]/45 shadow-[0_14px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.14)] lg:shadow-xl transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 h-16 lg:h-20 flex items-center justify-between gap-2 xl:gap-4">
          {/* Zone 1: Brand Wordmark / Logo with Gold Letters */}
          <button
            onClick={() => handleNavClick('home')}
            className="shrink-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg p-1 text-left cursor-pointer"
            aria-label="Golden Mind Psychiatric Home"
          >
            <GoldenMindLogo variant="horizontal" size="sm" textColor="gold" />
          </button>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2.5 xl:gap-4 2xl:gap-5 text-xs xl:text-[13px] font-medium text-stone-200 shrink-0">
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
          </nav>

          {/* Zone 3: Desktop CTAs + High-Class Mobile Glass Action Trigger */}
          <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
            <button
              onClick={() => handleNavClick('portal')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                currentPage === 'portal'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]'
                  : 'bg-white/[0.06] lg:bg-stone-900 backdrop-blur-md text-[#D4AF37] border-[#D4AF37]/50 hover:border-[#D4AF37]'
              }`}
            >
              <span>Client Portal</span>
            </button>

            <button
              onClick={() => onOpenBooking()}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 xl:px-5 py-2 rounded-full text-xs font-semibold text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_20px_rgba(212,175,55,0.45)] transition-all duration-300 transform active:scale-95 whitespace-nowrap cursor-pointer shadow-md shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-[#1C1917] shrink-0" />
              <span>Book an Appointment</span>
            </button>

            {/* Quick Mobile Portal Button on <640px */}
            <button
              onClick={() => handleNavClick('portal')}
              className={`sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border backdrop-blur-md transition-all cursor-pointer shrink-0 ${
                currentPage === 'portal'
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]'
                  : 'bg-white/[0.07] border-white/15 text-[#E6C35C] hover:border-[#D4AF37]/50'
              }`}
              aria-label="Open Client Portal"
              title="Client Portal"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Refined Mobile Glassmorphism Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center gap-2 h-10 min-w-[44px] px-3.5 rounded-xl bg-gradient-to-b from-white/[0.13] to-white/[0.04] hover:from-white/[0.18] hover:to-white/[0.08] backdrop-blur-xl border border-[#D4AF37]/45 text-[#F3E5AB] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] active:scale-95 shrink-0"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <svg
                  className="w-4 h-4 text-[#D4AF37]"
                  viewBox="0 0 20 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 2.5H19"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 7H19"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 11.5H19"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
                {mobileMenuOpen ? 'Close' : 'Menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* High-Class Frosted Obsidian Glassmorphism Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-2.5 sm:p-5 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-[28px] overflow-hidden bg-[#0B0B0E]/82 backdrop-blur-2xl backdrop-saturate-150 border border-[#D4AF37]/35 shadow-[0_28px_90px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.16)] text-stone-100"
          >
            {/* Subtle Specular Gold Ambient Top Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#D4AF37]/[0.12] via-[#D4AF37]/[0.03] to-transparent" />

            {/* Sheet Header */}
            <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <button
                onClick={() => handleNavClick('home')}
                className="text-left cursor-pointer focus:outline-none"
              >
                <GoldenMindLogo variant="horizontal" size="sm" textColor="gold" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-11 h-11 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.14] backdrop-blur-md flex items-center justify-center text-[#F3E5AB] transition-colors cursor-pointer shrink-0"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Frosted Glass Destination Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {MOBILE_CORE_NAV.map((item) => {
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`min-h-[66px] p-3.5 rounded-2xl border backdrop-blur-md text-left transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                        isActive
                          ? 'bg-[#D4AF37]/[0.16] border-[#D4AF37]/60 text-[#FFF4BE] shadow-[inset_0_1px_0_rgba(255,244,190,0.22)]'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.08] hover:border-[#D4AF37]/40 text-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[10px] font-mono tabular-nums tracking-wider ${
                            isActive ? 'text-[#E6C35C]' : 'text-stone-500 group-hover:text-[#D4AF37]'
                          }`}
                        >
                          {item.num}
                        </span>
                        <ArrowUpRight
                          className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                            isActive ? 'text-[#D4AF37]' : 'text-stone-500 group-hover:text-[#D4AF37]'
                          }`}
                        />
                      </div>
                      <span className="text-sm font-semibold tracking-tight mt-1.5">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Expandable Frosted Conditions Panel */}
              <div
                className={`rounded-2xl border backdrop-blur-md overflow-hidden transition-colors ${
                  currentPage.startsWith('condition')
                    ? 'bg-[#D4AF37]/[0.12] border-[#D4AF37]/50'
                    : 'bg-white/[0.04] border-white/[0.08]'
                }`}
              >
                <button
                  onClick={() => setMobileConditionsOpen((prev) => !prev)}
                  className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left cursor-pointer"
                  aria-expanded={mobileConditionsOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono tabular-nums text-[#D4AF37]">07</span>
                    <span className="text-sm font-semibold text-stone-100">
                      Conditions We Treat
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#D4AF37] transition-transform duration-200 ${
                      mobileConditionsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {mobileConditionsOpen && (
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/[0.07] bg-black/30">
                    <div className="grid grid-cols-2 gap-1.5">
                      {conditionsData.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleNavClick('condition-detail', c.id)}
                          className="min-h-[42px] px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-[#D4AF37]/15 border border-white/[0.06] hover:border-[#D4AF37]/40 text-left text-xs font-medium text-stone-200 hover:text-[#FFF4BE] transition-colors cursor-pointer truncate"
                        >
                          {c.name.split('(')[0]}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleNavClick('conditions-overview')}
                      className="w-full min-h-[40px] rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-[#D4AF37]/30 text-xs font-semibold text-[#E6C35C] transition-colors cursor-pointer"
                    >
                      View All Conditions →
                    </button>
                  </div>
                )}
              </div>

              {/* Suicide Prevention & Crisis Guide Row */}
              <button
                onClick={() => handleNavClick('suicide-prevention')}
                className={`w-full min-h-[52px] px-4 py-3 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-all cursor-pointer ${
                  currentPage === 'suicide-prevention'
                    ? 'bg-[#D4AF37]/[0.16] border-[#D4AF37]/60 text-[#FFF4BE]'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-[#D4AF37]/40 text-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="text-sm font-semibold">
                    Suicide Prevention &amp; 988 Crisis Guide
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-400 shrink-0" />
              </button>
            </div>

            {/* Bottom Frosted Concierge Action Dock */}
            <div className="relative z-10 p-4 bg-white/[0.03] border-t border-white/[0.08] backdrop-blur-xl space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleNavClick('portal')}
                  className="min-h-[48px] px-3 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-[#D4AF37]/45 text-[#F3E5AB] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap"
                >
                  <Lock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Client Portal</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                  className="min-h-[48px] px-3 py-3 rounded-2xl bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(212,175,55,0.3)] transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4 text-[#1C1917] shrink-0" />
                  <span>Book Visit</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-stone-400">
                <a
                  href="tel:+14323006667"
                  className="hover:text-[#D4AF37] inline-flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3 h-3 text-[#D4AF37]" />
                  <span>(432) 300-6667</span>
                </a>
                <span className="text-stone-600">·</span>
                <span>
                  Crisis: <strong className="text-[#E6C35C]">988</strong>
                </span>
                <span className="text-stone-600">·</span>
                <a href="tel:8002221222" className="hover:text-[#D4AF37] transition-colors">
                  Poison: <strong className="text-[#E6C35C]">800-222-1222</strong>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

