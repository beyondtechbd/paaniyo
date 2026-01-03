// components/tracker/TrackerClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Droplets,
  Plus,
  Minus,
  Settings,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  Flame,
  ChevronLeft,
  Coffee,
  Wine,
  Sparkles,
  X,
  Check,
  Bell,
  BellOff,
  Undo2,
} from 'lucide-react';

interface TrackerData {
  settings: {
    dailyGoal: number;
    glassSize: number;
    reminderEnabled: boolean;
    reminderTimes: string[];
  };
  today: {
    intake: number;
    goal: number;
    percentage: number;
    entries: Array<{ time: string; ml: number; type: string }>;
    goalMet: boolean;
  };
  streak: number;
  weekData: Array<{
    date: string;
    dayName: string;
    intake: number;
    goal: number;
    percentage: number;
  }>;
}

interface TrackerClientProps {
  initialData: TrackerData;
}

const drinkTypes = [
  { id: 'water', label: 'Water', icon: Droplets, color: 'text-sky-500' },
  { id: 'tea', label: 'Tea', icon: Coffee, color: 'text-amber-500' },
  { id: 'juice', label: 'Juice', icon: Wine, color: 'text-orange-500' },
  { id: 'other', label: 'Other', icon: Sparkles, color: 'text-purple-500' },
];

