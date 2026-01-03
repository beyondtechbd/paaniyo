// app/vendor/orders/page.tsx
export const dynamic = 'force-dynamic';
// Vendor Orders Management Page

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import OrdersClient from '@/components/vendor/OrdersClient'

export const metadata = {
  title: 'Orders | Vendor Dashboard | Paaniyo',
  description: 'Manage your customer orders',
}

export default async function VendorOrdersPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/vendor/orders')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      vendor: {
        include: {
          brands: { select: { id: true, name: true } }
        }
      }
    }
  })
  
  if (!user?.vendor || user.vendor.status !== 'APPROVED') {
    redirect('/dashboard')
  }
  
  const brand = user.vendor.brands[0]
  
  return (
    <div className="p-4 lg:p-6">
      <OrdersClient 
        brandId={brand?.id} 
        brandName={brand?.name || user.vendor.businessName}
        commissionRate={parseFloat(user.vendor.commissionRate.toString())}
      />
    </div>
  )
}
