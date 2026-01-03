// app/product/[slug]/page.tsx
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ProductClient } from '@/components/product/ProductClient';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      reviews: {
        where: { isApproved: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!product) return null;

  // Related products
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        { brandId: product.brandId },
        { category: product.category },
      ],
    },
    take: 4,
    include: { brand: { select: { name: true, slug: true } } },
  });

  return { product, related };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: 'Product Not Found' };
  
  return {
    title: `${data.product.name} | Paaniyo`,
    description: data.product.shortDesc || data.product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProduct(slug);
  
  if (!data) notFound();

  return <ProductClient product={data.product} related={data.related} />;
}
