# Golden Mind Psychiatry — Client Portal, Provider Dashboard & Clinical Automation Plan

This plan introduces a live, database-backed **Patient Client Portal** and **Provider Clinical Dashboard** powered by **Firebase Authentication** and **Cloud Firestore**, complete with automated clinical onboarding, PHQ-9/GAD-7 symptom tracking, prescription refill workflows, and secure patient-provider messaging.

---

## User Review & Confirmed Decisions

> [!IMPORTANT]
> All core product decisions below reflect your selections from our planning questions. Once you click **Proceed**, we will provision your live Firebase database and build the complete portal experience.

- **Confirmed Decision 1 — Full-Suite Patient Client Portal**: Includes all six clinical modules: (1) Appointment booking, rescheduling & telehealth video links, (2) Digital intake forms & psychiatric questionnaires, (3) Active medication list & 1-click prescription refill requests, (4) Secure direct messaging with Brenda Hobyani, PMHNP-BC, (5) Daily mood journal & PHQ-9/GAD-7 symptom tracker, and (6) Insurance coverage & billing statements.
- **Confirmed Decision 2 — Self-Registration & Authentication**: Patients can create accounts and sign in immediately using **Google Sign-In** (enabled out-of-the-box via Firebase Auth) or **Email & Password** authentication.
- **Confirmed Decision 3 — End-to-End Clinical Automation**:
  - **Auto-Onboarding**: Creating a new patient account or booking a consultation automatically generates the patient's profile, assigns required **New Patient Psychiatric Intake Forms**, and queues a baseline **PHQ-9 & GAD-7 Assessment**.
  - **Instant Telehealth Provisioning**: Booking an appointment automatically generates a confirmation record, assigns a unique **HIPAA Telehealth Room Link**, and syncs any guest bookings matching the patient's email directly into their portal account.
  - **Pre-Visit Check-In Automation**: Upcoming appointments automatically surface a pre-visit PHQ-9/GAD-7 check-in prompt on the patient's dashboard so Brenda has updated symptom scores before the session begins.
  - **Refill Routing**: Submitting a prescription refill request automatically routes a priority task to Brenda's Provider Dashboard and updates the patient's medication status in real time (`Requested` → `Under Review` → `Sent to Pharmacy`).
- **Confirmed Decision 4 — Provider Dashboard for Brenda Hobyani**: Includes a dedicated **Provider Clinical Portal** (accessible to authorized admin/provider accounts) to manage all patient charts, appointments, completed intakes, symptom trends, refill approvals, billing statements, and two-way secure messages.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms Golden Mind Psychiatry PLLC from an informational and booking site into a complete outpatient telepsychiatry platform. Patients have a private, calming digital sanctuary to manage their care across Texas, while Brenda Hobyani, PMHNP-BC has a unified clinical workspace to oversee patient progress and automate administrative intake tasks.
- **Target Audience / Persona**:
  - **Patients**: Adults and adolescents across Texas seeking convenient, stigma-free telepsychiatry from home who want transparent access to their appointments, treatment plans, refills, and provider communication.
  - **Provider / Practice Owner**: Brenda Hobyani, PMHNP-BC, managing psychiatric evaluations, follow-ups, medication refills, and intake documentation.
- **Key Value**: Eliminates manual intake chasing and phone tag by automatically assigning clinical paperwork upon signup, tracking standardized psychiatric rating scales (PHQ-9 & GAD-7) over time, and keeping all telehealth links, medications, and messages synchronized in real time.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Account Creation & Automated Onboarding**:
   - Clicking **Client Portal** in the top navigation bar opens the authentication gateway.
   - When a patient registers or signs in for the first time, an automated onboarding trigger initializes their secure chart, links any prior appointment requests submitted under their email, and populates their **Action Center** with their initial *Comprehensive Psychiatric Intake Form* and *Baseline PHQ-9 / GAD-7 Screener*.
