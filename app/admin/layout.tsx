// app/admin/layout.tsx
export const dynamic = 'force-dynamic';
// Admin Dashboard Layout

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  MessageSquare,
  Ticket,
  Settings,
  BarChart3,
  Shield,
  Droplets,
  LogOut,
  Bell,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/vendors', icon: Store, label: 'Vendors' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
  { href: '/admin/promos', icon: Ticket, label: 'Promo Codes' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/admin')
  }
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true, image: true }
  })
  
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  
  // Get pending counts for badges
  const [pendingVendors, pendingReviews, pendingOrders] = await Promise.all([
    prisma.vendor.count({ where: { status: 'PENDING' } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.order.count({ where: { status: 'PAID' } }),
  ])
  
  const badges: Record<string, number> = {
    '/admin/vendors': pendingVendors,
    '/admin/reviews': pendingReviews,
    '/admin/orders': pendingOrders,
  }
  
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-slate-900 text-white">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold">Paaniyo</span>
              <span className="text-slate-400 ml-2 text-sm">Admin</span>
            </div>
          </Link>
          
          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {(pendingVendors + pendingReviews) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            
            {/* Store link */}
            <Link
              href="/"
              className="text-sm text-sky-400 hover:text-sky-300 font-medium hidden sm:block"
            >
              View Store →
            </Link>
            
            {/* User menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user.name || 'Admin'}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 z-30 w-64 h-[calc(100vh-4rem)] bg-slate-900 hidden lg:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const badge = badges[item.href]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                      {badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )
            })}
          </nav>
          
          {/* Bottom section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Link>
          </div>
        </aside>
        
        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 lg:hidden">
          <div className="flex items-center justify-around h-16">
            {navItems.slice(0, 5).map((item) => {
              const badge = badges[item.href]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px]">{item.label}</span>
                  {badge > 0 && (
                    <span className="absolute -top-1 right-0 w-4 h-4 text-[9px] font-medium bg-red-500 text-white rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
        
        {/* Main content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
