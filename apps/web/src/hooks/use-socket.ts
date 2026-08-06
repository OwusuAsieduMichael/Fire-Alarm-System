"use client";

import { useEffect } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore } from "@/stores/device-store";
import type { Alert, LiveDeviceState } from "@/types";

function serializeLive(payload: Record<string, unknown>): Partial<LiveDeviceState> {
  const lastSeen = payload.lastSeen;
  return {
    deviceId: (payload.deviceId as string) ?? null,
    smokeLevel: Number(payload.smokeLevel ?? 0),
    flameDetected: Boolean(payload.flameDetected),
    temperature:
      payload.temperature === null || payload.temperature === undefined
        ? null
        : Number(payload.temperature),
    humidity:
      payload.humidity === null || payload.humidity === undefined
        ? null
        : Number(payload.humidity),
    buzzerActive: Boolean(payload.buzzerActive),
    ledStatus: String(payload.ledStatus ?? "off"),
    alarmActive: Boolean(payload.alarmActive),
    lcdMessage: String(payload.lcdMessage ?? "FireGuard Ready"),
    status: payload.status === "ONLINE" ? "ONLINE" : "OFFLINE",
    lastSeen:
      typeof lastSeen === "string"
        ? lastSeen
        : lastSeen instanceof Date
          ? lastSeen.toISOString()
          : lastSeen
            ? String(lastSeen)
            : null,
    realDeviceConnected: Boolean(payload.realDeviceConnected),
  };
}

export function useSocket(enabled = true) {
  const token = useAuthStore((s) => s.token);
  const connectionStatus = useDeviceStore((s) => s.connectionStatus);
  const setConnectionStatus = useDeviceStore((s) => s.setConnectionStatus);
  const applyLiveReading = useDeviceStore((s) => s.applyLiveReading);
  const prependAlert = useDeviceStore((s) => s.prependAlert);
  const pushSocketLog = useDeviceStore((s) => s.pushSocketLog);
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);

  useEffect(() => {
    if (!enabled) {
      disconnectSocket();
      return;
    }

    if (!token) {
      disconnectSocket();
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    const socket = connectSocket(token);

    const onConnect = () => {
      setConnectionStatus("connected");
      pushSocketLog("Socket connected");
      socket.emit("dashboard:subscribe");
    };
    const onDisconnect = () => {
      setConnectionStatus("disconnected");
      pushSocketLog("Socket disconnected");
    };
    const onConnectError = (err: Error) => {
      setConnectionStatus("error");
      pushSocketLog(`Socket error: ${err.message}`);
    };
    const onReconnectAttempt = () => setConnectionStatus("connecting");

    const onSensorUpdate = (payload: Record<string, unknown>) => {
      const deviceId = payload.deviceId as string | undefined;
      const selected = useDeviceStore.getState().selectedDeviceId;
      if (deviceId && selected && deviceId !== selected) return;
      applyLiveReading(serializeLive(payload));
      pushSocketLog(
        `sensor:update smoke=${Number(payload.smokeLevel ?? 0).toFixed(0)} flame=${Boolean(payload.flameDetected)}`
      );
    };

    const onAlertNew = (alert: Alert) => {
      prependAlert(alert);
      pushSocketLog(`alert:new ${alert.type} — ${alert.title}`);
    };

    const onDeviceStatus = (payload: Record<string, unknown>) => {
      const deviceId = payload.deviceId as string | undefined;
      const selected = useDeviceStore.getState().selectedDeviceId;
      if (deviceId && selected && deviceId !== selected) return;
      applyLiveReading({
        status: payload.status === "ONLINE" ? "ONLINE" : "OFFLINE",
        lastSeen: payload.lastSeen
          ? String(payload.lastSeen)
          : new Date().toISOString(),
        deviceId: deviceId ?? null,
      });
      pushSocketLog(`device:status ${String(payload.status)}`);
    };

    const onControlAck = (payload: Record<string, unknown>) => {
      const state = payload.state as Record<string, unknown> | undefined;
      if (state) {
        applyLiveReading(serializeLive({ ...state, deviceId: payload.deviceId }));
      }
      pushSocketLog(`control:ack ${String(payload.action ?? "unknown")}`);
    };

    const onConnected = (payload: {
      liveStates?: Array<Record<string, unknown>>;
    }) => {
      const selected = useDeviceStore.getState().selectedDeviceId;
      const states = payload.liveStates ?? [];
      const match =
        states.find((s) => s.deviceId === selected) ?? states[0];
      if (match) {
        applyLiveReading(serializeLive(match));
      }
      pushSocketLog(`Initial live states: ${states.length}`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("connected", onConnected);
    socket.on("sensor:update", onSensorUpdate);
    socket.on("alert:new", onAlertNew);
    socket.on("device:status", onDeviceStatus);
    socket.on("control:ack", onControlAck);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("connected", onConnected);
      socket.off("sensor:update", onSensorUpdate);
      socket.off("alert:new", onAlertNew);
      socket.off("device:status", onDeviceStatus);
      socket.off("control:ack", onControlAck);
    };
  }, [
    enabled,
    token,
    selectedDeviceId,
    setConnectionStatus,
    applyLiveReading,
    prependAlert,
    pushSocketLog,
  ]);

  return {
    socket: getSocket(),
    connectionStatus,
  };
}
