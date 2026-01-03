// components/layout/Footer.tsx
'use client';

import Link from 'next/link';
import {
  Droplets,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  CreditCard,
  Shield,
  Truck,
  HeadphonesIcon,
} from 'lucide-react';

const footerLinks = {
  shop: {
    title: { en: 'Shop', bn: 'কেনাকাটা' },
    links: [
      { href: '/products?category=BOTTLED_WATER', label: { en: 'Bottled Water', bn: 'বোতলজাত পানি' } },
      { href: '/products?category=SPARKLING_WATER', label: { en: 'Sparkling Water', bn: 'স্পার্কলিং ওয়াটার' } },
      { href: '/products?category=FILTRATION_SYSTEM', label: { en: 'Filtration Systems', bn: 'ফিল্টার সিস্টেম' } },
      { href: '/products?category=SOFT_DRINK', label: { en: 'Soft Drinks', bn: 'সফট ড্রিংক' } },
      { href: '/brands', label: { en: 'All Brands', bn: 'সব ব্র্যান্ড' } },
    ],
  },
  company: {
    title: { en: 'Company', bn: 'কোম্পানি' },
    links: [
      { href: '/about', label: { en: 'About Us', bn: 'আমাদের সম্পর্কে' } },
      { href: '/careers', label: { en: 'Careers', bn: 'ক্যারিয়ার' } },
      { href: '/press', label: { en: 'Press', bn: 'প্রেস' } },
      { href: '/sustainability', label: { en: 'Sustainability', bn: 'টেকসইতা' } },
      { href: '/blog', label: { en: 'Blog', bn: 'ব্লগ' } },
    ],
  },
  support: {
    title: { en: 'Support', bn: 'সহায়তা' },
    links: [
      { href: '/help', label: { en: 'Help Center', bn: 'সাহায্য কেন্দ্র' } },
      { href: '/shipping', label: { en: 'Shipping Info', bn: 'শিপিং তথ্য' } },
      { href: '/returns', label: { en: 'Returns & Refunds', bn: 'রিটার্ন ও রিফান্ড' } },
      { href: '/track-order', label: { en: 'Track Order', bn: 'অর্ডার ট্র্যাক' } },
      { href: '/contact', label: { en: 'Contact Us', bn: 'যোগাযোগ' } },
    ],
  },
  legal: {
    title: { en: 'Legal', bn: 'আইনি' },
    links: [
      { href: '/terms', label: { en: 'Terms of Service', bn: 'সেবার শর্তাবলী' } },
      { href: '/privacy', label: { en: 'Privacy Policy', bn: 'গোপনীয়তা নীতি' } },
      { href: '/cookies', label: { en: 'Cookie Policy', bn: 'কুকি নীতি' } },
    ],
  },
};

const features = [
  {
    icon: Truck,
    title: { en: 'Free Shipping', bn: 'ফ্রি শিপিং' },
    desc: { en: 'On orders over ৳2000', bn: '৳২০০০+ অর্ডারে' },
  },
  {
    icon: Shield,
    title: { en: 'Secure Payment', bn: 'নিরাপদ পেমেন্ট' },
    desc: { en: 'SSL encrypted', bn: 'SSL এনক্রিপ্টেড' },
  },
  {
    icon: CreditCard,
    title: { en: 'Multiple Payment', bn: 'একাধিক পেমেন্ট' },
    desc: { en: 'bKash, Nagad, Cards', bn: 'বিকাশ, নগদ, কার্ড' },
  },
  {
    icon: HeadphonesIcon,
    title: { en: '24/7 Support', bn: '২৪/৭ সাপোর্ট' },
    desc: { en: 'Dedicated support', bn: 'ডেডিকেটেড সাপোর্ট' },
  },
];

export function Footer() {
  const locale: 'en' | 'bn' = 'en';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      {/* Features Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {feature.title[locale]}
                  </p>
                  <p className="text-xs text-slate-500">{feature.desc[locale]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-300">
        {/* Decorative wave */}
        <div className="relative h-16 -mb-px overflow-hidden">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-0 w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120V60C240 100 480 40 720 60C960 80 1200 20 1440 60V120H0Z"
              fill="currentColor"
              className="text-slate-900 dark:text-slate-950"
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl rotate-6" />
                  <Droplets className="relative w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Paaniyo</span>
              </Link>
              <p className="text-slate-400 mb-6 leading-relaxed">
                {locale === 'bn'
                  ? 'বাংলাদেশের প্রিমিয়াম হাইড্রেশন মার্কেটপ্লেস। বিশ্বের সেরা ব্র্যান্ড থেকে প্রিমিয়াম বোতলজাত পানি ও পানীয়।'
                  : "Bangladesh's premier destination for premium bottled water and beverages from world-renowned brands."}
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <a
                  href="mailto:hello@paaniyo.com"
                  className="flex items-center gap-3 text-slate-400 hover:text-primary-400 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  hello@paaniyo.com
                </a>
                <a
                  href="tel:+8801700000000"
                  className="flex items-center gap-3 text-slate-400 hover:text-primary-400 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +880 1700-000000
                </a>
                <p className="flex items-start gap-3 text-slate-400">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  Gulshan-2, Dhaka 1212, Bangladesh
                </p>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 mt-6">
                {[
                  { icon: Facebook, href: 'https://facebook.com/paaniyo' },
                  { icon: Instagram, href: 'https://instagram.com/paaniyo' },
                  { icon: Twitter, href: 'https://twitter.com/paaniyo' },
                  { icon: Youtube, href: 'https://youtube.com/@paaniyo' },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-primary-600 flex items-center justify-center transition-colors"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h3 className="font-semibold text-white mb-4">
                  {section.title[locale]}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-primary-400 transition-colors text-sm"
                      >
                        {link.label[locale]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-semibold text-white mb-1">
                  {locale === 'bn' ? 'নিউজলেটারে সাবস্ক্রাইব করুন' : 'Subscribe to our Newsletter'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {locale === 'bn'
                    ? 'নতুন পণ্য ও অফার সম্পর্কে জানুন'
                    : 'Get updates on new products and exclusive offers'}
                </p>
              </div>
              <form className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder={locale === 'bn' ? 'আপনার ইমেইল' : 'Your email'}
                  className="flex-1 md:w-64 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all"
                >
                  {locale === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                {locale === 'bn' ? 'গ্রহণযোগ্য পেমেন্ট মেথড:' : 'We accept:'}
              </p>
              <div className="flex items-center gap-3">
                {['bKash', 'Nagad', 'Visa', 'Mastercard', 'AMEX'].map((method) => (
                  <div
                    key={method}
                    className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-medium text-slate-400"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-slate-500">
              <p>© {currentYear} Paaniyo. All rights reserved.</p>
              <p>
                Made with 💧 in Dhaka, Bangladesh
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bubbles */}
      <div className="absolute bottom-20 left-10 w-32 h-32 rounded-full bg-primary-500/5 blur-3xl" />
      <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full bg-secondary-500/5 blur-3xl" />
    </footer>
  );
}
