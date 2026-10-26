import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Clothing' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Apparel and fashion items' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/categories/clothing.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'uuid-parent-category-id' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
