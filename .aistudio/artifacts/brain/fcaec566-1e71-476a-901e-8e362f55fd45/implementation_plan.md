# HIPAA, No Surprises Act & PCI-DSS Compliant Billing + Brenda's Private Patient Notes & Downloadable Clinical Logs

This plan upgrades the Client Portal and Brenda's Provider Portal with two complete, legally compliant systems backed by your **Ubuntu PostgreSQL database (`goldenmind_db`)** and **clinic SMTP server (`mailserver.businessidentity.llc`)**:
1. **Compliant Patient Billing & Stripe Checkout**: Supports Credit/Debit Cards, HSA/FSA Medical Cards, Apple Pay, and Google Pay, with pre-payment Itemized CPT & Good Faith Estimate disclosures, mandatory financial consent, printable Superbills, and provider refund/adjustment controls.
2. **Brenda's Private Patient Notes & Downloadable Clinical Logs (Provider-Only)**: Allows Brenda to record separate, private clinical notes and session logs on each patient (protected under HIPAA Psychotherapy/Clinician Note rules so clients never see them) and download/export logs anytime as **CSV Spreadsheets**, **Printable PDF Clinical Summaries**, or **Text/JSON Archives**.

---

## User Review & Confirmed Decisions

> [!IMPORTANT]
> All confirmed billing requirements plus the new Provider Private Patient Notes & Downloadable Logs system are included below:

- **Confirmed Payment Processor & Methods**: **Stripe Checkout** supporting Credit/Debit Cards, **HSA/FSA Health Savings Cards**, **Apple Pay**, and **Google Pay**, with seamless standalone card/HSA checkout verification.
- **Confirmed Payment Timing**: **Both** provider-issued itemized invoices inside the Client Portal **and** an optional upfront co-pay / self-pay deposit option when booking an appointment.
- **Confirmed Legal & Financial Disclosures Before Payment**: Clients must review an **Itemized CPT Code & Service Breakdown**, **Insurance Co-Pay vs. Self-Pay Responsibility**, **Federal No Surprises Act Good Faith Estimate Notice (45 C.F.R. § 149.610)**, and check a mandatory **Informed Financial & Late-Cancellation Consent** box before paying.
- **Confirmed Post-Payment Automation & Provider Controls**:
  1. **Printable / Downloadable Itemized Receipt & Insurance Superbill** in the Client Portal and Provider Portal.
  2. **Automated Branded SMTP Receipt Email** sent to both the client and Brenda (`info@goldenmindpsychiatry.org`).
  3. **Full PostgreSQL Audit Ledger (`goldenmind_db`)** + **Provider Refund & Adjustment Controls**.
- **Added — Brenda's Private Patient Notes & Downloadable Logs (Admin / Provider Portal Only)**:
  1. **Per-Patient Private Notes & Session Logs**: Inside every Patient's Chart (and in a dedicated Provider Logs view), Brenda can write, categorize, and timestamp private notes (`SOAP / Session Note`, `Psychotherapy Process Note`, `Medication & Side-Effect Log`, `Risk / Safety Assessment Log`, `Phone / Care Coordination Log`, or `Administrative / Billing Note`).
  2. **Strict HIPAA Privacy Isolation (45 C.F.R. § 164.501)**: Stored in a dedicated `provider_patient_notes` table in `goldenmind_db` and restricted strictly to Brenda's provider session—**clients can never view or access Brenda's private notes**.
  3. **1-Click Download & Export**: Brenda can download a single patient's logs (or all patient logs across the practice) at any time as:
     - **CSV Spreadsheet (`.csv`)** (opens directly in Excel / Google Sheets)
     - **Formatted Printable / Save-as-PDF Clinical Log Report**
     - **Complete Patient Chart & Log Text/JSON Dossier (`.txt` / `.json`)**

---

## 1. Overview & Healthcare Legal Compliance Framework

- **What It Does**:
  - Gives clients transparent, legally compliant psychiatric billing where they review exact CPT codes, insurance adjustments, and Good Faith Estimates before authorizing payment.
  - Gives Brenda a dedicated, private charting and logging notebook for each patient inside her Admin Portal with instant multi-format downloads for offline records, audits, or continuity of care.
