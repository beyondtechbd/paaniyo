// app/auth/login/page.tsx
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In | Paaniyo',
  description: 'Sign in to your Paaniyo account to manage orders and track your hydration.',
};

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (session) {
    redirect(params.callbackUrl || '/');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo */}
            <div className="mb-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C7.5 2 4 5.5 4 10c0 4 6 10 8 12 2-2 8-8 8-12 0-4.5-3.5-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
                  </svg>
                </div>
                <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Paaniyo
                </span>
              </Link>
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Sign in to continue your hydration journey
            </p>

            {/* Error Message */}
            {params.error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {params.error === 'CredentialsSignin' 
                  ? 'Invalid email or password. Please try again.'
                  : 'An error occurred. Please try again.'}
              </div>
            )}

            {/* Login Form (includes OAuth buttons) */}
            <div className="mt-8">
              <LoginForm callbackUrl={params.callbackUrl || '/'} />
            </div>

            {/* Register Link */}
            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                href={`/auth/register${params.callbackUrl ? `?callbackUrl=${encodeURIComponent(params.callbackUrl)}` : ''}`}
                className="font-semibold text-primary hover:text-primary/80"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Image/Graphics */}
        <div className="relative hidden w-0 flex-1 lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary">
            {/* Decorative Elements */}
            <div className="absolute inset-0 opacity-20">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="auth-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#auth-pattern)" />
              </svg>
            </div>
            
            {/* Floating Bubbles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/10"
                  style={{
                    width: `${Math.random() * 100 + 50}px`,
                    height: `${Math.random() * 100 + 50}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative flex h-full flex-col items-center justify-center px-12 text-center text-white">
              <h2 className="font-display text-4xl font-bold">
                Premium Hydration
              </h2>
              <p className="mt-4 max-w-md text-lg text-white/80">
                Discover the world's finest waters, delivered to your doorstep. 
                Track your hydration, earn rewards, and stay healthy.
              </p>
              
              {/* Features */}
              <div className="mt-12 grid grid-cols-2 gap-6">
                {[
                  { icon: '🌊', label: '50+ Premium Brands' },
                  { icon: '🚚', label: 'Fast Delivery' },
                  { icon: '💧', label: 'Water Tracker' },
                  { icon: '🎁', label: 'Rewards Program' },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-sm font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
