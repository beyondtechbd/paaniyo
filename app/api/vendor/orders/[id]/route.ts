// app/api/vendor/orders/[id]/route.ts
// Vendor Order API - Get details and update item status

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Update item status schema
const updateItemStatusSchema = z.object({
  itemId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
})

// Helper to verify vendor has access to this order
async function verifyOrderAccess(userId: string, orderId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vendor: {
        include: {
          brands: { select: { id: true } }
        }
      }
    }
  })
  
  if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
    return { error: 'Not authorized as vendor', status: 403 }
  }
  
  const brandIds = user.vendor.brands.map(b => b.id)
  
  // Check if order has items from vendor's brands
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: {
        some: {
          product: {
            brandId: { in: brandIds }
          }
        }
      }
    },
    include: {
      user: {
        select: { name: true, email: true, phone: true }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              brandId: true,
              brand: { select: { id: true, name: true } }
            }
          }
        }
      },
      shippingAddress: true,
      billingAddress: true,
    }
  })
  
  if (!order) {
    return { error: 'Order not found', status: 404 }
  }
  
  return { order, brandIds, vendorId: user.vendor.id }
}

// GET - Get order details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const result = await verifyOrderAccess(session.user.id, id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    
    const { order, brandIds } = result
    
    // Filter items to only show vendor's products
    const vendorItems = order.items.filter(item => 
      brandIds.includes(item.product.brandId)
    )
    
    const vendorSubtotal = vendorItems.reduce(
      (sum, item) => sum + parseFloat(item.priceBDT.toString()) * item.quantity,
      0
    )
    
    return NextResponse.json({
      order: {
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customer: {
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        },
        shippingAddress: order.shippingAddress ? {
          name: order.shippingAddress.name,
          phone: order.shippingAddress.phone,
          address: order.shippingAddress.address,
          area: order.shippingAddress.area,
          city: order.shippingAddress.city,
          division: order.shippingAddress.division,
          postalCode: order.shippingAddress.postalCode,
        } : null,
        items: vendorItems.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImage: item.product.images[0] || null,
          brandName: item.product.brand.name,
          quantity: item.quantity,
          priceBDT: parseFloat(item.priceBDT.toString()),
          total: parseFloat(item.priceBDT.toString()) * item.quantity,
          status: item.status,
        })),
        vendorSubtotal,
        totalBDT: parseFloat(order.totalBDT.toString()),
        shippingBDT: parseFloat(order.shippingBDT.toString()),
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        notes: order.notes,
      }
    })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update order item status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const result = await verifyOrderAccess(session.user.id, id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    
    const { order, brandIds } = result
    
    const body = await request.json()
    const validatedData = updateItemStatusSchema.parse(body)
    
    // Find the order item and verify it belongs to vendor
    const orderItem = order.items.find(item => item.id === validatedData.itemId)
    
    if (!orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }
    
    if (!brandIds.includes(orderItem.product.brandId)) {
      return NextResponse.json({ error: 'You cannot update this item' }, { status: 403 })
    }
    
    // Update the order item status
    await prisma.orderItem.update({
      where: { id: validatedData.itemId },
      data: {
        status: validatedData.status,
      }
    })
    
    // Check if all items in the order have the same status
    // If so, update the order status
    const allOrderItems = await prisma.orderItem.findMany({
      where: { orderId: id }
    })
    
    const allStatuses = allOrderItems.map(item => item.status)
    const uniqueStatuses = [...new Set(allStatuses)]
    
    // If all items have the same status, update order status
    if (uniqueStatuses.length === 1) {
      const newStatus = uniqueStatuses[0]
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'SHIPPED' && !order.shippedAt) {
        updateData.shippedAt = new Date()
      }
      if (newStatus === 'DELIVERED' && !order.deliveredAt) {
        updateData.deliveredAt = new Date()
      }
      
      await prisma.order.update({
        where: { id },
        data: updateData
      })
    } else if (uniqueStatuses.includes('SHIPPED') && !uniqueStatuses.includes('PENDING') && !uniqueStatuses.includes('PROCESSING')) {
      // If all items are at least shipped
      await prisma.order.update({
        where: { id },
        data: { status: 'SHIPPED', shippedAt: order.shippedAt || new Date() }
      })
    } else if (uniqueStatuses.includes('PROCESSING') && !uniqueStatuses.includes('PENDING')) {
      // If all items are at least processing
      await prisma.order.update({
        where: { id },
        data: { status: 'PROCESSING' }
      })
    }
    
    return NextResponse.json({
      message: 'Item status updated successfully',
      itemId: validatedData.itemId,
      status: validatedData.status,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Update order item status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
