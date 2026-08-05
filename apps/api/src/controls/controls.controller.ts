import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ControlsService } from './controls.service';
import { DevicesService } from '../devices/devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, ControlAction } from '../common/types';

class ControlDto {
  @IsString()
  @IsIn(['test-alarm', 'reset-alarm', 'emergency', 'buzzer-on', 'buzzer-off'])
  action!: ControlAction;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

class DeviceIdDto {
  @IsString()
  deviceId!: string;
}

class BuzzerDto {
  @IsString()
  deviceId!: string;

  @IsBoolean()
  on!: boolean;
}

@Controller('controls')
@UseGuards(JwtAuthGuard)
export class ControlsController {
  constructor(
    private readonly controlsService: ControlsService,
    private readonly devicesService: DevicesService,
  ) {}

  @Post()
  async execute(
    @Body() dto: ControlDto,
    @Req() req: { user: AuthUser },
  ) {
    const deviceId = await this.resolveDeviceId(dto.deviceId);
    return this.controlsService.execute(deviceId, dto.action, req.user.id);
  }

  @Post('test-alarm')
  async testAlarm(
    @Body() body: DeviceIdDto,
    @Req() req: { user: AuthUser },
  ) {
    const deviceId = await this.resolveDeviceId(body.deviceId);
    return this.controlsService.execute(deviceId, 'test-alarm', req.user.id);
  }

  @Post('reset-alarm')
  async resetAlarm(
    @Body() body: DeviceIdDto,
    @Req() req: { user: AuthUser },
  ) {
    const deviceId = await this.resolveDeviceId(body.deviceId);
    return this.controlsService.execute(deviceId, 'reset-alarm', req.user.id);
  }

  @Post('emergency')
  async emergency(
    @Body() body: DeviceIdDto,
    @Req() req: { user: AuthUser },
  ) {
    const deviceId = await this.resolveDeviceId(body.deviceId);
    return this.controlsService.execute(deviceId, 'emergency', req.user.id);
  }

  @Post('buzzer')
  async buzzer(
    @Body() body: BuzzerDto,
    @Req() req: { user: AuthUser },
  ) {
    const deviceId = await this.resolveDeviceId(body.deviceId);
    return this.controlsService.execute(
      deviceId,
      body.on ? 'buzzer-on' : 'buzzer-off',
      req.user.id,
    );
  }

  @Post(':deviceId/:action')
  async executeByPath(
    @Param('deviceId') deviceId: string,
    @Param('action') action: ControlAction,
    @Req() req: { user: AuthUser },
  ) {
    const allowed: ControlAction[] = [
      'test-alarm',
      'reset-alarm',
      'emergency',
      'buzzer-on',
      'buzzer-off',
    ];
    if (!allowed.includes(action)) {
      throw new BadRequestException(`Unknown action: ${action}`);
    }
    return this.controlsService.execute(deviceId, action, req.user.id);
  }

  private async resolveDeviceId(deviceId?: string): Promise<string> {
    if (deviceId) {
      return deviceId;
    }

    const devices = await this.devicesService.findAll();
    if (devices.length === 0) {
      throw new BadRequestException('No devices registered');
    }

    return devices[0].id;
  }
}
