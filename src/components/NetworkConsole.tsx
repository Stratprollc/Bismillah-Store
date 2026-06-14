import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Search,
  ExternalLink,
  Store,
  Calendar,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Box,
  Trash2,
  Key
} from 'lucide-react';
import { db, collection, getDocs, onSnapshot, query, orderBy, deleteDoc, updateDoc, doc, setDoc, handleFirestoreError, OperationType, deleteShopAllData } from '../firebase';

interface Merchant {
  id: string;
  shopName: string;
  ownerEmail: string;
  createdAt: any;
  lastActive: any;
  plan: string;
  shopCode?: string;
  address?: string;
  phone?: string;
  type?: string;
  status?: 'active' | 'blocked';
}

export const NetworkConsole: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [expandedMerchantId, setExpandedMerchantId] = useState<string | null>(null);
  const [confirmingBlock, setConfirmingBlock] = useState<Merchant | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Merchant | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoKeys, setPromoKeys] = useState<any[]>([]);
  const [newPromoPlan, setNewPromoPlan] = useState('6 Months Premium');
  const [manualPlanSelect, setManualPlanSelect] = useState('6 Months Premium');

  useEffect(() => {
    // In a real multi-tenant app, this would query a global 'merchants' collection
    // For this app, we'll try to find any 'settings' documents as they represent shops
    const unsub = onSnapshot(collection(db, "shops"), (snapshot) => {
      const list: Merchant[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        list.push({
          id: doc.id,
          shopName: data.name || data.shopName || 'Unnamed Shop',
          ownerEmail: data.ownerEmail || data.email || 'N/A',
          createdAt: data.createdAt || new Date().toISOString(),
          lastActive: data.updatedAt || new Date().toISOString(),
          plan: 'Premium',
          shopCode: data.shopCode ? data.shopCode.toString().replace(/^SHP-/i, '').replace(/[^0-9]/g, '').slice(0, 6) : undefined,
          address: data.address,
          phone: data.phone,
          type: data.type,
          status: data.status || 'active'
        });
      });
      setMerchants(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'shops');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredMerchants = merchants.filter(m => {
    if (m.id === 'master' || m.ownerEmail?.toLowerCase().trim() === 'stratproamz@gmail.com') return false;
    return m.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.shopCode?.includes(searchTerm);
  });

  useEffect(() => {
    const unsubKeys = onSnapshot(collection(db, "promo_keys"), (snapshot) => {
      const keys: any[] = [];
      snapshot.forEach(doc => {
        keys.push({ id: doc.id, ...doc.data() });
      });
      setPromoKeys(keys.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.warn("Failed to load promo keys", error);
    });

    return () => unsubKeys();
  }, []);

  const executeDeleteMerchant = async (merchant: Merchant) => {
    try {
      await deleteShopAllData(merchant.id);
      setSelectedMerchant(null);
      setConfirmingDelete(null);
      setStatusNotification({
        type: 'success',
        text: 'Merchant and all associated store data have been successfully deleted from the database.'
      });
    } catch (error) {
      const errMsg = handleFirestoreError(error, OperationType.DELETE, 'shops');
      setStatusNotification({
        type: 'error',
        text: typeof errMsg === 'string' ? errMsg : 'Failed to delete merchant. Please verify your admin credentials.'
      });
    }
  };

  const executeToggleBlockMerchant = async (merchant: Merchant) => {
    const isBlocked = merchant.status === 'blocked';
    try {
      await updateDoc(doc(db, "shops", merchant.id), {
        status: isBlocked ? 'active' : 'blocked'
      });
      setSelectedMerchant(prev => prev && prev.id === merchant.id ? { ...prev, status: isBlocked ? 'active' : 'blocked' } : prev);
      setConfirmingBlock(null);
      setStatusNotification({
        type: 'success',
        text: `Merchant successfully ${isBlocked ? 'unblocked' : 'blocked'}.`
      });
    } catch (error) {
      const errMsg = handleFirestoreError(error, OperationType.UPDATE, 'shops');
      setStatusNotification({
        type: 'error',
        text: typeof errMsg === 'string' ? errMsg : 'Failed to update merchant status.'
      });
    }
  };

  const getDurationMonths = (planName: string) => {
    if (planName === '6 Months Premium') return 6;
    if (planName === '1 Year Premium') return 12;
    if (planName === '2 Years Premium') return 24;
    if (planName === '5 Years Premium') return 60;
    return -1; // Lifetime
  };

  const executeGrantManualPremium = async (merchant: Merchant) => {
    try {
      const durationMonths = getDurationMonths(manualPlanSelect);
      const isLifetime = durationMonths === -1;
      let untilDateStr = null;

      if (!isLifetime) {
        const d = new Date();
        d.setMonth(d.getMonth() + durationMonths);
        untilDateStr = d.toISOString();
      }

      await updateDoc(doc(db, "shops", merchant.id), {
        premiumActive: isLifetime,
        premiumUntil: untilDateStr,
        plan: manualPlanSelect
      });

      setSelectedMerchant(prev => prev && prev.id === merchant.id ? { ...prev, plan: manualPlanSelect } : prev);
      
      setStatusNotification({
        type: 'success',
        text: `Successfully upgraded to ${manualPlanSelect}.`
      });
    } catch (error) {
      console.error(error);
      setStatusNotification({ type: 'error', text: 'Error granting premium logic.' });
    }
  };

  const generatePromoKey = async () => {
    try {
      const keyStr = 'PROMO-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const durationMonths = getDurationMonths(newPromoPlan);

      await setDoc(doc(db, "promo_keys", keyStr), {
        key: keyStr,
        plan: newPromoPlan,
        durationMonths,
        isUsed: false,
        usedBy: null,
        usedAt: null,
        createdAt: new Date().toISOString()
      });

      setStatusNotification({
        type: 'success',
        text: `Generated new Promo Key: ${keyStr}`
      });
    } catch (error) {
      console.error(error);
      setStatusNotification({ type: 'error', text: 'Failed to generate promo key.' });
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
              <Globe className="text-indigo-600 w-8 h-8" strokeWidth={2.5} />
              Merchant Network Console
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Global overview of all active shops. Search by Name, Email, or Shop Code.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowPromoModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-2xl transition-all shadow-[0_2px_10px_-3px_rgba(192,38,211,0.4)] whitespace-nowrap"
            >
              <Key className="w-5 h-5" />
              Promo Keys Manager
            </button>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by code, email or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full md:w-80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] text-slate-700 font-bold placeholder:font-medium"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-[0_2px_20px_-5px_rgba(6,81,237,0.1)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Total Merchants</div>
                <div className="text-3xl font-black text-slate-800">{merchants.length}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-[0_2px_20px_-5px_rgba(16,185,129,0.1)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Global Activity</div>
                <div className="text-3xl font-black text-slate-800">High</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-violet-100 shadow-[0_2px_20px_-5px_rgba(139,92,246,0.1)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-violet-400 uppercase tracking-widest">New Connections</div>
                <div className="text-3xl font-black text-slate-800">System Active</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)]">
          <div className="p-6 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-black text-slate-800 text-lg">Merchant Directory</h2>
            <div className="px-3 py-1 bg-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Live DB Sync</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Merchant Info</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Store Code</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Join Date</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Plan</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6 bg-slate-50/30"></td>
                    </tr>
                  ))
                ) : filteredMerchants.length > 0 ? (
                  filteredMerchants.map((merchant, idx) => (
                    <React.Fragment key={merchant.id + '_' + idx}>
                      <tr className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                              {merchant.shopName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-base">{merchant.shopName}</div>
                              <div className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {merchant.ownerEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {merchant.shopCode ? (
                            <span className="bg-slate-100 text-slate-600 text-sm font-mono font-black px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                              #{merchant.shopCode}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-sm">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(merchant.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {merchant.plan}
                            </span>
                            {merchant.status === 'blocked' && (
                              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-rose-100 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Blocked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setExpandedMerchantId(expandedMerchantId === merchant.id ? null : merchant.id)}
                            className="px-4 py-2 bg-slate-50 text-slate-600 font-bold text-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                          >
                            {expandedMerchantId === merchant.id ? 'Hide Details' : 'View Details'}
                          </button>
                          <button 
                            onClick={() => setSelectedMerchant(merchant)}
                            className="px-4 py-2 bg-white text-indigo-600 font-bold text-sm border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all shadow-sm flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Read
                          </button>
                        </td>
                      </tr>
                      {expandedMerchantId === merchant.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={5} className="px-8 py-4">
                            <div className="grid grid-cols-3 gap-6 text-sm">
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Registered</span>
                                <div className="font-bold text-slate-700">{new Date(merchant.createdAt).toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Last Active</span>
                                <div className="font-bold text-slate-700">{new Date(merchant.lastActive).toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Shop Type</span>
                                <div className="font-bold text-slate-700">{merchant.type || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-medium bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-10 h-10 text-slate-300 mb-3" />
                        <p>No merchants found matching "{searchTerm}".</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedMerchant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-3xl shadow-sm">
                      {selectedMerchant.shopName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedMerchant.shopName}</h2>
                      <div className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                        DB ID: <span className="font-mono text-xs bg-slate-100 px-1 border border-slate-200 rounded">{selectedMerchant.id}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMerchant(null)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unique Shop Code</div>
                    <div className="font-mono font-black text-xl text-indigo-600">{selectedMerchant.shopCode || 'Not Generated'}</div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status & Plan</div>
                    {selectedMerchant.status === 'blocked' ? (
                      <div className="font-black text-rose-600 flex items-center gap-1.5">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                        Blocked (Disabled)
                      </div>
                    ) : (
                      <div className="font-black text-emerald-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-5 h-5" />
                        Active {selectedMerchant.plan}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest pb-2 border-b border-slate-100">Contact & Address Information</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5"><Mail className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Owner Gmail Address</div>
                        <div className="font-bold text-slate-700">{selectedMerchant.ownerEmail}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5"><Phone className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</div>
                        <div className="font-bold text-slate-700">{selectedMerchant.phone || 'Not Provided'}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5"><MapPin className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Physical Address</div>
                        <div className="font-bold text-slate-700">{selectedMerchant.address || 'Not Provided'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest pb-3">Update Premium Access</h3>
                  <div className="flex items-center gap-3">
                    <select 
                      value={manualPlanSelect}
                      onChange={(e) => setManualPlanSelect(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="6 Months Premium">6 Months Premium</option>
                      <option value="1 Year Premium">1 Year Premium</option>
                      <option value="2 Years Premium">2 Years Premium</option>
                      <option value="5 Years Premium">5 Years Premium</option>
                      <option value="Lifetime Premium">Lifetime Premium</option>
                    </select>
                    <button 
                      onClick={() => executeGrantManualPremium(selectedMerchant)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Grant Access
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Joined {new Date(selectedMerchant.createdAt).toLocaleString()}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setConfirmingBlock(selectedMerchant)}
                    className={`px-4 py-2 font-bold text-sm rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-offset-2 flex items-center gap-2 border ${
                      selectedMerchant.status === 'blocked' 
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 focus:ring-emerald-500' 
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100 focus:ring-amber-500'
                    }`}
                  >
                    {selectedMerchant.status === 'blocked' ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Unblock Merchant
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        Block Merchant
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setConfirmingDelete(selectedMerchant)}
                    className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-sm rounded-xl shadow-sm hover:bg-rose-100 transition-all focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 flex items-center gap-2 border border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button 
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-slate-900 transition-all focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {/* Promo Keys Manager Modal */}
          {showPromoModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">Promo / Activation Keys</h2>
                      <p className="text-sm font-medium text-slate-500">Generate and track premium redeemable codes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPromoModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 border-b border-slate-100 bg-white">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-4">Generate New Code</h3>
                  <div className="flex items-center gap-3">
                    <select 
                      value={newPromoPlan}
                      onChange={(e) => setNewPromoPlan(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-fuchsia-500 flex-1"
                    >
                      <option value="6 Months Premium">6 Months Premium</option>
                      <option value="1 Year Premium">1 Year Premium</option>
                      <option value="2 Years Premium">2 Years Premium</option>
                      <option value="5 Years Premium">5 Years Premium</option>
                      <option value="Lifetime Premium">Lifetime Premium</option>
                    </select>
                    <button 
                      onClick={generatePromoKey}
                      className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black rounded-xl transition-all shadow-sm"
                    >
                      Generate Key
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                  <div className="space-y-3">
                    {promoKeys.length === 0 ? (
                      <div className="text-center text-slate-400 py-10 font-medium">
                        No keys generated yet.
                      </div>
                    ) : (
                      promoKeys.map((k, idx) => (
                        <div key={k.id + '_' + idx} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                          <div>
                            <div className="font-mono font-black text-lg text-indigo-600">{k.key}</div>
                            <div className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
                              <span>Plan: <strong className="text-slate-700">{k.plan}</strong></span>
                              <span>•</span>
                              <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div>
                            {k.isUsed ? (
                              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-lg border border-slate-200">
                                Redeemed by: {k.usedBy}
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest rounded-lg border border-emerald-200 animate-pulse">
                                Active / Unused
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Custom Confirmation Modal for Blocking */}
          {confirmingBlock && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100"
              >
                <div className="flex items-center gap-3 text-amber-600 mb-4">
                  <ShieldAlert className="w-8 h-8" />
                  <h2 className="text-xl font-black text-slate-800">
                    {confirmingBlock.status === 'blocked' ? 'Unblock' : 'Block'} Merchant Store?
                  </h2>
                </div>
                <p className="text-slate-600 text-sm font-medium mb-6">
                  Are you sure you want to {confirmingBlock.status === 'blocked' ? 'unblock (enable)' : 'block (disable)'} <strong className="text-slate-850">{confirmingBlock.shopName}</strong>? 
                  {confirmingBlock.status === 'blocked' ? (
                    " This will restore system access for the merchant and their staff instantly."
                  ) : (
                    " Blocked merchants and their staff will be immediately logged out and forbidden from logging back in."
                  )}
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setConfirmingBlock(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => executeToggleBlockMerchant(confirmingBlock)}
                    className={`px-5 py-2 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer ${
                      confirmingBlock.status === 'blocked' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                        : 'bg-amber-650 hover:bg-amber-700 shadow-amber-500/20'
                    }`}
                  >
                    Yes, {confirmingBlock.status === 'blocked' ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Custom Confirmation Modal for Deleting */}
          {confirmingDelete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-150"
              >
                <div className="flex items-center gap-3 text-rose-600 mb-4">
                  <Trash2 className="w-8 h-8" />
                  <h2 className="text-xl font-black text-slate-800">Delete Merchant Store?</h2>
                </div>
                <p className="text-slate-600 text-sm font-medium mb-6">
                  Are you sure you want to permanently delete <strong className="text-slate-850">{confirmingDelete.shopName}</strong> and ALL their database records? 
                  <span className="block mt-2 font-black text-rose-600 uppercase text-xs tracking-widest">
                    ⚠️ This action is completely irreversible!
                  </span>
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setConfirmingDelete(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => executeDeleteMerchant(confirmingDelete)}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
                  >
                    Yes, Permanently Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Status Notification Modal */}
          {statusNotification && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-105"
              >
                <div className="flex items-center gap-3 mb-4">
                  {statusNotification.type === 'success' ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-8 h-8 text-rose-600" />
                  )}
                  <h2 className="text-xl font-black text-slate-800">
                    {statusNotification.type === 'success' ? 'Success' : 'Error'}
                  </h2>
                </div>
                <p className="text-slate-600 text-sm font-medium mb-6">
                  {statusNotification.text}
                </p>
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => setStatusNotification(null)}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-black/10 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
