import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { QueryBrandsDto } from './dto/query-brands.dto';

const brandInclude = {
  _count: { select: { products: true } },
} satisfies Prisma.BrandInclude;

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto) {
    return this.mapBrand(
      await this.prisma.brand.create({
        data: {
          name: dto.name,
          logo: dto.logo,
        },
        include: brandInclude,
      }),
    );
  }

  async findAll(query: QueryBrandsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BrandWhereInput = {
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        include: brandInclude,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data: data.map(this.mapBrand),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: brandInclude,
    });

    if (!brand) throw new NotFoundException(`Brand #${id} not found`);
    return this.mapBrand(brand);
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);

    return this.mapBrand(
      await this.prisma.brand.update({
        where: { id },
        data: dto,
        include: brandInclude,
      }),
    );
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) throw new NotFoundException(`Brand #${id} not found`);

    if (brand._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete a brand that has products. Reassign or remove products first.',
      );
    }

    return this.prisma.brand.delete({ where: { id } });
  }

  private mapBrand(
    brand: Prisma.BrandGetPayload<{ include: typeof brandInclude }>,
  ) {
    const { _count, ...rest } = brand;
    return { ...rest, productCount: _count.products };
  }
}
