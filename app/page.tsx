// app/page.tsx - Paaniyo Homepage
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { HomeClient } from '@/components/home/HomeClient';

async function getData() {
  const session = await auth();

  const [featuredProducts, jars, brands, useCases] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      include: { brand: { select: { name: true, slug: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true, type: 'JAR' },
      take: 4,
      include: { brand: { select: { name: true, slug: true } } },
    }),
    prisma.brand.findMany({
      where: { isActive: true, isVerified: true },
      take: 6,
      select: { id: true, name: true, slug: true, logo: true, description: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { useCases: true },
    }),
  ]);

  const allUseCases = [...new Set(useCases.flatMap(p => p.useCases))].slice(0, 8);

  return {
    featuredProducts,
    jars,
    brands,
    useCases: allUseCases,
    user: session?.user || null,
  };
}

export default async function HomePage() {
  const data = await getData();
  return <HomeClient data={data} />;
}
