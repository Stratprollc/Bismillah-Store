import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVoiceSearch } from './hooks/useVoiceSearch';
import { standardizeBn, toPhonetic, parseVoiceCommandQuantity, isPhoneticMatch } from './utils/voiceUtils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Users, 
  Settings, 
  Download,
  Shield,
  Building2,
  Warehouse as WarehouseIcon,
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Save, 
  Send,
  X, 
  Menu,
  LogOut, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  Box, 
  User as UserIcon,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Printer,
  Minus,
  ScanLine,
  Scan,
  MessageCircle,
  Calendar,
  Clock,
  ArrowRight,
  Info,
  History as HistoryIcon,
  AlertTriangle,
  Calculator as CalculatorIcon,
  Image as ImageIcon,
  Camera,
  Banknote,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
// import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  OperationType,
  handleFirestoreError,
  increment
} from './firebase';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

// --- Types ---
type UserRole = 'admin' | 'manager' | 'assistant_manager' | 'sales_manager' | 'sales_team';

interface AppUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

interface ShopSettings {
  name: string;
  address: string;
  logoUrl?: string;
  logoBase64?: string;
  phone?: string;
  whatsappSender?: string;
  receiptWidth?: '58mm' | '80mm';
  waGatewayType: 'manual' | 'metacloud' | 'generic';
  waApiUrl?: string;
  waToken?: string;
  waInstanceId?: string;
  waPhoneNumberId?: string;
  autoSendWhatsApp?: boolean;
  receiptFooter?: string;
  waTemplateEnglish?: string;
  waTemplateBengali?: string;
  printLanguage: 'en' | 'bn';
}

const PRINT_TRANSLATIONS = {
  en: {
    invoice: 'INVOICE',
    dailyReport: 'DAILY CLOSING REPORT',
    date: 'Date',
    time: 'Time',
    customer: 'Customer',
    phone: 'Phone',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    amount: 'Amount',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    paid: 'Paid',
    due: 'Due',
    footer: 'Thank you for your business!',
    invoiceId: 'Invoice ID',
    address: 'Address',
    collectedBy: 'Collected By',
    closingSummary: 'Closing Summary',
    cashInHand: 'Cash in Hand',
    bkash: 'bKash Balance',
    nagad: 'Nagad',
    bank: 'Bank',
    expenses: 'Expenses',
    totalSales: 'Total Sales',
    cashReceived: 'Cash Received',
    status: 'Status',
    closed: 'CLOSED',
    itemsCount: 'Items',
    retailSale: 'Retail Sale',
    cashSales: 'Cash Sales',
    dueSales: 'Due Sales',
    collection: 'Collection',
    totalCashReceived: 'Total Cash Received',
    expectedCash: 'Expected Cash',
    actualCash: 'Actual Cash (Cash in Hand)',
    discrepancyMatch: 'Everything is correct',
    discrepancyPlus: 'Extra',
    discrepancyMinus: 'Discrepancy',
    noteDetails: 'Denominations',
    noNotes: 'No data available',
    digitalBalance: 'Digital Balance',
    additionalNotes: 'Additional Notes',
    printedAt: 'Printed At',
    balanceSummary: 'Balance Summary',
    prevBalance: 'Prev. Balance',
    todayBill: 'Today Bill',
    totalPayable: 'Total Payable',
    todayPaid: 'Today Paid',
    currentBalance: 'Current Due',
    mobile: 'Mobile'
  },
  bn: {
    invoice: 'ইনভয়েস',
    dailyReport: 'দৈনিক ক্লোজিং রিপোর্ট',
    date: 'তারিখ',
    time: 'সময়',
    customer: 'ক্রেতা',
    phone: 'ফোন',
    item: 'আইটেম',
    qty: 'পরিমাণ',
    price: 'দর',
    amount: 'মোট',
    total: 'মোট',
    subtotal: 'সাবটোটাল',
    discount: 'ডিসকাউন্ট',
    grandTotal: 'সর্বমোট বিল',
    paid: 'আজকের জমা',
    due: 'বাকি পরিমাণ',
    footer: 'Thank you for shopping with us!',
    invoiceId: 'আইডি',
    address: 'ঠিকানা',
    collectedBy: 'সংগ্রহকারী',
    closingSummary: 'ক্লোজিং সারাংশ',
    cashInHand: 'ক্যাশ ইন হ্যান্ড',
    bkash: 'বিকাশ/অনলাইন ব্যালেন্স',
    nagad: 'নগদ ক্যাশ (Nagad)',
    bank: 'ব্যাংক',
    expenses: 'খরচ',
    totalSales: 'মোট পণ্য বিক্রয়',
    cashReceived: 'নগদ গ্রহণ',
    status: 'অবস্থা',
    closed: 'বন্ধ',
    itemsCount: 'আইটেম সংখ্যা',
    retailSale: 'Walk-in Customer',
    cashSales: 'নগদ বিক্রয়',
    dueSales: 'বাকি বিক্রয়',
    collection: 'বাকি আদায় (Collection)',
    totalCashReceived: 'মোট নগদ প্রাপ্তি',
    expectedCash: 'হিসাব অনুযায়ী নগদ (Expected)',
    actualCash: 'ক্যাশ ইন হ্যান্ড (Actual)',
    discrepancyMatch: 'হিসাব একদম সঠিক আছে',
    discrepancyPlus: 'অতিরিক্ত+',
    discrepancyMinus: 'ঘাটতি',
    noteDetails: 'নোটের বিবরণ',
    noNotes: 'কোন তথ্য ডিটেইলস নেই',
    digitalBalance: 'ডিজিটাল ব্যালেন্স',
    additionalNotes: 'অতিরিক্ত নোট',
    printedAt: 'প্রিন্ট হয়েছে',
    balanceSummary: 'ব্যালেন্স সামারি',
    prevBalance: 'পূর্বের বাকি',
    todayBill: 'আজকের বিল',
    totalPayable: 'মোট প্রদেয়',
    todayPaid: 'আজকের পরিশোধ',
    currentBalance: 'বর্তমান মোট বাকি',
    mobile: 'মোবাইল'
  }
};

interface Product {
  id: string;
  serialNumber: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: 'kg' | 'unit';
  barcode: string;
  expiryDate?: string;
  location?: string;
  department?: string;
  warehouse?: string;
  imageUrl?: string;
}

interface StockRecord {
  id: string;
  productId: string;
  quantity: number;
  type: 'add' | 'sale' | 'return' | 'adjustment';
  timestamp: any;
  expiryDate?: string;
  batchNumber?: string;
  location?: string;
  note?: string;
}

interface CartItem extends Product {
  quantity: number;
  originalPrice: number;
  discountedPrice: number;
}

interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: { productId: string; productName: string; quantity: number; price: number; originalPrice: number; cost: number; unit?: string }[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  previousBalance?: number;
  paymentMethod: 'cash' | 'due';
  timestamp: any;
  sellerId: string;
}

interface Customer {
  id: string;
  serialNumber: number;
  name: string;
  phone: string;
  address?: string;
  fatherName?: string;
  houseName?: string;
  points: number;
  totalSpent: number;
  currentDue: number;
  dueDate?: string;
}

interface DailyClosing {
  id: string;
  date: string;
  totalSales: number;
  cashSales: number;
  dueSales: number;
  collections: number;
  totalExpenses: number;
  cashInHand: number;
  bkashBalance: number;
  denominations: {
    [key: string]: number;
  };
  notes?: string;
  timestamp: any;
}

interface Expense {
  id: string;
  category: 'salary' | 'rent' | 'electricity' | 'internet' | 'food' | 'others';
  amount: number;
  description: string;
  timestamp: any;
  staffId?: string;
}

interface Investment {
  id: string;
  amount: number;
  description: string;
  timestamp: any;
}

interface StaffSalary {
  id: string;
  staffName: string;
  amount: number;
  month: string;
  timestamp: any;
}

interface Category {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email?: string;
  salary: number;
  joiningDate?: string;
  schedule?: string;
  status: 'active' | 'inactive';
}

interface RecycleItem {
  id: string;
  entityType: 'product' | 'sale' | 'customer' | 'expense' | 'stockRecord' | 'employee' | 'investment' | 'salary' | 'daily_closing' | 'user';
  originalId: string;
  data: any;
  deletedAt: any;
  deletedBy: string;
  expiresAt: any;
}

import { FIXED_CATEGORIES } from './Categories'; //�. পশু স�. বিড়াল পরিচর্যা", " সরঞ্জাম", "৬৬. শিক্ষা সামগ্রী",
//   "৬৭. পোশাক", "৬৮. পুরুষদের পোশাক", "৬৯. নারীদের পোশাক", "৭০. শিশুদের পোশাক", "৭১. ফ্যাশন আনুষঙ্গিক",
//   "৭২. খেলনা ও বিনোদন", "৭৩. ক্রীড়া সামগ্রী", "৭৪. আউটডোর সামগ্রী",
//   "৭৫. পোষা প্রাণী", "৭৬. কুকুর পরিচর্যা", "৭৭. বিড়াল পরিচর্যা", "৭৮. পাখি পরিচর্যা", "৭৯. মাছ পরিচর্যা",
//   "৮০. গবাদি পশু", "৮১. গরু পরিচর্যা", "৮২. ছাগল পরিচর্যা", "৮৩. ভেড়া পরিচর্যা", "৮৪. হাঁস-মুরগি পরিচর্যা", "৮৫. পশু স্বাস্থ্য",
//   "৮৬. কৃষি", "৮৭. বীজ ও চারা", "৮৮. সার ও মাটি উন্নয়ন", "৮৯. কৃষি সরঞ্জাম", "৯০. বাগান পরিচর্যা",
//   "৯১. ভ্রমণ ও আউটডোর", "৯২. উপহার সামগ্রী", "৯৩. ধর্মীয় সামগ্রী", "৯৪. মৌসুমি পণ্য", "৯৫. উৎসব সামগ্রী", "৯৬. বিশেষ অফার বিভাগ", "৯৭. নতুন আগমন", "৯৮. জনপ্রিয় বিভাগ", "৯৯. স্থানীয় পণ্য", "১০০. আমদানিকৃত পন্য"
// ];

// --- Utilities ---
const toBengaliNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
};

const safeDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') return new Date(timestamp);
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  return new Date(timestamp);
};

const generateInvoiceId = (): string => {
  const now = new Date();
  // Formula: time (h:mm) + date (dd) + month (MM) + year (yy)
  // Example: 9:29 on 24th April 2026 -> 929240426
  return format(now, 'hmmddMMyy');
};

