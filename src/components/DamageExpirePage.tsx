import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc, updateDoc, increment } from '../firebase';
import { Trash2, AlertTriangle, ShieldCheck, Plus, Calendar, Coins, Package, FileText, ClipboardList, RefreshCw } from 'lucide-react';

interface DamageExpirePageProps {
  products: any[];
  user: any;
  shopSettings: any;
  setNotification: (n: { message: string, type: 'success' | 'error' | 'info' }) => void;
}

export default function DamageExpirePage({ products, user, shopSettings, setNotification }: DamageExpirePageProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<'damage' | 'expired'>('damage');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load records
  useEffect(() => {
    const shopId = user?.shopId;
    if (!shopId) return;

    const q = query(
      collection(db, 'damage_records'),
      where('shopId', '==', shopId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      // Sort by recordedAt desc
      fetched.sort((a: any, b: any) => {
        const tA = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
        const tB = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
        return tB - tA;
      });
      setRecords(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Error reading damage records:", err);
      setLoading(false);
    });

    return unsub;
  }, [user?.shopId]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setNotification({ message: 'Please select a product first.', type: 'error' });
      return;
    }
    if (quantity <= 0) {
      setNotification({ message: 'Quantity must be greater than zero.', type: 'error' });
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      setNotification({ message: 'Selected product not found.', type: 'error' });
      return;
    }

    if (prod.stock < quantity) {
      setNotification({ message: `Insufficient stock. Selected product only has ${prod.stock} units.`, type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const shopId = user?.shopId;

      // 1. Create damage record
      await addDoc(collection(db, 'damage_records'), {
        shopId,
        productId: selectedProductId,
        productName: prod.name,
        sku: prod.sku || 'N/A',
        purchasePrice: prod.purchasePrice || 0,
        sellingPrice: prod.sellingPrice || 0,
        quantity,
        type,
        remarks,
        recordedAt: new Date().toISOString(),
        recordedBy: user?.displayName || user?.username || 'Staff',
      });

      // 2. Reduce the product stock
      const productRef = doc(db, 'products', selectedProductId);
      await updateDoc(productRef, {
        stock: increment(-quantity)
      });

      setNotification({
        message: `Successfully logged ${quantity} units of ${prod.name} as ${type}.`,
        type: 'success'
      });

      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setRemarks('');
    } catch (err: any) {
      console.error(err);
      setNotification({ message: 'Failed to record damage / expiry.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (record: any) => {
    if (!window.confirm("Are you sure you want to delete this log? Note: This will NOT restore product stock automaticly.")) return;
    try {
      await deleteDoc(doc(db, 'damage_records', record.id));
      setNotification({ message: 'Log deleted successfully.', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to delete record.', type: 'error' });
    }
  };

  const currencySymbol = shopSettings.currencySymbol || 'TK';

  // Math totals
  const totalQuantity = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalLossValue = records.reduce((sum, r) => sum + ((r.purchasePrice || 0) * (r.quantity || 0)), 0);
  const totalCountType = (typeFilter: 'damage' | 'expired') => records.filter(r => r.type === typeFilter).reduce((sum, r) => sum + (r.quantity || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-800" id="damage-expire-main-section">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-2xl text-rose-600">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {shopSettings.systemLanguage === 'bn' ? 'ক্ষতিগ্রস্ত ও মেয়াদোত্তীর্ণ পণ্য' : 'Damage & Expired Ledger'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {shopSettings.systemLanguage === 'bn' ? 'ক্ষতিগ্রস্ত, ত্রুটিপূর্ণ বা মেয়াদ ফুরিয়ে যাওয়া পণ্যের তালিকা এবং স্টক অ্যাডজাস্টমেন্ট' : 'Log damaged, lost, or expired merchandise. Writes off corresponding stock in real-time.'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-950/40 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-950 text-red-650 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Written-off Items</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono">{totalQuantity}</p>
          </div>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-950/40 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Estimated Purchase Loss</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
              {currencySymbol} {totalLossValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-950/40 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-650 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Damaged Logs</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{totalCountType('damage')} Units</p>
          </div>
        </div>
        <div className="border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-950/40 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Expired Logs</p>
            <p className="text-lg font-black text-purple-650 font-mono">{totalCountType('expired')} Units</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form panel */}
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-105 dark:border-slate-850 p-6 rounded-2xl">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-500" />
            Add New Disposal Log
          </h3>

          <form onSubmit={handleAddRecord} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Product</label>
              <select
                required
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-rose-500"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- Choose merchandise --</option>
                {products.filter(p => p.stock > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock} | SKU: {p.sku || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disposal Type</label>
                <select
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-rose-500"
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                >
                  <option value="damage">Physical Damage</option>
                  <option value="expired">Expired Date</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disposal Qty</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 font-mono"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks / Reason</label>
              <textarea
                placeholder="Brief details of how it was damaged or when it expired..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-rose-500"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all uppercase tracking-wide disabled:opacity-50"
            >
              {isSubmitting ? 'Recording Adjustment...' : 'Record Stock Write-off'}
            </button>
          </form>
        </div>

        {/* History table panel */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            Disposal Logs Audit History
          </h3>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                <span>Syncing damage logs...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                No damage or expired write-offs logged yet for this shop.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-[9px] uppercase font-black tracking-widest text-gray-400 bg-gray-50/50 dark:bg-slate-950/40">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Merchandise</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Cost Loss</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-850">
                    {records.map((rec) => {
                      const costLoss = (rec.purchasePrice || 0) * (rec.quantity || 0);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                          <td className="py-3 px-4 text-gray-500 font-mono">
                            {rec.recordedAt ? new Date(rec.recordedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="block font-bold text-gray-900 dark:text-white truncate max-w-[180px]" title={rec.productName}>
                              {rec.productName}
                            </span>
                            {rec.sku && (
                              <span className="block text-[10px] text-gray-405 font-mono">SKU: {rec.sku}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              rec.type === 'damage' 
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30' 
                                : 'bg-purple-50 text-purple-650'
                            }`}>
                              {rec.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono">{rec.quantity}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-550 font-mono">
                            {currencySymbol} {costLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteRecord(rec)}
                              className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-colors"
                              title="Delete disposal record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
