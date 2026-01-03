// app/vendor/earnings/page.tsx
export const dynamic = 'force-dynamic';
// Vendor Earnings Page

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import EarningsClient from '@/components/vendor/EarningsClient'

export const metadata = {
  title: 'Earnings | Vendor Dashboard | Paaniyo',
  description: 'Track your earnings and payouts',
}

export default async function VendorEarningsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/vendor/earnings')
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
      <EarningsClient 
        brandName={brand?.name || user.vendor.businessName}
        commissionRate={parseFloat(user.vendor.commissionRate.toString())}
        balance={parseFloat(user.vendor.balance.toString())}
        bankName={user.vendor.bankName}
        bankAccount={user.vendor.bankAccount}
        bkashNumber={user.vendor.bkashNumber}
      />
    </div>
  )
}
