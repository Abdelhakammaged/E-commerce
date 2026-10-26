import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductVariantDto } from './product-variant.dto';
import { parseJsonArrayOf } from '../../common/form-data.transforms';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    type: [UpdateProductVariantDto],
    description:
      'When provided, replaces all variants. Send as a JSON string when using multipart/form-data.',
  })
  @IsOptional()
  @Transform(parseJsonArrayOf(UpdateProductVariantDto))
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];
}
