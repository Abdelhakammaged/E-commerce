import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'red' })
  @IsString()
  color!: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  size!: string;

  @ApiProperty({ example: 29.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 50, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'TSH-001-RED-M' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/red-m.jpg',
    description:
      'Optional. Prefer uploading a file named variantImage_<index> in multipart form-data. This JSON field is a fallback URL.',
  })
  @IsOptional()
  @IsString()
  image?: string;
}

export class ProductVariantResponseDto {
  @ApiProperty({ example: 'uuid-variant-id' }) id!: string;
  @ApiProperty({ example: 'red' }) color!: string;
  @ApiProperty({ example: 'M' }) size!: string;
  @ApiProperty({ example: 29.99 }) price!: number;
  @ApiProperty({ example: 50 }) stock!: number;
  @ApiPropertyOptional({ example: 'TSH-001-RED-M' }) sku?: string;
  @ApiPropertyOptional({ example: 'https://cdn.example.com/red-m.jpg' })
  image?: string;
}

export class UpdateProductVariantDto extends CreateProductVariantDto {
  @ApiPropertyOptional({ example: 'uuid-variant-id' })
  @IsOptional()
  @IsUUID()
  id?: string;
}
