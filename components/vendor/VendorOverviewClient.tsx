// components/vendor/VendorOverviewClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Calendar,
  BarChart3,
  Wallet,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
} from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  overview: {
    revenue: number
    revenueGrowth: number
    netRevenue: number
    orders: number
    ordersGrowth: number
    unitsSold: number
    unitsGrowth: number
    pendingOrders: number
    avgOrderValue: number
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
  }
  earnings: {
    gross: number
    commission: number
    commissionRate: number
    net: number
    pendingPayout: number
  }
  chart: Array<{ date: string; revenue: number; orders: number }>
  topProducts: Array<{ id: string; name: string; revenue: number; units: number }>
  recentOrders: Array<{
    id: string
    orderNo: string
    status: string
    customer: string
    vendorTotal: number
    items: number
    createdAt: string
  }>
}

interface Props {
  vendorId: string
  brandName: string
  commissionRate: number
}

export default function VendorOverviewClient({ vendorId, brandName, commissionRate }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  
  useEffect(() => {
    fetchAnalytics()
  }, [period])
  
  async function fetchAnalytics() {
    try {
      setLoading(true)
      const res = await fetch(`/api/vendor/analytics?period=${period}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      month: 'short',
      day: 'numeric'
    })
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-blue-100 text-blue-700'
      case 'PROCESSING': return 'bg-amber-100 text-amber-700'
      case 'SHIPPED': return 'bg-purple-100 text-purple-700'
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'PROCESSING': return <Clock className="w-3.5 h-3.5" />
      case 'SHIPPED': return <Truck className="w-3.5 h-3.5" />
      case 'DELIVERED': return <PackageCheck className="w-3.5 h-3.5" />
      default: return null
    }
  }
  
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-20 mb-4" />
            <div className="h-8 bg-slate-200 rounded w-32 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load analytics data</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          Retry
        </button>
      </div>
    )
  }
  
  const maxChartValue = Math.max(...data.chart.map(d => d.revenue), 1)
  
  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
          {[
            { value: '7', label: '7 Days' },
            { value: '30', label: '30 Days' },
            { value: '90', label: '90 Days' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === option.value
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>Last {period} days</span>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Revenue</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(data.overview.revenue)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {data.overview.revenueGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              data.overview.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.overview.revenueGrowth > 0 ? '+' : ''}{data.overview.revenueGrowth}%
            </span>
            <span className="text-sm text-slate-500">vs last period</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Orders</span>
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {data.overview.orders}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {data.overview.ordersGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              data.overview.ordersGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.overview.ordersGrowth > 0 ? '+' : ''}{data.overview.ordersGrowth}%
            </span>
            <span className="text-sm text-slate-500">vs last period</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Units Sold</span>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {data.overview.unitsSold}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {data.overview.unitsGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              data.overview.unitsGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.overview.unitsGrowth > 0 ? '+' : ''}{data.overview.unitsGrowth}%
            </span>
            <span className="text-sm text-slate-500">vs last period</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Avg Order Value</span>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(data.overview.avgOrderValue)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {data.overview.pendingOrders} pending orders
          </p>
        </motion.div>
      </div>
      
      {/* Revenue Chart & Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Revenue Overview</h3>
          
          <div className="h-64 flex items-end gap-1">
            {data.chart.map((day, index) => {
              const height = maxChartValue > 0 ? (day.revenue / maxChartValue) * 100 : 0
              const isToday = index === data.chart.length - 1
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    <p className="font-medium">{formatCurrency(day.revenue)}</p>
                    <p className="text-slate-300">{day.orders} orders</p>
                  </div>
                  
                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{ delay: index * 0.02, duration: 0.5 }}
                    className={`w-full max-w-8 rounded-t-md ${
                      isToday
                        ? 'bg-gradient-to-t from-sky-600 to-sky-400'
                        : 'bg-gradient-to-t from-slate-300 to-slate-200 hover:from-sky-400 hover:to-sky-300'
                    } transition-colors cursor-pointer`}
                  />
                  
                  {/* Label */}
                  <span className={`text-[10px] mt-2 ${
                    isToday ? 'text-sky-600 font-medium' : 'text-slate-400'
                  }`}>
                    {formatDate(day.date)}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
        
        {/* Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Earnings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Gross Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(data.earnings.gross)}</p>
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-slate-700">
              <span className="text-sm text-slate-400">Platform Fee ({data.earnings.commissionRate}%)</span>
              <span className="text-red-400">-{formatCurrency(data.earnings.commission)}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-slate-700">
              <span className="text-sm text-slate-400">Net Earnings</span>
              <span className="text-lg font-semibold text-emerald-400">
                {formatCurrency(data.earnings.net)}
              </span>
            </div>
            
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Pending Payout</span>
                <span className="font-semibold">{formatCurrency(data.earnings.pendingPayout)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                From delivered orders
              </p>
            </div>
          </div>
          
          <Link
            href="/vendor/earnings"
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
      
      {/* Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Inventory Status</h3>
            <Link
              href="/vendor/products"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              Manage →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{data.products.total}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600">Active</p>
              <p className="text-2xl font-bold text-emerald-700">{data.products.active}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-600">Low Stock</p>
              </div>
              <p className="text-2xl font-bold text-amber-700">{data.products.lowStock}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-700">{data.products.outOfStock}</p>
            </div>
          </div>
          
          {/* Top Products */}
          {data.topProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-4">Top Selling Products</h4>
              <div className="space-y-3">
                {data.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-slate-200 text-slate-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-700 truncate max-w-40">
                        {product.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-xs text-slate-500">{product.units} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
            <Link
              href="/vendor/orders"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {data.recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No orders yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Orders will appear here once customers start purchasing
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        #{order.orderNo.slice(-8)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {order.customer} • {order.items} {order.items === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(order.vendorTotal)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
