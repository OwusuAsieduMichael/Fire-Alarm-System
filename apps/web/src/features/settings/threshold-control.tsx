"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

interface ThresholdControlProps {
  smokeThreshold: number;
  flameThreshold: number;
  canWrite: boolean;
  loading?: boolean;
  onSave: (values: {
    smokeThreshold: number;
    flameThreshold: number;
  }) => void;
}

export function ThresholdControl({
  smokeThreshold,
  flameThreshold,
  canWrite,
  loading,
  onSave,
}: ThresholdControlProps) {
  const [smoke, setSmoke] = useState(smokeThreshold);
  const [flame, setFlame] = useState(flameThreshold);

  useEffect(() => {
    setSmoke(smokeThreshold);
    setFlame(flameThreshold);
  }, [smokeThreshold, flameThreshold]);

  const dirty = smoke !== smokeThreshold || flame !== flameThreshold;

  return (
    <TooltipProvider>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="metric-label">Detection</p>
                <CardTitle className="mt-1.5">Smoke threshold</CardTitle>
              </div>
              {!canWrite ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Only the device owner or a developer can change thresholds.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              LCD / sensors use this as the smoke baseline (S value).
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end justify-between">
              <Label htmlFor="smoke-threshold">Smoke</Label>
              <span className="sensor-value text-2xl font-semibold tracking-tight">
                {smoke}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  ppm
                </span>
              </span>
            </div>
            <Slider
              id="smoke-threshold"
              min={20}
              max={500}
              step={5}
              value={[smoke]}
              disabled={!canWrite}
              onValueChange={([v]) => setSmoke(v)}
              aria-label="Smoke threshold"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sensitive</span>
              <span>Relaxed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="metric-label">Detection</p>
                <CardTitle className="mt-1.5">Flame threshold</CardTitle>
              </div>
              {!canWrite ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Only the device owner or a developer can change thresholds.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              LCD / sensors use this as the flame baseline (F value).
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end justify-between">
              <Label htmlFor="flame-threshold">Flame</Label>
              <span className="sensor-value text-2xl font-semibold tracking-tight">
                {flame}
              </span>
            </div>
            <Slider
              id="flame-threshold"
              min={200}
              max={2000}
              step={10}
              value={[flame]}
              disabled={!canWrite}
              onValueChange={([v]) => setFlame(v)}
              aria-label="Flame threshold"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sensitive</span>
              <span>Relaxed</span>
            </div>
          </CardContent>
        </Card>

        {canWrite ? (
          <div className="lg:col-span-2">
            <Button
              disabled={!dirty || loading}
              onClick={() =>
                onSave({
                  smokeThreshold: smoke,
                  flameThreshold: flame,
                })
              }
            >
              {loading ? "Saving…" : "Save thresholds"}
            </Button>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
