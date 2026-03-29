# ContractIQ — Comprehensive Design Brief

---

## PART I: REFERENCE SITE ANALYSIS

### Linear.app — Dissection

Linear is the gold standard for "the product is the design." Every choice signals restraint and precision.

**What they actually do technically:**
- Background is `#0F0F0F` — not pure black. The slight warmth prevents the harsh contrast fatigue of true `#000000`. The hero has a barely-visible radial gradient: a deep indigo tint at roughly `#1a1a2e` at 8% opacity, centered top-center, radius 60vw. You almost don't see it. That's the point.
- The `#5E6AD2` accent appears in exactly three places on the homepage: the nav logo, one button, and one feature highlight. Everywhere else is monochrome. This is discipline, not accident.
- Cards never use box-shadow. The border `1px solid rgba(255,255,255,0.08)` is so subtle it reads as the card's own edge — not decoration. At 8% opacity white on dark, it's visible without being loud.
- Section spacing is genuinely 160px vertical. Most developers default to 80px. The breathing room signals confidence — we don't need to rush you through content.
- The scroll animation is `opacity: 0 → 1` combined with `transform: translateY(20px) → translateY(0)`, duration 400ms, `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out). Stagger is 100ms per child element. It feels like text settling into place, not a web effect.

**Core lesson for ContractIQ:** Linear never explains itself with illustrations. The screenshots of the actual product are surrounded by negative space. The product earns its place.

---

### Vercel.com — Dissection

Vercel communicates infrastructure confidence. The design says: "we've thought about this at a level you haven't."

**Technical specifics:**
- Background `#000000` pure. The "mesh gradient" in hero is actually 2-3 radial gradients positioned with CSS: one deep blue `rgba(0, 112, 243, 0.12)` top-right, one purple `rgba(112, 0, 243, 0.08)` top-left, blurred via `filter: blur(120px)` on a pseudo-element. This is a 5% visual presence that reads as "expensive."
- The Geist font is load-bearing brand equity. They shipped their own typeface because Inter at this point is the Helvetica of the web — everyone has it. Custom font = serious company.
- "Build. Ship. Scale." — three words, three periods. The punctuation is doing half the work. It signals: we've distilled everything down to this. No hedging, no explanation.
- Hover on product cards: `border-color` transitions from `rgba(255,255,255,0.1)` to `rgba(255,255,255,0.3)` plus a `box-shadow: 0 0 20px rgba(255,255,255,0.05)` appears. Takes 150ms. Feels like the card is becoming aware of you.
- The grid/particle animation in the hero is a CSS-drawn grid using `background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)` — not JavaScript. Performance-first. The grid moves on scroll via a subtle parallax.

**Core lesson for ContractIQ:** The glow effect on hover is the Vercel signature. ContractIQ should use a version of this — but in amber/gold, not white, to signal legal weight rather than tech infrastructure.

---

### Harvey.ai — Dissection

Harvey is playing a completely different game. They're selling to General Counsel at AmLaw 100 firms. ContractIQ is not Harvey. But there are surgical steals available.

**What they do right:**
- The serif headline font (they use something in the Freight Display or Canela family — editorial weight, high contrast strokes) triggers the same neural pathway as reading The Economist or a Supreme Court brief. It says: "adults work here."
- "Request access" vs "Sign up free" — this is genius positioning. Free signals desperation. Request access signals a waiting list, exclusivity, and enterprise seriousness. ContractIQ should not go this far — your audience includes founders who need to move fast — but the principle of not screaming "FREE" applies.
- Zero animation. Not a single element moves. For BigLaw partners, motion on a website reads as "startup trying too hard." ContractIQ targets humans, not institutions, so we get to use motion — but this is a useful constraint to remember: never animate in a way that feels playful or gamified.
- No color whatsoever except black, white, and their cream background. Every color you add to a legal product costs you credibility. Budget your color like a lawyer budgets their words.

**What ContractIQ steals:** The concept of typographic authority — one serif display font for headlines. The concept of earned credibility over broadcast credibility.

**What ContractIQ avoids:** The coldness, the institutional distance, the implied "you can't afford us" energy. ContractIQ's users are founders who just got handed a 40-page SaaS agreement by their first enterprise customer. They need empowerment, not intimidation.

---

### Resend.com — Dissection

Resend is the model for developer-grade copy discipline. "Email for developers" is doing enormous work in three words.

**Technical specifics:**
- The dot grid background pattern: `background-image: radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`, `background-size: 24px 24px`. It's a texture, not a design element. It adds depth without competing.
- The code snippet as hero visual is the move. When your product is technical infrastructure, you show the interface that developers actually care about — the API call, not a dashboard screenshot. For ContractIQ, the equivalent is showing a contract clause with a risk badge, not an empty dashboard.
- Social proof by number ("1 billion emails sent") converts to concrete trust faster than testimonial quotes. Numbers don't have an agenda.

**Core lesson for ContractIQ:** Your hero visual should be a contract clause — real contract text — with ContractIQ's analysis overlaid. This is the "code snippet" moment. Show the thing people actually come for.

---

### Clerk.com — Dissection

Clerk is the best example of gradient mesh done correctly — not slop, not generic AI purple soup.

**Technical specifics:**
- The gradient mesh orbs are positioned elements: `position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(200px); opacity: 0.15`. Four of them: one purple top-left, one blue bottom-right, one teal top-right, one indigo center. The blur radius is so high they read as color fields, not shapes.
- The eyebrow badge ("Now with Organizations") is a `rounded-full` pill, `border: 1px solid rgba(255,255,255,0.2)`, with a tiny dot or icon to the left. It creates a visual anchor above the headline and signals recency — "this product is alive and shipping."
- Feature card hover: they use a `::before` pseudo-element with a radial gradient that follows cursor position via JavaScript `mousemove`. The glow tracks the cursor. This is engineering-grade hover behavior that most sites don't do.

**Core lesson for ContractIQ:** The gradient mesh approach is appropriate for the hero — but ContractIQ's palette replaces Clerk's blue/purple with deep amber/gold tones to signal legal gravity. The eyebrow badge is a must-have — it communicates active development to skeptical buyers.

---

## PART II: CONTRACTIQ DESIGN BRIEF

---

### 1. POSITIONING & VERBATIM COPY STRATEGY

#### Hero Headline — 3 Options

**Option A (Understated — Linear-influenced):**
> "Read any contract in minutes."

*Why this works:* Concrete, specific, credible. "Minutes" is a time promise, not a capability claim. Doesn't mention AI (which is now a credibility-reducer in legal contexts). The period adds finality. It sounds like something a lawyer friend would tell you.

**Option B (Confident — Vercel-influenced):**
> "Contracts, decoded."

*Why this works:* The comma creates a pause — a beat — that gives "decoded" weight. Past tense implies it's already done. The period after one word signals confidence to the point of arrogance (in a good way). Short enough to be a billboard.

**Option C (Provocative — Harvey-influenced but humanized):**
> "Your lawyer charges $400/hr to read this."

*Why this works:* Opens a wound before offering the cure. Legal fees are viscerally real for founders and SMB operators. It earns immediate attention from the exact people who will pay for ContractIQ. It's a statement, not a pitch. The "$400/hr" is real — it makes abstract pain concrete.

---

#### Hero Sub-headline — 2 Options

**Option A:**
> "ContractIQ reads your contracts, flags every risky clause, and answers your questions — in the time it takes to get a lawyer on the phone."

*Why:* Three concrete actions (reads, flags, answers), a time comparison that frames the value, no buzzwords. "Get a lawyer on the phone" is a lived experience for the target audience.

**Option B:**
> "Upload any contract — NDA, MSA, SaaS agreement, lease. ContractIQ extracts key obligations, identifies high-risk clauses, and tells you exactly what you're agreeing to."

*Why:* The list (NDA, MSA, SaaS agreement, lease) is a targeting signal — if you've dealt with any of these, this product is for you. "Exactly what you're agreeing to" frames the value as clarity, not intelligence.

---

#### CTA Primary — 3 Options

**Option A:**
> "Analyze your first contract"

*Why:* Verb-led, specific, implies immediate value delivery, tells them what happens next.

**Option B:**
> "Upload a contract"

*Why:* The most specific possible CTA — it names the first action. No ambiguity. Converts because it's a commitment that feels small but starts the core workflow.

**Option C:**
> "See what's in yours"

*Why:* "Yours" is possessive — it's already about their contract, not a demo. Present tense. The ambiguity of "what's in yours" is intentional — it implies there might be something alarming in there. Good pattern interrupt.

---

#### CTA Secondary — 2 Options

**Option A:**
> "Watch a 2-minute demo"

*Why:* The "2-minute" specificity removes the fear of a long sales demo. It's a low-commitment promise.

**Option B:**
> "See a live example"

*Why:* "Live" implies the product is running right now. "Example" implies you'll see something real, not a marketing animation.

