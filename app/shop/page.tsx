// app/shop/page.tsx - Main Shop with Use-Case Discovery
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';

export const metadata: Metadata = {
  title: 'Shop | Paaniyo - Bangladesh\'s Water Platform',
  description: 'Order water jars, bottles, filtration systems, and beverages. Free delivery on orders over ৳500.',
};

interface Props {
  searchParams: Promise<{
    type?: string;
    category?: string;
    brand?: string;
    useCase?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

async function getData(params: Awaited<Props['searchParams']>) {
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = 20;

  const where: any = { isActive: true };

  if (params.type) where.type = params.type;
  if (params.category) where.category = params.category;
  if (params.brand) where.brand = { slug: params.brand };
  if (params.useCase) where.useCases = { has: params.useCase };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { shortDesc: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  let orderBy: any = { isFeatured: 'desc' };
  if (params.sort === 'price-low') orderBy = { priceBDT: 'asc' };
  if (params.sort === 'price-high') orderBy = { priceBDT: 'desc' };
  if (params.sort === 'newest') orderBy = { createdAt: 'desc' };

  const [products, total, brands, types, useCases] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { brand: { select: { name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.groupBy({
      by: ['type'],
      where: { isActive: true },
      _count: { type: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { useCases: true },
      distinct: ['useCases'],
    }),
  ]);

  // Extract unique use cases
  const allUseCases = [...new Set(useCases.flatMap(p => p.useCases))];

  return {
    products,
    total,
    brands,
    types,
    useCases: allUseCases,
    page,
    totalPages: Math.ceil(total / limit),
    filters: params,
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await getData(params);

  return <ShopClient data={data} />;
}
