// app/admin/vendors/page.tsx
export const dynamic = 'force-dynamic';
// Admin Vendor Management Page

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import VendorsClient from '@/components/admin/VendorsClient'

export const metadata = {
  title: 'Vendor Management | Admin | Paaniyo',
  description: 'Manage vendor applications and approvals',
}

export default async function AdminVendorsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/admin/vendors')
  }
  
  // Verify admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  
  // Get vendor counts by status
  const [pending, approved, suspended, total] = await Promise.all([
    prisma.vendor.count({ where: { status: 'PENDING' } }),
    prisma.vendor.count({ where: { status: 'APPROVED' } }),
    prisma.vendor.count({ where: { status: 'SUSPENDED' } }),
    prisma.vendor.count(),
  ])
  
  return (
    <div className="p-4 lg:p-6">
      <VendorsClient 
        initialCounts={{
          pending,
          approved,
          suspended,
          total,
        }}
      />
    </div>
  )
}
