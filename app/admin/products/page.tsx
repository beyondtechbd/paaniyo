import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ProductsClient from '@/components/admin/ProductsClient';

export const metadata: Metadata = {
  title: 'Products | Admin Dashboard | Paaniyo',
  description: 'Manage all products on Paaniyo',
};

export default async function AdminProductsPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/login?callbackUrl=/admin/products');
  }

  // Get initial counts
  const [activeCount, inactiveCount, outOfStockCount, totalCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true, stock: { gt: 0 } } }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.count(),
  ]);

  // Get categories and brands for filters
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <ProductsClient
      initialCounts={{
        active: activeCount,
        inactive: inactiveCount,
        outOfStock: outOfStockCount,
        total: totalCount,
      }}
      categories={categories}
      brands={brands}
    />
  );
}
