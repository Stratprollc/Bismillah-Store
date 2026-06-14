import React from 'react';
import { LayoutDashboard, History, Users, ShoppingBag, Globe, Truck, ShieldCheck, Zap, KeySquare, StickyNote, Trash2 } from 'lucide-react';

interface SalesCrmDashboardProps {
  sales: any[];
  customers: any[];
  orders: any[];
  onNavigate: (tab: string) => void;
  shopSettings: any;
}

export default function SalesCrmDashboard({ sales, customers, orders, onNavigate, shopSettings }: SalesCrmDashboardProps) {
  const currencySymbol = shopSettings.currencySymbol || 'TK';

  const totalSalesCount = sales.length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.finalTotal || s.total || 0), 0);
  const totalCustomers = customers.length;
  const totalDueCustomers = customers.filter(c => (c.currentDue || 0) > 0).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-800" id="sales-crm-dashboard-root">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-indigo-500" />
          {shopSettings.systemLanguage === 'bn' ? 'সেলস ও কাস্টমার রিলেশনশিপ ডেসবোর্ড' : 'Sales & CRM Analytics Hub'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {shopSettings.systemLanguage === 'bn' ? 'গ্রাহকদের তথ্য, বুকিং ও কাস্টমার রিলেশনশিপ এবং ওয়ারেন্টি ট্র্যাক করুন' : 'Real-time overview of customer logs, active orders, and shop insights.'}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Total Complete Invoices</span>
          <span className="block text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{totalSalesCount}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Historic deals</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Aggregated Store Revenue</span>
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{currencySymbol} {totalSalesRevenue.toLocaleString()}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Cumulative revenue</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Registered Client Base</span>
          <span className="block text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{totalCustomers}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Distinct profiles</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Accounts with Overdue Dues</span>
          <span className={`block text-2xl font-black font-mono mt-1 ${totalDueCustomers > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>{totalDueCustomers}</span>
          <span className="block text-xs font-semibold text-amber-500 mt-2">Requires manual collection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submodules Navigator Directory */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">Submodule Navigator</h3>
          <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {[
              { id: 'sales', label: 'Sales Records', desc: 'Audit invoices history', icon: History, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
              { id: 'customers', label: 'Customers directory', desc: 'Customer journals & dues', icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
              { id: 'customer_orders', label: 'Customer Orders', desc: 'Track pending shop orders', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
              { id: 'online_shop', label: 'Online Shop info', desc: 'Custom branding settings', icon: Globe, color: 'text-sky-600 bg-sky-55 dark:bg-sky-950/20' },
              { id: 'courier', label: 'Courier Services', desc: 'Integrate courier APIs', icon: Truck, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
              { id: 'warranty', label: 'Warranty tracker', desc: 'Customer hardware claims', icon: ShieldCheck, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20' },
              { id: 'service_offer', label: 'Services Catalogue', desc: 'Review services packages', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
              { id: 'activation_code', label: 'Activation Codes', desc: 'Track product serial keys', icon: KeySquare, color: 'text-indigo-650' },
              { id: 'note', label: 'Sticky Notes', desc: 'Pop-up sticky notice boards', icon: StickyNote, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20' }
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="flex items-center gap-3 p-3.5 border border-slate-105 dark:border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/30 hover:shadow-sm transition-all text-left"
              >
                <div className={`p-2 rounded-xl shrink-0 ${tab.color}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs">{tab.label}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">{tab.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer list panel */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">Overdue Client Ledger</h3>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-sm">
            {totalDueCustomers === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed">
                🎉 Perfect client standings! No customer has outstanding dues.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-slate-855 text-[9px] uppercase font-black tracking-widest text-gray-400 pb-2">
                      <th className="py-2.5 pr-4">Client Name</th>
                      <th className="py-2.5 px-2 text-center font-bold">Phone Number</th>
                      <th className="py-2.5 px-2 text-center font-bold">Promised Pay Date</th>
                      <th className="py-2.5 pl-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {customers.filter(c => (c.currentDue || 0) > 0).slice(0, 5).map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-bold text-slate-850 dark:text-slate-100 truncate max-w-[170px]" title={c.name}>
                          {c.name}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500 font-mono" title={c.phone}>
                          {c.phone || 'N/A'}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-400 font-mono">
                          {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 pl-4 text-right font-black text-rose-600 font-mono">{currencySymbol} {(c.currentDue || 0).toLocaleString()}</td>
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
