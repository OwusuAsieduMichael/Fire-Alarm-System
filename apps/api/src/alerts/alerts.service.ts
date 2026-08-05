import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertSeverity, AlertType, SmsStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAlertInput {
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  smsStatus?: SmsStatus;
}

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options?: {
    deviceId?: string;
    acknowledged?: boolean;
    limit?: number;
  }) {
    return this.prisma.alert.findMany({
      where: {
        deviceId: options?.deviceId,
        acknowledged: options?.acknowledged,
      },
      include: {
        device: {
          select: { id: true, name: true, deviceKey: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
    });
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        device: {
          select: { id: true, name: true, deviceKey: true },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${id} not found`);
    }

    return alert;
  }

  async create(input: CreateAlertInput) {
    return this.prisma.alert.create({
      data: {
        deviceId: input.deviceId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        message: input.message,
        smsStatus: input.smsStatus ?? SmsStatus.NONE,
      },
      include: {
        device: {
          select: { id: true, name: true, deviceKey: true },
        },
      },
    });
  }

  async acknowledge(id: string) {
    await this.findOne(id);

    return this.prisma.alert.update({
      where: { id },
      data: { acknowledged: true },
      include: {
        device: {
          select: { id: true, name: true, deviceKey: true },
        },
      },
    });
  }

  async acknowledgeAll(deviceId?: string) {
    const result = await this.prisma.alert.updateMany({
      where: {
        acknowledged: false,
        deviceId,
      },
      data: { acknowledged: true },
    });

    return { acknowledged: result.count };
  }

  /** Avoid alert spam — returns true if a similar recent alert exists. */
  async hasRecentAlert(
    deviceId: string,
    type: AlertType,
    withinSeconds = 30,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinSeconds * 1000);
    const existing = await this.prisma.alert.findFirst({
      where: {
        deviceId,
        type,
        createdAt: { gte: since },
      },
    });
    return Boolean(existing);
  }
}
