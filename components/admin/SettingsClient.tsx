'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  DollarSign,
  Truck,
  Mail,
  Bell,
  Shield,
  Zap,
  Save,
  RotateCcw,
  Loader2,
  Check,
  X,
  AlertCircle,
  Info,
  ChevronRight,
  Globe,
  Package,
  Percent,
  CreditCard,
  Clock,
  Users,
  Lock,
  Droplets,
  Tag,
  Heart,
  MessageSquare,
} from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  default: string;
  isDefault: boolean;
  updatedAt: string | null;
}

interface GroupedSettings {
  [category: string]: {
    [key: string]: Setting;
  };
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  platform: {
    label: 'Platform',
    icon: <Globe className="w-5 h-5" />,
    description: 'Basic platform settings like name, currency, and locale',
  },
  commission: {
    label: 'Commission',
    icon: <Percent className="w-5 h-5" />,
    description: 'Vendor commission rates and payout settings',
  },
  shipping: {
    label: 'Shipping',
    icon: <Truck className="w-5 h-5" />,
    description: 'Shipping rates, free shipping threshold, and COD settings',
  },
  order: {
    label: 'Orders',
    icon: <Package className="w-5 h-5" />,
    description: 'Order limits and auto-confirmation settings',
  },
  email: {
    label: 'Email',
    icon: <Mail className="w-5 h-5" />,
    description: 'Email provider configuration and sender settings',
  },
  notifications: {
    label: 'Notifications',
    icon: <Bell className="w-5 h-5" />,
    description: 'Enable or disable notification types',
  },
  security: {
    label: 'Security',
    icon: <Shield className="w-5 h-5" />,
    description: 'Login security and session settings',
  },
  features: {
    label: 'Features',
    icon: <Zap className="w-5 h-5" />,
    description: 'Toggle platform features on or off',
  },
};

