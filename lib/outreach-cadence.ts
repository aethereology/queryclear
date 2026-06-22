// Assisted nurture cadence. Defines WHICH follow-up is due next for a contact and
// WHEN — the founder still approves every send (this just computes the schedule).
//
// Two arms, gated by engagement:
//  - cold: a contact that never engages gets a SHORT sequence (3 follow-ups after the
//    initial audit), then we stop — protects sender reputation, no 10× cold blasting.
//  - nurture: once a contact opens their report or replies (status opened/replied),
//    they graduate to a longer, wider-spaced value sequence, capped at MAX_TOUCHES.

import type { Contact } from "./outreach-store";

export interface CadenceStep {
  type: string; // template key (see renderOutreachFollowupEmail)
  afterDays: number; // days after the previous touch
  arm: "cold" | "nurture";
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_TOUCHES = 10;

// Touch 1 is the cold audit (sent by send-cold). These are the follow-ups.
export const COLD_FOLLOWUPS: CadenceStep[] = [
  { type: "bump", afterDays: 4, arm: "cold" },
  { type: "tip", afterDays: 5, arm: "cold" },
  { type: "last-note", afterDays: 7, arm: "cold" },
];

// Nurture follow-ups (entered when status is opened/replied). Long enough that a
// contact who graduates early can still reach MAX_TOUCHES; templates are reused.
export const NURTURE_FOLLOWUPS: CadenceStep[] = [
  { type: "nurture-tip", afterDays: 10, arm: "nurture" },
  { type: "nurture-case", afterDays: 14, arm: "nurture" },
  { type: "nurture-tip", afterDays: 21, arm: "nurture" },
  { type: "nurture-checkin", afterDays: 30, arm: "nurture" },
  { type: "nurture-tip", afterDays: 45, arm: "nurture" },
  { type: "nurture-case", afterDays: 60, arm: "nurture" },
  { type: "nurture-tip", afterDays: 75, arm: "nurture" },
  { type: "nurture-checkin", afterDays: 90, arm: "nurture" },
  { type: "nurture-tip", afterDays: 120, arm: "nurture" },
];

// The next step to send a contact, with its resolved touch number — or null if the
// arm is exhausted, the cap is hit, or the contact is in a terminal status.
export function nextStep(contact: Contact): (CadenceStep & { n: number }) | null {
  const count = contact.touches.length;
  if (count === 0) return null; // touch 1 is owned by send-cold, not the cadence
  if (count >= MAX_TOUCHES) return null;

  const followups =
    contact.status === "opened" || contact.status === "replied"
      ? NURTURE_FOLLOWUPS
      : contact.status === "cold"
        ? COLD_FOLLOWUPS
        : null; // unsubscribed / bounced / customer → no more touches

  if (!followups) return null;
  const idx = count - 1; // count=1 (just the audit) → first follow-up
  if (idx >= followups.length) return null;
  return { ...followups[idx], n: count + 1 };
}

export function computeNextDueAt(lastTouchAtIso: string, step: CadenceStep): string {
  return new Date(Date.parse(lastTouchAtIso) + step.afterDays * DAY_MS).toISOString();
}
