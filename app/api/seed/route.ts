// app/api/seed/route.ts - Complete Platform Seed
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Check if already seeded
    const existingProducts = await prisma.product.count();
    if (existingProducts > 0) {
      return NextResponse.json({ message: 'Already seeded', products: existingProducts });
    }

    // ═══════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════
    
    const adminPw = await bcrypt.hash('Admin@123', 12);
    const vendorPw = await bcrypt.hash('Vendor@123', 12);
    const customerPw = await bcrypt.hash('Customer@123', 12);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@paaniyo.com',
        phone: '+8801700000001',
        name: 'System Admin',
        passwordHash: adminPw,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    const vendorUser = await prisma.user.create({
      data: {
        email: 'vendor@paaniyo.com',
        phone: '+8801700000002',
        name: 'AquaPure Bangladesh',
        passwordHash: vendorPw,
        role: 'VENDOR',
        emailVerified: new Date(),
      },
    });

    const customer = await prisma.user.create({
      data: {
        email: 'customer@paaniyo.com',
        phone: '+8801700000003',
        name: 'Rahim Ahmed',
        passwordHash: customerPw,
        role: 'CUSTOMER',
        emailVerified: new Date(),
        cart: { create: {} },
        wallet: { create: { balance: 500 } },
        trackerSettings: { create: { dailyGoalMl: 3000 } },
      },
    });

    // Vendor profile
    const vendor = await prisma.vendor.create({
      data: {
        userId: vendorUser.id,
        businessName: 'AquaPure Bangladesh',
        businessEmail: 'vendor@paaniyo.com',
        businessPhone: '+8801700000002',
        businessAddress: 'Gulshan-2, Dhaka',
        status: 'APPROVED',
        commissionRate: 10,
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // ZONES
    // ═══════════════════════════════════════════════════════════════
    
    const dhakaZone = await prisma.zone.create({
      data: {
        name: 'Dhaka City',
        slug: 'dhaka-city',
        districts: ['Dhaka'],
        areas: ['Gulshan', 'Banani', 'Dhanmondi', 'Uttara', 'Mirpur', 'Mohammadpur', 'Bashundhara'],
        postcodes: ['1212', '1213', '1205', '1230', '1216', '1207', '1229'],
        deliveryFee: 30,
        minOrder: 200,
        freeDeliveryMin: 500,
        slots: {
          create: [
            { dayOfWeek: 0, startTime: '09:00', endTime: '12:00', capacity: 50 },
            { dayOfWeek: 0, startTime: '14:00', endTime: '18:00', capacity: 50 },
            { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', capacity: 50 },
            { dayOfWeek: 1, startTime: '14:00', endTime: '18:00', capacity: 50 },
            { dayOfWeek: 2, startTime: '09:00', endTime: '12:00', capacity: 50 },
            { dayOfWeek: 2, startTime: '14:00', endTime: '18:00', capacity: 50 },
            { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', capacity: 50 },
            { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', capacity: 50 },
            { dayOfWeek: 4, startTime: '09:00', endTime: '12:00', capacity: 50 },
            { dayOfWeek: 4, startTime: '14:00', endTime: '18:00', capacity: 50 },
            { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', capacity: 50 },
            { dayOfWeek: 5, startTime: '14:00', endTime: '18:00', capacity: 50 },
            { dayOfWeek: 6, startTime: '09:00', endTime: '12:00', capacity: 30 },
          ],
        },
      },
    });

    // Customer address
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'Home',
        fullName: 'Rahim Ahmed',
        phone: '+8801700000003',
        address: 'House 45, Road 12, Block D',
        area: 'Bashundhara R/A',
        district: 'Dhaka',
        postcode: '1229',
        isDefault: true,
        zoneId: dhakaZone.id,
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // BRANDS
    // ═══════════════════════════════════════════════════════════════
    
    const brands = await Promise.all([
      prisma.brand.create({
        data: {
          name: 'AquaPure',
          slug: 'aquapure',
          description: 'Bangladesh\'s trusted name in purified drinking water since 2010.',
          story: 'Founded in Dhaka with a mission to provide safe, affordable drinking water to every household.',
          country: 'Bangladesh',
          founded: 2010,
          userId: vendorUser.id,
          vendorId: vendor.id,
          isVerified: true,
          isActive: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'MUM',
          slug: 'mum',
          description: 'Premium mineral water from natural springs.',
          country: 'Bangladesh',
          founded: 2005,
          userId: vendorUser.id,
          vendorId: vendor.id,
          isVerified: true,
          isActive: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Fresh',
          slug: 'fresh',
          description: 'Refreshing purified water for everyday hydration.',
          country: 'Bangladesh',
          founded: 2008,
          userId: vendorUser.id,
          vendorId: vendor.id,
          isVerified: true,
          isActive: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Jibon',
          slug: 'jibon',
          description: 'Life-giving pure water at affordable prices.',
          country: 'Bangladesh',
          founded: 2015,
          userId: vendorUser.id,
          vendorId: vendor.id,
          isVerified: true,
          isActive: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Evian',
          slug: 'evian',
          description: 'Natural mineral water from the French Alps.',
          country: 'France',
          founded: 1826,
          userId: vendorUser.id,
          vendorId: vendor.id,
          isVerified: true,
          isActive: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'AquaFresh Filters',
          slug: 'aquafresh-filters',
          description: 'Premium water filtration systems and spare parts.',
          country: 'Bangladesh',
          founded: 2012,
          userId: vendorUser.id,
          vendorId: vendor.id,
          isVerified: true,
          isActive: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Electro+',
          slug: 'electroplus',
          description: 'Sports hydration and electrolyte drinks.',
          country: 'Bangladesh',
          founded: 2020,
          userId: vendorUser.id,
          vendorId: vendor.id,
          isVerified: true,
          isActive: true,
        },
      }),
    ]);

    const brandMap = brands.reduce((acc, b) => ({ ...acc, [b.slug]: b.id }), {} as Record<string, string>);

    // ═══════════════════════════════════════════════════════════════
    // PRODUCTS
    // ═══════════════════════════════════════════════════════════════
    
    const products = [
      // ═══ JARS (Refillable) ═══
      { 
        name: 'AquaPure 20L Jar', slug: 'aquapure-20l-jar', brand: 'aquapure',
        type: 'JAR', category: 'DRINKING_WATER', waterType: 'RO',
        price: 50, deposit: 300, volume: 20000,
        shortDesc: 'Refillable 20L jar - ৳300 deposit required',
        useCases: ['home', 'office', 'daily'],
        sourceType: 'RO Purified', tdsLevel: 50,
        featured: true, subscribable: true
      },
      { 
        name: 'MUM 19L Mineral Jar', slug: 'mum-19l-jar', brand: 'mum',
        type: 'JAR', category: 'MINERAL_WATER', waterType: 'MINERAL',
        price: 80, deposit: 350, volume: 19000,
        shortDesc: 'Premium mineral water jar - ৳350 deposit',
        useCases: ['home', 'office', 'premium'],
        sourceType: 'Natural Mineral', tdsLevel: 150, phLevel: 7.4,
        featured: true, subscribable: true
      },
      { 
        name: 'Fresh 20L Economy Jar', slug: 'fresh-20l-jar', brand: 'fresh',
        type: 'JAR', category: 'DRINKING_WATER', waterType: 'RO',
        price: 40, deposit: 250, volume: 20000,
        shortDesc: 'Budget-friendly 20L jar - ৳250 deposit',
        useCases: ['home', 'budget', 'daily'],
        sourceType: 'RO Purified', tdsLevel: 45,
        featured: false, subscribable: true
      },
      { 
        name: 'Jibon 12L Family Jar', slug: 'jibon-12l-jar', brand: 'jibon',
        type: 'JAR', category: 'DRINKING_WATER', waterType: 'PURIFIED',
        price: 35, deposit: 200, volume: 12000,
        shortDesc: 'Compact 12L jar for small families',
        useCases: ['home', 'small-family', 'budget'],
        sourceType: 'Multi-stage Purified', tdsLevel: 40,
        featured: false, subscribable: true
      },

      // ═══ BOTTLES (Single-use) ═══
      { 
        name: 'AquaPure 500ml', slug: 'aquapure-500ml', brand: 'aquapure',
        type: 'BOTTLE', category: 'DRINKING_WATER', waterType: 'RO',
        price: 15, volume: 500, packSize: 1,
        shortDesc: 'Perfect for on-the-go hydration',
        useCases: ['travel', 'gym', 'office'],
        featured: false, subscribable: false
      },
      { 
        name: 'AquaPure 1L', slug: 'aquapure-1l', brand: 'aquapure',
        type: 'BOTTLE', category: 'DRINKING_WATER', waterType: 'RO',
        price: 25, volume: 1000, packSize: 1,
        shortDesc: 'Standard 1 liter bottle',
        useCases: ['home', 'office', 'daily'],
        featured: false, subscribable: false
      },
      { 
        name: 'AquaPure 2L', slug: 'aquapure-2l', brand: 'aquapure',
        type: 'BOTTLE', category: 'DRINKING_WATER', waterType: 'RO',
        price: 40, volume: 2000, packSize: 1,
        shortDesc: 'Large 2 liter family bottle',
        useCases: ['home', 'family', 'value'],
        featured: false, subscribable: false
      },
      { 
        name: 'MUM Mineral 500ml', slug: 'mum-mineral-500ml', brand: 'mum',
        type: 'BOTTLE', category: 'MINERAL_WATER', waterType: 'MINERAL',
        price: 25, volume: 500, packSize: 1,
        shortDesc: 'Premium mineral water bottle',
        useCases: ['premium', 'office', 'meeting'],
        sourceType: 'Natural Mineral', phLevel: 7.4,
        featured: true, subscribable: false
      },
      { 
        name: 'Evian Natural 500ml', slug: 'evian-500ml', brand: 'evian',
        type: 'BOTTLE', category: 'PREMIUM_WATER', waterType: 'MINERAL',
        price: 150, compare: 180, volume: 500, packSize: 1,
        shortDesc: 'Imported French Alps mineral water',
        useCases: ['luxury', 'gift', 'hotel'],
        sourceType: 'Natural Spring', phLevel: 7.2,
        featured: true, subscribable: false
      },

      // ═══ PACKS ═══
      { 
        name: 'AquaPure 500ml Pack (12)', slug: 'aquapure-500ml-12pack', brand: 'aquapure',
        type: 'PACK', category: 'DRINKING_WATER', waterType: 'RO',
        price: 150, compare: 180, volume: 500, packSize: 12,
        shortDesc: '12-bottle pack - Save ৳30!',
        useCases: ['office', 'event', 'bulk'],
        featured: true, subscribable: true
      },
      { 
        name: 'AquaPure 1L Pack (6)', slug: 'aquapure-1l-6pack', brand: 'aquapure',
        type: 'PACK', category: 'DRINKING_WATER', waterType: 'RO',
        price: 130, compare: 150, volume: 1000, packSize: 6,
        shortDesc: '6-bottle pack for home',
        useCases: ['home', 'family', 'weekly'],
        featured: false, subscribable: true
      },

      // ═══ SPARKLING ═══
      { 
        name: 'MUM Sparkling 330ml', slug: 'mum-sparkling-330ml', brand: 'mum',
        type: 'BOTTLE', category: 'SPARKLING_WATER', waterType: 'MINERAL',
        price: 45, volume: 330, packSize: 1,
        shortDesc: 'Refreshing sparkling mineral water',
        useCases: ['dining', 'party', 'premium'],
        featured: true, subscribable: false
      },

      // ═══ BEVERAGES ═══
      { 
        name: 'Electro+ Sports Drink 500ml', slug: 'electroplus-sports-500ml', brand: 'electroplus',
        type: 'BEVERAGE', category: 'SPORTS_DRINK',
        price: 50, volume: 500, packSize: 1,
        shortDesc: 'Electrolyte replenishment for athletes',
        useCases: ['workout', 'sports', 'recovery'],
        featured: true, subscribable: false
      },
      { 
        name: 'Electro+ ORS Orange 200ml', slug: 'electroplus-ors-200ml', brand: 'electroplus',
        type: 'BEVERAGE', category: 'ORS',
        price: 25, volume: 200, packSize: 1,
        shortDesc: 'Oral rehydration solution - Orange flavor',
        useCases: ['health', 'recovery', 'kids'],
        featured: false, subscribable: false
      },
      { 
        name: 'Electro+ Energy Drink 250ml', slug: 'electroplus-energy-250ml', brand: 'electroplus',
        type: 'BEVERAGE', category: 'ENERGY_DRINK',
        price: 60, volume: 250, packSize: 1,
        shortDesc: 'Natural energy boost',
        useCases: ['energy', 'work', 'study'],
        featured: false, subscribable: false
      },

      // ═══ FILTRATION SYSTEMS ═══
      { 
        name: 'AquaFresh RO System 5-Stage', slug: 'aquafresh-ro-5stage', brand: 'aquafresh-filters',
        type: 'FILTER_SYSTEM', category: 'RO_SYSTEM',
        price: 12000, compare: 15000,
        shortDesc: '5-stage RO purification for home',
        useCases: ['home', 'installation'],
        featured: true, subscribable: false
      },
      { 
        name: 'AquaFresh UV Purifier', slug: 'aquafresh-uv-purifier', brand: 'aquafresh-filters',
        type: 'FILTER_SYSTEM', category: 'UV_SYSTEM',
        price: 8000, compare: 10000,
        shortDesc: 'UV sterilization system',
        useCases: ['home', 'installation'],
        featured: false, subscribable: false
      },
      { 
        name: 'Desktop Water Dispenser', slug: 'desktop-dispenser', brand: 'aquafresh-filters',
        type: 'DISPENSER', category: 'DISPENSER',
        price: 3500, compare: 4500,
        shortDesc: 'Hot & cold water dispenser for 20L jars',
        useCases: ['office', 'home'],
        featured: true, subscribable: false
      },

      // ═══ SPARE PARTS ═══
      { 
        name: 'Sediment Filter (PP)', slug: 'sediment-filter-pp', brand: 'aquafresh-filters',
        type: 'SPARE_PART', category: 'SEDIMENT_FILTER',
        price: 250,
        shortDesc: 'Replace every 3 months',
        useCases: ['maintenance'],
        compatibleWith: ['aquafresh-ro-5stage', 'aquafresh-uv-purifier'],
        replacementMonths: 3,
        featured: false, subscribable: true
      },
      { 
        name: 'Carbon Block Filter', slug: 'carbon-block-filter', brand: 'aquafresh-filters',
        type: 'SPARE_PART', category: 'CARBON_FILTER',
        price: 400,
        shortDesc: 'Replace every 6 months',
        useCases: ['maintenance'],
        compatibleWith: ['aquafresh-ro-5stage'],
        replacementMonths: 6,
        featured: false, subscribable: true
      },
      { 
        name: 'RO Membrane 75GPD', slug: 'ro-membrane-75gpd', brand: 'aquafresh-filters',
        type: 'SPARE_PART', category: 'RO_MEMBRANE',
        price: 2500,
        shortDesc: 'Replace every 12-18 months',
        useCases: ['maintenance'],
        compatibleWith: ['aquafresh-ro-5stage'],
        replacementMonths: 12,
        featured: false, subscribable: true
      },
      { 
        name: 'UV Lamp Replacement', slug: 'uv-lamp-replacement', brand: 'aquafresh-filters',
        type: 'SPARE_PART', category: 'UV_LAMP',
        price: 1200,
        shortDesc: 'Replace annually',
        useCases: ['maintenance'],
        compatibleWith: ['aquafresh-uv-purifier'],
        replacementMonths: 12,
        featured: false, subscribable: true
      },
      { 
        name: 'Annual Maintenance Kit', slug: 'annual-maintenance-kit', brand: 'aquafresh-filters',
        type: 'SPARE_PART', category: 'MAINTENANCE_KIT',
        price: 3500, compare: 4500,
        shortDesc: 'Complete yearly filter kit - Save ৳1000',
        useCases: ['maintenance', 'value'],
        compatibleWith: ['aquafresh-ro-5stage'],
        replacementMonths: 12,
        featured: true, subscribable: true
      },
    ];

    for (const p of products) {
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          brandId: brandMap[p.brand],
          type: p.type as any,
          category: p.category as any,
          waterType: p.waterType as any || null,
          priceBDT: p.price,
          compareBDT: p.compare || null,
          depositBDT: p.deposit || null,
          volumeMl: p.volume || null,
          packSize: p.packSize || 1,
          shortDesc: p.shortDesc,
          description: `${p.name} - ${p.shortDesc}. High quality product from ${p.brand}.`,
          sourceType: p.sourceType || null,
          tdsLevel: p.tdsLevel || null,
          phLevel: p.phLevel || null,
          useCases: p.useCases || [],
          images: ['https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600'],
          stock: 100,
          isActive: true,
          isFeatured: p.featured || false,
          isSubscribable: p.subscribable ?? true,
          compatibleWith: p.compatibleWith || [],
          replacementMonths: p.replacementMonths || null,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════
    
    const settings = [
      { key: 'site_name', value: 'Paaniyo', type: 'string' },
      { key: 'tagline', value: 'Bangladesh\'s Water Platform', type: 'string' },
      { key: 'currency', value: 'BDT', type: 'string' },
      { key: 'default_delivery_fee', value: '30', type: 'number' },
      { key: 'free_delivery_min', value: '500', type: 'number' },
      { key: 'cod_enabled', value: 'true', type: 'boolean' },
      { key: 'bkash_enabled', value: 'true', type: 'boolean' },
      { key: 'jar_deposit_refundable', value: 'true', type: 'boolean' },
    ];

    for (const s of settings) {
      await prisma.settings.create({ data: s });
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Platform seeded successfully!',
      data: {
        users: 3,
        brands: brands.length,
        products: products.length,
        zones: 1,
      },
      testAccounts: {
        admin: { email: 'admin@paaniyo.com', password: 'Admin@123', access: '/admin' },
        vendor: { email: 'vendor@paaniyo.com', password: 'Vendor@123', access: '/vendor' },
        customer: { email: 'customer@paaniyo.com', password: 'Customer@123', access: '/shop' },
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
