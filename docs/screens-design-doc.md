# ContractIQ — Screen-by-Screen Design Document

> **Companion to `design-brief.md`.** That document covers the design system (colors, typography, spacing, component atoms). This document covers every screen, every state, every interaction, and every transition in the application. No code is written until this is reviewed.

---

## TABLE OF CONTENTS

1. [Information Architecture](#1-information-architecture)
2. [Auth Pages](#2-auth-pages)
3. [Navigation Architecture](#3-navigation-architecture)
4. [Dashboard / Home](#4-dashboard--home)
5. [Document Library](#5-document-library)
6. [Document Upload Flow](#6-document-upload-flow)
7. [Document Viewer](#7-document-viewer)
8. [Playbook Editor](#8-playbook-editor)
9. [Portfolio Search](#9-portfolio-search)
10. [Export](#10-export)
11. [Settings](#11-settings)
12. [Skeleton Loading System](#12-skeleton-loading-system)
13. [Mobile Strategy](#13-mobile-strategy)
14. [Micro-interaction Catalogue](#14-micro-interaction-catalogue)

---

## 1. INFORMATION ARCHITECTURE

### Route Structure

```
/                        → Landing page (public)
/login                   → Login
/register                → Register
/app                     → Redirect → /app/dashboard
/app/dashboard           → Home / recent activity
/app/documents           → Document library (list)
/app/documents/[id]      → Document viewer
/app/documents/upload    → Upload flow (multi-step)
/app/search              → Portfolio-wide search
/app/playbooks           → Playbook list
/app/playbooks/[type]    → Playbook editor
/app/settings            → Settings (tabbed)
/app/settings/profile    → Profile sub-tab
/app/settings/workspace  → Workspace sub-tab
/app/settings/billing    → Billing sub-tab (placeholder)
```

### Auth Guard

All `/app/*` routes require a valid JWT in `localStorage`. The auth boundary is a Next.js middleware that redirects unauthenticated users to `/login?next=[route]`. After login the user is redirected to their original destination, not forced to the dashboard.

### Layout Slots

The app shell has two slots:
- `sidebar` — persistent left panel (260px wide, collapsible to 52px icon rail)
- `main` — scrollable content area, fills remaining width

The landing page and auth pages use a separate, no-sidebar layout.

---

## 2. AUTH PAGES

### Design Philosophy

Auth pages are the first impression of the product to a skeptical buyer. They must feel like a serious B2B SaaS product, not a side project. No gradient meshes here. Restraint is the message.

### 2.1 — Login Page (`/login`)

**Layout:** Full viewport. Two columns on desktop (≥1024px). Left column 55%, right column 45% with a panel. Single column on mobile.

**Left column:**
- Top-left: ContractIQ logotype (text mark + icon). Same as nav. Clicking takes to `/`.
- Vertically centered card (max-width 400px, centered in the column):
  - Eyebrow: `WELCOME BACK` — `font-size: 10px`, `letter-spacing: 0.15em`, `color: var(--text-muted)`, ALL CAPS. No icon.
  - Headline: `Sign in to ContractIQ` — Instrument Serif, 28px, `color: var(--text-primary)`
  - Subtext: `Your contracts, analyzed.` — Inter, 14px, `color: var(--text-secondary)`. One line only.
  - Form fields (see component spec below)
  - Primary button: `Continue` — full width
  - Divider: `─── or ───` (actually: two 1px lines with text in between, `color: var(--border-subtle)`)
  - Google OAuth button: outlined style, Google logo (actual SVG not icon lib), `Sign in with Google`
  - Footer: `Don't have an account? Register →` — 13px, link in `var(--accent-gold)`

**Right column — product context panel:**
- Background: `var(--surface-elevated)`, full height
- Top: a real contract excerpt (NDA clause) with ContractIQ risk annotations visible
  - This is a static image/component showing what they're signing up for
  - Rendered as a mini version of the document viewer panel
  - Shows: one clause highlighted in amber, risk badge `MEDIUM`, one short analysis note
- Bottom: one social proof line. `"Reviewed 3,000+ contracts."` — no author, no headshot, no fake quote marks. Just a fact.

**Form Field Spec:**
- Label: 12px Inter, `color: var(--text-secondary)`, `margin-bottom: 6px`
- Input: `height: 40px`, `border-radius: 6px`, `border: 1px solid var(--border-default)`, `background: var(--surface-base)`, `padding: 0 12px`, `font-size: 14px`
- Focus: border transitions to `var(--accent-gold)` at 60% opacity, no box-shadow ring (rings are a Bootstrap tell)
- Error state: border becomes `var(--semantic-error)`, error message appears below in 12px red, with a left-border `2px solid var(--semantic-error)` on the field (not a toast)
- Password field: has a show/hide toggle icon (Phosphor `Eye`/`EyeSlash`) at `right: 12px`

**States:**
- Default: form fields empty, button disabled until email + password filled
- Loading: button shows spinner (14px), label disappears. Inputs become `pointer-events: none`. No skeleton — just spinner in CTA.
- Error — invalid credentials: inline field error on password field only. Never expose which field was wrong for security. Text: `"Invalid email or password."`
- Error — rate limited: a toast at top (`You've made too many attempts. Try again in 15 minutes.`)
- Success: brief fade-out of the form, redirect.

---

### 2.2 — Register Page (`/register`)

Same two-column layout as login. Right column shows same product context panel (consistent across all auth pages).

**Form fields:**
1. Full name
2. Work email (hint text: `you@company.com`)
3. Password (with strength indicator — see below)

**Password strength indicator:**
- A row of 4 segments below the password field, each `height: 3px`, `border-radius: 2px`
- Segments fill left-to-right with color based on zxcvbn score:
  - 0-1: 1 segment, `var(--semantic-error)`
  - 2: 2 segments, `var(--semantic-warning)`
  - 3: 3 segments, `var(--accent-gold)` at 70%
  - 4: all 4 segments, `var(--semantic-success)`
- No label text like "Weak" or "Strong" — the color communicates enough
- Transition: `width` and `background-color` animate at 200ms

**CTA:** `Create account`

**Legal note below button:** `By continuing, you agree to the Terms of Service and Privacy Policy.` — 11px, `color: var(--text-muted)`. Links are underlined on hover only.

**States:**
- Default form states same as login
- Error — email already registered: inline error on email field. `"This email is already in use. Sign in?"` with `Sign in` as a link.
- Success: small confetti burst (3 particles, restrained), then redirect to `/app/dashboard` with `?onboarding=true` query param to trigger onboarding modal.

---

### 2.3 — Forgot Password (`/forgot-password`)

Single column, centered card. No right panel.

- Back arrow link to `/login`
- Headline: `Reset your password`
- Body: `Enter your email and we'll send a reset link.`
- Single email field
- Button: `Send reset link`
- Success state: The card transitions to a confirmation state (same card, content swaps via AnimatePresence): `Check your email` headline, envelope icon (Phosphor `EnvelopeOpen`, 32px, `color: var(--accent-gold)`), `We sent a link to [email]. It expires in 15 minutes.`

---

## 3. NAVIGATION ARCHITECTURE

### 3.1 — Sidebar Spec

**Dimensions:**
- Expanded: `260px` wide, full height, `position: sticky; top: 0`
- Collapsed (icon rail): `52px` wide
- Transition: `width 200ms cubic-bezier(0.4, 0, 0.2, 1)` — not a slide, a smooth width change. Content inside fades (labels) with a separate opacity transition.

**Structure (top to bottom):**
```
┌────────────────────────────┐
│  [Logo]  ContractIQ    [≡] │  ← header, toggle button
├────────────────────────────┤
│  [⊞] Dashboard             │
│  [☰] Documents             │
│  [⌕] Search                │
├────────────────────────────┤
│  PLAYBOOKS          [+]    │  ← section header with inline add button
│  [📄] NDA                  │
│  [📄] SaaS Agreement       │
│  [📄] Employment           │
│  [📄] ...                  │
├────────────────────────────┤
│                            │  ← flex-grow spacer
│  [⚙] Settings              │  ← pinned to bottom
│  [avatar] John D.          │
└────────────────────────────┘
```

**Nav item spec:**
- Height: `36px`
- Padding: `0 12px`
- `border-radius: 6px`
- Icon: Phosphor icon, 16px, `color: var(--text-muted)`
- Label: Inter 14px, `color: var(--text-secondary)`
- Active state: `background: rgba(200, 169, 110, 0.1)`, icon and label become `color: var(--text-primary)`, left border `2px solid var(--accent-gold)` (using `box-shadow: inset 2px 0 0 var(--accent-gold)` to avoid layout shift)
- Hover: `background: var(--surface-elevated)`, label becomes `var(--text-primary)` — 120ms transition
- Collapsed: label fades out (opacity 0), icon stays. Tooltip on hover showing label (not a title attribute — a real tooltip component, positioned right of the icon).

**Section header ("PLAYBOOKS"):**
- `font-size: 10px`, `letter-spacing: 0.1em`, ALL CAPS, `color: var(--text-muted)`
- `padding: 16px 12px 6px`
- The `[+]` button is Phosphor `Plus`, 14px, appears on section header hover only (`opacity: 0` → `1` at 150ms). Clicking opens the contract type picker inline or navigates to upload.

**Playbook items:**
- Scrollable if more than ~8 items
- Show max 8 without scroll, then `overflow-y: auto` with custom scrollbar (`width: 4px`, `background: var(--surface-elevated)`, thumb `var(--border-subtle)`)

**User block (bottom):**
- Avatar: 28px circle with initials if no profile photo. Background: deterministic color from name hash (a set of 6 muted palettes — no random neons)
- Name: 13px, truncated with `text-overflow: ellipsis`, max 120px
- Clicking opens a small dropdown: `Account settings`, `Sign out` — `border-radius: 8px`, `border: 1px solid var(--border-subtle)`, `background: var(--surface-elevated)`, `box-shadow: 0 8px 24px rgba(0,0,0,0.4)`

**Mobile sidebar:** A drawer that slides in from the left. Overlay behind it: `rgba(0,0,0,0.6)`, backdrop-filter blur(4px). Triggered by hamburger in mobile top bar. Closes on overlay click or swipe left.

---

### 3.2 — Top Bar (inside app, above main content)

Height: `52px`. Appears only on mobile (the sidebar handles breadcrumbs on desktop via title in the main content area).

On desktop there's no top bar — the main content area has a `<PageHeader>` component at the top with:
- Page title (h1, 20px Instrument Serif)
- Optional subtitle (14px Inter, `var(--text-secondary)`)
- Right slot for actions (buttons, filters)

---

## 4. DASHBOARD / HOME

### Philosophy

The dashboard is a "command center" — recent work, quick actions, and a heartbeat of what's happening. It should answer: "where was I?" and "what do I do next?" without reading anything.

### 4.1 — Empty State (first login / no documents)

The empty state is not a generic "No data yet" sad-folder icon. It's an invitation.

**Layout:**
- Full viewport minus sidebar
- Vertically centered in the content area (flexbox column, center)

**Content:**
```
[Phosphor FileText icon — 48px — var(--accent-gold) — opacity 60%]

Upload your first contract

Paste or drop any PDF — NDA, SaaS agreement, employment contract.
ContractIQ extracts every clause, flags every risk, and lets you ask questions.

[Primary CTA: Upload a contract →]
[Secondary: or, drop a file anywhere]
```

- The secondary hint triggers the global drop zone (described in §6)
- A subtle animated dashed border around the entire empty state box pulses once on page load (amplitude 1px, duration 2s, then stops — it's a "hint" not a permanent distraction)

### 4.2 — Populated State

**Grid of sections:**

**Section 1 — Recent Documents (full width row)**
Headline: `Recent` (16px Inter, `var(--text-secondary)`)
3-4 document cards in a horizontal row. Each card:
- Width: `calc(25% - 12px)` on desktop, 2-col on tablet
- Height: ~140px
- `background: var(--surface-elevated)`, `border-radius: 10px`, `border: 1px solid var(--border-subtle)`
- Top: filename truncated (14px, semibold)
- Middle: contract type badge (pill: `background: rgba(200,169,110,0.12)`, `color: var(--accent-gold)`, `font-size: 11px`, `font-weight: 500`) + status badge (READY = green dot + "Analyzed", PROCESSING = amber spinner + "Analyzing...", FAILED = red dot + "Failed")
- Bottom: date (`12px`, `var(--text-muted)`) + a mini risk summary: three colored dots representing clause risk distribution (e.g., 2 red, 5 amber, 12 green — no label, just dots)
- Hover: `border-color: var(--border-default)` + `box-shadow: 0 4px 16px rgba(0,0,0,0.3)` at 150ms
- Clicking navigates to the document viewer

**Section 2 — Activity Feed (left, 60%)**
Headline: `Activity`
A vertical list of timestamped events:
- `[doc-icon] NDA with Acme Corp analyzed` · `2 minutes ago`
- `[search-icon] Portfolio search: "termination clause"` · `1 hour ago`
- `[upload-icon] Employment Agreement uploaded` · `Yesterday`

Each item: `height: 44px`, icon `var(--text-muted)`, event text `var(--text-secondary)`, timestamp `var(--text-muted)` right-aligned. Hover: subtle background.

**Section 3 — Quick Actions (right, 40%)**
Three action tiles:
1. `Upload contract` (Phosphor Upload, accent gold)
2. `Search portfolio` (Phosphor MagnifyingGlass)
3. `Edit playbook` (Phosphor BookOpen)

Each: `height: 72px`, horizontal layout (icon left, text right), `background: var(--surface-elevated)`, rounded, hover border lights up.

### 4.3 — Skeleton State

When the dashboard is loading (initial hydration):
- Recent document cards: 4 skeleton cards with pulsing rectangles at exact positions of real content
- Activity feed: 5 skeleton rows
- Quick actions: 3 skeleton tiles

See §12 for the full skeleton system spec.

---

## 5. DOCUMENT LIBRARY

### 5.1 — Page Structure

**PageHeader:**
- Title: `Documents`
- Right slot: `[Upload] [Filter ▾] [Grid|List toggle]`

**Toolbar below header:**
- Search bar (inline, 280px max, `placeholder: "Search documents..."`)
- Filter chips: `All` `NDA` `SaaS Agreement` `Employment` `Other` — pills, single select, active chip has `background: rgba(200,169,110,0.12)`, `color: var(--accent-gold)`, `border: 1px solid rgba(200,169,110,0.3)`
- Sort dropdown: `Newest first` / `Oldest first` / `Name A–Z` / `Risk: High first`

### 5.2 — List View (default)

A table-like layout but built with `div` rows, not `<table>`, to allow animations.

**Row structure:**
```
[type-icon] [filename (160px)] [contract-type badge] [status badge] [risk dots] [date] [···]
```

- Row height: `52px`
- Hover: `background: var(--surface-elevated)`, entire row highlights
- Status badge specs:
  - PROCESSING: amber `•` (animated pulse) + `Analyzing` in amber text
  - READY: green `•` + `Analyzed`
  - FAILED: red `•` + `Failed`
- Risk dots: 3 circles (3px) in a row — red / amber / green — representing proportions of CRITICAL/HIGH, MEDIUM, LOW clauses. A tooltip on hover shows exact counts.
- `···` menu (Phosphor `DotsThreeOutline`): appears on row hover. Dropdown: `View`, `Download PDF`, `Delete`. Delete triggers a confirmation (inline, not a modal — see §14).

**Pagination:** `← Previous` | `1 2 3 4 … 12` | `Next →` — or virtual scroll if count < 100.

### 5.3 — Grid View

3 columns on desktop, 2 on tablet. Each card same as dashboard recent cards but with full info.

### 5.4 — Empty state (filtered to empty)

`No documents match "[filter]". [Clear filters]` — 14px, centered in the list area. No icon.

### 5.5 — Skeleton Loading

On initial load and on filter change: list rows become animated skeletons. See §12.

---

## 6. DOCUMENT UPLOAD FLOW

### Philosophy

Upload is a moment of vulnerability. The user is handing over a sensitive document. The flow must feel: fast, private, and capable. It should not feel like a form.

### 6.1 — Global Drop Zone

Any page in the app (except the document viewer) accepts a file drop. When a PDF is dragged over the window:

1. A full-viewport overlay appears: `background: rgba(12, 12, 14, 0.8)`, `backdrop-filter: blur(8px)`, fade-in 150ms
2. Center of overlay: a dashed border box (2px dashed `var(--accent-gold)`, `border-radius: 16px`, `width: 480px`, `height: 240px`), with `Phosphor FilePdf` at 48px + `Drop to analyze` text
3. The dashed border has a breathing animation (box-shadow pulse) to confirm the drag is recognized
4. On drop: overlay fades out, Upload Modal opens (§6.2)
5. On drag leave (cursor exits window): overlay fades out

### 6.2 — Upload Modal (Step 1: File selection + metadata)

A centered modal: `width: 560px`, `border-radius: 14px`, `background: var(--surface-elevated)`, `border: 1px solid var(--border-subtle)`

**Header:** `Analyze a contract` · `[X close]`

**Drop zone inside modal (if no file yet):**
```
[FilePdf icon 32px]
Drop your PDF here
or browse files
11px hint: "PDF only · max 50MB"
```
Clicking opens the native file picker.

**File accepted state (file is selected):**
The drop zone collapses and is replaced with a file preview row:
```
[FilePdf icon — amber] [filename.pdf] [filesize] [× remove]
```
Transition: `height` from dropzone size → 48px, 200ms ease-out.

**Metadata fields (appear after file is accepted, stagger-in 50ms apart):**

Field 1: `Contract type`
- Select / pill group:
  - `NDA` `SaaS Agreement` `Employment` `MSA` `SOW` `Other`
  - Pills: toggle selection. Active: `background: rgba(200,169,110,0.15)`, amber border
  - "Other" expands a text input below for custom type

Field 2: `Your role in this contract`
- Two pill options: `We are providing services` · `We are receiving services`
- Maps to `party_perspective: provider | client`

**Footer:**
- Cancel (ghost button)
- `Analyze contract →` (primary button, disabled until file + contract type + perspective selected)

**Validation:** If user clicks Analyze without contract type selected, the pills section gets a subtle red ring and label turns red. No toast.

### 6.3 — Upload Progress State (Step 2)

After clicking Analyze, the modal content transitions to a progress view. The modal does NOT close. The user stays in context.

**Layout:**
```
[Animated upload icon: arrow moving upward, looping — 36px — amber]

Uploading...
filename.pdf · 2.4 MB

[===========......] 62%
```

Progress bar: `height: 3px`, `background: var(--surface-base)`, fill `var(--accent-gold)`, `border-radius: 2px`. Animates smoothly (the actual upload progress from `XMLHttpRequest.upload.onprogress`).

When upload completes (GCS write done):

```
[CheckCircle icon — 20px — green]
Uploaded. Starting analysis...
```

The modal shows a brief "success" state (500ms), then auto-closes. A toast appears in the bottom-right: `"[filename.pdf] is being analyzed — we'll update this page when it's ready."` Toast has an `×` close and auto-dismisses in 6s.

### 6.4 — Processing State (In the document list)

While a document is being processed (ARQ worker running):
- The document row appears immediately in the list with status `PROCESSING`
- The status badge has an amber spinner (14px, CSS animation `spin` at 800ms/rotation)
- The row's filename cell has a small `Analyzing...` label below the filename in 11px muted text
- Other cells (contract type, risk dots, date) are already populated
- Clicking the row while processing: navigates to the document viewer but shows a processing banner at the top of the viewer (see §7)

**30–60 second wait problem:** The user will see the amber spinner for up to 60s. This is addressed by:
1. The toast above reminding them it's in progress
2. The spinner being subtle, not alarming
3. If the user navigates away and comes back, polling resumes (the library page polls document status every 8s via `setInterval` when any row is in PROCESSING state)
4. When analysis completes, the row transitions: spinner fades, green dot fades in, risk dots appear with a stagger animation (pop in one by one), status badge transitions. This should feel like a reward, not just a state change.

### 6.5 — Failed State

Row shows `Failed` badge in red. Hovering the badge shows a tooltip with the error message (truncated to 100 chars). `···` menu on the row shows `Retry analysis` at the top.

---

## 7. DOCUMENT VIEWER

### Philosophy

The document viewer is the core product surface. Everything else exists to bring users here. It must feel like a professional legal workspace, not a web app. Two things are happening simultaneously: reading the document and reading ContractIQ's analysis. The layout must serve both without either fighting for space.

### 7.1 — Layout

**Three-panel layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │           PDF VIEWER              │   ANALYSIS PANEL  │
│  (240px)  │           (flex-1)                │   (360px)         │
│           │                                   │                   │
│  Clauses  │   [actual PDF rendered]           │  [Analysis tabs]  │
│  list     │                                   │                   │
│           │   Clause text highlighted         │  Overview         │
│           │   in amber on the page            │  Clauses          │
│           │                                   │  Q&A Chat         │
└──────────────────────────────────────────────────────────────────┘
```

Left sidebar and right panel can each be collapsed. Main PDF viewer flexes to fill.

### 7.2 — Left Sidebar: Clause List

**Header:** `Clauses` (14px, semibold) · `[filter icon]`

**Filter bar (on filter icon click, expands below header):**
Risk level toggles: `● CRITICAL` `● HIGH` `● MEDIUM` `● LOW` — each toggleable. Active: pill fill. Initial state: all active.

**Clause items:**
Each clause in a scrollable list:
```
[risk-dot] PAYMENT TERMS          [risk badge]
           "Net 30 from invoice..." (1 line preview)
```
- Risk dot: 8px circle, color matches risk level
- Clause type: 11px, ALL CAPS, `letter-spacing: 0.05em`, `var(--text-muted)`
- Preview text: 12px, `var(--text-secondary)`, max 1 line
- Active (selected): `background: rgba(200,169,110,0.1)`, left border `2px solid var(--accent-gold)`
- Clicking a clause item: scrolls the PDF to the relevant page and scrolls the analysis panel to the clause detail

**CRITICAL clauses:** Always appear at the top of the list regardless of document order, with a small warning strip: `1px solid var(--semantic-error)` on the left + icon.

**Skeleton:** While the document is loading, 8 skeleton clause items appear.

### 7.3 — PDF Viewer (Center)

**Library:** `react-pdf` (built on pdf.js) — handles text layer rendering, annotation layer, and page rendering. Alternative consideration: pdf.js directly for more control. Decision: `react-pdf` for the React integration, custom canvas layer for highlights.

**Controls toolbar (above the PDF):**
```
[← Prev page]  Page 4 / 22  [Next page →]     [Zoom −] 100% [Zoom +]    [Download]
```
- Page input is editable: clicking it lets you type a page number directly
- Zoom: 75% / 100% / 125% / 150% / 200% / Fit width (default)
- Download: downloads the original PDF from GCS (presigned URL)
- Toolbar: `height: 44px`, `background: var(--surface-elevated)`, `border-bottom: 1px solid var(--border-subtle)`

**Clause Highlighting:**
Using `locations.json` (bbox coordinates per page), an SVG overlay is rendered over the PDF canvas for the active clause:
- The bbox area gets a `fill: rgba(200,169,110,0.2)` with a `stroke: rgba(200,169,110,0.6)` outline at 1px
- On hover of an unselected clause highlight: `fill: rgba(200,169,110,0.12)`, cursor pointer
- Click on highlight → selects that clause in left sidebar + right panel
- Multiple clauses on same page: all visible as lighter highlights, active clause has brighter highlight

**Processing banner (document not yet READY):**
A non-obtrusive banner at top of PDF area:
`[amber spinner] Analyzing this contract — clauses will appear in 30–60s`
`background: rgba(200,169,110,0.08)`, `border-bottom: 1px solid rgba(200,169,110,0.2)`, `padding: 10px 16px`
Banner disappears (slides up, 300ms) when status changes to READY.

### 7.4 — Right Panel: Analysis

**Tab bar at top:**
`Overview` · `Clauses` · `Ask`

**Tab: Overview**
A scrollable section with:

```
Contract Analysis

[contract type badge]  [party perspective badge]  [risk level badge: HIGH]

SUMMARY
[2–3 sentence summary from agent analysis]

KEY RISKS
[CRITICAL] Unilateral termination right (§8.2)
[HIGH]     Auto-renewal with 90-day notice window (§5.1)
[MEDIUM]   Data processing responsibilities undefined

RECOMMENDATIONS
• Negotiate limitation of liability cap
• Add explicit data deletion clause
• Clarify IP ownership on derivatives
```

- Section headers: 10px, ALL CAPS, `letter-spacing: 0.1em`, `var(--text-muted)`
- Risk items: small colored pill on left, clause reference on right in `var(--text-muted)`, 13px

**Tab: Clauses**
A scrollable list of every extracted clause with full analysis. Each clause block:
```
┌──────────────────────────────────────────┐
│ PAYMENT TERMS              [MEDIUM] [↗]  │
│                                          │
│ "Payment is due net 30 days from         │
│  invoice date..."                        │
│                                          │
│ Standard payment terms. Note: no late    │
│ penalty clause — consider negotiating.   │
└──────────────────────────────────────────┘
```
- `[↗]` jumps to the clause in the PDF
- Card: `background: var(--surface-base)`, `border: 1px solid var(--border-subtle)`, `border-radius: 8px`, `padding: 14px`, `margin-bottom: 8px`
- Active/selected clause (when user clicked in sidebar or PDF): card gets `border-color: var(--accent-gold)` + smooth scroll into view

**Tab: Ask**
The Q&A chat interface.

**Chat layout:**
```
[message list — scrollable]

[input bar]  Send [↵]
```

**Message bubbles:**
- User messages: right-aligned, `background: rgba(200,169,110,0.12)`, `border-radius: 12px 12px 0 12px`, max-width 280px, `padding: 10px 14px`
- Agent responses: left-aligned, `background: var(--surface-elevated)`, `border-radius: 12px 12px 12px 0`, max-width 320px, with typed rendering effect

**Typed rendering:** Agent responses stream word-by-word (like ChatGPT). The cursor is a `|` that blinks at 500ms. When streaming finishes, cursor disappears. This is handled by the server-sent events/streaming endpoint.

**Suggested questions (empty state):**
Before any messages, show 3 clickable suggestion pills:
- `"What are the termination conditions?"`
- `"Are there any unusual clauses?"`
- `"What should I negotiate?"`
Clicking sends that question immediately.

**Input bar:**
- `height: 44px`, full width of the panel
- `border: 1px solid var(--border-subtle)`, `border-radius: 8px`
- Placeholder: `Ask anything about this contract...`
- Send button: icon-only `PaperPlaneRight` (Phosphor), 16px, `color: var(--accent-gold)` when input is non-empty, `var(--text-muted)` when empty
- Submit on Enter (Shift+Enter for newline). The input does NOT expand into multi-line automatically — keep it single-line for simplicity.
- While waiting for response: send button becomes a `X` stop button (Phosphor `X`)

### 7.5 — Panel Collapse Behavior

- Left sidebar: collapses to 0px (hidden, not icon-rail). A `[← clauses]` tab appears on the left edge of the PDF viewer to re-open. Transition 200ms.
- Right panel: collapses to 0px. A `[analysis →]` tab appears on the right edge of the PDF. Transition 200ms.
- Both collapsed: PDF viewer fills full content area. For reading focus.
- These states are persisted to localStorage (per user, per document).

---

## 8. PLAYBOOK EDITOR

### Philosophy

Playbooks are ContractIQ's differentiator — the workspace-level intelligence layer. The editor should feel like a focused writing environment. Think Notion doc editor, not VS Code.

### 8.1 — Playbook List (`/app/playbooks`)

A simple page listing all playbooks for the workspace:

```
PLAYBOOKS

Your review guidelines for each contract type.

[NDA]              Last edited 2 days ago   [Edit →]
[SaaS Agreement]   Last edited 1 week ago   [Edit →]
[Employment]       Never edited — using default  [Edit →]
[MSA]              Never edited — using default  [Edit →]
```

Table with: type name, last edit date, edit button. No complex layout needed.

### 8.2 — Playbook Editor (`/app/playbooks/[type]`)

**Layout:** Two-column editor — left: raw markdown, right: rendered preview. Split is 50/50 with a resizable divider.

**Header:**
```
[← Playbooks]   NDA Playbook                    [Save]  [Reset to default]
```
`Save` is `var(--accent-gold)` when there are unsaved changes. A subtle `•` dot appears in the tab title when unsaved (standard editor convention).

**Editor (left):**
A `<textarea>` with `font-family: JetBrains Mono`, `font-size: 13px`, line-height 1.7, `padding: 20px`, full height, no border (the panel border is the boundary), `background: var(--surface-base)`. Tab key inserts 2 spaces (no modal dialogs).

**Preview (right):**
A `react-markdown` rendering with the ContractIQ prose styles applied: Inter font, proper heading scale, code blocks with `JetBrains Mono`. Updates as you type (debounced 300ms).

**"Reset to default" confirmation:**
Inline confirmation replaces the button: `"This will replace your edits with the default playbook. [Confirm] [Cancel]"` — no modal. 3s timeout, then auto-reverts to button if no action.

**Autosave:** Save fires automatically 2s after last keystroke. No user feedback unless save fails. If save fails: a non-obtrusive error note appears below the header: `"Couldn't save — retrying..."`.

---

## 9. PORTFOLIO SEARCH

### 9.1 — Page Structure

Full-width page. No cramped layout.

**PageHeader:**
Title: `Search`
Subtitle: `Across all analyzed contracts`

**Search bar:**
- Prominent, 600px max-width, centered
- `height: 52px` (larger than standard inputs — this is the primary interaction)
- `border-radius: 10px`
- `border: 1px solid var(--border-default)`
- `background: var(--surface-elevated)`
- Placeholder: `Search across all contracts...`
- Left icon: Phosphor `MagnifyingGlass`, 18px
- `font-size: 16px` (larger text for search)
- On focus: border becomes `var(--accent-gold)` at 40% opacity, subtle `box-shadow: 0 0 0 3px rgba(200,169,110,0.12)` — like a focused state for a premium tool
- Keyboard shortcut: `Cmd/Ctrl + K` globally focuses this bar from anywhere in the app (standard)

**Mode selector (below search bar, when empty):**
```
Mode:  [Fuzzy]  [Exact]  [Regex]  [Semantic]
```
Pills. Default: Fuzzy. `Semantic` has a small `✦` sparkle icon (Phosphor `Sparkle`, 12px) to signal it's AI-powered. Each mode has a 1-line description shown below the pills: "Semantic: find clauses by meaning, not just words."

**Empty/initial state:**
A clean empty state. Three recent searches shown as clickable pills: `Recent: "termination clause" · "liability cap" · "payment terms"` — from localStorage.

### 9.2 — Results

Results appear as the user types (debounced 300ms for fuzzy/exact/regex, on Enter for semantic).

**Results header:**
`12 matches across 5 contracts` · `[mode badge]` — right: `Sort by: Relevance ▾`

**Result rows:**

Fuzzy/Exact/Regex results:
```
┌─────────────────────────────────────────────────────────┐
│ [FilePdf icon]  Acme Corp NDA.pdf                 [→]   │
│ Page 4, §8.2                                            │
│ "The Agreement may be terminated by either party        │
│  upon 30 days written notice..."                        │
│                                                         │
│ [matched term highlighted in amber inside the text]     │
└─────────────────────────────────────────────────────────┘
```

Semantic results:
```
┌─────────────────────────────────────────────────────────┐
│ [FilePdf icon]  Vendor MSA.pdf                    [→]   │
│ Page 7 · Similarity: 94%                                │
│ [similarity score bar: 94% filled amber]                │
│ "In the event of material breach, the non-breaching     │
│  party shall provide written notice..."                 │
└─────────────────────────────────────────────────────────┘
```

- Similarity score bar: `height: 3px`, `width: 80px`, displayed below the document name
- Matched text: the query term gets `<mark>` styling: `background: rgba(200,169,110,0.25)`, no border-radius, just background highlight
- `[→]` navigates to the document viewer, jumps to that exact page

**Grouping option:** A toggle `[Group by document]` — when on, results are grouped under document headers instead of flat list.

---

## 10. EXPORT

### Philosophy

Export is not a feature that warrants a dedicated page. It's a utility action. The UX should be frictionless.

### 10.1 — Trigger Points

1. From the workspace settings page: `Export workspace data`
2. From the document library: `···` menu on any document → `Export analysis`
3. From the sidebar bottom: a `Export` item could be added but is lower priority

### 10.2 — Workspace Export (CSV)

When triggered from settings:
A modal appears (not a new page):

```
Export workspace data

This will generate a CSV with all analyzed documents and their
extracted clauses, risk summaries, and key findings.

[Export to CSV]    [Cancel]
```

Clicking Export:
- Button becomes loading state (`Generating...` + spinner)
- Request fires to `GET /workspaces/{id}/export`
- On response: browser download is triggered automatically (`Content-Disposition: attachment`)
- Modal closes, toast: `"Export downloaded — check your Downloads folder."`

### 10.3 — Single Document Export

Exports the analysis as a PDF report. This is a future feature — the `···` menu item is present but shows `"PDF report — coming soon"` as a disabled item with a `SOON` badge.

---

## 11. SETTINGS

### 11.1 — Layout

Left sidebar within the settings page (nested navigation):
```
Settings

  Profile
  Workspace
  Billing
  Danger zone
```

Main content area changes based on selected sub-tab.

### 11.2 — Profile Tab

**Avatar section:**
- 64px circle avatar (initials or uploaded photo)
- `[Upload photo]` link below it
- Photo upload: clicking opens file picker, accepts image/*, max 2MB, crops to square

**Form fields:**
- Full name
- Email (read-only, with a lock icon and `"Contact support to change"` tooltip)
- `[Save changes]` button

### 11.3 — Workspace Tab

**Fields:**
- Workspace name (editable text input)
- Default contract region: dropdown (`EU (GDPR)` · `US` · `UK` · `Other`)
- `[Save changes]` button

### 11.4 — Billing Tab

A placeholder page for now:
```
Billing

You're on the Free plan.

[Upgrade — coming soon]
```

### 11.5 — Danger Zone Tab

Visual treatment: the section gets a `border: 1px solid rgba(var(--semantic-error-rgb), 0.3)`, `border-radius: 10px`, `padding: 20px`.

**Items:**
- **Delete all documents** — `[Delete all]` button (red outlined). Confirmation: an inline confirmation bar with `"Type DELETE to confirm"` text input + confirm button. This is not a modal.
- **Delete workspace** — `[Delete workspace]` button (red filled). Confirmation: same pattern.

---

## 12. SKELETON LOADING SYSTEM

### Philosophy

Skeletons are better than spinners for content-heavy pages because they set expectations — the user sees the layout before the content. ContractIQ's skeletons must:
1. Match the exact dimensions of real content (not generic rectangles)
2. Use a consistent animation
3. Never persist longer than real content loading (if real content arrives, swap immediately)

### 12.1 — Animation

The skeleton animation is a shimmer effect:
```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-elevated) 25%,
    rgba(255,255,255,0.05) 50%,
    var(--surface-elevated) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 4px;
}
```

### 12.2 — Per-Surface Skeleton Specs

**Document Library rows (5 skeleton rows):**
- `[40px × 40px rect]` `[160px × 14px line]` `[80px × 20px pill]` `[70px × 20px pill]` `[···]`
- Row height 52px, gap between elements matches real layout

**Dashboard document cards (4 skeleton cards):**
- Full card rectangle with: `[140px × 12px line]` at top, `[80px × 18px pill]` in middle, `[100px × 10px line]` at bottom

**Activity feed (5 rows):**
- `[16px × 16px circle]` `[200px × 12px line]` — right: `[60px × 10px line]`

**Document viewer — clause list (8 items):**
- `[8px circle]` `[100px × 10px]` right `[50px × 18px pill]`
- Below: `[160px × 10px]`
- Each item 44px tall

**Document viewer — analysis panel:**
- Overview: 3-line text skeleton + 3 risk item skeletons
- Clauses: 4 clause card skeletons

**Chat — while streaming:**
No skeleton. Instead: the text appears progressively (streaming).

### 12.3 — State Transitions

Skeleton → real content: The swap uses a `CrossFade` pattern — the skeleton fades out (opacity 0, 200ms) while real content fades in (opacity 0→1, 200ms) simultaneously. No layout shift.

---

## 13. MOBILE STRATEGY

### Decision: Desktop-First, Mobile-Usable

ContractIQ's primary user is:
- A founder or legal ops professional at a desk, reviewing a contract sent to them
- They are NOT primarily using it on mobile

This means:
- Desktop experience is the primary experience (1280px+ viewport)
- Tablet (768px–1024px): functional with layout simplifications
- Mobile (< 768px): accessible but not optimized for PDF review

### Mobile Breakpoints

**Mobile (< 768px):**
- Sidebar becomes a bottom sheet navigation (5 tab icons at bottom — Dashboard, Documents, Search, Playbooks, Settings)
- Document viewer: PDF panel is full width. Analysis panel becomes a bottom drawer that slides up from the bottom. The drawer handle is a tab at the bottom of the PDF viewer.
- Clause list sidebar is hidden on mobile — accessible from a `[Clauses]` button in the toolbar.
- Upload: works on mobile — same flow, uses device file picker

**Tablet (768px–1024px):**
- Sidebar stays but collapsed (icon rail by default)
- Document viewer: analysis panel collapses to right-side overlay (slides in from right, 280px wide), PDF gets full width
- Library: 2-column grid

### Mobile Navigation (bottom bar):
- `height: 56px`, `background: var(--surface-elevated)`, `border-top: 1px solid var(--border-subtle)`
- 5 icons: grid, file, search, book-open, gear
- Active icon: `color: var(--accent-gold)`
- Safe area padding for iPhone notch: `padding-bottom: env(safe-area-inset-bottom)`

---

## 14. MICRO-INTERACTION CATALOGUE

Documenting every non-obvious motion so implementation is deterministic.

### 14.1 — List

| Interaction | Element | Behavior | Duration | Easing |
|---|---|---|---|---|
| Page enter | Main content | `opacity: 0→1` + `translateY(8px→0)` | 250ms | ease-out |
| Row hover | Document list row | `background-color` transition | 120ms | linear |
| Card hover | Document card | `border-color` + `box-shadow` | 150ms | ease-out |
| Status badge (PROCESSING) | Amber dot | `opacity: 0.4→1→0.4` loop | 1600ms | ease-in-out |
| Risk badge (CRITICAL only) | Badge background | `opacity: 1→0.7→1` loop | 2000ms | ease-in-out |
| Nav item active | Left border | instant (no transition — snappy) | 0ms | — |
| Modal open | Backdrop + modal | backdrop `opacity: 0→1`, modal `scale(0.96)→1` + `opacity: 0→1` | 200ms | ease-out |
| Modal close | Backdrop + modal | reverse | 150ms | ease-in |
| Toast enter | Bottom-right | `translateX(100%)→0` + `opacity: 0→1` | 300ms | ease-out |
| Toast exit | Bottom-right | `opacity: 1→0` + `translateY(4px)` | 200ms | ease-in |
| Clause select (PDF) | Highlight overlay | `fill opacity 0→0.2` | 200ms | ease-out |
| Panel collapse | Left/right panel | `width` transition | 200ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Skeleton → content | Any skeleton | opacity crossfade | 200ms | ease |
| Upload progress bar | Bar fill | smooth tracking of actual % | native | — |
| Chat message appear | Bubble | `opacity: 0→1` + `translateY(4px→0)` | 180ms | ease-out |
| Strength bar fill | Password strength | `width` + `background-color` | 200ms | ease-out |
| Confirm delete inline | Button → confirm bar | `width` expand + content swap | 200ms | ease-out |
| Drop overlay | Full viewport | `opacity: 0→1` | 150ms | ease-out |

### 14.2 — No-Animation Zones

These interactions are instant (no animation):
- Sidebar active item switching (feels snappy/immediate, like Linear)
- Tab switching within Analysis panel (instant content swap)
- Form input focus (border color is instant — transitions on inputs feel laggy)
- Tooltip appearance delay: 400ms delay, then instant appear (standard)

### 14.3 — Reduced Motion

All animations respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
Exceptions: streaming text always renders (no motion involved). Progress bars update instantly.

---

## APPENDIX A — Component Inventory

All components to be built, in dependency order:

**Primitives (no dependencies):**
- `SkeletonBlock` — reusable skeleton rectangle
- `Badge` — risk level, status, contract type variants
- `Spinner` — 14px / 20px sizes
- `Tooltip` — Radix `TooltipContent`
- `Toast` — Sonner or custom
- `Avatar` — initials fallback
- `Dropdown` — Radix `DropdownMenu`
- `Modal` — Radix `Dialog`
- `Input` — with label, error state, show/hide
- `Select` — Radix `Select`
- `Button` — primary / secondary / ghost / danger variants
- `PillGroup` — toggle pill selector (contract type, mode)

**Composed:**
- `NavItem` — icon + label + active state
- `DocumentCard` — for grid view
- `DocumentRow` — for list view
- `ClauseCard` — clause block with risk badge
- `RiskBadge` — CRITICAL/HIGH/MEDIUM/LOW with pulse variants
- `ChatBubble` — user and agent variants
- `PageHeader` — title + subtitle + actions slot
- `ProgressBar` — for upload and strength indicator
- `DropZone` — file drop with states
- `SearchBar` — the large portfolio search input

**Pages/Layouts:**
- `AuthLayout` — two-column, no sidebar
- `AppLayout` — sidebar + main
- `Sidebar` — full sidebar implementation
- `DocumentViewer` — three-panel

---

## APPENDIX B — Implementation Notes

**Streaming Q&A:**
The Ask tab connects to `POST /conversations/{workspace_id}/messages` which returns a streaming response. The frontend consumes this as `ReadableStream` via `fetch`. Each chunk is appended to the current message content. When the stream ends, the message is finalized.

**PDF Highlighting:**
`locations.json` contains `[{text, page, bbox: [x0,y0,x1,y1]}]` in PDF coordinate space. React-pdf renders each page as a canvas. The highlight SVG overlay is positioned absolutely over the canvas. PDF coordinates need transformation: `screenX = pdfX * scale`, `screenY = (pageHeight - pdfY) * scale` (PDF coordinates have Y-axis inverted).

**Polling for document status:**
`useEffect` with `setInterval(8000)` on any page showing a PROCESSING document. Fires `GET /documents/{id}` to check `status`. Clears interval when status becomes READY or FAILED. Uses `useRef` to prevent stale closure issues.

**Global keyboard shortcuts:**
- `Cmd/Ctrl + K` → focus portfolio search
- `Cmd/Ctrl + U` → open upload modal
- `Escape` → close modal / close drop overlay / deselect clause
- `←/→ arrows` → navigate PDF pages (when PDF viewer is focused)
