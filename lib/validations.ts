// lib/validations.ts
// Zod Validation Schemas with DOMPurify Sanitization

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// ═══════════════════════════════════════════════════════════════
// SANITIZATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize plain text (strip all HTML)
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Custom Zod transformer for sanitized strings
 */
const sanitizedString = z.string().transform((val) => sanitizeText(val.trim()));

const sanitizedHtmlString = z
  .string()
  .transform((val) => sanitizeHtml(val.trim()));

// ═══════════════════════════════════════════════════════════════
// COMMON SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{10,14}$/, 'Invalid phone number')
  .transform((val) => val.replace(/\s/g, ''));

export const bdtAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(10000000, 'Amount exceeds limit');

export const slugSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

// ═══════════════════════════════════════════════════════════════
// AUTH SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().optional(),
});

export const registerSchema = z
  .object({
    name: sanitizedString.pipe(
      z.string().min(2, 'Name must be at least 2 characters').max(100)
    ),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: phoneSchema.optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
    captchaToken: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  captchaToken: z.string(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ═══════════════════════════════════════════════════════════════
// PRODUCT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const mineralContentSchema = z.object({
  pH: z.number().min(0).max(14).optional(),
  tds: z.number().min(0).optional(),
  calcium: z.number().min(0).optional(),
  magnesium: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  potassium: z.number().min(0).optional(),
  bicarbonate: z.number().min(0).optional(),
  chloride: z.number().min(0).optional(),
  sulfate: z.number().min(0).optional(),
  silica: z.number().min(0).optional(),
  fluoride: z.number().min(0).optional(),
  nitrate: z.number().min(0).optional(),
});

export const sensoryProfileSchema = z.object({
  roundness: z.number().min(0).max(10).optional(),
  neutrality: z.number().min(0).max(10).optional(),
  hardness: z.number().min(0).max(10).optional(),
  sweetness: z.number().min(0).max(10).optional(),
  minerality: z.number().min(0).max(10).optional(),
  smoothness: z.number().min(0).max(10).optional(),
  freshness: z.number().min(0).max(10).optional(),
  effervescence: z.number().min(0).max(10).optional(),
  crispness: z.number().min(0).max(10).optional(),
});

export const productSpecsSchema = z.object({
  dimensions: z
    .object({
      height: z.number().optional(),
      width: z.number().optional(),
      diameter: z.number().optional(),
      depth: z.number().optional(),
      unit: z.string().default('cm'),
    })
    .optional(),
  weight: z
    .object({
      bottle: z.number().optional(),
      packaging: z.number().optional(),
      total: z.number().optional(),
      unit: z.string().default('g'),
    })
    .optional(),
  material: z.string().optional(),
  closure: z.string().optional(),
  caseSize: z.string().optional(),
  carbonation: z.string().optional(),
});

export const createProductSchema = z.object({
  name: sanitizedString.pipe(z.string().min(2).max(200)),
  slug: slugSchema.optional(),
  brandId: z.string().cuid(),
  category: z.enum([
    'BOTTLED_WATER',
    'SPARKLING_WATER',
    'FILTRATION_SYSTEM',
    'SOFT_DRINK',
    'FIZZY_DRINK',
  ]),
  waterType: z
    .enum(['STILL', 'SPARKLING', 'MINERAL', 'SPRING', 'ARTESIAN'])
    .optional(),
  priceBDT: bdtAmountSchema,
  compareBDT: bdtAmountSchema.optional(),
  costBDT: bdtAmountSchema.optional(),
  sku: z.string().max(50).optional(),
  stock: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(0).default(10),
  volumeMl: z.number().int().min(0).optional(),
  packSize: z.number().int().min(1).default(1),
  minerals: mineralContentSchema.optional(),
  sensory: sensoryProfileSchema.optional(),
  specs: productSpecsSchema.optional(),
  shortDesc: sanitizedString.pipe(z.string().max(300)).optional(),
  description: sanitizedHtmlString.optional(),
  ingredients: sanitizedString.optional(),
  images: z.array(z.string().url()).min(1, 'At least one image required'),
  freeShipping: z.boolean().default(false),
  fragileItem: z.boolean().default(false),
  weightGrams: z.number().int().min(0).optional(),
  sustainable: z.boolean().default(false),
  sustainNotes: sanitizedString.optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: sanitizedString.pipe(z.string().max(70)).optional(),
  metaDescription: sanitizedString.pipe(z.string().max(160)).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ═══════════════════════════════════════════════════════════════
// ORDER SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const addressSchema = z.object({
  label: sanitizedString.pipe(z.string().max(50)).optional(),
  fullName: sanitizedString.pipe(z.string().min(2).max(100)),
  phone: phoneSchema,
  address1: sanitizedString.pipe(z.string().min(5).max(200)),
  address2: sanitizedString.pipe(z.string().max(200)).optional(),
  city: sanitizedString.pipe(z.string().min(2).max(100)),
  district: sanitizedString.pipe(z.string().min(2).max(100)),
  postCode: z.string().max(10).optional(),
  isDefault: z.boolean().default(false),
});

export const cartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(100),
});

