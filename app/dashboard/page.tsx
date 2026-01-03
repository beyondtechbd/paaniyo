// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata = {
  title: 'My Dashboard | Paaniyo',
  description: 'Manage your account, view orders, and track your hydration',
};

async function getDashboardData(userId: string) {
  const [user, recentOrders, wishlistCount, addressCount, waterStats] = await Promise.all([
    // User profile
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
      },
    }),
    
    // Recent orders (last 5)
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: {
          take: 3,
          include: {
            product: {
              select: {
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    
    // Wishlist count
    prisma.wishlistItem.count({
      where: { userId },
    }),
    
    // Address count
    prisma.address.count({
      where: { userId },
    }),
    
    // Water intake stats (last 7 days)
    prisma.waterIntake.findMany({
      where: {
        userId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'desc' },
    }),
  ]);

  // Calculate order stats
  const orderStats = await prisma.order.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  // Total spent
  const totalSpent = await prisma.order.aggregate({
    where: { 
      userId,
      status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
    },
    _sum: { total: true },
  });

  // Water goal
  const waterGoal = await prisma.waterGoal.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return {
    user,
    recentOrders,
    wishlistCount,
    addressCount,
    waterStats,
    waterGoal,
    orderStats: {
      total: orderStats.reduce((acc, stat) => acc + stat._count, 0),
      pending: orderStats.find(s => s.status === 'PENDING')?._count || 0,
      processing: orderStats.find(s => s.status === 'PROCESSING')?._count || 0,
      shipped: orderStats.find(s => s.status === 'SHIPPED')?._count || 0,
      delivered: orderStats.find(s => s.status === 'DELIVERED')?._count || 0,
    },
    totalSpent: totalSpent._sum.total || 0,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/dashboard');
  }

  const data = await getDashboardData(session.user.id);

  if (!data.user) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <DashboardClient data={data} />
    </main>
  );
}
