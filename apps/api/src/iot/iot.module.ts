import { Module } from '@nestjs/common';
import { IotGateway } from './iot.gateway';
import { IotService } from './iot.service';
import { DevicesModule } from '../devices/devices.module';
import { SensorsModule } from '../sensors/sensors.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [DevicesModule, SensorsModule, AlertsModule],
  providers: [IotService, IotGateway],
  exports: [IotService],
})
export class IotModule {}
