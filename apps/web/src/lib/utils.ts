import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSensorValue(
  value: number | null | undefined,
  decimals = 1,
  fallback = "—"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return value.toFixed(decimals);
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
