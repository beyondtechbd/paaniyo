// app/vendor/page.tsx
export const dynamic = 'force-dynamic';
// Vendor Dashboard Overview

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import VendorOverviewClient from '@/components/vendor/VendorOverviewClient'

export default async function VendorDashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/vendor')
  }
  
  // Get vendor info
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
  
  if (!user?.vendor || user.vendor.status !== 'APPROVED') {
    redirect('/dashboard')
  }
  
  const brand = user.vendor.brands[0]
  
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {brand?.name || user.vendor.businessName}
          </h1>
          <p className="text-slate-500 mt-1">
            Here's what's happening with your store today
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Store Active
        </div>
      </div>
      
      {/* Analytics Dashboard */}
      <VendorOverviewClient 
        vendorId={user.vendor.id}
        brandName={brand?.name || user.vendor.businessName}
        commissionRate={parseFloat(user.vendor.commissionRate.toString())}
      />
    </div>
  )
}
