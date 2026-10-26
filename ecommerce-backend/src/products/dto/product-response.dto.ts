import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantResponseDto } from './product-variant.dto';

class CategorySummaryDto {
  @ApiProperty({ example: 'uuid-category-id' }) id!: string;
  @ApiProperty({ example: 'Clothing' }) name!: string;
}

class BrandSummaryDto {
  @ApiProperty({ example: 'uuid-brand-id' }) id!: string;
  @ApiProperty({ example: 'Nike' }) name!: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-product-id' }) id!: string;
  @ApiProperty({ example: 'Classic Cotton T-Shirt' }) name!: string;
  @ApiPropertyOptional({ example: 'Comfortable everyday cotton tee' })
  description?: string;
  @ApiProperty({ example: ['https://cdn.example.com/img1.jpg'] })
  images!: string[];
  @ApiProperty({ type: [ProductVariantResponseDto] })
  variants!: ProductVariantResponseDto[];
  @ApiProperty({ example: 4.5 }) rating!: number;
  @ApiProperty({ example: 12 }) reviewsCount!: number;
  @ApiPropertyOptional({ example: 'uuid-brand-id' }) brandId?: string;
  @ApiProperty({ example: true }) isActive!: boolean;
  @ApiProperty({ example: 'uuid-category-id' }) categoryId!: string;
  @ApiProperty({ example: false }) isFeatured!: boolean;
  @ApiPropertyOptional({ example: 'TSH-001' }) code?: string;
  @ApiPropertyOptional({ type: CategorySummaryDto }) category?: CategorySummaryDto;
  @ApiPropertyOptional({ type: BrandSummaryDto }) brand?: BrandSummaryDto;
  @ApiProperty({ example: '2024-01-01T00:00:00Z' }) createdAt!: Date;
  @ApiProperty({ example: '2024-01-01T00:00:00Z' }) updatedAt!: Date;
}
