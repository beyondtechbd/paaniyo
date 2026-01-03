// app/api/vendor/orders/[id]/items/[itemId]/route.ts
// Update order item status

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify vendor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        vendor: {
          include: {
            brands: { select: { id: true } }
          }
        }
      }
    })
    
    if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized as vendor' }, { status: 403 })
    }
    
    const brandIds = user.vendor.brands.map(b => b.id)
    
    // Verify the order item belongs to vendor's brand
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId: id,
        product: {
          brandId: { in: brandIds }
        }
      },
      include: {
        order: true,
        product: {
          select: { name: true, brandId: true }
        }
      }
    })
    
    if (!orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }
    
    const body = await request.json()
    const { status } = updateStatusSchema.parse(body)
    
    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [], // Final state
      CANCELLED: [], // Final state
    }
    
    if (!validTransitions[orderItem.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${orderItem.status} to ${status}` },
        { status: 400 }
      )
    }
    
    // Update the order item status
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status,
        ...(status === 'SHIPPED' ? { shippedAt: new Date() } : {}),
        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      }
    })
    
    // Check if all items in order have same status to update order status
    const allItems = await prisma.orderItem.findMany({
      where: { orderId: id }
    })
    
    const allSameStatus = allItems.every(item => item.status === status)
    const allDelivered = allItems.every(item => item.status === 'DELIVERED')
    const anyShipped = allItems.some(item => item.status === 'SHIPPED')
    const anyProcessing = allItems.some(item => item.status === 'PROCESSING')
    
    let newOrderStatus = orderItem.order.status
    
    if (allDelivered) {
      newOrderStatus = 'DELIVERED'
    } else if (anyShipped) {
      newOrderStatus = 'SHIPPED'
    } else if (anyProcessing) {
      newOrderStatus = 'PROCESSING'
    }
    
    if (newOrderStatus !== orderItem.order.status) {
      await prisma.order.update({
        where: { id: id },
        data: {
          status: newOrderStatus,
          ...(newOrderStatus === 'SHIPPED' ? { shippedAt: new Date() } : {}),
          ...(newOrderStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        }
      })
    }
    
    return NextResponse.json({
      message: 'Status updated successfully',
      item: {
        id: updatedItem.id,
        status: updatedItem.status,
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    console.error('Update order item status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
