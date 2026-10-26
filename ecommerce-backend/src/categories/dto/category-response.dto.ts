import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CategorySummaryDto {
  @ApiProperty({ example: 'uuid-category-id' }) id!: string;
  @ApiProperty({ example: 'Clothing' }) name!: string;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 'uuid-category-id' }) id!: string;
  @ApiProperty({ example: 'Clothing' }) name!: string;
  @ApiPropertyOptional({ example: 'Apparel and fashion items' })
  description?: string;
  @ApiPropertyOptional({ example: 'https://cdn.example.com/categories/clothing.jpg' })
  image?: string;
  @ApiPropertyOptional({ example: 'uuid-parent-category-id' }) parentId?: string;
  @ApiPropertyOptional({ type: CategorySummaryDto }) parent?: CategorySummaryDto;
  @ApiPropertyOptional({ type: [CategorySummaryDto] }) children?: CategorySummaryDto[];
  @ApiProperty({ example: 5 }) productCount?: number;
  @ApiProperty({ example: '2024-01-01T00:00:00Z' }) createdAt!: Date;
}
