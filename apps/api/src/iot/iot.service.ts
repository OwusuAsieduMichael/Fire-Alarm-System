import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AlertSeverity, AlertType, DeviceStatus } from '@prisma/client';
import { DevicesService } from '../devices/devices.service';
import { SensorsService } from '../sensors/sensors.service';
import { AlertsService } from '../alerts/alerts.service';
import {
  ControlCommand,
  LiveDeviceState,
} from '../common/types';

type EmitFn = (event: string, payload: unknown) => void;

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);
  private readonly liveState = new Map<string, LiveDeviceState>();
  private emitToDashboard: EmitFn | null = null;
  private emitToDevice: ((deviceKey: string, event: string, payload: unknown) => void) | null =
    null;

  constructor(
    private readonly devicesService: DevicesService,
    private readonly sensorsService: SensorsService,
    private readonly alertsService: AlertsService,
  ) {}

  setEmitters(
    emitToDashboard: EmitFn,
    emitToDevice: (deviceKey: string, event: string, payload: unknown) => void,
  ) {
    this.emitToDashboard = emitToDashboard;
    this.emitToDevice = emitToDevice;
  }

  getLiveState(deviceId: string): LiveDeviceState | undefined {
    return this.liveState.get(deviceId);
  }

  getAllLiveStates(): LiveDeviceState[] {
    return Array.from(this.liveState.values());
  }

  async ensureLiveState(deviceId: string): Promise<LiveDeviceState> {
    const existing = this.liveState.get(deviceId);
    if (existing) {
      return existing;
    }

    const device = await this.devicesService.findOne(deviceId);
    const state: LiveDeviceState = {
      deviceId: device.id,
      deviceKey: device.deviceKey,
      smokeLevel: 80,
      flameDetected: false,
      temperature: 24,
      humidity: 45,
      buzzerActive: false,
      ledStatus: 'green',
      alarmActive: false,
      lcdMessage: 'System Ready',
      status: 'OFFLINE',
      lastSeen: new Date(),
      realDeviceConnected: false,
    };

    this.liveState.set(deviceId, state);
    return state;
  }

  async markDeviceConnected(
    deviceKey: string,
    meta?: { ipAddress?: string },
  ): Promise<LiveDeviceState> {
    const device = await this.devicesService.findByKey(deviceKey);
    if (!device) {
      throw new NotFoundException(`Unknown deviceKey: ${deviceKey}`);
    }

    await this.devicesService.updateStatus(device.id, DeviceStatus.ONLINE, {
      ipAddress: meta?.ipAddress,
    });
    await this.devicesService.logConnection(
      device.id,
      'connect',
      'ESP32 connected via Socket.IO',
    );

    const state = await this.ensureLiveState(device.id);
    state.status = 'ONLINE';
    state.realDeviceConnected = true;
    state.lastSeen = new Date();
    this.liveState.set(device.id, state);

    this.broadcast('device:status', {
      deviceId: device.id,
      deviceKey: device.deviceKey,
      status: 'ONLINE',
      lastSeen: state.lastSeen,
    });

    this.logger.log(`Device connected: ${device.name} (${deviceKey})`);
    return state;
  }

  async markDeviceDisconnected(deviceKey: string): Promise<void> {
    const device = await this.devicesService.findByKey(deviceKey);
    if (!device) {
      return;
    }

    await this.devicesService.updateStatus(device.id, DeviceStatus.OFFLINE);
    await this.devicesService.logConnection(
      device.id,
      'disconnect',
      'ESP32 disconnected',
    );

    const state = this.liveState.get(device.id);
    if (state) {
      state.status = 'OFFLINE';
      state.realDeviceConnected = false;
      this.liveState.set(device.id, state);
    }

    this.broadcast('device:status', {
      deviceId: device.id,
      deviceKey: device.deviceKey,
      status: 'OFFLINE',
      lastSeen: new Date(),
    });

    this.logger.log(`Device disconnected: ${device.deviceKey}`);
  }

  async ingestSensorData(
    deviceKey: string,
    data: {
      smokeLevel: number;
      flameDetected: boolean;
      temperature?: number;
      humidity?: number;
      buzzerActive?: boolean;
      ledStatus?: string;
      alarmActive?: boolean;
      lcdMessage?: string;
    },
    options?: { persist?: boolean; fromSimulator?: boolean },
  ) {
    const device = await this.devicesService.findByKey(deviceKey);
    if (!device) {
      throw new NotFoundException(`Unknown deviceKey: ${deviceKey}`);
    }

    const state = await this.ensureLiveState(device.id);
    const calibratedSmoke = Math.max(
      0,
      data.smokeLevel + device.smokeCalibration,
    );

    state.smokeLevel = calibratedSmoke;
    state.flameDetected = data.flameDetected;
    state.temperature = data.temperature ?? state.temperature;
    state.humidity = data.humidity ?? state.humidity;
    state.buzzerActive = data.buzzerActive ?? state.buzzerActive;
    state.ledStatus = data.ledStatus ?? state.ledStatus;
    state.alarmActive = data.alarmActive ?? state.alarmActive;
    state.lcdMessage = data.lcdMessage ?? state.lcdMessage;
    state.lastSeen = new Date();
    state.status = 'ONLINE';
    if (!options?.fromSimulator) {
      state.realDeviceConnected = true;
    }

    // Auto-raise alarm flags when thresholds exceeded
    const smokeAlert = calibratedSmoke > device.smokeThreshold;
    if (smokeAlert || data.flameDetected) {
      state.alarmActive = true;
      state.buzzerActive = true;
      state.ledStatus = 'red';
      state.lcdMessage = data.flameDetected ? 'FIRE DETECTED!' : 'SMOKE ALERT!';
    }

    this.liveState.set(device.id, state);

    if (!options?.fromSimulator) {
      await this.devicesService.touchLastSeen(device.id);
    } else if (state.status === 'ONLINE') {
      await this.devicesService.touchLastSeen(device.id);
    }

    const payload = {
      deviceId: device.id,
      deviceKey: device.deviceKey,
      ...state,
      smokeThreshold: device.smokeThreshold,
    };

    this.broadcast('sensor:update', payload);

    if (options?.persist) {
      await this.sensorsService.createReading({
        deviceId: device.id,
        smokeLevel: calibratedSmoke,
        flameDetected: data.flameDetected,
        temperature: state.temperature,
        humidity: state.humidity,
        buzzerActive: state.buzzerActive,
        ledStatus: state.ledStatus,
        alarmActive: state.alarmActive,
        lcdMessage: state.lcdMessage,
      });
    }

    if (data.flameDetected) {
      await this.maybeCreateAlert(
        device.id,
        AlertType.FIRE,
        AlertSeverity.CRITICAL,
        'Fire Detected',
        `Flame sensor triggered on ${device.name}`,
      );
    } else if (smokeAlert) {
      await this.maybeCreateAlert(
        device.id,
        AlertType.SMOKE,
        AlertSeverity.WARNING,
        'Smoke Threshold Exceeded',
        `Smoke level ${calibratedSmoke.toFixed(0)} exceeded threshold ${device.smokeThreshold} on ${device.name}`,
      );
    }

    return state;
  }

  async handleControlCommand(command: ControlCommand): Promise<LiveDeviceState> {
    const state = await this.ensureLiveState(command.deviceId);
    const device = await this.devicesService.findOne(command.deviceId);

    switch (command.action) {
      case 'test-alarm':
        state.alarmActive = true;
        state.buzzerActive = true;
        state.ledStatus = 'red';
        state.lcdMessage = 'TEST ALARM';
        break;
      case 'reset-alarm':
        state.alarmActive = false;
        state.buzzerActive = false;
        state.flameDetected = false;
        state.ledStatus = 'green';
        state.lcdMessage = 'System Ready';
        break;
      case 'emergency':
        state.alarmActive = true;
        state.buzzerActive = true;
        state.ledStatus = 'red';
        state.lcdMessage = 'EMERGENCY!';
        break;
      case 'buzzer-on':
        state.buzzerActive = true;
        break;
      case 'buzzer-off':
        state.buzzerActive = false;
        if (!state.alarmActive) {
          state.ledStatus = 'green';
        }
        break;
    }

    state.lastSeen = new Date();
    this.liveState.set(command.deviceId, state);

    const ack = {
      deviceId: command.deviceId,
      deviceKey: device.deviceKey,
      action: command.action,
      requestedBy: command.requestedBy,
      state,
      at: new Date().toISOString(),
    };

    this.broadcast('control:ack', ack);

    if (this.emitToDevice) {
      this.emitToDevice(device.deviceKey, 'control:command', {
        action: command.action,
        state,
      });
    }

    if (command.action === 'test-alarm' || command.action === 'emergency') {
      await this.alertsService.create({
        deviceId: command.deviceId,
        type: command.action === 'emergency' ? AlertType.FIRE : AlertType.SYSTEM,
        severity:
          command.action === 'emergency'
            ? AlertSeverity.CRITICAL
            : AlertSeverity.INFO,
        title:
          command.action === 'emergency' ? 'Emergency Activated' : 'Test Alarm',
        message: `${command.action} issued for ${device.name}`,
      });
    }

    this.broadcast('sensor:update', {
      deviceId: device.id,
      deviceKey: device.deviceKey,
      ...state,
      smokeThreshold: device.smokeThreshold,
    });

    return state;
  }

  private async maybeCreateAlert(
    deviceId: string,
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
  ) {
    const recent = await this.alertsService.hasRecentAlert(deviceId, type, 30);
    if (recent) {
      return;
    }

    const alert = await this.alertsService.create({
      deviceId,
      type,
      severity,
      title,
      message,
      smsStatus: severity === AlertSeverity.CRITICAL ? 'PENDING' : 'NONE',
    });

    this.broadcast('alert:new', alert);
  }

  broadcast(event: string, payload: unknown) {
    if (this.emitToDashboard) {
      this.emitToDashboard(event, payload);
    }
  }
}
