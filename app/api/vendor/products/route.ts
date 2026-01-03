// app/api/vendor/products/route.ts
// Vendor Products API - List and Create products

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Product creation schema
const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  category: z.enum(['BOTTLED_WATER', 'SPARKLING_WATER', 'FILTRATION_SYSTEM', 'SOFT_DRINK', 'FIZZY_DRINK']),
  priceBDT: z.number().min(1).max(1000000),
  compareBDT: z.number().min(0).optional(),
  costBDT: z.number().min(0).optional(),
  sku: z.string().max(50).optional(),
  stock: z.number().min(0).default(0),
  lowStockAt: z.number().min(0).default(10),
  trackStock: z.boolean().default(true),
  waterType: z.enum(['STILL', 'SPARKLING', 'MINERAL', 'SPRING', 'ARTESIAN']).optional(),
  volumeMl: z.number().min(1).optional(),
  packSize: z.number().min(1).default(1),
  minerals: z.object({
    pH: z.number().optional(),
    tds: z.number().optional(),
    calcium: z.number().optional(),
    magnesium: z.number().optional(),
    sodium: z.number().optional(),
    bicarbonate: z.number().optional(),
  }).optional(),
  shortDesc: z.string().max(300).optional(),
  description: z.string().max(10000).optional(),
  ingredients: z.string().max(1000).optional(),
  images: z.array(z.string().url()).default([]),
  freeShipping: z.boolean().default(false),
  fragileItem: z.boolean().default(false),
  weightGrams: z.number().min(0).optional(),
  sustainable: z.boolean().default(false),
  sustainNotes: z.string().max(500).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  isActive: z.boolean().default(true),
})

// GET - List vendor's products
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify vendor
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
    
    if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized as vendor' }, { status: 403 })
    }
    
    const brandIds = user.vendor.brands.map(b => b.id)
    
    if (brandIds.length === 0) {
      return NextResponse.json({ products: [], total: 0, page: 1, limit: 20 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const status = searchParams.get('status') // active, inactive, lowStock, outOfStock
    const sort = searchParams.get('sort') || 'newest'
    
    // Build where clause
    const where: any = {
      brandId: { in: brandIds }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (category) {
      where.category = category
    }
    
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    } else if (status === 'outOfStock') {
      where.trackStock = true
      where.stock = 0
    }
    // lowStock handled separately due to dynamic comparison
    
    // Sort options
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'oldest': orderBy = { createdAt: 'asc' }; break
      case 'name': orderBy = { name: 'asc' }; break
      case 'price-low': orderBy = { priceBDT: 'asc' }; break
      case 'price-high': orderBy = { priceBDT: 'desc' }; break
      case 'stock-low': orderBy = { stock: 'asc' }; break
      case 'stock-high': orderBy = { stock: 'desc' }; break
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: {
            select: { name: true }
          },
          _count: {
            select: { reviews: true, orderItems: true }
          }
        }
      }),
      prisma.product.count({ where })
    ])
    
    // Filter low stock if needed (requires post-query filter)
    let filteredProducts = products
    if (status === 'lowStock') {
      filteredProducts = products.filter(p => p.trackStock && p.stock > 0 && p.stock <= p.lowStockAt)
    }
    
    return NextResponse.json({
      products: filteredProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        priceBDT: parseFloat(p.priceBDT.toString()),
        compareBDT: p.compareBDT ? parseFloat(p.compareBDT.toString()) : null,
        sku: p.sku,
        stock: p.stock,
        lowStockAt: p.lowStockAt,
        trackStock: p.trackStock,
        waterType: p.waterType,
        volumeMl: p.volumeMl,
        packSize: p.packSize,
        images: p.images,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        createdAt: p.createdAt.toISOString(),
        brandName: p.brand.name,
        reviewsCount: p._count.reviews,
        ordersCount: p._count.orderItems,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Vendor products list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new product
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify vendor
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
    
    if (user?.role !== 'VENDOR' || !user.vendor || user.vendor.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized as vendor' }, { status: 403 })
    }
    
    const brand = user.vendor.brands[0]
    if (!brand) {
      return NextResponse.json({ error: 'No brand found. Please create a brand first.' }, { status: 400 })
    }
    
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)
    
    // Sanitize text fields
    const sanitizedName = DOMPurify.sanitize(validatedData.name)
    const sanitizedShortDesc = validatedData.shortDesc ? DOMPurify.sanitize(validatedData.shortDesc) : null
    const sanitizedDescription = validatedData.description ? DOMPurify.sanitize(validatedData.description) : null
    
    // Generate slug
    const baseSlug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Check for existing slug and append number if needed
    let slug = baseSlug
    let counter = 1
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    // Check SKU uniqueness
    if (validatedData.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: validatedData.sku }
      })
      if (existingSku) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
      }
    }
    
    const product = await prisma.product.create({
      data: {
        name: sanitizedName,
        slug,
        brandId: brand.id,
        category: validatedData.category,
        priceBDT: validatedData.priceBDT,
        compareBDT: validatedData.compareBDT,
        costBDT: validatedData.costBDT,
        sku: validatedData.sku,
        stock: validatedData.stock,
        lowStockAt: validatedData.lowStockAt,
        trackStock: validatedData.trackStock,
        waterType: validatedData.waterType,
        volumeMl: validatedData.volumeMl,
        packSize: validatedData.packSize,
        minerals: validatedData.minerals,
        shortDesc: sanitizedShortDesc,
        description: sanitizedDescription,
        ingredients: validatedData.ingredients,
        images: validatedData.images,
        freeShipping: validatedData.freeShipping,
        fragileItem: validatedData.fragileItem,
        weightGrams: validatedData.weightGrams,
        sustainable: validatedData.sustainable,
        sustainNotes: validatedData.sustainNotes,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        isActive: validatedData.isActive,
      }
    })
    
    return NextResponse.json({
      message: 'Product created successfully',
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
