// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const brand = searchParams.get('brand')?.trim() || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const inStock = searchParams.get('inStock') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const freeShipping = searchParams.get('freeShipping') === 'true';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    
    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      isAvailable: true,
    };
    
    // Search filter (name, description, SKU)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // Category filter
    if (category) {
      where.category = category as any;
    }
    
    // Brand filter
    if (brand) {
      where.brand = { slug: brand };
    }
    
    // Price range filter
    where.price = {
      gte: minPrice,
      lte: maxPrice,
    };
    
    // Stock filter
    if (inStock) {
      where.stock = { gt: 0 };
    }
    
    // Featured filter
    if (featured) {
      where.featured = true;
    }
    
    // Free shipping filter
    if (freeShipping) {
      where.freeShipping = true;
    }
    
    // Tags filter
    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    
    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'price':
        orderBy = { price: sortOrder };
        break;
      case 'name':
        orderBy = { name: sortOrder };
        break;
      case 'rating':
        orderBy = { avgRating: sortOrder };
        break;
      case 'popularity':
        orderBy = { soldCount: sortOrder };
        break;
      case 'createdAt':
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }
    
    // Get total count
    const total = await prisma.product.count({ where });
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    // Fetch products
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        comparePrice: true,
        images: true,
        category: true,
        stock: true,
        avgRating: true,
        reviewCount: true,
        featured: true,
        freeShipping: true,
        tags: true,
        volumeMl: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            country: true,
          },
        },
      },
    });
    
    // Transform products for response
    const transformedProducts = products.map(product => ({
      ...product,
      discount: product.comparePrice 
        ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
        : 0,
      inStock: product.stock > 0,
      image: product.images[0] || '/images/placeholder-product.jpg',
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: {
          search,
          category,
          brand,
          minPrice,
          maxPrice,
          sortBy,
          sortOrder,
          inStock,
          featured,
          freeShipping,
          tags,
        },
      },
    });
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
