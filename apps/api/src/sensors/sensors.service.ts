import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReadingInput {
  deviceId: string;
  smokeLevel: number;
  flameDetected: boolean;
  temperature?: number;
  humidity?: number;
  buzzerActive?: boolean;
  ledStatus?: string;
  alarmActive?: boolean;
  lcdMessage?: string;
}

@Injectable()
export class SensorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReading(input: CreateReadingInput) {
    const device = await this.prisma.device.findUnique({
      where: { id: input.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${input.deviceId} not found`);
    }

    return this.prisma.sensorReading.create({
      data: {
        deviceId: input.deviceId,
        smokeLevel: input.smokeLevel,
        flameDetected: input.flameDetected,
        temperature: input.temperature,
        humidity: input.humidity,
        buzzerActive: input.buzzerActive ?? false,
        ledStatus: input.ledStatus ?? 'off',
        alarmActive: input.alarmActive ?? false,
        lcdMessage: input.lcdMessage,
      },
    });
  }

  async getLatest(deviceId?: string) {
    if (deviceId) {
      const reading = await this.prisma.sensorReading.findFirst({
        where: { deviceId },
        orderBy: { createdAt: 'desc' },
        include: { device: true },
      });

      if (!reading) {
        return null;
      }

      return reading;
    }

    const devices = await this.prisma.device.findMany({
      select: { id: true },
    });

    const latest = await Promise.all(
      devices.map((d) =>
        this.prisma.sensorReading.findFirst({
          where: { deviceId: d.id },
          orderBy: { createdAt: 'desc' },
          include: { device: true },
        }),
      ),
    );

    return latest.filter(Boolean);
  }

  async getHistory(
    deviceId: string,
    options?: { limit?: number; from?: Date; to?: Date },
  ) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return this.prisma.sensorReading.findMany({
      where: {
        deviceId,
        createdAt: {
          gte: options?.from,
          lte: options?.to,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 100,
    });
  }
}
