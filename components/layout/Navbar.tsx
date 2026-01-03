'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, User, Menu, X, Droplets, LogOut,
  LayoutDashboard, Heart, Package, Moon, Sun, Store, Settings,
  RefreshCw, ChevronDown
} from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/cart/count')
        .then((res) => res.json())
        .then((data) => setCartCount(data.count || 0))
        .catch(() => setCartCount(0));
    }
  }, [session, pathname]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const isAdmin = session?.user?.role === 'ADMIN';
  const isVendor = session?.user?.role === 'VENDOR';

  const navLinks = [
    { href: '/shop', label: 'Shop' },
    { href: '/shop?type=JAR', label: 'Water Jars' },
    { href: '/subscriptions', label: 'Subscriptions' },
    { href: '/tracker', label: 'Tracker' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-lg py-2' : 'bg-white py-3'
        }`}
      >
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform" />
                <Droplets className="relative w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-cyan-600">Paaniyo</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium transition-colors ${
                    pathname === link.href || (link.href !== '/shop' && pathname.startsWith(link.href))
                      ? 'text-cyan-600'
                      : 'text-slate-700 hover:text-cyan-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link href="/shop" className="p-2.5 rounded-xl hover:bg-slate-100">
                <Search className="w-5 h-5 text-slate-600" />
              </Link>

              <button onClick={toggleDarkMode} className="hidden sm:flex p-2.5 rounded-xl hover:bg-slate-100">
                {isDark ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>

              <Link href="/cart" className="relative p-2.5 rounded-xl hover:bg-slate-100">
                <ShoppingBag className="w-5 h-5 text-slate-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-cyan-500 text-white text-xs font-bold rounded-full">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {status === 'authenticated' && session?.user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100"
                  >
                    {session.user.image ? (
                      <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-medium">
                        {session.user.name?.[0] || 'U'}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
                        >
                          <div className="p-4 border-b bg-slate-50">
                            <p className="font-medium text-slate-900">{session.user.name}</p>
                            <p className="text-sm text-slate-500 truncate">{session.user.email}</p>
                          </div>
                          <div className="p-2">
                            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setUserMenuOpen(false)}>
                              <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                            <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setUserMenuOpen(false)}>
                              <Package className="w-4 h-4" /> My Orders
                            </Link>
                            <Link href="/subscriptions" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setUserMenuOpen(false)}>
                              <RefreshCw className="w-4 h-4" /> Subscriptions
                            </Link>
                            <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setUserMenuOpen(false)}>
                              <Heart className="w-4 h-4" /> Wishlist
                            </Link>
                            {isVendor && (
                              <Link href="/vendor" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-blue-600" onClick={() => setUserMenuOpen(false)}>
                                <Store className="w-4 h-4" /> Vendor Panel
                              </Link>
                            )}
                            {isAdmin && (
                              <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-purple-600" onClick={() => setUserMenuOpen(false)}>
                                <Settings className="w-4 h-4" /> Admin Panel
                              </Link>
                            )}
                          </div>
                          <div className="p-2 border-t">
                            <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50">
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth/login" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-600">
                  <User className="w-4 h-4" /> Login
                </Link>
              )}

              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-80 z-[70] bg-white shadow-2xl lg:hidden">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="text-lg font-bold text-cyan-600">Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} className={`block px-6 py-3 font-medium ${pathname === link.href ? 'text-cyan-600 bg-cyan-50' : 'text-slate-700'}`} onClick={() => setMobileMenuOpen(false)}>
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="p-4 border-t">
                  {status === 'authenticated' ? (
                    <div className="space-y-2">
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100" onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-100 text-purple-700" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="w-5 h-5" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50">
                        <LogOut className="w-5 h-5" /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link href="/auth/login" className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-cyan-500 text-white font-medium rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-5 h-5" /> Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-16" />
    </>
  );
}
