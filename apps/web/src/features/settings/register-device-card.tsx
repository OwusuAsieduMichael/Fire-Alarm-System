"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";
import type { Device } from "@/types";

function flashSnippet(deviceKey: string) {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "YOUR_APP.vercel.app";
  const isLocal = host === "localhost" || host.startsWith("192.168.");

  return `// FireGuard ESP32 — paste into fireguard_esp32.ino
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_HOST = "${isLocal ? "YOUR_PC_LAN_IP" : host}";
const uint16_t API_PORT = ${isLocal ? "3000" : "443"};
const bool API_HTTPS = ${isLocal ? "false" : "true"};
const char* DEVICE_KEY = "${deviceKey}";
// Then flash — dashboard goes ONLINE when telemetry arrives.`;
}

export function RegisterDeviceCard() {
  const queryClient = useQueryClient();
  const selected = useDeviceStore(selectSelectedDevice);
  const devices = useDeviceStore((s) => s.devices);
  const device = selected ?? devices[0] ?? null;

  const [name, setName] = React.useState("Main Hall Sensor");
  const [copied, setCopied] = React.useState<"key" | "snippet" | null>(null);

  const createDevice = useMutation({
    mutationFn: async () => {
      return apiClient.post<Device>("/devices", {
        name: name.trim() || "FireGuard Sensor",
      });
    },
    onSuccess: () => {
      toast.success("Extra device registered");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not register device");
    },
  });

  const copyText = async (value: string, kind: "key" | "snippet") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === "key" ? "Device key copied" : "Flash snippet copied");
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Could not copy — select the text manually");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="metric-label">Hardware</p>
        <CardTitle className="mt-1.5">ESP32 flash setup</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Your account already has a device key. Put Wi‑Fi + this key into the
          sketch, flash the board, and the dashboard comes online. No NestJS or
          local server required.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {device ? (
          <>
            <div className="rounded-xl border border-border/70 bg-secondary/40 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Device key
                  </p>
                  <p className="mt-1 break-all font-mono text-[13px] font-semibold">
                    {device.deviceKey}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {device.name} · waiting for ESP32 until telemetry arrives
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(device.deviceKey, "key")}
                >
                  {copied === "key" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-muted-foreground">
                  Paste into firmware
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    void copyText(flashSnippet(device.deviceKey), "snippet")
                  }
                >
                  {copied === "snippet" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy snippet
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-border/60 bg-card p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
                {flashSnippet(device.deviceKey)}
              </pre>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Provisioning your device key…
          </p>
        )}

        <div className="border-t border-border/60 pt-4">
          <p className="mb-2 text-[12px] font-medium text-muted-foreground">
            Optional — add another sensor
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Device name"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={createDevice.isPending}
              onClick={() => createDevice.mutate()}
            >
              {createDevice.isPending ? "Creating…" : "Add device"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
