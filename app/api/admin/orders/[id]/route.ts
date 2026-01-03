import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, OrderItemStatus } from '@prisma/client';

// GET /api/admin/orders/[id] - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            createdAt: true,
            _count: {
              select: { orders: true },
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                sku: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            vendor: {
              select: {
                id: true,
                businessName: true,
                contactName: true,
                contactPhone: true,
              },
            },
          },
        },
        promoCode: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get order history/notes (if you have an audit log)
    // For now, we'll return basic status information

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      status, 
      paymentStatus, 
      trackingNumber, 
      trackingUrl,
      notes,
      itemId,
      itemStatus 
    } = body;

    // Find the order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If updating a specific item status
    if (itemId && itemStatus) {
      const validItemStatuses: OrderItemStatus[] = [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
      ];

      if (!validItemStatuses.includes(itemStatus)) {
        return NextResponse.json(
          { error: 'Invalid item status' },
          { status: 400 }
        );
      }

      const updatedItem = await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: itemStatus },
      });

      // Update vendor earnings if delivered
      if (itemStatus === 'DELIVERED') {
        const item = existingOrder.items.find(i => i.id === itemId);
        if (item && item.vendorId) {
          // Add to vendor balance
          await prisma.vendor.update({
            where: { id: item.vendorId },
            data: {
              balance: { increment: item.vendorAmount || 0 },
            },
          });
        }
      }

      // Check if all items have same status to update order status
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      const allDelivered = allItems.every(i => i.status === 'DELIVERED');
      const allCancelled = allItems.every(i => i.status === 'CANCELLED');
      const anyShipped = allItems.some(i => i.status === 'SHIPPED');
      const anyProcessing = allItems.some(i => i.status === 'PROCESSING' || i.status === 'CONFIRMED');

      let newOrderStatus: OrderStatus | null = null;
      if (allDelivered) {
        newOrderStatus = 'DELIVERED';
      } else if (allCancelled) {
        newOrderStatus = 'CANCELLED';
      } else if (anyShipped) {
        newOrderStatus = 'SHIPPED';
      } else if (anyProcessing) {
        newOrderStatus = 'PROCESSING';
      }

      if (newOrderStatus && newOrderStatus !== existingOrder.status) {
        await prisma.order.update({
          where: { id },
          data: { status: newOrderStatus },
        });
      }

      return NextResponse.json({
        item: updatedItem,
        message: `Item status updated to ${itemStatus}`,
      });
    }

    // Build update data for order
    const updateData: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      trackingNumber?: string;
      trackingUrl?: string;
      notes?: string;
    } = {};

    // Validate and set order status
    if (status) {
      const validStatuses: OrderStatus[] = [
        'PENDING',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid order status' },
          { status: 400 }
        );
      }

      updateData.status = status;

      // Update all item statuses when order status changes
      const itemStatusMap: Record<OrderStatus, OrderItemStatus> = {
        PENDING: 'PENDING',
        PAID: 'PENDING',
        PROCESSING: 'PROCESSING',
        SHIPPED: 'SHIPPED',
        DELIVERED: 'DELIVERED',
        CANCELLED: 'CANCELLED',
      };

      await prisma.orderItem.updateMany({
        where: { orderId: id },
        data: { status: itemStatusMap[status] },
      });

      // Handle vendor balance updates for delivered orders
      if (status === 'DELIVERED') {
        for (const item of existingOrder.items) {
          if (item.vendorId && item.status !== 'DELIVERED') {
            await prisma.vendor.update({
              where: { id: item.vendorId },
              data: {
                balance: { increment: item.vendorAmount || 0 },
              },
            });
          }
        }
      }
    }

    // Validate and set payment status
    if (paymentStatus) {
      const validPaymentStatuses: PaymentStatus[] = [
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED',
      ];

      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }

      updateData.paymentStatus = paymentStatus;
    }

    // Set tracking info
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Log the action
    console.log(`Admin ${session.user.email} updated order ${id}:`, {
      previousStatus: existingOrder.status,
      newStatus: status,
      paymentStatus,
      trackingNumber,
    });

    // TODO: Send email notification to customer about status change
    // if (status && status !== existingOrder.status) {
    //   await sendOrderStatusEmail(existingOrder.user.email, updatedOrder);
    // }

    return NextResponse.json({
      order: updatedOrder,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders/[id] - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    // Find the order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Can only cancel pending/paid orders
    if (!['PENDING', 'PAID'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel order that is already being processed' },
        { status: 400 }
      );
    }

    // Update order and items to cancelled
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      prisma.orderItem.updateMany({
        where: { orderId: id },
        data: { status: 'CANCELLED' },
      }),
    ]);

    // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    // TODO: Process refund if payment was made
    // if (order.paymentStatus === 'PAID') {
    //   await processRefund(order);
    // }

    return NextResponse.json({
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
