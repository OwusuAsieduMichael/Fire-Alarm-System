import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
  ) {}

  async getSystemConfig() {
    const configs = await this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    return Object.fromEntries(configs.map((c) => [c.key, c.value]));
  }

  async getConfigList() {
    return this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async setConfig(key: string, value: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async setConfigs(entries: Record<string, string>) {
    const results = [];
    for (const [key, value] of Object.entries(entries)) {
      results.push(await this.setConfig(key, value));
    }
    return results;
  }

  async getDeviceSettings(deviceId: string) {
    const device = await this.devicesService.findOne(deviceId);
    return {
      deviceId: device.id,
      name: device.name,
      smokeThreshold: device.smokeThreshold,
      smokeCalibration: device.smokeCalibration,
      firmwareVersion: device.firmwareVersion,
      wifiSsid: device.wifiSsid,
    };
  }

  async updateSmokeThreshold(deviceId: string, smokeThreshold: number) {
    return this.devicesService.update(deviceId, { smokeThreshold });
  }

  async updateCalibration(deviceId: string, smokeCalibration: number) {
    return this.devicesService.update(deviceId, { smokeCalibration });
  }

  async updateDeviceSettings(
    deviceId: string,
    data: { smokeThreshold?: number; smokeCalibration?: number },
  ) {
    if (
      data.smokeThreshold === undefined &&
      data.smokeCalibration === undefined
    ) {
      throw new BadRequestException('No settings provided');
    }

    return this.devicesService.update(deviceId, data);
  }
}
