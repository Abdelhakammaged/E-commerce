import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

// ✅ خارج الكلاس تماماً — مش بين @Injectable() والكلاس
const VISIBLE_ROLES: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [Role.ADMIN, Role.MANAGER, Role.CUSTOMER],
  [Role.ADMIN]: [Role.MANAGER, Role.CUSTOMER],
  [Role.MANAGER]: [Role.CUSTOMER],
  [Role.CUSTOMER]: [],
};

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 4,
  [Role.ADMIN]: 3,
  [Role.MANAGER]: 2,
  [Role.CUSTOMER]: 1,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(requestingUserRole: Role) {
    const allowedRoles = VISIBLE_ROLES[requestingUserRole];

    if (!allowedRoles.length)
      throw new ForbiddenException('You are not allowed to view users');

    return this.prisma.user.findMany({
      where: {
        role: { in: allowedRoles },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByIdFull(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        avatar: dto.avatar,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
      },
    });
  }

  async updateRole(targetId: string, newRole: Role, requestingRole: Role) {
    if (newRole === Role.SUPER_ADMIN && requestingRole !== Role.SUPER_ADMIN)
      throw new ForbiddenException(
        'Only SUPER_ADMIN can assign SUPER_ADMIN role',
      );

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  async deleteUser(targetId: string, requestingRole: Role) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });

    if (!target) throw new NotFoundException('User not found');

    if (ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[requestingRole])
      throw new ForbiddenException(
        'You cannot delete a user with equal or higher role',
      );

    return this.prisma.user.delete({ where: { id: targetId } });
  }
}
