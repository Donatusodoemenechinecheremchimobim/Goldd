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
import { AppointmentModal } from './components/AppointmentModal';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentParam, setCurrentParam] = useState<string | undefined>('adhd');
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [prefillCondition, setPrefillCondition] = useState<string | undefined>();

  // Parse and strictly whitelist URL hash on load (blocks URL injection, query tampering, or foreign ID access)
  useEffect(() => {
    const handleHashChange = () => {
      // Strip any query string or suspicious characters from hash
      const rawHash = window.location.hash.replace('#', '').split('?')[0].split('&')[0];
      const cleanHash = rawHash.replace(/[^a-zA-Z0-9/-]/g, '');

      if (cleanHash) {
        if (cleanHash.startsWith('condition/')) {
          const conditionId = cleanHash.replace('condition/', '');
          setCurrentPage('condition-detail');
          setCurrentParam(conditionId);
        } else if (
          [
            'about',
            'services',
            'conditions-overview',
            'telehealth',
            'insurance',
            'resources',
            'contact',
            'portal',
            'home',
          ].includes(cleanHash)
        ) {
          setCurrentPage(cleanHash);
        } else {
          setCurrentPage('home');
          window.location.hash = '';
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenBooking={handleOpenBooking}
      />

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
