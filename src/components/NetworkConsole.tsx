import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { db, collection, getDocs, onSnapshot, query, orderBy, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';

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
}

export const NetworkConsole: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [expandedMerchantId, setExpandedMerchantId] = useState<string | null>(null);

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
          shopCode: data.shopCode,
          address: data.address,
          phone: data.phone,
          type: data.type
        });
      });
      setMerchants(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredMerchants = merchants.filter(m => 
    m.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.shopCode?.includes(searchTerm)
  );

  const handleDeleteMerchant = async (merchant: Merchant) => {
    if (window.confirm(`Are you sure you want to permanently delete ${merchant.shopName}?`)) {
      try {
        await deleteDoc(doc(db, "shops", merchant.id));
        setSelectedMerchant(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'shops');
      }
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
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by code, email or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full md:w-96 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] text-slate-700 font-bold placeholder:font-medium"
            />
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
                  filteredMerchants.map((merchant) => (
                    <React.Fragment key={merchant.id}>
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
                          <div className="flex items-center justify-center">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {merchant.plan}
                            </span>
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
                    <div className="font-black text-emerald-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-5 h-5" />
                      Active {selectedMerchant.plan}
                    </div>
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
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Joined {new Date(selectedMerchant.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDeleteMerchant(selectedMerchant)}
                    className="px-6 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl shadow-sm hover:bg-rose-100 transition-colors flex items-center gap-2 border border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button 
                    onClick={() => setSelectedMerchant(null)}
                    className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
