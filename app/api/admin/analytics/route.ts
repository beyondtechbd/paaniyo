import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/analytics - Get platform analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    startDate.setHours(0, 0, 0, 0);

    const now = new Date();

    // Overview Stats
    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      totalVendors,
      activeProducts,
      pendingOrders,
      deliveredOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.product.count(),
      prisma.vendor.count({ where: { status: 'APPROVED' } }),
      prisma.product.count({ where: { isActive: true, stock: { gt: 0 } } }),
      prisma.order.count({ where: { status: { in: ['PENDING', 'PAID', 'PROCESSING'] } } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
    ]);

    // Period comparison (current vs previous)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);

    const [currentPeriodRevenue, previousPeriodRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: startDate, lte: now },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: previousStartDate, lt: startDate },
        },
        _sum: { total: true },
      }),
    ]);

    const [currentPeriodOrders, previousPeriodOrders] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startDate, lte: now } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: previousStartDate, lt: startDate } },
      }),
    ]);

    const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
      prisma.user.count({
        where: { role: 'USER', createdAt: { gte: startDate, lte: now } },
      }),
      prisma.user.count({
        where: { role: 'USER', createdAt: { gte: previousStartDate, lt: startDate } },
      }),
    ]);

    // Revenue by day (for chart)
    const revenueByDay = await prisma.$queryRaw<Array<{ date: Date; revenue: number; orders: number }>>`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Users by day (for chart)
    const usersByDay = await prisma.$queryRaw<Array<{ date: Date; users: number }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as users
      FROM users
      WHERE role = 'USER' AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Top products by orders
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { createdAt: { gte: startDate } },
      },
      _sum: { quantity: true, total: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const topProductIds = topProducts.map((p) => p.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: {
        id: true,
        name: true,
        images: true,
        brand: { select: { name: true } },
      },
    });

    const productMap = new Map(productDetails.map((p) => [p.id, p]));
    const topProductsWithDetails = topProducts.map((p) => ({
      product: productMap.get(p.productId),
      quantity: p._sum.quantity,
      revenue: Number(p._sum.total || 0),
      orders: p._count.id,
    }));

    // Top brands by revenue
    const topBrands = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { createdAt: { gte: startDate }, paymentStatus: 'PAID' },
      },
      _sum: { total: true },
    });

    const brandRevenue = new Map<string, { name: string; revenue: number; logo: string | null }>();
    for (const item of topBrands) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { brand: { select: { id: true, name: true, logo: true } } },
      });
      if (product?.brand) {
        const existing = brandRevenue.get(product.brand.id);
        brandRevenue.set(product.brand.id, {
          name: product.brand.name,
          logo: product.brand.logo,
          revenue: (existing?.revenue || 0) + Number(item._sum.total || 0),
        });
      }
    }
    const topBrandsArray = Array.from(brandRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue by category
    const revenueByCategory = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { createdAt: { gte: startDate }, paymentStatus: 'PAID' },
      },
      _sum: { total: true },
    });

    const categoryRevenue = new Map<string, { name: string; revenue: number }>();
    for (const item of revenueByCategory) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { category: { select: { id: true, name: true } } },
      });
      if (product?.category) {
        const existing = categoryRevenue.get(product.category.id);
        categoryRevenue.set(product.category.id, {
          name: product.category.name,
          revenue: (existing?.revenue || 0) + Number(item._sum.total || 0),
        });
      }
    }
    const revenueByCategoryArray = Array.from(categoryRevenue.values())
      .sort((a, b) => b.revenue - a.revenue);

    // Order status distribution
    const orderStatusDistribution = await prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    });

    // Payment status distribution
    const paymentStatusDistribution = await prisma.order.groupBy({
      by: ['paymentStatus'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    });

    // Recent activity
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      where: { role: 'USER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    const recentReviews = await prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, image: true } },
        product: { select: { name: true } },
      },
    });

    // Calculate growth percentages
    const revenueGrowth = previousPeriodRevenue._sum.total
      ? ((Number(currentPeriodRevenue._sum.total || 0) - Number(previousPeriodRevenue._sum.total)) /
          Number(previousPeriodRevenue._sum.total)) *
        100
      : 0;

    const ordersGrowth = previousPeriodOrders
      ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100
      : 0;

    const usersGrowth = previousPeriodUsers
      ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100
      : 0;

    // Average order value
    const avgOrderValue = totalOrders
      ? Number(totalRevenue._sum.total || 0) / totalOrders
      : 0;

    return NextResponse.json({
      overview: {
        totalRevenue: Number(totalRevenue._sum.total || 0),
        totalOrders,
        totalUsers,
        totalProducts,
        totalVendors,
        activeProducts,
        pendingOrders,
        deliveredOrders,
        avgOrderValue,
      },
      periodStats: {
        revenue: Number(currentPeriodRevenue._sum.total || 0),
        orders: currentPeriodOrders,
        newUsers: currentPeriodUsers,
        revenueGrowth,
        ordersGrowth,
        usersGrowth,
      },
      charts: {
        revenueByDay: revenueByDay.map((d) => ({
          date: d.date,
          revenue: Number(d.revenue),
          orders: Number(d.orders),
        })),
        usersByDay: usersByDay.map((d) => ({
          date: d.date,
          users: Number(d.users),
        })),
        orderStatusDistribution: orderStatusDistribution.map((d) => ({
          status: d.status,
          count: d._count.id,
        })),
        paymentStatusDistribution: paymentStatusDistribution.map((d) => ({
          status: d.paymentStatus,
          count: d._count.id,
        })),
        revenueByCategory: revenueByCategoryArray,
      },
      topProducts: topProductsWithDetails,
      topBrands: topBrandsArray,
      recentActivity: {
        orders: recentOrders.map((o) => ({
          ...o,
          total: Number(o.total),
        })),
        users: recentUsers,
        reviews: recentReviews,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
