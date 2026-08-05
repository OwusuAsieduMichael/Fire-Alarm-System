import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sensors')
@UseGuards(JwtAuthGuard)
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Get('latest')
  getLatest(@Query('deviceId') deviceId?: string) {
    return this.sensorsService.getLatest(deviceId);
  }

  @Get(':deviceId/history')
  getHistory(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.sensorsService.getHistory(deviceId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
