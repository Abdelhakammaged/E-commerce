import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../users/roles.guard';
import { Roles } from '../users/roles.decorator';
import { productImagesMulterOptions } from '../uploads/product-images.storage';

const productImageFields = {
  images: {
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description:
      'Optional product gallery files (jpeg, png, webp, gif). Max 5MB each.',
  },
  variantImage_0: {
    type: 'string',
    format: 'binary',
    description:
      'Optional image for variants[0]. Use variantImage_1, variantImage_2, ... for later variants.',
  },
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products with optional filters and pagination',
  })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', example: 'uuid-xxx' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(AnyFilesInterceptor(productImagesMulterOptions))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'categoryId', 'variants'],
      properties: {
        name: { type: 'string', example: 'Classic Cotton T-Shirt' },
        description: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        brandId: { type: 'string', format: 'uuid' },
        isActive: { type: 'boolean' },
        isFeatured: { type: 'boolean' },
        code: { type: 'string', example: 'TSH-001' },
        variants: {
          type: 'string',
          description: 'JSON array of variants',
          example: '[{"color":"red","size":"M","price":29.99,"stock":30}]',
        },
        ...productImageFields,
      },
    },
  })
  @ApiOperation({
    summary: '[ADMIN+] Create a new product',
    description:
      'Send multipart/form-data. Product gallery files use the "images" field. Each variant can optionally include a file named variantImage_0, variantImage_1, ... matching the variants JSON array index. variants is a JSON string.',
  })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Category or brand not found' })
  @ApiResponse({
    status: 409,
    description: 'Product code or variant SKU already exists',
  })
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.create(dto, files ?? []);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  @UseInterceptors(AnyFilesInterceptor(productImagesMulterOptions))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        brandId: { type: 'string', format: 'uuid' },
        isActive: { type: 'boolean' },
        isFeatured: { type: 'boolean' },
        code: { type: 'string' },
        variants: {
          type: 'string',
          description:
            'JSON array of variants. Replaces all variants when sent.',
        },
        ...productImageFields,
      },
    },
  })
  @ApiOperation({
    summary: '[MANAGER+] Update a product',
    description:
      'Send multipart/form-data. New "images" files replace the product gallery. If variants are sent, optional variantImage_<index> files are stored on those variants.',
  })
  @ApiParam({ name: 'id', example: 'uuid-xxx' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 409,
    description: 'Product code or variant SKU already exists',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.update(id, dto, files ?? []);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN+] Delete a product' })
  @ApiParam({ name: 'id', example: 'uuid-xxx' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({
    status: 400,
    description: 'Product linked to orders or carts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