export const checkoutSchema = z.object({
  addressId: z.string().cuid(),
  promoCode: z.string().max(20).optional(),
  notes: sanitizedString.pipe(z.string().max(500)).optional(),
});

// ═══════════════════════════════════════════════════════════════
// REVIEW SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const reviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: sanitizedString.pipe(z.string().max(100)).optional(),
  content: sanitizedHtmlString.pipe(z.string().max(1000)).optional(),
});

// ═══════════════════════════════════════════════════════════════
// BRAND APPLICATION SCHEMA
// ═══════════════════════════════════════════════════════════════

export const brandApplicationSchema = z.object({
  brandName: sanitizedString.pipe(z.string().min(2).max(100)),
  applicantName: sanitizedString.pipe(z.string().min(2).max(100)),
  applicantEmail: emailSchema,
  applicantPhone: phoneSchema.optional(),
  brandWebsite: z.string().url().optional().or(z.literal('')),
  brandCountry: z.string().max(100).optional(),
  productTypes: z.string().max(200).optional(),
  description: sanitizedHtmlString.pipe(z.string().max(2000)).optional(),
});

// ═══════════════════════════════════════════════════════════════
// TRACKER SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const trackerLogSchema = z.object({
  date: z.coerce.date(),
  intakeMl: z.number().int().min(0).max(10000),
  type: z.enum(['water', 'tea', 'juice', 'other']).default('water'),
});

export const trackerSettingsSchema = z.object({
  dailyGoalMl: z.number().int().min(500).max(10000).default(3000),
  reminderEnabled: z.boolean().default(true),
  reminderTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(),
  glassSize: z.number().int().min(100).max(1000).default(250),
});

// ═══════════════════════════════════════════════════════════════
// ADMIN SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const vendorSchema = z.object({
  businessName: sanitizedString.pipe(z.string().min(2).max(200)),
  tradeLicense: z.string().max(100).optional(),
  taxId: z.string().max(50).optional(),
  contactName: sanitizedString.pipe(z.string().min(2).max(100)),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  commissionRate: z.number().min(0).max(0.5).default(0.12),
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(50).optional(),
  bankRouting: z.string().max(20).optional(),
  bkashNumber: phoneSchema.optional(),
});

export const brandSchema = z.object({
  name: sanitizedString.pipe(z.string().min(2).max(100)),
  slug: slugSchema.optional(),
  vendorId: z.string().cuid(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  description: sanitizedHtmlString.pipe(z.string().max(2000)).optional(),
  story: sanitizedHtmlString.pipe(z.string().max(5000)).optional(),
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: sanitizedString.pipe(z.string().max(70)).optional(),
  metaDescription: sanitizedString.pipe(z.string().max(160)).optional(),
});

// ═══════════════════════════════════════════════════════════════
// SEARCH & FILTER SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const productFilterSchema = z.object({
  category: z
    .enum([
      'BOTTLED_WATER',
      'SPARKLING_WATER',
      'FILTRATION_SYSTEM',
      'SOFT_DRINK',
      'FIZZY_DRINK',
    ])
    .optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(1000000).optional(),
  waterType: z
    .enum(['STILL', 'SPARKLING', 'MINERAL', 'SPRING', 'ARTESIAN'])
    .optional(),
  freeShipping: z.coerce.boolean().optional(),
  sustainable: z.coerce.boolean().optional(),
  sortBy: z
    .enum(['price_asc', 'price_desc', 'newest', 'popular', 'rating'])
    .default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: sanitizedString.pipe(z.string().max(100)).optional(),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BrandApplicationInput = z.infer<typeof brandApplicationSchema>;
export type TrackerLogInput = z.infer<typeof trackerLogSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
