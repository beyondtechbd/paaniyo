import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import OrdersClient from '@/components/admin/OrdersClient';

export const metadata: Metadata = {
  title: 'Order Management - Admin | Paaniyo',
  description: 'Manage customer orders',
};

export default async function AdminOrdersPage() {
  // Get today's start
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get initial counts and stats
  const [
    pendingCount,
    paidCount,
    processingCount,
    shippedCount,
    deliveredCount,
    cancelledCount,
    todayOrders,
    todayRevenue,
  ] = await Promise.all([
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart },
        paidAt: { not: null },
      },
      _sum: { totalBDT: true },
    }),
  ]);

  return (
    <OrdersClient
      initialCounts={{
        pending: pendingCount,
        paid: paidCount,
        processing: processingCount,
        shipped: shippedCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        total: pendingCount + paidCount + processingCount + shippedCount + deliveredCount + cancelledCount,
      }}
      initialStats={{
        todayOrders,
        todayRevenue: Number(todayRevenue._sum.totalBDT) || 0,
      }}
    />
  );
}