2. **Patient Workspace (6 Integrated Modules)**:
   - **Overview & Automation Action Center**: Displays the next upcoming telehealth session with a 1-click **Join Telehealth Room** button, automated pre-visit tasks (pending intakes or symptom check-ins), recent provider messages, and active prescription statuses.
   - **Appointments & Telehealth**: Book new 100% telehealth evaluations or follow-ups, reschedule or cancel existing visits, and launch encrypted video consultation rooms.
   - **Intake Forms & Clinical Questionnaires**: Interactive, step-by-step digital forms (Psychiatric History, Medical & Family History, Consent for Telehealth) plus interactive **PHQ-9** (Depression) and **GAD-7** (Anxiety) questionnaires with automatic severity scoring.
   - **Medications & Refill Requests**: View active prescriptions (dosage, instructions, pharmacy on file, remaining refills) and trigger 1-click automated refill requests with pharmacy confirmation.
   - **Symptom & Mood Tracker**: Log daily mood, sleep hours, energy levels, and medication adherence, paired with longitudinal trend visualizations of PHQ-9, GAD-7, and mood scores.
   - **Secure Messaging**: Direct, asynchronous two-way clinical messaging thread with Brenda Hobyani, PMHNP-BC for non-urgent questions between visits.
   - **Insurance & Billing**: Upload/update insurance policy details (carrier, member ID, group number, preferred Texas pharmacy) and view/pay copay or evaluation statements.
