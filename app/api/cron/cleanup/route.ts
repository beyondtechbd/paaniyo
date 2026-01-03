import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/cleanup - Clean up expired data
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results: Record<string, number> = {};

    // 1. Delete expired password reset tokens
    const deletedPasswordTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: { lt: now },
      },
    });
    results.passwordResetTokens = deletedPasswordTokens.count;

    // 2. Delete expired verification tokens
    const deletedVerificationTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: { lt: now },
      },
    });
    results.verificationTokens = deletedVerificationTokens.count;

    // 3. Delete expired sessions (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expires: { lt: thirtyDaysAgo },
      },
    });
    results.expiredSessions = deletedSessions.count;

    // 4. Clean up abandoned carts (older than 7 days with no updates)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: { lt: sevenDaysAgo },
      },
      select: { id: true },
    });

    if (abandonedCarts.length > 0) {
      // Delete cart items first
      await prisma.cartItem.deleteMany({
        where: {
          cartId: { in: abandonedCarts.map((c) => c.id) },
        },
      });
      // Then delete carts
      const deletedCarts = await prisma.cart.deleteMany({
        where: {
          id: { in: abandonedCarts.map((c) => c.id) },
        },
      });
      results.abandonedCarts = deletedCarts.count;
    } else {
      results.abandonedCarts = 0;
    }

    // 5. Reset locked accounts (after lockout period)
    const unlockTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes
    const unlockedAccounts = await prisma.user.updateMany({
      where: {
        lockedUntil: { lt: unlockTime },
        failedAttempts: { gt: 0 },
      },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
    results.unlockedAccounts = unlockedAccounts.count;

    // 6. Auto-cancel unpaid orders (older than 72 hours)
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: { in: ['PENDING', 'FAILED'] },
        createdAt: { lt: threeDaysAgo },
      },
      select: { id: true },
      take: 100, // Limit batch size
    });

    if (unpaidOrders.length > 0) {
      // Get order items to restore stock
      const orderItems = await prisma.orderItem.findMany({
        where: {
          orderId: { in: unpaidOrders.map((o) => o.id) },
        },
        select: { productId: true, quantity: true },
      });

      // Restore stock
      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Update order items status
      await prisma.orderItem.updateMany({
        where: {
          orderId: { in: unpaidOrders.map((o) => o.id) },
        },
        data: { status: 'CANCELLED' },
      });

      // Cancel orders
      const cancelledOrders = await prisma.order.updateMany({
        where: {
          id: { in: unpaidOrders.map((o) => o.id) },
        },
        data: {
          status: 'CANCELLED',
          notes: 'Auto-cancelled: Payment not received within 72 hours',
        },
      });
      results.autoCancelledOrders = cancelledOrders.count;
    } else {
      results.autoCancelledOrders = 0;
    }

    // 7. Delete old notifications (older than 30 days, if read)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    });
    results.oldNotifications = deletedNotifications.count;

    // Log results
    console.log('Cleanup completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET for manual trigger (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  return POST(request);
}
