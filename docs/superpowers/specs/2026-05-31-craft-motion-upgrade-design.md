# queryclear — Craft & Motion Upgrade · Design Spec

**Date:** 2026-05-31
**Status:** Approved (design); pending implementation plan
**Scope:** Visual-craft + motion upgrade of the existing site. No new pages, no copy rewrite, no palette change, no new marketing claims.

---

## 1. Goal & principles

Elevate the perceived quality of the existing queryclear site so it reads as a premium,
distinctive, founder-led product — without changing what already works.

**Keep:** Next.js 16 / React 19 / Tailwind 4 architecture, the paper/pine/lime palette, all
existing copy, and the full GEO/SEO infrastructure (`llms.txt`, sitemap, robots, JSON-LD,
Open Graph/Twitter meta).

**Change:** headline typography, type scale, card/surface styling, and add a disciplined
animation system (scroll reveals + micro-interactions).

**Guiding rules:**
- Keep it simple — less "encircling"/decoration; whitespace + hairline grid carry the design.
- Never more than 1–2 animations per screen (avoid distraction / motion sickness).
- Everything degrades gracefully under `prefers-reduced-motion` (final state shown instantly).
- **No fabricated claims** — no invented stats, results, testimonials, or guarantees.

---

## 2. Typography

- **Display font:** replace **Fraunces** with **Bricolage Grotesque**, loaded via
  `next/font/google` and exposed as `--font-display`. Modern editorial-grotesque with
  character; pairs naturally with the mono machine panels.
- **Body:** stays **IBM Plex Sans**. **Machine panels:** stay **IBM Plex Mono**.
- **Richer type scale** using `clamp()` for fluid responsive sizing. Clear hierarchy:
  hero → section-head → card-head → body → mono-label. Use **tabular figures** for all
  numerals (scores, stats, prices) to prevent layout shift.

---

## 3. Card & surface polish

- Flatter, squarer cards: card radius `14px → 10px`, crisp hairline border.
- **One** clean hover lift (`translateY(-4px)`) + hairline darken + a small **lime dot marker**
  that scales in on hover. No rounded pill/ring clutter.
- Continue using the dotted-grid texture and generous whitespace for atmosphere.

---

## 4. Motion system

**Library:** Framer Motion, current `motion` package (`motion/react`), compatible with
Next.js 16 / React 19. Implemented as **small, focused client-island components** so pages
stay predominantly server-rendered and fast.

**Reduced-motion:** a central `prefers-reduced-motion` check disables transforms, typing,
and count-ups, rendering the final state immediately.

**Performance:** transform/opacity only (60fps-safe); `motion` is tree-shakeable; scroll
reveals fire **once** on entry (`viewport={{ once: true }}`) — not on every pass.

### Scroll patterns (5)
1. **Staggered fade-up** — children rise/fade in sequence. Use on card & list grids
   (Problem, What we build, Deliverables).
2. **Headline clip-reveal** — headline lines slide up from a mask. Section headers only,
   used sparingly.
3. **Machine readout typing** — hero panel "types" what the AI reads, line by line, ending
   on `✓ clear · structured · citable`. The signature moment.
4. **Number count-up** — numerals tick up from zero on entry. *(See honesty constraint below.)*
5. **Accent line-draw** — a lime hairline fills across. How-it-works progress + section
   dividers. No boxes/circles.

### Micro-interactions (8)
1. **CTA** — arrow nudges right on hover, gentle scale on press, lime→deep-lime.
2. **Card** — lift + lime dot marker (see §3).
3. **Link** — lime underline wipes in from the left (nav & inline links).
4. **FAQ accordion** — height eases open, chevron rotates (replaces abrupt native toggle).
5. **Human ⇄ Machine toggle** — *signature element*: crossfade the same content between the
   human view and the machine-readable view. Dramatizes the core value prop.
6. **Submit states** — idle → spinner ("Sending…") → ✓ received (refine existing LeadForm).
7. **Brand mark orbit** — lime dot makes one orbit of the ring on logo hover.
8. **Field focus ring** — pine border + soft focus halo on inputs.

### Honesty constraint on count-up (§4 pattern 4) — DECIDED
queryclear has no clients yet, so any "average results / readiness lift" figure would be a
fabricated claim and violates the brand rules. **Count-up is used only on honest numbers:**
- The **sample audit score ring** (already labeled fictional/demo on `/audit`).
- **Factual** figures only — e.g. "**6** answer engines tested."
- **Do not** add average-lift / results stats until real client data exists.

---

## 5. Components — new & changed

**New client islands** (small, single-purpose, in a dedicated motion module):
- `Reveal` / `Stagger` — generic scroll-reveal wrappers (whileInView, once).
- `TypingPanel` — the hero machine readout typing animation.
- `CountUp` — count-up numerals (honest numbers only).
- `HumanMachineToggle` — the human/machine crossfade tabs (keyboard-operable, ARIA).
- `Accordion` — animated FAQ disclosure (keyboard-operable, ARIA).
- `AnimatedMark` — brand mark with dot-orbit hover.

**Changed:**
- `app/layout.tsx` — swap display font to Bricolage Grotesque; expose `--font-display`.
- `app/globals.css` — new fluid type scale, card refinements, keep a CSS reveal fallback
  for no-JS / reduced-motion.
- `components/ui.tsx` — `Cta` arrow + press; `Mark` → `AnimatedMark` usage.
- `components/Header.tsx` — link underline animation; animated mark.
- `components/LeadForm.tsx` — field focus ring; refine submit states.
- `app/page.tsx` — apply reveals; swap static hero panel → `TypingPanel`; add
  `HumanMachineToggle` in the Solution section; line-draw in How-it-works; clip-reveal on
  section heads.
- `app/audit/page.tsx` — count-up on the score ring; section reveals.

**Isolation:** each animated unit is a focused client component with a clear prop interface,
understandable and testable independently; pages remain server components that compose them.

---

## 6. Accessibility & performance (non-negotiable)

- All animation gated by `prefers-reduced-motion`; final states render instantly when reduced.
- `HumanMachineToggle` and `Accordion` are real, keyboard-operable controls with correct ARIA
  (`aria-expanded`, `aria-controls`, focus management).
- Color contrast unchanged (already WCAG AA+); visible focus states preserved.
- Targets: Lighthouse performance ≥90, LCP <2.5s, CLS <0.1.
- Verify responsive at 375 / 768 / 1024 / 1440 px and with reduced-motion enabled.

---

## 7. Out of scope

No new pages, no pricing section, no new marketing claims, no palette change, no copy rewrite.
Pure craft + motion.

---

## 8. Validation checklist (pre-delivery)

- [ ] `npm run build` passes; `npm run lint` clean.
- [ ] No emojis used as structural icons (SVG only).
- [ ] Reduced-motion: all reveals/typing/count-ups show final state, no motion.
- [ ] Keyboard: toggle, accordion, links, form fully operable; focus visible.
- [ ] Contrast AA maintained in all states.
- [ ] Responsive verified at 375 / 768 / 1024 / 1440.
- [ ] No fabricated numbers anywhere (count-up honest-only rule honored).
- [ ] JSON-LD, OG, sitemap, robots, llms.txt still valid and unchanged.
