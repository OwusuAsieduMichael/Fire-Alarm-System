import { Injectable, NotFoundException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { IotService } from '../iot/iot.service';
import { ControlAction } from '../common/types';

@Injectable()
export class ControlsService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly iotService: IotService,
  ) {}

  async execute(
    deviceId: string,
    action: ControlAction,
    requestedBy?: string,
  ) {
    const device = await this.devicesService.findOne(deviceId);
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const result = await this.iotService.handleControlCommand({
      action,
      deviceId,
      requestedBy,
    });

    return {
      success: true,
      action,
      deviceId,
      state: result,
      message: this.messageForAction(action),
    };
  }

  private messageForAction(action: ControlAction): string {
    switch (action) {
      case 'test-alarm':
        return 'Test alarm triggered';
      case 'reset-alarm':
        return 'Alarm reset';
      case 'emergency':
        return 'Emergency mode activated';
      case 'buzzer-on':
        return 'Buzzer turned on';
      case 'buzzer-off':
        return 'Buzzer turned off';
      default:
        return 'Control command sent';
    }
  }
}
