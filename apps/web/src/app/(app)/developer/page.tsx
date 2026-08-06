"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Terminal } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DebugConsole } from "@/features/developer/debug-console";
import { DiagnosticsPanel } from "@/features/developer/diagnostics-panel";
import { useDevices, useDevice } from "@/hooks/use-sensors";
import { useDeviceLogs } from "@/hooks/use-settings";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

export default function DeveloperPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const selected = useDeviceStore(selectSelectedDevice);
  const connectionLogs = useDeviceStore((s) => s.connectionLogs);

  useDevices();
  useDevice(selected?.id);
  useDeviceLogs(selected?.id);

  useEffect(() => {
    if (role && role !== "DEVELOPER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (role !== "DEVELOPER") {
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="Restricted"
          title="Developer"
          description="Developer tools require elevated access."
        />
        <EmptyState
          icon={<Terminal className="h-5 w-5" />}
          title="Access restricted"
          description="Developer tools require the DEVELOPER role."
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Engineering"
        title="Developer panel"
        description="ESP32 diagnostics, debug console, and connection logs."
      />
      <DiagnosticsPanel device={selected} />
      <DebugConsole connectionLogs={connectionLogs} />
    </div>
  );
}
