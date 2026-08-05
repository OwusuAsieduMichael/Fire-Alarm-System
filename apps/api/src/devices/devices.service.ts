import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeviceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.device.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { alerts: true, sensorReadings: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        connectionLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }

    return device;
  }

  async findByKey(deviceKey: string) {
    return this.prisma.device.findUnique({ where: { deviceKey } });
  }

  async create(data: {
    name: string;
    deviceKey?: string;
    wifiSsid?: string;
    firmwareVersion?: string;
    smokeThreshold?: number;
    smokeCalibration?: number;
  }) {
    const deviceKey = data.deviceKey ?? this.generateDeviceKey();

    try {
      return await this.prisma.device.create({
        data: {
          name: data.name,
          deviceKey,
          wifiSsid: data.wifiSsid,
          firmwareVersion: data.firmwareVersion ?? '1.0.0',
          smokeThreshold: data.smokeThreshold ?? 300,
          smokeCalibration: data.smokeCalibration ?? 0,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Device key already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      name?: string;
      wifiSsid?: string;
      ipAddress?: string;
      firmwareVersion?: string;
      smokeThreshold?: number;
      smokeCalibration?: number;
      status?: DeviceStatus;
    },
  ) {
    await this.findOne(id);

    return this.prisma.device.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.device.delete({ where: { id } });
    return { message: 'Device deleted' };
  }

  async updateStatus(
    id: string,
    status: DeviceStatus,
    meta?: { ipAddress?: string; wifiSsid?: string },
  ) {
    return this.prisma.device.update({
      where: { id },
      data: {
        status,
        lastSeen: new Date(),
        ipAddress: meta?.ipAddress,
        wifiSsid: meta?.wifiSsid,
      },
    });
  }

  async touchLastSeen(id: string) {
    return this.prisma.device.update({
      where: { id },
      data: { lastSeen: new Date(), status: DeviceStatus.ONLINE },
    });
  }

  async logConnection(deviceId: string, event: string, message: string) {
    return this.prisma.connectionLog.create({
      data: { deviceId, event, message },
    });
  }

  private generateDeviceKey(): string {
    return `FG-ESP32-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
