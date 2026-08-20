import type { SocialAdapter, SocialPlatform } from "../types";
import { linkedinAdapter } from "./linkedin";
import { facebookAdapter, instagramAdapter } from "./meta";
import { redditAdapter } from "./reddit";
import { xAdapter } from "./x";

const ADAPTERS: Record<SocialPlatform, SocialAdapter> = {
  linkedin: linkedinAdapter,
  x: xAdapter,
  instagram: instagramAdapter,
  facebook: facebookAdapter,
  reddit: redditAdapter,
};

export function socialAdapter(platform: SocialPlatform) {
  return ADAPTERS[platform];
}
