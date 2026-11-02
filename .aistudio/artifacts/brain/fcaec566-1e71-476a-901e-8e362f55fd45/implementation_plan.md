# Enterprise HIPAA & Infrastructure Security Hardening Plan

This plan delivers comprehensive, defense-in-depth security across the Golden Mind Psychiatry web application, PostgreSQL database, and Ubuntu production server to prevent API leaks, SQL injection, automated penetration scanning, brute-force attacks, database discovery, and technology stack fingerprinting.

## User Review & Critical Decisions

> [!IMPORTANT]
> All 12 security measures you selected in Phase 1 are incorporated into this plan and organized into three coordinated layers: **Application API & Payload Firewall**, **Technology Obfuscation & Scanner Traps**, and **Ubuntu Server Hardening & Live Intrusion Monitoring**.

- **Confirmed Decision 1 (API & Database Guards)**: Enforce strict JWT and admin-role verification on all sensitive database, backup, and account-management endpoints; add per-IP rate limiting with automatic temporary IP banning; inspect incoming requests with a SQL/XSS payload firewall; and mask all internal stack traces and database errors from public API responses.
- **Confirmed Decision 2 (Anti-Fingerprinting & Scanner Blocking)**: Strip server/framework headers (`Server`, `X-Powered-By`, `Via`), block automated vulnerability scanners probing `.php`, `wp-admin`, `.env`, `.git`, `phpmyadmin`, or `actuator` paths, enforce strict CORS limited to `goldenmindpsychiatry.org`, and apply hardened Content-Security-Policy (CSP), HSTS, and anti-framing headers.
- **Confirmed Decision 3 (Ubuntu Infrastructure & Live Audit Log)**: Bind PostgreSQL strictly to `127.0.0.1` (`localhost`), lock down external ports via UFW (`22`, `80`, `443` only), configure Fail2Ban for SSH and Nginx, send real-time security email alerts to Brenda (`beehobs@yahoo.com` & `info@goldenmindpsychiatry.org`) when attacks or lockouts occur, and add a live **Security & Intrusion Audit Log** inside Brenda's Provider Command Center.

---

## 1. Overview & Core Concept

- **What It Does**: Protects patient clinical data (PHI) and practice infrastructure with zero-trust API authorization, an active Web Application Firewall (WAF) middleware layer, automated scanner honeypots, technology-stack masking, and real-time intrusion auditing.
- **Target Audience / Persona**: **Brenda Hobyani, MSN, APRN, PMHNP-BC** (Practice Owner & Clinical Director) managing the practice from the Provider Command Center, and patients accessing the HIPAA-encrypted Client Portal.
- **Key Value**: Eliminates unauthorized API data exposure, stops credential stuffing and vulnerability scanners before they reach database routes, hides the underlying server/database architecture from reconnaissance tools, and gives the provider full visibility and 1-click IP unban controls.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Transparent Protection for Legitimate Patients**: Real patients signing in, verifying emails, and booking telehealth visits experience zero friction while malformed payloads, cross-origin scripts, and brute-force bots are silently blocked at the edge.
  2. **Automated Scanner & Brute-Force Blocking**: Any IP address probing exploit paths (e.g., `/wp-admin`, `/.env`, `/phpmyadmin`, `/config.php`) or exceeding API/login rate thresholds is immediately blocked with a generic `403 Forbidden` or `429 Too Many Requests` JSON response (zero stack trace or server version disclosure), logged in the intrusion table, and triggers a security alert email to Brenda.
  3. **Live Security & Intrusion Audit Panel (Provider Command Center)**: Inside Brenda's **Database & Backups / Security** workspace, a dedicated high-density security console displays blocked intrusion attempts, banned IPs, locked accounts, active firewall rules, and a 1-click **"Copy Ubuntu Hardening Script (UFW + Fail2Ban + Nginx + PostgreSQL)"** utility.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Luxury clinical sanctuary and high-density enterprise command center matching Golden Mind Psychiatry's warm alabaster (`#FAF9F5`), obsidian (`#0A0A0A`), and champagne gold (`#D4AF37` / `#9E7206`) palette.
  - *Typography & Hierarchy*: Crisp display headings paired with `tabular-nums` monospace (`font-mono`) for IP addresses, timestamps, HTTP status codes, and rate-limit counters.
  - *Zero-Pill & Single-Elevation Discipline*: Flat 1px bordered panels (`border-stone-200`), unboxed inline metadata separated by `·`, and clear semantic status indicators (emerald for active shields, amber for rate-limit warnings, crimson for blocked intrusion events).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Zero-Trust Bearer Token & Role Authorization on Sensitive Endpoints**
  - *Chosen Approach*: Require a valid signed JWT (`Authorization: Bearer <token>`) or verified admin session on all `/api/backup/*`, `/api/standalone/db/*`, and admin management routes; scope patient bootstrap queries strictly to the authenticated user's UID.
  - *Why*: Prevents attackers from calling `/api/backup/download`, `/api/standalone/db/bootstrap`, or `/api/standalone/db/clean-test-data` directly via `curl` or Postman to leak or wipe database records.
