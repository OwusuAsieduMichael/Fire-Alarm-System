"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthBackdrop } from "@/components/auth/auth-backdrop";
import { GuestGuard } from "@/components/auth/auth-guard";
import { OnboardingCarousel } from "@/features/onboarding/onboarding-carousel";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { useAuthStore } from "@/stores/auth-store";

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (hasCompletedOnboarding()) {
      router.replace("/login");
    }
  }, [hydrated, router]);

  return (
    <GuestGuard>
      <div className="relative min-h-dvh overflow-hidden">
        <AuthBackdrop />
        <OnboardingCarousel />
      </div>
    </GuestGuard>
  );
}
