import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProfileDto, UserResponseDto } from './dto/user-response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users/me ──────────────────────────────────────
  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() currentUser: any) {
    return this.usersService.findById(currentUser.id);
  }

  // ── GET /users ─────────────────────────────────────────
  @Get()
  @Roles(Role.MANAGER) // ← minimum role — guard checks hierarchy
  @ApiOperation({
    summary: '[MANAGER+] Get users — results depend on your role',
    description: `
      SUPER_ADMIN → sees ADMIN, MANAGER, CUSTOMER
      ADMIN       → sees MANAGER, CUSTOMER
      MANAGER     → sees CUSTOMER only
    `,
  })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@CurrentUser() currentUser: any) {
    return this.usersService.findAll(currentUser.role); // ← pass role
  }

  // ── GET /users/:id ─────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: '[ADMIN+ or Owner] Get a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-xxx' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const isOwner = currentUser.id === id;
    const isPrivileged = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER].includes(
      currentUser.role,
    );

    if (!isOwner && !isPrivileged)
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );

    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  // ── PATCH /users/:id/profile ───────────────────────────
  @Patch(':id/profile')
  @ApiOperation({ summary: '[ADMIN+ or Owner] Update user profile' })
  @ApiParam({ name: 'id', example: 'uuid-xxx' })
  @ApiResponse({ status: 200, type: ProfileDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: any,
  ) {
    const isOwner = currentUser.id === id;
    const isPrivileged = [Role.SUPER_ADMIN, Role.ADMIN].includes(
      currentUser.role,
    );

    if (!isOwner && !isPrivileged)
      throw new ForbiddenException(
        'You are not allowed to update this profile',
      );

    return this.usersService.updateProfile(id, dto);
  }

  // ── PATCH /users/:id/role ──────────────────────────────
  @Patch(':id/role')
  @Roles(Role.ADMIN) // ← ADMIN and SUPER_ADMIN only
  @ApiOperation({ summary: '[ADMIN+] Change a user role' })
  @ApiParam({ name: 'id', example: 'uuid-xxx' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.updateRole(id, dto.role, currentUser.role); // ← pass role
  }

  // ── DELETE /users/:id ──────────────────────────────────
  @Delete(':id')
  @Roles(Role.ADMIN) // ← ADMIN and SUPER_ADMIN only
  @ApiOperation({ summary: '[ADMIN+] Delete a user' })
  @ApiParam({ name: 'id', example: 'uuid-xxx' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.usersService.deleteUser(id, currentUser.role); // ← pass role
  }
}
