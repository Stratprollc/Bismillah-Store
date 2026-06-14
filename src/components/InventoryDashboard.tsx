import React from 'react';
import { LayoutDashboard, Package, Warehouse, Users, Barcode, Trash2, ShieldAlert } from 'lucide-react';

interface InventoryDashboardProps {
  products: any[];
  suppliers: any[];
  categories: any[];
  onNavigate: (tab: string) => void;
  shopSettings: any;
}

export default function InventoryDashboard({ products, suppliers, categories, onNavigate, shopSettings }: InventoryDashboardProps) {
  const currencySymbol = shopSettings.currencySymbol || 'TK';

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.purchasePrice || 0)), 0);
  
  // Low stock products list
  const lowStockThreshold = 5;
  const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.lowStockThreshold || lowStockThreshold));
  const lowStockCount = lowStockProducts.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-800" id="inventory-dashboard-root">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-indigo-500" />
          {shopSettings.systemLanguage === 'bn' ? 'ইনভেন্টরি ডেসবোর্ড' : 'Inventory Analytics Dashboard'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {shopSettings.systemLanguage === 'bn' ? 'আপনার সামগ্রিক স্টক, মাল্টি-ওয়্যারহাউস বণ্টন এবং পণ্যের মান বিশ্লেষণ' : 'Real-time overview of catalogs, stocks, low inventory items, and suppliers.'}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Total Registered Catalog</span>
          <span className="block text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{totalProducts}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Active SKUs</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Total Physical Stocks</span>
          <span className="block text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{totalStock}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Units in Stores</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Active Stock Investment</span>
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{currencySymbol} {totalValue.toLocaleString()}</span>
          <span className="block text-xs font-semibold text-gray-400 mt-2">Assets value</span>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5">
          <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Critical Stock Warning</span>
          <span className={`block text-2xl font-black font-mono mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>{lowStockCount}</span>
          <span className="block text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Below alert limit
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Links / Submodules navigation directory */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">Submodule Navigator</h3>
          <div className="grid grid-cols-1 gap-3.5">
            {[
              { id: 'inventory', label: 'Inventory list', desc: 'Add & manage items sheets', icon: Package, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
              { id: 'warehouse', label: 'Warehouse Areas', desc: 'Location isolation filters', icon: Warehouse, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
              { id: 'supplier', label: 'Suppliers Directory', desc: 'Manage vendor databases', icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
              { id: 'barcode', label: 'Barcode Registry', desc: 'Print custom labels', icon: Barcode, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' },
              { id: 'damage_expire', label: 'Damaged & Expired', desc: 'Disposal sheets & loss logging', icon: Trash2, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' }
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="flex items-center gap-4 p-4 border border-slate-105 dark:border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/30 hover:shadow-sm transition-all"
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

        {/* Low stocks list alert table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">Low Stock Warnings</h3>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-sm">
            {lowStockProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed">
                🎉 Excellent work. All registered items are fully stocked or above thresholds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-slate-855 text-[9px] uppercase font-black tracking-widest text-gray-400 pb-2">
                      <th className="py-2.5 pr-4">Merchandise</th>
                      <th className="py-2.5 px-2 text-center">Warehouse</th>
                      <th className="py-2.5 px-2 text-center">Min. Alert</th>
                      <th className="py-2.5 pl-4 text-right">In Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {lowStockProducts.slice(0, 5).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-bold text-slate-850 dark:text-slate-200 truncate max-w-[170px]" title={p.name}>
                          {p.name}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500 font-semibold truncate max-w-[110px]" title={p.warehouse || 'Main Shop'}>
                          {p.warehouse || 'Main Shop'}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-gray-400">{p.lowStockThreshold || 5}</td>
                        <td className="py-3 pl-4 text-right font-black text-rose-600 font-mono">{p.stock} Units</td>
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
