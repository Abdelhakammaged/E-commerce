import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

// Keep ProfileDto for the updateProfile response
export class ProfileDto {
  @ApiProperty({ example: 'uuid-xxx' }) id!: string;
  @ApiProperty({ example: 'John' }) firstName!: string;
  @ApiProperty({ example: 'Doe' }) lastName!: string;
  @ApiPropertyOptional({ example: '+201012345678' }) phone?: string;
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  avatar?: string;
}

// ✅ No more nested profile — all fields live directly on User now
export class UserResponseDto {
  @ApiProperty({ example: 'uuid-xxx' }) id!: string;
  @ApiProperty({ example: 'john@example.com' }) email!: string;
  @ApiProperty({ example: 'John' }) firstName!: string; // ← moved up
  @ApiProperty({ example: 'Doe' }) lastName!: string; // ← moved up
  @ApiPropertyOptional({ example: '+201012345678' }) phone?: string; // ← moved up
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  avatar?: string; // ← moved up
  @ApiProperty({ enum: Role, example: Role.CUSTOMER }) role!: Role;
  @ApiProperty({ example: '2024-01-01T00:00:00Z' }) createdAt!: Date;
  // ❌ Remove: profile?: ProfileDto  — this table no longer exists
}
