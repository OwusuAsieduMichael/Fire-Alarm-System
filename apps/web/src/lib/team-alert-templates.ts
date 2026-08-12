export type TeamAlertTemplateId = "flame" | "smoke" | "both";

export interface TeamAlertTemplate {
  id: TeamAlertTemplateId;
  title: string;
  summary: string;
  body: string;
  tone: "flame" | "smoke" | "critical";
}

export const TEAM_ALERT_TEMPLATES: TeamAlertTemplate[] = [
  {
    id: "flame",
    title: "Flame detected",
    summary: "Notify the team that flame has been detected.",
    body: "FireGuard alert: Flame has been detected. Investigate the monitored area immediately and follow site emergency procedure.",
    tone: "flame",
  },
  {
    id: "smoke",
    title: "Smoke detected",
    summary: "Notify the team that smoke has exceeded the safe threshold.",
    body: "FireGuard alert: Smoke levels have exceeded the safe threshold. Check the area, ventilate if safe, and confirm sensor status.",
    tone: "smoke",
  },
  {
    id: "both",
    title: "Flame + smoke detected",
    summary: "Notify the team of a combined high-priority fire condition.",
    body: "FireGuard alert: Flame and elevated smoke have been detected together. Treat this as a high-priority fire condition and respond per emergency protocol.",
    tone: "critical",
  },
];
