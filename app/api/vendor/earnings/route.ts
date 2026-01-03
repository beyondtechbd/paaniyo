// app/api/vendor/earnings/route.ts
// Vendor Earnings API - Revenue tracking and payout history

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get vendor earnings data
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
            brands: { select: { id: true, name: true } },
            payouts: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            }
          }
        }
      }
    })
    
    if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized as vendor' }, { status: 403 })
    }
    
    const brandIds = user.vendor.brands.map(b => b.id)
    const commissionRate = parseFloat(user.vendor.commissionRate.toString())
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30'
    
    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))
    startDate.setHours(0, 0, 0, 0)
    
    // Get delivered orders for this period
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        deliveredAt: {
          gte: startDate,
          lte: now,
        },
        items: {
          some: {
            product: {
              brandId: { in: brandIds }
            }
          }
        }
      },
      include: {
        items: {
          where: {
            product: {
              brandId: { in: brandIds }
            }
          }
        }
      }
    })
    
    // Calculate total earnings from delivered orders
    let deliveredRevenue = 0
    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        deliveredRevenue += parseFloat(item.priceBDT.toString()) * item.quantity
      })
    })
    
    // Get pending orders (paid but not delivered)
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED'] },
        paidAt: {
          gte: startDate,
          lte: now,
        },
        items: {
          some: {
            product: {
              brandId: { in: brandIds }
            }
          }
        }
      },
      include: {
        items: {
          where: {
            product: {
              brandId: { in: brandIds }
            }
          }
        }
      }
    })
    
    let pendingRevenue = 0
    pendingOrders.forEach(order => {
      order.items.forEach(item => {
        pendingRevenue += parseFloat(item.priceBDT.toString()) * item.quantity
      })
    })
    
    // Calculate earnings with commission
    const deliveredCommission = deliveredRevenue * commissionRate / 100
    const deliveredNet = deliveredRevenue - deliveredCommission
    
    const pendingCommission = pendingRevenue * commissionRate / 100
    const pendingNet = pendingRevenue - pendingCommission
    
    // Daily breakdown for chart
    const dailyData: Record<string, { date: string; revenue: number; orders: number }> = {}
    
    // Initialize all days with 0
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dailyData[dateKey] = { date: dateKey, revenue: 0, orders: 0 }
    }
    
    // Fill in actual data from delivered orders
    deliveredOrders.forEach(order => {
      if (order.deliveredAt) {
        const dateKey = order.deliveredAt.toISOString().split('T')[0]
        if (dailyData[dateKey]) {
          dailyData[dateKey].orders += 1
          order.items.forEach(item => {
            dailyData[dateKey].revenue += parseFloat(item.priceBDT.toString()) * item.quantity
          })
        }
      }
    })
    
    const chartData = Object.values(dailyData)
    
    // All-time stats
    const allTimeDelivered = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        items: {
          some: {
            product: {
              brandId: { in: brandIds }
            }
          }
        }
      },
      include: {
        items: {
          where: {
            product: {
              brandId: { in: brandIds }
            }
          }
        }
      }
    })
    
    let allTimeRevenue = 0
    let allTimeUnits = 0
    allTimeDelivered.forEach(order => {
      order.items.forEach(item => {
        allTimeRevenue += parseFloat(item.priceBDT.toString()) * item.quantity
        allTimeUnits += item.quantity
      })
    })
    
    // Get payout summary
    const paidOut = user.vendor.payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    
    const pendingPayouts = user.vendor.payouts
      .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    
    // Available for payout (delivered but not paid out yet)
    const availableForPayout = parseFloat(user.vendor.balance.toString())
    
    return NextResponse.json({
      summary: {
        deliveredRevenue,
        deliveredCommission,
        deliveredNet,
        pendingRevenue,
        pendingCommission,
        pendingNet,
        totalRevenue: deliveredRevenue + pendingRevenue,
        totalNet: deliveredNet + pendingNet,
        commissionRate,
      },
      allTime: {
        revenue: allTimeRevenue,
        commission: allTimeRevenue * commissionRate / 100,
        net: allTimeRevenue * (100 - commissionRate) / 100,
        orders: allTimeDelivered.length,
        units: allTimeUnits,
      },
      payouts: {
        paidOut,
        pendingPayouts,
        availableForPayout,
      },
      chart: chartData,
      recentPayouts: user.vendor.payouts.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount.toString()),
        status: p.status,
        method: p.method,
        reference: p.reference,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
        processedAt: p.processedAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error('Vendor earnings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
