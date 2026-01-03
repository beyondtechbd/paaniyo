'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Droplets, ArrowRight, Sparkles, Package, Dumbbell, 
  Building2, Baby, Clock, Heart, Zap, Leaf, Wrench,
  Truck, Shield, RefreshCw, Phone
} from 'lucide-react';

const useCaseConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  'home': { label: 'Home', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-100' },
  'office': { label: 'Office', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100' },
  'workout': { label: 'After Workout', icon: Dumbbell, color: 'text-orange-600', bg: 'bg-orange-100' },
  'kids': { label: 'For Kids', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-100' },
  'premium': { label: 'Premium', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-100' },
  'daily': { label: 'Daily Use', icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  'health': { label: 'Health', icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
  'energy': { label: 'Energy', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  'budget': { label: 'Budget', icon: Leaf, color: 'text-green-600', bg: 'bg-green-100' },
  'maintenance': { label: 'Maintenance', icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-100' },
};

interface HomeClientProps {
  data: {
    featuredProducts: any[];
    jars: any[];
    brands: any[];
    useCases: string[];
    user: any;
  };
}

export function HomeClient({ data }: HomeClientProps) {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            >
              Bangladesh's Water Platform
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg md:text-xl text-cyan-100"
            >
              Water jars, bottles, filtration systems, spare parts, and beverages. 
              Subscribe for regular delivery or order on-demand.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                href="/shop?type=JAR"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-cyan-700 font-semibold rounded-xl hover:bg-cyan-50 transition-colors"
              >
                <Droplets className="w-5 h-5" />
                Order Water Jars
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Browse All Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white dark:bg-slate-900 border-b py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: Truck, label: 'Free Delivery', sub: 'Orders over ৳500' },
              { icon: RefreshCw, label: 'Jar Exchange', sub: 'Return empty jars' },
              { icon: Shield, label: 'Quality Assured', sub: 'BSTI certified' },
              { icon: Phone, label: 'Support', sub: '24/7 helpline' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-3">
                <item.icon className="w-8 h-8 text-cyan-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Discovery */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            What are you looking for?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.useCases.map((uc, i) => {
              const config = useCaseConfig[uc] || { label: uc, icon: Droplets, color: 'text-slate-600', bg: 'bg-slate-100' };
              const Icon = config.icon;
              return (
                <motion.div
                  key={uc}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/shop?useCase=${uc}`}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${config.bg} hover:scale-105 transition-transform`}
                  >
                    <Icon className={`w-8 h-8 ${config.color}`} />
                    <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Water Jars - Core Product */}
      {data.jars.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Water Jars
                </h2>
                <p className="text-slate-600">Refillable jars with deposit system</p>
              </div>
              <Link href="/shop?type=JAR" className="text-cyan-600 font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.jars.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {data.featuredProducts.length > 0 && (
        <section className="py-12 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Featured Products
                </h2>
                <p className="text-slate-600">Handpicked for quality and value</p>
              </div>
              <Link href="/shop" className="text-cyan-600 font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.featuredProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subscription CTA */}
      <section className="py-16 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Never Run Out of Water</h2>
          <p className="text-cyan-100 mb-8 max-w-xl mx-auto">
            Set up a subscription for automatic delivery. Choose daily, weekly, or custom schedules.
            Pause or skip anytime.
          </p>
          <Link
            href="/subscriptions"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-cyan-700 font-semibold rounded-xl hover:bg-cyan-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Set Up Subscription
          </Link>
        </div>
      </section>

      {/* Brands */}
      {data.brands.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Trusted Brands
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {data.brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/shop?brand=${brand.slug}`}
                  className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-lg transition-shadow"
                >
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="h-12 object-contain" />
                  ) : (
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-400">{brand.name[0]}</span>
                    </div>
                  )}
                  <span className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {brand.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Water Tracker CTA */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-8 md:p-12 text-white">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Track Your Hydration</h2>
              <p className="text-blue-100 mb-6">
                Use our free water tracker to monitor your daily intake. Set goals, get reminders, 
                and build healthy hydration habits.
              </p>
              <Link
                href="/tracker"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                <Droplets className="w-5 h-5" />
                Open Water Tracker
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-8" />
    </main>
  );
}

function ProductCard({ product, index }: { product: any; index: number }) {
  const hasDeposit = product.depositBDT && Number(product.depositBDT) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="group block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
      >
        <div className="aspect-square bg-slate-100 relative overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Droplets className="w-12 h-12 text-slate-300" />
            </div>
          )}
          {product.type === 'JAR' && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
              Refillable
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-cyan-600 font-medium">{product.brand?.name}</p>
          <h3 className="font-medium text-slate-900 dark:text-white mt-1 line-clamp-2 text-sm">
            {product.name}
          </h3>
          <div className="mt-2">
            <span className="text-lg font-bold text-slate-900">৳{Number(product.priceBDT)}</span>
            {hasDeposit && (
              <span className="text-xs text-amber-600 ml-1">+৳{Number(product.depositBDT)} deposit</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
