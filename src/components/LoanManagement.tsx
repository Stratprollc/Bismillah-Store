import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Calendar, CreditCard, DollarSign, Phone, User, 
  Clock, Plus, Banknote, Search, AlertCircle, TrendingUp, CheckCircle, Package, Bell
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

interface LoanManagementProps {
  products: any[];
  customers: any[];
  settings: any;
  user: any;
}

interface Loan {
  id: string;
  institutionName: string;
  principalAmount: number;
  repaymentFrequency: 'daily' | 'weekly' | 'monthly';
  repaymentDay: string | number; // Monday, or 5th
  totalInstallments: number;
  paidInstallments: number;
  interestPercentage: number;
  collectorName: string;
  collectorPhone: string;
  startDate: string;
  status: 'Active' | 'Completed' | 'Defaulted';
  notes: string;
}

// Helper to format currency
const fC = (val: number) => `${val.toLocaleString('en-GB', { minimumFractionDigits: 0 })} TK`;

export default function LoanManagement({ products, customers, settings, user }: LoanManagementProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    institutionName: '',
    principalAmount: '',
    repaymentFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    repaymentDay: '1',
    totalInstallments: '',
    interestPercentage: '',
    collectorName: '',
    collectorPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (!user?.shopId) return;
    const q = query(collection(db, 'shops', user.shopId, 'loans'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
      setLoans(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Upcoming calculations
  const upcomingAlerts = useMemo(() => {
    if (loans.length === 0) return [];
    const alerts: string[] = [];
    const today = new Date();
    const currentDayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.getDate();
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 1);
    const tomorrowDate = nextDate.getDate();
    const tomorrowDayOfWeek = nextDate.toLocaleDateString('en-US', { weekday: 'long' });

    loans.forEach(loan => {
      if (loan.status !== 'Active') return;
      if (loan.repaymentFrequency === 'daily') {
         alerts.push(`Today's installment for ${loan.institutionName} is due. Please keep money ready.`);
      } else if (loan.repaymentFrequency === 'monthly') {
         const repDay = Number(loan.repaymentDay);
         if (repDay === currentDate) {
            alerts.push(`Today is the monthly installment day for ${loan.institutionName}!`);
         } else if (repDay === tomorrowDate) {
            alerts.push(`Tomorrow (${repDay}th) is the monthly installment day for ${loan.institutionName}. Please gather your funds.`);
         }
      } else if (loan.repaymentFrequency === 'weekly') {
         const repDay = String(loan.repaymentDay).toLowerCase();
         if (repDay === currentDayOfWeek.toLowerCase()) {
            alerts.push(`Today (${currentDayOfWeek}) is the weekly installment day for ${loan.institutionName}!`);
         } else if (repDay === tomorrowDayOfWeek.toLowerCase()) {
            alerts.push(`Tomorrow (${tomorrowDayOfWeek}) is the weekly installment day for ${loan.institutionName}. Please gather your funds.`);
         }
      }
    });
    return alerts;
  }, [loans]);

  // Auto Calculations
  const principal = Number(formData.principalAmount) || 0;
  const interestRate = Number(formData.interestPercentage) || 0;
  const installments = Number(formData.totalInstallments) || 1;
  
  const totalInterest = Math.round(principal * (interestRate / 100));
  const totalPayable = principal + totalInterest;
  const installmentAmount = Math.round(totalPayable / installments);

  const handleSaveLoan = async () => {
    if (!user?.shopId) return;
    if (!formData.institutionName || !formData.principalAmount) {
       alert("Please enter institution name and principal amount.");
       return;
    }
    
    try {
      const loanData = {
        institutionName: formData.institutionName,
        principalAmount: principal,
        repaymentFrequency: formData.repaymentFrequency,
        repaymentDay: formData.repaymentDay,
        totalInstallments: installments,
        paidInstallments: 0,
        interestPercentage: interestRate,
        totalInterest,
        totalPayable,
        installmentAmount,
        collectorName: formData.collectorName,
        collectorPhone: formData.collectorPhone,
        startDate: formData.startDate,
        status: 'Active',
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'shops', user.shopId, 'loans'), loanData);
      setShowAddModal(false);
      setFormData({
        institutionName: '',
        principalAmount: '',
        repaymentFrequency: 'monthly',
        repaymentDay: '1',
        totalInstallments: '',
        interestPercentage: '',
        collectorName: '',
        collectorPhone: '',
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save loan.');
    }
  };

  const handlePayInstallment = async (loan: Loan) => {
    if (!user?.shopId) return;
    if (loan.paidInstallments >= loan.totalInstallments) {
        alert("Loan already fully paid.");
        return;
    }

    try {
      const newPaid = loan.paidInstallments + 1;
      const newStatus = newPaid >= loan.totalInstallments ? 'Completed' : 'Active';
      
      await updateDoc(doc(db, 'shops', user.shopId, 'loans', loan.id), {
        paidInstallments: newPaid,
        status: newStatus
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update installment.');
    }
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shops', user?.shopId, 'loans', id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalActivePrincipal = activeLoans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalActivePayable = activeLoans.reduce((sum, l) => sum + (l.principalAmount * (1 + l.interestPercentage / 100)), 0);
  const totalActiveRemaining = activeLoans.reduce((sum, l) => {
     const totalPay = l.principalAmount * (1 + l.interestPercentage / 100);
     const instAmount = l.totalInstallments > 0 ? totalPay / l.totalInstallments : 0;
     return sum + (totalPay - (instAmount * l.paidInstallments));
  }, 0);

  const filteredLoans = loans.filter(l => 
    l.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.collectorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-emerald-100 flex items-center justify-center ring-1 ring-emerald-500/5 transition-transform hover:rotate-6">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Loan Management</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Track Business Loans & Installments</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New Loan
        </button>
      </header>

      {/* Notifications / Alerts */}
      {upcomingAlerts.length > 0 && (
         <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-sm">
            <h3 className="text-amber-800 font-black flex items-center gap-2 mb-4 tracking-tight text-lg">
               <Bell className="w-5 h-5 animate-bounce" />
               Upcoming Installment Alerts
            </h3>
            <div className="space-y-3">
               {upcomingAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-amber-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                     <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                     <p className="text-sm font-bold text-slate-700">{alert}</p>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
             <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
               <Banknote className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Principal</p>
                <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter mt-1">{fC(totalActivePrincipal)}</p>
             </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
             <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
               <DollarSign className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payable (with Int.)</p>
                <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter mt-1">{fC(totalActivePayable)}</p>
             </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
             <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
               <TrendingUp className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Balance</p>
                <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter mt-1">{fC(totalActiveRemaining)}</p>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
         <div className="relative group max-w-sm mb-6">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search by Institution or Collector..."
              className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>

         {loading ? (
             <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading records...</div>
         ) : filteredLoans.length === 0 ? (
             <div className="p-16 text-center flex flex-col items-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                    <Building2 className="w-10 h-10" />
                 </div>
                 <h4 className="text-lg font-black text-slate-800 tracking-tight">No Loans Found</h4>
                 <p className="text-slate-500 text-xs font-bold mt-2">You don't have any loan records yet. Click "Add New Loan" to track a loan.</p>
             </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {filteredLoans.map((loan) => {
                  const totalPay = Math.round(loan.principalAmount * (1 + loan.interestPercentage / 100));
                  const instAmount = Math.round(totalPay / loan.totalInstallments);
                  const progress = (loan.paidInstallments / loan.totalInstallments) * 100;

                  return (
                     <div key={loan.id} className="border border-slate-100 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-200 transition-all hover:shadow-lg hover:shadow-emerald-50">
                        {loan.status === 'Completed' && (
                           <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 border border-emerald-100">
                             <CheckCircle className="w-3 h-3" /> Settled
                           </div>
                        )}
                        {loan.status === 'Active' && (
                           <div className="absolute top-4 right-4 bg-amber-50 text-amber-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-100">
                             Active
                           </div>
                        )}
                        
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                              <Building2 className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-base font-black text-slate-800">{loan.institutionName}</h3>
                              <p className="text-[10px] font-bold text-slate-400 capitalize">{loan.repaymentFrequency} Installment • {
                                loan.repaymentFrequency === 'weekly' ? `Every ${loan.repaymentDay}` : loan.repaymentFrequency === 'monthly' ? `${loan.repaymentDay}th of month` : 'Every day'
                              }</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-0">Principal</p>
                              <p className="text-base font-black text-slate-700 tracking-tighter">{fC(loan.principalAmount)}</p>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-0">Interest</p>
                              <p className="text-base font-black text-slate-700 tracking-tighter">{loan.interestPercentage}%</p>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2 flex items-center justify-between">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-0">Installment Amount</p>
                                 <p className="text-xl font-black text-emerald-600 tracking-tighter">{fC(instAmount)}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-0">Progress</p>
                                 <p className="font-bold text-slate-700 text-sm">{loan.paidInstallments} / {loan.totalInstallments}</p>
                              </div>
                           </div>
                        </div>

                        <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
                           <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>

                        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 relative z-10 text-xs">
                           <div className="flex items-center gap-2 text-slate-500">
                              <User className="w-3.5 h-3.5" />
                              <span className="font-bold">Collector:</span> <span className="text-slate-800">{loan.collectorName || 'Not Agent'}</span>
                           </div>
                           <div className="flex items-center gap-2 text-slate-500">
                              <Phone className="w-3.5 h-3.5" />
                              <span className="font-bold">Contact:</span> <span className="text-slate-800">{loan.collectorPhone || 'N/A'}</span>
                           </div>
                           {loan.notes && (
                             <div className="flex items-start gap-2 text-slate-500 mt-1">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                                <span className="italic">{loan.notes}</span>
                             </div>
                           )}
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                           {loan.status === 'Active' && (
                              <button 
                                onClick={() => handlePayInstallment(loan)}
                                className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                              >
                                Pay Installment
                              </button>
                           )}
                           {confirmDeleteId === loan.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-rose-600">Sure?</span>
                                <button 
                                  onClick={() => handleDeleteLoan(loan.id)}
                                  className="px-3 py-2 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                                >
                                  Yes
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                >
                                  No
                                </button>
                              </div>
                           ) : (
                             <button 
                               onClick={() => setConfirmDeleteId(loan.id)}
                               className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shrink-0"
                             >
                               Delete
                             </button>
                           )}
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden relative my-8"
          >
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
             <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight">Add Loan Entry</h2>
                   <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                     <Plus className="w-5 h-5 rotate-45" />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Institution Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Grameen Bank, BRAC"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.institutionName}
                          onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Principal Amount (TK)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 50000"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.principalAmount}
                          onChange={(e) => setFormData({...formData, principalAmount: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Frequency</label>
                        <select
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.repaymentFrequency}
                          onChange={(e) => setFormData({...formData, repaymentFrequency: e.target.value as 'daily'|'weekly'|'monthly'})}
                        >
                           <option value="daily">Daily</option>
                           <option value="weekly">Weekly</option>
                           <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Repayment Day</label>
                        <input 
                          type="text" 
                          placeholder={formData.repaymentFrequency === 'weekly' ? 'e.g. Monday' : 'e.g. 5 (date)'}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.repaymentDay}
                          onChange={(e) => setFormData({...formData, repaymentDay: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Start Date</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Installments (Count)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 12"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.totalInstallments}
                          onChange={(e) => setFormData({...formData, totalInstallments: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Interest %</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 10"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.interestPercentage}
                          onChange={(e) => setFormData({...formData, interestPercentage: e.target.value})}
                        />
                      </div>
                   </div>

                   {/* Auto Calculate Display */}
                   {principal > 0 && installments > 0 && (
                     <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                           <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mb-1 mt-0">Auto Calculation</p>
                           <p className="text-xs font-bold text-emerald-600 leading-relaxed">
                             Total Payable: <span className="font-black text-emerald-700">{totalPayable} TK</span> <br/>
                             Installment Amount: <span className="font-black text-emerald-900 text-sm bg-emerald-100 px-2 py-0.5 rounded">{installmentAmount} TK</span> / period
                           </p>
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Collector Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Aminul Islam"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.collectorName}
                          onChange={(e) => setFormData({...formData, collectorName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Collector Mobile</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.collectorPhone}
                          onChange={(e) => setFormData({...formData, collectorPhone: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Additional Notes</label>
                        <textarea 
                          placeholder="Any details about the loan terms..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                   </div>

                   <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={handleSaveLoan}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3.5 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-200 text-xs transition-transform active:scale-95"
                      >
                         Save Loan Entry
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
