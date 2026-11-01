# Database Backup & Disaster Recovery Center, Login Account Lockout & Self-Hosted Server Architecture

This plan delivers a four-tier **Database Backup & Disaster Recovery Center**, **Brute-Force Account Lockout Protection** across all login endpoints, and a **Self-Hosted Database & Authentication Bridge** so Golden Mind Psychiatry PLLC never loses clinical records and can run seamlessly alongside or directly on your own server (`mailserver.businessidentity.llc`).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Phase 1 & Follow-Up Request**
> - **Confirmed Backup Destinations**:
>   1. **1-Click JSON & CSV Download** inside the Admin Portal (`Backups & Security` tab).
>   2. **Automated Server-Side Snapshot Files** stored on disk with rolling retention.
>   3. **Scheduled Encrypted/Structured Backup Emailed via Clinic SMTP** to `info@goldenmindpsychiatry.org` and `beehobs@yahoo.com`.
>   4. **Google Drive Cloud Backup Integration** (`drive.file` scope) to upload backup snapshots directly to your Google Drive.
> - **Confirmed Backup Cadence**: Automatic **daily scheduled backups** plus **automatic change-triggered snapshots** whenever major clinical or credential changes occur.
> - **Confirmed Restore Capabilities**:
>   1. **Full 1-Click Database Restore** from any server snapshot or uploaded backup `.json` file (with an automatic pre-restore safety snapshot before overwriting).
>   2. **Single-Patient Chart Restore** to selectively recover one patient's demographics, appointments, medications, intakes, PHQ-9/GAD-7 scales, messages, and invoices without touching other patients' records.
> - **Confirmed Login Security**: **Account Lockout Protection** enforced across all login endpoints (locking an account and/or IP after 5 consecutive failed password attempts for 15 minutes, sending an optional security alert email, and allowing the Admin to unlock any locked patient account in 1 click).
> - **Self-Hosted Server Database & Auth Architecture**: Built-in **Self-Hosted Server Sync & Export Kit** (PostgreSQL / SQLite schema + JWT/Session Authentication + Docker/Node setup guide) so your app can dual-write to or run 100% on the server you purchased.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Zero-Data-Loss Backup & Restore Center**: Continuously mirrors all 7 clinical collections (`users`, `appointments`, `intakes`, `assessments`, `medications`, `messages`, `invoices`) plus `account_directory` credentials into local server snapshots, downloadable JSON/CSV archives, clinic email attachments, and Google Drive.
  2. **Brute-Force Login Account Lockout**: Tracks failed sign-in attempts per email account and IP address across both client and server login verification endpoints, automatically locking accounts after 5 failed attempts for 15 minutes and providing a real-time countdown and Admin 1-Click Unlock control.
  3. **Own-Server Database & Auth Readiness**: Explains and provisions a dual-mode database and authentication layer so you can mirror every record to your own server (`mailserver.businessidentity.llc`) or switch to a self-hosted PostgreSQL/SQLite + Node.js JWT auth backend on your server at any time.