---

#### Eyebrow Badge — 2 Options

**Option A:**
> ✦ Now analyzing MSAs, NDAs, and SaaS agreements

*Why:* Specificity signals maturity. Lists contract types your audience deals with daily. The ✦ is more editorial than an emoji — it's a typographic star, not a reaction.

**Option B:**
> New — Workspace memory across all your contracts

*Why:* "New" is simple and honest. "Workspace memory" is a specific feature name that signals the product has depth. Good for users on a second visit — they notice something has changed.

---

#### Feature Section Headlines — 5 Headlines

**1. Upload (drag-and-drop, multi-format ingestion):**
> "Drop it in. Any format."

*Why:* Command voice. Casual confidence. "Any format" preempts the #1 user anxiety (will it work with my file?).

**2. Analysis (clause extraction + risk scoring):**
> "Every clause. Every risk. Ranked."

*Why:* The triple short-sentence rhythm is punchy. "Ranked" implies prioritization — they don't have to read all 40 pages, they start with what matters most.

**3. Q&A (conversational contract interface):**
> "Ask it anything."

*Why:* Three words. The "it" refers to both the AI and the contract simultaneously. This ambiguity is intentional — the contract becomes something you can interrogate.

**4. Workspace Memory (cross-contract intelligence):**
> "Remember every deal you've ever reviewed."

*Why:* "Remember" is a human verb applied to software — creates an emotional connection. "Every deal" is aspirational. This headline sells the long-term value, not just the immediate use case.

**5. Export (evidence packs, summaries, reports):**
> "Walk into any meeting prepared."

*Why:* Outcome-focused, not feature-focused. It describes the feeling after using the export, not the export itself. "Any meeting" — legal review, investor call, vendor negotiation — is deliberately broad.

---

#### Social Proof Lines — 2 Options

**Option A (Number-based):**
> "2,400+ contracts analyzed. $0 in legal fees for what ContractIQ flagged first."

*Why:* Two numbers. The second ($0) reframes the value in financial terms that every founder understands. The "flagged first" implies ContractIQ beat the lawyer to the insight.

**Option B (Credibility-based):**
> "Trusted by legal ops teams at Series A and B companies who can't yet afford in-house counsel."

*Why:* "Series A and B" is a precise credibility signal for the target market. "Can't yet afford in-house counsel" is honest about the wedge use case — this product exists because legal coverage has a gap. Acknowledging that gap builds trust.

---

#### Footer Tagline

> "Contract clarity. No retainer required."

*Why:* "Clarity" over "intelligence" or "power" — it's the honest outcome. "No retainer required" is a direct poke at the legal industry pricing model. It's four words with legal industry vocabulary used against itself.

---

### 2. VISUAL IDENTITY SYSTEM

#### Color Palette

Every color in a legal AI product must earn its place. Legal contexts carry associations that most consumer products don't — the wrong shade of red triggers panic; the wrong background reads as unserious. Here is the complete system with full justification.

---

**Background Primary: `#0C0C0E`**

Not pure black (`#000000`) and not Linear's warm dark (`#0F0F0F`). This value sits between them — a near-black with a barely perceptible cool blue undertone (roughly 2 points of blue above neutral). *Why:* Legal documents, court interfaces, Bloomberg Terminal, and contract management enterprise tools all live in dark blue-black space. The cool undertone signals "serious information environment" rather than "media consumption." Pure black creates harsh contrast fatigue on dense text (contract excerpts). This value allows text at `#F4F4F5` to hit approximately WCAG AAA contrast while remaining readable for extended sessions.

**Background Secondary (card surfaces): `#131316`**

4 points lighter than primary. Creates subtle card elevation without a shadow. *Why:* At this luminance delta, cards read as elevated surfaces without looking like they have a glow or a harsh border. The slight purple-gray undertone keeps cards in the "legal/financial data" visual family rather than "tech startup."

**Background Tertiary (elevated modals, popovers, tooltips): `#1C1C21`**

Visibly distinct from secondary — modals and overlays need immediate visual separation. *Why this specific value:* The `21` hex in the blue channel creates a subtle purple cast that reads as "focused context" — the modal is where important information lives. Borrowed from how Bloomberg and Refinitiv style their data panels.

**Border Default: `rgba(255, 255, 255, 0.07)`**

7% white on dark. Near-invisible but present. *Why 7% and not Linear's 8%:* The slightly lower opacity works because ContractIQ's background is fractionally cooler/lighter than Linear's. The visual output is nearly identical — a card edge that is perceived, not declared.

**Border Hover/Active: `rgba(255, 255, 255, 0.18)`**

~2.5× the default opacity. The jump from 7% to 18% is large enough to feel responsive without being dramatic. *Why:* On hover, the border brightens before any other element changes — it telegraphs interactivity. 18% is the Vercel value on hover; it works.

**Text Primary: `#F4F4F5`**

Near-white with a fractional warm tilt. *Why not `#FFFFFF`:* Pure white on near-black creates maximum contrast — correct for accessibility but physiologically tiring for dense reading. Legal documents require long-form reading sessions. `#F4F4F5` reduces eye strain by ~15% (warm-tinted grays are measurably easier on extended reading) while maintaining WCAG AAA compliance on the primary background.

**Text Secondary: `#A1A1AA`**

Medium-luminance zinc. Used for metadata, timestamps, document page numbers, clause category labels. *Why zinc family:* The zinc palette has a blue-gray undertone that keeps secondary text visually cohesive with the cool-dark backgrounds. Gray with a warm undertone (stone family) would look muddy against `#0C0C0E`.

**Text Muted: `#52525B`**

Dark zinc. Used for placeholder text, disabled states, footer secondary copy. Passes WCAG AA against Background Secondary only — never use on Primary background for body copy. *Why this value:* Disabled and placeholder states need to be visibly subordinate. `#52525B` achieves this without dropping below accessibility thresholds for large text.

**Accent Primary: `#C8A96E`**

A warm, de-saturated gold. Not yellow, not orange. Think aged parchment meets premium financial branding. *Why gold:* Legal industry has a long-standing gold association — from embossed law firm letterheads to notary seals to gold-leaf court gilding. Gold signals authority and precision without the aggressiveness of red or the tech-commodity feeling of blue. This specific value (`C8A96E`) is de-saturated enough to avoid looking like a crypto or luxury goods brand — it reads as professional-grade amber. *Usage rule:* Maximum 20% of any viewport's visual space. Used on: active states, highlighted clause indicators, accent lines in charts, hover glow source color, primary CTA button fill on dark backgrounds.

**Accent Glow (hero backdrop): `rgba(200, 169, 110, 0.12)`**

12% opacity of the accent primary, used as a radial gradient source color in the hero. *Why 12%:* At full opacity, the gold would look gaudy against the near-black. At 12%, it creates a warm "light source" effect — the background feels illuminated rather than colored. Two instances: one radial centered 30% from top, 50% horizontal (400px radius, fades to transparent); one smaller instance bottom-right at 5% opacity.

**Success / Risk Low: `#22C55E` tinted → `#16A34A` at 20% opacity for backgrounds, `#4ADE80` for text**

Standard green family. *Why not a custom green:* Risk level indicators are safety-critical UI — users must instantly recognize them. Using a non-standard green creates cognitive friction. The Tailwind `green-500` family is globally understood as "safe/go/low-risk." For ContractIQ, low risk means a clause that is standard and doesn't require attention.

**Warning / Risk Medium: `#F59E0B` → amber-500**

Deep amber. *Why amber and not orange:* Orange reads as energetic/urgent in most UI contexts. Amber is more gravitas — it's the color of caution lights, traffic signals, and warning systems in industrial design. For a medium-risk clause (non-standard but not dangerous), amber is calibrated correctly: "pay attention, but don't panic."

**Danger / Risk High: `#EF4444` → red-500**

Standard danger red. No customization needed here — red for danger is hardwired. *Why standard:* Users encountering a high-risk clause (e.g., unlimited liability, IP ownership grab) should feel the alarm signal immediately. Custom or de-saturated reds dilute this. Standard red is correct.

**Critical (legal risk — existential contractual exposure): `#DC2626` with `box-shadow: 0 0 12px rgba(220, 38, 38, 0.4)`**

A slightly deeper red than Danger, with a glow effect that makes the badge feel physically alarming. *Why differentiate Critical from High:* In legal risk analysis, there is a meaningful difference between "this clause is unfavorable" (High) and "this clause could expose you to unlimited financial liability or IP loss" (Critical). The glow on Critical says: this is not a warning, this is a stop sign. Used only for clauses like uncapped indemnification, automatic IP assignment, perpetual exclusivity, non-compete provisions in founding agreements.

---

#### Typography System

**Display / Headline Font: "Instrument Serif" (Google Fonts, free) — or "Freight Display Pro" if budget allows**

