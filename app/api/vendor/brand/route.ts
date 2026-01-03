// app/api/vendor/brand/route.ts
// Vendor Brand Management API

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Update brand schema
const updateBrandSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  story: z.string().max(5000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
})

// GET: Fetch vendor's brand
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      include: {
        brands: {
          include: {
            products: {
              select: { id: true },
            },
          },
        },
      },
    })
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      )
    }
    
    if (vendor.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Vendor account not approved' },
        { status: 403 }
      )
    }
    
    const brand = vendor.brands[0]
    
    if (!brand) {
      return NextResponse.json(
        { error: 'No brand found for this vendor' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      brand: {
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
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand' },
      { status: 500 }
    )
  }
}

// PATCH: Update vendor's brand
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      include: {
        brands: true,
      },
    })
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      )
    }
    
    if (vendor.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Vendor account not approved' },
        { status: 403 }
      )
    }
    
    const brand = vendor.brands[0]
    
    if (!brand) {
      return NextResponse.json(
        { error: 'No brand found for this vendor' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateBrandSchema.parse(body)
    
    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (validatedData.name !== undefined) {
      // Sanitize name
      const sanitizedName = DOMPurify.sanitize(validatedData.name.trim())
      
      // Check if name is unique (excluding current brand)
      const existingBrand = await prisma.brand.findFirst({
        where: {
          name: { equals: sanitizedName, mode: 'insensitive' },
          id: { not: brand.id },
        },
      })
      
      if (existingBrand) {
        return NextResponse.json(
          { error: 'A brand with this name already exists' },
          { status: 400 }
        )
      }
      
      updateData.name = sanitizedName
      
      // Generate new slug if name changed
      let slug = sanitizedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      // Check slug uniqueness and add counter if needed
      let counter = 0
      let finalSlug = slug
      while (true) {
        const existingSlug = await prisma.brand.findFirst({
          where: {
            slug: finalSlug,
            id: { not: brand.id },
          },
        })
        if (!existingSlug) break
        counter++
        finalSlug = `${slug}-${counter}`
      }
      
      updateData.slug = finalSlug
    }
    
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
        ? DOMPurify.sanitize(validatedData.description.trim())
        : null
    }
    
    if (validatedData.story !== undefined) {
      updateData.story = validatedData.story
        ? DOMPurify.sanitize(validatedData.story.trim())
        : null
    }
    
    if (validatedData.logo !== undefined) {
      updateData.logo = validatedData.logo
    }
    
    if (validatedData.banner !== undefined) {
      updateData.banner = validatedData.banner
    }
    
    if (validatedData.country !== undefined) {
      updateData.country = validatedData.country
        ? DOMPurify.sanitize(validatedData.country.trim())
        : null
    }
    
    if (validatedData.region !== undefined) {
      updateData.region = validatedData.region
        ? DOMPurify.sanitize(validatedData.region.trim())
        : null
    }
    
    if (validatedData.metaTitle !== undefined) {
      updateData.metaTitle = validatedData.metaTitle
        ? DOMPurify.sanitize(validatedData.metaTitle.trim())
        : null
    }
    
    if (validatedData.metaDescription !== undefined) {
      updateData.metaDescription = validatedData.metaDescription
        ? DOMPurify.sanitize(validatedData.metaDescription.trim())
        : null
    }
    
    // Update brand
    const updatedBrand = await prisma.brand.update({
      where: { id: brand.id },
      data: updateData,
    })
    
    return NextResponse.json({
      message: 'Brand updated successfully',
      brand: {
        id: updatedBrand.id,
        name: updatedBrand.name,
        slug: updatedBrand.slug,
        description: updatedBrand.description,
        story: updatedBrand.story,
        logo: updatedBrand.logo,
        banner: updatedBrand.banner,
        country: updatedBrand.country,
        region: updatedBrand.region,
        metaTitle: updatedBrand.metaTitle,
        metaDescription: updatedBrand.metaDescription,
        isActive: updatedBrand.isActive,
        updatedAt: updatedBrand.updatedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating brand:', error)
    return NextResponse.json(
      { error: 'Failed to update brand' },
      { status: 500 }
    )
  }
}
