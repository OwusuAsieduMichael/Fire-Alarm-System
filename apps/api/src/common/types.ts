import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  theme: string;
  phone: string | null;
}

export interface LiveDeviceState {
  deviceId: string;
  deviceKey: string;
  smokeLevel: number;
  flameDetected: boolean;
  temperature: number;
  humidity: number;
  buzzerActive: boolean;
  ledStatus: string;
  alarmActive: boolean;
  lcdMessage: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: Date;
  realDeviceConnected: boolean;
}

export type ControlAction =
  | 'test-alarm'
  | 'reset-alarm'
  | 'emergency'
  | 'buzzer-on'
  | 'buzzer-off';

export interface ControlCommand {
  action: ControlAction;
  deviceId: string;
  requestedBy?: string;
}
