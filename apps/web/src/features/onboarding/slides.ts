import type { LucideIcon } from "lucide-react";
import { BellRing, Radar, ShieldCheck } from "lucide-react";

export interface OnboardingSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "monitor",
    eyebrow: "Live awareness",
    title: "See every signal clearly",
    description:
      "Track smoke, flame, and device health from one calm control surface.",
    detail: "Built for operators who need status at a glance.",
    icon: Radar,
  },
  {
    id: "respond",
    eyebrow: "Fast response",
    title: "Act when it matters",
    description:
      "Acknowledge alerts and send confirmed commands to the ESP32 in seconds.",
    detail: "Test, reset, and emergency controls stay one tap away.",
    icon: BellRing,
  },
  {
    id: "protect",
    eyebrow: "Secure access",
    title: "Protect your facility",
    description:
      "Sign in to monitor your FireGuard system with role-based operator access.",
    detail: "Your building status, always ready when you are.",
    icon: ShieldCheck,
  },
];