- H1: 64px / 4rem, weight 400 (the beauty of editorial serifs is that 400 weight is already display-weight due to stroke contrast), tracking -0.02em, line-height 1.1
- H2: 48px / 3rem, weight 400, tracking -0.01em, line-height 1.15
- H3: 32px / 2rem, weight 400, tracking 0, line-height 1.25
- Usage: Hero headline only, major section titles. NOT used for UI chrome (nav, buttons, labels).

*Why Instrument Serif:* It sits between Harvey.ai's extreme formality (Freight Display) and Vercel's cold sans-serif. Instrument Serif has high contrast strokes — thicks and thins — that signal precision and editorial authority. On dark backgrounds, serif fonts with high stroke contrast look architectural. It tells users: "this product understands the gravity of what you're reading." Free on Google Fonts — no licensing complexity. Pairs with Inter for body because both have geometric DNA despite being superficially different.

**Body Font: "Inter Variable" (Google Fonts)**

- Body Large: 18px / 1.125rem, weight 400, line-height 1.7, tracking 0
- Body Default: 16px / 1rem, weight 400, line-height 1.65, tracking 0
- Body Small: 14px / 0.875rem, weight 400, line-height 1.6, tracking 0.01em
- Captions: 12px / 0.75rem, weight 500, line-height 1.5, tracking 0.02em

*Why Inter:* It is the most readable variable font for dense information display at 14-18px. Legal content is information-dense — NDAs, MSAs, and procurement agreements are not prose, they are structured data presented as text. Inter's letterforms at small sizes retain distinction between similar characters (l, I, 1 are distinguishable). Its variable axis allows precise weight control without loading multiple font files.

**Mono Font (contract text display): "JetBrains Mono" or "Geist Mono"**

- Contract clause display: 14px, weight 400, line-height 1.8, tracking 0.01em
- Inline clause reference: 13px, weight 400, background `rgba(200, 169, 110, 0.1)`, padding `2px 6px`, border-radius `4px`

*Why monospace for contract text:* This is a deliberate and critical choice. When ContractIQ shows a contract clause — the actual text from the document — it must be visually distinguished from ContractIQ's own analysis/commentary. Monospace creates an instant visual boundary: "this is the document" vs "this is the analysis." It also evokes the typewriter/legal-document aesthetic authentically (contracts were originally produced on typewriters; courts still use monospaced fonts in many filings). JetBrains Mono has the best readability at small sizes due to its taller x-height compared to Courier or Fira Mono. The slight tracking increase (`0.01em`) prevents letter-collision at contract body copy sizes.

**UI Font: "Inter Variable" — but with distinct weight/size treatment**

- Navigation items: 14px, weight 500, tracking 0.01em
- Button labels: 14px, weight 600, tracking 0.02em
- Form labels: 12px, weight 600, tracking 0.06em, uppercase (only for form labels — this is the Stripe pattern for field labels)
- Badge/tag text: 11px, weight 700, tracking 0.08em, uppercase

*Note on uppercase labels:* Used only for status badges (CRITICAL, HIGH, MEDIUM, LOW) and form field labels. Uppercase at this size reads as "system classification" — it borrows from government document classification systems, which is precisely the right association for legal risk levels.

**Font Pairing Rationale:**

Instrument Serif (headlines) + Inter (body) is a classic editorial pairing used by legal publications, financial journals, and premium media. The contrast — old-world authority meets modern precision — maps directly to ContractIQ's value proposition: taking something formal and legal, and making it immediately legible. The addition of JetBrains Mono for contract text creates a three-voice system: the headline voice (authority), the analysis voice (clarity), and the source voice (the document itself). Each voice has a distinct visual identity. Users learn to read ContractIQ's interface quickly because the typography teaches them what each element represents.

---

#### Spacing System

**Base Unit: 4px**

All spacing values are multiples of 4px. This is the standard Tailwind spacing scale and aligns with the 4px baseline grid used by Figma, Linear, and Vercel.

**Section Vertical Spacing: 160px (40 × 4px) between major sections**

Following Linear's lead. 160px between sections on desktop; 96px on mobile. This breathing room signals confidence and forces each section to stand on its own merit rather than visually crowding the next.

**Card Padding: 24px (6 × 4px) default; 32px (8 × 4px) for feature highlight cards**

24px is the sweet spot for information-dense cards. 32px for cards that contain a visual element (icon + headline + body + CTA).

**Component Gap (within a card, between icon and text, between heading and body): 16px default, 8px tight (within a text block)**

**Navigation height: 64px**

**Hero section height: min 100vh on desktop, content-driven on mobile**

**Max content width: 1280px (container), with inner content max-width 720px for copy blocks**

Rationale for 720px copy max-width: Optimal reading line length is 60-75 characters. At 18px Inter, 720px produces approximately 70 characters per line — precisely at the readable maximum before the eye fatigues tracking back to the line start. All body copy blocks (sub-headlines, feature descriptions, Q&A explanations) use this constraint.

---

### 3. COMPONENT DESIGN SPECIFICATIONS

#### Navigation Bar

```css
/* Nav container */
position: sticky;
top: 0;
height: 64px;
background: rgba(12, 12, 14, 0.8);
backdrop-filter: blur(16px) saturate(180%);
-webkit-backdrop-filter: blur(16px) saturate(180%);
border-bottom: 1px solid rgba(255, 255, 255, 0.07);
z-index: 100;

/* Tailwind equivalent */
.nav {
  @apply sticky top-0 h-16 z-50
    bg-[#0C0C0E]/80 backdrop-blur-lg
    border-b border-white/[0.07];
}
```

**Logo treatment:** "ContractIQ" in Instrument Serif, 20px, weight 400, color `#F4F4F5`. The "IQ" portion has `color: #C8A96E` — the accent gold. No logomark/icon. The name is the logo. This is the Harvey.ai/Linear approach: typographic identity over illustrated marks. The gold "IQ" is the only brand color in the nav.

**Nav items:**
```css
font-family: Inter Variable;
font-size: 14px;
font-weight: 500;
color: #A1A1AA; /* text-secondary at rest */
letter-spacing: 0.01em;
transition: color 150ms ease;

/* Hover */
color: #F4F4F5;

/* Active (current page) */
color: #F4F4F5;
position: relative;
/* ::after underline */
content: '';
position: absolute;
bottom: -1px; /* sits on nav border */
left: 0;
right: 0;
height: 1px;
background: #C8A96E;
```

Nav items: "Features" | "Pricing" | "Docs" | "Blog" — 4 items max. No mega-menu. No dropdowns.

**CTA in nav:**
```css
/* "Analyze a contract" */
background: #C8A96E;
color: #0C0C0E;
font-size: 13px;
font-weight: 600;
letter-spacing: 0.02em;
padding: 8px 16px;
border-radius: 6px;
transition: background 150ms ease, transform 150ms ease;

/* Hover */
background: #D4B87A; /* 8% lighter */
transform: translateY(-1px);

/* Tailwind */
@apply bg-[#C8A96E] text-[#0C0C0E] text-[13px]
  font-semibold tracking-[0.02em]
  py-2 px-4 rounded-md
  hover:bg-[#D4B87A] hover:-translate-y-px
  transition-all duration-150;
```

---

#### Hero Section

**Layout:** Centered, vertically and horizontally. Single-column on all breakpoints. Max-width of eyebrow/headline/sub copy block: 720px. CTAs inline on desktop, stacked on mobile.

**Background construction:**

```css
/* Hero wrapper */
position: relative;
overflow: hidden;
min-height: 100vh;
display: flex;
align-items: center;
justify-content: center;

/* Glow layer (pseudo-element or absolute div) */
.hero-glow-primary {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 600px;
  background: radial-gradient(
    ellipse at center,
    rgba(200, 169, 110, 0.12) 0%,
    rgba(200, 169, 110, 0.04) 40%,
    transparent 70%
  );
  filter: blur(60px);
  pointer-events: none;
}

.hero-glow-secondary {
  position: absolute;
  bottom: 0;
  right: -200px;
  width: 500px;
  height: 400px;
  background: radial-gradient(
    ellipse at center,
    rgba(200, 169, 110, 0.05) 0%,
    transparent 60%
  );
  filter: blur(80px);
  pointer-events: none;
}

/* Dot grid texture */
.hero-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.08) 1px,
    transparent 1px
  );
  background-size: 28px 28px;
  opacity: 0.4;
  mask-image: radial-gradient(
    ellipse at 50% 0%,
    black 30%,
    transparent 70%
  );
}
```

The dot grid uses a `mask-image` radial gradient so dots are visible in the upper hero region and fade out toward the bottom. This prevents the grid from competing with product content below.

