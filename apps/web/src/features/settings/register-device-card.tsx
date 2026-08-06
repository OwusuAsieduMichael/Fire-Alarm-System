"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import type { Device } from "@/types";

export function RegisterDeviceCard() {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("Main Hall Sensor");
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);

  const createDevice = useMutation({
    mutationFn: async () => {
      return apiClient.post<Device>("/devices", { name: name.trim() || "FireGuard Sensor" });
    },
    onSuccess: (device) => {
      setCreatedKey(device.deviceKey);
      toast.success("Device registered — copy the device key into your ESP32 sketch");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not register device");
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="metric-label">Hardware</p>
        <CardTitle className="mt-1.5">Register ESP32 device</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Each account owns its own devices. Register a sensor, then flash the
          device key onto your ESP32.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Device name"
            className="flex-1"
          />
          <Button
            type="button"
            disabled={createDevice.isPending}
            onClick={() => createDevice.mutate()}
          >
            {createDevice.isPending ? "Creating…" : "Create device"}
          </Button>
        </div>
        {createdKey ? (
          <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-success">
              Device key
            </p>
            <p className="mt-1 break-all font-mono text-[13px]">{createdKey}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