- **Decision 2: In-Memory + PostgreSQL Persistent WAF & IP Rate Limiter**
  - *Chosen Approach*: Combine fast in-memory sliding-window rate counters (120 general API requests/min per IP; 10 auth requests/min per IP; immediate 30-minute IP ban on exploit-path probing or SQLi/XSS payload detection) with persistent logging in PostgreSQL (`security_events` table).
  - *Why*: Rejects abusive traffic in sub-millisecond memory checks without overloading PostgreSQL during a flood, while keeping an auditable forensic log for Brenda.
- **Decision 3: Complete Technology Stack Obfuscation & Generic Error Envelopes**
  - *Chosen Approach*: Strip `X-Powered-By`, override `Server` headers, block `.map` source maps and dotfiles, and wrap all Express routes in a global error boundary that logs internal details server-side while returning only a sanitized `{ ok: false, error: "Request could not be processed." }` payload to the client.
  - *Why*: Reconnaissance tools (Wappalyzer, Nmap, Burp Suite, SQLMap) rely on verbose error messages and response headers to identify Express, Node.js, or PostgreSQL versions.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Defense-in-Depth Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Incoming HTTPS Request (Port 443)                        │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Ubuntu OS & Nginx Reverse Proxy                                   │
│ • UFW Firewall: Only Ports 22, 80, 443 open (Port 5432 PostgreSQL closed)  │
│ • Fail2Ban: Bans SSH & Nginx 4xx/scanner IPs at kernel iptables level      │
│ • Nginx `server_tokens off;` + HSTS + TLS 1.2/1.3                          │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Express WAF, Anti-Fingerprinting & Scanner Trap Middleware        │
│ • Strips X-Powered-By / Server headers; enforces strict CORS & CSP         │
│ • Honeypot Scanner Trap: Instant IP ban on .php, wp-admin, .env, .git      │
│ • Sliding-Window Rate Limiter: 120 req/min general, 10 req/min auth        │
│ • SQLi / XSS / Path-Traversal Deep Payload Inspector                       │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Zero-Trust API Authentication & Role Guard                        │
│ • Verifies HMAC-SHA256 JWT / Admin identity on /api/backup/* & /api/db/*   │
│ • Enforces tenant isolation (patients can only read/write their own UID)   │
│ • Parameterized SQL ($1, $2) + Sanitized Error Boundary (zero stack leaks) │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Live Security Audit Log & Provider Alerting                       │
│ • Persists blocked events to PostgreSQL `security_events` + disk           │
│ • Dispatches throttled SMTP security alert emails to Brenda on attacks     │
│ • Streams live blocked IPs & 1-click Unban controls to Provider Portal     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`security_events` Table (PostgreSQL & In-Memory Ring Buffer)**:
  - Stores `id`, `ip_address`, `event_type` (`scanner_probe`, `sqli_xss_blocked`, `rate_limit_exceeded`, `brute_force_lockout`, `unauthorized_api_access`), `path`, `method`, `reason`, `blocked_until`, and `created_at`.
- **`bannedIps` Map**:
  - Tracks banned IP addresses, expiration timestamps, ban reasons, and hit counts, with 1-click unban capability from Brenda's Provider Dashboard.

### Interactive Component & State Mapping

- **Provider Security & Intrusion Console (`ProviderDashboardView`)**:
  - Displays real-time counters (`tabular-nums`) for Blocked Scanner Probes, Banned IPs, Locked Accounts, and Active WAF Rules.
  - Provides interactive **Unban IP**, **Clear Security Log**, **Trigger Test Security Alert**, and **Copy One-Line Ubuntu Server Hardening Command (UFW + Fail2Ban + PostgreSQL Localhost Lock + Nginx Stealth)** buttons with instant feedback banners.
