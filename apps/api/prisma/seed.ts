import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('FireGuard@2026', 10);

  const developer = await prisma.user.upsert({
    where: { email: 'developer@fireguard.io' },
    update: {},
    create: {
      email: 'developer@fireguard.io',
      password: passwordHash,
      name: 'FireGuard Developer',
      role: Role.DEVELOPER,
      theme: 'dark',
      phone: '+10000000001',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@fireguard.io' },
    update: {},
    create: {
      email: 'user@fireguard.io',
      password: passwordHash,
      name: 'FireGuard User',
      role: Role.USER,
      theme: 'dark',
      phone: '+10000000002',
    },
  });

  const device = await prisma.device.upsert({
    where: { deviceKey: 'FG-ESP32-DEMO-001' },
    update: { status: 'OFFLINE' },
    create: {
      name: 'Main Hall Sensor',
      deviceKey: 'FG-ESP32-DEMO-001',
      status: 'OFFLINE',
      firmwareVersion: '1.0.0',
      smokeThreshold: 300,
      smokeCalibration: 0,
    },
  });

  const configs = [
    { key: 'sms_enabled', value: 'false' },
    { key: 'sms_provider', value: 'none' },
    { key: 'alert_cooldown_seconds', value: '30' },
    { key: 'simulator_enabled', value: 'false' },
    { key: 'company_name', value: 'FireGuard IoT' },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: cfg,
    });
  }

  console.log('Seed complete:');
  console.log(`  Developer: ${developer.email}`);
  console.log(`  User:      ${user.email}`);
  console.log(`  Device:    ${device.name} (${device.deviceKey})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
