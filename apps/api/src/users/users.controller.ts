import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../common/types';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.DEVELOPER)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  me(@Req() req: { user: AuthUser }) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  updateMe(
    @Req() req: { user: AuthUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get(':id')
  @Roles(Role.DEVELOPER)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
