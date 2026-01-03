// app/admin/page.tsx
export const dynamic = 'force-dynamic';
// Admin Dashboard Overview

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminOverviewClient from '@/components/admin/AdminOverviewClient'

export const metadata = {
  title: 'Admin Dashboard | Paaniyo',
  description: 'Paaniyo Admin Dashboard',
}

export default async function AdminDashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/admin')
  }
  
  // Verify admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  
  // Get quick stats
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const [
    totalUsers,
    newUsersToday,
    totalVendors,
    pendingVendors,
    totalProducts,
    activeProducts,
    totalOrders,
    ordersToday,
    pendingOrders,
    pendingReviews,
    revenueMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.vendor.count({ where: { status: 'APPROVED' } }),
    prisma.vendor.count({ where: { status: 'PENDING' } }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: monthStart },
        paymentStatus: 'PAID'
      },
      _sum: { totalBDT: true }
    })
  ])
  
  const initialStats = {
    users: {
      total: totalUsers,
      newToday: newUsersToday,
    },
    vendors: {
      total: totalVendors,
      pending: pendingVendors,
    },
    products: {
      total: totalProducts,
      active: activeProducts,
    },
    orders: {
      total: totalOrders,
      today: ordersToday,
      pending: pendingOrders,
    },
    reviews: {
      pending: pendingReviews,
    },
    revenue: {
      month: revenueMonth._sum.totalBDT ? parseFloat(revenueMonth._sum.totalBDT.toString()) : 0,
    }
  }
  
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">
          Welcome back! Here's what's happening on Paaniyo today.
        </p>
      </div>
      
      <AdminOverviewClient initialStats={initialStats} />
    </div>
  )
}