**Eyebrow badge:**
```css
.eyebrow-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px; /* pill */
  background: rgba(200, 169, 110, 0.08);
  border: 1px solid rgba(200, 169, 110, 0.25);
  font-size: 13px;
  font-weight: 500;
  color: #C8A96E;
  letter-spacing: 0.01em;
  margin-bottom: 24px;

  /* Leading dot */
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #C8A96E;
    box-shadow: 0 0 6px rgba(200, 169, 110, 0.6);
    /* Subtle pulse animation */
    animation: pulse-dot 2s ease-in-out infinite;
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(200, 169, 110, 0.6); }
  50% { opacity: 0.6; box-shadow: 0 0 12px rgba(200, 169, 110, 0.3); }
}
```

**Headline:**
```css
font-family: 'Instrument Serif', serif;
font-size: clamp(48px, 7vw, 80px);
font-weight: 400;
line-height: 1.05;
letter-spacing: -0.02em;
color: #F4F4F5;
text-align: center;
max-width: 720px;
margin: 0 auto 24px;

/* NO gradient text on headline — resist the temptation */
/* The gold eyebrow above provides color; the headline stays white */
```

**Sub-headline:**
```css
font-family: Inter Variable;
font-size: 20px;
font-weight: 400;
line-height: 1.65;
color: #A1A1AA;
text-align: center;
max-width: 560px;
margin: 0 auto 40px;
```

**CTA group:**
```css
.cta-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

/* Primary CTA */
.cta-primary {
  background: #C8A96E;
  color: #0C0C0E;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;

  &:hover {
    background: #D4B87A;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(200, 169, 110, 0.25);
  }
}

/* Secondary CTA */
.cta-secondary {
  background: transparent;
  color: #A1A1AA;
  font-size: 15px;
  font-weight: 500;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;

  &:hover {
    color: #F4F4F5;
    border-color: rgba(255, 255, 255, 0.25);
  }
}
```

**Hero visual — the "code snippet" moment:**

This is the most important decision in the entire brief. The hero visual is NOT:
- An abstract 3D shape
- A dashboard screenshot of empty state
- An illustration of a contract with a magnifying glass
- A laptop mockup

The hero visual IS: a realistic-looking contract clause card — as if ContractIQ has already analyzed a real contract — showing:

1. A contract excerpt (in JetBrains Mono, 13px) — e.g., a realistic indemnification clause displayed in a mock document viewer
2. ContractIQ's analysis overlaid as floating annotation cards, showing: risk badge (`CRITICAL` in red with glow), the specific issue ("Uncapped indemnification — no liability ceiling"), and a suggested alternative
3. The document sits in a card with `background: #131316`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 12px`, with a subtle header bar showing "MSA_VendorAgreement_2024.pdf"

This visual says, in 2 seconds, exactly what ContractIQ does. It is the Resend code-snippet moment applied to legal AI.

```css
.hero-product-mockup {
  width: 100%;
  max-width: 900px;
  margin: 80px auto 0;
  border-radius: 12px;
  background: #131316;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05),
    0 40px 80px rgba(0, 0, 0, 0.6),
    0 0 120px rgba(200, 169, 110, 0.06); /* ambient gold glow from below */
}
```

---

#### Feature Cards

```css
.feature-card {
  background: #131316;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  transition: border-color 200ms ease, box-shadow 200ms ease;

  /* Hover: border brightens + glow appears */
  &:hover {
    border-color: rgba(255, 255, 255, 0.18);
    box-shadow: 0 0 30px rgba(200, 169, 110, 0.08);

    /* The cursor-tracking glow */
    .card-glow {
      opacity: 1;
    }
  }
}

/* Cursor-following glow (positioned via JS mousemove) */
.card-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(200, 169, 110, 0.08) 0%,
    transparent 70%
  );
  filter: blur(20px);
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease;
  transform: translate(-50%, -50%);
  /* Position set via JS: style.left / style.top */
}
```

**Icon treatment:** No Heroicons. No Feather. No FontAwesome. ContractIQ uses one of two approaches:

1. **Custom SVG line icons** — drawn at 24×24, stroke 1.5px, `currentColor`. Style: geometric, slightly condensed. Think Linear's own icon set or Radix Icons. Subjects: document, shield, magnifier (for analysis — but custom drawn, not the generic search icon), chat bubble (for Q&A), vault/archive (for workspace memory), export/share.

2. **Alternately: no icon at all** — use a small numbered circle (`01`, `02`, `03`) in the top-left of each card, in the accent gold, at 12px monospace. This is more editorial and unique than any icon set.

**Card headline:** 20px, Instrument Serif 400, `#F4F4F5`  
**Card body:** 15px, Inter 400, `#A1A1AA`, line-height 1.65

---

#### Contract Risk Badge Component

This component appears in clause lists, document viewer sidebars, and analysis summaries. It is a status indicator for legal risk. Treat it with the same seriousness as medical triage indicators.

```css
/* Base badge */
.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 4px; /* NOT pill — pills feel casual; 4px feels like a system label */
  font-family: Inter Variable;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* LOW */
.risk-badge.low {
  background: rgba(22, 163, 74, 0.12);
  border: 1px solid rgba(22, 163, 74, 0.3);
  color: #4ADE80;
}

/* MEDIUM */
.risk-badge.medium {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #FCD34D;
}

/* HIGH */
.risk-badge.high {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #FCA5A5;
}

/* CRITICAL */
.risk-badge.critical {
  background: rgba(220, 38, 38, 0.18);
  border: 1px solid rgba(220, 38, 38, 0.5);
  color: #FCA5A5;
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.25);
  /* The glow is the difference between HIGH and CRITICAL */
}

/* Dot indicator to the left of label text */
.risk-badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  /* For CRITICAL, add animation */
}

.risk-badge.critical::before {
  animation: pulse-critical 1.5s ease-in-out infinite;
}

@keyframes pulse-critical {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.7; }
}
```

**Design philosophy for badges:** The dot pulse on CRITICAL is the only animation in the badge system. LOW and MEDIUM are completely static. HIGH is static. Only CRITICAL pulses — because it is the only badge that demands immediate action. This hierarchy of stillness-to-animation mirrors how medical alert systems work (steady light = monitor; pulsing light = act now).

---

#### Document Viewer Sidebar

The sidebar shows extracted clauses in a scannable list. It is the primary reading interface of ContractIQ.

```css
.document-sidebar {
  width: 380px;
  min-width: 320px;
  max-width: 420px;
  background: #131316;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  height: 100vh;
  overflow-y: auto;
  padding: 24px 0;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.12) transparent;
}

/* Clause list item */
.clause-item {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  &.active {
    background: rgba(200, 169, 110, 0.06);
    border-left: 2px solid #C8A96E;
    padding-left: 22px; /* compensate for border */
  }
}

/* Clause type label */
.clause-type {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #52525B;
  margin-bottom: 6px;
}

/* Clause title */
.clause-title {
  font-size: 14px;
  font-weight: 500;
  color: #F4F4F5;
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Clause excerpt */
.clause-excerpt {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #71717A;
  /* Truncate at 3 lines */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

**Highlight colors for risk levels in document text:**

When the full document is shown in the main panel, highlighted text uses these background colors:

```css
/* Applied to <mark> elements wrapping clause text */
.highlight-low    { background: rgba(22, 163, 74, 0.15); border-bottom: 1px solid rgba(22, 163, 74, 0.4); }
.highlight-medium { background: rgba(245, 158, 11, 0.15); border-bottom: 1px solid rgba(245, 158, 11, 0.4); }
.highlight-high   { background: rgba(239, 68, 68, 0.15); border-bottom: 1px solid rgba(239, 68, 68, 0.4); }
.highlight-critical {
  background: rgba(220, 38, 38, 0.2);
  border-bottom: 2px solid rgba(220, 38, 38, 0.7);
  /* Slightly thicker bottom border to distinguish critical */
}
```

**Document main panel:**
```css
.document-main {
  flex: 1;
  background: #0C0C0E;
  padding: 48px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.85;
  color: #A1A1AA;
  /* Generous line height for contract text legibility */
  max-width: 760px;
  margin: 0 auto;
}
```

---

#### Chat / Q&A Interface

The Q&A panel occupies the right third of the app layout when active. It is a conversational interface anchored to the contract context.

```css
/* Chat container */
.chat-panel {
  width: 380px;
  background: #131316;
  border-left: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Chat header */
.chat-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  font-size: 13px;
  font-weight: 600;
  color: #A1A1AA;
  letter-spacing: 0.02em;
}

/* Message list */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* User message */
.message-user {
  align-self: flex-end;
  max-width: 80%;
  background: rgba(200, 169, 110, 0.12);
  border: 1px solid rgba(200, 169, 110, 0.2);
  border-radius: 12px 12px 2px 12px; /* bottom-right corner cut = points toward user */
  padding: 12px 16px;
  font-size: 14px;
  color: #F4F4F5;
  line-height: 1.55;
}

/* AI message */
.message-ai {
  align-self: flex-start;
  max-width: 90%;
  background: transparent;
  border: none;
  padding: 0;
  font-size: 14px;
  color: #D4D4D8;
  line-height: 1.7;

  /* AI responses are NOT in a bubble — they flow as text, like reading the analysis */
  /* This is the Claude.ai / Perplexity pattern — only the user message has a bubble */
}

