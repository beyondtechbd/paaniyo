// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Search products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const waterType = searchParams.get('waterType');
    const sort = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const autocomplete = searchParams.get('autocomplete') === 'true';

    // Autocomplete mode - return quick suggestions
    if (autocomplete && query.length >= 2) {
      const [products, brands, categories] = await Promise.all([
        // Product suggestions
        prisma.product.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { shortDesc: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: {
            id: true,
            name: true,
            slug: true,
            priceBDT: true,
            images: true,
            brand: {
              select: { name: true },
            },
          },
        }),

        // Brand suggestions
        prisma.brand.findMany({
          where: {
            isActive: true,
            name: { contains: query, mode: 'insensitive' },
          },
          take: 3,
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            _count: { select: { products: true } },
          },
        }),

        // Category matches (from enum, match against query)
        Promise.resolve(
          ['BOTTLED_WATER', 'SPARKLING_WATER', 'FILTRATION_SYSTEM', 'SOFT_DRINK', 'FIZZY_DRINK']
            .filter(cat => 
              cat.toLowerCase().replace('_', ' ').includes(query.toLowerCase()) ||
              query.toLowerCase().includes(cat.toLowerCase().replace('_', ' ').split(' ')[0])
            )
            .slice(0, 3)
        ),
      ]);

      return NextResponse.json({
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.priceBDT),
          image: (p.images as string[])[0] || '/images/placeholder-product.jpg',
          brand: p.brand.name,
          type: 'product',
        })),
        brands: brands.map(b => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logo: b.logo,
          productCount: b._count.products,
          type: 'brand',
        })),
        categories: categories.map(c => ({
          value: c,
          label: c.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          type: 'category',
        })),
      });
    }

    // Full search mode
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { shortDesc: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category as Prisma.ProductCategory;
    }

    // Brand filter
    if (brand) {
      where.brand = { slug: brand };
    }

    // Price range
    if (minPrice || maxPrice) {
      where.priceBDT = {};
      if (minPrice) where.priceBDT.gte = parseInt(minPrice);
      if (maxPrice) where.priceBDT.lte = parseInt(maxPrice);
    }

    // Water type
    if (waterType) {
      where.waterType = waterType as Prisma.WaterType;
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    switch (sort) {
      case 'price-low':
        orderBy = [{ priceBDT: 'asc' }];
        break;
      case 'price-high':
        orderBy = [{ priceBDT: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'name':
        orderBy = [{ name: 'asc' }];
        break;
      case 'popular':
        // Would need a popularity/sales field
        orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
        break;
      default: // relevance - featured first, then newest
        orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }

    // Execute queries
    const [products, total, filterData] = await Promise.all([
      // Products
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          priceBDT: true,
          compareBDT: true,
          images: true,
          volumeMl: true,
          waterType: true,
          stock: true,
          freeShipping: true,
          isFeatured: true,
          sustainable: true,
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      // Total count
      prisma.product.count({ where }),

      // Filter aggregations (for sidebar)
      Promise.all([
        // Brands with counts
        prisma.product.groupBy({
          by: ['brandId'],
          where: { ...where, brandId: undefined },
          _count: true,
        }).then(async (brandCounts) => {
          const brandIds = brandCounts.map(b => b.brandId);
          const brands = await prisma.brand.findMany({
            where: { id: { in: brandIds }, isActive: true },
            select: { id: true, name: true, slug: true },
          });
          return brandCounts.map(bc => ({
            ...brands.find(b => b.id === bc.brandId),
            count: bc._count,
          }));
        }),

        // Categories with counts
        prisma.product.groupBy({
          by: ['category'],
          where: { ...where, category: undefined },
          _count: true,
        }),

        // Water types with counts
        prisma.product.groupBy({
          by: ['waterType'],
          where: { ...where, waterType: undefined },
          _count: true,
        }),

        // Price range
        prisma.product.aggregate({
          where: { isActive: true },
          _min: { priceBDT: true },
          _max: { priceBDT: true },
        }),
      ]),
    ]);

    const [brandFilters, categoryFilters, waterTypeFilters, priceRange] = filterData;

    return NextResponse.json({
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.priceBDT),
        comparePrice: product.compareBDT ? Number(product.compareBDT) : null,
        image: (product.images as string[])[0] || '/images/placeholder-product.jpg',
        images: product.images as string[],
        volumeMl: product.volumeMl,
        waterType: product.waterType,
        stock: product.stock,
        freeShipping: product.freeShipping,
        isFeatured: product.isFeatured,
        sustainable: product.sustainable,
        brand: product.brand,
        discount: product.compareBDT
          ? Math.round(((Number(product.compareBDT) - Number(product.priceBDT)) / Number(product.compareBDT)) * 100)
          : 0,
        available: product.stock > 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        brands: brandFilters.filter(b => b?.name).map(b => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          count: b.count,
        })),
        categories: categoryFilters.map(c => ({
          value: c.category,
          label: c.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          count: c._count,
        })),
        waterTypes: waterTypeFilters.filter(w => w.waterType).map(w => ({
          value: w.waterType,
          label: w.waterType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          count: w._count,
        })),
        priceRange: {
          min: Number(priceRange._min.priceBDT) || 0,
          max: Number(priceRange._max.priceBDT) || 10000,
        },
      },
      query,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