- **Legal & Regulatory Guardrails Enforced**:
  1. **PCI-DSS Level 1 Financial Security**: Raw card numbers never touch or persist on your Ubuntu server. Your server creates a secure Stripe Checkout session or processes tokenized confirmation, storing only the transaction reference ID, payment method label, amount, and timestamps in `goldenmind_db`.
  2. **HIPAA Privacy Rule ("Minimum Necessary" Standard — 45 C.F.R. § 164.502(b))**: External card/bank statements are strictly sanitized to `"Golden Mind Psychiatry PLLC — Healthcare Statement #[ID]"` with **zero psychiatric diagnoses, ICD-10 codes, or clinical notes** exposed to banks.
  3. **HIPAA Private Psychotherapy & Clinician Notes Protection (45 C.F.R. § 164.501 & Texas Health & Safety Code Ch. 611)**: Brenda's separate patient notes and logs are segregated from the patient-facing portal data. The server's `/api/standalone/db/bootstrap` endpoint only returns `provider_patient_notes` when the requester is an authenticated provider (`beehobs@yahoo.com` / `info@goldenmindpsychiatry.org` / `brenda@goldenmindpsychiatry.org`).
  4. **Federal No Surprises Act (45 C.F.R. § 149.610) & Texas HB 300 Informed Financial Consent**: Every invoice and booking co-pay displays a Good Faith Estimate breakdown and requires an explicit E-Sign consent checkbox before payment, logging `financial_consent_at` in PostgreSQL.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Client Pre-Payment Review & Informed Consent Modal**:
     - Clicking **"Review & Pay Statement"** on a due invoice (or choosing to pay a co-pay/deposit at appointment booking) opens the **Itemized Statement & Good Faith Estimate Modal**.
     - Shows the **Service Description & CPT Code**, **Total Billed Fee**, **Insurance Adjustment**, **Net Patient Responsibility**, **No Surprises Act GFE Notice**, **Payment Method Selector** (`Card`, `HSA / FSA Medical Card`, `Apple Pay / Google Pay`), and the **Mandatory Financial Consent Checkbox**.
  2. **Printable Insurance Superbill & Official Receipt Modal**:
     - Any paid statement includes a **"View / Print Superbill & Receipt"** button showing Practice NPI/Details, Rendering Provider (`Brenda Hobyani, MSN, APRN, PMHNP-BC`), Telehealth Place of Service (`POS 02 / 10`), CPT Code, Fee Breakdown, Transaction ID, and Financial Consent Timestamp.
  3. **Provider Billing & Refund Console**:
     - Brenda can pick **CPT Code Presets** (`99205` Initial Eval, `99214` Med Management Follow-Up, `90833` Psychotherapy Add-On, `81418` PGx DNA Review, or custom) to auto-fill fees, and can **Adjust Balance**, **Mark Paid**, or **Issue Refund / Void** on existing invoices.
  4. **Brenda's Private Patient Notes & Downloadable Clinical Logs**:
     - Inside any patient's chart in Brenda's Provider Portal (and in the Provider Logs panel), Brenda has a **"Private Clinician Notes & Patient Activity Logs"** workspace.
     - **Add Note / Log Form**: Select Note Category (`SOAP / Session Note`, `Psychotherapy Process Note`, `Medication & Side-Effect Log`, `Safety / Risk Note`, `Phone / Care Coordination`, `Billing / Admin Log`), optional Session Date & CPT/ICD-10 reference, and rich clinical text notes.
     - **Chronological Patient Log Timeline**: Displays all notes recorded for that patient with timestamp, category, and edit/delete actions, plus an automatic audit trail of the patient's appointments, intakes, PHQ-9/GAD-7 scores, medications, and billing events.
     - **Download / Export Toolbar**:
       - **Download Patient Logs (`.csv` Spreadsheet)**
       - **Download Complete Patient Dossier & Notes (`.txt` Report)**
       - **Print / Save Official PDF Patient Log Summary**

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: High-trust institutional clinical ledger combining warm alabaster surfaces (`#FAF9F5`), crisp white statement sheets (`#FFFFFF`), deep obsidian headers (`#0A0A0A`), and metallic gold accents (`#D4AF37` / `#9E7206`).
  - **Typography & Tabular Discipline**: Headings in `Plus Jakarta Sans` / editorial serif, paired with strict `tabular-nums` alignment on all dollar amounts, CPT codes, dates, and timestamps.
  - **Zero-Pill Metadata**: Invoice and clinical note metadata renders as clean, unboxed inline text separated by `·` dividers and subtle 1px hairline borders.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode Stripe Checkout + Self-Contained Server Verification**
  - *Chosen Approach*: `POST /api/billing/create-checkout-session` natively uses `STRIPE_SECRET_KEY` via the Stripe REST API to create a PCI-compliant Stripe Checkout session supporting Cards, HSA/FSA, Apple Pay, and Google Pay, while also providing a built-in tokenized Card / HSA-FSA / Apple Pay checkout flow if `STRIPE_SECRET_KEY` is not yet configured in `.env`.
  - *Why*: 100% PCI-DSS compliance and immediate functionality on your Ubuntu server (`Goldd`).
- **Decision 2: Dedicated Provider-Only PostgreSQL Table (`provider_patient_notes`)**
  - *Chosen Approach*: Create a dedicated `provider_patient_notes` table in `goldenmind_db` (and `clinical_notes` collection in Firestore) strictly isolated from patient-facing endpoints.
  - *Why*: Guarantees HIPAA compliance for private clinician/psychotherapy notes while letting Brenda access, search, and download her notes from any device.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     1. CLIENT PORTAL & BOOKING FLOW                        │
