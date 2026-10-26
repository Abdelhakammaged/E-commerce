import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty({ example: 'uuid-brand-id' }) id!: string;
  @ApiProperty({ example: 'Nike' }) name!: string;
  @ApiPropertyOptional({ example: 'https://cdn.example.com/brands/nike.png' })
  logo?: string;
  @ApiProperty({ example: 12 }) productCount!: number;
}
