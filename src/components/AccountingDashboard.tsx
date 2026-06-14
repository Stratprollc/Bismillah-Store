import React from 'react';
import { LayoutDashboard, Calculator, Clock, TrendingUp, TrendingDown, Landmark, Sparkles } from 'lucide-react';

interface AccountingDashboardProps {
  sales: any[];
  expenses: any[];
  investments: any[];
  staffSalaries: any[];
  onNavigate: (tab: string) => void;
  shopSettings: any;
}

export default function AccountingDashboard({ sales, expenses, investments, staffSalaries, onNavigate, shopSettings }: AccountingDashboardProps) {
  const currencySymbol = shopSettings.currencySymbol || 'TK';

  // Math
  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.finalTotal || s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalSalaries = staffSalaries.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (i.amount || 0), 0);

  const netBalance = (totalSalesRevenue + totalInvestments) - (totalExpenses + totalSalaries);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-800" id="accounting-dashboard-root">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-indigo-500" />
          {shopSettings.systemLanguage === 'bn' ? 'অ্যাকাউন্টিং ডেসবোর্ড' : 'Accounting & Ledger Dashboard'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {shopSettings.systemLanguage === 'bn' ? 'ব্যবসায়িক ক্যাশ-ফ্লো, খরচ, বিনিয়োগ এবং নগদ স্থিতি বিশ্লেষণ' : 'Real-time overview of expenses, investments, employee payrolls, and cash balances.'}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Total Cash Incomes</span>
          <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">+{currencySymbol} {totalSalesRevenue.toLocaleString()}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Product billings</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Total Capital Investments</span>
          <span className="block text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">+{currencySymbol} {totalInvestments.toLocaleString()}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Owner injections</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Total Expenses & Salaries</span>
          <span className="block text-xl font-black text-rose-550 font-mono mt-1">-{currencySymbol} {(totalExpenses + totalSalaries).toLocaleString()}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Combined expenditures</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Net Operational Balance</span>
          <span className={`block text-xl font-black font-mono mt-1 ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>{currencySymbol} {netBalance.toLocaleString()}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Current treasury balance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick links to accounting details */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">Submodule Navigator</h3>
          <div className="grid grid-cols-1 gap-3.5">
            {[
              { id: 'accounting', label: 'Hishab Nikash ledger', desc: 'Add capital investments & wages', icon: Calculator, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
              { id: 'daily_closing', label: 'Daily closing shift audits', desc: 'Log shifts closure ledgers', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="flex items-center gap-4 p-4 border border-slate-105 dark:border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/30 hover:shadow-sm transition-all text-left"
              >
                <div className={`p-3 rounded-xl ${tab.color}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{tab.label}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">{tab.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent expense items */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">Recent Expense Audits</h3>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-sm">
            {expenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed">
                🎉 No operational expenses added yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-slate-855 text-[9px] uppercase font-black tracking-widest text-gray-400 pb-2">
                      <th className="py-2.5 pr-4">Description</th>
                      <th className="py-2.5 px-2 text-center">Category</th>
                      <th className="py-2.5 px-2 text-center">Timestamp</th>
                      <th className="py-2.5 pl-4 text-right">Amount Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {expenses.slice(0, 5).map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-bold text-slate-855 dark:text-slate-100 truncate max-w-[170px]" title={e.description}>
                          {e.description}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 text-gray-500 rounded-full text-[10px]">
                            {e.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-400 font-mono">
                          {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 pl-4 text-right font-black text-rose-550 font-mono">{currencySymbol} {(e.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
