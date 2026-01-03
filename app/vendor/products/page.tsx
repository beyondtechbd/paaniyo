// app/vendor/products/page.tsx
export const dynamic = 'force-dynamic';
// Vendor Products Management Page

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ProductsClient from '@/components/vendor/ProductsClient'

export default async function VendorProductsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/vendor/products')
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
      <ProductsClient brandId={brand?.id} brandName={brand?.name || user.vendor.businessName} />
    </div>
  )
}
