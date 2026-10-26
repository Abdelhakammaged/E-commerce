import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateProductVariantDto } from './product-variant.dto';
import {
  emptyToUndefined,
  parseJsonArrayOf,
  toOptionalBoolean,
} from '../../common/form-data.transforms';

export class CreateProductDto {
  @ApiProperty({ example: 'Classic Cotton T-Shirt' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Comfortable everyday cotton tee' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [CreateProductVariantDto],
    example: [
      {
        color: 'red',
        size: 'S',
        price: 29.99,
        stock: 20,
      },
      {
        color: 'red',
        size: 'M',
        price: 29.99,
        stock: 30,
      },
    ],
    description:
      'Send as a JSON string when using multipart/form-data. image on each variant is optional. To upload a file for a variant, use variantImage_<index> instead of putting a file inside this JSON.',
  })
  @Transform(parseJsonArrayOf(CreateProductVariantDto))
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants!: CreateProductVariantDto[];

  @ApiPropertyOptional({ example: 'uuid-brand-id' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  brandId?: string;

  @ApiProperty({ example: 'uuid-category-id' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 'TSH-001' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  code?: string;
}