- **Target Audience / Persona**: Brenda Hobyani, PMHNP-BC and clinic administrators managing patient charts and security compliance in the Provider Clinical Command Center.
- **Key Value**: Eliminates single points of failure, prevents brute-force unauthorized access to patient accounts, and gives you complete ownership of your clinical data on your own server hardware.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Admin "Backups & Security" Command Tab**:
     - Accessible from both the left sidebar and top bar in the Admin Portal.
     - Displays backup health metrics in tabular numerals (`tabular-nums`): Last Snapshot Timestamp, Total Records Protected, Active Server Snapshots, and Locked Accounts Count.
     - **Action Bar**:
       - `Download Full JSON Backup` & `Download Patients CSV`
       - `Create Server Snapshot Now`
       - `Email Backup to Clinic Inbox` (`info@goldenmindpsychiatry.org`)
       - `Save Backup to Google Drive`
     - **Restore Panel**:
       - Upload a `.json` backup file or pick from the Server Snapshot History table.
       - Choose **"Full Database Restore"** (with mandatory confirmation modal + automatic pre-restore snapshot) or **"Single-Patient Selective Restore"** (pick a specific patient from the backup file and restore only their chart).
  2. **Login Account Lockout Flow**:
     - When a user enters an incorrect password, the login screen displays the remaining attempts (`4 attempts remaining before temporary 15-minute security lockout`).
     - On the 5th failed attempt within 15 minutes, the endpoint blocks sign-in for that account, displays a clear lockout banner with a live minute/second countdown and a `"Reset Password via Email to Unlock Immediately"` button, and logs the lockout in the Admin Security table where the provider can click **"Unlock Account"** in 1 click.
  3. **Self-Hosted Server Setup & Live Mirroring Panel**:
     - Inside the `Backups & Security` tab, a dedicated **"Self-Hosted Server Database & Auth Guide"** section provides:
       - A downloadable ready-to-run `golden-mind-selfhosted-schema.sql` (PostgreSQL / SQLite) + `.env` configuration template for your server.
       - An optional Webhook / Remote Server Sync URL setting to automatically push real-time encrypted backups to your server.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Luxury clinical SaaS console matching Golden Mind Psychiatry PLLC's established palette.
  - **Color Palette & Mood**:
    - 60% Neutral Canvas: Warm Alabaster (`#FAF9F5`)
    - 30% Structural Surfaces: Crisp White (`#FFFFFF`) cards with `1px solid #E7E5E4` hairline borders and Obsidian (`#0A0A0A`) primary command headers
    - 10% Accent Budget: Metallic Gold (`#D4AF37` / `#9E7206`), Semantic Emerald (`#16A34A`) for verified backups, Amber (`#D97706`) for remaining login attempts, and Crimson (`#DC2626`) for active account lockouts.
  - **Typography & Hierarchy**: `Plus Jakarta Sans` for headings and navigation, `DM Sans` / `Plus Jakarta Sans` for clinical prose, and `JetBrains Mono` (`tabular-nums`) for snapshot sizes, record counts, lockout countdown timers, and timestamps.

---

## 3. How Setting Up Your Own Database & Authentication on Your Server Works

If you decide to host your own database on the same server you purchased (`mailserver.businessidentity.llc` or your VPS), here is exactly how we help you set it up and how authentication and clinical data work:

### A. Database Setup on Your Server
1. **Database Engine (PostgreSQL or SQLite on Your VPS)**:
   - Your server can run **PostgreSQL** (recommended for multi-user concurrency) or **SQLite** (single-file zero-configuration database stored directly on your server disk).
   - We generate and provide the complete **SQL Schema (`golden-mind-schema.sql`)** and **1-Click Migration Importer** that takes your JSON backup from this portal and populates all 8 tables (`users`, `account_credentials`, `login_lockouts`, `appointments`, `intakes`, `assessments`, `medications`, `messages`, `invoices`) on your server with zero data loss.
2. **Dual-Write / Live Mirroring (Hybrid Mode or Full Cutover)**:
   - **Option 1 — Hybrid Cloud + Your Server (Recommended)**: Keep Cloud Firestore active for instant real-time browser updates while our Express backend (`server.ts`) automatically mirrors every backup snapshot and credential change to your server disk and clinic SMTP email.
   - **Option 2 — 100% Self-Hosted on Your Server**: Point the app's `/api/db/*` endpoints directly to PostgreSQL/SQLite on your VPS so 100% of data stays on your own server hardware.

### B. How Authentication & Security Work on Your Own Server
1. **Password Hashing & Storage**:
   - Passwords are salted and hashed (SHA-256 / Scrypt / Bcrypt) in the `account_credentials` table on your server—plain-text passwords are never stored.
2. **Session Tokens (HTTP-Only Signed JWT Cookies + Bearer Tokens)**:
   - When a patient or admin logs in via `/api/auth/login`, your server checks the **Account Lockout table** first, verifies the password hash, and issues a cryptographically signed **JWT session token** (using your `RESET_HMAC_SECRET`).
3. **Email Verification & Password Reset via Your Own SMTP**:
   - Because your server already runs `mailserver.businessidentity.llc` (`info@goldenmindpsychiatry.org`), password reset links and email verification links are signed and verified 100% by your own server without depending on any third-party email service.
4. **Role-Based Access Control (RBAC)**:
   - Your server middleware verifies the signed token on every request: patients can only read/write rows matching their own `uid`, while authorized provider emails (`info@goldenmindpsychiatry.org`, `beehobs@yahoo.com`, `chibundusadiq@gmail.com`) have full Admin Portal privileges.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   CLIENT PORTAL & ADMIN COMMAND CENTER                     │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │ Patient & Provider Login UI  │    │ Admin "Backups & Security" Tab   │  │
