# Admin Provider Command Center, Individual Patient Charts & Real-Time Portal Sync Plan

Configure the primary Admin Provider login (`beehobs@yahoo.com` with password `johnbull`) to open directly into the **Admin Provider Command Center**, browse the full **All Patients Database**, enter any individual patient's isolated chart workspace, update medications, treatment plans, links, intake assignments, and billing in real time on that client's portal, and trigger instant email alerts to both `beehobs@yahoo.com` and `info@goldenmindpsychiatry.org` whenever a client sends a portal message.

## User Review & Confirmed Decisions

> [!IMPORTANT]
> All core preferences have been confirmed from your answers and are locked in for execution upon approval:

- **Confirmed Decision 1 — Admin Login & Default View**: Signing in with **`beehobs@yahoo.com`** and password **`johnbull`** automatically authenticates (and provisions the account on first login without email verification blocks) and opens directly into the **Admin Provider Command Center**.
- **Confirmed Decision 2 — Isolated Individual Patient Charts**: From the **All Patients Database**, the provider can enter any individual patient's dedicated chart workspace, where every patient has their own separate database records and live controls.
- **Confirmed Decision 3 — Full Real-Time Per-Patient Controls**: Inside each patient's chart, the admin can:
  1. Add, edit, update dosage/instructions/refills, or discontinue recommended medications (`Active`, `Refill Requested`, `Discontinued`).
  2. Communicate 1-on-1 with the patient via Portal Messaging and send clickable telehealth room links, booking links, or custom external resource links.
  3. Set and update patient-specific diagnoses, treatment plan notes, recommended drug regimens, and appointment statuses that immediately display on that client's portal.
  4. Assign psychiatric intake forms and create or update copay/billing statements.
- **Confirmed Decision 4 — Dual-Recipient Instant Email Notifications**: Whenever a client sends a message in the portal, an instant branded email notification is sent to **both `beehobs@yahoo.com` and `info@goldenmindpsychiatry.org`** alerting the provider to open the portal and review the message. Conversely, when the provider messages a patient or sends a link, the patient receives an email alert to check their portal.

---

## 1. Overview & Core Concept

- **What It Does**: Provides Brenda Hobyani, PMHNP-BC (`beehobs@yahoo.com`) with an executive clinical command center where she can view all registered patients, open any patient's isolated electronic chart, prescribe or modify recommended medications, write personalized care plans, message patients with clickable links, and receive immediate email alerts whenever a patient reaches out.
- **Target Audience / Persona**:
  - **Primary Provider / Admin**: Signs in with `beehobs@yahoo.com` (`johnbull`) to manage her entire patient panel and individual patient charts.
  - **Patients / Clients**: Sign in to their private Client Portal to view their updated medications, provider treatment recommendations, shared links, appointments, intake forms, and messages in real time.
- **Key Value**: Every action taken by the admin inside a patient's chart is stored in that patient's dedicated database records and reflects immediately on that patient's portal without page reloads, paired with automated email notifications so no message is missed.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Direct Admin Sign-In (`beehobs@yahoo.com` / `johnbull`)**: Entering `beehobs@yahoo.com` and `johnbull` on the portal sign-in screen logs directly into the **Admin Provider Command Center** with full administrative privileges across all patient records.
  2. **All Patients Database & Entering an Individual Patient Chart**:
     - The provider sees a searchable **All Patients Database** table/grid showing each patient's name, email, phone, active diagnosis, medication count, unread messages, and upcoming appointments.
     - Clicking **"Open Patient Chart"** enters a dedicated **Single-Patient Chart Workspace** isolated to that specific patient, featuring breadcrumb navigation (`All Patients Database / [Patient Name]`) and sub-tabs for **Overview & Care Plan**, **Medications & Prescriptions**, **1-on-1 Messages & Links**, **Appointments**, and **Intakes & Billing**.
  3. **Modifying Medications & Treatment Recommendations (Live Sync to Client Portal)**:
     - Inside the patient's chart, the provider can add a new recommended medication, edit an existing medication's dosage, frequency, instructions, or refills, or discontinue/remove a medication.
     - The provider can also update the patient's **Clinical Diagnosis, Recommended Drug Regimen & Care Plan Notes**, and **Pinned Resource Links**, which appear immediately in a dedicated **Provider Care Plan & Recommendations** card on that client's portal Overview and Medications views.
  4. **1-on-1 Messaging with Clickable Links & Email Alerts**:
     - Inside a patient's chart (or the global inbox), the provider can send a direct message to that patient and use one-click buttons to insert a **HIPAA Telehealth Video Room Link**, **Self-Scheduling Link**, or **Custom URL**.
     - All URLs in messages automatically render as clickable buttons/links for both the client and provider.
     - When a client sends a message from their portal, the server immediately dispatches a branded Golden Mind Psychiatry email alert to **both `beehobs@yahoo.com` and `info@goldenmindpsychiatry.org`** with the client's name, message preview, and a direct button to open the Provider Portal.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast clinical precision with warm luxury gold accents (`#D4AF37`, `#B8860B`) on clean neutral slate/alabaster surfaces.
  - *Layout & Density*: Clean single-elevation workspaces with crisp 1px borders, tabular numerals (`tabular-nums`) for dosages, dates, and copay figures, and clear semantic status indicators (Emerald for active/approved, Amber for pending/requested, Rose for discontinued/urgent).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Seamless Admin Account Provisioning & Security Rules Exemption**
  - *Chosen Approach*: Configure `beehobs@yahoo.com` as an authorized provider account in both the frontend workspace and database security rules (without blocking on initial email verification tokens) and automatically initialize her account credentials on first sign-in with `johnbull`.
  - *Why*: Ensures `beehobs@yahoo.com` can log in immediately with `johnbull` and read/write all patient collections without permission errors or verification lockouts.
