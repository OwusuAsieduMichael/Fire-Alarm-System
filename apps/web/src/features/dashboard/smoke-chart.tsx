"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <p className="metric-label">Trend</p>
          <CardTitle className="mt-1.5">Smoke history</CardTitle>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Live readings · smoke threshold {threshold}
          </p>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] pt-2">
        {loading ? (
          <Skeleton className="h-full w-full rounded-2xl" />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-5 w-5" />}
            title="Waiting for sensor data"
            description="Smoke history tracks live and message-driven readings."
            className="h-full border-0 bg-transparent py-8 shadow-none"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="smokeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(348 72% 46%)"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(348 72% 46%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 8"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <ReferenceLine
                y={threshold}
                stroke="hsl(var(--warning))"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 14,
                  boxShadow: "var(--shadow-elevated)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value) => {
                  const n = typeof value === "number" ? value : Number(value);
                  return [
                    `${Number.isFinite(n) ? n.toFixed(0) : "—"} ppm`,
                    "Smoke",
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="smokeLevel"
                stroke="hsl(348 72% 46%)"
                strokeWidth={2.25}
                fill="url(#smokeFill)"
                isAnimationActive
                animationDuration={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
