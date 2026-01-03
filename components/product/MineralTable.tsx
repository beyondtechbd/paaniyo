// components/product/MineralTable.tsx
// Mineral Content Table with Premium Styling

'use client';

import { motion } from 'framer-motion';
import { Info, Droplets } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MineralContent {
  pH?: number;
  tds?: number;
  calcium?: number;
  magnesium?: number;
  sodium?: number;
  potassium?: number;
  bicarbonate?: number;
  chloride?: number;
  sulfate?: number;
  silica?: number;
  fluoride?: number;
  nitrate?: number;
}

interface MineralInfo {
  label: string;
  labelBn: string;
  unit: string;
  description: string;
  idealRange?: string;
}

const mineralInfo: Record<string, MineralInfo> = {
  pH: {
    label: 'pH Level',
    labelBn: 'পিএইচ মাত্রা',
    unit: '',
    description: 'Measure of acidity/alkalinity. 7 is neutral.',
    idealRange: '6.5 - 8.5',
  },
  tds: {
    label: 'Total Dissolved Solids',
    labelBn: 'মোট দ্রবীভূত কঠিন পদার্থ',
    unit: 'mg/L',
    description: 'Combined content of all minerals in water.',
    idealRange: '< 500',
  },
  calcium: {
    label: 'Calcium (Ca²⁺)',
    labelBn: 'ক্যালসিয়াম',
    unit: 'mg/L',
    description: 'Essential for bone health and muscle function.',
    idealRange: '40 - 200',
  },
  magnesium: {
    label: 'Magnesium (Mg²⁺)',
    labelBn: 'ম্যাগনেসিয়াম',
    unit: 'mg/L',
    description: 'Important for energy production and nerve function.',
    idealRange: '10 - 50',
  },
  sodium: {
    label: 'Sodium (Na⁺)',
    labelBn: 'সোডিয়াম',
    unit: 'mg/L',
    description: 'Regulates fluid balance. Lower is generally better.',
    idealRange: '< 200',
  },
  potassium: {
    label: 'Potassium (K⁺)',
    labelBn: 'পটাসিয়াম',
    unit: 'mg/L',
    description: 'Supports heart and muscle function.',
    idealRange: '1 - 12',
  },
  bicarbonate: {
    label: 'Bicarbonate (HCO₃⁻)',
    labelBn: 'বাইকার্বনেট',
    unit: 'mg/L',
    description: 'Natural pH buffer, aids digestion.',
    idealRange: '150 - 500',
  },
  chloride: {
    label: 'Chloride (Cl⁻)',
    labelBn: 'ক্লোরাইড',
    unit: 'mg/L',
    description: 'Maintains fluid balance.',
    idealRange: '< 250',
  },
  sulfate: {
    label: 'Sulfate (SO₄²⁻)',
    labelBn: 'সালফেট',
    unit: 'mg/L',
    description: 'Can have laxative effect at high levels.',
    idealRange: '< 250',
  },
  silica: {
    label: 'Silica (SiO₂)',
    labelBn: 'সিলিকা',
    unit: 'mg/L',
    description: 'Supports skin, hair, and nail health.',
    idealRange: '5 - 30',
  },
  fluoride: {
    label: 'Fluoride (F⁻)',
    labelBn: 'ফ্লোরাইড',
    unit: 'mg/L',
    description: 'Supports dental health in small amounts.',
    idealRange: '0.5 - 1.5',
  },
  nitrate: {
    label: 'Nitrate (NO₃⁻)',
    labelBn: 'নাইট্রেট',
    unit: 'mg/L',
    description: 'Should be low in drinking water.',
    idealRange: '< 10',
  },
};

interface MineralTableProps {
  minerals: MineralContent;
  locale?: 'en' | 'bn';
  className?: string;
}

export function MineralTable({
  minerals,
  locale = 'en',
  className = '',
}: MineralTableProps) {
  const entries = Object.entries(minerals).filter(
    ([, value]) => value !== undefined && value !== null
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative overflow-hidden rounded-2xl ${className}`}
      >
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-teal-500/10 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40" />

        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {locale === 'bn' ? 'খনিজ উপাদান' : 'Mineral Content'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {locale === 'bn'
                  ? 'প্রতি লিটারে পরিমাণ'
                  : 'Composition per liter'}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {locale === 'bn' ? 'উপাদান' : 'Mineral'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {locale === 'bn' ? 'মান' : 'Value'}
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:table-cell">
                    {locale === 'bn' ? 'আদর্শ পরিসর' : 'Ideal Range'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {entries.map(([key, value], index) => {
                  const info = mineralInfo[key];
                  if (!info) return null;

                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group transition-colors hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {locale === 'bn' ? info.labelBn : info.label}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-slate-400 transition-colors hover:text-cyan-500">
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-xs bg-slate-900 text-white"
                            >
                              <p className="text-sm">{info.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-baseline gap-1">
                          <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                            {typeof value === 'number'
                              ? value.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')
                              : value}
                          </span>
                          {info.unit && (
                            <span className="text-xs text-slate-500">
                              {info.unit}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right text-sm text-slate-500 dark:text-slate-400 sm:table-cell">
                        {info.idealRange || '—'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            {locale === 'bn'
              ? 'মান পরীক্ষাগারে নিশ্চিত করা হয়েছে'
              : 'Values certified by independent laboratory analysis'}
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl" />
      </motion.div>
    </TooltipProvider>
  );
}

export default MineralTable;
