import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ShoppingBag, Package, TrendingUp, ShieldAlert, Sparkles, HelpCircle, Activity, Lightbulb, CheckCircle } from 'lucide-react';

export default function HowToUsePage() {
  const steps = [
    {
      icon: ShoppingBag,
      title: 'Operating Point of Sale (POS)',
      color: 'from-emerald-500 to-teal-600',
      desc: 'Seamless billing system for your customers. Add products to cart, apply discount codes, calculate precise taxing, and process payments instantly.',
      bullets: [
        'Search products or scan barcodes instantly near the top of POS view.',
        'Adjust item quantities or modify unit prices directly inside active cart rows.',
        'Link registered customer accounts to automatically log credit/due invoices.',
        'Download fully styled thermal-ready invoice layouts in 58mm or 80mm sizes.'
      ]
    },
    {
      icon: Package,
      title: 'Managing Inventory & Warehouse',
      color: 'from-amber-500 to-orange-600',
      desc: 'Accurate real-time stock balances across custom warehouse areas. Keep close tabs on supplier directories, damage reports, and barcode registries.',
      bullets: [
        'Add products with custom SKUs, purchase prices, low-stock thresholds.',
        'Designate physical warehouse spaces to keep stock pools clearly isolated.',
        'Record damaged or expired inventory to immediately adjust main product sheets.',
        'Generate and download custom standard layout Barcodes for any registered stock item.'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Intelligent Sales & CRM insights',
      color: 'from-indigo-500 to-indigo-700',
      desc: 'Leverage customer relationships and sales trends. Send modern automatic reminders, schedule warrantied products, and manage courier dispatches.',
      bullets: [
        'Review comprehensive transaction sheets detailing payment methods and daily incomes.',
        'Compose and broadcast direct reminders regarding outstanding dues.',
        'Validate security signatures, warranty certificates, and hardware claims dates.',
        'Verify courier shipping details and coordinate digital storefront orders.'
      ]
    },
    {
      icon: Sparkles,
      title: 'Subscription & Management Suite',
      color: 'from-purple-500 to-pink-600',
      desc: 'Ultimate tools for business owners. Delegate granular staff credentials, consult advanced Jarvis AI assistants, or upgrade to access absolute premium power.',
      bullets: [
        'Define clear permissions for managers, sales partners, and warehouse keepers.',
        'Integrate floating live TV portals inside standard picture-in-picture frames.',
        'Unlock smart predictive AI insights built on official server-side Google GenAI SDKs.',
        'Redeem coupons on the Membership page to activate long-term premium features.'
      ]
    }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950/20 p-4 lg:p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm" id="how-to-use-guide-page">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 to-purple-950 rounded-2xl p-8 mb-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(165,180,252,0.15),transparent)]"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-black tracking-widest uppercase mb-3">
            <Activity className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
            Software Deployment Suite
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none">System User Guide</h1>
              <p className="text-indigo-200 text-xs mt-2 font-semibold">Master your store operations with these visual, step-by-step instructions.</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/25 flex items-center justify-center gap-2 relative group cursor-help transition-all hover:bg-white/20">
              <span className="text-xs font-black tracking-wider uppercase">Engine Version</span>
              <span className="text-sm font-black font-mono px-2 py-0.5 bg-indigo-500 rounded text-white shadow">v4.2.5</span>
              {/* Tooltip on Hover */}
              <div className="absolute top-full mt-2 right-0 bg-slate-800 text-white text-[10px] font-bold p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 leading-relaxed border border-indigo-500/20">
                🚀 Stable Release v4.2.5<br />
                📅 Released: June 2026<br />
                🛠️ Features: Core modules + Dynamic Locks
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-850 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 bg-gradient-to-tr ${step.color} text-white rounded-xl shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white">{step.title}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mb-4">{step.desc}</p>
                
                <div className="space-y-2 border-t border-slate-50 dark:border-slate-850 pt-4">
                  {step.bullets.map((bull, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{bull}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Frequently Asked Qs */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900/60 dark:to-slate-950/40 border border-indigo-100/50 dark:border-slate-800 p-6 rounded-2xl">
        <h3 className="text-sm font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 animate-pulse text-amber-500" />
          Pro-Tips & Tricks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
          <div>
            <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">Q: How do we track dues from customers?</p>
            <p>A: When checking out in POS, choose a registered customer and click Checkout. Fill "Paid Amount" less than the final total. The difference is automatically categorized as Customer Due/Receivable!</p>
          </div>
          <div>
            <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">Q: How does the automatic 7-day trial function?</p>
            <p>A: When a shop signs up, they receive complete, unblocked access to AI assistant, accounting, payment configurations, and bio profiles for the first 7 days. After that, they seamlessly switch to the Normal Package unless activated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
