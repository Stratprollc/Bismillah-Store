import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, DollarSign, TrendingUp, AlertCircle, ShoppingCart, 
  CheckCircle2, Smartphone, MonitorIcon, AlertTriangle, Package, Users, X, Info 
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, collection, query, where, onSnapshot } from '../firebase';

// Helper for localizing key UI elements
const LOCAL_TRANSLATIONS = {
  en: {
    welcome: "Welcome to ShopMaster Dashboard",
    dashboardSubtitle: "Real-time analytics & business intelligence console.",
    totalSales: "Total Sales",
    totalProfit: "Net Profit",
    totalExpense: "Total Expenses",
    lowStock: "Low Stock Products",
    outOfStock: "Out Of Stock",
    receivables: "Total Receivables",
    noSales: "No Sales Record",
    noSalesDesc: "Once you complete transactions via POS, your sales and profit lifecycle analytics will appear here automatically.",
    chartTitle: "Performance Chart",
    viewRevenue: "View Revenue",
    viewProfit: "View Profit",
    day: "Day",
    week: "Week",
    month: "Month",
    year: "Year",
    inventoryHealth: "Inventory Health",
    expiringAlert: "Expiry Alert",
    expiringDays: "days",
    expiringBanner: "The following products are nearing their expiry date.",
    actionNeeded: "Action needed",
    criticalIssue: "Critical issue",
    receivablesSubtitle: "Outstanding Customer Balance",
    online: "Online",
    offline: "Offline",
    cogs: "Cost of Goods Sold (COGS)",
    grossProfit: "Gross Profit",
    merchant: "Merchant Console",
  },
  bn: {
    welcome: "শপমাস্টার ড্যাশবোর্ড-এ স্বাগতম",
    dashboardSubtitle: "রিয়েল-টাইম এনালাইটিক্স এবং বিজনেস ইন্টেলিজেন্স কনসোল।",
    totalSales: "মোট বিক্রয়",
    totalProfit: "নিট লাভ (Net Profit)",
    totalExpense: "মোট খরচ (Expense)",
    lowStock: "কম স্টক পণ্য",
    outOfStock: "স্টক শেষ",
    receivables: "মোট বকেয়া পাওনা",
    noSales: "কোন বিক্রয়ের রেকর্ড নেই",
    noSalesDesc: "পিওএস (POS) থেকে কোনো সেল সম্পন্ন হলে, এখানে বিক্রয় এবং মুনাফা পরিসংখ্যান স্বয়ংক্রিয়ভাবে আসবে।",
    chartTitle: "পারফর্মেন্স চার্ট",
    viewRevenue: "রেভিনিউ দেখুন",
    viewProfit: "প্রফিট দেখুন",
    day: "আজ",
    week: "এই সপ্তাহে",
    month: "এই মাস",
    year: "এই বছর",
    inventoryHealth: "ইনভেন্টরি হেলথ",
    expiringAlert: "মেয়াদ শেষ হওয়ার সতর্কবার্তা",
    expiringDays: "দিন",
    expiringBanner: "নিচের পণ্যগুলোর মেয়াদ শীঘ্রই শেষ হয়ে যাচ্ছে।",
    actionNeeded: "দ্রুত ব্যবস্থা প্রয়োজন",
    criticalIssue: "গুরুতর সমস্যা",
    receivablesSubtitle: "ক্রেতাদের কাছে মোট বকেয়া পাওনা",
    online: "অনলাইন",
    offline: "অফলাইন",
    cogs: "বিক্রিত পণ্যের উৎপাদন ব্যয়",
    grossProfit: "মোট লাভ (Gross Profit)",
    merchant: "মার্চেন্ট কনসোল",
  },
};

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  cost: number;
  barcode?: string;
  expiryDate?: string;
  shopId: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  cost?: number;
}

export interface Sale {
  id: string;
  invoiceId: string;
  customerName?: string;
  customerId?: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  timestamp: any;
  shopId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  currentDue: number;
  totalSpent: number;
  shopId: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  shopId: string;
  timestamp: any;
}

export interface DailyClosing {
  id: string;
  totalSales: number;
  totalExpenses: number;
  cashInHand: number;
  shopId: string;
  timestamp: any;
}

export interface ShopSettings {
  shopId: string;
  systemLanguage?: 'en' | 'bn';
  currencySymbol?: string;
  shopName?: string;
}

