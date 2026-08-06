"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

interface ThresholdControlProps {
  smokeThreshold: number;
  smokeCalibration: number;
  canWrite: boolean;
  loading?: boolean;
  onSave: (values: {
    smokeThreshold: number;
    smokeCalibration: number;
  }) => void;
}

export function ThresholdControl({
  smokeThreshold,
  smokeCalibration,
  canWrite,
  loading,
  onSave,
}: ThresholdControlProps) {
  const [threshold, setThreshold] = useState(smokeThreshold);
  const [calibration, setCalibration] = useState(smokeCalibration);

  useEffect(() => {
    setThreshold(smokeThreshold);
    setCalibration(smokeCalibration);
  }, [smokeThreshold, smokeCalibration]);

  const dirty =
    threshold !== smokeThreshold || calibration !== smokeCalibration;

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
                      Developer only
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Only developers can change the smoke threshold.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Alarm triggers when smoke exceeds this level (ppm).
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end justify-between">
              <Label htmlFor="smoke-threshold">Threshold</Label>
              <span className="sensor-value text-2xl font-semibold tracking-tight">
                {threshold}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  ppm
                </span>
              </span>
            </div>
            <Slider
              id="smoke-threshold"
              min={50}
              max={1000}
              step={10}
              value={[threshold]}
              disabled={!canWrite}
              onValueChange={([v]) => setThreshold(v)}
              aria-label="Smoke threshold"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sensitive</span>
              <span>Relaxed</span>
            </div>
            {canWrite ? (
              <Button
                disabled={!dirty || loading}
                onClick={() =>
                  onSave({
                    smokeThreshold: threshold,
                    smokeCalibration: calibration,
                  })
                }
              >
                {loading ? "Saving…" : "Save threshold"}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="metric-label">Sensor</p>
                <CardTitle className="mt-1.5">Calibration</CardTitle>
              </div>
              {!canWrite ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      Developer only
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Calibration offset can only be edited by developers.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Offset applied to raw MQ-2 smoke sensor readings.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calibration">Calibration offset</Label>
              <Input
                id="calibration"
                type="number"
                value={calibration}
                disabled={!canWrite}
                onChange={(e) => setCalibration(Number(e.target.value))}
              />
            </div>
            <Button
              disabled={!canWrite || !dirty || loading}
              onClick={() =>
                onSave({
                  smokeThreshold: threshold,
                  smokeCalibration: calibration,
                })
              }
            >
              {loading ? "Saving…" : "Save calibration"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
