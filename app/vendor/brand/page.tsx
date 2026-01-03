// app/vendor/brand/page.tsx
export const dynamic = 'force-dynamic';
// Vendor Brand Management Page

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import BrandClient from '@/components/vendor/BrandClient'

export const metadata = {
  title: 'Brand Management | Vendor Dashboard | Paaniyo',
  description: 'Manage your brand profile, logo, and story',
}

export default async function VendorBrandPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/vendor/brand')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      vendor: {
        include: {
          brands: {
            include: {
              products: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  })
  
  if (!user?.vendor || user.vendor.status !== 'APPROVED') {
    redirect('/dashboard')
  }
  
  const brand = user.vendor.brands[0]
  
  if (!brand) {
    // Vendor has no brand yet - could redirect to create brand page
    redirect('/vendor')
  }
  
  return (
    <div className="p-4 lg:p-6">
      <BrandClient 
        initialBrand={{
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          story: brand.story,
          logo: brand.logo,
          banner: brand.banner,
          country: brand.country,
          region: brand.region,
          metaTitle: brand.metaTitle,
          metaDescription: brand.metaDescription,
          isActive: brand.isActive,
          isFeatured: brand.isFeatured,
          productCount: brand.products.length,
          createdAt: brand.createdAt.toISOString(),
          updatedAt: brand.updatedAt.toISOString(),
        }}
      />
    </div>
  )
}
