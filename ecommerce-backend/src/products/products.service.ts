import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductVariantDto } from './dto/product-variant.dto';
import {
  deleteProductImageFiles,
  splitProductUploadFiles,
  toProductImageUrl,
  toProductImageUrls,
} from '../uploads/product-images.storage';

const productInclude = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  variants: { orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }] },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, files: Express.Multer.File[] = []) {
    await this.ensureCategoryExists(dto.categoryId);
    if (dto.brandId) await this.ensureBrandExists(dto.brandId);
    this.validateVariants(dto.variants);

    const code = this.normalizeOptionalString(dto.code);
    await this.ensureUniqueProductCode(code);

    const { productFiles, variantFiles } = splitProductUploadFiles(files);
    const images = toProductImageUrls(productFiles);
    const uploadedUrls = [
      ...images,
      ...[...variantFiles.values()]
        .map((file) => toProductImageUrl(file))
        .filter((url): url is string => Boolean(url)),
    ];

    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          images,
          brandId: dto.brandId,
          categoryId: dto.categoryId,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          code,
          variants: {
            create: dto.variants.map((variant, index) => ({
              color: variant.color,
              size: variant.size,
              price: variant.price,
              stock: variant.stock ?? 0,
              sku: this.normalizeOptionalString(variant.sku),
              image:
                toProductImageUrl(variantFiles.get(index)) ??
                this.normalizeOptionalString(variant.image),
            })),
          },
        },
        include: productInclude,
      });
    } catch (error) {
      await deleteProductImageFiles(uploadedUrls);
      this.handlePrismaError(error);
    }
  }

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.brandId && { brandId: query.brandId }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const existing = await this.findOne(id);

    if (dto.categoryId) await this.ensureCategoryExists(dto.categoryId);
    if (dto.brandId) await this.ensureBrandExists(dto.brandId);
    if (dto.variants) this.validateVariants(dto.variants);

    const { variants, ...productData } = dto;

    if (productData.code !== undefined) {
      productData.code = this.normalizeOptionalString(productData.code);
      await this.ensureUniqueProductCode(productData.code, id);
    }

    const { productFiles, variantFiles } = splitProductUploadFiles(files);
    const images =
      productFiles.length > 0 ? toProductImageUrls(productFiles) : undefined;
    const uploadedVariantUrls = [...variantFiles.values()]
      .map((file) => toProductImageUrl(file))
      .filter((url): url is string => Boolean(url));

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (variants) {
          await tx.productVariant.deleteMany({ where: { productId: id } });
          await tx.productVariant.createMany({
            data: variants.map((variant, index) => ({
              productId: id,
              color: variant.color,
              size: variant.size,
              price: variant.price,
              stock: variant.stock ?? 0,
              sku: this.normalizeOptionalString(variant.sku),
              image:
                toProductImageUrl(variantFiles.get(index)) ??
                this.normalizeOptionalString(variant.image),
            })),
          });
        }

        return tx.product.update({
          where: { id },
          data: {
            ...productData,
            ...(images ? { images } : {}),
          },
          include: productInclude,
        });
      });

      if (images) {
        await deleteProductImageFiles(existing.images);
      }
      if (variants) {
        const keptVariantUrls = variants
          .map(
            (variant, index) =>
              toProductImageUrl(variantFiles.get(index)) ??
              this.normalizeOptionalString(variant.image),
          )
          .filter((url): url is string => Boolean(url));
        const previousVariantUrls = existing.variants
          .map((variant) => variant.image)
          .filter((url): url is string => Boolean(url));

        await deleteProductImageFiles(
          previousVariantUrls.filter((url) => !keptVariantUrls.includes(url)),
        );
      }

      return updated;
    } catch (error) {
      await deleteProductImageFiles([
        ...(images ?? []),
        ...uploadedVariantUrls,
      ]);
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            _count: {
              select: { orderItems: true, cartItems: true },
            },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) throw new NotFoundException(`Product #${id} not found`);

    const hasLinkedItems = product.variants.some(
      (variant) => variant._count.orderItems > 0,
    );

    if (hasLinkedItems) {
      throw new BadRequestException(
        'Cannot delete a product that has been ordered. Deactivate it instead.',
      );
    }

    const deleted = await this.prisma.product.delete({ where: { id } });
    await deleteProductImageFiles([
      ...product.images,
      ...product.variants
        .map((variant) => variant.image)
        .filter((url): url is string => Boolean(url)),
    ]);
    return deleted;
  }

  private validateVariants(variants: CreateProductVariantDto[]) {
    const seenCombinations = new Set<string>();
    const seenSkus = new Set<string>();

    for (const variant of variants) {
      if (!variant?.color || !variant?.size) {
        throw new BadRequestException(
          'Each variant must include color and size',
        );
      }

      const key = `${variant.color.toLowerCase()}::${variant.size.toLowerCase()}`;
      if (seenCombinations.has(key)) {
        throw new BadRequestException(
          `Duplicate variant for color "${variant.color}" and size "${variant.size}"`,
        );
      }
      seenCombinations.add(key);

      const sku = this.normalizeOptionalString(variant.sku);
      if (sku) {
        const skuKey = sku.toLowerCase();
        if (seenSkus.has(skuKey)) {
          throw new BadRequestException(`Duplicate variant SKU "${sku}"`);
        }
        seenSkus.add(skuKey);
      }
    }
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private async ensureUniqueProductCode(
    code: string | undefined,
    excludeProductId?: string,
  ) {
    if (!code) return;

    const existing = await this.prisma.product.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing && existing.id !== excludeProductId) {
      throw new ConflictException(`Product code "${code}" is already in use`);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = (error.meta?.target as string[] | undefined) ?? [];

      if (target.includes('code')) {
        throw new ConflictException('Product code is already in use');
      }

      if (target.includes('sku')) {
        throw new ConflictException('Variant SKU is already in use');
      }

      throw new ConflictException('A unique constraint was violated');
    }

    throw error;
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category)
      throw new NotFoundException(`Category #${categoryId} not found`);
  }

  private async ensureBrandExists(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException(`Brand #${brandId} not found`);
  }
}

