"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useDeviceStore } from "@/stores/device-store";
import { Activity } from "lucide-react";

interface SmokeChartProps {
  loading?: boolean;
  threshold?: number;
}

export function SmokeChart({ loading, threshold = 300 }: SmokeChartProps) {
  const smokeHistory = useDeviceStore((s) => s.smokeHistory);

  const data = useMemo(
    () =>
      smokeHistory.map((p) => ({
        ...p,
        label: format(new Date(p.timestamp), "HH:mm:ss"),
      })),
    [smokeHistory]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Smoke History</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Live readings · threshold {threshold} ppm
            </p>
          </div>
        </CardHeader>
        <CardContent className="h-[280px] pt-2">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : data.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-5 w-5" />}
              title="Waiting for sensor data"
              description="Smoke history will appear once the ESP32 starts streaming readings."
              className="h-full border-0 bg-transparent py-8"
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="smokeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(347 77% 50%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(347 77% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "var(--shadow-elevated)",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(value: number) => [`${value.toFixed(0)} ppm`, "Smoke"]}
                />
                <Area
                  type="monotone"
                  dataKey="smokeLevel"
                  stroke="hsl(347 77% 50%)"
                  strokeWidth={2}
                  fill="url(#smokeFill)"
                  isAnimationActive
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
