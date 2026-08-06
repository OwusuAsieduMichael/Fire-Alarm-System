"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeviceStore } from "@/stores/device-store";
import type { ConnectionLog } from "@/types";

interface DebugConsoleProps {
  connectionLogs?: ConnectionLog[];
}

export function DebugConsole({ connectionLogs = [] }: DebugConsoleProps) {
  const socketLogs = useDeviceStore((s) => s.socketLogs);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lines = [
    ...connectionLogs.map(
      (log) =>
        `[${new Date(log.createdAt).toLocaleTimeString()}] ${log.event}: ${log.message}`
    ),
    ...socketLogs,
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <Card className="overflow-hidden border-border/55">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <p className="metric-label">Stream</p>
          <CardTitle className="mt-1.5 text-lg">Debug console</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Connection logs and live socket events
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => useDeviceStore.setState({ socketLogs: [] })}
        >
          Clear local
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 rounded-2xl border border-border/55 bg-zinc-950 p-3.5">
          <pre className="font-mono text-xs leading-6 text-emerald-400">
            {lines.length === 0 ? (
              <span className="text-zinc-500">
                Waiting for connection events…
              </span>
            ) : (
              lines.map((line, i) => (
                <div key={`${line}-${i}`} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
