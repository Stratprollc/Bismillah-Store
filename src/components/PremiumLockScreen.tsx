import React from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

interface PremiumLockScreenProps {
  title: string;
  description: string;
  onNavigateToMembership: () => void;
}

export default function PremiumLockScreen({ title, description, onNavigateToMembership }: PremiumLockScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl mt-4 relative overflow-hidden group">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"></div>
      
      {/* Padlock Icon */}
      <div className="w-20 h-20 mb-6 bg-gradient-to-b from-amber-50 to-orange-100 dark:from-slate-800 dark:to-slate-950/70 rounded-2xl flex items-center justify-center shadow-md relative">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <Lock className="w-9 h-9 text-amber-500 stroke-[2.2]" />
        </motion.div>
        
        {/* Sparkle badge */}
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-indigo-650 rounded-full flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        </div>
      </div>

      <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight mb-2 flex items-center gap-2">
        Premium feature: {title}
      </h2>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center text-xs leading-relaxed font-semibold mb-6">
        {description}
      </p>

      {/* Grid of Perks */}
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2.5 mb-8 text-left">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Part of ShopMaster Pro Upgrade Suite</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
          Unlock the entire ecosystem (Jarvis AI, Accounting Ledger, Daily shifted reports, Live TV streams, Warranty claims tracking, custom Digital bio profiles, custom popup notice boards) with a single premium plan.
        </p>
      </div>

      {/* Action CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNavigateToMembership}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 uppercase tracking-wide cursor-pointer"
      >
        <span>Upgrade to Premium Package</span>
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
