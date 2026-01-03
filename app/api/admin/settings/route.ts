import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import DOMPurify from 'isomorphic-dompurify';

// Settings keys and their defaults (stored as JSON in SiteSetting)
const SETTING_DEFAULTS: Record<string, string> = {
  // Platform Settings
  'platform.name': 'Paaniyo',
  'platform.tagline': 'Premium Hydration Marketplace',
  'platform.currency': 'BDT',
  'platform.currencySymbol': '৳',
  'platform.timezone': 'Asia/Dhaka',
  'platform.locale': 'bn-BD',
  
  // Commission Settings
  'commission.defaultRate': '10', // percentage
  'commission.minimumPayout': '500', // BDT
  'commission.payoutSchedule': 'weekly', // daily, weekly, biweekly, monthly
  
  // Shipping Settings
  'shipping.defaultRate': '60', // BDT
  'shipping.freeShippingThreshold': '1000', // BDT, 0 = disabled
  'shipping.estimatedDays': '3-5',
  'shipping.enableCOD': 'true',
  'shipping.codFee': '20', // BDT
  
  // Order Settings
  'order.minOrderValue': '100', // BDT
  'order.maxOrderItems': '50',
  'order.autoConfirmHours': '24', // hours before auto-confirming payment
  'order.autoCancelHours': '72', // hours before auto-cancelling unpaid orders
  
  // Email Settings
  'email.provider': 'resend', // resend, sendgrid, smtp
  'email.fromName': 'Paaniyo',
  'email.fromEmail': 'noreply@paaniyo.com',
  'email.replyToEmail': 'support@paaniyo.com',
  'email.enabled': 'false',
  
  // Notification Settings
  'notifications.orderConfirmation': 'true',
  'notifications.orderShipped': 'true',
  'notifications.orderDelivered': 'true',
  'notifications.vendorNewOrder': 'true',
  'notifications.vendorPayoutProcessed': 'true',
  'notifications.reviewModerated': 'true',
  
  // Security Settings
  'security.maxLoginAttempts': '5',
  'security.lockoutMinutes': '30',
  'security.sessionExpiryDays': '7',
  'security.requireEmailVerification': 'true',
  
  // Feature Flags
  'features.reviews': 'true',
  'features.wishlist': 'true',
  'features.promoCodes': 'true',
  'features.waterTracker': 'true',
  'features.vendorRegistration': 'true',
  'features.guestCheckout': 'false',
};

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // platform, commission, shipping, etc.

    // Fetch all settings from database
    const dbSettings = await prisma.siteSetting.findMany({
      where: category ? { key: { startsWith: `${category}.` } } : undefined,
      orderBy: { key: 'asc' },
    });

    // Create a map of database settings
    const settingsMap: Record<string, { value: string; updatedAt: Date | null }> = {};
    dbSettings.forEach((s) => {
      settingsMap[s.key] = { value: s.value as string, updatedAt: s.updatedAt };
    });

    // Merge with defaults
    const settings: Record<string, { key: string; value: string; default: string; isDefault: boolean; updatedAt: Date | null }> = {};
    
    Object.entries(SETTING_DEFAULTS).forEach(([key, defaultValue]) => {
      if (category && !key.startsWith(`${category}.`)) return;
      
      const dbSetting = settingsMap[key];
      settings[key] = {
        key,
        value: dbSetting?.value ?? defaultValue,
        default: defaultValue,
        isDefault: !dbSetting,
        updatedAt: dbSetting?.updatedAt ?? null,
      };
    });

    // Group by category
    const grouped: Record<string, typeof settings> = {};
    Object.entries(settings).forEach(([key, setting]) => {
      const cat = key.split('.')[0];
      if (!grouped[cat]) grouped[cat] = {};
      grouped[cat][key] = setting;
    });

    return NextResponse.json({
      settings: category ? settings : grouped,
      categories: Object.keys(grouped),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Validate all keys exist in defaults
    const invalidKeys = Object.keys(settings).filter((key) => !(key in SETTING_DEFAULTS));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid setting keys: ${invalidKeys.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate values
    const errors: Record<string, string> = {};
    
    Object.entries(settings).forEach(([key, value]) => {
      const sanitizedValue = DOMPurify.sanitize(String(value).trim());
      
      // Numeric validations
      if (key.includes('Rate') || key.includes('Threshold') || key.includes('Fee') || 
          key.includes('Value') || key.includes('Hours') || key.includes('Days') || 
          key.includes('Items') || key.includes('Attempts') || key.includes('Minutes')) {
        const num = parseFloat(sanitizedValue);
        if (isNaN(num) || num < 0) {
          errors[key] = 'Must be a non-negative number';
        }
        if (key === 'commission.defaultRate' && num > 100) {
          errors[key] = 'Commission rate cannot exceed 100%';
        }
      }
      
      // Boolean validations
      if (key.includes('enabled') || key.includes('Enable') || key.includes('require') ||
          key.startsWith('notifications.') || key.startsWith('features.')) {
        if (!['true', 'false'].includes(sanitizedValue)) {
          errors[key] = 'Must be true or false';
        }
      }
      
      // Email validations
      if (key.includes('Email') && sanitizedValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedValue)) {
          errors[key] = 'Invalid email format';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Upsert settings
    const updates = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: DOMPurify.sanitize(String(value).trim()) },
          update: { value: DOMPurify.sanitize(String(value).trim()) },
        })
      )
    );

    return NextResponse.json({
      message: 'Settings updated successfully',
      updated: updates.length,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/reset - Reset settings to defaults
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keys, category } = body as { keys?: string[]; category?: string };

    let keysToReset: string[] = [];
    
    if (keys && keys.length > 0) {
      keysToReset = keys.filter((k) => k in SETTING_DEFAULTS);
    } else if (category) {
      keysToReset = Object.keys(SETTING_DEFAULTS).filter((k) => k.startsWith(`${category}.`));
    } else {
      keysToReset = Object.keys(SETTING_DEFAULTS);
    }

    if (keysToReset.length === 0) {
      return NextResponse.json(
        { error: 'No valid keys to reset' },
        { status: 400 }
      );
    }

    // Delete the settings (they'll fall back to defaults)
    await prisma.siteSetting.deleteMany({
      where: { key: { in: keysToReset } },
    });

    return NextResponse.json({
      message: 'Settings reset to defaults',
      reset: keysToReset.length,
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    );
  }
}
