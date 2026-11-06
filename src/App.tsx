/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ConditionDetailPage } from './pages/ConditionDetailPage';
import { ConditionsOverviewPage } from './pages/ConditionsOverviewPage';
import { TelehealthPage } from './pages/TelehealthPage';
import { InsurancePage } from './pages/InsurancePage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ContactPage } from './pages/ContactPage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { SuicidePreventionPage } from './pages/SuicidePreventionPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { AppointmentModal } from './components/AppointmentModal';
import { conditionsData } from './data/conditions';

const CANONICAL_BASE_URL = 'https://goldenmindpsychiatry.org';

const VALID_PAGES = [
  'about',
  'services',
  'conditions-overview',
  'telehealth',
  'insurance',
  'resources',
  'suicide-prevention',
  'contact',
  'portal',
  'privacy',
  'privacy-policy',
  'terms',
  'terms-of-service',
  'home',
];

const PAGE_SEO_MAP: Record<string, { title: string; description: string; queryPath: string }> = {
  home: {
    title: 'Golden Mind Psychiatry PLLC | “Where Every Mind Is Golden.” | Brenda Hobyani, PMHNP-BC',
    description:
      'Golden Mind Psychiatry PLLC — “Where Every Mind Is Golden.” Compassionate psychiatric evaluations, medication management, and 100% telehealth across Texas led by Brenda Hobyani, PMHNP-BC.',
    queryPath: '/',
  },
  about: {
    title: 'About Brenda Hobyani, PMHNP-BC | Golden Mind Psychiatry PLLC',
    description:
      'Meet Brenda Hobyani, MSN, APRN, PMHNP-BC, Founder & Lead Clinical Director of Golden Mind Psychiatry PLLC. Compassionate, board-certified psychiatric care across Texas.',
    queryPath: '/?page=about',
  },
  services: {
    title: 'Clinical Psychiatric Services & Medication Management | Golden Mind Psychiatry PLLC',
    description:
      'Comprehensive psychiatric evaluations, precision medication management, pharmacogenomic DNA testing, and 100% telehealth services across Texas for children, teens, and adults.',
    queryPath: '/?page=services',
  },
  'conditions-overview': {
    title: 'Conditions We Treat | Psychiatric Specialties | Golden Mind Psychiatry PLLC',
    description:
      'Specialized psychiatric treatment for ADHD, Anxiety, Depression, Bipolar Disorder, PTSD, OCD, Insomnia, Women’s Mental Health, Autism/IDD, and Substance Use across Texas.',
    queryPath: '/?page=conditions-overview',
  },
  telehealth: {
    title: '100% Telehealth Psychiatry Across Texas | Golden Mind Psychiatry PLLC',
    description:
      'Access secure, HIPAA-compliant virtual psychiatric evaluations and medication management from the comfort of your home anywhere in Texas.',
    queryPath: '/?page=telehealth',
  },
  insurance: {
    title: 'Accepted Insurance Plans & Transparent Self-Pay Fees | Golden Mind Psychiatry PLLC',
    description:
      'Golden Mind Psychiatry PLLC accepts major Texas insurance plans including Blue Cross Blue Shield, Aetna, Cigna, UnitedHealthcare, and offers transparent self-pay options.',
    queryPath: '/?page=insurance',
  },
  resources: {
    title: 'Mental Health Guides, Patient Education & FAQs | Golden Mind Psychiatry PLLC',
    description:
      'Explore evidence-based mental health guides, medication FAQs, and preparation checklists from Golden Mind Psychiatry PLLC.',
    queryPath: '/?page=resources',
  },
  'suicide-prevention': {
    title: 'Suicide Prevention, 988 Crisis Lifeline & Safety Planning | Golden Mind Psychiatry PLLC',
    description:
      '24/7 free and confidential crisis resources including the 988 Suicide & Crisis Lifeline, Crisis Text Line, Poison Control (800-222-1222), and clinical safety planning.',
    queryPath: '/?page=suicide-prevention',
  },
  contact: {
    title: 'Contact Our Office & Schedule a Telehealth Visit | Golden Mind Psychiatry PLLC',
    description:
      'Connect with Golden Mind Psychiatry PLLC at (432) 300-6667 or info@goldenmindpsychiatry.org to schedule your Texas telehealth psychiatric evaluation.',
    queryPath: '/?page=contact',
  },
  portal: {
    title: 'Client & Provider Telehealth Portal | Golden Mind Psychiatry PLLC',
    description:
      'Secure HIPAA-compliant patient and provider portal for Golden Mind Psychiatry PLLC. Manage telehealth appointments, intake forms, PHQ-9/GAD-7 check-ins, and refills.',
    queryPath: '/?page=portal',
  },
  privacy: {
    title: 'Privacy Policy & Notice of Privacy Practices (HIPAA & Texas HB 300) | Golden Mind Psychiatry PLLC',
    description:
      'Official Notice of Privacy Practices and Website Privacy Policy for Golden Mind Psychiatry PLLC, compliant with Federal HIPAA, Texas HB 300 (Texas Medical Records Privacy Act), and 42 CFR Part 2.',
    queryPath: '/?page=privacy',
  },
  terms: {
    title: 'Terms of Service & Texas Telehealth Informed Consent | Golden Mind Psychiatry PLLC',
    description:
      'Terms of Service, Texas Telehealth Informed Consent (Tex. Occ. Code Ch. 111), and Federal No Surprises Act Notice for Golden Mind Psychiatry PLLC.',
    queryPath: '/?page=terms',
  },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentParam, setCurrentParam] = useState<string | undefined>('adhd');
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [prefillCondition, setPrefillCondition] = useState<string | undefined>();

  // Parse and strictly whitelist URL hash, query parameters (?page=... / ?condition=...), or path on load
  useEffect(() => {
    const syncRouteFromLocation = () => {
      const rawHash = window.location.hash.replace('#', '').split('?')[0].split('&')[0];
      const cleanHash = rawHash.replace(/[^a-zA-Z0-9/-]/g, '');

      if (cleanHash) {
        if (cleanHash.startsWith('condition/')) {
          const conditionId = cleanHash.replace('condition/', '');
          if (conditionsData.some((c) => c.id === conditionId)) {
            setCurrentPage('condition-detail');
            setCurrentParam(conditionId);
            return;
          }
        } else if (VALID_PAGES.includes(cleanHash)) {
          setCurrentPage(cleanHash);
          return;
        }
      }

      // Check query string parameters used by sitemap.xml (?page=... or ?condition=...) or Firebase Custom Action URLs (?mode=...&oobCode=...)
      const searchParams = new URLSearchParams(window.location.search);
      const queryCondition = (searchParams.get('condition') || '').replace(/[^a-zA-Z0-9-]/g, '');
      const queryPage = (searchParams.get('page') || '').replace(/[^a-zA-Z0-9-]/g, '');
      const authMode = searchParams.get('mode') || '';
      const oobCode = searchParams.get('oobCode') || '';

      if (
        oobCode ||
        authMode === 'verifyEmail' ||
        authMode === 'resetPassword' ||
        authMode === 'signIn' ||
        authMode === 'recoverEmail' ||
        queryPage === 'reset-password' ||
        searchParams.get('view') === 'reset-password'
      ) {
        setCurrentPage('portal');
        return;
      }

      if (queryCondition && conditionsData.some((c) => c.id === queryCondition)) {
        setCurrentPage('condition-detail');
        setCurrentParam(queryCondition);
        return;
      }

      if (queryPage && VALID_PAGES.includes(queryPage)) {
        setCurrentPage(queryPage);
        return;
      }

      // Check clean pathname fallback (e.g., /about or /condition/adhd)
      const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9/-]/g, '');
      if (cleanPath.startsWith('condition/')) {
        const conditionId = cleanPath.replace('condition/', '');
        if (conditionsData.some((c) => c.id === conditionId)) {
          setCurrentPage('condition-detail');
          setCurrentParam(conditionId);
          return;
        }
      } else if (cleanPath && VALID_PAGES.includes(cleanPath)) {
        setCurrentPage(cleanPath);
        return;
      }

      if (cleanHash) {
        setCurrentPage('home');
        window.location.hash = '';
      }
    };

    syncRouteFromLocation();
    window.addEventListener('hashchange', syncRouteFromLocation);
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncRouteFromLocation);
      window.removeEventListener('popstate', syncRouteFromLocation);
    };
  }, []);

  // Dynamically update document.title, meta description, OpenGraph tags, and canonical link per route/condition
  useEffect(() => {
    let pageTitle = PAGE_SEO_MAP.home.title;
    let pageDesc = PAGE_SEO_MAP.home.description;
    let canonicalUrl = `${CANONICAL_BASE_URL}/`;

    if (currentPage === 'condition-detail' && currentParam) {
      const condition = conditionsData.find((c) => c.id === currentParam);
      if (condition) {
        pageTitle = `${condition.name} | Golden Mind Psychiatry PLLC`;
        pageDesc = `${condition.shortDescription} Specialized 100% telehealth psychiatric care across Texas led by Brenda Hobyani, PMHNP-BC.`;
        canonicalUrl = `${CANONICAL_BASE_URL}/?condition=${condition.id}`;
      }
    } else if (PAGE_SEO_MAP[currentPage]) {
      pageTitle = PAGE_SEO_MAP[currentPage].title;
      pageDesc = PAGE_SEO_MAP[currentPage].description;
      canonicalUrl = `${CANONICAL_BASE_URL}${PAGE_SEO_MAP[currentPage].queryPath}`;
    }

    document.title = pageTitle;

    const setMetaContent = (selector: string, content: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };

    setMetaContent('meta[name="description"]', pageDesc);
    setMetaContent('meta[property="og:title"]', pageTitle);
    setMetaContent('meta[property="og:description"]', pageDesc);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', pageTitle);
    setMetaContent('meta[name="twitter:description"]', pageDesc);

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalUrl);
    }
  }, [currentPage, currentParam]);

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page);
    setCurrentParam(param);

    // Update browser hash so users can bookmark, refresh, and use browser back/forward
    if (page === 'condition-detail' && param) {
      window.location.hash = `condition/${param}`;
    } else if (page === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = page;
    }
  };

  const [privacyBannerAck, setPrivacyBannerAck] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('gmp_privacy_banner_ack_v1') === '1';
    } catch {
      return false;
    }
  });

  const handleAckPrivacyBanner = () => {
    try {
      window.localStorage.setItem('gmp_privacy_banner_ack_v1', '1');
    } catch {
      // ignore
    }
    setPrivacyBannerAck(true);
  };

  const handleOpenBooking = (conditionName?: string) => {
    setPrefillCondition(conditionName);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1C1917] font-sans antialiased selection:bg-[#D4AF37]/30 selection:text-[#5B4208]">
      {/* Radiant Souls Style Navigation with Golden Mind Branding */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenBooking={handleOpenBooking}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage
            onNavigate={handleNavigate}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentPage === 'services' && (
          <ServicesPage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {(currentPage === 'conditions-overview' || currentPage === 'conditions') && (
          <ConditionsOverviewPage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentPage === 'condition-detail' && currentParam && (
          <ConditionDetailPage
            conditionId={currentParam}
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentPage === 'telehealth' && (
          <TelehealthPage
            onOpenBooking={() => handleOpenBooking('Telepsychiatry Evaluation')}
          />
        )}

        {currentPage === 'insurance' && (
          <InsurancePage
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentPage === 'resources' && (
          <ResourcesPage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentPage === 'suicide-prevention' && (
          <SuicidePreventionPage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentPage === 'portal' && (
          <ClientPortalPage
            onOpenBooking={handleOpenBooking}
            onNavigate={handleNavigate}
          />
        )}

        {(currentPage === 'privacy' || currentPage === 'privacy-policy') && (
          <PrivacyPolicyPage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {(currentPage === 'terms' || currentPage === 'terms-of-service') && (
          <TermsOfServicePage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenBooking={handleOpenBooking}
      />

      {/* Dismissible HIPAA, Texas HB 300, TDPSA & Zero-Ad-Tracker Compliance Banner */}
      {!privacyBannerAck && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#D4AF37]/40 text-white px-4 py-3 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-stone-300 leading-relaxed text-center sm:text-left">
              <strong className="text-[#D4AF37]">HIPAA, Texas HB 300 &amp; TDPSA Privacy Notice:</strong>{' '}
              This medical site uses strictly essential encrypted session storage and runs{' '}
              <strong className="text-white">zero third-party advertising pixels</strong>. Review our{' '}
              <button
                type="button"
                onClick={() => handleNavigate('privacy')}
                className="text-[#D4AF37] font-semibold underline cursor-pointer"
              >
                Privacy Policy (HB 4224)
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => handleNavigate('terms')}
                className="text-[#D4AF37] font-semibold underline cursor-pointer"
              >
                Telehealth Consent, No Surprises Act &amp; ADA Notice
              </button>
              .
            </p>
            <button
              type="button"
              onClick={handleAckPrivacyBanner}
              className="px-4 py-1.5 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-xs shrink-0 cursor-pointer hover:opacity-95"
            >
              Acknowledge &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* Interactive Appointment Booking Modal */}
      <AppointmentModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        prefillCondition={prefillCondition}
        onNavigateToPortal={() => handleNavigate('portal')}
      />
    </div>
  );
}
