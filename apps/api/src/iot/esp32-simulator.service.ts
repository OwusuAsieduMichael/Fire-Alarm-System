/**
 * DISABLED — not registered in IotModule.
 * Fake ESP32 telemetry was removed so the stack waits for real hardware.
 * Keep this file only as reference; do not re-enable for production demos.
 */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { IotService } from './iot.service';

@Injectable()
export class Esp32SimulatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Esp32SimulatorService.name);
  private timer: NodeJS.Timeout | null = null;
  private tick = 0;
  private persistCounter = 0;

  constructor(
    private readonly devicesService: DevicesService,
    private readonly iotService: IotService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.simulate();
    }, 2000);
    this.logger.log('ESP32 simulator started (2s interval)');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async simulate() {
    try {
      const devices = await this.devicesService.findAll();
      if (devices.length === 0) {
        return;
      }

      this.tick += 1;
      this.persistCounter += 1;

      for (const device of devices) {
        const state = await this.iotService.ensureLiveState(device.id);

        // Skip simulation when a real ESP32 is connected
        if (state.realDeviceConnected) {
          continue;
        }

        const base = 90 + Math.sin(this.tick / 8) * 40;
        const noise = (Math.random() - 0.5) * 30;
        let smokeLevel = Math.max(20, base + noise);

        // Occasional smoke spike (~5% chance)
        if (Math.random() < 0.05) {
          smokeLevel = device.smokeThreshold + 50 + Math.random() * 100;
        }

        // Rare flame event (~1.5% chance)
        const flameDetected = Math.random() < 0.015;

        const temperature = 22 + Math.sin(this.tick / 20) * 3 + Math.random();
        const humidity = 40 + Math.cos(this.tick / 15) * 8 + Math.random() * 2;

        let ledStatus = state.ledStatus;
        let buzzerActive = state.buzzerActive;
        let alarmActive = state.alarmActive;
        let lcdMessage = state.lcdMessage;

        if (!alarmActive) {
          ledStatus = 'green';
          buzzerActive = false;
          lcdMessage = 'Monitoring...';
        }

        if (smokeLevel > device.smokeThreshold || flameDetected) {
          alarmActive = true;
          buzzerActive = true;
          ledStatus = 'red';
          lcdMessage = flameDetected ? 'FIRE DETECTED!' : 'SMOKE ALERT!';
        }

        // Persist every ~10 ticks (20s) or on alarm conditions
        const shouldPersist =
          this.persistCounter % 10 === 0 ||
          smokeLevel > device.smokeThreshold ||
          flameDetected;

        await this.iotService.ingestSensorData(
          device.deviceKey,
          {
            smokeLevel,
            flameDetected,
            temperature: Number(temperature.toFixed(1)),
            humidity: Number(humidity.toFixed(1)),
            buzzerActive,
            ledStatus,
            alarmActive,
            lcdMessage,
          },
          { persist: shouldPersist, fromSimulator: true },
        );

        // Mark simulated device as online for dashboard
        if (state.status !== 'ONLINE') {
          await this.devicesService.updateStatus(device.id, 'ONLINE');
          state.status = 'ONLINE';
          this.iotService.broadcast('device:status', {
            deviceId: device.id,
            deviceKey: device.deviceKey,
            status: 'ONLINE',
            lastSeen: new Date(),
            simulated: true,
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        `Simulator tick failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
