// app/vendor/settings/page.tsx
export const dynamic = 'force-dynamic';
// Vendor Settings Page

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import SettingsClient from '@/components/vendor/SettingsClient'

export const metadata = {
  title: 'Settings | Vendor Dashboard | Paaniyo',
  description: 'Manage your vendor account settings and payout details',
}

export default async function VendorSettingsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/vendor/settings')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      vendor: {
        include: {
          brands: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })
  
  if (!user?.vendor || user.vendor.status !== 'APPROVED') {
    redirect('/dashboard')
  }
  
  return (
    <div className="p-4 lg:p-6">
      <SettingsClient 
        initialSettings={{
          id: user.vendor.id,
          businessName: user.vendor.businessName,
          tradeLicense: user.vendor.tradeLicense,
          taxId: user.vendor.taxId,
          status: user.vendor.status,
          
          contactName: user.vendor.contactName,
          contactEmail: user.vendor.contactEmail,
          contactPhone: user.vendor.contactPhone,
          
          commissionRate: parseFloat(user.vendor.commissionRate.toString()),
          balance: parseFloat(user.vendor.balance.toString()),
          
          bankName: user.vendor.bankName,
          bankAccount: user.vendor.bankAccount,
          bankRouting: user.vendor.bankRouting,
          bkashNumber: user.vendor.bkashNumber,
          
          brands: user.vendor.brands,
          createdAt: user.vendor.createdAt.toISOString(),
          approvedAt: user.vendor.approvedAt?.toISOString() || null,
          
          userEmail: user.email,
          userName: user.name,
        }}
      />
    </div>
  )
}