const SETTING_LABELS: Record<string, { label: string; description: string; type: 'text' | 'number' | 'boolean' | 'select'; options?: { value: string; label: string }[] }> = {
  // Platform
  'platform.name': { label: 'Platform Name', description: 'The name of your marketplace', type: 'text' },
  'platform.tagline': { label: 'Tagline', description: 'Short description of your platform', type: 'text' },
  'platform.currency': { label: 'Currency Code', description: 'ISO currency code (e.g., BDT, USD)', type: 'text' },
  'platform.currencySymbol': { label: 'Currency Symbol', description: 'Symbol to display (e.g., ৳, $)', type: 'text' },
  'platform.timezone': { label: 'Timezone', description: 'Server timezone for date/time operations', type: 'select', options: [
    { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
  ]},
  'platform.locale': { label: 'Default Locale', description: 'Default language and region format', type: 'select', options: [
    { value: 'bn-BD', label: 'Bangla (Bangladesh)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
  ]},
  
  // Commission
  'commission.defaultRate': { label: 'Default Commission (%)', description: 'Percentage taken from vendor sales', type: 'number' },
  'commission.minimumPayout': { label: 'Minimum Payout (BDT)', description: 'Minimum balance required for payout', type: 'number' },
  'commission.payoutSchedule': { label: 'Payout Schedule', description: 'How often payouts are processed', type: 'select', options: [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ]},
  
  // Shipping
  'shipping.defaultRate': { label: 'Default Shipping Rate (BDT)', description: 'Standard shipping fee', type: 'number' },
  'shipping.freeShippingThreshold': { label: 'Free Shipping Threshold (BDT)', description: 'Order value for free shipping (0 = disabled)', type: 'number' },
  'shipping.estimatedDays': { label: 'Estimated Delivery', description: 'Estimated delivery time to show customers', type: 'text' },
  'shipping.enableCOD': { label: 'Enable Cash on Delivery', description: 'Allow customers to pay on delivery', type: 'boolean' },
  'shipping.codFee': { label: 'COD Fee (BDT)', description: 'Extra charge for cash on delivery', type: 'number' },
  
  // Order
  'order.minOrderValue': { label: 'Minimum Order Value (BDT)', description: 'Minimum cart value to checkout', type: 'number' },
  'order.maxOrderItems': { label: 'Maximum Order Items', description: 'Maximum items allowed per order', type: 'number' },
  'order.autoConfirmHours': { label: 'Auto-confirm Hours', description: 'Hours before auto-confirming payment', type: 'number' },
  'order.autoCancelHours': { label: 'Auto-cancel Hours', description: 'Hours before cancelling unpaid orders', type: 'number' },
  
  // Email
  'email.provider': { label: 'Email Provider', description: 'Service used to send emails', type: 'select', options: [
    { value: 'resend', label: 'Resend' },
    { value: 'sendgrid', label: 'SendGrid' },
    { value: 'smtp', label: 'Custom SMTP' },
  ]},
  'email.fromName': { label: 'From Name', description: 'Sender name for emails', type: 'text' },
  'email.fromEmail': { label: 'From Email', description: 'Sender email address', type: 'text' },
  'email.replyToEmail': { label: 'Reply-to Email', description: 'Email for customer replies', type: 'text' },
  'email.enabled': { label: 'Enable Email Sending', description: 'Turn email notifications on/off', type: 'boolean' },
  
  // Notifications
  'notifications.orderConfirmation': { label: 'Order Confirmation', description: 'Send email when order is placed', type: 'boolean' },
  'notifications.orderShipped': { label: 'Order Shipped', description: 'Send email when order ships', type: 'boolean' },
  'notifications.orderDelivered': { label: 'Order Delivered', description: 'Send email when order is delivered', type: 'boolean' },
  'notifications.vendorNewOrder': { label: 'Vendor New Order', description: 'Notify vendors of new orders', type: 'boolean' },
  'notifications.vendorPayoutProcessed': { label: 'Vendor Payout', description: 'Notify vendors when payout is processed', type: 'boolean' },
  'notifications.reviewModerated': { label: 'Review Moderated', description: 'Notify users when review is approved/rejected', type: 'boolean' },
  
  // Security
  'security.maxLoginAttempts': { label: 'Max Login Attempts', description: 'Failed attempts before lockout', type: 'number' },
  'security.lockoutMinutes': { label: 'Lockout Duration (minutes)', description: 'How long accounts are locked', type: 'number' },
  'security.sessionExpiryDays': { label: 'Session Expiry (days)', description: 'How long sessions remain valid', type: 'number' },
  'security.requireEmailVerification': { label: 'Require Email Verification', description: 'Users must verify email to order', type: 'boolean' },
  
  // Features
  'features.reviews': { label: 'Product Reviews', description: 'Allow customers to review products', type: 'boolean' },
  'features.wishlist': { label: 'Wishlist', description: 'Allow customers to save products', type: 'boolean' },
  'features.promoCodes': { label: 'Promo Codes', description: 'Enable promotional discount codes', type: 'boolean' },
  'features.waterTracker': { label: 'Water Tracker', description: 'Enable daily water intake tracker', type: 'boolean' },
  'features.vendorRegistration': { label: 'Vendor Registration', description: 'Allow new vendor applications', type: 'boolean' },
  'features.guestCheckout': { label: 'Guest Checkout', description: 'Allow checkout without account', type: 'boolean' },
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [originalSettings, setOriginalSettings] = useState<GroupedSettings>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('platform');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      
      const data = await res.json();
      setSettings(data.settings);
      setOriginalSettings(JSON.parse(JSON.stringify(data.settings)));
      setCategories(data.categories);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    const [category] = key.split('.');
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: {
          ...prev[category][key],
          value,
          isDefault: false,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Collect all changed settings
      const changedSettings: Record<string, string> = {};
      
      Object.entries(settings).forEach(([category, categorySettings]) => {
        Object.entries(categorySettings).forEach(([key, setting]) => {
          const original = originalSettings[category]?.[key];
          if (original && setting.value !== original.value) {
            changedSettings[key] = setting.value;
          }
        });
      });

      if (Object.keys(changedSettings).length === 0) {
        showToast('info', 'No changes to save');
        return;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      await fetchSettings();
      showToast('success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (category?: string) => {
    if (!confirm(category 
      ? `Reset all ${CATEGORY_CONFIG[category]?.label || category} settings to defaults?`
      : 'Reset ALL settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      if (!res.ok) throw new Error('Failed to reset settings');

      await fetchSettings();
      showToast('success', 'Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showToast('error', 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setHasChanges(false);
  };

  const renderSettingInput = (key: string, setting: Setting) => {
    const config = SETTING_LABELS[key];
    if (!config) return null;

    const { type, options } = config;

    if (type === 'boolean') {
      return (
        <button
          onClick={() => handleChange(key, setting.value === 'true' ? 'false' : 'true')}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
            setting.value === 'true' ? 'bg-cyan-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              setting.value === 'true' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      );
    }

    if (type === 'select' && options) {
      return (
        <select
          value={setting.value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'number') {
      return (
        <input
          type="number"
          value={setting.value}
          onChange={(e) => handleChange(key, e.target.value)}
          min="0"
          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      );
    }

    return (
      <input
        type="text"
        value={setting.value}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const categorySettings = settings[activeCategory] || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-cyan-400" />
            Platform Settings
          </h1>
          <p className="text-gray-400 mt-1">
            Configure your marketplace settings and preferences
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-200 text-sm">
              You have unsaved changes. Don&apos;t forget to save before leaving this page.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[280px,1fr] gap-6">
        {/* Category Navigation */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 h-fit lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
            Categories
          </h2>
          <nav className="space-y-1">
            {categories.map((category) => {
              const config = CATEGORY_CONFIG[category];
              const isActive = activeCategory === category;
              const categoryData = settings[category] || {};
              const hasModified = Object.values(categoryData).some((s) => !s.isDefault);

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className={isActive ? 'text-cyan-400' : ''}>
                    {config?.icon || <Settings className="w-5 h-5" />}
                  </span>
                  <span className="flex-1 text-left font-medium">
                    {config?.label || category}
                  </span>
                  {hasModified && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <button
              onClick={() => handleReset()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All to Defaults
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {CATEGORY_CONFIG[activeCategory]?.icon}
                {CATEGORY_CONFIG[activeCategory]?.label || activeCategory} Settings
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {CATEGORY_CONFIG[activeCategory]?.description}
              </p>
            </div>
            <button
              onClick={() => handleReset(activeCategory)}
              className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(categorySettings).map(([key, setting]) => {
              const config = SETTING_LABELS[key];
              if (!config) return null;

              const isModified = setting.value !== setting.default;

              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{config.label}</h3>
                      {isModified && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Modified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                    {isModified && (
                      <p className="text-xs text-gray-600 mt-1">
                        Default: {setting.default}
                      </p>
                    )}
                  </div>
                  <div className="sm:w-48 md:w-64">
                    {renderSettingInput(key, setting)}
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(categorySettings).length === 0 && (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No settings available for this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl border ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-red-500/20 border-red-500/30 text-red-200'
                  : 'bg-blue-500/20 border-blue-500/30 text-blue-200'
              }`}
            >
              {toast.type === 'success' && <Check className="w-5 h-5" />}
              {toast.type === 'error' && <X className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
