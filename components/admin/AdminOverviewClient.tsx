// components/admin/AdminOverviewClient.tsx
// Admin Dashboard Overview UI

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react'

interface Stats {
  users: { total: number; newToday: number }
  vendors: { total: number; pending: number }
  products: { total: number; active: number }
  orders: { total: number; today: number; pending: number }
  reviews: { pending: number }
  revenue: { month: number }
}

interface AdminOverviewClientProps {
  initialStats: Stats
}

interface RecentActivity {
  id: string
  type: 'order' | 'user' | 'vendor' | 'review'
  title: string
  description: string
  time: string
  status?: 'pending' | 'success' | 'warning'
}

export default function AdminOverviewClient({ initialStats }: AdminOverviewClientProps) {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0 })}`
  }

  // Refresh stats
  const refreshStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentActivity(data.recentActivity || [])
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Stat cards configuration
  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: `+${stats.users.newToday} today`,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users',
    },
    {
      title: 'Vendors',
      value: stats.vendors.total.toLocaleString(),
      change: stats.vendors.pending > 0 
        ? `${stats.vendors.pending} pending` 
        : 'All approved',
      changeType: stats.vendors.pending > 0 ? 'warning' : 'success',
      icon: Store,
      color: 'bg-purple-500',
      href: '/admin/vendors',
    },
    {
      title: 'Products',
      value: stats.products.total.toLocaleString(),
      change: `${stats.products.active} active`,
      icon: Package,
      color: 'bg-emerald-500',
      href: '/admin/products',
    },
    {
      title: 'Orders Today',
      value: stats.orders.today.toLocaleString(),
      change: stats.orders.pending > 0 
        ? `${stats.orders.pending} pending` 
        : 'All processed',
      changeType: stats.orders.pending > 0 ? 'warning' : 'success',
      icon: ShoppingCart,
      color: 'bg-amber-500',
      href: '/admin/orders',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.revenue.month),
      change: 'This month',
      icon: DollarSign,
      color: 'bg-teal-500',
      href: '/admin/analytics',
    },
    {
      title: 'Pending Reviews',
      value: stats.reviews.pending.toLocaleString(),
      change: stats.reviews.pending > 0 
        ? 'Needs attention' 
        : 'All moderated',
      changeType: stats.reviews.pending > 0 ? 'warning' : 'success',
      icon: MessageSquare,
      color: 'bg-rose-500',
      href: '/admin/reviews',
    },
  ]

  const quickActions = [
    {
      title: 'Review Vendors',
      description: `${stats.vendors.pending} applications pending`,
      icon: Store,
      href: '/admin/vendors?status=PENDING',
      badge: stats.vendors.pending,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Moderate Reviews',
      description: `${stats.reviews.pending} reviews to approve`,
      icon: MessageSquare,
      href: '/admin/reviews?status=pending',
      badge: stats.reviews.pending,
      color: 'text-rose-600 bg-rose-100',
    },
    {
      title: 'Process Orders',
      description: `${stats.orders.pending} orders awaiting`,
      icon: ShoppingCart,
      href: '/admin/orders?status=PAID',
      badge: stats.orders.pending,
      color: 'text-amber-600 bg-amber-100',
    },
    {
      title: 'View Analytics',
      description: 'Revenue & performance',
      icon: TrendingUp,
      href: '/admin/analytics',
      badge: 0,
      color: 'text-teal-600 bg-teal-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={card.href}
              className="block p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-slate-500">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                <p className={`text-sm mt-1 ${
                  card.changeType === 'warning' ? 'text-amber-600' :
                  card.changeType === 'success' ? 'text-emerald-600' :
                  'text-slate-500'
                }`}>
                  {card.change}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <button
              onClick={refreshStats}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </p>
                  <p className="text-sm text-slate-500">{action.description}</p>
                </div>
                {action.badge > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                    {action.badge}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">System Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-700">Payment Gateway</span>
              </div>
              <span className="text-sm text-emerald-600 font-medium">Operational</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-700">Database</span>
              </div>
              <span className="text-sm text-emerald-600 font-medium">Healthy</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-700">CDN / Storage</span>
              </div>
              <span className="text-sm text-emerald-600 font-medium">Active</span>
            </div>
            
            {(stats.vendors.pending > 0 || stats.reviews.pending > 0) && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-700">Pending Actions</span>
                </div>
                <span className="text-sm text-amber-600 font-medium">
                  {stats.vendors.pending + stats.reviews.pending} items
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Platform Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Total Orders</p>
                <p className="font-semibold text-slate-900">{stats.orders.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Active Products</p>
                <p className="font-semibold text-slate-900">{stats.products.active.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Approved Vendors</p>
                <p className="font-semibold text-slate-900">{stats.vendors.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Registered Users</p>
                <p className="font-semibold text-slate-900">{stats.users.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pending Items Alert */}
      {(stats.vendors.pending > 0 || stats.reviews.pending > 0 || stats.orders.pending > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Attention Required</h3>
              <p className="text-white/90 mb-4">
                You have items that need your attention:
              </p>
              <div className="flex flex-wrap gap-4">
                {stats.vendors.pending > 0 && (
                  <Link
                    href="/admin/vendors?status=PENDING"
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Store className="w-4 h-4" />
                    {stats.vendors.pending} vendor applications
                  </Link>
                )}
                {stats.reviews.pending > 0 && (
                  <Link
                    href="/admin/reviews?status=pending"
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {stats.reviews.pending} reviews to moderate
                  </Link>
                )}
                {stats.orders.pending > 0 && (
                  <Link
                    href="/admin/orders?status=PAID"
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {stats.orders.pending} orders to process
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
