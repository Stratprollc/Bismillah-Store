import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Save, Smartphone } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PaymentMethodManager({ shopSettings, user, onRefreshSettings }: any) {
  const [bKashType, setBkashType] = useState(shopSettings?.paymentConfig?.bKashType || 'none');
  const [bKashNumber, setBkashNumber] = useState(shopSettings?.paymentConfig?.bKashNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.shopId) return;
    setIsSaving(true);
    try {
      const config = {
        paymentConfig: {
          bKashType,
          bKashNumber,
          isEnabled: bKashType !== 'none',
        }
      };
      await updateDoc(doc(db, 'shops', user.shopId), config);
      if (onRefreshSettings) onRefreshSettings({ ...shopSettings, ...config });
      alert('Payment Methods Updated Successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving payment methods');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden text-left">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">bKash Integration</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure your receiving account</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Account Type</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['none', 'personal', 'merchant', 'agent'].map(type => (
                <button
                  key={type}
                  onClick={() => setBkashType(type)}
                  className={`p-4 rounded-xl border text-left transition-all ${bKashType === type ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500/20' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <p className="font-bold text-sm uppercase text-slate-700">
                    {type === 'none' ? 'Disabled' : `bKash ${type}`}
                  </p>
                  {type === 'personal' && <p className="text-[10px] text-slate-500 mt-1">Send Money (Auto +1.8%)</p>}
                  {type === 'merchant' && <p className="text-[10px] text-slate-500 mt-1">Payment (Auto +1.8%)</p>}
                  {type === 'agent' && <p className="text-[10px] text-slate-500 mt-1">Cash Out (No Charge)</p>}
                </button>
              ))}
            </div>
          </div>

          {bKashType !== 'none' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">bKash Receiving Number</label>
              <input
                type="text"
                placeholder="e.g. 01700000000"
                value={bKashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:shadow-lg hover:shadow-pink-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
