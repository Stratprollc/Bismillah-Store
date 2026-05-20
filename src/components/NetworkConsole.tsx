import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  ShieldCheck
} from 'lucide-react';
import { db, collection, getDocs, onSnapshot, query, orderBy } from '../firebase';

interface Merchant {
  id: string;
  shopName: string;
  ownerEmail: string;
  createdAt: any;
  lastActive: any;
  plan: string;
}

export const NetworkConsole: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real multi-tenant app, this would query a global 'merchants' collection
    // For this app, we'll try to find any 'settings' documents as they represent shops
    const unsub = onSnapshot(collection(db, "settings"), (snapshot) => {
      const list: Merchant[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        list.push({
          id: doc.id,
          shopName: data.shopName || 'Unnamed Shop',
          ownerEmail: data.shopEmail || 'N/A',
          createdAt: data.createdAt || new Date().toISOString(),
          lastActive: data.updatedAt || new Date().toISOString(),
          plan: 'Premium'
        });
      });
      setMerchants(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredMerchants = merchants.filter(m => 
    m.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Globe className="text-indigo-600" />
              Merchant Network Console
            </h1>
            <p className="text-sm text-slate-500 mt-1">Global overview of all active shops in the Bismillah network.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full md:w-80 shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm"
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
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[70%] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm"
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
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[90%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-violet-100 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-violet-400 uppercase tracking-widest">New Connections</div>
                <div className="text-3xl font-black text-slate-800">+12</div>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 w-[45%] rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
            </div>
          </motion.div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Merchant Directory</h2>
            <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Updates</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchant Info</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 bg-slate-50/30"></td>
                    </tr>
                  ))
                ) : filteredMerchants.length > 0 ? (
                  filteredMerchants.map((merchant) => (
                    <tr key={merchant.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {merchant.shopName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{merchant.shopName}</div>
                            <div className="text-xs text-slate-400">{merchant.ownerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(merchant.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">
                          ACTIVE
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" />
                          {merchant.plan}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-indigo-600">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No merchants found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
