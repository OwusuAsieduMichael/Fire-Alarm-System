/** Shared LCD / sensor simulation for team-message alerts. */

export const TEAM_SMOKE_THRESHOLD = 60;
export const TEAM_FLAME_THRESHOLD = 1000;
export const TEAM_FIRE_PHASE_MS = 2 * 60 * 1000;

export type TeamLedStatus = "green" | "red" | "amber";
export type TeamAlertPhase = "safe" | "fire" | "smoke";

export interface TeamAlertSnapshot {
  phase: TeamAlertPhase;
  smoke: number;
  flame: number;
  flameDetected: boolean;
  alarmActive: boolean;
  lcdLine1: string;
  lcdLine2: string;
}

function fluctuateUp(
  base: number,
  elapsedSec: number,
  step: number,
  wobble: number
) {
  const climb = Math.floor(elapsedSec * step);
  const jitter = Math.floor(((elapsedSec * 17) % (wobble * 2 + 1)) - wobble);
  return Math.max(base, base + climb + jitter);
}

export function resolveTeamAlertState(
  teamLedStatus: TeamLedStatus,
  teamLedUpdatedAt: string | null,
  nowMs = Date.now()
): TeamAlertSnapshot {
  if (teamLedStatus !== "red") {
    return {
      phase: "safe",
      smoke: TEAM_SMOKE_THRESHOLD,
      flame: TEAM_FLAME_THRESHOLD,
      flameDetected: false,
      alarmActive: false,
      lcdLine1: "Fire Alarm Sys",
      lcdLine2: `S:${TEAM_SMOKE_THRESHOLD} F:${TEAM_FLAME_THRESHOLD}`,
    };
  }

  const startedAt = teamLedUpdatedAt
    ? new Date(teamLedUpdatedAt).getTime()
    : nowMs;
  const elapsed = Math.max(0, nowMs - startedAt);

  if (elapsed < TEAM_FIRE_PHASE_MS) {
    return {
      phase: "fire",
      smoke: TEAM_SMOKE_THRESHOLD,
      flame: TEAM_FLAME_THRESHOLD,
      flameDetected: true,
      alarmActive: true,
      lcdLine1: "Fire Detected",
      lcdLine2: `S:${TEAM_SMOKE_THRESHOLD} F:${TEAM_FLAME_THRESHOLD}`,
    };
  }

  const smokePhaseSec = Math.floor((elapsed - TEAM_FIRE_PHASE_MS) / 1000);
  const smoke = fluctuateUp(TEAM_SMOKE_THRESHOLD, smokePhaseSec, 1.4, 4);
  const flame = fluctuateUp(TEAM_FLAME_THRESHOLD, smokePhaseSec, 3.2, 12);

  return {
    phase: "smoke",
    smoke,
    flame,
    flameDetected: true,
    alarmActive: true,
    lcdLine1: "Smoke Detected",
    lcdLine2: `S:${smoke} F:${flame}`,
  };
}
