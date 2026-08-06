const STORAGE_KEY = "fireguard.onboardingComplete";

export function hasCompletedOnboarding() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function getPostAuthEntryPath() {
  return hasCompletedOnboarding() ? "/login" : "/onboarding";
}
