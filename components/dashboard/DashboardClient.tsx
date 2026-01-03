// components/dashboard/DashboardClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  User,
  Package,
  Heart,
  MapPin,
  Droplets,
  TrendingUp,
  Clock,
  ChevronRight,
  Settings,
  LogOut,
  ShoppingBag,
  Truck,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  Award,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
      image: string;
      slug: string;
    };
  }>;
  _count: {
    items: number;
  };
}

interface WaterStat {
  id: string;
  date: Date;
  amount: number;
}

interface WaterGoal {
  id: string;
  dailyGoal: number;
}

interface DashboardData {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    createdAt: Date;
  };
  recentOrders: Order[];
  wishlistCount: number;
  addressCount: number;
  waterStats: WaterStat[];
  waterGoal: WaterGoal | null;
  orderStats: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
  };
  totalSpent: number;
}

interface DashboardClientProps {
  data: DashboardData;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'amber', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'blue', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'purple', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'indigo', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'green', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'red', icon: AlertCircle },
};

export function DashboardClient({ data }: DashboardClientProps) {
  const { user, recentOrders, wishlistCount, addressCount, waterStats, waterGoal, orderStats, totalSpent } = data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate today's water intake
  const today = new Date().toDateString();
  const todayIntake = waterStats
    .filter(stat => new Date(stat.date).toDateString() === today)
    .reduce((sum, stat) => sum + stat.amount, 0);
  
  const dailyGoal = waterGoal?.dailyGoal || 2000;
  const progressPercent = Math.min((todayIntake / dailyGoal) * 100, 100);

  // Quick stats
  const quickStats = [
    {
      label: 'Total Orders',
      value: orderStats.total,
      icon: Package,
      color: 'primary',
      href: '/orders',
    },
    {
      label: 'In Transit',
      value: orderStats.shipped,
      icon: Truck,
      color: 'indigo',
      href: '/orders?status=shipped',
    },
    {
      label: 'Wishlist',
      value: wishlistCount,
      icon: Heart,
      color: 'rose',
      href: '/wishlist',
    },
    {
      label: 'Addresses',
      value: addressCount,
      icon: MapPin,
      color: 'emerald',
      href: '/dashboard/addresses',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-sky-400">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Profile'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back, {user.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-${stat.color}-500/10`} />
                  <Icon className={`h-5 w-5 text-${stat.color}-500`} />
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </p>
                </Link>
              );
            })}
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Recent Orders
              </h2>
              <Link
                href="/orders"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <ShoppingBag className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-medium text-slate-900 dark:text-white">No orders yet</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Start shopping to see your orders here
                </p>
                <Link
                  href="/shop"
                  className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.PENDING;
                  const StatusIcon = status.icon;
                  
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-4 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      {/* Product Images */}
                      <div className="flex -space-x-3">
                        {order.items.slice(0, 3).map((item, i) => (
                          <div
                            key={item.id}
                            className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-slate-100 dark:border-slate-800"
                            style={{ zIndex: 3 - i }}
                          >
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {order._count.items > 3 && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-300">
                            +{order._count.items - 3}
                          </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            #{order.orderNumber}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-lg bg-${status.color}-100 px-2 py-0.5 text-xs font-medium text-${status.color}-700 dark:bg-${status.color}-900/30 dark:text-${status.color}-400`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                          {order._count.items} item{order._count.items > 1 ? 's' : ''} • {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Total */}
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {formatPrice(order.total)}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Order Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {/* Total Spent */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent</p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(totalSpent)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Across {orderStats.delivered} completed orders
              </p>
            </div>

            {/* Order Completion */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Delivered</p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {orderStats.delivered} orders
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${orderStats.total > 0 ? (orderStats.delivered / orderStats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Water Tracker Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-500 to-primary dark:border-slate-700"
          >
            <div className="p-5 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Water Tracker</h3>
                <Droplets className="h-5 w-5 opacity-80" />
              </div>
              
              <div className="mt-4 flex items-end gap-3">
                <p className="font-display text-4xl font-bold">
                  {todayIntake}
                  <span className="ml-1 text-lg font-normal opacity-80">ml</span>
                </p>
                <p className="mb-1 text-sm opacity-80">/ {dailyGoal}ml goal</p>
              </div>

              {/* Progress Ring */}
              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-16 w-16">
                  <svg className="h-16 w-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="opacity-30"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 1.76} 176`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {progressPercent >= 100
                      ? '🎉 Goal achieved!'
                      : progressPercent >= 50
                      ? 'Keep it up!'
                      : 'Stay hydrated!'}
                  </p>
                  <p className="text-xs opacity-80">
                    {dailyGoal - todayIntake > 0
                      ? `${dailyGoal - todayIntake}ml remaining`
                      : 'Great job today!'}
                  </p>
                </div>
              </div>

              <Link
                href="/tracker"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/30"
              >
                <Target className="h-4 w-4" />
                Open Tracker
              </Link>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="border-b border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Quick Links
              </h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {[
                { label: 'Edit Profile', href: '/dashboard/profile', icon: User },
                { label: 'Manage Addresses', href: '/dashboard/addresses', icon: MapPin },
                { label: 'Order History', href: '/orders', icon: Package },
                { label: 'My Wishlist', href: '/wishlist', icon: Heart },
                { label: 'Water Tracker', href: '/tracker', icon: Droplets },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {link.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Need Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
          >
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Need Help?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Our support team is here to assist you with any questions.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href="mailto:support@paaniyo.com"
                className="block text-sm font-medium text-primary hover:underline"
              >
                support@paaniyo.com
              </a>
              <a
                href="tel:+8801700000000"
                className="block text-sm font-medium text-primary hover:underline"
              >
                +880 1700-000000
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
