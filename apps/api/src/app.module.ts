import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { SensorsModule } from './sensors/sensors.module';
import { AlertsModule } from './alerts/alerts.module';
import { ControlsModule } from './controls/controls.module';
import { SettingsModule } from './settings/settings.module';
import { IotModule } from './iot/iot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DevicesModule,
    SensorsModule,
    AlertsModule,
    ControlsModule,
    SettingsModule,
    IotModule,
  ],
})
export class AppModule {}
