// components/ui/breadcrumb-nav.tsx
// Breadcrumb Navigation Component

'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className = '' }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm', className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-2 h-4 w-4 flex-shrink-0 text-slate-400" />
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'max-w-[200px] truncate',
                    isLast
                      ? 'font-medium text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {index === 0 && (
                    <Home className="mr-1 inline-block h-4 w-4" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex max-w-[200px] items-center truncate text-slate-600 transition-colors hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
                >
                  {index === 0 && <Home className="mr-1 h-4 w-4" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default BreadcrumbNav;
