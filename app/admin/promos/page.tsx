import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import PromosClient from '@/components/admin/PromosClient';

export const metadata: Metadata = {
  title: 'Promo Codes - Admin | Paaniyo',
  description: 'Manage promotional codes and discounts',
};

export default async function AdminPromosPage() {
  const now = new Date();

  // Get initial counts
  const [activeCount, inactiveCount, expiredCount] = await Promise.all([
    prisma.promoCode.count({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    }),
    prisma.promoCode.count({ where: { isActive: false } }),
    prisma.promoCode.count({ where: { expiresAt: { lt: now } } }),
  ]);

  // Get total usage stats
  const totalUsage = await prisma.promoCode.aggregate({
    _sum: { usageCount: true },
  });

  return (
    <PromosClient
      initialCounts={{
        active: activeCount,
        inactive: inactiveCount,
        expired: expiredCount,
        total: activeCount + inactiveCount,
      }}
      initialStats={{
        totalUsage: totalUsage._sum.usageCount || 0,
      }}
    />
  );
}
