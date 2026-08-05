import { Module } from '@nestjs/common';
import { ControlsController } from './controls.controller';
import { ControlsService } from './controls.service';
import { DevicesModule } from '../devices/devices.module';
import { IotModule } from '../iot/iot.module';

@Module({
  imports: [DevicesModule, IotModule],
  controllers: [ControlsController],
  providers: [ControlsService],
})
export class ControlsModule {}
