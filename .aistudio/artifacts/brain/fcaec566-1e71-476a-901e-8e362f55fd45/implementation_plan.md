# Golden Mind Psychiatry PLLC — Production SEO, Sitemap, Brand Icons & Code Cleanup Plan

Deliver complete production-ready SEO, search indexing (`sitemap.xml` and `robots.txt`), official Golden Mind brand card browser/home-screen icons, `MedicalClinic` Schema.org structured data, dynamic per-page browser tab titles, and clean white-label application metadata free of generic or Google app boilerplate.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core preferences have been confirmed from your answers and are locked in for execution upon approval:

- **Confirmed Decision 1 — Canonical Production Domain**: `https://goldenmindpsychiatry.com` will be used across the XML sitemap, `robots.txt`, canonical link tags, OpenGraph metadata, and JSON-LD structured data.
- **Confirmed Decision 2 — Website Favicon & Home Screen Icon**: The official Golden Mind brand card graphic will be configured as the browser tab favicon, Apple Touch icon, social share preview card, and Web App Manifest icon.
- **Confirmed Decision 3 — Full SEO & White-Label Suite**: Includes `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `MedicalClinic` + `Physician` JSON-LD structured data, dynamic browser tab titles for every page and clinical condition, and removal of all generic/platform boilerplate strings (`react-example`, platform comments, or Google app references) from the codebase.

---

## 1. Overview & Core Concept

- **What It Does**: Prepares Golden Mind Psychiatry PLLC for search engine crawlers, social media link sharing, mobile home-screen bookmarking, and public inspection by adding standards-compliant XML sitemaps, crawler directives, rich medical structured data, branded favicons, and dynamic page titles.
- **Target Audience / Persona**: Prospective Texas telehealth patients searching Google for psychiatric care, referrals sharing links via iMessage/social platforms, and search engine crawlers indexing Golden Mind Psychiatry PLLC's pages and specialized condition treatments.
- **Key Value**: Ensures every page and clinical condition is discoverable by search engines, displays the Golden Mind brand card icon in browser tabs and mobile home screens, renders rich preview cards when shared, and presents 100% clean Golden Mind Psychiatry PLLC branding in HTML source code and metadata.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Browser Tab & Bookmark Experience**: When a patient visits any page or bookmarks the site on desktop or mobile, the browser tab immediately displays the Golden Mind brand card icon alongside a specific, dynamic title (e.g., `ADHD & Executive Function | Golden Mind Psychiatry PLLC`).
  2. **Search Engine & Social Sharing Experience**: Sharing `https://goldenmindpsychiatry.com` on iMessage, WhatsApp, Facebook, X, or LinkedIn displays the Golden Mind brand card graphic, practice slogan (*"Where Every Mind Is Golden."*), and clinical description by Brenda Hobyani, PMHNP-BC.
  3. **Search Crawler Indexing (`sitemap.xml` & `robots.txt`)**: Search engines visiting `/sitemap.xml` and `/robots.txt` discover all primary pages and all 11 specialized psychiatric condition routes with proper priority weights and update frequencies.
  4. **In-App Sitemap & Accessibility**: Users can also access a clean, navigable site directory link in the footer for effortless navigation across all clinical specialties.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Warm, authoritative luxury psychiatric care combined with high-trust clinical clarity.
  - *Color Palette & Mood*: Obsidian black (`#080808`) and warm alabaster (`#FDFBF7`) surfaces accented with radiant metallic gold (`#D4AF37`, `#B8860B`), matching the Golden Mind brand card graphic. Manifest theme color set to `#080808` with `#FDFBF7` background splash.
  - *Typography & Hierarchy*: `Cinzel` and `Playfair Display` for display headers, `Plus Jakarta Sans` for clinical body copy, and `General Sans` / `Satoshi` for the Client & Provider Portal.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Comprehensive XML Sitemap Covering Both Main Views & All 11 Clinical Specialties**
  - *Chosen Approach*: Provide a complete, standards-compliant `sitemap.xml` and `robots.txt` referencing `https://goldenmindpsychiatry.com` and indexing the home page, about page, clinical services, conditions directory, telehealth, insurance & fees, mental health resources, suicide prevention & crisis lifeline, contact page, client portal, and each individual condition detail page.
  - *Why*: Ensures search engines index both top-level practice pages and condition-specific landing pages (ADHD, Anxiety, Depression, Bipolar, PTSD, OCD, Insomnia, Women's Mental Health, Substance Abuse, Autism/IDD, and Pharmacogenomic Testing).
- **Decision 2: Dynamic Document Title & Meta Manager Synchronization**
  - *Chosen Approach*: Synchronize `document.title`, `<meta name="description">`, `<link rel="canonical">`, and OpenGraph tags dynamically whenever the user navigates between pages or selects a specific psychiatric condition.
  - *Why*: Gives every page and condition its own dedicated browser tab title and search metadata instead of a single static title across the entire site.
- **Decision 3: White-Label Code & Metadata Sanitization**
  - *Chosen Approach*: Replace generic package identifiers (`react-example`), development comments, and any platform boilerplate with clean `golden-mind-psychiatry` / `Golden Mind Psychiatry PLLC` identifiers across HTML, manifest, package metadata, and environment templates.
  - *Why*: Guarantees that viewing page source or inspecting metadata shows exclusively Golden Mind Psychiatry PLLC branding.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   Browser Head & Crawler Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │   sitemap.xml    │  │    robots.txt    │  │ manifest.webmanifest  │  │
│  │ (All Routes +    │  │ (Allow All +     │  │ (Golden Mind Brand    │  │
│  │  11 Conditions)  │  │  Sitemap Link)   │  │  Card Icons & Theme)  │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     HTML Head & Schema.org Layer                        │
│  • Favicon, Apple Touch Icon & OpenGraph Image -> Golden Mind Card      │
│  • Canonical URL -> https://goldenmindpsychiatry.com                    │
│  • JSON-LD Structured Data -> MedicalClinic + Psychiatric Provider      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Dynamic SEO & Route Synchronization                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Navigation State (Home, About, Services, Condition Detail, etc.)  │  │
│  └────────────────────────────────┬──────────────────────────────────┘  │
│                                   │                                     │
│                                   ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Dynamic Head Updater                                              │  │
│  │ • Updates document.title per active page / condition              │  │
│  │ • Updates meta description, og:title, og:description & canonical  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Static Crawler Assets**:
    - `sitemap.xml`: XML 0.9 schema listing canonical URLs under `https://goldenmindpsychiatry.com/`, `lastmod` timestamps, `changefreq`, and `priority` ratings (`1.0` for Home, `0.9` for Services/Conditions/Telehealth, `0.85` for each of the 11 specialized conditions, `0.8` for About/Insurance/Resources/Suicide Prevention/Contact/Portal).
    - `robots.txt`: Permits all search engine user-agents (`User-agent: *`, `Allow: /`) and points directly to `Sitemap: https://goldenmindpsychiatry.com/sitemap.xml`.
    - `manifest.webmanifest`: Configures `"name": "Golden Mind Psychiatry PLLC"`, `"short_name": "Golden Mind"`, `"theme_color": "#080808"`, `"background_color": "#FDFBF7"`, and icons referencing the Golden Mind brand card graphic.
  - **JSON-LD Structured Data (`MedicalClinic`)**:
    - Embeds complete Schema.org `MedicalClinic` and `MedicalBusiness` metadata in the document head, including provider `Brenda Hobyani, MSN, APRN, PMHNP-BC`, slogan `"Where Every Mind Is Golden."`, telephone `+1-432-934-3185`, email `info@goldenmindpsychiatry.org`, area served (`Texas`), opening hours (`Mon-Thu 08:00-16:00, Fri 09:00-13:00`), and medical specialty (`Psychiatric`).
- **Interactive Component & State Mapping**:
  - **Dynamic Head Synchronization**: On every navigation event (`currentPage` or `currentParam` change), a dedicated SEO effect computes the exact page title, description, and canonical URL for the active route or condition and updates `document.title` and `<head>` meta tags in real time.
  - **Footer Sitemap Link**: Adds a clean `XML Sitemap` link in the footer legal bar so visitors and crawlers can open `/sitemap.xml` directly.
