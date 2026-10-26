import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Nike' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/brands/nike.png' })
  @IsOptional()
  @IsString()
  logo?: string;
}