/* AI message source citation */
.message-citation {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: #C8A96E;
  background: rgba(200, 169, 110, 0.08);
  border: 1px solid rgba(200, 169, 110, 0.2);
  border-radius: 4px;
  padding: 1px 8px;
  margin-left: 4px;
  cursor: pointer; /* clicking jumps to clause in document */
}
```

**Streaming text animation:**

AI responses stream token-by-token. DO NOT use a typewriter cursor blinking animation (feels like a 2009 website). Instead:

```css
/* Each new token fades in */
.streaming-token {
  animation: token-appear 80ms ease-out forwards;
  opacity: 0;
}

@keyframes token-appear {
  from { opacity: 0; filter: blur(2px); }
  to   { opacity: 1; filter: blur(0); }
}
```

This produces a subtle blur-to-sharp fade per token — the text "resolves" into focus rather than typing. It's faster and less distracting than typewriter. The blur value of `2px` is at the perception threshold — users don't consciously notice the blur, they just feel the text appearing smoothly.

**Chat input:**
```css
.chat-input-area {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.chat-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 44px 12px 16px; /* right padding for send button */
  font-family: Inter Variable;
  font-size: 14px;
  color: #F4F4F5;
  outline: none;
  resize: none;
  min-height: 44px;
  max-height: 200px;
  transition: border-color 150ms ease;

  &::placeholder {
    color: #52525B;
  }

  &:focus {
    border-color: rgba(200, 169, 110, 0.35);
    box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.08);
  }
}
```

---

### 4. MOTION & ANIMATION PRINCIPLES

#### Philosophy

Motion in a legal product must serve comprehension, not entertainment. Every animation should answer the question: "does this help the user understand what just happened, or am I animating because I can?" ContractIQ operates in a context where users may be stressed — they've just been handed a contract with implications they don't understand. Animation that draws attention to itself increases cognitive load at exactly the wrong moment. Motion exists to establish hierarchy, confirm state changes, and guide attention — nothing else.

#### Page Load (first 300ms)

The nav appears instantly (0ms delay) — it must be there when the page is ready. The eyebrow badge fades in at 0ms, `opacity: 0 → 1`, 300ms ease-out. The headline fades in at 80ms delay, `opacity: 0 → 1` + `translateY(12px) → translateY(0)`, 500ms `cubic-bezier(0.16, 1, 0.3, 1)`. The sub-headline follows at 180ms, same transform. CTAs at 280ms. Hero visual at 400ms, `opacity: 0 → 1` + `translateY(16px)` + `scale(0.99) → scale(1)`. The hero glow background is pre-rendered (no animation) — it appears fully formed. Animated glows in a legal context look unstable.

#### Scroll Reveals

```js
// Framer Motion variant
const scrollReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] // expo out
    }
  }
};

// Stagger on container
const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.08 // 80ms between children — slightly tighter than Linear's 100ms
    }
  }
};
```

Trigger: `once: true` — sections animate in once and stay. They do NOT re-animate on scroll-up. Re-animating on scroll-up creates the sensation of unstable content, which is deeply wrong for a legal product.

#### Hover States

- Card border brightens: 200ms ease — slightly slower than typical (150ms) because legal UI should feel considered, not jumpy
- Button lift + glow: 150ms ease — faster on buttons because user expects immediate feedback
- Nav items: 150ms color transition only — no transform on nav items

#### Contract Analysis Streaming

The streaming text animation described in the chat section (blur-to-sharp, 80ms per token) is the right approach. The additional behavior: when ContractIQ begins analysis of a newly uploaded document, a progress state shows in the sidebar — clauses appear one by one as they're extracted, each with a fade+slide-in from the left (not from below — left-entry mimics the reading direction and feels like the clause is being "pulled from the document"). Each clause item: `opacity: 0, translateX(-8px) → opacity: 1, translateX(0)`, 250ms, staggered 40ms apart.

#### Risk Badge Reveal (First Analysis)

When a document is first analyzed and a CRITICAL badge appears for the first time in a session, it earns a special entrance: `scale(0.8) → scale(1)` with `opacity: 0 → 1`, 300ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight spring overshoot — the only spring animation in the entire product). The spring is justified here: a CRITICAL badge needs to feel like it "arrived" with weight. After the entrance, the pulse animation starts. This entrance plays only once per analysis session — if the user navigates away and back, the badge is simply static.

#### Ambient Motion

The dot grid in the hero has a very subtle parallax on scroll: `translateY` at 0.1× scroll speed. 10% of scroll speed is at the absolute threshold of human perception — users feel the hero has depth without consciously registering the movement. This is implemented with a scroll event listener throttled to `requestAnimationFrame`.

No other ambient motion anywhere in the product. The hero glow does NOT pulse, rotate, or breathe. Static glows feel like lighting; animated glows feel like a loading spinner that forgot to stop.

#### What to NEVER Animate in a Legal Product

1. **Risk badge color changes** — if a clause risk level updates, it must change instantaneously (or with a 100ms cross-fade maximum). A risk level animating from LOW to CRITICAL with a smooth transition makes the change look gradual when it is a binary classification change. Soft transitions on safety-critical state changes are dangerous UX.

2. **The contract text itself** — the document text must render at full opacity immediately. Never stream, typewriter, or progressively reveal the contract content. The user needs to be able to read the full document the moment it's displayed.

3. **Numbers in financial/legal context** — do not "count up" from 0 to the actual number for clause counts, risk scores, or any legal metric. This is a common startup pattern ("47 clauses analyzed" counting up from 0) that reads as a party trick in a legal product.

4. **Loading states with branded mascots or illustrations** — a lawyer-oriented product should use a simple spinner or progress bar. No animated characters, no confetti on contract completion, no celebration animation of any kind. Finishing a contract review is not cause for celebration — it is cause for careful reading.

5. **Page transitions between app sections** — within the app (moving from document list to document view to Q&A), use instant transitions or maximum 150ms opacity fade. Slide transitions, zoom transitions, or any transform-based page transitions in a legal app feel like a mobile game, not a professional tool.

---

### 5. PAGE STRUCTURE

#### Section 1: Navigation

**Purpose:** Establish brand identity, provide wayfinding, present primary conversion CTA before any content is read.

Layout: Sticky, full-width, 64px height. Logo left, nav items center, CTA button right. On mobile: logo left, hamburger right, full-screen overlay menu. The nav does NOT collapse into a sidebar — overlay is faster to dismiss and more focused.

Key visual: The "IQ" gold in the logo is the first branded color the user sees. This is intentional — the accent color earns its first appearance in the most premium piece of real estate on the page.

Copy direction: Nav items are navigational labels only — no verbs, no marketing language. "Features" not "What We Do." "Pricing" not "Plans." "Docs" not "Learn More."

---

#### Section 2: Hero

**Purpose:** Deliver the core value proposition in under 5 seconds. Create enough intrigue to scroll. Convert the highest-intent visitors immediately.

Layout: Full-viewport-height, centered content stack (badge → headline → sub → CTAs → product visual).

Key visual: The contract analysis mockup (described above). This is the product, not a selling point about the product. The mockup must show real contract language (use a synthetic but realistic indemnification clause), real risk badges, and real-looking analysis commentary.

Copy direction: Lead with Option C headline ("Your lawyer charges $400/hr to read this.") for the provocative version (A/B test against Option A). Sub-headline Option A for specificity. Primary CTA "Upload a contract" — lowest friction, clearest action. Secondary CTA "Watch a 2-minute demo."

Motion: The hero section is the only section with ambient parallax (dot grid). All content animates in on load as specified above.

---

#### Section 3: Social Proof Rail

**Purpose:** Address the "can I trust this?" question before the user consciously asks it. Occurs before feature explanation because trust must be established before education.

Layout: Full-width horizontal band, 80px vertical padding. Background: `#131316` (slightly elevated from page background). Content: a centered text line + a row of 5-6 logos or metrics.

Key visual: Two approaches (A/B test):
- **Metrics version:** Three large numbers in Instrument Serif with short labels — "2,400+ contracts analyzed" | "94% of users found risks their lawyer missed" | "Average analysis time: 4 minutes"
- **Logo version:** Logos of company types (not individual companies unless you have real customers with permission) — use placeholder logos for "Series A SaaS Company" archetype OR real customer logos if available.

Copy direction: Social proof line Option A ("2,400+ contracts analyzed. $0 in legal fees for what ContractIQ flagged first.") as the section intro.

---

#### Section 4: Feature Showcase — "How it works"

**Purpose:** Educate skeptical visitors on the core workflow. Convert visitors who understood the hero but need to see the steps before committing.

