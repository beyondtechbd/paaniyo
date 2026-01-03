// app/api/vendor/orders/route.ts
// Vendor Orders API - List and manage orders

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - List vendor's orders
export async function GET(request: Request) {
  try {
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
            brands: { select: { id: true, name: true } }
          }
        }
      }
    })
    
    if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized as vendor' }, { status: 403 })
    }
    
    const brandIds = user.vendor.brands.map(b => b.id)
    
    if (brandIds.length === 0) {
      return NextResponse.json({ orders: [], total: 0, page: 1, limit: 20 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'newest'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    // Find orders that contain products from vendor's brands
    // We need to find OrderItems with products from our brands
    const orderItemsFilter: any = {
      product: {
        brandId: { in: brandIds }
      }
    }
    
    // Build order where clause
    const where: any = {
      items: {
        some: orderItemsFilter
      }
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    if (dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) }
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: endDate }
    }
    
    // Sort options
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'oldest': orderBy = { createdAt: 'asc' }; break
      case 'total-high': orderBy = { totalBDT: 'desc' }; break
      case 'total-low': orderBy = { totalBDT: 'asc' }; break
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true, phone: true }
          },
          items: {
            where: {
              product: {
                brandId: { in: brandIds }
              }
            },
            include: {
              product: {
                select: { 
                  name: true, 
                  slug: true, 
                  images: true,
                  brand: { select: { name: true } }
                }
              }
            }
          },
          shippingAddress: true,
        }
      }),
      prisma.order.count({ where })
    ])
    
    // Calculate vendor-specific totals
    const ordersWithVendorTotals = orders.map(order => {
      const vendorItems = order.items
      const vendorSubtotal = vendorItems.reduce(
        (sum, item) => sum + parseFloat(item.priceBDT.toString()) * item.quantity,
        0
      )
      
      return {
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
        vendorItemCount: vendorItems.reduce((sum, item) => sum + item.quantity, 0),
        totalBDT: parseFloat(order.totalBDT.toString()),
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        notes: order.notes,
      }
    })
    
    // Get order stats
    const statsWhere = {
      items: {
        some: orderItemsFilter
      }
    }
    
    const [pendingCount, processingCount, shippedCount, deliveredCount] = await Promise.all([
      prisma.order.count({ where: { ...statsWhere, status: 'PAID' } }),
      prisma.order.count({ where: { ...statsWhere, status: 'PROCESSING' } }),
      prisma.order.count({ where: { ...statsWhere, status: 'SHIPPED' } }),
      prisma.order.count({ where: { ...statsWhere, status: 'DELIVERED' } }),
    ])
    
    return NextResponse.json({
      orders: ordersWithVendorTotals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        pending: pendingCount,
        processing: processingCount,
        shipped: shippedCount,
        delivered: deliveredCount,
      }
    })
  } catch (error) {
    console.error('Vendor orders list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