3. **Provider Clinical Dashboard (Brenda's Workspace)**:
   - **Practice Command View**: Real-time queue of today's telehealth appointments, pending prescription refill requests, unread patient messages, and newly submitted intake forms.
   - **Patient Chart Inspector**: Select any patient to inspect their completed intake forms, PHQ-9/GAD-7 longitudinal scores, mood logs, and insurance/pharmacy details; prescribe or update medications; approve refill requests; issue billing statements; and send direct messages.

### Visual Identity & Theme

- **Aesthetic Direction**: Refined Clinical Luxury & Calm Sanctuary — seamlessly bridging the rich black-and-gold executive header with a high-contrast, airy daylight workspace (`#FFFFFF` and `#FAF9F5` surfaces) for effortless reading of clinical data.
- **Color Palette & Mood**:
  - **Dominant Canvas (60%)**: Crisp Alabaster White (`#FFFFFF`) and Warm Ivory (`#FAF9F5`) for zero eye strain during form completion and chart review.
  - **Structural Surfaces (30%)**: Deep Obsidian (`#0A0A0A`) for the top bar and portal sidebar navigation; Warm Stone (`#F5F3EF`) and 1px hairline borders (`#E7E5E4`) for single-elevation workspace panels.
  - **Accent & Semantic Tokens (10%)**: Metallic Gold (`#D4AF37` / `#B8860B`) for primary actions and active navigation states; Emerald (`#16A34A`) for confirmed appointments and approved refills; Amber (`#D97706`) for pending intakes or refill reviews; Crimson (`#DC2626`) for urgent alerts or crisis support notices.
- **Typography & Hierarchy**:
  - **Display & Section Headings**: `Playfair Display` (`font-serif`) for warm, authoritative clinical headings.
  - **Workspace UI & Body**: `Plus Jakarta Sans` (`font-sans`) for crisp scannability at 12px–15px across tables, forms, and message threads.
  - **Clinical Metrics & Timestamps**: Tabular numerals (`tabular-nums` / `font-mono`) for all PHQ-9/GAD-7 scores, dosages, appointment dates, and billing amounts so columns align with mathematical precision.
- **Component Styling & Layout**:
  - **1440px Desktop Workspace**: Left sidebar navigation (`260px` fixed width on desktop, collapsible drawer on mobile) + contextual top workspace bar + single-elevation content canvas.
  - **Zero-Pill Metadata Discipline**: Appointment timestamps, dosage frequencies, and form submission dates render as clean unboxed typography separated by `·` dividers rather than cluttered badge sandwiches.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Cloud Firestore with Real-Time Listeners (`onSnapshot`)**
  - *Chosen Approach*: Provision a dedicated Cloud Firestore database with real-time snapshot subscriptions for appointments, messages, medications, and intakes.
  - *Why*: When Brenda approves a prescription refill, sends a message, or updates a telehealth link in the Provider Dashboard, the patient's portal reflects the change instantaneously without page reloads.
  - *Alternatives Considered*: Local storage or static mock state was rejected because data would not persist across devices or allow real provider-to-patient interaction.
- **Decision 2: Strict Attribute-Based Access Control (ABAC) Security Rules**
  - *Chosen Approach*: Enforce Zero-Trust Firestore security rules where patients can only read and write documents matching their own `patientId == request.auth.uid`, while verified provider/admin accounts can manage clinical records across patients.
  - *Why*: Protects sensitive psychiatric health records, intake answers, and PII against unauthorized access.
- **Decision 3: Deterministic Client-Driven Clinical Automation Engine**
  - *Chosen Approach*: Build an automated workflow service that executes atomic Firestore batch writes upon key lifecycle events (Account Signup, Appointment Booking, Intake Completion, Refill Request).
  - *Why*: Guarantees reliable, zero-latency automation (instant assignment of intake forms, automatic calculation and logging of PHQ-9/GAD-7 clinical severity scores, and automatic linking of pre-signup bookings) without relying on external cron servers.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        GOLDEN MIND PSYCHIATRY APPLICATION                        │
├───────────────────────────┬──────────────────────────────────────────────────────┤
│   PUBLIC MARKETING SITE   │        AUTHENTICATED PORTAL & CLINICAL SUITE         │
│  ┌─────────────────────┐  │  ┌────────────────────────────────────────────────┐  │
│  │ Home / About /      │  │  │ Auth Gateway (Google Sign-In & Email/Password) │  │
│  │ Services /          │  │  └───────────────────────┬────────────────────────┘  │
│  │ Condition Pages     │  │                          ▼                           │
│  └──────────┬──────────┘  │  ┌────────────────────────────────────────────────┐  │
│             │             │  │ Clinical Automation Engine                     │  │
│             ▼             │  │ • Auto-Assign Intakes on Signup / Booking      │  │
│  ┌─────────────────────┐  │  │ • Sync Guest Bookings by Email to UID          │  │
│  │ Appointment Booking │──┼─►│ • Auto-Score PHQ-9 / GAD-7 & Alert Provider    │  │
│  │ Modal (100% Tele)   │  │  │ • Route Refill Requests & Telehealth Links     │  │
│  └─────────────────────┘  │  └───────────┬────────────────────────┬───────────┘  │
└───────────────────────────┴──────────────┼────────────────────────┼──────────────┘
                                           ▼                        ▼
                        ┌──────────────────────────┐    ┌──────────────────────────┐
                        │  PATIENT CLIENT PORTAL   │    │    PROVIDER DASHBOARD    │
                        │ • Action Center Overview │    │ • Daily Telehealth Queue │
                        │ • Telehealth & Bookings  │    │ • Patient Chart Explorer │
                        │ • Digital Intake Forms   │    │ • Intake & Score Review  │
                        │ • PHQ-9/GAD-7 & Mood Log │    │ • Rx & Refill Approver   │
                        │ • Medications & Refills  │    │ • 2-Way Clinical Chat    │
                        │ • Secure Messaging       │    │ • Billing & Statements   │
                        │ • Insurance & Billing    │    └─────────────┬────────────┘
                        └─────────────┬────────────┘                  │
                                      └───────────────┬───────────────┘
                                                      ▼
                        ┌──────────────────────────────────────────────────────────┐
                        │       FIREBASE AUTHENTICATION & CLOUD FIRESTORE          │
                        │  /users/{uid}          /appointments/{id}                │
                        │  /intakes/{id}         /assessments/{id}                 │
                        │  /medications/{id}     /messages/{id}     /invoices/{id} │
                        └──────────────────────────────────────────────────────────┘
```

### Data Model & Firestore Collections

1. **`users/{userId}`** *(Patient & Provider Profiles)*:
   - `uid`, `email`, `fullName`, `phone`, `dateOfBirth`, `role` (`'patient' | 'provider'`), `insuranceProvider`, `insuranceMemberId`, `insuranceGroupNumber`, `preferredPharmacy`, `onboardingCompleted`, `createdAt`, `updatedAt`.
2. **`appointments/{appointmentId}`** *(100% Telehealth Consultations)*:
   - `patientId`, `patientName`, `patientEmail`, `patientPhone`, `serviceType`, `conditionReason`, `preferredDate`, `preferredTime`, `status` (`'requested' | 'confirmed' | 'completed' | 'cancelled'`), `telehealthUrl`, `preVisitScreenerCompleted`, `notes`, `providerNotes`, `createdAt`, `updatedAt`.
3. **`intakes/{intakeId}`** *(Assigned & Completed Digital Intake Forms)*:
   - `patientId`, `patientName`, `formType` (`'comprehensive-psychiatric-intake' | 'telehealth-consent' | 'medical-history'`), `title`, `status` (`'pending' | 'completed'`), `responses` (structured map of clinical questions & answers), `assignedAt`, `completedAt`.
4. **`assessments/{assessmentId}`** *(PHQ-9, GAD-7 & Daily Mood Logs)*:
   - `patientId`, `patientName`, `type` (`'PHQ-9' | 'GAD-7' | 'DAILY-MOOD'`), `totalScore` (0–27 for PHQ-9, 0–21 for GAD-7, 1–10 for Mood), `severity` (`'Minimal' | 'Mild' | 'Moderate' | 'Moderately Severe' | 'Severe'`), `sleepHours`, `energyLevel`, `medicationTaken`, `notes`, `answers` (bounded list of item scores), `createdAt`.
5. **`medications/{medicationId}`** *(Active Regimen & Refill Automation)*:
   - `patientId`, `patientName`, `medicationName`, `dosage`, `frequency`, `instructions`, `pharmacy`, `refillsRemaining`, `refillStatus` (`'active' | 'refill_requested' | 'approved_sent' | 'denied'`), `lastRefillRequestedAt`, `prescribedBy`, `updatedAt`.
6. **`messages/{messageId}`** *(Secure Patient–Provider Messaging)*:
   - `patientId`, `patientName`, `senderId`, `senderName`, `senderRole` (`'patient' | 'provider'`), `subject`, `body`, `read`, `createdAt`.
7. **`invoices/{invoiceId}`** *(Billing Statements & Copays)*:
   - `patientId`, `patientName`, `description`, `serviceDate`, `amount`, `insuranceCoveredAmount`, `patientResponsibility`, `status` (`'paid' | 'due' | 'processing'`), `paidAt`, `createdAt`.

### Interactive Component & State Mapping

- **Public Booking Modal Integration**: Submitting the `AppointmentModal` now writes directly to Firestore (`appointments`) and prompts the patient to either view their booking inside the **Client Portal** or create their account in 1 click so their intake forms are ready immediately.
- **Automated Onboarding Hook**: On first login, a transactional check verifies if the patient has required intake forms in `intakes`; if not, it automatically creates their *Comprehensive Psychiatric Intake*, *HIPAA Telehealth Consent*, and initial welcome message from Brenda Hobyani, PMHNP-BC.
- **Interactive PHQ-9 & GAD-7 Calculator**: Validates all 9 depression items and 7 anxiety items, computes clinical severity bands in real time, persists to `assessments`, and updates any pending pre-visit appointment check-in flags.
- **Provider Role Switching**: Authenticated admin/provider users see a dedicated **Provider Dashboard** switch in the portal header, unlocking the multi-patient clinical management view.