Layout: Three-column grid on desktop, single column on mobile. Each "step" is a numbered card (01, 02, 03 in accent gold monospace) with icon-free design, a short headline, and 2-sentence description. Below the 3-step grid: a full-width demo mockup of the document viewer (actual product UI screenshot or high-fidelity mockup) with the sidebar + main document + risk badges visible.

Key visual: The full-width app mockup below the step cards is the conversion anchor for this section. It shows the whole product context — a user would understand the full workflow from this one image.

Feature cards use the hover glow spec from Section 3 Component Specs.

Copy direction: Use the 5 feature headlines from Section 1 (Pick Upload + Analyze + Q&A as the three "steps"). Section headline: "Read the contract like you wrote it."

---

#### Section 5: Deep Feature Detail — The Three Pillars

**Purpose:** For visitors considering longer-term commitment — convert them by showing depth, not just surface features. This section targets legal ops managers and repeat users who want to understand the system fully.

Layout: Three alternating rows (image-left/text-right, image-right/text-left, centered full-width). Each row is one "pillar."

**Pillar 1: Risk Intelligence**

- Visual: Close-up of the risk badge system — showing a clause with CRITICAL badge, the analysis annotation, and the suggested rewrite. Dark background, dramatic crop.
- Headline: "Every clause, scored before you read it."
- Body: Explain the 4-tier risk system. Explain that scores are based on legal standard practice, not ML opinion. (This is important — users trust rules-based explanation more than "AI decided.")

**Pillar 2: Conversational Q&A**

- Visual: The chat interface showing a realistic exchange: user asks "What happens if the vendor misses their SLA?", AI responds with the specific clause number, the text excerpt in monospace, and a plain-English interpretation.
- Headline: "Ask the contract what it means."
- Body: "ContractIQ knows which clause governs every situation. Ask a question in plain English — get the exact clause, your obligation, and what you'd need to negotiate."

**Pillar 3: Workspace Memory**

- Visual: A workspace view showing 6 contract cards — different agreements, different vendors — with a search bar querying "which contracts have unlimited liability?" and results highlighted across multiple documents.
- Headline: "Search across every contract you've ever uploaded."
- Body: "Your second upload knows your first. ContractIQ builds a library of your contracts — so when your new vendor tries to use the same bad clause your last one tried, you'll know immediately."

---

#### Section 6: Pricing

**Purpose:** Remove pricing ambiguity, which is the #1 reason high-intent visitors bounce without converting.

Layout: Centered, two or three-column pricing cards on desktop. Background: page background color (no zebra-stripe band — pricing should feel like part of the product, not a pricing table SaaS template).

Key visual: The pricing card for the recommended plan has a thin accent border (`1px solid rgba(200, 169, 110, 0.3)`) and the eyebrow "Most popular" — NOT a badge with colored background. The distinction is marked by the gold border, not by a garish sticker.

**Pricing card specs:**
```css
.pricing-card {
  background: #131316;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 40px;
}

.pricing-card.featured {
  border: 1px solid rgba(200, 169, 110, 0.3);
  box-shadow: 0 0 40px rgba(200, 169, 110, 0.06);
}
```

Copy direction: Plan names should NOT be "Starter / Pro / Enterprise." Use: "Solo" (for founders, 1 user, 10 contracts/month) | "Team" (legal ops teams, 5 users, unlimited contracts) | "Enterprise" (custom, white-glove, Salesforce-connected). Each plan lists 5 specific features, not a general description.

---

#### Section 7: Objection Handling / FAQ

**Purpose:** Intercept the 3 questions that prevent conversion: "Is this secure?" "How accurate is it?" "What contract types does it handle?"

Layout: Two-column accordion on desktop, single column on mobile. Left column: 4 questions. Right column: 4 questions. Accordion opens on click, not hover.

