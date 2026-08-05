import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(
    @Query('deviceId') deviceId?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alertsService.findAll({
      deviceId,
      acknowledged:
        acknowledged === undefined ? undefined : acknowledged === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.alertsService.acknowledge(id);
  }

  @Post('acknowledge-all')
  acknowledgeAll(@Query('deviceId') deviceId?: string) {
    return this.alertsService.acknowledgeAll(deviceId);
  }
}