- **Decision 2: Isolated Per-Patient Chart Workspace**
  - *Chosen Approach*: In addition to global clinic queues, provide a dedicated **Single-Patient Chart Mode** when the admin clicks into any patient from the All Patients Database. All actions inside that chart automatically target that specific `patientId`.
  - *Why*: Prevents cross-patient confusion and gives each patient a truly separate, comprehensive clinical chart where the admin can manage drugs, notes, messages, intakes, and billing in one place.
- **Decision 3: Dual-Channel Email Alerts for Client-to-Provider & Provider-to-Client Messages**
  - *Chosen Approach*: Wire the portal messaging flow to an automated email notification endpoint that sends branded HTML emails to **both `beehobs@yahoo.com` and `info@goldenmindpsychiatry.org`** whenever a client sends a message, and sends a branded alert to the client's email address whenever the provider messages them.
  - *Why*: Guarantees the admin is immediately notified in her Yahoo and clinic inboxes whenever a patient sends a message in the portal.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Admin Provider Command Center (beehobs@yahoo.com)         │
│  ┌──────────────────────────┐       ┌────────────────────────────────────┐  │
│  │  All Patients Database   │──────▶│   Individual Patient Chart View    │  │
│  │  • Search & Filter       │ Enter │   • Care Plan, Diagnosis & Notes   │  │
│  │  • Patient Summary Cards │ Chart │   • Add / Edit / Discontinue Meds  │  │
│  │  • Quick Chart Launch    │       │   • 1-on-1 Messaging + Link Sender │  │
│  └──────────────────────────┘       │   • Appointments, Intakes, Billing │  │
│                                     └─────────────────┬──────────────────┘  │
└───────────────────────────────────────────────────────┼─────────────────────┘
                                                        │ Real-Time Sync
                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                Firestore Real-Time Per-Patient Collections                  │
│  • users/{patientId} (diagnosis, treatmentPlanNotes, assignedLinks)         │
│  • medications/{medId} (name, dosage, frequency, instructions, status)      │
│  • messages/{msgId} (senderRole, patientId, content with clickable URLs)    │
│  • appointments/{aptId}, intakes/{intakeId}, invoices/{invoiceId}           │
└──────────────────────────┬───────────────────────────────────┬──────────────┘
                           │                                   │
            Live Listener  ▼                                   ▼  SMTP / Email
┌─────────────────────────────────────────┐   ┌───────────────────────────────┐
│      Client Portal (Patient View)       │   │   Automated Email Service     │
│  • Displays Provider Care Plan & Notes  │   │  • Client -> Provider Alert   │
│  • Shows Live Recommended Medications   │   │    sent to beehobs@yahoo.com  │
│  • Renders Clickable Links in Messages  │   │    & info@goldenmind...       │
│  • Sends Messages to Provider           │   │  • Provider -> Client Alert   │
└─────────────────────────────────────────┘   └───────────────────────────────┘
```

- **Data Model & State**:
  - **Patient Profile & Care Plan (`users/{patientId}`)**:
    - Stores patient demographics plus provider-managed fields: `diagnosis`, `treatmentPlanNotes`, `clinicalRecommendations` (recommended drug/therapy notes), and `sharedResources` (array of `{ title, url, addedAt }`).
  - **Medications Collection (`medications/{medId}`)**:
    - Scoped per `patientId`. Supports full admin CRUD: create new medication, edit `name`, `dosage`, `frequency`, `instructions`, `refillsRemaining`, and `refillStatus` (`approved`, `pending`, `requested`, `denied`, `discontinued`), or delete medication.
  - **Messages Collection (`messages/{msgId}`)**:
    - Scoped per `patientId`. Stores `senderId`, `senderName`, `senderRole` (`client` | `provider`), `subject`, `content`, `createdAt`, and `read`. URLs embedded in `content` are automatically parsed into clickable links with external-link badges.
  - **Security Rules**:
    - Grants full read/write administrative access across `users`, `appointments`, `medications`, `intakes`, `messages`, `invoices`, and `moodLogs` when signed in as `beehobs@yahoo.com` (as well as existing clinic admin emails), while keeping each client strictly isolated to their own `patientId` records.
- **Interactive Component & State Mapping**:
  - **Admin Auto-Authentication & Mode Routing**: Signing in with `beehobs@yahoo.com` and `johnbull` authenticates (creating the Firebase Auth user on first run if needed) and sets `workspaceMode = 'provider'`.
  - **Dedicated Patient Chart Drawer / Workspace**: Selecting any patient in the All Patients Database sets `activePatientChartId`, opening their complete isolated chart with live forms for editing their Care Plan, Medications, 1-on-1 Messages (with quick-insert link tools), Appointments, Intakes, and Invoices.
  - **Automated Message Email Alert Endpoint**: When `handleSendMessage` runs from a client account, it triggers the backend email alert endpoint, dispatching an HTML notification email to `beehobs@yahoo.com` and `info@goldenmindpsychiatry.org`.
