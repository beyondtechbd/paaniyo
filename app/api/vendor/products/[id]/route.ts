// app/api/vendor/products/[id]/route.ts
// Vendor Product Detail API - Get, Update, Delete

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Product update schema
const updateProductSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  category: z.enum(['BOTTLED_WATER', 'SPARKLING_WATER', 'FILTRATION_SYSTEM', 'SOFT_DRINK', 'FIZZY_DRINK']).optional(),
  priceBDT: z.number().min(1).max(1000000).optional(),
  compareBDT: z.number().min(0).nullable().optional(),
  costBDT: z.number().min(0).nullable().optional(),
  sku: z.string().max(50).nullable().optional(),
  stock: z.number().min(0).optional(),
  lowStockAt: z.number().min(0).optional(),
  trackStock: z.boolean().optional(),
  waterType: z.enum(['STILL', 'SPARKLING', 'MINERAL', 'SPRING', 'ARTESIAN']).nullable().optional(),
  volumeMl: z.number().min(1).nullable().optional(),
  packSize: z.number().min(1).optional(),
  minerals: z.object({
    pH: z.number().optional(),
    tds: z.number().optional(),
    calcium: z.number().optional(),
    magnesium: z.number().optional(),
    sodium: z.number().optional(),
    bicarbonate: z.number().optional(),
  }).nullable().optional(),
  sensory: z.object({
    roundness: z.number().optional(),
    neutrality: z.number().optional(),
    hardness: z.number().optional(),
    sweetness: z.number().optional(),
  }).nullable().optional(),
  shortDesc: z.string().max(300).nullable().optional(),
  description: z.string().max(10000).nullable().optional(),
  ingredients: z.string().max(1000).nullable().optional(),
  images: z.array(z.string().url()).optional(),
  freeShipping: z.boolean().optional(),
  fragileItem: z.boolean().optional(),
  weightGrams: z.number().min(0).nullable().optional(),
  sustainable: z.boolean().optional(),
  sustainNotes: z.string().max(500).nullable().optional(),
  metaTitle: z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
  isActive: z.boolean().optional(),
})

// Helper to verify vendor owns product
async function verifyProductOwnership(userId: string, productId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vendor: {
        include: {
          brands: { select: { id: true } }
        }
      }
    }
  })
  
  if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
    return { error: 'Not authorized as vendor', status: 403 }
  }
  
  const brandIds = user.vendor.brands.map(b => b.id)
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      brand: { select: { id: true, name: true } },
      _count: { select: { reviews: true, orderItems: true } }
    }
  })
  
  if (!product) {
    return { error: 'Product not found', status: 404 }
  }
  
  if (!brandIds.includes(product.brandId)) {
    return { error: 'You do not own this product', status: 403 }
  }
  
  return { product, vendorId: user.vendor.id }
}

// GET - Get product details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const result = await verifyProductOwnership(session.user.id, id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    
    const { product } = result
    
    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        priceBDT: parseFloat(product.priceBDT.toString()),
        compareBDT: product.compareBDT ? parseFloat(product.compareBDT.toString()) : null,
        costBDT: product.costBDT ? parseFloat(product.costBDT.toString()) : null,
        sku: product.sku,
        stock: product.stock,
        lowStockAt: product.lowStockAt,
        trackStock: product.trackStock,
        waterType: product.waterType,
        volumeMl: product.volumeMl,
        packSize: product.packSize,
        minerals: product.minerals,
        sensory: product.sensory,
        specs: product.specs,
        shortDesc: product.shortDesc,
        description: product.description,
        ingredients: product.ingredients,
        images: product.images,
        freeShipping: product.freeShipping,
        fragileItem: product.fragileItem,
        weightGrams: product.weightGrams,
        sustainable: product.sustainable,
        sustainNotes: product.sustainNotes,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        brandName: product.brand.name,
        reviewsCount: product._count.reviews,
        ordersCount: product._count.orderItems,
      }
    })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update product
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const result = await verifyProductOwnership(session.user.id, id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)
    
    // Build update data
    const updateData: any = {}
    
    if (validatedData.name !== undefined) {
      updateData.name = DOMPurify.sanitize(validatedData.name)
      // Update slug if name changed
      const baseSlug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      let slug = baseSlug
      let counter = 1
      while (true) {
        const existing = await prisma.product.findUnique({ where: { slug } })
        if (!existing || existing.id === id) break
        slug = `${baseSlug}-${counter}`
        counter++
      }
      updateData.slug = slug
    }
    
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.priceBDT !== undefined) updateData.priceBDT = validatedData.priceBDT
    if (validatedData.compareBDT !== undefined) updateData.compareBDT = validatedData.compareBDT
    if (validatedData.costBDT !== undefined) updateData.costBDT = validatedData.costBDT
    
    if (validatedData.sku !== undefined) {
      if (validatedData.sku) {
        const existingSku = await prisma.product.findFirst({
          where: { sku: validatedData.sku, NOT: { id } }
        })
        if (existingSku) {
          return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
        }
      }
      updateData.sku = validatedData.sku
    }
    
    if (validatedData.stock !== undefined) updateData.stock = validatedData.stock
    if (validatedData.lowStockAt !== undefined) updateData.lowStockAt = validatedData.lowStockAt
    if (validatedData.trackStock !== undefined) updateData.trackStock = validatedData.trackStock
    if (validatedData.waterType !== undefined) updateData.waterType = validatedData.waterType
    if (validatedData.volumeMl !== undefined) updateData.volumeMl = validatedData.volumeMl
    if (validatedData.packSize !== undefined) updateData.packSize = validatedData.packSize
    if (validatedData.minerals !== undefined) updateData.minerals = validatedData.minerals
    if (validatedData.sensory !== undefined) updateData.sensory = validatedData.sensory
    
    if (validatedData.shortDesc !== undefined) {
      updateData.shortDesc = validatedData.shortDesc ? DOMPurify.sanitize(validatedData.shortDesc) : null
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description ? DOMPurify.sanitize(validatedData.description) : null
    }
    if (validatedData.ingredients !== undefined) updateData.ingredients = validatedData.ingredients
    if (validatedData.images !== undefined) updateData.images = validatedData.images
    if (validatedData.freeShipping !== undefined) updateData.freeShipping = validatedData.freeShipping
    if (validatedData.fragileItem !== undefined) updateData.fragileItem = validatedData.fragileItem
    if (validatedData.weightGrams !== undefined) updateData.weightGrams = validatedData.weightGrams
    if (validatedData.sustainable !== undefined) updateData.sustainable = validatedData.sustainable
    if (validatedData.sustainNotes !== undefined) updateData.sustainNotes = validatedData.sustainNotes
    if (validatedData.metaTitle !== undefined) updateData.metaTitle = validatedData.metaTitle
    if (validatedData.metaDescription !== undefined) updateData.metaDescription = validatedData.metaDescription
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      message: 'Product updated successfully',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        slug: updatedProduct.slug,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const result = await verifyProductOwnership(session.user.id, id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    
    // Check if product has orders
    const orderCount = await prisma.orderItem.count({
      where: { productId: id }
    })
    
    if (orderCount > 0) {
      // Soft delete - just deactivate
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      })
      
      return NextResponse.json({
        message: 'Product deactivated (has existing orders)',
        softDeleted: true
      })
    }
    
    // Hard delete if no orders
    await prisma.product.delete({
      where: { id }
    })
    
    return NextResponse.json({
      message: 'Product deleted successfully',
      softDeleted: false
    })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
