// app/api/vendor/analytics/route.ts
// Vendor Analytics API - Sales, orders, products stats

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
            brands: { select: { id: true } }
          }
        }
      }
    })
    
    if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized as vendor' }, { status: 403 })
    }
    
    const vendorId = user.vendor.id
    const brandIds = user.vendor.brands.map(b => b.id)
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)
    startDate.setHours(0, 0, 0, 0)
    
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - periodDays)
    
    // Get all order items for vendor's products
    const vendorOrderItems = await prisma.orderItem.findMany({
      where: {
        vendorId: vendorId,
        order: {
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { gte: startDate }
        }
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            paidAt: true,
          }
        }
      }
    })
    
    // Previous period order items
    const previousOrderItems = await prisma.orderItem.findMany({
      where: {
        vendorId: vendorId,
        order: {
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      }
    })
    
    // Calculate current period stats
    const currentRevenue = vendorOrderItems.reduce((sum, item) => 
      sum + parseFloat(item.totalBDT.toString()), 0
    )
    const currentOrders = new Set(vendorOrderItems.map(item => item.orderId)).size
    const currentUnitsSold = vendorOrderItems.reduce((sum, item) => sum + item.quantity, 0)
    
    // Calculate previous period stats
    const previousRevenue = previousOrderItems.reduce((sum, item) => 
      sum + parseFloat(item.totalBDT.toString()), 0
    )
    const previousOrders = new Set(previousOrderItems.map(item => item.orderId)).size
    const previousUnitsSold = previousOrderItems.reduce((sum, item) => sum + item.quantity, 0)
    
    // Growth calculations
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0
    const ordersGrowth = previousOrders > 0 
      ? ((currentOrders - previousOrders) / previousOrders) * 100 
      : currentOrders > 0 ? 100 : 0
    const unitsGrowth = previousUnitsSold > 0 
      ? ((currentUnitsSold - previousUnitsSold) / previousUnitsSold) * 100 
      : currentUnitsSold > 0 ? 100 : 0
    
    // Get product stats
    const totalProducts = await prisma.product.count({
      where: { brandId: { in: brandIds } }
    })
    
    const activeProducts = await prisma.product.count({
      where: { brandId: { in: brandIds }, isActive: true }
    })
    
    const lowStockProducts = await prisma.product.count({
      where: {
        brandId: { in: brandIds },
        trackStock: true,
        stock: { lte: prisma.product.fields.lowStockAt }
      }
    })
    
    // Actually, we need a different approach for low stock
    const lowStockProductsRaw = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM "Product" 
      WHERE "brandId" = ANY(${brandIds}) 
      AND "trackStock" = true 
      AND "stock" <= "lowStockAt"
    `
    const lowStockCount = Number(lowStockProductsRaw[0]?.count || 0)
    
    // Out of stock
    const outOfStockProducts = await prisma.product.count({
      where: {
        brandId: { in: brandIds },
        trackStock: true,
        stock: 0
      }
    })
    
    // Get pending orders count
    const pendingOrdersCount = await prisma.orderItem.groupBy({
      by: ['orderId'],
      where: {
        vendorId: vendorId,
        order: {
          status: { in: ['PAID', 'PROCESSING'] }
        }
      }
    })
    
    // Daily revenue for chart (last N days)
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const dayItems = vendorOrderItems.filter(item => {
        const itemDate = new Date(item.order.createdAt)
        return itemDate >= date && itemDate < nextDate
      })
      
      const dayRevenue = dayItems.reduce((sum, item) => 
        sum + parseFloat(item.totalBDT.toString()), 0
      )
      const dayOrders = new Set(dayItems.map(item => item.orderId)).size
      
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(dayRevenue),
        orders: dayOrders
      })
    }
    
    // Top products by revenue
    const productRevenue: Record<string, { id: string; name: string; revenue: number; units: number }> = {}
    for (const item of vendorOrderItems) {
      if (!productRevenue[item.productId]) {
        productRevenue[item.productId] = {
          id: item.productId,
          name: item.productName,
          revenue: 0,
          units: 0
        }
      }
      productRevenue[item.productId].revenue += parseFloat(item.totalBDT.toString())
      productRevenue[item.productId].units += item.quantity
    }
    
    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue)
      }))
    
    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        items: {
          some: { vendorId: vendorId }
        },
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNo: true,
        status: true,
        totalBDT: true,
        createdAt: true,
        user: {
          select: { name: true }
        },
        items: {
          where: { vendorId: vendorId },
          select: {
            productName: true,
            quantity: true,
            totalBDT: true
          }
        }
      }
    })
    
    // Calculate commission (vendor's commission rate)
    const commissionRate = parseFloat(user.vendor.commissionRate.toString())
    const commissionAmount = currentRevenue * commissionRate
    const netRevenue = currentRevenue - commissionAmount
    
    // Pending payout (delivered orders not yet paid out)
    // For now, assume all delivered orders in last 30 days are pending payout
    const deliveredItems = vendorOrderItems.filter(item => item.order.status === 'DELIVERED')
    const pendingPayout = deliveredItems.reduce((sum, item) => 
      sum + parseFloat(item.totalBDT.toString()) * (1 - commissionRate), 0
    )
    
    return NextResponse.json({
      overview: {
        revenue: Math.round(currentRevenue),
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        netRevenue: Math.round(netRevenue),
        orders: currentOrders,
        ordersGrowth: Math.round(ordersGrowth * 10) / 10,
        unitsSold: currentUnitsSold,
        unitsGrowth: Math.round(unitsGrowth * 10) / 10,
        pendingOrders: pendingOrdersCount.length,
        avgOrderValue: currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockCount,
        outOfStock: outOfStockProducts
      },
      earnings: {
        gross: Math.round(currentRevenue),
        commission: Math.round(commissionAmount),
        commissionRate: commissionRate * 100,
        net: Math.round(netRevenue),
        pendingPayout: Math.round(pendingPayout)
      },
      chart: dailyRevenue,
      topProducts,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
        customer: order.user.name || 'Customer',
        vendorTotal: order.items.reduce((sum, item) => sum + parseFloat(item.totalBDT.toString()), 0),
        items: order.items.length,
        createdAt: order.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Vendor analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
