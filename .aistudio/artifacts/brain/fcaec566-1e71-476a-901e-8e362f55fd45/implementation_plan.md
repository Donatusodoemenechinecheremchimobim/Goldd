# Texas & U.S. Federal Healthcare Compliance & Account Registration Enhancement Plan

Bring **Golden Mind Psychiatry PLLC (`goldenmindpsychiatry.org`)** into 100% compliance with Texas state healthcare statutes, U.S. federal healthcare regulations, telecommunications/consumer privacy laws, and web accessibility standards, while upgrading account creation and patient intake to capture **Gender (`Male`, `Female`, `Other` — with an input to state/specify when `Other` is selected)**.

## User Review & Critical Decisions

> [!IMPORTANT]
> All regulatory, privacy, and registration enhancements below have been confirmed and incorporated into this plan:

- **Account Creation & Profile Gender Selection (`Male`, `Female`, `Other` + Custom Specification)**: Both the initial **New Client Account Creation** form, the **1-Click Sign-Up Mandatory Profile Completion** screen, and the **Appointment Booking** form will require **Gender** selection with options for **Male**, **Female**, and **Other**—and whenever **Other** is selected, an immediate text field appears so the client can state their specific gender identity, saving it directly to their clinical chart and notifying Brenda Hobyani, PMHNP-BC.
- **Mandatory Clickwrap Informed Consents**: Explicit checkboxes on Appointment Booking, Contact, and Portal Registration for **HIPAA & Texas HB 300 Privacy Notice**, **Texas Telehealth Physical Location Attestation**, **FCC/TCPA SMS & Email Transactional Notifications**, and **Under-18 Parent/Legal Guardian Consent** (Texas Family Code Ch. 32).
- **Texas & Federal Healthcare Disclosures**: Conspicuous **Texas HB 4224** medical records & complaint notice, **Federal No Surprises Act Good Faith Estimate (GFE)** on the Insurance & Pricing page, **Texas APRN Licensure & Prescriptive Authority Disclosure**, and a **1-Click Electronic Medical Records Request Tool (Texas HB 300)** inside the Client Portal.
- **Web Accessibility & Consumer Data Privacy**: **ADA WCAG 2.1 AA & ACA Section 1557 Non-Discrimination Notice**, plus a dismissible **HIPAA & Texas TDPSA Zero-Ad-Tracker Privacy Banner**.

---

## 1. Overview & Core Concept

- **What It Does**: Protects Golden Mind Psychiatry PLLC across all Texas and U.S. federal healthcare, telehealth, consumer privacy, and telecommunications laws while ensuring every new patient account captures complete demographic identity—including **Gender (`Male`, `Female`, `Other` with custom specification)**, Date of Birth (with automatic under-18 parent/guardian consent validation), and timestamped legal clickwrap consents.
- **Target Audience / Persona**: Adults, teens, and parents/guardians across Texas seeking telepsychiatry care with **Brenda Hobyani, MSN, APRN, PMHNP-BC**, as well as regulatory auditors and health plan reviewers verifying clinic compliance.
- **Key Value**: Eliminates statutory exposure under Texas HB 300, Texas HB 4224, the Federal No Surprises Act, HIPAA, TCPA, and ADA Title III while delivering a seamless, dignified "Warm Clinical Sanctuary" patient onboarding experience.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Account Creation & 1-Click Onboarding Gender Flow**:
     - When a client creates an account using Email & Password, or completes their mandatory profile after 1-Click Login (Google, Yahoo, Outlook, X, Facebook), they select their **Gender** (`Male`, `Female`, or `Other`).
     - Selecting **`Other`** smoothly reveals a required **"Please state / specify your gender"** input field so the patient's exact stated gender is recorded in both the clinical database and provider notifications.
  2. **Under-18 Minor Guardian Flow (Texas Family Code Ch. 32)**:
     - Entering a Date of Birth under 18 years old automatically reveals a required **Parent / Legal Guardian Full Name, Relationship & Consent Attestation** box before the form can be submitted.
  3. **Clickwrap Informed Consent Flow**:
     - Before submitting an Appointment Request, Contact Inquiry, or Portal Registration, patients check clear, plain-language consent boxes for HIPAA/Texas HB 300 privacy practices, physical presence in Texas for telehealth, and transactional SMS/email alerts (`STOP` to opt out, `HELP` for assistance).
  4. **1-Click Electronic Medical Records Request (Texas HB 300)**:
     - Inside the Client Portal, patients can request a full electronic copy of their medical records with one click, triggering an immediate confirmation email and logging the 15-business-day statutory fulfillment window for the provider.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Warm Clinical Sanctuary—calm, authoritative, and transparent.
  - *Color Palette & Mood*: Warm alabaster/ivory surfaces (`#FAF7F0` and `#FFFFFF`), deep obsidian headers (`#0A0A0A`), charcoal body typography (`#1C1917`), and champagne gold accents (`#D4AF37` / `#9E7206`).
  - *Typography & Hierarchy*: `Cormorant Garamond` for headings paired with `Plus Jakarta Sans` for crisp legal disclosures, form controls, and `tabular-nums` for dates, fees, and statutory timelines.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Inclusive yet Structured Gender Capture (`Male`, `Female`, `Other` + Free-Text Specification)**
  - *Chosen Approach*: Provide a clear selector with `Male`, `Female`, and `Other`, and dynamically render a required text input (`"Please state your gender"`) whenever `Other` is chosen, storing the exact stated value in the patient's clinical record.
  - *Why*: Ensures clean structured demographic reporting for insurance/clinical charts while allowing patients who select `Other` to state their exact gender without restriction.