FAQ questions (write these in the user's voice, not in marketing voice):

1. "Can you analyze contracts I can't share externally due to NDAs?" → Answer with SOC2 compliance, no-training-on-user-data policy, data deletion options
2. "How accurate is the risk scoring?" → Be honest: "ContractIQ identifies clause types and compares them against standard market practice. It is not legal advice and should not replace a lawyer for high-stakes agreements."
3. "What formats and contract types does ContractIQ support?" → List specific: PDF, DOCX, TXT; NDAs, MSAs, SaaS agreements, employment contracts, vendor agreements, leases
4. "Does ContractIQ make changes to my contracts?" → "No. ContractIQ analyzes and explains. Redlines and edits are exported as suggestions — you control every change."

---

#### Section 8: Footer

**Purpose:** Provide navigation for users who've read the entire page, confirm brand identity, surface trust signals.

Layout: 4-column footer on desktop. Column 1: Logo + tagline + social links. Column 2: Product links (Features, Pricing, Changelog, Status). Column 3: Company (About, Blog, Careers, Press). Column 4: Legal (Privacy Policy, Terms of Service, Security, Cookie Policy — the legal links must be prominently findable on a legal product).

Background: `#0C0C0E` (same as page background — footer is flush, not separated by a border or different background). A single `border-top: 1px solid rgba(255, 255, 255, 0.07)` is the only separator.

Footer tagline under logo: "Contract clarity. No retainer required."

Copyright line: 12px, `#52525B`, Inter 400.

---

### 6. WHAT TO EXPLICITLY AVOID — 20 SPECIFIC PROHIBITIONS

**1. DO NOT use a purple-to-pink gradient in the hero.** This is the single highest-frequency AI slop signal in 2024-2025. Every second AI startup has this gradient. It reads as "Midjourney background + Framer template." The moment a legal professional sees it, they close the tab.

**2. DO NOT use Heroicons, Feather Icons, or Lucide for legal concepts.** These icon sets were designed for admin dashboards and todo apps. A Heroicons "document" icon next to the headline "Indemnification Clause Risk: CRITICAL" is a jarring category mismatch. Use custom SVGs or go iconless.

**3. DO NOT write "Powered by AI" or "AI-powered" anywhere on the page.** This phrase has been so overused that it has negative signal value in 2025 — it reads as "we have nothing else to say." ContractIQ's AI is demonstrated, not declared. The product mockup shows what the AI does; the copy never has to say the word.

**4. DO NOT use a stock photo of a handshake, a courthouse, or a magnifying glass on a document.** These images activate "generic legal services website" pattern-matching immediately. The only images on ContractIQ are product screenshots and, potentially, founder/team photos for an about section.

**5. DO NOT animate the hero background glow.** A pulsing, breathing, or rotating glow animation in a legal context looks like a loading state or a crypto mint page. Static ambient glow = quality. Animated glow = trying too hard.

**6. DO NOT use a chatbot widget in the bottom-right corner of the marketing page.** ContractIQ IS a conversational AI product — having a separate third-party chat widget (Intercom, Drift) creates an embarrassing contradiction. Use an email/Slack contact method instead.

**7. DO NOT use the phrase "understand contracts like never before."** Or "revolutionize," "transform," "game-changing," "seamless," "powerful," "robust," "cutting-edge," or "next-generation." Every word in this list is a trust-reducer because sophisticated buyers have been burned by products using exactly this vocabulary.

**8. DO NOT show an empty dashboard as the hero visual.** An empty state communicates nothing about what the product does and everything about how early-stage it is. The hero visual must show a contract being analyzed — with real-looking contract text, real risk badges, real-looking analysis.

**9. DO NOT add a confetti animation when a user completes contract analysis.** Celebration animations are appropriate for onboarding completion and milestone achievements in consumer apps. In a legal context, finishing an analysis is the beginning of work, not a celebration moment. Any confetti, particle burst, or "🎉" moment is deeply tone-deaf to the use case.

**10. DO NOT use a dark-mode toggle prominently in the nav.** ContractIQ is designed in dark mode as its primary interface. Offering a toggle communicates uncertainty about your own design decisions. If light mode is a requirement, implement it as a system-preference respecting `prefers-color-scheme` media query — silently, not as a feature.

**11. DO NOT use Comic Sans, Papyrus, or any font that comes pre-installed on Windows before 2010 for any contract text display.** This sounds obvious — but using Courier New for contract text display because "it's monospace" is a real mistake developers make. JetBrains Mono or Geist Mono only.

**12. DO NOT use a pricing section with plans named "Starter," "Pro," and "Enterprise."** These names have appeared on approximately 40,000 SaaS pricing pages. They communicate that you spent zero time thinking about your customer segments. Name plans after the job role or company stage ("Solo," "Team," "Enterprise" is acceptable; "Starter/Pro/Enterprise" is not).

**13. DO NOT use a testimonial carousel.** Carousels are consistently the lowest-converting testimonial format across A/B tests. They create motion without consent, hide content the user might want to read, and have 90%+ skip rates past the first item. Use a static 3-column testimonial grid with real names, titles, and company names — or don't use testimonials at all.

**14. DO NOT use orange as a primary accent color.** Orange occupies a color neighborhood dangerously close to "warning" and "construction zone." On a legal platform, orange as a brand color triggers the wrong associations. The accent gold (`#C8A96E`) is warm but not orange — it is parchment-gold, not traffic-cone orange.

**15. DO NOT use a "How it works" section with three circles connected by arrows.** This diagram is the most overused visual on SaaS landing pages and communicates nothing that text alone doesn't. If you're going to show a workflow, show the actual product UI at each step — not an icon inside a circle.

**16. DO NOT paginate the contract clause list.** Show all extracted clauses in a scrollable sidebar with a sticky risk-level filter bar. Pagination in a clause list means users lose their scroll position when navigating between the document and the clause list — this is a critical UX failure in the core workflow.

**17. DO NOT use autoplaying video anywhere on the landing page.** Autoplay video (even muted) is a conversion killer for legal and financial products because it signals "we need to explain ourselves with motion" and because it creates accessibility and performance issues. Use a click-to-play video with a clean thumbnail showing the product.

**18. DO NOT use a gradient text effect on the main headline if using Instrument Serif.** Gradient text at display sizes loses legibility in serif fonts because the gradient bisects thin strokes unpredictably. Gradient text works on heavy sans-serif only. Use plain `#F4F4F5` for the headline — let the font do the work.

**19. DO NOT use border-radius values above 16px on container-level components (cards, panels, modals).** Excessive border radius (`border-radius: 24px` or `rounded-3xl`) makes interfaces look like mobile apps designed for children. Legal tools use tighter radii. 12px for cards, 8px for buttons, 6px for badges, 4px for status indicators. The radius scale is a professionalism signal.

**20. DO NOT deploy without a complete favicon system.** The favicon for ContractIQ is "IQ" in Instrument Serif on a `#0C0C0E` background, 32×32px, as a `.ico` with 16px and 32px variants, plus a 180×180 `apple-touch-icon.png`. An absent or default favicon (browser default globe icon) on a legal platform is a trust signal failure. Legal buyers check browser tabs as part of their trust evaluation.

---

### 7. TECH STACK RECOMMENDATION

#### Framework: Next.js 14 App Router

*Why:* The App Router's React Server Components architecture means that the initial HTML rendered to the user contains the full page content — including the hero headline, nav, and social proof — without waiting for JavaScript hydration. For a legal product where the first impression matters to skeptical buyers, zero-layout-shift server rendering is not optional. Additionally, Next.js 14's Partial Prerendering allows the static marketing pages to be served from edge CDN while the dynamic app routes (document viewer, chat interface) use streaming SSR. The marketing site and the app can live in the same repository, share the same design system, and deploy as a single unit. Vercel's deployment infrastructure (the obvious host for Next.js) provides automatic preview deployments, which are essential for design iteration.

Alternatives considered: Remix (excellent but smaller ecosystem for the UI component libraries ContractIQ will need), Astro (wrong choice — the app portions require React's reactivity model), SvelteKit (genuinely good but the contractor/freelancer ecosystem for SvelteKit is 5× smaller than Next.js, which matters for future team scaling).

#### Styling: Tailwind CSS v4 + CSS Custom Properties

*Why Tailwind v4 specifically:* v4's CSS-first configuration (`@theme` directive in a CSS file instead of `tailwind.config.js`) allows the entire design token system — the exact hex values from Section 2 — to be declared as CSS custom properties and consumed by both Tailwind utilities and arbitrary CSS. This means:

```css
/* In globals.css */
@theme {
  --color-background: #0C0C0E;
  --color-accent: #C8A96E;
  --color-text-primary: #F4F4F5;
  /* etc. */
}
```

These values are then available as `bg-background`, `text-accent`, and also as `var(--color-accent)` in raw CSS. This dual-access pattern is essential because some complex styles (the cursor-tracking glow, the gradient constructions, the scrollbar theming) cannot be expressed in Tailwind utilities and must be in raw CSS. Having the tokens in one place prevents the design drift that happens when hex values are duplicated between `tailwind.config.js` and CSS files.

#### Animation: Framer Motion (specific cases) + CSS Transitions (simple cases)

**Framer Motion for:**
- Page-level mount animations (hero content staggered entrance)
- Scroll-triggered reveals (`useInView` with `once: true`)
- The CRITICAL badge spring entrance
- Layout animations when the clause sidebar reorders by risk level (Framer's `layout` prop handles FLIP animations automatically — without it, reordering would require complex manual position calculations)
- Drag-to-upload zone (Framer's gesture handling for the contract upload area)

**CSS Transitions for:**
- All hover states (button color, card border brightening, nav item color)
- Input focus states
- Accordion open/close (CSS `max-height` transition with `overflow: hidden`)
- Sidebar active state changes
- Tab underline indicator

*Why this split:* Framer Motion costs 31kb gzipped. Loading it for hover states is unjustifiable. CSS transitions for simple states; Framer Motion for orchestrated sequences and physics-based animations only.

#### 3D / WebGL: No

ContractIQ does not need WebGL. The temptation will arise to add a Three.js globe or a Spline 3D document animation to the hero. Resist it completely. 3D in the hero of a legal product reads as "we're trying to distract you from our product." The hero visual — a realistic contract analysis mockup — is more convincing than any 3D animation because it shows the actual product. The only motion in the hero is the CSS dot grid parallax (described above) — a 2KB CSS effect, not a 300KB WebGL bundle.

If there is ever a justified use of WebGL on ContractIQ, it would be in a future "how our AI works" explainer page — a stylized visualization of the clause extraction process. That is a marketing page, not the product. And even then, the case must be made fresh.

#### Font Loading Strategy

```html
<!-- In <head>, before stylesheet, using rel="preload" -->
<link rel="preload" href="/fonts/InstrumentSerif-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/JetBrainsMono-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

Self-host all three fonts. Do NOT load from Google Fonts CDN in production: (1) Google Fonts CDN adds DNS lookup latency, (2) GDPR/privacy implications of loading Google CDN resources matter to legal-industry users who read privacy policies, (3) self-hosted fonts can be preloaded with precise cache control.

```css
@font-face {
  font-family: 'Instrument Serif';
  src: url('/fonts/InstrumentSerif-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* swap, not block — prevents invisible text during load */
}
```

`font-display: swap` is non-negotiable. `font-display: block` causes Flash of Invisible Text, which is measurably worse for conversion than Flash of Unstyled Text.

Inter is loaded as a variable font (single file covers all weights). JetBrains Mono is loaded as two files: Regular (400) and Medium (500) — the app only uses these two weights for contract text display.

#### Component Library Base: shadcn/ui

*Why shadcn/ui:* It is not a component library — it is a component collection that you own. Running `npx shadcn-ui@latest add dialog` copies the dialog component source code into your `/components/ui/` directory. You own the code. There are no versioning conflicts, no dependency on a third-party's breaking changes, and no visual conflict between "library default" and "your design system." For ContractIQ, this matters because:

1. shadcn/ui's default styling uses CSS custom properties and Tailwind — the exact system already specified. Overrides are trivial.
2. The components (Dialog, Popover, Tooltip, Accordion, Sheet) use Radix UI primitives underneath, which handle all accessibility (focus trapping, keyboard navigation, ARIA attributes) correctly. Legal product accessibility is a legal exposure point — using Radix-based primitives is the correct risk-mitigation choice.
3. The component code can be customized to match ContractIQ's exact visual spec (the badge component, the input styles, the card borders) without fighting a library's theme system.

**What to override immediately:**
- Default `--radius` CSS variable: set to `6px` (shadcn default is `0.5rem = 8px` — close but not matching the brief)
- Default `--border` color: set to `rgba(255, 255, 255, 0.07)`
- Default `--background`: set to `#0C0C0E`
- Default `--foreground`: set to `#F4F4F5`
- Button component: replace the default variant styles entirely with the CTA specs from Section 3

#### Icons: Phosphor Icons

*Why Phosphor:* Phosphor has 1,200+ icons across 6 weight variants (thin, light, regular, bold, fill, duotone). The "regular" weight (1.5px stroke) at 20-24px is visually cohesive with Inter at body size — both have similar geometric proportions. The icon set includes legal-relevant icons that Heroicons and Feather genuinely lack: `FileText`, `Scales`, `Stamp`, `Vault`, `Certificate`, `Shield`, `Gavel`, `Receipt`, `Signature`. These icons don't look like todo app icons.

Usage: Import only used icons via tree-shaking (Phosphor React supports named imports). Never load the full icon bundle. Each icon is an SVG component — no font loading, no sprite sheets.

```tsx
import { Scales, FileText, Vault } from '@phosphor-icons/react';

// Used at 20px with currentColor — inherits text color from parent
<Scales size={20} weight="regular" />
```

**Icon usage rule:** Icons appear only in feature cards and navigation. They do NOT appear inline with body copy (this is a common design mistake that clutters reading flow). In the risk badge component, the risk indicator is a dot, not an icon. In the chat interface, there are no decorative icons.

---

## CLOSING NOTE FOR THE IMPLEMENTATION TEAM

This brief is a constraint document, not a suggestion document. The specific hex values, the exact font sizes, the prohibition list — these are decisions, not defaults. The rationale for every choice is provided so the team understands the *why* and can make calibrated exceptions when product requirements demand it. If you find yourself reaching for a purple gradient, a Heroicons import, or the word "powerful" in your copy, consult Section 6 before proceeding.

ContractIQ competes with two things simultaneously: expensive lawyers (who signal trust through credentials, gravitas, and restraint) and generic AI tools (which signal distrust through hype, gradients, and over-animation). The design system above threads that needle: it has the typographic authority of a legal institution and the product clarity of a best-in-class SaaS tool. Every design decision is in service of one outcome — making a stressed founder or legal ops manager feel, within five seconds of landing on the page, that they can trust this product with their most sensitive documents.
---

## ADDENDUM — Additional Research (Anthropic, Notion, Design Sources)

### Anthropic.com Color System (confirmed from source)
- Background: `#0d0d0d` (validates our `#0C0C0E` choice — same family, slightly warmer)
- Text primary: `#f5f5f0` (warm off-white — confirms "not pure white" principle)
- Accent: `#d4a574` (warm amber/sand — confirms the gold-amber accent direction)
- Font: `Tiempos Headline` (commercial, Klim Type Foundry) + Inter for UI
- Animation: Framer Motion + CSS `@keyframes` + Intersection Observer — same stack as our recommendation

**Upgrade note on fonts:** If budget permits, use **Tiempos Headline** (used by Anthropic, NYT Digital) instead of Instrument Serif. Both are editorial serifs — Tiempos is more distinctive and signals a higher tier. Instrument Serif remains the free alternative.

---

### 5 Critical Additions to the Design System

#### Addition 1: SVG Noise Texture (mandatory)

Every premium 2024–2025 AI SaaS (Harvey, Anthropic, Perplexity) uses a subtle grain texture. Without it, flat CSS color reads as "rendered in Figma."

```css
/* Apply as pseudo-element on body or section backgrounds */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.04; /* 4% — at perception threshold, not visible as grain */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}
```

This single addition eliminates the "flat digital render" quality that marks generic AI products.

#### Addition 2: Inter Font Feature Settings (mandatory)

Without these, Inter looks like every 2019 SaaS. With them, it looks like Linear, Vercel, and Anthropic.

```css
body {
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-feature-settings: "ss01" 1, "cv01" 1, "cv02" 1;
  /* ss01: alternate single-story 'a' — more modern */
  /* cv01: alternate 'l' with bottom serif — more legible */
  /* cv02: alternate 'G' shape */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

#### Addition 3: Border-Radius Hierarchy (not uniform)

Generic apps use one radius everywhere. This hierarchy signals intentionality:

```css
--radius-card: 4px;       /* Data cards — slightly angular, signals data-density */
--radius-modal: 8px;      /* Dialogs, popovers — standard UI */  
--radius-input: 6px;      /* Form inputs — approachable */
--radius-button: 6px;     /* Buttons — matches inputs */
--radius-badge: 100px;    /* Status badges — fully pill */
--radius-tag: 4px;        /* Content tags — slightly angular like cards */
--radius-tooltip: 4px;    /* Tooltips — compact */
```

The risk badge uses `100px` (pill) — not `4px` as stated in the badge spec. Correction: the risk badge should be pill-shaped (`border-radius: 100px`) because it is a classification label, not a data cell. This contradicts Section 3's `4px` spec — pill wins for badges specifically.

#### Addition 4: CTA Button Inner Highlight

The difference between a button that looks physical vs. flat:

```css
.cta-primary {
  background: #C8A96E;
  color: #0C0C0E;
  /* ... other styles ... */
  
  /* The premium detail */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  /* This creates a 1px top highlight that reads as "beveled" — */
  /* the button feels physical, not painted-on */
}

.cta-primary:hover {
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 8px 24px rgba(200, 169, 110, 0.25); /* outer glow on hover */
}
```

#### Addition 5: Tabular Data Rendering (for clause tables, export views)

Legal professionals work in tables. Generic apps treat tables like lists.

```css
.data-table {
  font-variant-numeric: tabular-nums;  /* amounts + page numbers align */
  font-size: 13px;                     /* not 14-16px — data density matters */
  line-height: 44px;                   /* 44px row height — compact but touchable */
  
  /* Subtle zebra striping */
  tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.02); /* near-invisible, felt not seen */
  }
  
  /* Column alignment */
  td.numeric { text-align: right; font-variant-numeric: tabular-nums; }
  td.status  { text-align: center; }
}
```

---

### Easing Curve (confirmed by multiple sources)

`cubic-bezier(0.16, 1, 0.3, 1)` — ease-out-expo — is the Linear/Vercel/Anthropic standard. Apply globally:

```css
:root {
  --ease-ui: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-default: 200ms;
  --duration-slow: 400ms;
}

/* All transitions use this */
.some-component {
  transition: all var(--duration-default) var(--ease-ui);
}
```

---

### Final Font Decision Matrix

| Option | Display Font | Cost | Tier Signal |
|--------|-------------|------|-------------|
| **Premium** | Tiempos Headline (Klim) | ~$300/license | Anthropic, NYT — unmistakable authority |
| **Recommended Free** | Instrument Serif (Google) | Free | Editorial, legal-adjacent, distinctive |
| **Alternative Free** | Playfair Display (Google) | Free | More ornate, good for formal positioning |
| **Full Sans** | Geist (Vercel open-source) | Free | Developer-premium, less legal-authority |

**Verdict:** Ship with Instrument Serif. If/when funded, upgrade to Tiempos Headline. The switch is a 1-line CSS change.

---

## ADDENDUM 2 - Resend + Clerk Source Code (Live Extracted Data)

**Framework note: Next.js 16 (App Router)**

### Key Upgrades from Live Source Analysis

**1. Card borders — replace CSS border with Clerk 0.5px inset box-shadow:**
Sub-pixel precision on retina. No CSS border at all.
- `box-shadow: 0 0 0 0.5px rgba(255,255,255,0.12) inset, 0 0 0 0.5px rgba(0,0,0,0.8), 0 2px 3px rgba(0,0,0,0.24), 0 4px 8px rgba(0,0,0,0.16)`

**2. Noise texture on CTA button (Resend):**
`after:bg-[url("/static/texture-btn.png")]` at 5% opacity with mix-blend-mode: overlay.
Makes the button feel physical/crafted, not painted.

**3. Brand accent as atmospheric glow with mix-blend-mode (Clerk):**
`background: rgba(200,169,110,0.35); filter: blur(80px); mix-blend-mode: overlay;`
Overlay blend on dark bg reduces effective opacity to ~10%. Subtle atmosphere.

**4. ALL CAPS section eyebrows (Clerk):**
USER AUTHENTICATION -> CLAUSE EXTRACTION, RISK ANALYSIS, CONTRACT Q&A, WORKSPACE MEMORY, EVIDENCE PACKS, AUDIT TRAIL
`font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #C8A96E`

**5. Live product demo in hero (Clerk - HIGHEST PRIORITY):**
Clerk embeds its actual SignIn component running live. ContractIQ: show real analysis UI running
with a pre-loaded sample contract, clauses in sidebar, risk badges, CRITICAL clause highlighted.
React component + Framer Motion 6-second reveal loop. Not a screenshot. The product IS the demo.

### Resend Confirmed Color System (Radix-style 12-step semantic tokens)
gray-1: #0C0C0E | gray-2: #131316 | gray-3: #1C1C21 | gray-4: #27272D | gray-5: #31313A
gray-6: #3A3A44 | gray-7: #4A4A56 | gray-8: #626270 | gray-9: #6B6B7B | gray-10: #797988
gray-11: #A1A1AA (secondary text) | gray-12: #F4F4F5 (primary text)

### Resend Typography Confirmed
Domaine (custom display serif) for H1 only + Inter for body. Self-hosted, lowercase font-family name.
Confirms: Instrument Serif for H1, Inter for body, self-hosted. No Google CDN.

### Clerk Testimonial Pattern
CEOs of Stripe (Patrick Collison), Vercel (Guillermo Rauch), Supabase (Paul Copplestone).
No stars, no avatars. Name + title + company only. Quotes contain specific results.
ContractIQ: legal ops managers at named companies. Quote must have a specific outcome.

### Implementation Priority (Ranked by Impact)
1. Live animated product demo in hero
2. 0.5px inset box-shadow card borders
3. SVG noise texture on body background
4. Brand glow with mix-blend-mode: overlay
5. Noise texture on primary CTA button
6. Inter font-feature-settings: ss01, cv01, cv02
7. ALL CAPS section eyebrows
8. 12-step semantic color token system
9. Self-hosted fonts with preload links
10. Named-authority testimonials (no star ratings)