const formatCurrency = (amount: number | undefined | null): string => {
  const safeAmount = amount || 0;
  return `TK ${toBengaliNumber(safeAmount.toFixed(2))}`;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const moveToRecycleBin = async (entityType: RecycleItem['entityType'], originalId: string, data: any) => {
  try {
    const deletedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Clean data of any Firestore specific objects if necessary, though addDoc handles Date/Timestamp
    const recycleItem: Omit<RecycleItem, 'id'> = {
      entityType,
      originalId,
      data,
      deletedAt,
      expiresAt,
      deletedBy: auth.currentUser?.uid || 'unknown'
    };
    
    await addDoc(collection(db, 'recycleBin'), recycleItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'recycleBin');
  }
};
const printDailyClosing = (closing: DailyClosing, settings: ShopSettings, user?: any) => {
  const lang = settings.printLanguage || 'bn';
  const t = PRINT_TRANSLATIONS[lang];
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatVal = (num: number) => lang === 'bn' ? toBengaliNumber((num || 0).toFixed(2)) : (num || 0).toFixed(2);
  const formatDate = (dateStr: string) => lang === 'bn' ? toBengaliNumber(dateStr) : dateStr;
  const formatDateTime = (date: Date) => lang === 'bn' ? toBengaliNumber(format(date, 'dd/MM/yyyy hh:mm a')) : format(date, 'dd/MM/yyyy hh:mm a');
  
  const expectedCash = (closing.cashSales || 0) + (closing.collections || 0) - (closing.totalExpenses || 0);
  const discrepancy = (closing.cashInHand || 0) - expectedCash;

  const denominationsHtml = Object.entries(closing.denominations)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(([val, count]) => `
      <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; border-bottom: 0.5px solid #000;">
        <span>${lang === 'bn' ? toBengaliNumber(val) : val} x ${lang === 'bn' ? toBengaliNumber(count) : count}</span>
        <span style="font-weight: 700;">= ${formatVal(parseInt(val) * count)}</span>
      </div>
    `).join('');

  const userName = user?.displayName || user?.name || user?.username || t.collectedBy || 'Admin';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${t.dailyReport} - ${closing.date}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${lang === 'bn' ? "'Hind Siliguri', sans-serif" : "'Inter', sans-serif"};
            width: ${settings.receiptWidth || '58mm'};
            max-width: 100%;
            margin: 0 auto; 
            padding: 2mm 0; 
            font-size: 11px; 
            line-height: 1.2;
            color: #000 !important;
          }
          .header { text-align: center; margin-bottom: 6px; border-bottom: 1.5px solid #000; padding-bottom: 4px; }
          .logo { max-width: 25mm; max-height: 15mm; margin: 0 auto 3px auto; display: block; }
          .shop-name { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 1px; color: #000 !important; }
          .shop-info { font-size: 12px; margin-bottom: 0px; color: #000 !important; font-weight: 500; }
          .report-title { font-size: 11px; font-weight: 700; background: #000 !important; color: #fff !important; display: inline-block; padding: 2px 8px; margin-top: 4px; border-radius: 3px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          
          .section { margin-bottom: 6px; page-break-inside: avoid; }
          .section-title { font-weight: 800; border-bottom: 1.5px solid #000; margin-bottom: 3px; font-size: 11px; text-transform: uppercase; display: flex; justify-content: space-between; padding-bottom: 2px; color: #000 !important; }
          
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; padding-bottom: 2px; border-bottom: 1px solid #000; color: #000 !important; }
          .row.bold { font-weight: 700; font-size: 11px; border-bottom: 1.5px solid #000; }
          .row.highlight { font-weight: 800; border-bottom: 1.5px solid #000; border-top: 1.5px solid #000; padding: 4px 0; margin-top: 4px; }
          
          .grand-total { font-size: 14px; font-weight: 800; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 0; margin-top: 4px; }
          
          .footer { text-align: center; margin-top: 10px; font-size: 11px; border-top: 1px dashed #000; padding-top: 6px; page-break-inside: avoid; color: #000 !important; }
          .cash-table { width: 100%; margin-top: 4px; border: 1.5px solid #000; padding: 4px; }
          
          @media print {
            @page { margin: 0; }
            body { width: 100%; padding: 4mm 2mm; margin: 0; }
            html, body {
               height: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.logoBase64 ? `<img src="${settings.logoBase64}" class="logo" />` : ''}
          <div class="shop-name">${settings.name}</div>
          <div class="shop-info">${settings.address}</div>
          <div class="report-title">${t.dailyReport}</div>
          <div style="margin-top: 4px; font-weight: 700;">${t.date}: ${formatDate(closing.date)}</div>
          <div style="margin-top: 2px; font-weight: 600;">Printed By: ${userName}</div>
        </div>

        <div class="section">
          <div class="section-title"><span>${lang === 'bn' ? 'বিক্রয় ও সংগ্রহ' : 'Sales & Collection'}</span></div>
          <div class="row"><span>${t.totalSales}:</span> <span>${formatVal(closing.totalSales)}</span></div>
          <div class="row"><span>${t.cashSales}:</span> <span>${formatVal(closing.cashSales)}</span></div>
          <div class="row"><span>${t.dueSales}:</span> <span>${formatVal(closing.dueSales)}</span></div>
          <div class="row"><span>${t.collection}:</span> <span>${formatVal(closing.collections)}</span></div>
          <div class="row highlight">
            <span>${t.totalCashReceived}:</span> <span>${formatVal((closing.cashSales || 0) + (closing.collections || 0))}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title"><span>${t.expenses}</span></div>
          <div class="row" style="font-weight: 700;">
            <span>${t.expenses}:</span> <span>- ${formatVal(closing.totalExpenses)}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title"><span>${t.closingSummary}</span></div>
          <div class="row"><span>${t.expectedCash}:</span> <span>${formatVal(expectedCash)}</span></div>
          <div class="row bold grand-total">
            <span>${t.actualCash}:</span> <span>${formatVal(closing.cashInHand)}</span>
          </div>
          <div style="text-align: right; font-weight: 800; font-size: 11px; margin-top: 5px;">
            ${discrepancy === 0 ? t.discrepancyMatch : discrepancy > 0 ? `${t.discrepancyPlus}: ${formatVal(discrepancy)}` : `${t.discrepancyMinus}: ${formatVal(discrepancy)}`}
          </div>
          
          <div class="cash-table">
            <div style="font-weight: 800; border-bottom: 1.5px solid #000; margin-bottom: 6px; padding-bottom: 3px; font-size: 11px;">${t.noteDetails}:</div>
            ${denominationsHtml || `<div style="text-align: center; padding: 10px; color: #000; font-weight: 600;">${t.noNotes}</div>`}
          </div>
        </div>

        <div class="section">
          <div class="section-title"><span>${t.digitalBalance}</span></div>
          <div class="row"><span>${t.bkash}:</span> <span>${formatVal(closing.bkashBalance)}</span></div>
        </div>

        ${closing.notes ? `
          <div class="section">
            <div class="section-title"><span>${t.additionalNotes}</span></div>
            <div style="font-size: 11px; white-space: pre-wrap; padding: 10px; border: 1.5px solid #000;">${closing.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          ${t.printedAt}: ${formatDateTime(new Date())}<br>
          <div style="margin-top: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase;">${settings.name}</div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 1500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const printInvoice = (sale: Sale, settings: ShopSettings) => {
  const lang = settings.printLanguage || 'bn';
  const t = PRINT_TRANSLATIONS[lang];
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatVal = (num: number) => lang === 'bn' ? toBengaliNumber((num || 0).toFixed(2)) : (num || 0).toFixed(2);
  const formatDate = (date: Date) => lang === 'bn' ? toBengaliNumber(format(date, 'dd/MM/yy')) : format(date, 'dd/MM/yy');
  const formatTime = (date: Date) => lang === 'bn' ? toBengaliNumber(format(date, 'HH:mm')) : format(date, 'HH:mm');

  const itemsHtml = sale.items.map(item => {
    let qSuffix = '';
    if (item.unit === 'unit') {
      qSuffix = lang === 'bn' ? ' পিস' : ' p';
    } else if (item.unit === 'kg') {
      if (item.quantity >= 1) {
        qSuffix = lang === 'bn' ? ' কেজি' : ' K';
      } else {
        qSuffix = lang === 'bn' ? ' গ্রাম' : ' g';
      }
    }
    
    return `
    <tr>
      <td style="padding: 2px 0; vertical-align: top;">
        <div style="font-weight: 500; font-size: 11px;">${item.productName}</div>
      </td>
      <td style="padding: 2px 0; text-align: center; vertical-align: top; font-size: 11px;">
        ${lang === 'bn' ? toBengaliNumber(item.quantity.toString()) : item.quantity}${qSuffix}
      </td>
      <td style="padding: 2px 0; text-align: right; vertical-align: top; font-size: 11px;">
        ${formatVal(item.price)}
      </td>
      <td style="padding: 2px 0; text-align: right; vertical-align: top; font-size: 11px; font-weight: 600;">
        ${formatVal(item.price * item.quantity)}
      </td>
    </tr>`;
  }).join('');

  const width = settings.receiptWidth || '58mm';
  const changeAmount = Math.max(0, (sale.paidAmount || 0) - (sale.finalAmount || 0));
  const previousBalance = sale.previousBalance || 0;

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <title>${t.invoice} #${sale.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${lang === 'bn' ? "'Hind Siliguri', sans-serif" : "'Inter', sans-serif"};
            width: ${width}; 
            max-width: 100%;
            margin: 0 auto; 
            padding: 2mm 0; 
            font-size: 11px; 
            line-height: 1.2;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 2px; }
          .logo { max-width: 25mm; max-height: 15mm; margin: 0 auto 2px auto; display: block; }
          .shop-name { font-size: 18px; font-weight: 800; margin-bottom: 1px; color: #000 !important; }
          .shop-info { font-size: 13px; margin-bottom: 0px; color: #000 !important; font-weight: 600; line-height: 1.3; }
          
          .divider { border-bottom: 1.5px solid #000; margin: 2px 0; }
          .dashed-divider { border-bottom: 1px dashed #000; margin: 2px 0; }
          
          .meta-grid { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; font-weight: 500; color: #000 !important; }
          .meta-left { display: flex; flex-direction: column; gap: 1px; }
          .meta-right { text-align: right; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 2px; color: #000 !important; }
          th { font-size: 11px; text-align: left; padding: 2px 0; font-weight: 800; color: #000 !important; border-bottom: 1.5px solid #000;}
          td { padding: 2px 0; border-bottom: 1px solid #000; font-weight: 500; }
          
          .totals { font-size: 12px; margin-top: 2px; page-break-inside: avoid; color: #000 !important; font-weight: 600; }
          .total-row { display: flex; justify-content: space-between; margin: 1px 0; }
          .grand-total { display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; margin: 2px 0; }
          
          .due-amount { text-align: center; font-weight: 800; font-size: 13px; margin: 2px 0; color: #000 !important; }
          
          .footer { text-align: center; font-size: 13px; line-height: 1.2; color: #000 !important; font-weight: 700; margin-top: 4px; page-break-inside: avoid; }
          
          @media print {
            @page { margin: 0; }
            body { width: 100%; padding: 4mm 2mm; margin: 0; }
            html, body {
               height: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.logoBase64 ? `<img src="${settings.logoBase64}" class="logo" />` : ''}
          <div class="shop-name">${settings.name}</div>
          <div class="shop-info">${settings.address}</div>
          ${settings.phone ? `<div class="shop-info">${t.mobile}: ${lang === 'bn' ? toBengaliNumber(settings.phone) : settings.phone}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="meta-grid">
          <div class="meta-left">
            <span><strong>${t.invoiceId}:</strong> #${lang === 'bn' ? toBengaliNumber(sale.id) : sale.id}</span>
            <span><strong>${t.customer}:</strong> ${sale.customerName || t.retailSale}${sale.customerPhone ? `<br><strong>${t.phone}:</strong> ${lang === 'bn' ? toBengaliNumber(sale.customerPhone) : sale.customerPhone}` : ''}</span>
          </div>
          <div class="meta-right">
            <span>${formatDate(safeDate(sale.timestamp))} ${formatTime(safeDate(sale.timestamp))}</span>
          </div>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%;">${t.item}</th>
              <th style="width: 15%; text-align: center;">${t.qty}</th>
              <th style="width: 15%; text-align: right;">${t.price}</th>
              <th style="width: 20%; text-align: right;">${t.amount}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="4" style="padding: 0;"><div class="divider" style="margin: 0;"></div></td></tr>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div class="total-row">
            <span>${t.subtotal}:</span>
            <span>${formatVal(sale.totalAmount)}</span>
          </div>
          
          ${sale.discount > 0 ? `
          <div class="total-row">
            <span>${t.discount}:</span>
            <span>- ${formatVal(sale.discount)}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="grand-total">
            <span>${t.grandTotal}:</span>
            <span>${formatVal(sale.finalAmount)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="total-row">
            <span>${t.paid}:</span>
            <span>${formatVal(sale.paidAmount)}</span>
          </div>
          
          <div class="divider"></div>
        </div>

        <div class="due-amount">
          ${t.due}: ${formatVal(sale.finalAmount - (sale.paidAmount || 0))}
        </div>
        
        ${sale.customerId ? `
        <div class="dashed-divider"></div>
        <div style="font-size: 10px; font-weight: 500; margin-top: 4px;">
          <div style="text-align: center; font-weight: 700; margin-bottom: 2px;">${t.balanceSummary}</div>
          <div style="display: flex; justify-content: space-between;"><span>${t.prevBalance}:</span> <span>${formatVal(previousBalance)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>${t.todayBill}:</span> <span>${formatVal(sale.finalAmount)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>${t.todayPaid}:</span> <span>- ${formatVal(sale.paidAmount)}</span></div>
          <div class="divider" style="margin: 2px 0;"></div>
          <div style="display: flex; justify-content: space-between; font-weight: 700;"><span>${t.currentBalance}:</span> <span>${formatVal(sale.finalAmount + previousBalance - (sale.paidAmount || 0))}</span></div>
        </div>
        ` : ''}

        <div class="dashed-divider"></div>

        <div class="footer">
          <div>${settings.receiptFooter ? settings.receiptFooter.replace(/\n/g, '<br>') : t.footer}</div>
        </div>
      </body>
      <script>
        window.onload = () => {
          window.print();
          setTimeout(() => window.close(), 1500);
        };
      </script>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

const callWhatsAppApi = async (phone: string, message: string, settings: ShopSettings) => {
  const method = settings.waGatewayType || 'manual';
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `880${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

  if (method !== 'manual' && settings.waToken) {
    try {
      let finalResponse;
      if (method === 'metacloud' && settings.waPhoneNumberId) {
        const url = `https://graph.facebook.com/v20.0/${settings.waPhoneNumberId}/messages`;
        finalResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.waToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "text",
            text: { body: message }
          })
        });
      } else if (method === 'generic' && settings.waApiUrl) {
        let body: any = {};
        if (settings.waApiUrl?.includes('ultramsg')) {
          body = { token: settings.waToken, to: formattedPhone, body: message };
        } else {
          body = { instance: settings.waInstanceId, token: settings.waToken, to: formattedPhone, message };
        }
        finalResponse = await fetch(settings.waApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      if (finalResponse) {
        const result = await finalResponse.json();
        if (finalResponse.ok) {
          return { success: true, result };
        } else {
          return { success: false, error: result };
        }
      }
    } catch (error) {
      return { success: false, error };
    }
  }

  // Fallback to manual
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    window.open(`https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, '_blank');
  }
  return { success: true, fallback: true };
};

const sendWhatsAppInvoice = async (sale: Sale, settings: ShopSettings, lang: 'en' | 'bn' = 'en') => {
  if (!sale.customerPhone) return;
  
  const template = lang === 'bn' ? (settings.waTemplateBengali || "") : (settings.waTemplateEnglish || "");
  
  // Prepare variables
  const variables: { [key: string]: string } = {
    '{{customerName}}': sale.customerName || 'Customer',
    '{{shopName}}': settings.name || 'Shop',
    '{{invoiceId}}': sale.id,
    '{{totalAmount}}': sale.finalAmount.toString(),
    '{{discount}}': sale.discount ? sale.discount.toString() : '0',
    '{{paidAmount}}': sale.paidAmount.toString(),
    '{{dueAmount}}': (sale.finalAmount - sale.paidAmount).toString(),
    '{{items}}': sale.items.map(item => `• ${item.productName}: ${item.quantity} x ${item.price}`).join('\n')
  };

  // Replace variables
  let message = template;
  Object.keys(variables).forEach(key => {
    message = message.replace(new RegExp(key, 'g'), variables[key]);
  });

  // Fallback if template is not configured or just too simple
  if (!template || message === template) {
    const itemsText = sale.items.map(item => `• ${item.productName}: ${item.quantity} x ${item.price} = ${item.price * item.quantity}`).join('\n');
    const previousBalance = sale.previousBalance || 0;
    const currentDue = sale.finalAmount - sale.paidAmount;
    message = `*আমাদের স্টোর ${settings.name} থেকে ইনভয়েস*\n` +
      `ইনভয়েস: #${sale.id}\n` +
      `তারিখ: ${format(safeDate(sale.timestamp), 'dd/MM/yyyy')}\n\n` +
      `*আইটেমসমূহ:*\n${itemsText}\n\n` +
      `--------------------------\n` +
      `*টোটাল প্রোডাক্ট বিল:* TK ${sale.totalAmount}\n` +
      `*ডিসকাউন্ট:* TK ${sale.discount}\n` +
      `*গ্র্যান্ড টোটাল:* TK ${sale.finalAmount}\n` +
      `*আজকের জমা:* TK ${sale.paidAmount}\n` +
      `--------------------------\n` +
      `*পূর্বের বাকি:* TK ${previousBalance}\n` +
      `*আজকের বিল:* TK ${sale.finalAmount}\n` +
      `*টোটাল বাকি:* TK ${(sale.finalAmount + previousBalance - (sale.paidAmount || 0))}\n\n` +
      `আপনার কেনাকাটার জন্য ধন্যবাদ!`;
  }

  const result = await callWhatsAppApi(sale.customerPhone, message, settings);
  if (!result.fallback) {
    if (result.success) {
      console.log('✅ WhatsApp invoice sent automatically.');
    } else {
      console.error('❌ Automatic delivery failed:', result.error);
    }
  }
};

const testWhatsAppConnection = async (settings: ShopSettings) => {
  if (!settings.waToken) {
    alert('Please enter an API Token first!');
    return;
  }
  
  const testPhone = prompt('Enter a WhatsApp number to test (with country code, e.g., 88017...):');
  if (!testPhone) return;

  const msg = 'MasterShop WhatsApp Automation Test Message. Connection successful! ✅';
  const result = await callWhatsAppApi(testPhone, msg, settings);
  
  if (result.fallback) {
    alert('Opened manual WhatsApp window (Background API may not be completely configured).');
  } else if (result.success) {
    alert('Test Message Sent Successfully in the background!');
  } else {
    alert('Failed to send test message: ' + JSON.stringify(result.error));
  }
};

const downloadInvoicePDF = (sale: Sale, settings: ShopSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.text(settings.name, pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(settings.address, pageWidth / 2, 28, { align: 'center' });
  if (settings.phone) doc.text(`Phone: ${settings.phone}`, pageWidth / 2, 34, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(20, 40, pageWidth - 20, 40);

  // Invoice Info
  doc.setFontSize(12);
  doc.text(`Invoice: #${sale.id}`, 20, 50);
  doc.text(`Date: ${format(safeDate(sale.timestamp), 'dd/MM/yyyy HH:mm')}`, pageWidth - 20, 50, { align: 'right' });
  doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 20, 58);
  if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`, 20, 64);

  // Table
  const tableData = sale.items.map(item => [
    item.productName,
    (item.quantity || 0).toString(),
    (item.price || 0).toFixed(2),
    ((item.price || 0) * (item.quantity || 0)).toFixed(2)
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const changeAmount = Math.max(0, (sale.paidAmount || 0) - (sale.finalAmount || 0));
  const previousBalance = sale.previousBalance || 0;
  const newBalance = previousBalance + (sale.dueAmount || 0);

  // Totals
  doc.text(`Subtotal: TK ${(sale.totalAmount || 0).toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });
  doc.text(`Discount: TK ${(sale.discount || 0).toFixed(2)}`, pageWidth - 20, finalY + 6, { align: 'right' });
  doc.setFontSize(14);
  doc.text(`Grand Total: TK ${(sale.finalAmount || 0).toFixed(2)}`, pageWidth - 20, finalY + 14, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`Paid Today: TK ${(sale.paidAmount || 0).toFixed(2)}`, pageWidth - 20, finalY + 20, { align: 'right' });
  if (changeAmount > 0 && !sale.customerId) {
    doc.text(`Change Given: TK ${changeAmount.toFixed(2)}`, pageWidth - 20, finalY + 26, { align: 'right' });
  }
  doc.text(`REMAINING DUE: TK ${(sale.finalAmount + previousBalance - (sale.paidAmount || 0)).toFixed(2)}`, pageWidth - 20, finalY + (changeAmount > 0 && !sale.customerId ? 32 : 26), { align: 'right' });

  if (sale.customerId) {
    const balanceY = finalY + (changeAmount > 0 && !sale.customerId ? 42 : 36);
    doc.setFontSize(11);
    doc.text('Customer Balance Summary', pageWidth - 20, balanceY, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Today's Bill: TK ${(sale.finalAmount || 0).toFixed(2)}`, pageWidth - 20, balanceY + 6, { align: 'right' });
    doc.text(`Previous Due: TK ${previousBalance.toFixed(2)}`, pageWidth - 20, balanceY + 12, { align: 'right' });
    doc.text(`Total Before Payment: TK ${(sale.finalAmount + previousBalance).toFixed(2)}`, pageWidth - 20, balanceY + 18, { align: 'right' });
    doc.text(`Payment Today: TK ${(sale.paidAmount || 0).toFixed(2)}`, pageWidth - 20, balanceY + 24, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`TOTAL REMAINING: TK ${(sale.finalAmount + previousBalance - (sale.paidAmount || 0)).toFixed(2)}`, pageWidth - 20, balanceY + 32, { align: 'right' });
  }

  const footerText = settings.receiptFooter || "Thank you for shopping with us!\nPowered by ShopMaster";
  const footerLines = footerText.split('\n');
  footerLines.forEach((line, index) => {
    doc.text(line, pageWidth / 2, finalY + 70 + (index * 6), { align: 'center' });
  });

  doc.save(`Invoice_${sale.id}.pdf`);
};

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      try {
        const parsed = JSON.parse(event.error.message);
        if (parsed.error) {
          setHasError(true);
          setErrorInfo(parsed.error);
        }
      } catch {
        // Not a firestore error
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{errorInfo || "An unexpected error occurred."}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function SettingsPanel({ settings, onSaveSettings, users, onAddUser, onDeleteUser }: { settings: ShopSettings, onSaveSettings: (s: ShopSettings) => void, users: AppUser[], onAddUser: (u: Omit<AppUser, 'id'>) => void, onDeleteUser: (id: string) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'shop' | 'users'>('shop');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setConfirmDeleteId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const logoFile = (form.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
    
    let logoBase64 = settings.logoBase64;
    if (logoFile) {
      logoBase64 = await fileToBase64(logoFile);
    }

    onSaveSettings({
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      logoUrl: formData.get('logoUrl') as string,
      logoBase64: logoBase64,
      whatsappSender: formData.get('whatsappSender') as string,
      waGatewayType: formData.get('waGatewayType') as any,
      waApiUrl: formData.get('waApiUrl') as string,
      waInstanceId: formData.get('waInstanceId') as string,
      waPhoneNumberId: formData.get('waPhoneNumberId') as string,
      waToken: formData.get('waToken') as string,
      autoSendWhatsApp: formData.get('autoSendWhatsApp') === 'on',
      receiptWidth: formData.get('receiptWidth') as '58mm' | '80mm',
      receiptFooter: formData.get('receiptFooter') as string,
      waTemplateEnglish: formData.get('waTemplateEnglish') as string,
      waTemplateBengali: formData.get('waTemplateBengali') as string,
      printLanguage: formData.get('printLanguage') as 'en' | 'bn',
    });
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    onAddUser({
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      displayName: formData.get('displayName') as string,
      role: formData.get('role') as UserRole,
    });
    form.reset();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Settings & Admin</h2>
        <p className="text-gray-500">Manage your shop profile and team access.</p>
      </header>

      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveSubTab('shop')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${activeSubTab === 'shop' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
        >
          Shop Profile
        </button>
        <button 
          onClick={() => setActiveSubTab('users')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${activeSubTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
        >
          User Management
        </button>
      </div>

      {activeSubTab === 'shop' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Shop Information
          </h3>
          <form onSubmit={handleShopSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-24 h-24 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                  {settings.logoBase64 ? (
                    <img src={settings.logoBase64} alt="Shop Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-900 mb-1">Shop Logo</label>
                  <p className="text-xs text-gray-500 mb-3">Upload your shop logo (PNG/JPG)</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                <input name="name" defaultValue={settings.name || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input name="phone" defaultValue={settings.phone || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea name="address" defaultValue={settings.address || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (Optional)</label>
                <input name="logoUrl" defaultValue={settings.logoUrl || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Sender Number (Optional)</label>
                <input name="whatsappSender" defaultValue={settings.whatsappSender || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="88017..." />
              </div>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Free Automation Guide (বিনা খরচে অটোমেশন)
                </h4>
                <div className="space-y-4 text-sm text-indigo-800">
                  <div className="bg-white/50 p-3 rounded-lg border border-indigo-100">
                    <p className="font-bold mb-1">১. মেটা ক্লাউড এপিআই (Official Free):</p>
                    <p className="text-xs">মেটার নিজস্ব সার্ভিস। মাসে ১,০০০ মেসেজ ফ্রি। সেটআপ করতে <a href="https://developers.facebook.com/" target="_blank" className="underline text-indigo-600 font-bold">Meta Developers</a> এ যান।</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg border border-indigo-100">
                    <p className="font-bold mb-1">২. নিজের ফোন ব্যবহার (Self-Hosted):</p>
                    <p className="text-xs">আপনার অ্যান্ড্রয়েড ফোনে "WhatsApp Gateway" অ্যাপ ব্যবহার করে আপনার নাম্বার থেকেই অটোমেটিক মেসেজ পাঠাতে পারবেন।</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Print Language (প্রিন্টিং ভাষা)</label>
                <select name="printLanguage" defaultValue={settings.printLanguage || 'bn'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="bn">Bengali (বাংলা)</option>
                  <option value="en">English (ইংরেজি)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Sending Method</label>
                <select name="waGatewayType" defaultValue={settings.waGatewayType || 'manual'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="manual">Manual (Free, requires 1-Click)</option>
                  <option value="metacloud">Meta Cloud API (Official, 1000 Free/Month, Automatic)</option>
                  <option value="generic">Third-Party Gateway (Paid, Automatic)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp API Token / Key</label>
                <p className="text-[10px] text-gray-400 mb-2">Access Token for Meta or Token for Gateway</p>
                <input name="waToken" defaultValue={settings.waToken} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID (Meta Cloud Only)</label>
                <input name="waPhoneNumberId" defaultValue={settings.waPhoneNumberId} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Template (English)</label>
                <textarea 
                  name="waTemplateEnglish" 
                  defaultValue={settings.waTemplateEnglish || ""} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  placeholder="Use {{customerName}}, {{shopName}}, {{invoiceId}}, {{totalAmount}}, {{discount}}, {{paidAmount}}, {{dueAmount}}, {{items}}"
                />
                <p className="text-xs text-gray-400 mt-1">Available: {"{{customerName}}, {{shopName}}, {{invoiceId}}, {{totalAmount}}, {{discount}}, {{paidAmount}}, {{dueAmount}}, {{items}}"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Template (Bengali)</label>
                <textarea 
                  name="waTemplateBengali" 
                  defaultValue={settings.waTemplateBengali || ""} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  placeholder="Use {{customerName}}, {{shopName}}, {{invoiceId}}, {{totalAmount}}, {{discount}}, {{paidAmount}}, {{dueAmount}}, {{items}}"
                />
                <p className="text-xs text-gray-400 mt-1">Available: {"{{customerName}}, {{shopName}}, {{invoiceId}}, {{totalAmount}}, {{discount}}, {{paidAmount}}, {{dueAmount}}, {{items}}"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
                <textarea 
                  name="receiptFooter" 
                  defaultValue={settings.receiptFooter || "Thank you for shopping with us!\nPowered by ShopMaster"} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  placeholder="Enter custom text for invoice bottom..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API URL (Generic Only)</label>
                <input name="waApiUrl" defaultValue={settings.waApiUrl || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  name="autoSendWhatsApp" 
                  id="autoSendWhatsApp"
                  defaultChecked={settings.autoSendWhatsApp} 
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                />
                <label htmlFor="autoSendWhatsApp" className="text-sm font-bold text-gray-700">Enable Fully Automatic WhatsApp Invoicing</label>
              </div>
              <div className="md:col-span-2 flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">Test Your Setup</h4>
                  <p className="text-xs text-gray-500">Send a test message to verify your settings.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => testWhatsAppConnection(settings)}
                  className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Test Message
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Width</label>
                <select name="receiptWidth" defaultValue={settings.receiptWidth || '58mm'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="58mm">58mm (Small Thermal)</option>
                  <option value="80mm">80mm (Large Thermal)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
              <Save className="w-5 h-5" />
              Update Settings
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6">Add New User</h3>
            <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input name="displayName" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input name="username" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input name="password" type="password" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select name="role" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="manager">Manager</option>
                  <option value="assistant_manager">Assistant Manager</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="sales_team">Sales Team</option>
                </select>
              </div>
              <div className="lg:col-span-4 flex justify-end">
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Username</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{u.displayName}</td>
                    <td className="px-6 py-4 text-gray-600">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmDeleteId === u.id) {
                            onDeleteUser(u.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(u.id);
                          }
                        }}
                        className={`p-2 rounded-lg transition-all relative ${
                          confirmDeleteId === u.id 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-lg scale-110" 
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title={confirmDeleteId === u.id ? "Click again to confirm" : "Delete User"}
                      >
                        {confirmDeleteId === u.id ? (
                          <span className="text-[10px] font-bold px-1 animate-pulse">Confirm?</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RecycleBin({ items, onRestore }: { items: RecycleItem[], onRestore: (item: RecycleItem) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredItems = items.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const typeStr = item.entityType.toLowerCase();
    const dataStr = JSON.stringify(item.data).toLowerCase();
    return typeStr.includes(searchStr) || dataStr.includes(searchStr);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Recycle Bin</h2>
          <p className="text-gray-500">Items are kept for 30 days before permanent deletion.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search deleted items..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name/Description</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Deleted Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Auto Delete</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium">
                  No items found in the recycle bin.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const deletedDate = safeDate(item.deletedAt);
                const expiryDate = safeDate(item.expiresAt);
                const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                let displayName = "Unknown";
                if (item.entityType === 'product') displayName = item.data.name;
                if (item.entityType === 'sale') displayName = `Invoice #${item.data.id} - ${item.data.customerName || 'Walk-in'}`;
                if (item.entityType === 'customer') displayName = item.data.name;
                if (item.entityType === 'user') displayName = item.data.displayName;
                if (item.entityType === 'employee') displayName = item.data.name;
                if (item.entityType === 'expense') displayName = item.data.description;
                if (item.entityType === 'investment') displayName = item.data.description;
                if (item.entityType === 'salary') displayName = item.data.staffName;
                if (item.entityType === 'daily_closing') displayName = `Daily Closing - ${format(safeDate(item.data.timestamp), 'dd MMM yyyy')}`;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                        {item.entityType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{displayName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{format(deletedDate, 'dd MMM yyyy, hh:mm a')}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm ${daysRemaining <= 5 ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Cleaning up soon...'}
                        </span>
                        <span className="text-[10px] text-gray-400">{format(expiryDate, 'dd MMM yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onRestore(item)}
                        className="flex items-center gap-1 ml-auto px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all font-semibold text-xs border border-green-100"
                        title="Restore Item"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function App() {
  console.log("ShopMaster App Initializing...");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [stockRecords, setStockRecords] = useState<StockRecord[]>([]);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth State Sync
  useEffect(() => {
    // Try to sign in anonymously to satisfy security rules if enabled
    import('firebase/auth').then(({ signInAnonymously }) => {
      signInAnonymously(auth).catch(err => {
        console.warn("Anonymous auth failed, falling back to public mode", err.message);
      });
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const savedUser = localStorage.getItem('shopmaster_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error("Error parsing saved user", e);
        }
      } else if (!firebaseUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleItem[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    name: 'Bismillah Store',
    address: 'Your Shop Address',
    phone: '',
    receiptWidth: '58mm',
    receiptFooter: "Thank you for shopping with us!\nPowered by ShopMaster",
    waGatewayType: 'manual',
    autoSendWhatsApp: false,
    waTemplateEnglish: "Hello *{{customerName}}*, thank you for shopping at *{{shopName}}*! Your invoice #{{invoiceId}} total is TK {{totalAmount}}.",
    waTemplateBengali: "প্রিয় *{{customerName}}*, *{{shopName}}*-এ কেনাকাটা করার জন্য ধন্যবাদ! আপনার ইনভয়েস #{{invoiceId}} এর মোট পরিমাণ {{totalAmount}} টাকা।",
    printLanguage: 'bn'
  });
  
  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  
  // Auto-Cleanup logic for Recycle Bin (30 days)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (recycleBin.length === 0) return;

    const now = new Date();
    const expiredItems = recycleBin.filter(item => {
      const expiry = safeDate(item.expiresAt);
      return expiry <= now;
    });

    if (expiredItems.length > 0) {
      console.log(`Auto-cleaning ${expiredItems.length} expired items from Recycle Bin...`);
      expiredItems.forEach(async (item) => {
        try {
          // In actual production, you might want to batch this
          await deleteDoc(doc(db, 'recycleBin', item.id));
        } catch (e) {
          console.error("Auto-cleanup error for item", item.id, e);
        }
      });
    }
  }, [recycleBin, user]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Real-time Data Sync (Public/Auth-related)
  useEffect(() => {
    // We sync these even without auth to allow the login screen to function
    // Security is handled by allowing public read in firestore.rules
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAppUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
    }, (err) => console.error("Users sync error", err));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'shop'), (snapshot) => {
      if (snapshot.exists()) {
        setShopSettings(snapshot.data() as ShopSettings);
      }
    }, (err) => console.error("Settings sync error", err));

    return () => {
      unsubUsers();
      unsubSettings();
    };
  }, []);

  // Real-time Data Sync (Private/App-related)
  useEffect(() => {
    // We need the app user state to be ready
    if (!user) return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => console.error("Products sync error", err));

    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    }, (err) => console.error("Sales sync error", err));

    const unsubStock = onSnapshot(collection(db, 'stockRecords'), (snapshot) => {
      setStockRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockRecord)));
    }, (err) => console.error("Stock records sync error", err));

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => console.error("Customers sync error", err));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (err) => console.error("Categories sync error", err));

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    }, (err) => console.error("Expenses sync error", err));

    const unsubInvestments = onSnapshot(collection(db, 'investments'), (snapshot) => {
      setInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
    }, (err) => console.error("Investments sync error", err));

    const unsubStaffSalaries = onSnapshot(collection(db, 'staff_salaries'), (snapshot) => {
      setStaffSalaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffSalary)));
    }, (err) => console.error("Staff salaries sync error", err));

    const unsubDailyClosings = onSnapshot(collection(db, 'daily_closings'), (snapshot) => {
      setDailyClosings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyClosing)));
    }, (err) => console.error("Daily closing sync error", err));

    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (err) => console.error("Employees sync error", err));

    const unsubRecycleBin = onSnapshot(collection(db, 'recycleBin'), (snapshot) => {
      setRecycleBin(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecycleItem)));
    }, (err) => console.error("Recycle bin sync error", err));

    return () => {
      unsubProducts();
      unsubSales();
      unsubStock();
      unsubCustomers();
      unsubCategories();
      unsubExpenses();
      unsubInvestments();
      unsubStaffSalaries();
      unsubDailyClosings();
      unsubEmployees();
    };
  }, [user, auth.currentUser]);

  const handleDeleteDailyClosing = async (closing: DailyClosing) => {
    try {
      await moveToRecycleBin('daily_closing', closing.id, closing);
      await deleteDoc(doc(db, 'daily_closings', closing.id));
      setNotification({ message: 'Daily Closing moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'daily_closings');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    // Check against appUsers collection
    const foundUser = appUsers.find(u => u.username === username && u.password === password);

    if (foundUser) {
      const userData = { uid: foundUser.id, email: `${foundUser.username}@shop.com`, displayName: foundUser.displayName, role: foundUser.role };
      setUser(userData);
      localStorage.setItem('shopmaster_user', JSON.stringify(userData));
    } else if (username === 'Admin' && password === 'Admin') {
      const mockUser = { uid: 'admin-id', email: 'admin@shop.com', displayName: 'Admin', role: 'admin' };
      setUser(mockUser);
      localStorage.setItem('shopmaster_user', JSON.stringify(mockUser));
    } else {
      setAuthError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('shopmaster_user');
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      const isMasterAdmin = googleUser.email === "stratproamz@gmail.com";
      const existingAppUser = appUsers.find(u => u.username.toLowerCase() === googleUser.email?.split('@')[0].toLowerCase());
      
      const role = isMasterAdmin ? 'admin' : (existingAppUser?.role || 'sales_team');
      
      const userData = { 
        uid: googleUser.uid, 
        email: googleUser.email || '', 
        displayName: googleUser.displayName || googleUser.email?.split('@')[0] || 'Google User', 
        role 
      };
      
      setUser(userData);
      localStorage.setItem('shopmaster_user', JSON.stringify(userData));
      setNotification({ message: `Signed in as ${userData.displayName}`, type: 'success' });
    } catch (error: any) {
      console.error("Google login error", error);
      setAuthError(`Google Sign-In failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- POS Logic ---
  const calculateItemPrice = (product: Product, quantity: number) => {
    let price = product.price;
    
    // Custom logic for 1kg = 20 TK base
    // If base price is 20:
    // 0.5kg = 11
    // 0.25kg = 7
    // 2kg+ = 19 per kg (1 TK discount)
    
    const basePrice = product.price;

    if (product.unit === 'kg') {
      if (quantity >= 2) {
        // Bulk discount: 1 TK less per kg if 2kg or more
        price = basePrice - 1;
      } else if (quantity === 0.5) {
        // Half kg logic: if 1kg is 20, 0.5kg is 11
        // This is roughly (base/2) + 1
        price = (basePrice / 2) + 1;
      } else if (quantity === 0.25) {
        // 250g logic: if 1kg is 20, 0.25kg is 7
        // This is roughly (base/4) + 2
        price = (basePrice / 4) + 2;
      }
    } else if (product.unit === 'unit') {
      if (quantity >= 5) {
        price = basePrice - 1;
      }
    }
    
    return price;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        const newPrice = calculateItemPrice(product, newQty);
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: newQty, discountedPrice: newPrice } 
            : item
        );
      }
      const initialPrice = calculateItemPrice(product, 1);
      return [...prev, { ...product, quantity: 1, originalPrice: product.price, discountedPrice: initialPrice }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0.1, item.quantity + delta);
        // Only auto-calculate price if it hasn't been manually overridden
        // For simplicity, we'll re-calculate if delta is used, but allow manual override
        const newPrice = calculateItemPrice(item, newQty);
        return { ...item, quantity: newQty, discountedPrice: newPrice };
      }
      return item;
    }));
  };

  const updateCartQuantityManual = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, quantity);
        const newPrice = calculateItemPrice(item, newQty);
        return { ...item, quantity: newQty, discountedPrice: newPrice };
      }
      return item;
    }));
  };

  const updateCartPriceManual = (productId: string, price: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, discountedPrice: Math.max(0, price) };
      }
      return item;
    }));
  };

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0), [cart]);
  const finalTotal = Math.max(0, cartTotal - discount);

  const [checkoutData, setCheckoutData] = useState({
    customerId: '',
    walkInName: '',
    walkInPhone: '',
    paidAmount: 0,
    paymentMethod: 'cash' as 'cash' | 'due'
  });

  // Automatic Customer Selection
  useEffect(() => {
    if (checkoutData.walkInName || checkoutData.walkInPhone) {
      const matchingCustomer = customers.find(c => 
        (checkoutData.walkInName && c.name.toLowerCase() === checkoutData.walkInName.toLowerCase()) ||
        (checkoutData.walkInPhone && c.phone === checkoutData.walkInPhone)
      );
      if (matchingCustomer && checkoutData.customerId !== matchingCustomer.id) {
        setCheckoutData(prev => ({...prev, customerId: matchingCustomer.id}));
      }
    }
  }, [checkoutData.walkInName, checkoutData.walkInPhone, customers]);

  const handleCheckout = async (sendWhatsApp: boolean = false) => {
    if (cart.length === 0) return;

    try {
      const selectedCustomer = customers.find(c => c.id === checkoutData.customerId);
      const dueAmount = Math.max(0, finalTotal - checkoutData.paidAmount);

      // Revert old sale effects if editing
      if (editingSale) {
        for (const item of editingSale.items) {
          if (item.productId) {
            const productRef = doc(db, 'products', item.productId);
            await updateDoc(productRef, { stock: increment(item.quantity || 0) });
          }
        }
        if (editingSale.customerId) {
          const customerRef = doc(db, 'customers', editingSale.customerId);
          await updateDoc(customerRef, {
            currentDue: increment(-(editingSale.dueAmount || 0)),
            totalSpent: increment(-(editingSale.finalAmount || 0))
          });
        }
      }

      const saleData: any = {
        customerName: selectedCustomer?.name || checkoutData.walkInName || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || checkoutData.walkInPhone || '',
        items: cart.map(item => ({
          productId: item.id || '',
          productName: item.name || 'Unknown Product',
          quantity: item.quantity || 0,
          unit: item.unit || 'unit',
          price: item.discountedPrice || 0,
          originalPrice: item.originalPrice || 0,
          cost: item.cost || 0
        })),
        totalAmount: cartTotal,
        discount: discount,
        finalAmount: finalTotal,
        paidAmount: checkoutData.paidAmount || 0,
        dueAmount: dueAmount,
        previousBalance: selectedCustomer?.currentDue || 0,
        paymentMethod: checkoutData.paymentMethod,
        timestamp: editingSale ? editingSale.timestamp : new Date(),
        sellerId: auth.currentUser?.uid || 'unknown'
      };

      if (checkoutData.customerId) {
        saleData.customerId = checkoutData.customerId;
      } else {
        saleData.customerId = null;
      }

      let finalSale: Sale;
      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
        finalSale = { ...saleData, id: editingSale.id } as Sale;
      } else {
        const customId = generateInvoiceId();
        await setDoc(doc(db, 'sales', customId), saleData);
        finalSale = { ...saleData, id: customId } as Sale;
      }
      
      // Apply new sale effects
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, { stock: increment(-item.quantity) });
      }

      if (sendWhatsApp) {
        await sendWhatsAppInvoice(finalSale, shopSettings, 'bn');
      }

      if (checkoutData.customerId) {
        const customerRef = doc(db, 'customers', checkoutData.customerId);
        await updateDoc(customerRef, {
          currentDue: increment(finalTotal - checkoutData.paidAmount),
          totalSpent: increment(finalTotal)
        });
      }

      setLastSale(finalSale);
      setLastCompletedSale(finalSale);
      setNotification({ message: editingSale ? "Order updated successfully!" : "Order completed successfully!", type: 'success' });
      setCart([]);
      setDiscount(0);
      setCheckoutData({ customerId: '', walkInName: '', walkInPhone: '', paidAmount: 0, paymentMethod: 'cash' });
      setEditingSale(null);
      setShowReceiptModal(true);

      // Auto Send WhatsApp if customer has phone and auto-send is enabled
      if (finalSale.customerPhone && shopSettings.autoSendWhatsApp) {
        sendWhatsAppInvoice(finalSale, shopSettings, 'bn');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setNotification({ message: "Moving invoice to Recycle Bin and reverting balances...", type: 'info' });

      // Revert stock
      if (sale.items && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          if (item.productId) {
            try {
              const productRef = doc(db, 'products', item.productId);
              await updateDoc(productRef, { 
                stock: increment(Number(item.quantity) || 0) 
              });
            } catch (e) {
              console.warn(`Could not revert stock for product ${item.productId}:`, e);
            }
          }
        }
      }

      // Revert customer balance
      if (sale.customerId) {
        try {
          const customerRef = doc(db, 'customers', sale.customerId);
          await updateDoc(customerRef, {
            currentDue: increment(-(Number(sale.dueAmount) || 0)),
            totalSpent: increment(-(Number(sale.finalAmount) || 0))
          });
        } catch (e) {
          console.warn(`Could not revert balance for customer ${sale.customerId}:`, e);
        }
      }

      // Move to recycle bin
      await moveToRecycleBin('sale', sale.id, sale);

      // Delete original
      await deleteDoc(doc(db, 'sales', sale.id));

      setNotification({ message: "Invoice moved to Recycle Bin", type: 'success' });
    } catch (error) {
      console.error("Delete sale error:", error);
      setNotification({ message: `Failed to move invoice to Recycle Bin: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreRecycleItem = async (item: RecycleItem) => {
    try {
      setLoading(true);
      setNotification({ message: `Restoring ${item.entityType}...`, type: 'info' });

      let targetCollection = '';
      switch (item.entityType) {
        case 'product': targetCollection = 'products'; break;
        case 'sale': targetCollection = 'sales'; break;
        case 'customer': targetCollection = 'customers'; break;
        case 'expense': targetCollection = 'expenses'; break;
        case 'employee': targetCollection = 'employees'; break;
        case 'investment': targetCollection = 'investments'; break;
        case 'user': targetCollection = 'users'; break;
        case 'salary': targetCollection = 'staff_salaries'; break;
        case 'daily_closing': targetCollection = 'daily_closings'; break;
        case 'stockRecord': targetCollection = 'stockRecords'; break;
      }

      if (!targetCollection) throw new Error("Invalid entity type");

      // Restore data with original ID
      await setDoc(doc(db, targetCollection, item.originalId), item.data);

      // If it was a sale, we might need to re-deduct stock
      if (item.entityType === 'sale') {
        const sale = item.data as Sale;
        if (sale.items && Array.isArray(sale.items)) {
          for (const sItem of sale.items) {
            if (sItem.productId) {
              try {
                const productRef = doc(db, 'products', sItem.productId);
                await updateDoc(productRef, { 
                  stock: increment(-Number(sItem.quantity) || 0) 
                });
              } catch (e) {
                console.warn(`Could not deduct stock for restored product ${sItem.productId}:`, e);
              }
            }
          }
        }
        // Re-apply customer balance
        if (sale.customerId) {
          try {
            const customerRef = doc(db, 'customers', sale.customerId);
            await updateDoc(customerRef, {
              currentDue: increment(sale.totalAmount - sale.paidAmount),
              totalSpent: increment(sale.totalAmount)
            });
          } catch (e) {
            console.warn(`Could not re-apply balance for restored customer ${sale.customerId}:`, e);
          }
        }
      }

      // Delete from recycle bin (Rules must be updated to allow admin to delete before expiry)
      await deleteDoc(doc(db, 'recycleBin', item.id));

      setNotification({ message: `${item.entityType} restored successfully`, type: 'success' });
    } catch (error) {
      console.error("Restore error", error);
      handleFirestoreError(error, OperationType.WRITE, `restore_${item.entityType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setActiveTab('pos');
    const loadedCart = sale.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...product,
        id: item.productId,
        name: item.productName,
        quantity: item.quantity,
        discountedPrice: item.price,
        originalPrice: item.originalPrice,
        unit: product?.unit || 'unit'
      } as CartItem;
    });
    setCart(loadedCart);
    setDiscount(sale.discount);
    setCheckoutData({
      customerId: sale.customerId || '',
      walkInName: !sale.customerId ? (sale.customerName || '') : '',
      walkInPhone: !sale.customerId ? (sale.customerPhone || '') : '',
      paidAmount: sale.paidAmount || 0,
      paymentMethod: sale.paymentMethod || 'cash'
    });
    setNotification({ message: `Editing Invoice #${sale.id}`, type: 'info' });
  };

  useEffect(() => {
    if (showReceiptModal && lastCompletedSale) {
      printInvoice(lastCompletedSale, shopSettings);
    }
  }, [showReceiptModal, lastCompletedSale]);

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await moveToRecycleBin('expense', expense.id, expense);
      await deleteDoc(doc(db, 'expenses', expense.id));
      setNotification({ message: 'Expense moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'expenses');
    }
  };

  const handleDeleteInvestment = async (investment: Investment) => {
    try {
      await moveToRecycleBin('investment', investment.id, investment);
      await deleteDoc(doc(db, 'investments', investment.id));
      setNotification({ message: 'Investment moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'investments');
    }
  };

  const handleDeleteStaffSalary = async (salary: StaffSalary) => {
    try {
      await moveToRecycleBin('salary', salary.id, salary);
      await deleteDoc(doc(db, 'staff_salaries', salary.id));
      setNotification({ message: 'Salary record moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'staff_salaries');
    }
  };

  const handleDeleteStockRecord = async (record: StockRecord) => {
    try {
      await moveToRecycleBin('stockRecord', record.id, record);
      await deleteDoc(doc(db, 'stockRecords', record.id));
      setNotification({ message: 'Stock record moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'stockRecords');
    }
  };

  const handleSaveSettings = async (newSettings: ShopSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'shop'), newSettings);
      setNotification({ message: 'Settings updated successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    }
  };

  const handleAddUser = async (newUser: Omit<AppUser, 'id'>) => {
    // Check if username already exists
    const exists = appUsers.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      setNotification({ message: 'Username already exists. Please choose another.', type: 'error' });
      return;
    }

    try {
      await addDoc(collection(db, 'users'), newUser);
      setNotification({ message: 'User added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = appUsers.find(u => u.id === userId);
      if (userToDelete) {
        await moveToRecycleBin('user', userId, userToDelete);
      }
      await deleteDoc(doc(db, 'users', userId));
      setNotification({ message: 'User moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
    }
  };

  const handleAddEmployee = async (newEmployee: Omit<Employee, 'id'>) => {
    try {
      await addDoc(collection(db, 'employees'), newEmployee);
      setNotification({ message: 'Employee added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'employees');
    }
  };

  const handleUpdateEmployee = async (id: string, updatedData: Partial<Employee>) => {
    try {
      await updateDoc(doc(db, 'employees', id), updatedData);
      setNotification({ message: 'Employee updated successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'employees');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const employeeToDelete = employees.find(e => e.id === id);
      if (employeeToDelete) {
        await moveToRecycleBin('employee', id, employeeToDelete);
      }
      await deleteDoc(doc(db, 'employees', id));
      setNotification({ message: 'Employee moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'employees');
    }
  };

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      await addDoc(collection(db, 'expenses'), newExpense);
      setNotification({ message: 'Expense added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const handleAddInvestment = async (newInvestment: Omit<Investment, 'id'>) => {
    try {
      await addDoc(collection(db, 'investments'), newInvestment);
      setNotification({ message: 'Investment added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'investments');
    }
  };

  const handleAddStaffSalary = async (newSalary: Omit<StaffSalary, 'id'>) => {
    try {
      await addDoc(collection(db, 'staff_salaries'), newSalary);
      setNotification({ message: 'Salary payment recorded', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'staff_salaries');
    }
  };

  const handleScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setIsScannerOpen(false);
      setNotification({ message: `Added ${product.name} to cart`, type: 'success' });
    } else {
      setNotification({ message: `Product with barcode ${barcode} not found. Redirecting to Inventory...`, type: 'info' });
      setIsScannerOpen(false);
      setTimeout(() => setActiveTab('inventory'), 1500);
    }
  };

  const handleSendWhatsAppReminder = async (customer: Customer, lang: 'en' | 'bn') => {
    let message = "";
    if (lang === 'bn') {
      message = `আসসালামু আলাইকুম ${customer.name}, আপনার বকেয়া বিলের পরিমাণ TK ${customer.currentDue?.toFixed(2)}। ${customer.dueDate ? `আপনার প্রতিশ্রুত তারিখ ছিল ${format(new Date(customer.dueDate), 'dd MMM yyyy')}।` : ''} অনুগ্রহ করে যত দ্রুত সম্ভব বিলটি পরিশোধ করুন। ধন্যবাদ!`;
    } else {
      message = `Assalamu Alaikum ${customer.name}, this is a reminder regarding your outstanding due of TK ${customer.currentDue?.toFixed(2)}. ${customer.dueDate ? `Your promised date was ${format(new Date(customer.dueDate), 'dd MMM yyyy')}.` : ''} Please settle the amount as soon as possible. Thank you!`;
    }
    
    setNotification({ message: 'Sending WhatsApp reminder...', type: 'info' });
    const result = await callWhatsAppApi(customer.phone, message, shopSettings);
    
    if (result.fallback) {
      setNotification({ message: 'Opened WhatsApp manually.', type: 'info' });
    } else if (result.success) {
      setNotification({ message: 'Reminder sent automatically!', type: 'success' });
    } else {
      setNotification({ message: `Failed to send automatically: ${JSON.stringify(result.error)}`, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{shopSettings.name}</h1>
          <p className="text-gray-500 mb-8">Admin Login</p>
          
          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {authError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {authError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
            >
              Sign In
            </button>

            <div className="relative my-6 text-center">
              <span className="bg-white px-4 text-gray-400 text-sm">OR</span>
              <div className="absolute inset-y-1/2 left-0 right-0 border-t border-gray-100 -z-10"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 truncate">{shopSettings.name}</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-gray-50 border border-gray-200"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-6 h-6 text-indigo-600" /> : <Menu className="w-6 h-6 text-indigo-600" />}
          </button>
        </header>

        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-screen
        `}>
          <div className="p-6 hidden lg:flex items-center gap-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 truncate">{shopSettings.name}</span>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager'] },
              { id: 'pos', icon: ShoppingCart, label: 'POS Terminal', roles: ['admin', 'manager', 'assistant_manager', 'sales_manager', 'sales_team'] },
              { id: 'inventory', icon: Package, label: 'Inventory', roles: ['admin', 'manager', 'assistant_manager'] },
              { id: 'sales', icon: History, label: 'Sales History', roles: ['admin', 'manager', 'assistant_manager', 'sales_manager'] },
              { id: 'customers', icon: Users, label: 'Customers', roles: ['admin', 'manager', 'assistant_manager', 'sales_manager'] },
              { id: 'employees', icon: Briefcase, label: 'Employees', roles: ['admin', 'manager'] },
              { id: 'daily_closing', icon: Clock, label: 'Daily Closing', roles: ['admin', 'manager'] },
              { id: 'accounting', icon: CalculatorIcon, label: 'Hishab Nikash', roles: ['admin', 'manager'] },
              { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin'] },
              { id: 'recycle_bin', icon: Trash2, label: 'Recycle Bin', roles: ['admin'] },
            ].filter(item => item.roles.includes(user.role)).map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">System Administrator</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <Dashboard 
                products={products} 
                sales={sales} 
                customers={customers} 
                expenses={expenses}
                dailyClosings={dailyClosings}
                settings={shopSettings}
                onDelete={handleDeleteDailyClosing}
                onViewProductHistory={(p) => {
                  setSelectedProductForHistory(p);
                }}
              />
            )}
            {activeTab === 'pos' && (
              <POS 
                sales={sales}
                products={products} 
                cart={cart} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
                updateCartQuantity={updateCartQuantity}
                updateCartQuantityManual={updateCartQuantityManual}
                updateCartPriceManual={updateCartPriceManual}
                handleCheckout={handleCheckout}
                discount={discount}
                setDiscount={setDiscount}
                cartTotal={cartTotal}
                finalTotal={finalTotal}
                customers={customers}
                checkoutData={checkoutData}
                setCheckoutData={setCheckoutData}
                editingSale={editingSale}
                onCancelEdit={() => {
                  setEditingSale(null);
                  setCart([]);
                  setDiscount(0);
                  setCheckoutData({ customerId: '', paidAmount: 0, paymentMethod: 'cash' });
                }}
                settings={shopSettings}
                setNotification={setNotification}
              />
            )}
            {activeTab === 'inventory' && (
              <Inventory 
                products={products} 
                categories={categories} 
                stockRecords={stockRecords}
                onViewHistory={(p) => {
                  setSelectedProductForHistory(p);
                }}
                setNotification={setNotification}
              />
            )}
            {activeTab === 'sales' && (
              <SalesHistory 
                sales={sales} 
                onEdit={handleEditSale}
                onDelete={handleDeleteSale}
                settings={shopSettings}
              />
            )}
            {activeTab === 'customers' && (
              <Customers 
                customers={customers} 
                sales={sales} 
                setNotification={setNotification}
                shopSettings={shopSettings}
              />
            )}
            {activeTab === 'employees' && (
              <EmployeeManagement 
                employees={employees} 
                onAdd={handleAddEmployee} 
                onUpdate={handleUpdateEmployee} 
                onDelete={handleDeleteEmployee} 
              />
            )}
            {activeTab === 'daily_closing' && (
              <DailyClosingView 
                sales={sales} 
                expenses={expenses} 
                dailyClosings={dailyClosings}
                settings={shopSettings}
                user={user}
                onDelete={handleDeleteDailyClosing}
              />
            )}
            {activeTab === 'accounting' && (
              <Accounting 
                sales={sales} 
                products={products} 
                expenses={expenses} 
                investments={investments} 
                staffSalaries={staffSalaries}
                customers={customers}
                onAddExpense={handleAddExpense}
                onAddInvestment={handleAddInvestment}
                onAddSalary={handleAddStaffSalary}
                onDeleteExpense={handleDeleteExpense}
                onDeleteInvestment={handleDeleteInvestment}
                onDeleteSalary={handleDeleteStaffSalary}
                onSendWhatsAppReminder={handleSendWhatsAppReminder}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsPanel 
                settings={shopSettings} 
                onSaveSettings={handleSaveSettings} 
                users={appUsers}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
            {activeTab === 'recycle_bin' && (
              <RecycleBin 
                items={recycleBin} 
                onRestore={handleRestoreRecycleItem} 
              />
            )}
          </AnimatePresence>
        </main>

        <Calculator />

        {isScannerOpen && (
          <BarcodeScanner 
            onScan={handleScan} 
            onClose={() => setIsScannerOpen(false)} 
          />
        )}

        {showReceiptModal && lastCompletedSale && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Successful!</h2>
              <p className="text-gray-500 mb-8">Invoice #{lastCompletedSale.id} has been generated.</p>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    printInvoice(lastCompletedSale, shopSettings);
                    setShowReceiptModal(false);
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                {lastCompletedSale.customerPhone && (
                  <button 
                    onClick={() => {
                      sendWhatsAppInvoice(lastCompletedSale, shopSettings);
                      setShowReceiptModal(false);
                    }}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send via WhatsApp
                  </button>
                )}
                <button 
                  onClick={() => setShowReceiptModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw]"
            >
              <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
                notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
                notification.type === 'error' ? 'bg-red-600 border-red-500 text-white' :
                'bg-indigo-600 border-indigo-500 text-white'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-semibold">{notification.message}</span>
                <button onClick={() => setNotification(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Receipt Modal */}
        <AnimatePresence>
          {lastSale && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-xl font-bold text-gray-900">Sale Receipt</h3>
                  <button onClick={() => setLastSale(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="text-center space-y-1">
                    {shopSettings.logoUrl && (
                      <img src={shopSettings.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" referrerPolicy="no-referrer" />
                    )}
                    <h4 className="text-2xl font-black text-indigo-600">{shopSettings.name}</h4>
                    <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto leading-relaxed">{shopSettings.address}</p>
                    <p className="text-sm text-gray-500 pt-2">Invoice: #{lastSale.id}</p>
                    <p className="text-xs text-gray-400">{format(new Date(), 'MMM dd, yyyy hh:mm a')}</p>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Customer:</span>
                      <span className="font-semibold text-gray-900">{lastSale.customerName}</span>
                    </div>
                    {lastSale.customerPhone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Phone:</span>
                        <a 
                          href={`tel:${lastSale.customerPhone.replace(/\D/g, '')}`} 
                          className="text-gray-900 hover:text-indigo-600 hover:underline transition-colors"
                        >
                          {lastSale.customerPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</p>
                    {lastSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500">{toBengaliNumber(item.quantity)} x {formatCurrency(item.price)}</p>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(item.quantity * item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(lastSale.totalAmount)}</span>
                    </div>
                    {lastSale.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Discount</span>
                        <span>- {formatCurrency(lastSale.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                      <span>Total</span>
                      <span className="text-indigo-600">{formatCurrency(lastSale.finalAmount)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="font-bold uppercase text-indigo-600">{lastSale.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Paid Amount:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(lastSale.paidAmount)}</span>
                    </div>
                    {lastSale.dueAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Due Amount:</span>
                        <span className="font-bold text-red-600">{formatCurrency(lastSale.dueAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button 
                    onClick={() => downloadInvoicePDF(lastSale, shopSettings)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button 
                    onClick={() => setLastSale(null)}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {selectedProductForHistory && (
          <ProductHistory 
            product={selectedProductForHistory} 
            sales={sales} 
            stockRecords={stockRecords}
            onClose={() => setSelectedProductForHistory(null)} 
            onDeleteStockRecord={handleDeleteStockRecord}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

// --- Sub-components ---

function BarcodeScanner({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) {
  useEffect(() => {
    // const scanner = new Html5QrcodeScanner(
    //   "reader",
    //   { 
    //     fps: 10, 
    //     qrbox: { width: 250, height: 250 },
    //     videoConstraints: {
    //       facingMode: "environment"
    //     }
    //   },
    //   /* verbose= */ false
    // );
    // scanner.render(onScan, (err) => {
    //   // console.warn(err);
    // });
    //
    // return () => {
    //   scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    // };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-indigo-600" />
            Scan Barcode/QR
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div id="reader" className="w-full"></div>
        <div className="p-6 bg-gray-50 text-center">
          <p className="text-sm text-gray-500">Position the barcode within the frame to scan</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ products, sales, customers, expenses, dailyClosings, settings, onDelete, onViewProductHistory }: { products: Product[], sales: Sale[], customers: Customer[], expenses: Expense[], dailyClosings: DailyClosing[], settings: ShopSettings, onDelete: (closing: DailyClosing) => void, onViewProductHistory: (p: Product) => void }) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [viewMetric, setViewMetric] = useState<'revenue' | 'profit'>('revenue');
  const now = new Date();

  // Find the last closing timestamp to define the current session
  const lastClosingDate = useMemo(() => {
    if (!dailyClosings || dailyClosings.length === 0) return null;
    const sorted = [...dailyClosings].sort((a, b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime());
    return safeDate(sorted[0].timestamp).getTime();
  }, [dailyClosings]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = safeDate(s.timestamp);
      const saleTime = saleDate.getTime();
      
      // For 'day' view, we now show since last closing if a closing exists for today,
      // or just today's sales if no closing or user wants session view.
      // Based on user request: "whenever I do closing... after that moment it is zero"
      if (period === 'day') {
        const isSameDay = format(saleDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        const isAfterLastClosing = !lastClosingDate || saleTime > lastClosingDate;
        return isSameDay && isAfterLastClosing;
      }
      
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (period === 'month') return format(saleDate, 'yyyy-MM') === format(now, 'yyyy-MM');
      if (period === 'year') return format(saleDate, 'yyyy') === format(now, 'yyyy');
      return true;
    });
  }, [sales, period]);

  const totalSales = filteredSales.reduce((sum, s) => sum + s.finalAmount, 0);
  const totalOrders = filteredSales.length;
  const totalMarketDue = customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
  
  const totalCost = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => itemSum + ((item.cost || 0) * item.quantity), 0);
  }, 0);

  const totalExpensesInPeriod = expenses.filter(e => {
    const expDate = safeDate(e.timestamp);
    const expTime = expDate.getTime();
    if (period === 'day') {
      const isSameDay = format(expDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      const isAfterLastClosing = !lastClosingDate || expTime > lastClosingDate;
      return isSameDay && isAfterLastClosing;
    }
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return expDate >= weekAgo;
    }
    if (period === 'month') return format(expDate, 'yyyy-MM') === format(now, 'yyyy-MM');
    if (period === 'year') return format(expDate, 'yyyy') === format(now, 'yyyy');
    return true;
  }).reduce((sum, e) => sum + e.amount, 0);

  const grossProfit = totalSales - totalCost;
  const netProfit = grossProfit - totalExpensesInPeriod;
  
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);
  const outOfStockProducts = products.filter(p => p.stock <= 0);
  
  const expiredProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const exp = new Date(p.expiryDate);
    return exp < now;
  });

  const nearExpiryProducts = products.filter(p => {
    if (!p.expiryDate) return false;
    const exp = new Date(p.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  const stats = useMemo(() => {
    const today = format(now, 'yyyy-MM-dd');
    const todaySales = sales.filter(s => {
      const ts = safeDate(s.timestamp);
      return format(ts, 'yyyy-MM-dd') === today && (!lastClosingDate || ts.getTime() > lastClosingDate);
    });
    const todayCash = todaySales.reduce((sum, s) => sum + s.paidAmount, 0);
    const todayDue = todaySales.reduce((sum, s) => sum + s.dueAmount, 0);
    
    const periodCash = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);
    const periodDue = filteredSales.reduce((sum, s) => sum + s.dueAmount, 0);

    return { todayCash, todayDue, periodCash, periodDue };
  }, [sales, filteredSales]);

  const chartData = useMemo(() => {
    let labels: string[] = [];
    if (period === 'day' || period === 'week') {
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return format(d, 'MMM dd');
      }).reverse();
    } else if (period === 'month') {
      labels = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return format(d, 'MMM dd');
      }).reverse();
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    return labels.map(label => {
      const periodSales = sales.filter(s => {
        const saleDate = safeDate(s.timestamp);
        if (period === 'year') return format(saleDate, 'MMM') === label;
        return format(saleDate, 'MMM dd') === label;
      });

      const totalRevenue = periodSales.reduce((sum, s) => sum + s.finalAmount, 0);
      const totalCost = periodSales.reduce((sum, s) => {
        return sum + s.items.reduce((itemSum, item) => itemSum + ((item.cost || 0) * item.quantity), 0);
      }, 0);

      return {
        name: label,
        sales: totalRevenue,
        cash: periodSales.reduce((sum, s) => sum + s.paidAmount, 0),
        due: periodSales.reduce((sum, s) => sum + s.dueAmount, 0),
        profit: totalRevenue - totalCost
      };
    });
  }, [sales, period]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} label={`${period.charAt(0).toUpperCase() + period.slice(1)} Revenue`} value={formatCurrency(totalSales)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingUp} label={`${period.charAt(0).toUpperCase() + period.slice(1)} Net Profit`} value={formatCurrency(netProfit)} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={AlertCircle} label="Total Market Due" value={formatCurrency(totalMarketDue)} color="bg-red-50 text-red-600" />
        <StatCard icon={CheckCircle2} label={`${period.charAt(0).toUpperCase() + period.slice(1)} Cash`} value={formatCurrency(stats.periodCash)} color="bg-blue-50 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Gross Sales</span>
              <span className="font-bold text-gray-900">{formatCurrency(totalSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Cost of Goods</span>
              <span className="font-bold text-red-600">-{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
              <span className="text-gray-900 font-bold">Gross Profit</span>
              <span className="font-bold text-emerald-600">{formatCurrency(grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Expenses</span>
              <span className="font-bold text-red-600">-{formatCurrency(totalExpensesInPeriod)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
              <span className="text-gray-900 font-bold">Net Profit</span>
              <span className={`font-bold ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Payment Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Cash Received</span>
              <span className="font-bold text-blue-600">{formatCurrency(stats.periodCash)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">New Due</span>
              <span className="font-bold text-amber-600">{formatCurrency(stats.periodDue)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
              <span className="text-gray-900 font-bold">Total Orders</span>
              <span className="font-bold text-gray-900">{totalOrders}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Inventory Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Low Stock Items</span>
              <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">{lowStockProducts.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Out of Stock</span>
              <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">{outOfStockProducts.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Expired Items</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{expiredProducts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AlertBox 
          icon={AlertTriangle} 
          label="Low Stock" 
          count={lowStockProducts.length} 
          color="text-amber-600" 
          bgColor="bg-amber-50"
          items={lowStockProducts}
          onItemClick={onViewProductHistory}
        />
        <AlertBox 
          icon={Box} 
          label="Out of Stock" 
          count={outOfStockProducts.length} 
          color="text-red-600" 
          bgColor="bg-red-50"
          items={outOfStockProducts}
          onItemClick={onViewProductHistory}
        />
        <AlertBox 
          icon={Calendar} 
          label="Expired" 
          count={expiredProducts.length} 
          color="text-rose-600" 
          bgColor="bg-rose-50"
          items={expiredProducts}
          onItemClick={onViewProductHistory}
        />
        <AlertBox 
          icon={Clock} 
          label="Near Expiry" 
          count={nearExpiryProducts.length} 
          color="text-orange-600" 
          bgColor="bg-orange-50"
          items={nearExpiryProducts}
          onItemClick={onViewProductHistory}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold">Sales Overview ({period === 'year' ? 'By Month' : 'Last 7 Days'})</h3>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setViewMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMetric === 'revenue' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setViewMetric('profit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMetric === 'profit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Profit Margin
              </button>
            </div>
          </div>

          <div className="h-80 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `TK ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-50">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">{label}</p>
                          <div className="space-y-1">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-8">
                                <span className="text-sm text-gray-500 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  {entry.name}
                                </span>
                                <span className="text-sm font-bold text-gray-900">TK {entry.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {viewMetric === 'revenue' ? (
                  <>
                    <Bar dataKey="cash" name="Cash Collected" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="due" name="New Due" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <Bar dataKey="profit" name="Net Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">Recent Sales</h3>
          <div className="space-y-4">
            {sales.slice(0, 5).map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{sale.customerName || 'Walk-in'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{format(safeDate(sale.timestamp), 'hh:mm a')}</span>
                      {sale.customerPhone && (
                        <>
                          <span>•</span>
                          <a 
                            href={`tel:${sale.customerPhone.replace(/\D/g, '')}`} 
                            className="hover:text-indigo-600 hover:underline transition-colors"
                          >
                            {sale.customerPhone}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">TK {sale.finalAmount}</p>
                  <p className={`text-[10px] ${sale.dueAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {sale.dueAmount > 0 ? `Due: TK ${sale.dueAmount}` : 'Paid'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AlertBox({ icon: Icon, label, count, color, bgColor, items, onItemClick }: any) {
  return (
    <div className={`${bgColor} p-5 rounded-2xl border border-gray-100 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-2xl font-black ${color}`}>{count}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
          {items.slice(0, 3).map((p: any) => (
            <button 
              key={p.id} 
              onClick={() => onItemClick(p)}
              className="text-[10px] text-gray-500 hover:text-indigo-600 block truncate w-full text-left"
            >
              • {p.name} ({p.stock} {p.unit})
            </button>
          ))}
          {items.length > 3 && <p className="text-[10px] text-gray-400 italic">+{items.length - 3} more...</p>}
        </div>
      </div>
    </div>
  );
}

function ProductHistory({ product, sales, stockRecords, onClose, onDeleteStockRecord }: { product: Product, sales: Sale[], stockRecords: StockRecord[], onClose: () => void, onDeleteStockRecord: (record: StockRecord) => void }) {
  const productSales = sales.filter(s => s.items.some(item => item.productId === product.id));
  const productStockRecords = stockRecords.filter(r => r.productId === product.id);
  
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <HistoryIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{product.name} History</h3>
              <p className="text-xs text-gray-500">Stock: {product.stock} {product.unit} | Price: TK {product.price}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <section>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Sales History
              </h4>
              {productSales.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No sales recorded for this product yet.</p>
              ) : (
                <div className="space-y-3">
                  {productSales.map(sale => {
                    const item = sale.items.find(i => i.productId === product.id);
                    return (
                      <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs font-bold text-gray-400">{format(safeDate(sale.timestamp), 'MMM dd')}</p>
                            <p className="text-[10px] text-gray-400">{format(safeDate(sale.timestamp), 'yyyy')}</p>
                          </div>
                          <div className="w-px h-8 bg-gray-200" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{sale.customerName || 'Walk-in'}</p>
                            <p className="text-xs text-gray-500">Quantity: {item?.quantity} {product.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">TK {(item?.quantity || 0) * (item?.price || 0)}</p>
                          <p className="text-[10px] text-gray-400">Invoice: #{sale.id}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Stock In / Adjustment History
              </h4>
              {productStockRecords.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No stock adjustments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {productStockRecords
                    .sort((a,b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime())
                    .map(record => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs font-bold text-gray-400">{format(safeDate(record.timestamp), 'MMM dd')}</p>
                            <p className="text-[10px] text-gray-400">{format(safeDate(record.timestamp), 'yyyy')}</p>
                          </div>
                          <div className="w-px h-8 bg-emerald-200" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {record.type === 'add' ? 'Stock Added' : 'Adjustment'}
                              {record.batchNumber && <span className="ml-2 text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded uppercase">Batch: {record.batchNumber}</span>}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Plus className="w-3 h-3" /> {record.quantity} {product.unit}
                              </span>
                              {record.location && (
                                <span className="flex items-center gap-1">
                                  <WarehouseIcon className="w-3 h-3" /> {record.location}
                                </span>
                              )}
                              {record.expiryDate && (
                                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                                  <Calendar className="w-3 h-3" /> Exp: {record.expiryDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.note && (
                            <div className="max-w-[150px] text-right">
                              <p className="text-[10px] text-gray-400 italic truncate" title={record.note}>{record.note}</p>
                            </div>
                          )}
                          <button 
                            onClick={() => {if(confirm('Delete this stock record?')) onDeleteStockRecord(record)}}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Calculator() {
  const [display, setDisplay] = useState('0');
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (val: string) => {
    if (val === 'C') {
      setDisplay('0');
    } else if (val === '=') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(display);
        setDisplay(String(result ?? '0'));
      } catch {
        setDisplay('Error');
      }
    } else {
      setDisplay(prev => prev === '0' ? val : prev + val);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50"
      >
        <CalculatorIcon className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-40 right-8 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Calculator</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl mb-4 text-right">
              <p className="text-2xl font-mono font-bold text-gray-900 truncate">{display}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleAction(btn)}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    btn === 'C' ? 'col-span-4 bg-red-50 text-red-600 hover:bg-red-100' :
                    btn === '=' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                    ['/', '*', '-', '+'].includes(btn) ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' :
                    'bg-gray-50 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EmployeeManagement({ employees, onAdd, onUpdate, onDelete }: { employees: Employee[], onAdd: (e: Omit<Employee, 'id'>) => void, onUpdate: (id: string, e: Partial<Employee>) => void, onDelete: (id: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setConfirmDeleteId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(e => 
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone?.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const employeeData = {
      name: formData.get('name') as string,
      designation: formData.get('designation') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      salary: Number(formData.get('salary')),
      joiningDate: formData.get('joiningDate') as string,
      schedule: formData.get('schedule') as string,
      status: formData.get('status') as 'active' | 'inactive'
    };

    if (editingEmployee) {
      onUpdate(editingEmployee.id, employeeData);
    } else {
      onAdd(employeeData);
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-500">Manage your shop staff and their schedules.</p>
        </div>
        <button 
          onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search employees by name, designation or phone..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Employee</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Contact</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Salary & Schedule</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={`tel:${emp.phone.replace(/\D/g, '')}`} 
                      className="text-sm text-gray-900 hover:text-indigo-600 hover:underline transition-colors"
                    >
                      {emp.phone}
                    </a>
                    <p className="text-xs text-gray-500">{emp.email || 'No email'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">TK {emp.salary}</p>
                    <p className="text-xs text-gray-500">{emp.schedule || 'Not set'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      emp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingEmployee(emp); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmDeleteId === emp.id) {
                            onDelete(emp.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(emp.id);
                          }
                        }}
                        className={`p-2 rounded-lg transition-all relative ${
                          confirmDeleteId === emp.id 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-lg scale-110" 
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title={confirmDeleteId === emp.id ? "Click again to confirm" : "Delete Employee"}
                      >
                        {confirmDeleteId === emp.id ? (
                          <span className="text-[10px] font-bold px-1 animate-pulse">Confirm?</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                    <input name="name" defaultValue={editingEmployee?.name || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Designation *</label>
                    <input name="designation" defaultValue={editingEmployee?.designation || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                    <input name="phone" defaultValue={editingEmployee?.phone || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input name="email" type="email" defaultValue={editingEmployee?.email || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Salary *</label>
                    <input name="salary" type="number" defaultValue={editingEmployee?.salary || 0} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Joining Date</label>
                    <input name="joiningDate" type="date" defaultValue={editingEmployee?.joiningDate || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Work Schedule</label>
                    <input name="schedule" defaultValue={editingEmployee?.schedule || ''} placeholder="e.g. 9 AM - 6 PM" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                    <select name="status" defaultValue={editingEmployee?.status || 'active'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    {editingEmployee ? 'Update Employee' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function POS({ 
  sales,
  products, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  updateCartQuantityManual,
  updateCartPriceManual,
  handleCheckout,
  discount,
  setDiscount,
  cartTotal,
  finalTotal,
  customers,
  checkoutData,
  setCheckoutData,
  onScanClick,
  editingSale,
  onCancelEdit,
  settings,
  setNotification
}: any) {

  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleVoiceCommand = (rawText: string) => {
    let lowerText = rawText.toLowerCase().trim();
    
    // Check if customer search
    const customerPrefixes = ['কাস্টমার ', 'ক্রেতা ', 'customer '];
    for (const prefix of customerPrefixes) {
      if (lowerText.startsWith(prefix)) {
          const custName = rawText.substring(prefix.length).trim();
          setCustomerSearch(custName);
          setIsCustomerDropdownOpen(true);
          setNotification({ type: 'info', message: `Searching for customer: ${custName}` });
          return;
      }
    }

    // Otherwise treat as adding to cart
    const { originalText, searchName, quantity, matchFound } = parseVoiceCommandQuantity(rawText);
    
    if (!searchName && !originalText) return;

    const calculateScore = (targetText: string, searchStr: string, phoneticSearch: string, sWords: string[]) => {
      let score = 0;
      const tName = standardizeBn(targetText);
      const phoneticTName = toPhonetic(tName);
      
      if (tName === searchStr) score += 100;
      if (phoneticTName === phoneticSearch && phoneticSearch.length > 2) score += 90;
      if (tName.includes(searchStr)) score += 50;
      if (phoneticTName.includes(phoneticSearch) && phoneticSearch.length > 3) score += 40;
      
      const wordsMatch = sWords.filter((w: string) => tName.includes(w)).length;
      score += wordsMatch * 10;
      
      const tWords = tName.split(/\s+/).filter((w: string) => w.length > 0);
      const phoneticWordsMatch = sWords.filter((w: string) => {
          const phW = toPhonetic(w);
          return phW.length > 0 && tWords.some((pw: string) => {
              const phT = toPhonetic(pw);
              return phT === phW || phT.includes(phW) || (phW.length > 2 && phW.includes(phT));
          });
      }).length;
      score += phoneticWordsMatch * 8;
      
      return score;
    };

    let matchProduct = null;
    let activeQuantity = quantity;

    // Tier 1: exact string matching trying to avoid cutting off embedded numbers
    const stdOriginalText = standardizeBn(originalText || rawText);
    const phOriginalText = toPhonetic(stdOriginalText);
    const origWords = stdOriginalText.split(/\s+/).filter((w: string) => w.length > 0);
    
    if (origWords.length > 0) {
       const directMatches = products.map((p: any) => ({
         product: p,
         score: calculateScore(p.name, stdOriginalText, phOriginalText, origWords)
       })).filter((p: any) => p.score > 0);
       
       directMatches.sort((a: any, b: any) => b.score - a.score);
       if (directMatches.length > 0 && directMatches[0].score >= 90) { 
          matchProduct = directMatches[0].product;
          activeQuantity = 1;
       }
    }

    // Tier 2: matched with quantity stripped
    if (!matchProduct && searchName) {
       const stdSearchName = standardizeBn(searchName);
       const phSearchName = toPhonetic(stdSearchName);
       const searchWords = stdSearchName.split(/\s+/).filter((w: string) => w.length > 0);
       
       if (searchWords.length > 0) {
         const parsedMatches = products.map((p: any) => ({
           product: p,
           score: calculateScore(p.name, stdSearchName, phSearchName, searchWords)
         })).filter((p: any) => p.score > 0);
         
         parsedMatches.sort((a: any, b: any) => b.score - a.score);
         if (parsedMatches.length > 0) {
            matchProduct = parsedMatches[0].product;
         }
       }
    }

    if (matchProduct) {
      if (matchProduct.stock !== null && matchProduct.stock < activeQuantity) {
        setNotification({ type: 'error', message: `Insufficient stock for ${matchProduct.name}` });
        return;
      }
      addToCart(matchProduct);
      if (activeQuantity !== 1) {
        setTimeout(() => {
          updateCartQuantityManual(matchProduct.id, activeQuantity);
        }, 300);
      }
      setNotification({ type: 'success', message: `${activeQuantity} ${matchProduct.unit || ''} ${matchProduct.name} added to cart via Voice` });
    } else {
      if (!matchFound && origWords.length >= 3) {
         return;
      }
      setNotification({ type: 'error', message: `Product "${searchName || originalText}" not found` });
    }
  };

  const { isListening, voiceFeedback, toggleVoiceSearch, startListening } = useVoiceSearch(handleVoiceCommand);

  useEffect(() => {
    // Try auto-starting when POS loads
    startListening();
  }, [startListening]);

  const filteredProducts = products.filter((p: Product) => 
    isPhoneticMatch(p.name, searchTerm) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const filteredCustomers = customers.filter((c: Customer) => 
    isPhoneticMatch(c.name, customerSearch) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  const selectedCustomer = customers.find((c: Customer) => c.id === checkoutData.customerId);
  const [suggestionMode, setSuggestionMode] = useState<'none' | 'previous' | 'frequent'>('none');

  const previouslyPurchasedProducts = useMemo(() => {
    if (!checkoutData.customerId || !sales) return [];
    
    // get all sales for this customer
    const customerSales = sales.filter((s: any) => s.customerId === checkoutData.customerId);
    
    // count product frequencies
    const productCounts: Record<string, number> = {};
    for (const sale of customerSales) {
      if (!sale.items) continue;
      for (const item of sale.items) {
        productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
      }
    }
    
    // sort by frequency and get top 5 products that are currently in stock
    const sortedProductIds = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a]);
    return sortedProductIds
      .map(id => products.find((p: Product) => p.id === id))
      .filter((p: Product | undefined) => p !== undefined && p.stock > 0)
      .slice(0, 5);
  }, [sales, checkoutData.customerId, products]);

  const frequentlyBoughtTogetherProducts = useMemo(() => {
    if (!cart.length || !sales) return [];

    const cartProductIds = cart.map((item: any) => item.id);
    
    // get sales that contain at least one item currently in the cart
    const relatedSales = sales.filter((sale: any) => 
      sale.items && sale.items.some((item: any) => cartProductIds.includes(item.productId))
    );
    
    const productCounts: Record<string, number> = {};
    for (const sale of relatedSales) {
      if (!sale.items) continue;
      for (const item of sale.items) {
        // don't suggest items already in the cart
        if (!cartProductIds.includes(item.productId)) {
           productCounts[item.productId] = (productCounts[item.productId] || 0) + 1; // count co-occurrences
        }
      }
    }
    
    const sortedProductIds = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a]);
    return sortedProductIds
      .map(id => products.find((p: Product) => p.id === id))
      .filter((p: Product | undefined) => p !== undefined && p.stock > 0)
      .slice(0, 5);
  }, [cart, sales, products]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[calc(100vh-8rem)]"
    >
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="flex items-center gap-2 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-12 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={toggleVoiceSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-600'}`}
              title="Voice Commands (Bengali/English)"
            >
              {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence>
            {voiceFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg z-[9999] flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                "{voiceFeedback}"
              </motion.div>
            )}
          </AnimatePresence>
          <button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {viewMode === 'grid' ? <Menu className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
          </button>
          
          {/* Compact Customer Area */}
          <div className="flex-1 relative bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
            {checkoutData.customerId ? (
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex flex-col truncate">
                  <span className="font-bold text-indigo-700 truncate">{selectedCustomer?.name}</span>
                  <span className="text-[10px] text-gray-500">{selectedCustomer?.phone}</span>
                </div>
                <button 
                  onClick={() => setCheckoutData({...checkoutData, customerId: '', paymentMethod: 'cash'})}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex">
                <input
                  type="text"
                  placeholder="Cust. Name"
                  className="flex-[2] px-3 py-2 outline-none"
                  value={isCustomerDropdownOpen ? customerSearch : checkoutData.walkInName}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                    setCheckoutData({...checkoutData, walkInName: e.target.value});
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                />
                <input 
                  type="text"
                  placeholder="Phone"
                  className="flex-[3] px-2 py-2 border-l border-gray-100 outline-none"
                  value={checkoutData.walkInPhone}
                  onChange={(e) => {
                    const phone = e.target.value;
                    const matchingCustomer = customers.find(c => c.phone === phone);
                    if (matchingCustomer) {
                      setCheckoutData({ ...checkoutData, customerId: matchingCustomer.id, walkInName: matchingCustomer.name, walkInPhone: phone, paymentMethod: 'due' });
                    } else {
                      setCheckoutData({ ...checkoutData, walkInPhone: phone });
                    }
                  }}
                />
              </div>
            )}
            
            {isCustomerDropdownOpen && !checkoutData.customerId && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                {filteredCustomers.map((c: Customer) => (
                  <div 
                    key={c.id}
                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-xs"
                    onClick={() => {
                      setCheckoutData({ ...checkoutData, customerId: c.id, walkInName: c.name, walkInPhone: c.phone, paymentMethod: 'due' });
                      setCustomerSearch('');
                      setIsCustomerDropdownOpen(false);
                    }}
                  >
                    <span className="font-bold">{c.name}</span> - <span>{c.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 lg:overflow-y-auto pb-4">
          {(checkoutData.customerId && previouslyPurchasedProducts.length > 0) && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1"><History className="w-4 h-4" /> Previously Purchased</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {previouslyPurchasedProducts.map((product: Product) => (
                   <button
                   key={product.id}
                   onClick={() => addToCart(product)}
                   className="flex-none w-24 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                 >
                   <p className="font-bold text-gray-900 truncate text-[10px]">{product.name}</p>
                   <p className="text-[9px] text-gray-500">Stock: {product.stock}</p>
                   <div className="mt-1">
                     <span className="text-indigo-600 font-bold text-xs">{formatCurrency(product.price)}</span>
                   </div>
                 </button>
                ))}
              </div>
            </div>
          )}

          {frequentlyBoughtTogetherProducts.length > 0 && (
             <div className="mb-4">
             <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-500" /> Frequently Bought Together</h3>
             <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
               {frequentlyBoughtTogetherProducts.map((product: Product) => (
                  <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex-none w-24 bg-amber-50/50 p-2 rounded-lg border border-amber-100 shadow-sm hover:border-amber-500 hover:shadow-md transition-all text-left group"
                >
                  <p className="font-bold text-gray-900 truncate text-[10px]">{product.name}</p>
                  <p className="text-[9px] text-gray-500">Stock: {product.stock}</p>
                  <div className="mt-1">
                    <span className="text-amber-600 font-bold text-xs">{formatCurrency(product.price)}</span>
                  </div>
                </button>
               ))}
             </div>
           </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filteredProducts.map((product: Product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-full aspect-square bg-gray-50 rounded mb-1 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                      <Package className="w-4 h-4 text-gray-300 group-hover:text-indigo-300" />
                    </div>
                    <p className="font-bold text-gray-900 truncate text-[9px]">{product.name}</p>
                    <p className="text-[9px] text-gray-500">Stock: {product.stock} {product.unit}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-indigo-600 font-bold text-xs">{formatCurrency(product.price)}</span>
                      <span className="text-[9px] text-gray-400">/{product.unit}</span>
                    </div>
                  </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">SL</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Product</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Price</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product: Product, index: number) => (
                    <tr key={product.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-gray-400">#{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-900">{product.name}</p>
                        <p className="text-[10px] text-gray-400">Stock: {product.stock} {product.unit}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-indigo-600">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => addToCart(product)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-indigo-600" />
              Order Details
            </h3>
            {editingSale && (
              <button 
                onClick={onCancelEdit}
                className="text-xs text-red-600 font-bold hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
          {editingSale && (
            <div className="mt-2 p-2 bg-indigo-50 rounded-lg text-[10px] text-indigo-700 font-bold">
              Editing Invoice: #{editingSale.id}
            </div>
          )}
          {selectedCustomer && (
            <div className="mt-2 p-3 bg-amber-50 rounded-2xl text-xs text-amber-700 relative">
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const cleanPhone = selectedCustomer.phone.replace(/\D/g, '');
                    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `880${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
                    window.open(`https://wa.me/${formattedPhone}`, '_blank');
                  }}
                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                  title="WhatsApp Message"
                >
                  <MessageCircle className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    const message = `Hello ${selectedCustomer.name}, this is from ${settings.name}. Your current outstanding due is TK ${selectedCustomer.currentDue}. Please clear it at your earliest convenience. Thank you!`;
                    const cleanPhone = selectedCustomer.phone.replace(/\D/g, '');
                    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `880${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
                    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                  title="Send Due Reminder"
                >
                  <Clock className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1 pr-8">
                <p className="font-bold flex items-center gap-2">
                  <UserIcon className="w-3 h-3" /> {selectedCustomer.name}
                </p>
                {(selectedCustomer.fatherName || selectedCustomer.houseName) && (
                  <p className="text-[10px] opacity-75">
                    {selectedCustomer.fatherName && `F: ${selectedCustomer.fatherName}`}
                    {selectedCustomer.fatherName && selectedCustomer.houseName && ' | '}
                    {selectedCustomer.houseName && `H: ${selectedCustomer.houseName}`}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span className="font-bold">Previous Due:</span> {formatCurrency(selectedCustomer.currentDue)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item: CartItem) => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm group">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-sm">{item.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {item.discountedPrice < item.originalPrice ? (
                        <span className="line-through mr-1 text-gray-300">{formatCurrency(item.originalPrice)}</span>
                      ) : null}
                      {formatCurrency(item.discountedPrice)} / {item.unit}
                    </p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-0.5">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all"><Minus className="w-3 h-3" /></button>
                      <input 
                        type="number" 
                        step="0.01"
                        value={item.quantity || 0} 
                        onChange={(e) => updateCartQuantityManual(item.id, Number(e.target.value))}
                        className="w-12 text-center font-bold text-gray-900 bg-transparent outline-none text-xs"
                      />
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all"><Plus className="w-3 h-3" /></button>
                    </div>
                    {item.unit === 'kg' && (
                      <div className="flex flex-wrap gap-1">
                        {[0.25, 0.5, 1, 2, 5].map(q => (
                          <button 
                            key={q}
                            onClick={() => updateCartQuantityManual(item.id, q)}
                            className="px-1.5 py-0.5 bg-gray-50 text-[9px] font-bold text-gray-500 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          >
                            {q}kg
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex flex-wrap items-center gap-1 justify-end">
                      <input 
                        type="number" 
                        step="0.01"
                        value={item.discountedPrice || 0}
                        onChange={(e) => updateCartPriceManual(item.id, Number(e.target.value))}
                        className="w-14 px-1 py-0.5 border border-gray-200 rounded text-right font-bold text-indigo-600 outline-none text-[10px]"
                        title="Unit Price"
                      />
                      <span className="text-[10px] text-gray-400">x</span>
                      <input
                        type="number"
                        step="0.01"
                        value={((item.discountedPrice || 0) * (item.quantity || 0)).toFixed(2)}
                        onChange={(e) => {
                          const newTotal = Number(e.target.value);
                          const newPrice = newTotal / (item.quantity || 1);
                          updateCartPriceManual(item.id, newPrice);
                        }}
                        className="w-16 px-1 py-0.5 border border-gray-200 rounded text-right font-bold text-gray-900 outline-none text-[10px]"
                        title="Total Price"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 text-sm">
              <span>Discount</span>
              <input 
                type="number" 
                value={discount || 0} 
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-16 bg-white border border-gray-200 rounded px-2 py-1 text-right text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
              <span>Total</span>
              <span className="text-indigo-600">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <button 
                onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: 'cash' })}
                disabled={!!checkoutData.customerId}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${checkoutData.paymentMethod === 'cash' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200'} ${!!checkoutData.customerId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >Cash</button>
              <button 
                onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: 'due' })}
                disabled={!checkoutData.customerId}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${checkoutData.paymentMethod === 'due' ? 'bg-amber-600 text-white' : 'bg-white text-gray-500 border border-gray-200'} ${!checkoutData.customerId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >Due</button>
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Paid Amount</label>
                  <button 
                    onClick={() => setCheckoutData({ ...checkoutData, paidAmount: finalTotal })}
                    className="text-[9px] text-indigo-600 font-bold hover:underline"
                  >
                    Full Paid
                  </button>
                </div>
                <input 
                  type="number" 
                  value={checkoutData.paidAmount || 0}
                  onChange={(e) => setCheckoutData({ ...checkoutData, paidAmount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                
                {checkoutData.customerId && (
                  <div className="mt-2 space-y-1 text-xs border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Today's Bill:</span>
                      <span className="font-bold">TK {finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Previous Due:</span>
                      <span className="font-bold">TK {(selectedCustomer?.currentDue || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-1">
                      <span>Total Before Payment:</span>
                      <span>TK {(finalTotal + (selectedCustomer?.currentDue || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-600">
                      <span>Payment Today:</span>
                      <span className="font-bold">TK {checkoutData.paidAmount || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-indigo-900 border-t pt-1 mt-1">
                      <span>Remaining Due:</span>
                      <span>TK {(finalTotal + (selectedCustomer?.currentDue || 0) - (checkoutData.paidAmount || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {!checkoutData.customerId && checkoutData.paidAmount < finalTotal && (
                  <p className="text-[9px] text-amber-600 mt-0.5">Remaining TK {finalTotal - checkoutData.paidAmount} will be added to Due</p>
                )}
                {!checkoutData.customerId && checkoutData.paidAmount > finalTotal && (
                  <p className="text-[9px] text-emerald-600 mt-0.5">Change: TK {checkoutData.paidAmount - finalTotal}</p>
                )}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button 
              onClick={() => handleCheckout(false)}
              disabled={cart.length === 0}
              className={`py-3 text-white rounded-xl text-xs font-bold ${editingSale ? 'bg-indigo-700' : 'bg-indigo-600'}`}
            >
              Order {editingSale ? 'Update' : 'Complete'}
            </button>
            <button 
              onClick={() => handleCheckout(true)}
              disabled={cart.length === 0}
              className={`py-3 text-white rounded-xl text-xs font-bold ${editingSale ? 'bg-emerald-700' : 'bg-emerald-600'}`}
            >
              + WhatsApp
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Inventory({ products, categories, stockRecords, onViewHistory, setNotification }: { 
  products: Product[], 
  categories: Category[], 
  stockRecords: StockRecord[],
  onViewHistory: (p: Product) => void,
  setNotification: (n: { message: string, type: 'success' | 'error' | 'info' } | null) => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingStockProduct, setAddingStockProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleVoiceCommand = (rawText: string) => {
    let lower = rawText.toLowerCase().trim();
    
    // Check for "new product" triggers
    if (lower.includes('নতুন প্রোডাক্ট') || lower.includes('নতুন ইনভেন্টরি') || lower.includes('new product') || lower.includes('প্রোডাক্ট অ্যাড')) {
       // Optional: try to extract name, price, stock
       const productPrefixes = ['নতুন প্রোডাক্ট', 'নতুন ইনভেন্টরি', 'new product', 'প্রোডাক্ট অ্যাড'];
       let remainder = rawText;
       for (const p of productPrefixes) {
         if (lower.includes(p)) {
           const idx = lower.indexOf(p);
           remainder = rawText.substring(idx + p.length).trim();
           break;
         }
       }
       
       const priceMatch = remainder.match(/(?:দাম|price)\s*(\d+(\.\d+)?)/i);
       const stockMatch = remainder.match(/(?:স্টক|স্টোক|stock)\s*(\d+(\.\d+)?)/i);
       
       let nameEndIdx = remainder.length;
       if (priceMatch && priceMatch.index !== undefined && priceMatch.index < nameEndIdx) nameEndIdx = priceMatch.index;
       if (stockMatch && stockMatch.index !== undefined && stockMatch.index < nameEndIdx) nameEndIdx = stockMatch.index;
       
       const extractedName = remainder.substring(0, nameEndIdx).trim();

       setIsModalOpen(true);
       setEditingProduct({
         name: extractedName,
         price: priceMatch ? parseFloat(priceMatch[1]) : 0,
         stock: stockMatch ? parseFloat(stockMatch[1]) : 0,
         unit: 'unit',
         cost: 0,
         barcode: '',
         category: 'General',
         department: '',
         location: '',
         expiryDate: ''
       });
       setNotification({ type: 'success', message: 'Voice: Opened Add Product Modal with details' });
       return;
    }
    
    // Fallback: search products
    setSearchTerm(rawText.trim());
    setNotification({ type: 'info', message: `Voice searched for: ${rawText.trim()}` });
  };

  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand);

  // Clear confirmation state if user clicks elsewhere
  useEffect(() => {
    const handleClick = () => setConfirmDeleteId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const filteredCategories = FIXED_CATEGORIES.filter(cat => 
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    isPhoneticMatch(p.name, searchTerm) || 
    (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.serialNumber && p.serialNumber.toString().includes(searchTerm)) ||
    isPhoneticMatch(p.category, searchTerm)
  );

  useEffect(() => {
    if (editingProduct?.imageUrl) {
      setProductImage(editingProduct.imageUrl);
    } else {
      setProductImage(null);
    }
  }, [editingProduct]);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingStockProduct) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const quantity = Number(formData.get('quantity'));
    const expiryDate = formData.get('expiryDate') as string;
    
    if (isNaN(quantity) || quantity <= 0) {
      setNotification({ message: "Please enter a valid quantity", type: 'error' });
      return;
    }

    try {
      const stockData = {
        productId: addingStockProduct.id,
        quantity: quantity,
        type: 'add' as const,
        timestamp: new Date(),
        expiryDate: expiryDate || '',
        batchNumber: formData.get('batchNumber') as string || '',
        location: formData.get('location') as string || '',
        note: formData.get('note') as string || 'Manual stock add'
      };

      await addDoc(collection(db, 'stockRecords'), stockData);
      
      const updateData: any = {
        stock: increment(quantity)
      };
      
      // If new expiry date provided, update product's main expiry date too
      if (expiryDate) {
        updateData.expiryDate = expiryDate;
      }

      await updateDoc(doc(db, 'products', addingStockProduct.id), updateData);

      setNotification({ message: "Stock added successfully", type: 'success' });
      setAddingStockProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'stockRecords');
    }
  };

  const handleDownloadCSV = () => {
    const csvData = products.map(p => ({
      'Serial Number': p.serialNumber,
      'Name': p.name,
      'Category': p.category,
      'Price': p.price,
      'Cost': p.cost,
      'Stock': p.stock,
      'Unit': p.unit,
      'Barcode': p.barcode,
      'Expiry Date': p.expiryDate || '',
      'Location': p.location || '',
      'Department': p.department || '',
      'Warehouse': p.warehouse || ''
    }));
    
    // // @ts-ignore
    // import('papaparse').then(Papa => {
    //   const csv = Papa.unparse(csvData);
    //   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    //   const link = document.createElement('a');
    //   link.href = URL.createObjectURL(blob);
    //   link.setAttribute('download', `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    //   document.body.appendChild(link);
    //   link.click();
    //   document.body.removeChild(link);
    // });
  };

  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          const data = results.data;
          let newProductsCount = 0;
          const maxSerial = products.reduce((max, p) => Math.max(max, p.serialNumber || 0), 0);

          for (const row of data) {
            const name = row.Name || row.name || row['Product Name'];
            const price = Number(row.Price || row.price || row['Selling Price']);
            const serialFromCSV = Number(row['Serial Number'] || row.serialNumber);
            
            if (!name || isNaN(price)) continue;
            
            const productData = {
              name: name,
              category: row.Category || row.category || 'General',
              price: price,
              cost: Number(row.Cost || row.cost || row['Buying Price'] || 0),
              stock: Number(row.Stock || row.stock || row['Initial Stock'] || 0),
              unit: (row.Unit || row.unit || 'unit').toLowerCase() === 'kg' ? 'kg' : 'unit',
              barcode: row.Barcode || row.barcode || '',
              expiryDate: row['Expiry Date'] || row.expiryDate || '',
              location: row.Location || row.location || '',
              department: row.Department || row.department || '',
              warehouse: row.Warehouse || row.warehouse || ''
            };

            // Try to find existing product by Serial Number first, then Barcode, then Name
            const existing = products.find(p => 
              (serialFromCSV && p.serialNumber === serialFromCSV) ||
              (productData.barcode && p.barcode === productData.barcode) ||
              (p.name.toLowerCase() === name.toLowerCase())
            );

            if (existing) {
              await updateDoc(doc(db, 'products', existing.id), productData);
            } else {
              await addDoc(collection(db, 'products'), {
                ...productData,
                serialNumber: maxSerial + 1 + newProductsCount
              });
              newProductsCount++;
            }
          }
          setIsUploading(false);
          alert(`Inventory updated: ${data.length} rows processed.`);
        }
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const imageFile = (form.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
    
    let imageUrl = productImage;
    if (imageFile) {
      imageUrl = await fileToBase64(imageFile);
    }
    
    const productData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      cost: Number(formData.get('cost') || 0),
      stock: Number(formData.get('stock') || 0),
      unit: formData.get('unit') as 'kg' | 'unit',
      barcode: formData.get('barcode') as string || '',
      department: formData.get('department') as string || '',
      warehouse: formData.get('warehouse') as string || '',
      expiryDate: formData.get('expiryDate') as string || '',
      location: formData.get('location') as string || '',
      imageUrl: imageUrl
    };

    if (!productData.name || isNaN(productData.price) || productData.price < 0) {
      alert("Please enter a valid product name and price.");
      return;
    }

    try {
      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        // Generate serial number
        const maxSerial = products.reduce((max, p) => Math.max(max, p.serialNumber || 0), 0);
        const newProduct = {
          ...productData,
          serialNumber: maxSerial + 1
        };
        await addDoc(collection(db, 'products'), newProduct);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setProductImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const productToDelete = products.find(p => p.id === id);
      if (productToDelete) {
        await moveToRecycleBin('product', id, productToDelete);
      }
      await deleteDoc(doc(db, 'products', id));
      setNotification({ message: "Product moved to Recycle Bin", type: 'success' });
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
      setNotification({ message: "Failed to move product to Recycle Bin", type: 'error' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search products or say 'New product [name] price [x] stock [y]'"
            className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={toggleVoiceSearch}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-indigo-600 text-white shadow-lg animate-pulse shadow-indigo-200' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <AnimatePresence>
            {voiceFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg z-50 flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                "{voiceFeedback}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-100 transition-all border border-emerald-100">
              <Download className="w-4 h-4 rotate-180" />
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleUploadCSV} disabled={isUploading} />
            </label>
            <button 
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-all border border-blue-100"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setProductImage(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Dept/Wh</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Margin</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">SN: {product.serialNumber}</span>
                          <span>Barcode: {product.barcode || 'N/A'}</span>
                        </div>
                        {product.expiryDate && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-600 font-bold mt-1 uppercase bg-amber-50 w-fit px-1.5 rounded">
                            <Calendar className="w-2.5 h-2.5" />
                            Exp: {product.expiryDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{product.department || '-'}</span>
                      <span className="text-[10px] opacity-60">{product.warehouse || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(product.price - (product.cost || 0))}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {product.price > 0 ? Math.round(((product.price - (product.cost || 0)) / product.price) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 cursor-pointer group" onClick={() => onViewHistory(product)}>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all group-hover:ring-2 group-hover:ring-offset-2 ${
                      product.stock < 10 ? 'bg-red-50 text-red-600 group-hover:ring-red-500' : 'bg-emerald-50 text-emerald-600 group-hover:ring-emerald-500'
                    }`}>
                      {product.stock} {product.unit || 'pcs'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setAddingStockProduct(product)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Add Stock"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onViewHistory(product)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View History"
                      >
                        <HistoryIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmDeleteId === product.id) {
                            handleDelete(product.id);
                          } else {
                            setConfirmDeleteId(product.id);
                          }
                        }}
                        className={`p-2 rounded-lg transition-all relative ${
                          confirmDeleteId === product.id 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-lg scale-110" 
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title={confirmDeleteId === product.id ? "Click again to confirm" : "Delete Product"}
                      >
                        {confirmDeleteId === product.id ? (
                          <span className="text-[10px] font-bold px-1 animate-pulse">Confirm?</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); setProductImage(null); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-24 h-24 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                    {productImage ? (
                      <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-900 mb-1">Product Image</label>
                    <p className="text-xs text-gray-500 mb-3">Upload a clear picture of the product</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await fileToBase64(file);
                          setProductImage(base64);
                        }
                      }}
                      className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Product Name *</label>
                    <input name="name" defaultValue={editingProduct?.name || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter product name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="text" 
                          placeholder="Search category..." 
                          value={categorySearch || ''}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <select name="category" defaultValue={editingProduct?.category || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">Select Category</option>
                        {filteredCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Unit *</label>
                    <select name="unit" defaultValue={editingProduct?.unit || 'unit'} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="unit">Unit (pcs)</option>
                      <option value="kg">KG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Selling Price *</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price || 0} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Buying Price (Cost)</label>
                    <input name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost || 0} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Initial Stock</label>
                    <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Barcode</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Scan or enter barcode" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                    <input name="expiryDate" type="date" defaultValue={editingProduct?.expiryDate || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Location (Shelf/Aisle)</label>
                    <input name="location" defaultValue={editingProduct?.location || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Shelf A1" />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {addingStockProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Add Stock</h3>
                    <p className="text-xs text-gray-500">{addingStockProduct.name}</p>
                  </div>
                </div>
                <button onClick={() => setAddingStockProduct(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddStock} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quantity ({addingStockProduct.unit}) *</label>
                    <input name="quantity" type="number" step="0.001" required autoFocus className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Enter quantity to add" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Batch Number</label>
                    <input name="batchNumber" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Batch #" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                    <input name="expiryDate" type="date" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Stock Location</label>
                    <input name="location" defaultValue={addingStockProduct.location || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Shelf A1" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                    <textarea name="note" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none" placeholder="Optional notes..."></textarea>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setAddingStockProduct(null)} className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                    Update Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SalesHistory({ sales, onEdit, onDelete, settings }: { sales: Sale[], onEdit: (s: Sale) => void, onDelete: (s: Sale) => void, settings: ShopSettings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Clear confirmation state if user clicks elsewhere
  useEffect(() => {
    const handleClick = () => setConfirmDeleteId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerPhone?.includes(searchTerm)
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales History</h2>
          <p className="text-gray-500">Review past transactions and performance.</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search by invoice ID, customer name or phone..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date & Time</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Paid/Due</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map(sale => (
                <tr 
                  key={sale.id} 
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{format(safeDate(sale.timestamp), 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-gray-500">{format(safeDate(sale.timestamp), 'hh:mm a')}</p>
                    <p className="text-[10px] font-mono text-indigo-400">#{sale.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{sale.customerName || 'Walk-in'}</p>
                    {sale.customerPhone && (
                      <a 
                        href={`tel:${sale.customerPhone.replace(/\D/g, '')}`} 
                        className="text-xs text-gray-500 hover:text-indigo-600 hover:underline transition-colors"
                      >
                        {sale.customerPhone}
                      </a>
                    )}
                    {!sale.customerPhone && <p className="text-xs text-gray-500">N/A</p>}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(sale.finalAmount)}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
                        Paid: {formatCurrency(sale.paidAmount)}
                      </span>
                      {sale.dueAmount > 0 && (
                        <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">
                          Due: {formatCurrency(sale.dueAmount)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        id={`print-sale-${sale.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          printInvoice(sale, settings);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative z-10"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        id={`download-sale-${sale.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadInvoicePDF(sale, settings);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative z-10"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {sale.customerPhone && (
                        <div className="flex gap-1">
                          {settings.waTemplateEnglish && (
                            <button 
                              id={`wa-sale-en-${sale.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                sendWhatsAppInvoice(sale, settings, 'en');
                              }}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all relative z-10"
                              title="Send via WhatsApp (English)"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-[9px] font-bold">En</span>
                            </button>
                          )}
                          {settings.waTemplateBengali && (
                            <button 
                              id={`wa-sale-bn-${sale.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                sendWhatsAppInvoice(sale, settings, 'bn');
                              }}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all relative z-10"
                              title="Send via WhatsApp (Bengali)"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-[9px] font-bold">Bn</span>
                            </button>
                          )}
                        </div>
                      )}
                      <button 
                        id={`edit-sale-${sale.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(sale);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative z-10"
                        title="Edit Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        id={`delete-btn-${sale.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmDeleteId === sale.id) {
                            onDelete(sale);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(sale.id);
                          }
                        }}
                        className={`p-2 rounded-lg transition-all relative z-10 ${
                          confirmDeleteId === sale.id 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-lg scale-110" 
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title={confirmDeleteId === sale.id ? "Click again to confirm" : "Delete Order"}
                      >
                        {confirmDeleteId === sale.id ? (
                          <span className="text-[10px] font-bold px-1 animate-pulse">Confirm?</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
                <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Invoice ID</p>
                    <p className="text-lg font-bold text-gray-900">#{selectedSale.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="text-lg font-bold text-gray-900">{format(safeDate(selectedSale.timestamp), 'MMM dd, yyyy hh:mm a')}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-900 mb-2">Customer Info</p>
                  <p className="text-gray-700">{selectedSale.customerName || 'Walk-in'}</p>
                  {selectedSale.customerPhone && (
                    <a 
                      href={`tel:${selectedSale.customerPhone.replace(/\D/g, '')}`} 
                      className="text-sm text-gray-500 hover:text-indigo-600 hover:underline transition-colors block"
                    >
                      {selectedSale.customerPhone}
                    </a>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-900">Items</p>
                  <div className="divide-y divide-gray-100">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.price)}</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(selectedSale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-red-500">-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2">
                    <span className="text-gray-900">Grand Total</span>
                    <span className="text-indigo-600">{formatCurrency(selectedSale.finalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-4">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-emerald-600 font-bold">{formatCurrency(selectedSale.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Amount</span>
                    <span className="text-red-600 font-bold">{formatCurrency(selectedSale.dueAmount)}</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => printInvoice(selectedSale, settings)}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Print
                  </button>
                  <button 
                    onClick={() => downloadInvoicePDF(selectedSale, settings)}
                    className="flex-1 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Accounting({ 
  sales, 
  products, 
  expenses, 
  investments, 
  staffSalaries, 
  customers,
  onAddExpense,
  onAddInvestment,
  onAddSalary,
  onDeleteExpense,
  onDeleteInvestment,
  onDeleteSalary,
  onSendWhatsAppReminder
}: { 
  sales: Sale[], 
  products: Product[], 
  expenses: Expense[], 
  investments: Investment[], 
  staffSalaries: StaffSalary[],
  customers: Customer[],
  onAddExpense: (e: Omit<Expense, 'id'>) => void,
  onAddInvestment: (i: Omit<Investment, 'id'>) => void,
  onAddSalary: (s: Omit<StaffSalary, 'id'>) => void,
  onDeleteExpense: (e: Expense) => void,
  onDeleteInvestment: (i: Investment) => void,
  onDeleteSalary: (s: StaffSalary) => void,
  onSendWhatsAppReminder: (customer: Customer, lang: 'en' | 'bn') => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'investments' | 'salaries' | 'dues'>('overview');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  const totalSales = useMemo(() => sales.reduce((sum, s) => sum + (s.finalAmount || 0), 0), [sales]);
  const totalCost = useMemo(() => {
    return sales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        return itemSum + ((item.cost || 0) * item.quantity);
      }, 0);
    }, 0);
  }, [sales]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const totalInvestments = useMemo(() => investments.reduce((sum, i) => sum + (i.amount || 0), 0), [investments]);
  const totalSalaries = useMemo(() => staffSalaries.reduce((sum, s) => sum + (s.amount || 0), 0), [staffSalaries]);
  const totalMarketDue = useMemo(() => customers.reduce((sum, c) => sum + (c.currentDue || 0), 0), [customers]);
  const netProfit = totalSales - totalCost - totalExpenses;

  const highDueCustomers = useMemo(() => {
    return customers.filter(c => (c.currentDue || 0) >= 5000)
      .sort((a, b) => (b.currentDue || 0) - (a.currentDue || 0));
  }, [customers]);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    onAddExpense({
      category: formData.get('category') as any,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      timestamp: new Date()
    });
    setIsExpenseModalOpen(false);
  };

  const handleInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    onAddInvestment({
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      timestamp: new Date()
    });
    setIsInvestmentModalOpen(false);
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    onAddSalary({
      staffName: formData.get('staffName') as string,
      amount: Number(formData.get('amount')),
      month: formData.get('month') as string,
      timestamp: new Date()
    });
    setIsSalaryModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Hishab Nikash</h2>
          <p className="text-gray-500">Accounting and Financial Management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsExpenseModalOpen(true)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button onClick={() => setIsInvestmentModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Investment
          </button>
          <button onClick={() => setIsSalaryModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Pay Salary
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Net Profit/Loss</p>
          <h3 className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            TK {netProfit.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-400 mt-2">After expenses & cost</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <h3 className="text-2xl font-black text-red-500">TK {totalExpenses.toLocaleString()}</h3>
          <p className="text-xs text-gray-400 mt-2">Includes salaries & bills</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Market Due</p>
          <h3 className="text-2xl font-black text-orange-500">TK {totalMarketDue.toLocaleString()}</h3>
          <p className="text-xs text-gray-400 mt-2">Outstanding from customers</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Investments</p>
          <h3 className="text-2xl font-black text-indigo-600">TK {totalInvestments.toLocaleString()}</h3>
          <p className="text-xs text-gray-400 mt-2">Capital injected</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-100">
        {(['overview', 'expenses', 'investments', 'salaries', 'dues'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold capitalize transition-all ${
              activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-8">
            <h3 className="text-lg font-bold mb-6">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-600">Total Sales Revenue</span>
                <span className="font-bold text-gray-900">TK {totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-600">Total Product Cost</span>
                <span className="font-bold text-gray-900">TK {totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-600">Total Operating Expenses</span>
                <span className="font-bold text-red-600">TK {totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <span className="text-indigo-900 font-bold">Net Profit</span>
                <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  TK {netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td className="px-6 py-4 text-sm text-gray-600">{format(safeDate(exp.timestamp), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{exp.description}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">TK {exp.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {if(confirm('Delete expense?')) onDeleteExpense(exp)}}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'investments' && (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {investments.map(inv => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 text-sm text-gray-600">{format(safeDate(inv.timestamp), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.description}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">TK {inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {if(confirm('Delete investment?')) onDeleteInvestment(inv)}}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'salaries' && (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Staff Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Month</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffSalaries.map(sal => (
                <tr key={sal.id}>
                  <td className="px-6 py-4 text-sm text-gray-600">{format(safeDate(sal.timestamp), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{sal.staffName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sal.month}</td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600 text-right">TK {sal.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {if(confirm('Delete salary record?')) onDeleteSalary(sal)}}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'dues' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <p className="font-bold">High Due Alert</p>
                <p className="text-sm">Customers with dues over TK 5,000 require immediate attention.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highDueCustomers.map(customer => (
                <div 
                  key={customer.id} 
                  className={`p-6 rounded-3xl border-2 transition-all ${
                    customer.currentDue >= 10000 
                      ? 'bg-yellow-50 border-yellow-400' 
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{customer.name}</h4>
                      {customer.phone && (
                        <a 
                          href={`tel:${customer.phone.replace(/\D/g, '')}`} 
                          className="text-xs text-gray-500 hover:text-indigo-600 hover:underline transition-colors block"
                        >
                          {customer.phone}
                        </a>
                      )}
                      {!customer.phone && <p className="text-xs text-gray-500">No phone</p>}
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      customer.currentDue >= 10000 ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {customer.currentDue >= 10000 ? 'Critical' : 'Warning'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Due</p>
                    <p className="text-2xl font-black text-gray-900">TK {customer.currentDue.toLocaleString()}</p>
                  </div>
                  {customer.dueDate && (
                    <div className="mb-4 flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Promised: {format(new Date(customer.dueDate), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => onSendWhatsAppReminder(customer, 'en')}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-700 transition-all"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Remind (En)
                    </button>
                    <button 
                      onClick={() => onSendWhatsAppReminder(customer, 'bn')}
                      className="flex-1 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-800 transition-all"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Remind (Bn)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Add New Expense</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" required className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500">
                  <option value="salary">Staff Salary</option>
                  <option value="rent">Shop Rent</option>
                  <option value="electricity">Electricity Bill</option>
                  <option value="internet">Internet Bill</option>
                  <option value="food">Food Expense</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input name="amount" type="number" required className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 h-24" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-red-600 text-white font-bold rounded-xl">Save Expense</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isInvestmentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Add New Investment</h3>
            <form onSubmit={handleInvestmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input name="amount" type="number" required className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 h-24" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsInvestmentModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl">Save Investment</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Staff Salary Payment</h3>
            <form onSubmit={handleSalarySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
                <input name="staffName" required className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input name="month" placeholder="e.g. March 2024" required className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input name="amount" type="number" required className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl">Pay Salary</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function Customers({ customers, sales, setNotification, shopSettings }: { 
  customers: Customer[], 
  sales: Sale[],
  setNotification: (n: { message: string, type: 'success' | 'error' | 'info' } | null) => void,
  shopSettings: ShopSettings
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Clear confirmation state if user clicks elsewhere
  useEffect(() => {
    const handleClick = () => setConfirmDeleteId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const sendCustomerWhatsApp = (customer: Customer, lang: 'en' | 'bn') => {
    const template = lang === 'bn' 
      ? (shopSettings.waTemplateBengali || "প্রিয় {{customerName}}, {{shopName}}-এ আপনার বকেয়া {{dueAmount}} টাকা। অনুগ্রহ করে সময়মতো পরিশোধ করুন।") 
      : (shopSettings.waTemplateEnglish || "Dear {{customerName}}, your due amount at {{shopName}} is {{dueAmount}}. Please pay on time.");
    
    // Basic variable substitution
    const message = template
      .replace('{{customerName}}', customer.name || 'Customer')
      .replace('{{shopName}}', shopSettings.name || 'Shop')
      .replace('{{dueAmount}}', (customer.currentDue || 0).toString());

    const cleanPhone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const customerData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      fatherName: formData.get('fatherName') as string,
      houseName: formData.get('houseName') as string,
      currentDue: Number(formData.get('currentDue')),
      dueDate: formData.get('dueDate') as string,
      points: Number(formData.get('points') || 0),
      totalSpent: Number(formData.get('totalSpent') || 0),
    };

    try {
      if (editingCustomer?.id) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
      } else {
        const maxSerial = customers.reduce((max, c) => Math.max(max, c.serialNumber || 0), 0);
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          serialNumber: maxSerial + 1
        });
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Customer save error", error);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    try {
      const customerToDelete = customers.find(c => c.id === id);
      if (customerToDelete) {
        await moveToRecycleBin('customer', id, customerToDelete);
      }
      await deleteDoc(doc(db, 'customers', id));
      setNotification({ message: "Customer moved to Recycle Bin", type: 'success' });
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'customers');
      setNotification({ message: "Failed to move customer to Recycle Bin", type: 'error' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-500">Manage customer relationships and dues.</p>
        </div>
        <button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Details</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Current Due</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Due Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Spent</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-[10px] font-mono text-indigo-400">SN: {customer.serialNumber || 'N/A'}</p>
                        <a 
                          href={customer.phone ? `tel:${customer.phone.replace(/\D/g, '')}` : '#'} 
                          className="text-xs text-gray-500 hover:text-indigo-600 hover:underline transition-colors block"
                          onClick={(e) => !customer.phone && e.preventDefault()}
                        >
                          {customer.phone || 'No phone'}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      {customer.fatherName && <p><span className="font-bold">Father:</span> {customer.fatherName}</p>}
                      {customer.address && <p><span className="font-bold">Addr:</span> {customer.address}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedCustomerForHistory(customer)}
                      className={`font-bold px-3 py-1 rounded-full text-xs ${
                        (customer.currentDue || 0) >= 10000 ? 'bg-red-100 text-red-700' :
                        (customer.currentDue || 0) >= 5000 ? 'bg-orange-100 text-orange-700' :
                        (customer.currentDue || 0) > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-emerald-100 text-emerald-700'
                      } flex items-center gap-1 hover:opacity-80`}
                    >
                      TK {customer.currentDue || 0}
                      {(customer.currentDue || 0) > 0 && <ArrowRight className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-600">
                      {customer.dueDate || 'No date set'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">TK {customer.totalSpent || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex gap-1">
                        {shopSettings.waTemplateEnglish && (
                          <button 
                            onClick={() => sendCustomerWhatsApp(customer, 'en')}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Send Message (English)"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-[9px] font-bold">En</span>
                          </button>
                        )}
                        {shopSettings.waTemplateBengali && (
                          <button 
                            onClick={() => sendCustomerWhatsApp(customer, 'bn')}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Send Message (Bengali)"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-[9px] font-bold">Bn</span>
                          </button>
                        )}
                        {(!shopSettings.waTemplateEnglish && !shopSettings.waTemplateBengali) && (
                          <button 
                            onClick={() => sendCustomerWhatsApp(customer, 'en')}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Send Reminder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => setSelectedCustomerForHistory(customer)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View History"
                      >
                        <HistoryIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmDeleteId === customer.id) {
                            handleDelete(customer.id);
                          } else {
                            setConfirmDeleteId(customer.id);
                          }
                        }}
                        className={`p-2 rounded-lg transition-all relative ${
                          confirmDeleteId === customer.id 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-lg scale-110" 
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title={confirmDeleteId === customer.id ? "Click again to confirm" : "Delete Customer"}
                      >
                        {confirmDeleteId === customer.id ? (
                          <span className="text-[10px] font-bold px-1 animate-pulse">Confirm?</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input name="name" defaultValue={editingCustomer?.name || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input name="phone" defaultValue={editingCustomer?.phone || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
                  <input name="fatherName" defaultValue={editingCustomer?.fatherName || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">House Name/No</label>
                  <input name="houseName" defaultValue={editingCustomer?.houseName || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input name="address" defaultValue={editingCustomer?.address || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Due (TK)</label>
                  <input name="currentDue" type="number" defaultValue={editingCustomer?.currentDue || 0} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Promised Due Date</label>
                  <input name="dueDate" type="date" defaultValue={editingCustomer?.dueDate || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Save Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCustomerForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <HistoryIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedCustomerForHistory.name} - Transaction History</h3>
                    <p className="text-xs text-gray-500">Total Outstanding: TK {selectedCustomerForHistory.currentDue}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomerForHistory(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {sales.filter(s => s.customerId === selectedCustomerForHistory.id).length === 0 ? (
                    <p className="text-center text-gray-400 py-8 italic">No transactions found for this customer.</p>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-500 uppercase border-b border-gray-200">
                        <tr>
                          <th className="py-2">Date</th>
                          <th className="py-2">Invoice #</th>
                          <th className="py-2 text-right">Spent</th>
                          <th className="py-2 text-right">Paid</th>
                          <th className="py-2 text-right">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sales.filter(s => s.customerId === selectedCustomerForHistory.id)
                          .sort((a,b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime())
                          .map(sale => (
                            <tr key={sale.id}>
                              <td className="py-3 text-xs">{format(safeDate(sale.timestamp), 'dd/MM/yy HH:mm')}</td>
                              <td 
                                className="py-3 font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                                onDoubleClick={() => printInvoice(sale, shopSettings)}
                                title="Double-click to print invoice"
                              >
                                {sale.id}
                              </td>
                              <td className="py-3 text-right">TK {sale.finalAmount.toFixed(0)}</td>
                              <td className="py-3 text-right text-emerald-600">TK {sale.paidAmount.toFixed(0)}</td>
                              <td className="py-3 text-right text-red-600">TK {sale.dueAmount.toFixed(0)}</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setSelectedCustomerForHistory(null)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DailyClosingView({ sales, expenses, dailyClosings, settings, user, onDelete }: { sales: Sale[], expenses: Expense[], dailyClosings: DailyClosing[], settings: ShopSettings, user?: any, onDelete: (closing: DailyClosing) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closingToDelete, setClosingToDelete] = useState<DailyClosing | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Find the last closing timestamp to define the current session
  const lastClosingDate = useMemo(() => {
    if (!dailyClosings || dailyClosings.length === 0) return null;
    const sorted = [...dailyClosings].sort((a, b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime());
    return safeDate(sorted[0].timestamp).getTime();
  }, [dailyClosings]);
  
  // Calculate stats for the current session (since last closing)
  // We filter by 'today' as well to keep the context of "Daily Closing"
  // but if user wants it purely session-based regardless of date, we'd remove the 'today' check.
  // Given it's called 'DailyClosing', keeping the today check is safer to avoid multi-day aggregation in a single report.
  const todaySales = sales.filter(s => {
    const ts = safeDate(s.timestamp);
    const tsTime = ts.getTime();
    const isSameDay = format(ts, 'yyyy-MM-dd') === today;
    const isAfterLastClosing = !lastClosingDate || tsTime > lastClosingDate;
    return isSameDay && isAfterLastClosing;
  });
  
  const totalSales = todaySales.reduce((sum, s) => sum + s.finalAmount, 0);
  const cashSales = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.paidAmount, 0);
  const dueSales = todaySales.reduce((sum, s) => sum + s.dueAmount, 0);
  const cashReceived = todaySales.reduce((sum, s) => sum + s.paidAmount, 0);
  
  const todayExpenses = expenses.filter(e => {
    const ts = safeDate(e.timestamp);
    const tsTime = ts.getTime();
    const isSameDay = format(ts, 'yyyy-MM-dd') === today;
    const isAfterLastClosing = !lastClosingDate || tsTime > lastClosingDate;
    return isSameDay && isAfterLastClosing;
  }).reduce((sum, e) => sum + e.amount, 0);

  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0
  });
  const [bkashBalance, setBkashBalance] = useState(0);
  const [notes, setNotes] = useState('');

  const totalCashInDrawer = Object.entries(denominations).reduce((sum, [val, count]) => sum + (parseInt(val) * (count as number)), 0);

  const handleSaveClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    const closingData = {
      date: today,
      totalSales,
      cashSales,
      dueSales,
      collections: cashReceived - cashSales,
      totalExpenses: todayExpenses,
      cashInHand: totalCashInDrawer,
      bkashBalance,
      denominations,
      notes,
      timestamp: new Date()
    };

    try {
      await addDoc(collection(db, 'daily_closings'), closingData);
      setIsModalOpen(false);
      alert('Daily Closing Saved Successfully');
    } catch (error) {
      console.error("Error saving daily closing", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Daily Closing</h2>
          <p className="text-gray-500">Summarize and close today's accounts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          New Closing
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Sales (Today)</p>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(totalSales)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Cash Received (Today)</p>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(cashReceived)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Due Sales (Today)</p>
          <p className="text-2xl font-black text-red-600">{formatCurrency(dueSales)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Expenses (Today)</p>
          <p className="text-2xl font-black text-orange-600">{formatCurrency(todayExpenses)}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold">Recent Closings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Sales</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Cash in Hand</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">bKash</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailyClosings.sort((a, b) => b.date.localeCompare(a.date)).map(closing => (
                <tr key={closing.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{format(new Date(closing.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">{formatCurrency(closing.totalSales)}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(closing.cashInHand)}</td>
                  <td className="px-6 py-4 text-pink-600 font-bold">{formatCurrency(closing.bkashBalance)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">CLOSED</span>
                      <button 
                        onClick={() => printDailyClosing(closing, settings, user)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Print Report"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setClosingToDelete(closing)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete (Move to Bin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {closingToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Daily Closing?</h3>
              <p className="text-gray-500 mb-8">This will move the closing for {format(new Date(closingToDelete.date), 'dd MMM yyyy')} to the Recycle Bin.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setClosingToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onDelete(closingToDelete);
                    setClosingToDelete(null);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold">Daily Cash Closing - {format(new Date(), 'dd MMM yyyy')}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveClosing} className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Denominations (Notes)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(denominations).sort((a, b) => Number(b) - Number(a)).map(val => (
                      <div key={val} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <div className="w-12 text-right font-bold text-gray-600">{val}</div>
                        <div className="text-gray-400">×</div>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                          value={denominations[val]}
                          onChange={(e) => setDenominations({...denominations, [val]: Number(e.target.value)})}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                    <p className="text-xs opacity-80 uppercase font-bold">Total Cash in Drawer</p>
                    <p className="text-3xl font-black">{formatCurrency(totalCashInDrawer)}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Other Accounts</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">bKash Balance</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="number" 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-pink-500"
                          value={bkashBalance}
                          onChange={(e) => setBkashBalance(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <textarea 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                        placeholder="Any discrepancies or notes for today..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Sales:</span>
                      <span className="font-bold">{formatCurrency(totalSales)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cash Received:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Expenses:</span>
                      <span className="font-bold text-red-600">-{formatCurrency(todayExpenses)}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between">
                      <span className="font-bold">Expected Cash:</span>
                      <span className="font-black text-indigo-600">{formatCurrency(cashReceived - todayExpenses)}</span>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Confirm & Save Closing
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