- **Decision 2: Affirmative Clickwrap Over Passive Footer Links**
  - *Chosen Approach*: Require explicit checkbox attestation on booking, contact, and portal sign-up forms, and store the consent timestamp with the patient record.
  - *Why*: Texas Telemedicine statutes, HIPAA/HB 300, and FCC TCPA rules require affirmative opt-in prior to initiating telehealth care or sending automated SMS/email reminders.
- **Decision 3: Zero Third-Party Ad Trackers + Transparent TDPSA Banner**
  - *Chosen Approach*: Confirm zero third-party ad pixels (no Meta/TikTok/retargeting trackers) on clinical pages and display a dismissible bottom notice explaining that only encrypted session storage is used.
  - *Why*: Fully satisfies HHS OCR and FTC health breach guidance as well as the Texas Data Privacy and Security Act (TDPSA).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│                  PATIENT & VISITOR INTERACTION LAYER                       │
├───────────────────────┬──────────────────────────┬─────────────────────────┤
│  Client Portal Auth   │   Appointment & Contact  │  Public Compliance UI   │
│  & Onboarding Gate    │   Interactive Forms      │  & Pricing Disclosures  │
│  • Gender: Male /     │   • Gender + State Input │  • No Surprises Act GFE │
│    Female / Other     │   • Minor (<18) Guardian │  • Texas HB 4224 Notice │
│    (State if Other)   │     Attestation          │  • Texas APRN Licensure │
│  • Clickwrap Consents │   • HIPAA / Telehealth / │  • ADA WCAG 2.1 & 1557  │
│  • 1-Click HB 300     │     TCPA Checkboxes      │  • TDPSA Zero-Tracker   │
│    Records Request    │                          │    Privacy Banner       │
└───────────┬───────────┴────────────┬─────────────┴────────────┬────────────┘
            │                        │                          │
            ▼                        ▼                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│               APPLICATION & CLINICAL AUTOMATION SERVICE                    │
│  • Input Sanitization & Age (<18) Calculation                              │
│  • Gender Formatter ("Male" | "Female" | "Other: <Stated Gender>")         │
│  • Timestamped Consent Audit Stamp (HIPAA, TX HB 300, Telehealth, TCPA)    │
└───────────────────────┬──────────────────────────────────┬─────────────────┘
                        │                                  │
                        ▼                                  ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│   PERSISTENCE LAYER                  │  │   CLINIC SMTP NOTIFICATION API   │
│   • Cloud Firestore & Local Postgres │  │   • Verification & Reset Emails  │
│   • Patient Demographic & Consent    │  │   • HB 300 Records Request Alert │
│     Records                          │  │   • Provider Alerts to Brenda    │
└──────────────────────────────────────┘  └──────────────────────────────────┘
```

- **Data Model & State**:
  - **Patient Profile (`PortalUser`)**: Stores `fullName`, `dateOfBirth`, `phone`, `biologicalSex` (formatted as `Male`, `Female`, or `Other: [Stated Gender]`), `guardianName` (when under 18), `insuranceProvider`, and timestamped `consentsAcceptedAt` flags (`hipaaHb300Consent`, `texasTelehealthConsent`, `tcpaSmsEmailConsent`).
  - **Medical Records Request (`records_requests` / Provider Notification)**: Logs patient UID, full name, email, delivery preference, request timestamp, and statutory 15-business-day deadline under Texas HB 300.
- **Interactive Component & State Mapping**:
  - Selecting `Other` in any Gender dropdown immediately sets `genderSelection = 'Other'` and reveals a required text input (`customGenderInput`) so validation prevents submission until the user states their gender.
  - Entering a Date of Birth dynamically computes patient age; if `< 18`, the form reveals and requires `guardianFullName` and the parent/legal guardian consent checkbox before submission.
  - Clicking **Request Electronic Medical Records (Texas HB 300)** in the Client Portal dispatches a POST request to `/api/email/records-request`, records the request in the patient's message history, and displays an instant confirmation banner.
