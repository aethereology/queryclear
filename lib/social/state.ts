import type { CampaignStatus, SocialActionStatus } from "./types";

const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  researching: ["drafted", "failed"],
  drafted: ["passed", "quarantined", "failed"],
  passed: ["scheduled", "quarantined"],
  quarantined: ["drafted", "failed"],
  scheduled: ["publishing", "quarantined", "failed"],
  publishing: ["published", "scheduled", "failed"],
  published: [],
  failed: ["researching"],
};

const ACTION_TRANSITIONS: Record<SocialActionStatus, SocialActionStatus[]> = {
  queued: ["leased", "quarantined"],
  leased: ["completed", "retryable", "quarantined"],
  completed: [],
  retryable: ["leased", "queued", "quarantined"],
  quarantined: ["queued"],
};

export function canTransitionCampaign(from: CampaignStatus, to: CampaignStatus) {
  return from === to || CAMPAIGN_TRANSITIONS[from].includes(to);
}

export function canTransitionAction(from: SocialActionStatus, to: SocialActionStatus) {
  return from === to || ACTION_TRANSITIONS[from].includes(to);
}