│  ┌──────────────────────────────┐      ┌────────────────────────────────┐  │
│  │  Itemized Statement & GFE    │─────▶│  Printable Superbill & Receipt │  │
│  │  • CPT Code & Fee Breakdown  │      │  • POS 02/10 Telehealth Coding │  │
│  │  • No Surprises Act Notice   │      │  • Transaction ID & Consent Log│  │
│  │  • Financial Consent Check   │      │  • 1-Click Print / Save PDF    │  │
│  └──────────────┬───────────────┘      └───────────────▲────────────────┘  │
└─────────────────┼──────────────────────────────────────┼───────────────────┘
                  │                                      │
                  ▼                                      │
┌────────────────────────────────────────────────────────┴───────────────────┐
│                     UBUNTU EXPRESS SERVER (Goldd)                          │
│  • POST /api/billing/create-checkout-session (Stripe + HIPAA Safe)         │
│  • POST /api/billing/verify-payment (Marks Paid + Sends SMTP Receipt)      │
│  • POST /api/billing/refund-or-adjust (Provider Refund & Fee Adjustment)   │
│  • POST /api/provider/notes (Save / Update / Delete Brenda's Private Note) │
│  • GET  /api/provider/notes (Fetch All Private Patient Notes for Brenda)   │
└─────────────────┬──────────────────────────────────────┬───────────────────┘
                  │                                      │
                  ▼                                      ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────────┐
│  UBUNTU POSTGRESQL (goldenmind_db)  │  │  2. BRENDA'S ADMIN PORTAL         │
│  • Table: invoices (Extended)       │  │  • Per-Patient Private Notes      │
│    cpt_code, transaction_id,        │  │    (SOAP, Process, Meds, Risk)    │
│    financial_consent_at, refunds    │  │  • Combined Patient Activity Log  │
│  • Table: provider_patient_notes    │  │  • 1-Click Download (.CSV, .TXT,  │
│    id, patient_uid, patient_name,   │  │    .JSON, & Printable PDF Dossier)│
│    category, session_date, cpt_code,│  └───────────────────────────────────┘
│    note_body, author_email,         │
│    created_at, updated_at           │
└─────────────────────────────────────┘
```

### Data Model & PostgreSQL Schema Extensions (`goldenmind_db`)

1. **`invoices` Table Extensions**:
   - `cpt_code VARCHAR(64)`
   - `payment_method VARCHAR(128)`
   - `transaction_id VARCHAR(128)`
   - `financial_consent_at TIMESTAMPTZ`
   - `refunded_at TIMESTAMPTZ`
   - `refund_amount NUMERIC DEFAULT 0`
   - `refund_reason VARCHAR(500)`

2. **New `provider_patient_notes` Table (Brenda's Private Patient Notes & Logs)**:
   - `id VARCHAR(128) PRIMARY KEY`
   - `patient_uid VARCHAR(128) NOT NULL`
   - `patient_name VARCHAR(255) NOT NULL`
   - `patient_email VARCHAR(255)`
   - `category VARCHAR(64) NOT NULL` (`'SOAP / Session Note'`, `'Psychotherapy Process Note'`, `'Medication & Side-Effect Log'`, `'Risk / Safety Log'`, `'Care Coordination / Phone Log'`, `'Administrative / Billing Log'`)
   - `session_date VARCHAR(64)`
   - `cpt_code VARCHAR(64)`
   - `diagnosis_code VARCHAR(128)`
   - `title VARCHAR(255) NOT NULL`
   - `note_body TEXT NOT NULL`
   - `author_name VARCHAR(255) NOT NULL`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

### Interactive Component & State Mapping
1. **Client Pre-Payment Consent & Checkout Modal**: Validates the financial consent checkbox, records `financialConsentAcceptedAt`, initiates Stripe Checkout or tokenized card/HSA payment, and calls `POST /api/billing/verify-payment`.
2. **Printable Superbill & Receipt Modal**: Renders a formatted medical superbill with CPT codes, POS 02/10 telehealth indicators, and payment confirmation ID.
3. **Provider CPT Statement Creator & Refund Modal**: Allows Brenda to issue CPT-coded invoices, adjust patient responsibility, or log full/partial refunds with automated email receipts.
4. **Brenda's Private Patient Notes & Log Exporter**: Inside each patient's chart (and in the Provider Dashboard), Brenda can add/edit/delete private clinical notes, view the unified chronological log for that patient, and click **Download CSV**, **Download Dossier (.TXT)**, or **Print / Save PDF Log Report**.
5. **Server & Database Commands**: Automatic PostgreSQL migrations run on startup, and we will provide the exact `psql` command and `git pull && npm run build && pm2 restart all` command for your `Goldd` folder.
