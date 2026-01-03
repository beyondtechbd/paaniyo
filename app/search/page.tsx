// app/search/page.tsx
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { SearchClient } from '@/components/search/SearchClient';
import { Prisma } from '@prisma/client';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    waterType?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  
  return {
    title: q ? `Search: "${q}" | Paaniyo` : 'Search Products | Paaniyo',
    description: q 
      ? `Search results for "${q}" - Find premium water products at Paaniyo` 
      : 'Search our collection of premium water products',
  };
}

async function searchProducts(params: {
  q?: string;
  category?: string;
  brand?: string;
  waterType?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}) {
  const page = parseInt(params.page || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { shortDesc: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
      { brand: { name: { contains: params.q, mode: 'insensitive' } } },
    ];
  }

  if (params.category) {
    where.category = params.category as Prisma.ProductCategory;
  }

  if (params.brand) {
    where.brand = { slug: params.brand };
  }

  if (params.waterType) {
    where.waterType = params.waterType as Prisma.WaterType;
  }

  if (params.minPrice || params.maxPrice) {
    where.priceBDT = {};
    if (params.minPrice) where.priceBDT.gte = parseInt(params.minPrice);
    if (params.maxPrice) where.priceBDT.lte = parseInt(params.maxPrice);
  }

  // Build orderBy
  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
  switch (params.sort) {
    case 'price-low':
      orderBy = [{ priceBDT: 'asc' }];
      break;
    case 'price-high':
      orderBy = [{ priceBDT: 'desc' }];
      break;
    case 'newest':
      orderBy = [{ createdAt: 'desc' }];
      break;
    case 'name':
      orderBy = [{ name: 'asc' }];
      break;
    default:
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        priceBDT: true,
        compareBDT: true,
        images: true,
        volumeMl: true,
        waterType: true,
        stock: true,
        freeShipping: true,
        isFeatured: true,
        sustainable: true,
        brand: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Get filter options
  const [brands, categories, waterTypes, priceRange] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    }),
    prisma.product.groupBy({
      by: ['waterType'],
      where: { isActive: true, waterType: { not: null } },
      _count: true,
    }),
    prisma.product.aggregate({
      where: { isActive: true },
      _min: { priceBDT: true },
      _max: { priceBDT: true },
    }),
  ]);

  return {
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.priceBDT),
      comparePrice: p.compareBDT ? Number(p.compareBDT) : null,
      image: (p.images as string[])[0] || '/images/placeholder-product.jpg',
      volumeMl: p.volumeMl,
      waterType: p.waterType,
      stock: p.stock,
      freeShipping: p.freeShipping,
      isFeatured: p.isFeatured,
      sustainable: p.sustainable,
      brand: p.brand,
      discount: p.compareBDT
        ? Math.round(((Number(p.compareBDT) - Number(p.priceBDT)) / Number(p.compareBDT)) * 100)
        : 0,
      available: p.stock > 0,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    filters: {
      brands,
      categories: categories.map(c => ({
        value: c.category,
        label: c.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        count: c._count,
      })),
      waterTypes: waterTypes.filter(w => w.waterType).map(w => ({
        value: w.waterType!,
        label: w.waterType!.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        count: w._count,
      })),
      priceRange: {
        min: Number(priceRange._min.priceBDT) || 0,
        max: Number(priceRange._max.priceBDT) || 10000,
      },
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const data = await searchProducts(params);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <SearchClient
        initialData={data}
        query={params.q || ''}
        currentFilters={{
          category: params.category,
          brand: params.brand,
          waterType: params.waterType,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
        }}
        currentSort={params.sort || 'relevance'}
      />
    </main>
  );
}
