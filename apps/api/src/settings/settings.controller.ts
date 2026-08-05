import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class UpdateDeviceSettingsDto {
  @IsOptional()
  @IsNumber()
  smokeThreshold?: number;

  @IsOptional()
  @IsNumber()
  smokeCalibration?: number;
}

class UpdateConfigDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}

class BulkConfigDto {
  @IsObject()
  configs!: Record<string, string>;
}

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSystemConfig() {
    return this.settingsService.getSystemConfig();
  }

  @Get('config')
  @Roles(Role.DEVELOPER)
  getConfigList() {
    return this.settingsService.getConfigList();
  }

  @Put('config')
  @Roles(Role.DEVELOPER)
  setConfig(@Body() dto: UpdateConfigDto) {
    return this.settingsService.setConfig(dto.key, dto.value);
  }

  @Put('config/bulk')
  @Roles(Role.DEVELOPER)
  setConfigs(@Body() dto: BulkConfigDto) {
    return this.settingsService.setConfigs(dto.configs);
  }

  @Get('device/:deviceId')
  getDeviceSettings(@Param('deviceId') deviceId: string) {
    return this.settingsService.getDeviceSettings(deviceId);
  }

  @Patch('device/:deviceId')
  @Roles(Role.DEVELOPER)
  updateDeviceSettings(
    @Param('deviceId') deviceId: string,
    @Body() dto: UpdateDeviceSettingsDto,
  ) {
    return this.settingsService.updateDeviceSettings(deviceId, dto);
  }

  @Patch('device/:deviceId/threshold')
  @Roles(Role.DEVELOPER)
  updateThreshold(
    @Param('deviceId') deviceId: string,
    @Body() body: { smokeThreshold: number },
  ) {
    return this.settingsService.updateSmokeThreshold(
      deviceId,
      body.smokeThreshold,
    );
  }

  @Patch('device/:deviceId/calibration')
  @Roles(Role.DEVELOPER)
  updateCalibration(
    @Param('deviceId') deviceId: string,
    @Body() body: { smokeCalibration: number },
  ) {
    return this.settingsService.updateCalibration(
      deviceId,
      body.smokeCalibration,
    );
  }
}
