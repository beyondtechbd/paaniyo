// app/vendor/layout.tsx
export const dynamic = 'force-dynamic';
// Vendor Dashboard Layout with sidebar navigation

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Building2,
  Settings,
  ChevronRight,
  Droplets,
  LogOut,
  Bell,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/vendor', icon: LayoutDashboard, label: 'Overview' },
  { href: '/vendor/products', icon: Package, label: 'Products' },
  { href: '/vendor/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/vendor/earnings', icon: DollarSign, label: 'Earnings' },
  { href: '/vendor/brand', icon: Building2, label: 'Brand' },
  { href: '/vendor/settings', icon: Settings, label: 'Settings' },
]

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/vendor')
  }
  
  // Verify user is a vendor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      vendor: {
        include: {
          brands: {
            select: { id: true, name: true, logo: true }
          }
        }
      }
    }
  })
  
  if (user?.role !== 'VENDOR' || !user.vendor) {
    redirect('/dashboard')
  }
  
  if (user.vendor.status === 'PENDING') {
    redirect('/vendor/pending')
  }
  
  if (user.vendor.status === 'SUSPENDED') {
    redirect('/vendor/suspended')
  }
  
  const brand = user.vendor.brands[0]
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Logo */}
          <Link href="/vendor" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">
              Vendor Portal
            </span>
          </Link>
          
          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            
            {/* Store link */}
            <Link
              href="/"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium hidden sm:block"
            >
              View Store →
            </Link>
            
            {/* User menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              {brand?.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {brand?.name || user.vendor.businessName}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 hidden lg:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </nav>
          
          {/* Bottom section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Link>
          </div>
        </aside>
        
        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 lg:hidden">
          <div className="flex items-center justify-around h-16">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-sky-600 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            ))}
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

// Client component for active link styling would go here
// For now, using server-side rendering
function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors group"
    >
      <Icon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}
