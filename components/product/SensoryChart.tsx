// components/product/SensoryChart.tsx
// Sensory Profile Radar Chart with Premium Animation

'use client';

import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Sparkles } from 'lucide-react';

interface SensoryProfile {
  roundness?: number;
  neutrality?: number;
  hardness?: number;
  sweetness?: number;
  minerality?: number;
  smoothness?: number;
  freshness?: number;
  effervescence?: number;
  crispness?: number;
}

interface SensoryInfo {
  label: string;
  labelBn: string;
  description: string;
}

const sensoryInfo: Record<string, SensoryInfo> = {
  roundness: {
    label: 'Roundness',
    labelBn: 'মসৃণতা',
    description: 'Smooth, soft mouthfeel',
  },
  neutrality: {
    label: 'Neutrality',
    labelBn: 'নিরপেক্ষতা',
    description: 'Clean, pure taste without aftertaste',
  },
  hardness: {
    label: 'Hardness',
    labelBn: 'কঠোরতা',
    description: 'Mineral intensity perception',
  },
  sweetness: {
    label: 'Sweetness',
    labelBn: 'মিষ্টতা',
    description: 'Natural sweet undertone',
  },
  minerality: {
    label: 'Minerality',
    labelBn: 'খনিজ গুণ',
    description: 'Detectable mineral presence',
  },
  smoothness: {
    label: 'Smoothness',
    labelBn: 'কোমলতা',
    description: 'Silky texture on palate',
  },
  freshness: {
    label: 'Freshness',
    labelBn: 'সতেজতা',
    description: 'Crisp, invigorating quality',
  },
  effervescence: {
    label: 'Effervescence',
    labelBn: 'বুদবুদ',
    description: 'Bubble intensity (sparkling)',
  },
  crispness: {
    label: 'Crispness',
    labelBn: 'খসখসে',
    description: 'Sharp, clean finish',
  },
};

interface SensoryChartProps {
  sensory: SensoryProfile;
  locale?: 'en' | 'bn';
  className?: string;
}

export function SensoryChart({
  sensory,
  locale = 'en',
  className = '',
}: SensoryChartProps) {
  // Transform data for Recharts
  const chartData = Object.entries(sensory)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({
      attribute: locale === 'bn' ? sensoryInfo[key]?.labelBn : sensoryInfo[key]?.label,
      value: value as number,
      fullMark: 10,
      key,
    }));

  if (chartData.length < 3) {
    return null; // Need at least 3 data points for radar chart
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { attribute: string; value: number; key: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const info = sensoryInfo[data.key];

      return (
        <div className="rounded-lg bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-white">{data.attribute}</p>
          <p className="text-2xl font-bold text-cyan-400">{data.value}/10</p>
          {info && (
            <p className="mt-1 max-w-[200px] text-xs text-slate-300">
              {info.description}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40" />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {locale === 'bn' ? 'স্বাদ বর্ণালী' : 'Sensory Spectrum'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {locale === 'bn'
                ? 'পেশাদার স্বাদ মূল্যায়ন'
                : 'Professional taste evaluation'}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <defs>
                <linearGradient id="sensoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.6} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <PolarGrid
                stroke="#94A3B8"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />

              <PolarAngleAxis
                dataKey="attribute"
                tick={{
                  fill: '#64748B',
                  fontSize: 11,
                  fontWeight: 500,
                }}
                tickLine={false}
              />

              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickCount={6}
                axisLine={false}
              />

              <Radar
                name="Sensory"
                dataKey="value"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#sensoryGradient)"
                fillOpacity={0.5}
                filter="url(#glow)"
                animationBegin={200}
                animationDuration={1000}
                animationEasing="ease-out"
              />

              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {chartData.slice(0, 4).map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1 dark:bg-slate-800/80"
            >
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {item.attribute}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-400/20 blur-3xl" />
    </motion.div>
  );
}

export default SensoryChart;