│  │ • Pre-login lockout check    │    │ • 1-Click JSON & CSV Export      │  │
│  │ • Remaining attempts warning │    │ • Server Snapshot Manager        │  │
│  │ • Live 15-min lockout timer  │    │ • Full & Single-Patient Restore  │  │
│  │ • 1-Click Email Reset unlock │    │ • Google Drive Backup Upload     │  │
│  └──────────────┬───────────────┘    │ • Locked Accounts Unlock Table   │  │
│                 │                    │ • Self-Hosted SQL Schema Export  │  │
└─────────────────┼────────────────────┴─────────────────┬────────────────┘  │
                  │                                      │
                  ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND SERVER (server.ts)                     │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │ Account Lockout Engine         │  │ Multi-Destination Backup Engine  │  │
│  │ • POST /api/auth/check-lockout │  │ • Auto daily + on-change backups │  │
│  │ • POST /api/auth/record-attempt│  │ • /backups/snapshot-*.json store │  │
│  │ • POST /api/auth/admin-unlock  │  │ • POST /api/backup/email-clinic  │  │
│  │ • Locks 15m after 5 failures   │  │ • GET /api/backup/sql-schema     │  │
│  └──────────────┬─────────────────┘  └─────────────────┬────────────────┘  │
└─────────────────┼──────────────────────────────────────┼───────────────────┘
                  │                                      │
                  ▼                                      ▼
┌───────────────────────────────────┐  ┌─────────────────────────────────────┐
│   FIRESTORE & CREDENTIALS STORE   │  │   EXTERNAL BACKUP DESTINATIONS      │
│ • Cloud Firestore (7 collections) │  │ • Local Disk (/backups/*.json)      │
│ • /account_directory/{emailHash}  │  │ • Clinic SMTP (info@ & beehobs@)    │
│ • portal-credentials.db.json      │  │ • Google Drive (drive.file API)     │
└───────────────────────────────────┘  └─────────────────────────────────────┘
```

### Key Interactive Component & Endpoint Mapping
1. **Brute-Force Account Lockout Endpoints & State**:
   - `POST /api/auth/check-lockout`: Checks if an email or IP is currently locked out; returns `{ locked, remainingMs, failedAttempts, maxAttempts: 5 }`.
   - `POST /api/auth/record-attempt`: Records `{ email, success }`. On `success: true`, resets `failedAttempts` to `0`. On `success: false`, increments `failedAttempts`; when reaching `5`, sets `lockedUntil = Date.now() + 15 * 60 * 1000` (15 minutes), persists to `portal-credentials.db.json`, and emails a security notice if locked.
   - `GET /api/auth/locked-accounts` & `POST /api/auth/admin-unlock`: Lets the Admin view all currently locked accounts and unlock any patient in 1 click.
   - **Successful Password Reset Auto-Unlock**: Completing a password reset via email automatically clears any active lockout for that email address.
2. **Automated & On-Demand Backup Engine**:
   - `POST /api/backup/create-snapshot`: Saves a complete timestamped backup snapshot (`users`, `appointments`, `intakes`, `assessments`, `medications`, `messages`, `invoices`, and `account_directory`) to `/backups/gmp-backup-<timestamp>.json` (retaining the latest 30 snapshots) and updates `/backups/latest-backup.json`.
   - **Automatic Daily + Event-Triggered Backups**: Runs a background daily scheduler on the server and automatically syncs whenever the Admin opens the portal or triggers clinical changes.
   - `POST /api/backup/send-email`: Sends the complete JSON + summary report as an email attachment to `info@goldenmindpsychiatry.org` and `beehobs@yahoo.com` via `mailserver.businessidentity.llc`.
   - **Google Drive Cloud Backup**: Uses the Google Drive API (`https://www.googleapis.com/auth/drive.file`) to upload `golden-mind-backup-YYYY-MM-DD.json` directly to the admin's Google Drive with a confirmation banner.
3. **Full & Single-Patient Restore Engine**:
   - **Pre-Restore Safety Snapshot**: Before any restore runs, the system automatically creates a safety snapshot so no data can ever be accidentally lost.
   - **Full Database Restore**: Writes all collections and credentials from the selected snapshot or uploaded `.json` file back into Cloud Firestore and the server credentials store.
   - **Single-Patient Chart Restore**: Lets the Admin select a single patient from inside any backup snapshot and restores *only* that patient's `users/{uid}` document and their associated `appointments`, `medications`, `intakes`, `assessments`, `messages`, and `invoices`.
