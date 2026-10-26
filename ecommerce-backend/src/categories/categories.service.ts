import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';

const categoryInclude = {
  parent: { select: { id: true, name: true } },
  children: { select: { id: true, name: true }, orderBy: { name: 'asc' as const } },
  _count: { select: { products: true } },
} satisfies Prisma.CategoryInclude;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) await this.ensureParentExists(dto.parentId);

    return this.mapCategory(
      await this.prisma.category.create({
        data: {
          name: dto.name,
          description: dto.description,
          image: dto.image,
          parentId: dto.parentId,
        },
        include: categoryInclude,
      }),
    );
  }

  async findAll(query: QueryCategoriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
      ...(query.parentId && { parentId: query.parentId }),
      ...(query.rootsOnly && { parentId: null }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: categoryInclude,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: data.map(this.mapCategory),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: categoryInclude,
    });

    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return this.mapCategory(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      if (dto.parentId) {
        await this.ensureParentExists(dto.parentId);
        await this.ensureNotDescendant(id, dto.parentId);
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
      include: categoryInclude,
    });

    return this.mapCategory(category);
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) throw new NotFoundException(`Category #${id} not found`);

    if (category._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has products. Reassign or remove products first.',
      );
    }

    if (category._count.children > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has subcategories. Remove or reassign subcategories first.',
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  private mapCategory(
    category: Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>,
  ) {
    const { _count, ...rest } = category;
    return { ...rest, productCount: _count.products };
  }

  private async ensureParentExists(parentId: string) {
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent)
      throw new NotFoundException(`Parent category #${parentId} not found`);
  }

  private async ensureNotDescendant(categoryId: string, newParentId: string) {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === categoryId) {
        throw new BadRequestException(
          'Cannot set a descendant category as parent (circular reference)',
        );
      }

      const ancestor: { parentId: string | null } | null =
        await this.prisma.category.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

      currentId = ancestor?.parentId ?? null;
    }
  }
}
