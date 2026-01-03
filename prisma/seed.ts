// prisma/seed.ts
import { PrismaClient, UserRole, ProductCategory, WaterType, VendorStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@paaniyo.com' },
    update: {},
    create: {
      email: 'admin@paaniyo.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      phone: '+8801700000001',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Vendor User
  const vendorPassword = await bcrypt.hash('Vendor@123', 12);
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@paaniyo.com' },
    update: {},
    create: {
      email: 'vendor@paaniyo.com',
      name: 'Vendor User',
      passwordHash: vendorPassword,
      role: UserRole.VENDOR,
      phone: '+8801700000002',
      emailVerified: new Date(),
    },
  });

  // Create Customer User
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@paaniyo.com' },
    update: {},
    create: {
      email: 'customer@paaniyo.com',
      name: 'Test Customer',
      passwordHash: customerPassword,
      role: UserRole.CUSTOMER,
      phone: '+8801700000003',
      emailVerified: new Date(),
    },
  });
  
  // Create cart for customer
  await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });
  console.log('✅ Customer user created:', customer.email);

  // Create Brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'evian' },
      update: {},
      create: {
        name: 'Evian',
        slug: 'evian',
        description: 'Premium natural spring water from the French Alps, known for its purity and balanced mineral composition.',
        logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200',
        coverImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
        country: 'France',
        founded: 1826,
        isActive: true,
        userId: vendorUser.id,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'fiji' },
      update: {},
      create: {
        name: 'FIJI Water',
        slug: 'fiji',
        description: 'Natural artesian water from the remote Fiji Islands, filtered through volcanic rock.',
        logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200',
        coverImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
        country: 'Fiji',
        founded: 1996,
        isActive: true,
        userId: vendorUser.id,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'san-pellegrino' },
      update: {},
      create: {
        name: 'San Pellegrino',
        slug: 'san-pellegrino',
        description: 'Italian sparkling natural mineral water from the foothills of the Italian Alps.',
        logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200',
        coverImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
        country: 'Italy',
        founded: 1899,
        isActive: true,
        userId: vendorUser.id,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'perrier' },
      update: {},
      create: {
        name: 'Perrier',
        slug: 'perrier',
        description: 'French sparkling natural mineral water, bottled at source in Vergèze.',
        logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200',
        coverImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
        country: 'France',
        founded: 1898,
        isActive: true,
        userId: vendorUser.id,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'voss' },
      update: {},
      create: {
        name: 'VOSS',
        slug: 'voss',
        description: 'Premium artesian water from Norway, known for its iconic cylindrical bottle.',
        logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200',
        coverImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
        country: 'Norway',
        founded: 1998,
        isActive: true,
        userId: vendorUser.id,
      },
    }),
  ]);
  console.log('✅ Brands created:', brands.length);

  // Create Vendor Profile
  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      businessName: 'Premium Water Distributors',
      businessEmail: 'vendor@paaniyo.com',
      businessPhone: '+8801700000002',
      businessAddress: '123 Water Street, Dhaka',
      status: VendorStatus.APPROVED,
      commissionRate: 10,
    },
  });
  console.log('✅ Vendor profile created');

  // Create Products
  const products = [
    // Still Water
    { name: 'Evian Natural Spring Water 500ml', slug: 'evian-500ml', brand: 'evian', category: ProductCategory.STILL_WATER, waterType: WaterType.SPRING, price: 150, compare: 180, volume: 500, stock: 100, featured: true },
    { name: 'Evian Natural Spring Water 1L', slug: 'evian-1l', brand: 'evian', category: ProductCategory.STILL_WATER, waterType: WaterType.SPRING, price: 250, compare: 300, volume: 1000, stock: 80, featured: false },
    { name: 'FIJI Artesian Water 500ml', slug: 'fiji-500ml', brand: 'fiji', category: ProductCategory.STILL_WATER, waterType: WaterType.ARTESIAN, price: 180, compare: 220, volume: 500, stock: 120, featured: true },
    { name: 'FIJI Artesian Water 1L', slug: 'fiji-1l', brand: 'fiji', category: ProductCategory.STILL_WATER, waterType: WaterType.ARTESIAN, price: 320, compare: 380, volume: 1000, stock: 60, featured: false },
    { name: 'VOSS Still Water 800ml', slug: 'voss-still-800ml', brand: 'voss', category: ProductCategory.STILL_WATER, waterType: WaterType.ARTESIAN, price: 280, compare: 350, volume: 800, stock: 50, featured: true },
    
    // Sparkling Water
    { name: 'San Pellegrino Sparkling 500ml', slug: 'san-pellegrino-500ml', brand: 'san-pellegrino', category: ProductCategory.SPARKLING_WATER, waterType: WaterType.MINERAL, price: 200, compare: 250, volume: 500, stock: 90, featured: true },
    { name: 'San Pellegrino Sparkling 750ml', slug: 'san-pellegrino-750ml', brand: 'san-pellegrino', category: ProductCategory.SPARKLING_WATER, waterType: WaterType.MINERAL, price: 350, compare: 420, volume: 750, stock: 40, featured: false },
    { name: 'Perrier Sparkling Water 330ml', slug: 'perrier-330ml', brand: 'perrier', category: ProductCategory.SPARKLING_WATER, waterType: WaterType.MINERAL, price: 160, compare: 200, volume: 330, stock: 150, featured: true },
    { name: 'Perrier Sparkling Water 750ml', slug: 'perrier-750ml', brand: 'perrier', category: ProductCategory.SPARKLING_WATER, waterType: WaterType.MINERAL, price: 300, compare: 380, volume: 750, stock: 70, featured: false },
    { name: 'VOSS Sparkling Water 800ml', slug: 'voss-sparkling-800ml', brand: 'voss', category: ProductCategory.SPARKLING_WATER, waterType: WaterType.ARTESIAN, price: 320, compare: 400, volume: 800, stock: 45, featured: true },
    
    // Mineral Water
    { name: 'Evian Mineral Rich 1.5L', slug: 'evian-mineral-1500ml', brand: 'evian', category: ProductCategory.MINERAL_WATER, waterType: WaterType.MINERAL, price: 380, compare: 450, volume: 1500, stock: 60, featured: false },
    { name: 'San Pellegrino Mineral 1L', slug: 'san-pellegrino-mineral-1l', brand: 'san-pellegrino', category: ProductCategory.MINERAL_WATER, waterType: WaterType.MINERAL, price: 420, compare: 500, volume: 1000, stock: 35, featured: true },
    
    // Flavored Water
    { name: 'Perrier Lime Flavored 330ml', slug: 'perrier-lime-330ml', brand: 'perrier', category: ProductCategory.FLAVORED_WATER, waterType: WaterType.MINERAL, price: 180, compare: 220, volume: 330, stock: 80, featured: true },
    { name: 'San Pellegrino Lemon 330ml', slug: 'san-pellegrino-lemon-330ml', brand: 'san-pellegrino', category: ProductCategory.FLAVORED_WATER, waterType: WaterType.MINERAL, price: 190, compare: 230, volume: 330, stock: 75, featured: false },
    { name: 'Perrier Grapefruit 250ml', slug: 'perrier-grapefruit-250ml', brand: 'perrier', category: ProductCategory.FLAVORED_WATER, waterType: WaterType.MINERAL, price: 150, compare: 180, volume: 250, stock: 100, featured: false },
  ];

  const brandMap = brands.reduce((acc, b) => ({ ...acc, [b.slug]: b.id }), {} as Record<string, string>);

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        brandId: brandMap[p.brand],
        category: p.category,
        waterType: p.waterType,
        priceBDT: p.price,
        compareBDT: p.compare,
        volumeMl: p.volume,
        stock: p.stock,
        isFeatured: p.featured,
        isActive: true,
        shortDesc: `Premium ${p.category.replace('_', ' ').toLowerCase()} - ${p.volume}ml`,
        description: `Experience the pure taste of ${p.name}. Sourced from pristine natural sources and bottled with care to preserve its natural minerals and freshness.`,
        images: [
          'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600',
          'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600',
        ],
        minerals: { pH: 7.2, TDS: 309, calcium: 80, magnesium: 26, sodium: 6.5 },
        freeShipping: p.price > 250,
      },
    });
  }
  console.log('✅ Products created:', products.length);

  // Create Settings
  await prisma.settings.upsert({
    where: { key: 'site_name' },
    update: {},
    create: { key: 'site_name', value: 'Paaniyo', type: 'string' },
  });
  await prisma.settings.upsert({
    where: { key: 'currency' },
    update: {},
    create: { key: 'currency', value: 'BDT', type: 'string' },
  });
  await prisma.settings.upsert({
    where: { key: 'shipping_fee' },
    update: {},
    create: { key: 'shipping_fee', value: '60', type: 'number' },
  });
  await prisma.settings.upsert({
    where: { key: 'free_shipping_threshold' },
    update: {},
    create: { key: 'free_shipping_threshold', value: '500', type: 'number' },
  });
  await prisma.settings.upsert({
    where: { key: 'cod_enabled' },
    update: {},
    create: { key: 'cod_enabled', value: 'true', type: 'boolean' },
  });
  console.log('✅ Settings created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📧 Test Accounts:');
  console.log('   Admin: admin@paaniyo.com / Admin@123');
  console.log('   Vendor: vendor@paaniyo.com / Vendor@123');
  console.log('   Customer: customer@paaniyo.com / Customer@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
