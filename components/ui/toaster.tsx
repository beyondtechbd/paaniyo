// components/ui/toaster.tsx
// Toast Container Component

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast, Toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: {
    container: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    icon: Info,
    iconColor: 'text-cyan-500',
  },
  success: {
    container: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
  destructive: {
    container: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    icon: AlertCircle,
    iconColor: 'text-rose-500',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const variant = toast.variant || 'default';
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm',
        styles.container
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default Toaster;