export function TrackerClient({ initialData }: TrackerClientProps) {
  const [data, setData] = useState(initialData);
  const [isLogging, setIsLogging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedType, setSelectedType] = useState('water');
  const [celebrateGoal, setCelebrateGoal] = useState(false);
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    dailyGoal: data.settings.dailyGoal,
    glassSize: data.settings.glassSize,
    reminderEnabled: data.settings.reminderEnabled,
  });

  // Quick add amounts
  const quickAmounts = [
    { label: 'Small', ml: 150 },
    { label: 'Glass', ml: data.settings.glassSize },
    { label: 'Bottle', ml: 500 },
    { label: 'Large', ml: 750 },
  ];

  // Celebrate when goal is reached
  useEffect(() => {
    if (data.today.percentage >= 100 && !celebrateGoal) {
      setCelebrateGoal(true);
      toast.success('🎉 Daily goal reached! Great job staying hydrated!', {
        duration: 5000,
      });
    }
  }, [data.today.percentage, celebrateGoal]);

  const logIntake = async (amount: number, type: string = 'water') => {
    if (isLogging) return;
    setIsLogging(true);

    try {
      const response = await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to log intake');
      }

      const result = await response.json();
      
      setData(prev => ({
        ...prev,
        today: result.today,
        // Update today in weekData
        weekData: prev.weekData.map((day, i) => 
          i === prev.weekData.length - 1
            ? { ...day, intake: result.today.intake, percentage: result.today.percentage }
            : day
        ),
      }));

      toast.success(`Added ${amount}ml of ${type}`, {
        icon: <Droplets className="w-4 h-4 text-sky-500" />,
      });
    } catch (error) {
      toast.error('Failed to log intake');
    } finally {
      setIsLogging(false);
      setShowCustomAmount(false);
      setCustomAmount('');
    }
  };

  const undoLastEntry = async () => {
    if (data.today.entries.length === 0) return;

    try {
      const response = await fetch('/api/tracker', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to undo');
      }

      const result = await response.json();
      
      setData(prev => ({
        ...prev,
        today: result.today,
        weekData: prev.weekData.map((day, i) => 
          i === prev.weekData.length - 1
            ? { ...day, intake: result.today.intake, percentage: result.today.percentage }
            : day
        ),
      }));

      toast.success(`Removed ${result.removedAmount}ml`);
    } catch (error) {
      toast.error('Failed to undo entry');
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/tracker/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyGoal: settingsForm.dailyGoal,
          glassSize: settingsForm.glassSize,
          reminderEnabled: settingsForm.reminderEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      
      setData(prev => ({
        ...prev,
        settings: result.settings,
        today: {
          ...prev.today,
          goal: result.settings.dailyGoal,
          percentage: Math.round((prev.today.intake / result.settings.dailyGoal) * 100),
        },
      }));

      toast.success('Settings saved');
      setShowSettings(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  // Progress ring calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(data.today.percentage, 100) / 100) * circumference;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Water Tracker
            </h1>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Progress Ring */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex flex-col items-center justify-center mb-8"
      >
        <div className="relative">
          {/* Background ring */}
          <svg width="280" height="280" className="transform -rotate-90">
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Progress ring */}
            <motion.circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="url(#waterGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={data.today.intake}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-display font-bold text-slate-900 dark:text-white">
                  {Math.round(data.today.intake / 10) * 10}
                </span>
                <span className="text-xl text-slate-500">ml</span>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                of {data.settings.dailyGoal}ml goal
              </div>
              <div className="mt-2">
                <span className={`text-lg font-semibold ${
                  data.today.percentage >= 100 
                    ? 'text-emerald-500' 
                    : data.today.percentage >= 50 
                      ? 'text-sky-500'
                      : 'text-amber-500'
                }`}>
                  {data.today.percentage}%
                </span>
              </div>
            </motion.div>
          </div>
          
          {/* Droplet decoration */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-2 left-1/2 -translate-x-1/2"
          >
            <Droplets className="w-8 h-8 text-sky-400" />
          </motion.div>
        </div>
        
        {/* Goal reached celebration */}
        <AnimatePresence>
          {data.today.goalMet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full"
            >
              <Trophy className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Daily goal achieved! 🎉
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm"
        >
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
            <Flame className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm"
        >
          <div className="flex items-center justify-center gap-1 text-sky-500 mb-1">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.settings.dailyGoal / 1000}L</div>
          <div className="text-xs text-slate-500">Daily Goal</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm"
        >
          <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.today.entries.length}</div>
          <div className="text-xs text-slate-500">Entries Today</div>
        </motion.div>
      </div>

      {/* Quick Add Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Quick Add</h3>
          {data.today.entries.length > 0 && (
            <button
              onClick={undoLastEntry}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
          )}
        </div>
        
        {/* Drink type selector */}
        <div className="flex gap-2 mb-4">
          {drinkTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                selectedType === type.id
                  ? 'bg-sky-100 dark:bg-sky-900/30 ring-2 ring-sky-400'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <type.icon className={`w-5 h-5 ${type.color}`} />
              <span className="text-xs">{type.label}</span>
            </button>
          ))}
        </div>
        
        {/* Amount buttons */}
        <div className="grid grid-cols-4 gap-3">
          {quickAmounts.map((amount) => (
            <button
              key={amount.label}
              onClick={() => logIntake(amount.ml, selectedType)}
              disabled={isLogging}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white hover:from-sky-500 hover:to-cyan-600 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">{amount.ml}ml</span>
              <span className="text-xs opacity-80">{amount.label}</span>
            </button>
          ))}
        </div>
        
        {/* Custom amount */}
        <div className="mt-4">
          {showCustomAmount ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter ml"
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-400 outline-none"
                autoFocus
              />
              <button
                onClick={() => customAmount && logIntake(parseInt(customAmount), selectedType)}
                disabled={!customAmount || isLogging}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowCustomAmount(false);
                  setCustomAmount('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomAmount(true)}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              + Add custom amount
            </button>
          )}
        </div>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm mb-6"
      >
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">This Week</h3>
        
        <div className="flex items-end justify-between gap-2 h-32">
          {data.weekData.map((day, index) => {
            const isToday = index === data.weekData.length - 1;
            const height = Math.max(8, Math.min(100, day.percentage));
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full h-24 flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className={`w-full max-w-[32px] rounded-t-lg ${
                      day.percentage >= 100
                        ? 'bg-gradient-to-t from-emerald-400 to-emerald-300'
                        : day.percentage >= 50
                          ? 'bg-gradient-to-t from-sky-400 to-sky-300'
                          : 'bg-gradient-to-t from-amber-400 to-amber-300'
                    } ${isToday ? 'ring-2 ring-sky-500 ring-offset-2' : ''}`}
                  />
                </div>
                <span className={`text-xs ${isToday ? 'font-bold text-sky-500' : 'text-slate-500'}`}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Goal line indicator */}
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
          <div className="w-4 h-0.5 bg-slate-300 dark:bg-slate-600" />
          <span>Goal: {data.settings.dailyGoal / 1000}L</span>
        </div>
      </motion.div>

      {/* Today's Entries */}
      {data.today.entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Today's Log</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.today.entries.slice().reverse().map((entry, index) => {
              const typeInfo = drinkTypes.find(t => t.id === entry.type) || drinkTypes[0];
              
              return (
                <motion.div
                  key={`${entry.time}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm`}>
                      <typeInfo.icon className={`w-4 h-4 ${typeInfo.color}`} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{entry.ml}ml</div>
                      <div className="text-xs text-slate-500 capitalize">{entry.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    {entry.time}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Tracker Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Daily Goal */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Daily Goal
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSettingsForm(prev => ({ ...prev, dailyGoal: Math.max(500, prev.dailyGoal - 250) }))}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {settingsForm.dailyGoal / 1000}
                      </span>
                      <span className="text-lg text-slate-500 ml-1">L</span>
                    </div>
                    <button
                      onClick={() => setSettingsForm(prev => ({ ...prev, dailyGoal: Math.min(10000, prev.dailyGoal + 250) }))}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-2">
                    Recommended: 2.5-3L for Bangladesh climate
                  </p>
                </div>
                
                {/* Glass Size */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Default Glass Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[150, 200, 250, 300].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSettingsForm(prev => ({ ...prev, glassSize: size }))}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                          settingsForm.glassSize === size
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {size}ml
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Reminders */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Reminders
                    </label>
                    <button
                      onClick={() => setSettingsForm(prev => ({ ...prev, reminderEnabled: !prev.reminderEnabled }))}
                      className={`p-2 rounded-xl transition-colors ${
                        settingsForm.reminderEnabled
                          ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-500'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {settingsForm.reminderEnabled ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <BellOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {settingsForm.reminderEnabled 
                      ? 'Get reminded at 8am, 12pm, 4pm, 8pm'
                      : 'Reminders are disabled'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