interface DashboardProps {
  settings: ShopSettings;
  onDelete?: (closing: DailyClosing) => void;
  onViewProductHistory: (p: any) => void;
  isOnline: boolean;
  user: any;
  period: 'day' | 'week' | 'month' | 'year';
  setPeriod: (p: 'day' | 'week' | 'month' | 'year') => void;
  viewMetric: 'revenue' | 'profit';
  setViewMetric: (v: 'revenue' | 'profit') => void;
}

export function PerformanceChart({ chartData, viewMetric, primaryColor }: { chartData: any[], viewMetric: 'revenue' | 'profit', primaryColor: string }) {
  const barFill = primaryColor === 'blue-600' ? '#2563eb' : (primaryColor === 'emerald-600' ? '#10b981' : '#2563eb');
  
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
          <Tooltip 
            cursor={{fill: '#f8fafc'}}
            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
          />
          <Bar 
            dataKey={viewMetric === 'revenue' ? 'sales' : 'profit'} 
            radius={[8, 8, 0, 0]} 
            fill={barFill}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard({ 
  settings, 
  onViewProductHistory, 
  isOnline, 
  user,
  period,
  setPeriod,
  viewMetric,
  setViewMetric 
}: DashboardProps) {

  const systemLang = settings?.systemLanguage || 'bn';
  const lt = LOCAL_TRANSLATIONS[systemLang === 'bn' ? 'bn' : 'en'];

  // Local state for full, reactive Firestore syncing matching the strict shopId rule
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);

  const activeShopId = user?.shopId;

  // Sync data securely based on logged in user's merchant shopId
  useEffect(() => {
    if (!activeShopId) {
      setSales([]);
      setProducts([]);
      setCustomers([]);
      setExpenses([]);
      setDailyClosings([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Sales sync
    const salesQuery = query(
      collection(db, 'sales'),
      where('shopId', '==', activeShopId)
    );
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const fetchedSales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      fetchedSales.sort((a, b) => {
        const getMs = (ts: any) => {
          if (!ts) return 0;
          if (typeof ts.toDate === 'function') return ts.toDate().getTime();
          if (ts.seconds) return ts.seconds * 1000;
          return new Date(ts).getTime() || 0;
        };
        return getMs(b.timestamp) - getMs(a.timestamp);
      });
      setSales(fetchedSales);
      setLoading(false);
    }, (err) => {
      console.error("Dashboard Sales sync error:", err);
      setLoading(false);
    });

    // Products sync
    const productsQuery = query(
      collection(db, 'products'),
      where('shopId', '==', activeShopId)
    );
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => console.error("Dashboard Products sync error:", err));

    // Customers sync
    const customersQuery = query(
      collection(db, 'customers'),
      where('shopId', '==', activeShopId)
    );
    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => console.error("Dashboard Customers sync error:", err));

    // Expenses sync
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('shopId', '==', activeShopId)
    );
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    }, (err) => console.error("Dashboard Expenses sync error:", err));

    // Daily closings sync
    const closingsQuery = query(
      collection(db, 'daily_closings'),
      where('shopId', '==', activeShopId)
    );
    const unsubClosings = onSnapshot(closingsQuery, (snapshot) => {
      setDailyClosings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyClosing)));
    }, (err) => console.error("Dashboard Closings sync error:", err));

    return () => {
      unsubSales();
      unsubProducts();
      unsubCustomers();
      unsubExpenses();
      unsubClosings();
      // Synchronously clear memory-held variables on unmount or user change
      setSales([]);
      setProducts([]);
      setCustomers([]);
      setExpenses([]);
      setDailyClosings([]);
    };
  }, [activeShopId]);

  const fC = (num: number) => {
    const symbol = settings?.currencySymbol || 'TK';
    const lang = settings?.systemLanguage || 'bn';
    if (!num && num !== 0) return `${symbol} 0`;
    return `${symbol} ${parseFloat(num.toFixed(2)).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}`;
  };

  const safeDate = (date: any) => {
    if (!date) return new Date();
    if (typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
  };

  // Trailing filter helper
  const now = useMemo(() => new Date(), [period]);
  
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = safeDate(s.timestamp);
      if (period === 'day') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return saleDate >= oneWeekAgo;
      }
      if (period === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(now.getDate() - 30);
        return saleDate >= oneMonthAgo;
      }
      if (period === 'year') {
        const oneYearAgo = new Date();
        oneYearAgo.setDate(now.getDate() - 365);
        return saleDate >= oneYearAgo;
      }
      return true;
    });
  }, [sales, period, now]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const expenseDate = safeDate(e.timestamp);
      if (period === 'day') {
        return expenseDate.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return expenseDate >= oneWeekAgo;
      }
      if (period === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(now.getDate() - 30);
        return expenseDate >= oneMonthAgo;
      }
      if (period === 'year') {
        const oneYearAgo = new Date();
        oneYearAgo.setDate(now.getDate() - 365);
        return expenseDate >= oneYearAgo;
      }
      return true;
    });
  }, [expenses, period, now]);

  // Aggregate stats
  const totalSalesCost = useMemo(() => {
    return filteredSales.reduce((sum, s) => {
      const itemsCost = s.items.reduce((itemSum, item) => {
        const costPrice = item.cost !== undefined ? item.cost : (item.price * 0.7); // Fallback to 70% if undef
        return itemSum + (costPrice * item.quantity);
      }, 0);
      return sum + itemsCost;
    }, 0);
  }, [filteredSales]);

  const periodSalesTotal = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.finalAmount || 0), 0);
  }, [filteredSales]);

  const periodExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const periodGrossProfit = useMemo(() => {
    return periodSalesTotal - totalSalesCost;
  }, [periodSalesTotal, totalSalesCost]);

  const periodNetProfit = useMemo(() => {
    return periodGrossProfit - periodExpensesTotal;
  }, [periodGrossProfit, periodExpensesTotal]);

  const totalMarketDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
  }, [customers]);

  // Expiring soon criteria (next 30 days)
  const expiringProducts = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();
    return products.filter(p => p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow && new Date(p.expiryDate) >= today);
  }, [products]);

  // Chart data calculation
  const chartData = useMemo(() => {
    if (sales.length === 0) {
      const daysCount = period === 'year' ? 12 : (period === 'month' ? 4 : 7);
      return Array.from({ length: daysCount }, (_, i) => {
        let label = '';
        if (period === 'year') {
          const months = systemLang === 'bn' ? 
            ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'] :
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = months[i];
        } else if (period === 'month') {
          label = systemLang === 'bn' ? `সপ্তাহ ${i+1}` : `Week ${i+1}`;
        } else {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          label = d.toLocaleDateString(systemLang === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });
        }
        return { name: label, sales: 0, profit: 0 };
      });
    }

    if (period === 'year') {
      const monthsData = Array.from({ length: 12 }, (_, i) => {
        const months = systemLang === 'bn' ? 
          ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'] :
          ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return { name: months[i], monthIndex: i, sales: 0, profit: 0 };
      });

      sales.forEach(s => {
        const d = safeDate(s.timestamp);
        const y = d.getFullYear();
        const currentYear = new Date().getFullYear();
        if (y === currentYear) {
          const m = d.getMonth();
          monthsData[m].sales += s.finalAmount || 0;
          const cost = s.items.reduce((sum, item) => {
            const costPrice = item.cost !== undefined ? item.cost : (item.price * 0.7);
            return sum + (costPrice * item.quantity);
          }, 0);
          monthsData[m].profit += (s.finalAmount || 0) - cost;
        }
      });

      return monthsData.map(item => ({
        name: item.name,
        sales: Math.max(0, parseFloat(item.sales.toFixed(2))),
        profit: Math.max(0, parseFloat(item.profit.toFixed(2)))
      }));
    } else if (period === 'month') {
      const weeksData = Array.from({ length: 4 }, (_, i) => {
        const label = systemLang === 'bn' ? `সপ্তাহ ${i+1}` : `Week ${i+1}`;
        return { name: label, weekIndex: i, sales: 0, profit: 0 };
      });

      sales.forEach(s => {
        const d = safeDate(s.timestamp);
        const m = d.getMonth();
        const currentMonth = new Date().getMonth();
        if (m === currentMonth) {
          const day = d.getDate();
          const weekIdx = Math.min(3, Math.floor((day - 1) / 7));
          weeksData[weekIdx].sales += s.finalAmount || 0;
          const cost = s.items.reduce((sum, item) => {
            const costPrice = item.cost !== undefined ? item.cost : (item.price * 0.7);
            return sum + (costPrice * item.quantity);
          }, 0);
          weeksData[weekIdx].profit += (s.finalAmount || 0) - cost;
        }
      });

      return weeksData.map(item => ({
        name: item.name,
        sales: Math.max(0, parseFloat(item.sales.toFixed(2))),
        profit: Math.max(0, parseFloat(item.profit.toFixed(2)))
      }));
    } else {
      const daysData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayName = d.toLocaleDateString(systemLang === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });
        return { name: dayName, dateString: d.toDateString(), sales: 0, profit: 0 };
      });

      sales.forEach(s => {
        const d = safeDate(s.timestamp);
        const dStr = d.toDateString();
        const targetDay = daysData.find(x => x.dateString === dStr);
        if (targetDay) {
          targetDay.sales += s.finalAmount || 0;
          const cost = s.items.reduce((sum, item) => {
            const costPrice = item.cost !== undefined ? item.cost : (item.price * 0.7);
            return sum + (costPrice * item.quantity);
          }, 0);
          targetDay.profit += (s.finalAmount || 0) - cost;
        }
      });

      return daysData.map(item => ({
        name: item.name,
        sales: Math.max(0, parseFloat(item.sales.toFixed(2))),
        profit: Math.max(0, parseFloat(item.profit.toFixed(2)))
      }));
    }
  }, [sales, period, systemLang]);

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-500">
          {systemLang === 'bn' ? 'ড্যাশবোর্ড তথ্য লোড হচ্ছে...' : 'Loading dashboard analytics...'}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
      }}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-10"
    >
      {/* Header section with Welcome, Status Badge & Title Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-50/50 to-sky-50/20 p-8 rounded-[2.5rem] border border-indigo-100/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] bg-indigo-600 text-white font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {lt.merchant}
            </span>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              {isOnline ? lt.online : lt.offline}
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            {lt.welcome}, {user?.username || (systemLang === 'bn' ? 'মার্চেন্ট' : 'Merchant')}!
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {settings?.shopName ? `🏪 ${settings.shopName} | ` : ''}{lt.dashboardSubtitle}
          </p>
        </div>
        <div className="text-right flex flex-col items-start md:items-end justify-center shrink-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
            {systemLang === 'bn' ? 'আজকের তারিখ' : 'TODAY'}
          </p>
          <p className="text-xl font-black text-indigo-600 mt-1.5 bg-white shadow-sm border border-gray-100 px-5 py-2.5 rounded-2xl">
            📅 {format(now, systemLang === 'bn' ? 'dd MMMM, yyyy' : 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Expiry alerts banner */}
      {expiringProducts.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-rose-50 rounded-[2rem] border border-rose-100 shadow-sm gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900 leading-snug">{lt.expiringAlert} ({expiringProducts.length})</p>
              <p className="text-xs text-rose-600 font-semibold leading-relaxed mt-0.5">{lt.expiringBanner}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 overflow-x-auto max-w-full py-1">
            {expiringProducts.slice(0, 4).map(p => (
              <button
                key={p.id}
                onClick={() => onViewProductHistory(p)}
                className="bg-white hover:bg-rose-100 text-rose-800 font-bold text-[10px] transition-all px-3 py-1.5 rounded-xl border border-rose-200 shadow-sm whitespace-nowrap"
              >
                {p.name}
              </button>
            ))}
            {expiringProducts.length > 4 && (
              <span className="bg-rose-200 text-rose-900 font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center shadow-sm">
                +{expiringProducts.length - 4} More
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Grid containing high impact statistics */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
      >
        {/* Total Sales Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 hover:shadow-lg hover:border-indigo-100/50 transition-all group duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-indigo-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lt.totalSales}</p>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900 leading-none">{fC(periodSalesTotal)}</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                {period === 'day' ? lt.day : period === 'week' ? lt.week : period === 'month' ? lt.month : lt.year}
              </p>
            </div>
          </div>
        </div>

        {/* COGS Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 hover:shadow-lg transition-all group duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-slate-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lt.cogs}</p>
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shadow-sm">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900 leading-none">{fC(totalSalesCost)}</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                {period === 'day' ? lt.day : period === 'week' ? lt.week : period === 'month' ? lt.month : lt.year}
              </p>
            </div>
          </div>
        </div>

        {/* Gross Profit Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 hover:shadow-lg transition-all group duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-teal-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lt.grossProfit}</p>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black font-mono tracking-tight text-teal-600 leading-none">{fC(periodGrossProfit)}</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                {period === 'day' ? lt.day : period === 'week' ? lt.week : period === 'month' ? lt.month : lt.year}
              </p>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 hover:shadow-lg transition-all group duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-rose-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lt.totalExpense}</p>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black font-mono tracking-tight text-rose-600 leading-none">{fC(periodExpensesTotal)}</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                {period === 'day' ? lt.day : period === 'week' ? lt.week : period === 'month' ? lt.month : lt.year}
              </p>
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-6 rounded-3xl shadow-xl shadow-emerald-500/10 hover:shadow-2xl transition-all group duration-300 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-emerald-100/80 uppercase tracking-wider">{lt.totalProfit}</p>
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2.5xl font-black font-mono tracking-tight text-white leading-none">
                {periodNetProfit >= 0 ? '+' : ''}{fC(periodNetProfit)}
              </h3>
              <p className="text-[10px] text-emerald-100 mt-2 font-bold uppercase tracking-wider">
                {period === 'day' ? lt.day : period === 'week' ? lt.week : period === 'month' ? lt.month : lt.year}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main performance chart with metrics Selector and trailing switcher */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-md shadow-gray-200/40 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{lt.chartTitle}</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                {period === 'day' ? lt.day : period === 'week' ? lt.week : period === 'month' ? lt.month : lt.year}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Period toggle tabs */}
              <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200 shadow-inner">
                {(['day', 'week', 'month', 'year'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all leading-none ${
                      period === p 
                        ? 'bg-white text-indigo-600 shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lt[p]}
                  </button>
                ))}
              </div>

              {/* View metrics selector */}
              <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200 shadow-inner">
                <button
                  onClick={() => setViewMetric('revenue')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all leading-none ${
                    viewMetric === 'revenue' 
                      ? 'bg-white text-indigo-600 shadow-md' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lt.viewRevenue}
                </button>
                <button
                  onClick={() => setViewMetric('profit')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all leading-none ${
                    viewMetric === 'profit' 
                      ? 'bg-white text-indigo-600 shadow-md' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lt.viewProfit}
                </button>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full relative">
            {sales.length === 0 && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-center z-10 p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <TrendingUp className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-base font-black text-slate-800 mb-1">{lt.noSales}</h4>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-bold">
                  {lt.noSalesDesc}
                </p>
              </div>
            )}
            <PerformanceChart 
              chartData={chartData} 
              viewMetric={viewMetric} 
              primaryColor="blue-600" 
            />
          </div>
        </div>

        {/* Side columns: Inventory health & Receivables */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-md shadow-gray-200/40">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-6">{lt.inventoryHealth}</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-orange-50/70 rounded-3xl border border-orange-100/50 shadow-sm transition-all hover:bg-orange-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-600">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-orange-950">{lt.lowStock}</p>
                    <p className="text-xs text-orange-500/80 font-bold">{lt.actionNeeded}</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-orange-600 bg-white px-4 py-1.5 rounded-full border border-orange-100/30">
                  {products.filter(p => p.stock > 0 && p.stock < 10).length}
                </span>
              </div>

              <div className="flex items-center justify-between p-5 bg-rose-50/70 rounded-3xl border border-rose-100/50 shadow-sm transition-all hover:bg-rose-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-rose-950">{lt.outOfStock}</p>
                    <p className="text-xs text-rose-500/80 font-bold">{lt.criticalIssue}</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-rose-600 bg-white px-4 py-1.5 rounded-full border border-rose-100/30">
                  {products.filter(p => p.stock <= 0).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-600/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -m-8 w-36 h-36 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="relative z-10 text-white flex flex-col justify-between h-full">
              <div>
                <h3 className="text-slate-100 text-xs font-bold uppercase tracking-widest">{lt.receivables}</h3>
                <p className="text-4xl font-black mt-3 mb-2 tracking-tight">{fC(totalMarketDue)}</p>
                <p className="text-[11px] text-indigo-100 font-bold leading-normal">{lt.receivablesSubtitle}</p>
              </div>
              <div className="flex items-center gap-2 text-white bg-white/15 w-fit px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm mt-6">
                <Users className="w-4 h-4 shrink-0" />
                <span className="font-extrabold uppercase tracking-wider text-[9px]">
                  {customers.length} Profiles Registered
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
