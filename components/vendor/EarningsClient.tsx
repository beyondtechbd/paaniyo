// components/vendor/EarningsClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowDownToLine,
  Loader2,
  Info,
  Package,
  BadgePercent,
} from 'lucide-react'
import PayoutRequestModal from './PayoutRequestModal'

interface EarningsData {
  summary: {
    deliveredRevenue: number
    deliveredCommission: number
    deliveredNet: number
    pendingRevenue: number
    pendingCommission: number
    pendingNet: number
    totalRevenue: number
    totalNet: number
    commissionRate: number
  }
  allTime: {
    revenue: number
    commission: number
    net: number
    orders: number
    units: number
  }
  payouts: {
    paidOut: number
    pendingPayouts: number
    availableForPayout: number
  }
  chart: Array<{ date: string; revenue: number; orders: number }>
  recentPayouts: Array<{
    id: string
    amount: number
    status: string
    method: string
    reference: string | null
    notes: string | null
    createdAt: string
    processedAt: string | null
  }>
}

interface Props {
  brandName: string
  commissionRate: number
  balance: number
  bankName: string | null
  bankAccount: string | null
  bkashNumber: string | null
}

export default function EarningsClient({ brandName, commissionRate, balance, bankName, bankAccount, bkashNumber }: Props) {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(balance)
  
  useEffect(() => {
    fetchEarnings()
  }, [period])
  
  async function fetchEarnings() {
    try {
      setLoading(true)
      const res = await fetch(`/api/vendor/earnings?period=${period}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
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
      day: 'numeric',
    })
  }
  
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700'
      case 'PROCESSING': return 'bg-blue-100 text-blue-700'
      case 'PENDING': return 'bg-amber-100 text-amber-700'
      case 'FAILED': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }
  
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500">Failed to load earnings data</p>
        <button
          onClick={fetchEarnings}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
          <p className="text-slate-500 mt-1">
            Track your revenue and payouts
          </p>
        </div>
        
        {/* Period Selector */}
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
      </div>
      
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-100 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Available Balance</span>
            </div>
            <p className="text-4xl font-bold">{formatCurrency(currentBalance)}</p>
            <p className="text-emerald-100 text-sm mt-2">
              Ready for withdrawal
            </p>
          </div>
          
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={currentBalance < 1000}
            className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4" />
              Request Payout
            </span>
          </button>
        </div>
        
        {currentBalance < 1000 && (
          <div className="mt-4 pt-4 border-t border-emerald-500/30">
            <p className="text-sm text-emerald-100 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Minimum payout amount is ৳1,000
            </p>
          </div>
        )}
      </motion.div>
      
      {/* Payout Request Modal */}
      <PayoutRequestModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        balance={currentBalance}
        bankName={bankName}
        bankAccount={bankAccount}
        bkashNumber={bkashNumber}
        onSuccess={() => {
          // Refresh earnings data after successful payout request
          fetchEarnings()
          // Update local balance (will be refreshed by fetchEarnings)
          setCurrentBalance(prev => prev - parseFloat(document.querySelector<HTMLInputElement>('input[type="number"]')?.value || '0'))
        }}
      />
      
      {/* Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Delivered Revenue</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(data.summary.deliveredRevenue)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Net: {formatCurrency(data.summary.deliveredNet)}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Pending Revenue</span>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(data.summary.pendingRevenue)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Net: {formatCurrency(data.summary.pendingNet)}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Platform Fee</span>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <BadgePercent className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(data.summary.deliveredCommission + data.summary.pendingCommission)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {commissionRate}% commission rate
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Net Earnings</span>
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(data.summary.totalNet)}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Last {period} days
          </p>
        </motion.div>
      </div>
      
      {/* Chart and All-Time Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Revenue Trend</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>Last {period} days</span>
            </div>
          </div>
          
          {/* Simple bar chart */}
          <div className="h-64 flex items-end gap-1">
            {data.chart.map((day, index) => {
              const height = maxChartValue > 0 ? (day.revenue / maxChartValue) * 100 : 0
              const isToday = index === data.chart.length - 1
              
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      <p className="font-medium">{formatCurrency(day.revenue)}</p>
                      <p className="text-slate-300">{day.orders} orders</p>
                    </div>
                  </div>
                  
                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{ delay: index * 0.02, duration: 0.5 }}
                    className={`w-full max-w-8 rounded-t-md ${
                      isToday
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : 'bg-gradient-to-t from-slate-300 to-slate-200 hover:from-emerald-400 hover:to-emerald-300'
                    } transition-colors cursor-pointer`}
                  />
                  
                  {/* Label - show every few days */}
                  {(index % Math.ceil(data.chart.length / 10) === 0 || isToday) && (
                    <span className={`text-[10px] mt-2 ${
                      isToday ? 'text-emerald-600 font-medium' : 'text-slate-400'
                    }`}>
                      {formatDate(day.date)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
        
        {/* All-Time Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-6">All-Time Stats</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <span className="text-slate-400">Total Revenue</span>
              <span className="font-semibold">{formatCurrency(data.allTime.revenue)}</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <span className="text-slate-400">Platform Fees</span>
              <span className="text-red-400">-{formatCurrency(data.allTime.commission)}</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <span className="text-slate-400">Net Earnings</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(data.allTime.net)}</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <span className="text-slate-400">Total Orders</span>
              <span className="font-semibold">{data.allTime.orders.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Units Sold</span>
              <span className="font-semibold">{data.allTime.units.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Payout Summary and History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payout Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payout Summary</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm text-emerald-700">Total Paid Out</span>
              <span className="font-semibold text-emerald-700">
                {formatCurrency(data.payouts.paidOut)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-sm text-amber-700">Processing</span>
              <span className="font-semibold text-amber-700">
                {formatCurrency(data.payouts.pendingPayouts)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
              <span className="text-sm text-sky-700">Available</span>
              <span className="font-semibold text-sky-700">
                {formatCurrency(data.payouts.availableForPayout)}
              </span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Payout Schedule</h4>
            <p className="text-sm text-slate-500">
              Payouts are processed weekly on Thursdays for all delivered orders from the previous week.
            </p>
          </div>
        </motion.div>
        
        {/* Recent Payouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Payouts</h3>
          
          {data.recentPayouts.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No payouts yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Your first payout will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {formatCurrency(payout.amount)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPayoutStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {payout.method} • {formatDateTime(payout.createdAt)}
                    </p>
                    {payout.reference && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ref: {payout.reference}
                      </p>
                    )}
                  </div>
                  
                  {payout.status === 'COMPLETED' && payout.processedAt && (
                    <div className="text-right">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(payout.processedAt)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* How Earnings Work */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-sky-50 border border-sky-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-sky-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          How Earnings Work
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h4 className="font-medium text-sky-900 mb-1">Orders Come In</h4>
            <p className="text-sm text-sky-700">
              When customers order your products, revenue is tracked as "pending" until delivery.
            </p>
          </div>
          
          <div>
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h4 className="font-medium text-sky-900 mb-1">Delivery Confirmation</h4>
            <p className="text-sm text-sky-700">
              Once orders are delivered, revenue moves to "delivered" and becomes available for payout.
            </p>
          </div>
          
          <div>
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h4 className="font-medium text-sky-900 mb-1">Weekly Payouts</h4>
            <p className="text-sm text-sky-700">
              Payouts are processed every Thursday. {commissionRate}% platform fee is deducted automatically.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
