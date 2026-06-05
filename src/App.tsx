// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ShopOnboarding } from './components/ShopOnboarding';
import { useVoiceSearch } from './hooks/useVoiceSearch';
import { standardizeBn, toPhonetic, parseVoiceCommandQuantity, isPhoneticMatch, parseNewProductVoiceCommand, formatToBnDate } from './utils/voiceUtils';
import { parseMathVoiceCommandAI } from './utils/mathVoiceParser';
import { parsePosVoiceCommandAI } from './utils/aiVoiceParser';
import { addToSyncQueue, getSyncQueue, removeFromSyncQueue } from './utils/offlineDb';
import { 
  CheckSquare,
  LayoutDashboard, 
  Bot,
  ChevronLeft,
  Package, 
  ShoppingCart, 
  ShoppingBag,
  History, 
  Users, 
  Settings, 
  Download,
  Upload,
  Shield,
  Building2,
  Database,
  Warehouse as WarehouseIcon,
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Pencil,
  Save, 
  Send,
  X, 
  Menu,
  LogOut, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  Box, 
  User,
  User as UserIcon,
  UserCheck,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Check,
  Printer,
  Minus,
  ScanLine,
  Scan,
  MessageCircle,
  Calendar,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2,
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
  MicOff,
  Barcode,
  StickyNote,
  ShieldCheck,
  CreditCard,
  Truck,
  KeySquare,
  Gift,
  Globe,
  UserCog,
  Warehouse,
  Building,
  Pin,
  CirclePlus,
  QrCode,
  ChevronDown,
  List,
  FileSpreadsheet,
  Receipt,
  Filter,
  Activity,
  FileText,
  Target,
  MessageSquare,
  Phone,
  UserPlus,
  ClipboardList,
  Coins,
  BarChart3,
  Smartphone,
  Monitor as MonitorIcon,
  Landmark,
  Lock,
  Wallet,
  Navigation,
  MapPin,
  Tag,
  Factory,
  Database as DatabaseIcon,
  PhoneCall,
  Loader2,
  Volume2,
  VolumeX,
  Copy,
  Delete,
  Star
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { CategoryManagement } from './components/CategoryManagement';
import { JarvisAI } from './components/JarvisAI';
import { NetworkConsole } from './components/NetworkConsole';
import { CustomerPortal } from './components/CustomerPortal';
import { SellerOrdersView } from './components/SellerOrdersView';
import Dashboard from './components/Dashboard';

import { fuzzyMatchProduct } from './utils/productMatcher';
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
  signInAnonymously,
  secondaryAuth,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  OperationType,
  handleFirestoreError,
  increment,
  serverTimestamp,
  writeBatch
} from './firebase';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { format, isPast } from 'date-fns';
// Google GenAI support moved to server proxy
import ReactBarcode from 'react-barcode';
import QRCode from 'react-qr-code';

// --- Types ---
type UserRole = 'admin' | 'manager' | 'assistant_manager' | 'sales_manager' | 'sales_team';

interface AppUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  shopId: string;
}

interface ShopSettings {
  name: string;
  address: string;
  shopCode?: string;
  logoUrl?: string;
  logoBase64?: string;
  faviconBase64?: string;
  platformTitle?: string;
  phone?: string;
  whatsappSender?: string;
  receiptWidth?: '58mm' | '80mm';
  waGatewayType: 'manual' | 'metacloud' | 'generic';
  waApiUrl?: string;
  waToken?: string;
  waInstanceId?: string;
  waPhoneNumberId?: string;
  autoSendWhatsApp?: boolean;
  aiWhatsAppEnabled?: boolean;
  receiptFooter?: string;
  waTemplateEnglish?: string;
  waTemplateBengali?: string;
  printLanguage: 'en' | 'bn' | 'ar';
  systemLanguage: 'en' | 'bn' | 'ar';
  currencySymbol: string;
  jarvisLanguage: 'en' | 'bn';
  jarvisVoiceGender: 'male' | 'female';
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
    tax: 'Tax (VAT)',
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
    tax: 'ভ্যাট/ট্যাক্স',
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
    retailSale: 'নগদ ক্রেতা (Walk-in)',
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
  },
  ar: {
    invoice: 'فاتورة',
    dailyReport: 'تقرير الإغلاق اليومي',
    date: 'التاريخ',
    time: 'الوقت',
    customer: 'العميل',
    phone: 'الهاتف',
    item: 'الصنف',
    qty: 'الكمية',
    price: 'السعر',
    amount: 'المبلغ',
    total: 'الإجمالي',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    grandTotal: 'المجموع الكلي',
    paid: 'المدفوع',
    due: 'المتبقي',
    footer: 'شكراً لتعاملكم معنا!',
    invoiceId: 'رقم الفاتورة',
    address: 'العنوان',
    collectedBy: 'المحصل',
    closingSummary: 'ملخص الإغلاق',
    cashInHand: 'النقد المتوفر',
    bkash: 'الرصيد عبر الإنترنت',
    nagad: 'كاش نقد (نقد)',
    bank: 'البنك',
    expenses: 'المصاريف',
    totalSales: 'إجمالي المبيعات',
    cashReceived: 'النقد المستلم',
    status: 'الحالة',
    closed: 'مغلق',
    itemsCount: 'عدد الأصناف',
    retailSale: 'عميل عابر',
    cashSales: 'المبيعات النقدية',
    dueSales: 'المبيعات الآجلة',
    collection: 'التحصيل',
    totalCashReceived: 'إجمالي النقد المستلم',
    expectedCash: 'النقد المتوقع',
    actualCash: 'النقد الفعلي',
    discrepancyMatch: 'الحساب صحيح تماماً',
    discrepancyPlus: 'زيادة+',
    discrepancyMinus: 'عجز',
    noteDetails: 'تفاصيل العملات',
    noNotes: 'لا توجد بيانات متاحة',
    digitalBalance: 'الرصيد الرقمي',
    additionalNotes: 'ملاحظات إضافية',
    printedAt: 'تمت الطباعة في',
    balanceSummary: 'ملخص الرصيد',
    prevBalance: 'الرصيد السابق',
    todayBill: 'فاتورة اليوم',
    totalPayable: 'إجمالي المستحق',
    todayPaid: 'المدفوع اليوم',
    currentBalance: 'الرصيد المتبقي الحالي',
    mobile: 'الجوال'
  }
};

const SYSTEM_TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    sales: 'Sales History',
    pos: 'Point of Sale',
    customers: 'Customers',
    hishabNikash: 'Hishab Nikash',
    note: 'Note',
    warranty: 'Warranty',
    loanManagement: 'Loan Management',
    paymentMethod: 'Payment Method',
    courier: 'Courier',
    supplier: 'Supplier',
    activationCode: 'Activation Code',
    serviceOffer: 'Service/Offer',
    onlineShop: 'Online Shop',
    mainAdmin: 'Main Admin',
    warehouse: 'Warehouse',
    recycleBin: 'Recycle Bin',
    employees: 'Employees',
    dailyClosing: 'Daily Closing',
    settings: 'Settings & Admin',
    jarvisAI: 'AI Assistant',
    totalSales: 'Total Sales',
    totalPurchase: 'Total Purchase',
    totalProfit: 'Total Profit',
    totalDue: 'Total Due',
    lowStock: 'Low Stock Products',
    productsByCat: 'Products by Category',
    recentTransactions: 'Recent Transactions',
    welcome: 'Welcome back',
    systemStatus: 'System Status',
    online: 'Online',
    offline: 'Offline',
    lastSync: 'Last sync',
    logout: 'Logout',
    version: 'Version',
    search: 'Search...',
    addItem: 'Add Item',
    saveProduct: 'Save Product',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    name: 'Name',
    category: 'Category',
    stock: 'Stock',
    unit: 'Unit',
    price: 'Price',
    cost: 'Cost',
    barcode: 'Barcode',
    expiry: 'Expiry',
    location: 'Location',
    company: 'Company',
    actions: 'Actions',
    cashReceived: 'Cash Received',
    retailSale: 'Retail Sale',
    expenses: 'Expenses',
    merchantLogin: 'Merchant Access',
    staffLogin: 'Staff Access',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    googleSignIn: 'Sign in with Google',
    loginTitle: 'Business Management Suite',
    loginSubtitle: 'Secure access to your store operations',
    core: 'Core',
    inventory_group: 'Inventory',
    sales_crm: 'Sales & CRM',
    accounting: 'Accounting',
    management: 'Management',
    master_console: 'Master Console',
    stockInventory: 'Stock Inventory',
    products: 'Products',
    liveStock: 'Live Stock',
    sortSerial: 'Sort: Serial No.',
    sortName: 'Sort: Name',
    sortCompany: 'Sort: Company',
    sortNearExpire: 'Sort: Near Expire',
    showExpiredOnly: 'Show: Expired Only',
    sortPrice: 'Sort: Price',
    sortStock: 'Sort: Stock',
    sortLongTimeNoSell: 'Sort: Long Time No Sell',
    sortTrending: 'Sort: Trending',
    ascending: 'Ascending (A-Z)',
    descending: 'Descending (Z-A)',
    addProduct: 'Add Product',
    updateProduct: 'Update Product',
    uploadCSV: 'Upload CSV',
    downloadCSV: 'Download CSV',
    voiceSearch: 'Voice Search',
    expiryAlerts: 'Expiry Alerts',
    expiryAlertsDesc: 'The following products are nearing their expiry date (within 30 days).',
    businessSnapshot: 'Business Snapshot',
    totalExpenses: 'Total Expenses',
    loginSubtitleMerchant: 'Use your Google account to access your merchant dashboard.',
    loginSubtitleStaff: 'Use your company provided credentials to access operations.',
    fullScreenOn: 'Full Screen On',
    fullScreenOff: 'Leave Full Screen',
    downloadAndroid: 'Download Android App',
    downloadDesktop: 'Download Desktop App',
    downloadTab: 'Download',
  },
  bn: {
    jarvisAI: 'এআই অ্যাসিস্ট্যান্ট',

    dashboard: 'ড্যাশবোর্ড',
    inventory: 'ইনভেন্টরি',
    sales: 'বিক্রয় ইতিহাস',
    pos: 'পয়েন্ট অফ সেল',
    customers: 'ক্রেতাগণ',
    hishabNikash: 'হিসাব নিকাশ',
    note: 'নোট (Note)',
    warranty: 'ওয়ারেন্টি (Warranty)',
    loanManagement: 'লোন ম্যানেজমেন্ট (Loan)',
    paymentMethod: 'পেমেন্ট মেথড (Payment)',
    courier: 'কুরিয়ার (Courier)',
    supplier: 'সরবরাহকারী (Supplier)',
    activationCode: 'অ্যাক্টিভেশন কোড (Code)',
    serviceOffer: 'সার্ভিস/অফার (Offer)',
    onlineShop: 'অনলাইন শপ (Online Shop)',
    mainAdmin: 'মেইন অ্যাডমিন (Main Admin)',
    warehouse: 'ওয়্যারহাউস (Warehouse)',
    recycleBin: 'রিসাইকেল বিন',
    employees: 'কর্মচারী ব্যবস্থাপনা',
    dailyClosing: 'দৈনিক ক্লোজিং',
    settings: 'সেটিংস ও অ্যাডমিন',
    totalSales: 'মোট বিক্রয়',
    totalPurchase: 'মোট ক্রয়',
    totalProfit: 'মোট লাভ',
    totalDue: 'মোট বাকি',
    lowStock: 'কম স্টকের পণ্য',
    productsByCat: 'ক্যাটেগরি অনুযায়ী পণ্য',
    recentTransactions: 'সাম্প্রতিক লেনদেন',
    welcome: 'স্বাগতম',
    systemStatus: 'সিস্টেম স্ট্যাটাস',
    online: 'অনলাইন',
    offline: 'অফলাইন',
    lastSync: 'সর্বশেষ সিঙ্ক',
    logout: 'লগআউট',
    version: 'ভার্সন',
    search: 'খুঁজুন...',
    addItem: 'আইটেম যোগ করুন',
    saveProduct: 'পণ্য সেভ করুন',
    cancel: 'বাতিল',
    edit: 'এডিট',
    delete: 'ডিলিট',
    view: 'দেখুন',
    name: 'নাম',
    category: 'ক্যাটেগরি',
    stock: 'স্টক',
    unit: 'ইউনিট',
    price: 'মূল্য',
    cost: 'কেনা দাম',
    barcode: 'বারকোড',
    expiry: 'মেয়াদ',
    location: 'অবস্থান',
    company: 'কোম্পানি',
    actions: 'অ্যাকশন',
    cashReceived: 'নগদ গ্রহণ',
    retailSale: 'নগদ বিক্রি',
    expenses: 'খরচ',
    merchantLogin: 'মার্শেন্ট এক্সেস',
    staffLogin: 'স্টাফ লগইন',
    username: 'ইউজারনাম',
    password: 'পাসওয়ার্ড',
    signIn: 'লগইন করুন',
    googleSignIn: 'গুগল দিয়ে লগইন',
    loginTitle: 'বিজনেস ম্যানেজমেন্ট স্যুট',
    loginSubtitle: 'আপনার দোকানের কার্যক্রম সুরক্ষিতভাবে পরিচালনা করুন',
    core: 'মূল মেনু',
    inventory_group: 'ইনভেন্টরি',
    sales_crm: 'বিক্রয় ও সিআরএম',
    accounting: 'হিসাববিজ্ঞান',
    management: 'ব্যবস্থাপনা',
    master_console: 'মাস্টার কনসোল',
    stockInventory: 'স্টক ইনভেন্টরি',
    products: 'পণ্যসমূহ',
    liveStock: 'মোট স্টক',
    sortSerial: 'সিরিয়াল নম্বর অনুযায়ী',
    sortName: 'নাম অনুযায়ী',
    sortCompany: 'কোম্পানি অনুযায়ী',
    sortNearExpire: 'মেয়াদ উত্তীর্ণ আসন্ন',
    showExpiredOnly: 'শুধুমাত্র মেয়াদ উত্তীর্ণ',
    sortPrice: 'মূল্য অনুযায়ী',
    sortStock: 'স্টক অনুযায়ী',
    sortLongTimeNoSell: 'অনেকদিন বিক্রি হয়নি',
    sortTrending: 'ট্রেন্ডিং পণ্য',
    ascending: 'ছোট থেকে বড় (A-Z)',
    descending: 'বড় থেকে ছোট (Z-A)',
    addProduct: 'নতুন পণ্য যোগ করুন',
    updateProduct: 'পণ্য আপডেট করুন',
    uploadCSV: 'সিএসভি আপলোড',
    downloadCSV: 'সিএসভি ডাউনলোড',
    voiceSearch: 'ভয়েস সার্চ',
    expiryAlerts: 'মেয়াদ উত্তীর্ণের সতর্কবার্তা',
    expiryAlertsDesc: 'নিচের পণ্যগুলোর মেয়াদের তারিখ সন্নিকটে (৩০ দিনের মধ্যে)',
    businessSnapshot: 'আপনার ব্যবসার সংক্ষিপ্ত চিত্র',
    totalExpenses: 'মোট খরচ',
    loginSubtitleMerchant: 'লগইন করতে আপনার গুগল একাউন্ট ব্যবহার করুন।',
    loginSubtitleStaff: 'আপনার কোম্পানি থেকে দেওয়া আইডি দিয়ে লগইন করুন।',
    fullScreenOn: 'ফুল স্ক্রিন করুন',
    fullScreenOff: 'ফুল স্ক্রিন বন্ধ করুন',
    downloadAndroid: 'অ্যান্ড্রয়েড অ্যাপ ডাউনলোড',
    downloadDesktop: 'ডেস্কটপ অ্যাপ ডাউনলোড',
    downloadTab: 'ডাউনলোড',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    inventory: 'المخزون',
    sales: 'سجل المبيعات',
    pos: 'نقطة البيع',
    customers: 'العملاء',
    hishabNikash: 'الحسابات',
    note: 'ملاحظة',
    warranty: 'الضمان',
    loanManagement: 'إدارة القروض',
    paymentMethod: 'طريقة الدفع',
    courier: 'ساعي',
    supplier: 'المورد',
    activationCode: 'رمز التفعيل',
    serviceOffer: 'الخدمة/العرض',
    onlineShop: 'متجر على الانترنت',
    mainAdmin: 'المسؤول الرئيسي',
    warehouse: 'المستودع',
    recycleBin: 'سلة المهملات',
    employees: 'إدارة الموظفين',
    dailyClosing: 'الإغلاق اليومي',
    settings: 'الإعدادات والمسؤول',
    totalSales: 'إجمالي المبيعات',
    totalPurchase: 'إجمالي المشتريات',
    totalProfit: 'إجمالي الربح',
    totalDue: 'إجمالي المستحقات',
    lowStock: 'المنتجات منخفضة المخزون',
    productsByCat: 'المنتجات حسب الفئة',
    recentTransactions: 'أحدث المعاملات',
    welcome: 'أهلاً بك مجدداً',
    systemStatus: 'حالة النظام',
    online: 'متصل',
    offline: 'غير متصل',
    lastSync: 'آخر مزامنة',
    logout: 'تسجيل الخروج',
    version: 'الإصدار',
    search: 'بحث...',
    addItem: 'إضافة صنف',
    saveProduct: 'حفظ المنتج',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    view: 'عرض',
    name: 'الاسم',
    category: 'الفئة',
    stock: 'المخزون',
    unit: 'الوحدة',
    price: 'السعر',
    cost: 'التكلفة',
    barcode: 'باركود',
    expiry: 'تاريخ الانتهاء',
    location: 'الموقع',
    company: 'الشركة',
    actions: 'الإجراءات',
    cashReceived: 'النقد المستلم',
    retailSale: 'مبيعات التجزئة',
    expenses: 'المصاريف',
    core: 'الأساسية',
    inventory_group: 'المخزون',
    sales_crm: 'المبيعات وعلاقات العملاء',
    accounting: 'المحاسبة',
    management: 'الإدارة',
    master_console: 'لوحة التحكم الرئيسية',
    stockInventory: 'مخزون المنتجات',
    products: 'منتجات',
    liveStock: 'المخزون الحالي',
    sortSerial: 'الترتيب: الرقم التسلسلي',
    sortName: 'الترتيب: الاسم',
    sortCompany: 'الترتيب: الشركة',
    sortNearExpire: 'الترتيب: قرب انتهاء الصلاحية',
    showExpiredOnly: 'عرض: المنتهي الصلاحية فقط',
    sortPrice: 'الترتيب: السعر',
    sortStock: 'الترتيب: المخزون',
    sortLongTimeNoSell: 'الترتيب: لم يباع منذ فترة',
    sortTrending: 'الترتيب: الأكثر مبيعاً',
    ascending: 'تصاعدي (A-Z)',
    descending: 'تنازلي (Z-A)',
    addProduct: 'إضافة منتج',
    updateProduct: 'تحديث المنتج',
    uploadCSV: 'تحميل CSV',
    downloadCSV: 'تنزيل CSV',
    voiceSearch: 'البحث الصوتي',
    expiryAlerts: 'تنبيهات انتهاء الصلاحية',
    expiryAlertsDesc: 'المنتجات التالية تقترب من تاريخ انتهاء صلاحيتها (خلال 30 يومًا).',
    businessSnapshot: 'لقطة للأعمال',
    totalExpenses: 'إجمالي المصاريف',
    fullScreenOn: 'ملء الشاشة',
    fullScreenOff: 'خروج من ملء الشاشة',
    loginSubtitleMerchant: 'استخدم حساب Google للوصول إلى لوحة تحكم التاجر.',
    loginSubtitleStaff: 'استخدم بيانات الاعتماد المقدمة من شركتك للوصول إلى العمليات.',
    downloadAndroid: 'تنزيل تطبيق أندرويد',
    downloadDesktop: 'تنزيل تطبيق سطح المكتب',
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
  unit: 'kg' | 'unit' | 'dozen' | 'hali';
  barcode: string;
  expiryDate?: string;
  location?: string;
  department?: string;
  warehouse?: string;
  company?: string;
  imageUrl?: string;
  warranty?: string;
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
  taxRate?: number;
  taxAmount?: number;
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

interface CustomerLog {
  id: string;
  customerId: string;
  type: 'profile_edit' | 'manual_due' | 'csv_import';
  oldData?: any;
  newData?: any;
  timestamp: any;
  performedBy: string;
  performedByRole: string;
}

interface DuePayment {
  id: string;
  customerId: string;
  amount: number;
  previousDue: number;
  remainingDue: number;
  method: 'cash' | 'bkash' | 'nagad' | 'bank';
  timestamp: any;
  receivedBy: string;
  note?: string;
}

interface Note {
  id: string;
  text: string;
  color: string;
  timestamp: any;
  priority?: 'low' | 'medium' | 'high';
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

// --- Page Themes ---
const PAGE_THEMES = {
  dashboard: {
    primary: 'blue-600',
    bg: 'blue-50',
    light: 'blue-50/50',
    gradient: 'from-blue-600 to-indigo-600',
    shadow: 'shadow-blue-100'
  },
  pos: {
    primary: 'emerald-600',
    bg: 'emerald-50',
    light: 'emerald-50/50',
    gradient: 'from-emerald-600 to-teal-600',
    shadow: 'shadow-emerald-100'
  },
  inventory: {
    primary: 'amber-600',
    bg: 'amber-50',
    light: 'amber-50/50',
    gradient: 'from-amber-600 to-orange-600',
    shadow: 'shadow-amber-100'
  },
  warranty: {
    primary: 'cyan-600',
    bg: 'cyan-50',
    light: 'cyan-50/50',
    gradient: 'from-cyan-600 to-sky-600',
    shadow: 'shadow-cyan-100'
  },
  sales: {
    primary: 'indigo-600',
    bg: 'indigo-50',
    light: 'indigo-50/50',
    gradient: 'from-indigo-600 to-violet-600',
    shadow: 'shadow-indigo-100'
  },
  customers: {
    primary: 'purple-600',
    bg: 'purple-50',
    light: 'purple-50/50',
    gradient: 'from-purple-600 to-fuchsia-600',
    shadow: 'shadow-purple-100'
  },
  loan: {
    primary: 'rose-600',
    bg: 'rose-50',
    light: 'rose-50/50',
    gradient: 'from-rose-600 to-pink-600',
    shadow: 'shadow-rose-100'
  },
  payment: {
    primary: 'teal-600',
    bg: 'teal-50',
    light: 'teal-50/50',
    gradient: 'from-teal-600 to-emerald-600',
    shadow: 'shadow-teal-100'
  },
  courier: {
    primary: 'indigo-600',
    bg: 'indigo-50',
    light: 'indigo-50/50',
    gradient: 'from-indigo-600 to-blue-600',
    shadow: 'shadow-indigo-100'
  },
  supplier: {
    primary: 'sky-600',
    bg: 'sky-50',
    light: 'sky-50/50',
    gradient: 'from-sky-600 to-blue-600',
    shadow: 'shadow-sky-100'
  },
  accounting: {
    primary: 'rose-600',
    bg: 'rose-50',
    light: 'rose-50/50',
    gradient: 'from-rose-600 to-pink-600',
    shadow: 'shadow-rose-100'
  },
  settings: {
    primary: 'slate-600',
    bg: 'slate-50',
    light: 'slate-50/50',
    gradient: 'from-slate-600 to-slate-700',
    shadow: 'shadow-slate-100'
  },
  recycle_bin: {
    primary: 'rose-600',
    bg: 'rose-50',
    light: 'rose-50/50',
    gradient: 'from-rose-600 to-pink-600',
    shadow: 'shadow-rose-100'
  },
  barcode: {
    primary: 'slate-600',
    bg: 'slate-50',
    light: 'slate-50/50',
    gradient: 'from-slate-600 to-gray-600',
    shadow: 'shadow-slate-100'
  },
  employees: {
    primary: 'sky-600',
    bg: 'sky-50',
    light: 'sky-50/50',
    gradient: 'from-sky-600 to-blue-600',
    shadow: 'shadow-sky-100'
  },
  daily_closing: {
    primary: 'rose-600',
    bg: 'rose-50',
    light: 'rose-50/50',
    gradient: 'from-rose-600 to-pink-600',
    shadow: 'shadow-rose-100'
  }
};

// --- Utilities ---
const toBengaliNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
};

const toArabicNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (digit) => arabicDigits[parseInt(digit)]);
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

const generateInvoiceId = (prefix?: string): string => {
  const now = new Date();
  // Formula: time (h:mm) + date (dd) + month (MM) + year (yy)
  // Example: 9:29 on 24th April 2026 -> 929240426
  const baseId = format(now, 'hmmddMMyy');
  return prefix ? `${prefix}${baseId}` : baseId;
};

const formatCurrency = (amount: number | undefined | null, symbol: string = 'TK', lang: string = 'bn'): string => {
  const safeAmount = amount || 0;
  const formattedAmount = safeAmount.toFixed(2);
  
  if (lang === 'bn') {
    return `${symbol} ${toBengaliNumber(formattedAmount)}`;
  } else if (lang === 'ar') {
    // Basic Arabic number conversion or just use native toLocaleString if browser supports
    return `${symbol} ${toArabicNumber(formattedAmount)}`;
  }
  return `${symbol} ${formattedAmount}`;
};

export const fC = (amount: number | undefined | null) => {
  // A simple fallback for any component that needs it. We try to read global window settings if possible.
  // We'll rely on the fact that formatCurrency formats reasonably even without custom symbol if not available.
  const symbol = (window as any)._globalCurrencySymbol || 'TK';
  const lang = (window as any)._globalLang || 'bn';
  return formatCurrency(amount, symbol, lang);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // compress to JPEG 80% quality
        } else {
          resolve(reader.result as string); // fallback
        }
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = error => reject(error);
  });
};

const moveToRecycleBin = async (entityType: RecycleItem['entityType'], originalId: string, data: any, shopId: string | undefined | null) => {
  try {
    const finalShopId = shopId || (window as any)._currentShopId || (user as any)?.shopId;
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
      deletedBy: auth.currentUser?.uid || 'unknown',
      shopId: finalShopId || 'unknown'
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

  const formatVal = (num: number) => {
    const formatted = (num || 0).toFixed(2);
    if (lang === 'bn') return toBengaliNumber(formatted);
    if (lang === 'ar') return toArabicNumber(formatted);
    return formatted;
  };

  const formatDate = (date: Date) => {
    const formatted = format(date, 'dd/MM/yy');
    if (lang === 'bn') return toBengaliNumber(formatted);
    if (lang === 'ar') return toArabicNumber(formatted);
    return formatted;
  };

  const formatTime = (date: Date) => {
    const formatted = format(date, 'HH:mm');
    if (lang === 'bn') return toBengaliNumber(formatted);
    if (lang === 'ar') return toArabicNumber(formatted);
    return formatted;
  };

  const itemsHtml = sale.items.map(item => {
    let qSuffix = '';
    if (item.unit === 'unit') {
      qSuffix = lang === 'bn' ? ' পিস' : lang === 'ar' ? ' وحدة' : ' p';
    } else if (item.unit === 'kg') {
      if (item.quantity >= 1) {
        qSuffix = lang === 'bn' ? ' কেজি' : lang === 'ar' ? ' كجم' : ' K';
      } else {
        qSuffix = lang === 'bn' ? ' গ্রাম' : lang === 'ar' ? ' جم' : ' g';
      }
    }
    
    return `
    <tr>
      <td style="padding: 2px 0; vertical-align: top; text-align: ${lang === 'ar' ? 'right' : 'left'};">
        <div style="font-weight: 500; font-size: 11px;">${item.productName}</div>
      </td>
      <td style="padding: 2px 0; text-align: center; vertical-align: top; font-size: 11px;">
        ${lang === 'bn' ? toBengaliNumber(item.quantity.toString()) : lang === 'ar' ? toArabicNumber(item.quantity.toString()) : item.quantity}${qSuffix}
      </td>
      <td style="padding: 2px 0; text-align: ${lang === 'ar' ? 'left' : 'right'}; vertical-align: top; font-size: 11px;">
        ${formatVal(item.price)}
      </td>
      <td style="padding: 2px 0; text-align: ${lang === 'ar' ? 'left' : 'right'}; vertical-align: top; font-size: 11px; font-weight: 600;">
        ${formatVal(item.price * item.quantity)}
      </td>
    </tr>`;
  }).join('');

  const width = settings.receiptWidth || '58mm';
  const changeAmount = Math.max(0, (sale.paidAmount || 0) - (sale.finalAmount || 0));
  const previousBalance = sale.previousBalance || 0;

  const html = `<!DOCTYPE html>
    <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <title>${t.invoice} #${sale.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700&family=Amiri:wght@400;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${lang === 'bn' ? "'Hind Siliguri', sans-serif" : lang === 'ar' ? "'Amiri', serif" : "'Inter', sans-serif"};
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
          .meta-left { display: flex; flex-direction: column; gap: 1px; text-align: ${lang === 'ar' ? 'right' : 'left'}; }
          .meta-right { text-align: ${lang === 'ar' ? 'left' : 'right'}; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 2px; color: #000 !important; }
          th { font-size: 11px; text-align: ${lang === 'ar' ? 'right' : 'left'}; padding: 2px 0; font-weight: 800; color: #000 !important; border-bottom: 1.5px solid #000;}
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
          ${settings.phone ? `<div class="shop-info">${t.mobile}: ${lang === 'bn' ? toBengaliNumber(settings.phone) : lang === 'ar' ? toArabicNumber(settings.phone) : settings.phone}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="meta-grid">
          <div class="meta-left">
            <span><strong>${t.invoiceId}:</strong> #${lang === 'bn' ? toBengaliNumber(sale.id) : lang === 'ar' ? toArabicNumber(sale.id) : sale.id}</span>
            <span><strong>${t.customer}:</strong> ${sale.customerName || t.retailSale}${sale.customerPhone ? `<br><strong>${t.phone}:</strong> ${lang === 'bn' ? toBengaliNumber(sale.customerPhone) : lang === 'ar' ? toArabicNumber(sale.customerPhone) : sale.customerPhone}` : ''}</span>
          </div>
          <div class="meta-right">
            <span>${formatDate(safeDate(sale.timestamp))} ${formatTime(safeDate(sale.timestamp))}</span>
          </div>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%; text-align: ${lang === 'ar' ? 'right' : 'left'};">${t.item}</th>
              <th style="width: 15%; text-align: center;">${t.qty}</th>
              <th style="width: 15%; text-align: ${lang === 'ar' ? 'left' : 'right'};">${t.price}</th>
              <th style="width: 20%; text-align: ${lang === 'ar' ? 'left' : 'right'};">${t.amount}</th>
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
          
          ${sale.taxAmount ? `
          <div class="total-row">
            <span>${t.tax}${sale.taxRate ? ` (${sale.taxRate}%)` : ''}:</span>
            <span>+ ${formatVal(sale.taxAmount)}</span>
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

const printPaymentReceipt = (payment: DuePayment, customerName: string, settings: ShopSettings) => {
  const lang = settings.printLanguage || 'bn';
  const t = PRINT_TRANSLATIONS[lang];
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatVal = (num: number) => {
    const formatted = (num || 0).toFixed(2);
    if (lang === 'bn') return toBengaliNumber(formatted);
    if (lang === 'ar') return toArabicNumber(formatted);
    return formatted;
  };

  const formatDate = (date: Date) => {
    const formatted = format(date, 'dd/MM/yy');
    if (lang === 'bn') return toBengaliNumber(formatted);
    if (lang === 'ar') return toArabicNumber(formatted);
    return formatted;
  };

  const formatTime = (date: Date) => {
    const formatted = format(date, 'HH:mm');
    if (lang === 'bn') return toBengaliNumber(formatted);
    if (lang === 'ar') return toArabicNumber(formatted);
    return formatted;
  };

  const width = settings.receiptWidth || '58mm';
  const timestamp = safeDate(payment.timestamp);

  const html = `<!DOCTYPE html>
    <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <title>Payment Receipt #${payment.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700&family=Amiri:wght@400;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${lang === 'bn' ? "'Hind Siliguri', sans-serif" : lang === 'ar' ? "'Amiri', serif" : "'Inter', sans-serif"};
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
          .meta-grid { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; font-weight: 500; color: #000 !important; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #000 !important; }
          .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; font-weight: 800; border-top: 1px dashed #000; margin-top: 2px; color: #000 !important; }
          .footer { text-align: center; margin-top: 6px; font-size: 10px; font-style: italic; color: #000 !important; }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.logoBase64 ? `<img src="${settings.logoBase64}" class="logo" />` : ''}
          <div class="shop-name">${settings.name}</div>
          <div class="shop-info">${settings.address}</div>
          ${settings.phone ? `<div class="shop-info">${t.phone}: ${lang === 'bn' ? toBengaliNumber(settings.phone) : lang === 'ar' ? toArabicNumber(settings.phone) : settings.phone}</div>` : ''}
        </div>
        
        <div class="divider"></div>
        <div style="text-align: center; font-weight: 800; font-size: 14px; margin: 2px 0; letter-spacing: 1px;">PAYMENT RECEIPT</div>
        <div class="divider"></div>

        <div class="meta-grid">
          <span>${t.date}: ${formatDate(timestamp)}</span>
          <span>${t.time}: ${formatTime(timestamp)}</span>
        </div>
        <div class="meta-grid">
          <span>${t.customer}: ${customerName}</span>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>${t.prevBalance}</span>
          <span>${settings.currencySymbol || 'TK'} ${formatVal(payment.previousDue)}</span>
        </div>
        <div class="row" style="font-weight: 700; font-size: 13px;">
          <span>${t.todayPaid} (${payment.method.toUpperCase()})</span>
          <span>${settings.currencySymbol || 'TK'} ${formatVal(payment.amount)}</span>
        </div>
        
        <div class="total-row">
          <span>${t.currentBalance}</span>
          <span>${settings.currencySymbol || 'TK'} ${formatVal(payment.remainingDue)}</span>
        </div>

        ${payment.note ? `<div style="margin-top: 4px; font-size: 10px; color: #000;"><b>Note:</b> ${payment.note}</div>` : ''}

        <div class="divider"></div>
        <div class="footer">${settings.receiptFooter || t.footer}</div>
        <div style="text-align: center; font-size: 8px; margin-top: 4px; color: #000; font-weight: 500;">
          ${t.collectedBy}: ${payment.receivedBy} | Software by StratPro Solutions
        </div>

        <script>
          window.onload = () => {
             window.print();
             setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
    </html>`;

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

const generatePersonalizedMessage = async (customer: Customer | null | undefined, sale: Sale | null, type: 'invoice' | 'reminder', lang: 'en' | 'bn' | 'ar', settings: ShopSettings) => {
  try {
    let prompt = `You are a helpful and polite shop assistant for "${settings.name || 'our shop'}". 
Generate a personalized WhatsApp message for a customer.
Type of message: ${type === 'invoice' ? 'New Invoice/Purchase Confirmation' : 'Due Payment Reminder'}
Language: ${lang === 'bn' ? 'Bengali' : (lang === 'ar' ? 'Arabic' : 'English')}

Customer Data:
Name: ${customer?.name || sale?.customerName || 'Valued Customer'}
Total Due: ${settings.currencySymbol} ${customer?.currentDue || (sale ? (sale.finalAmount + (sale.previousBalance || 0) - (sale.paidAmount || 0)) : 0)}`;

    if (type === 'invoice' && sale) {
      prompt += `
Sale Data:
Invoice ID: ${sale.id || 'N/A'}
Purchase Amount: ${settings.currencySymbol} ${sale.finalAmount}
Paid Amount: ${settings.currencySymbol} ${sale.paidAmount}`;
    }

    prompt += `\nInclude proper greetings, be friendly, and sign off with the shop's name. Use clear formatting and appropriate emojis. 
Do NOT include any markdown blocks, JSON format, or preamble like "Here is the message". Return ONLY the actual WhatsApp message text.`;

    const responseFetch = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        config: { model: "gemini-1.5-flash-latest" }
      })
    });

    if (!responseFetch.ok) throw new Error("API failed");
    const data = await responseFetch.json();

    if (data && data.text) {
      return data.text.trim();
    }
    return null;
  } catch (error) {
    console.error("AI Message Generation Error:", error);
    return null;
  }
};

const sendWhatsAppInvoice = async (sale: Sale, settings: ShopSettings, lang: 'en' | 'bn' | 'ar' = 'en') => {
  if (!sale.customerPhone) return;
  
  let message = "";
  
  if (settings.aiWhatsAppEnabled) {
    const aiMsg = await generatePersonalizedMessage(null, sale, 'invoice', lang, settings);
    if (aiMsg) message = aiMsg;
  }

  if (!message) {
    const template = lang === 'bn' ? (settings.waTemplateBengali || "") : (settings.waTemplateEnglish || "");
    
    const previousBalance = sale.previousBalance || 0;
    const currentBalance = sale.finalAmount + previousBalance - (sale.paidAmount || 0);

    // Prepare variables
    const variables: { [key: string]: string } = {
      '{{customerName}}': sale.customerName || 'Customer',
      '{{shopName}}': settings.name || 'Shop',
      '{{invoiceId}}': sale.id,
      '{{totalAmount}}': sale.finalAmount.toString(),
      '{{currencySymbol}}': settings.currencySymbol || 'TK',
      '{{discount}}': sale.discount ? sale.discount.toString() : '0',
      '{{paidAmount}}': sale.paidAmount.toString(),
      '{{dueAmount}}': (sale.finalAmount - sale.paidAmount).toString(),
      '{{prevBalance}}': previousBalance.toString(),
      '{{currentBalance}}': currentBalance.toString(),
      '{{items}}': sale.items.map(item => `• ${item.productName}: ${item.quantity} x ${item.price}`).join('\n')
    };

    // Replace variables
    message = template;
    Object.keys(variables).forEach(key => {
      message = message.replace(new RegExp(key, 'g'), variables[key]);
    });

    // Fallback if template is not configured or just too simple
    if (!template || message === template) {
      const itemsText = sale.items.map(item => `• ${item.productName}: ${item.quantity} x ${item.price} = ${item.price * item.quantity}`).join('\n');
      const previousBalance = sale.previousBalance || 0;
      message = `*আমাদের স্টোর ${settings.name} থেকে ইনভয়েস*\n` +
        `ইনভয়েস: #${sale.id}\n` +
        `তারিখ: ${format(safeDate(sale.timestamp), 'dd/MM/yyyy')}\n\n` +
        `*আইটেমসমূহ:*\n${itemsText}\n\n` +
        `--------------------------\n` +
        `*টোটাল প্রোডাক্ট বিল:* ${settings.currencySymbol} ${sale.totalAmount}\n` +
        `*ডিসকাউন্ট:* ${settings.currencySymbol} ${sale.discount}\n` +
        `*গ্র্যান্ড টোটাল:* ${settings.currencySymbol} ${sale.finalAmount}\n` +
        `*আজকের জমা:* ${settings.currencySymbol} ${sale.paidAmount}\n` +
        `--------------------------\n` +
        `*পূর্বের বাকি:* ${settings.currencySymbol} ${previousBalance}\n` +
        `*আজকের বিল:* ${settings.currencySymbol} ${sale.finalAmount}\n` +
        `*টোটাল বাকি:* ${settings.currencySymbol} ${(sale.finalAmount + previousBalance - (sale.paidAmount || 0))}\n\n` +
        `আপনার কেনাকাটার জন্য ধন্যবাদ!`;
    }
  }

  const result = await callWhatsAppApi(sale.customerPhone, message, settings);
  if (!result.fallback) {
    if (result.success) {
      console.log('✅ WhatsApp invoice sent automatically.');
    } else {
      const errorMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.message || 'Unknown error';
      if (errorMsg === 'Failed to fetch') {
        console.warn('❌ Automatic delivery skipped: No internet connection or API unreachable.');
      } else {
        console.error('❌ Automatic delivery failed:', result.error);
      }
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
  let currentY = finalY;
  doc.text(`Subtotal: ${settings.currencySymbol} ${(sale.totalAmount || 0).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  currentY += 6;
  doc.text(`Discount: ${settings.currencySymbol} ${(sale.discount || 0).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  currentY += 6;
  if (sale.taxAmount) {
    doc.text(`Tax (VAT)${sale.taxRate ? ` (${sale.taxRate}%)` : ''}: ${settings.currencySymbol} ${(sale.taxAmount).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
    currentY += 6;
  }
  
  doc.setFontSize(14);
  currentY += 2; // Extra padding
  doc.text(`Grand Total: ${settings.currencySymbol} ${(sale.finalAmount || 0).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  
  doc.setFontSize(10);
  currentY += 6;
  doc.text(`Paid Today: ${settings.currencySymbol} ${(sale.paidAmount || 0).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  
  if (changeAmount > 0 && !sale.customerId) {
    currentY += 6;
    doc.text(`Change Given: ${settings.currencySymbol} ${changeAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  }
  
  currentY += 6;
  doc.text(`REMAINING DUE: ${settings.currencySymbol} ${(sale.finalAmount + previousBalance - (sale.paidAmount || 0)).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

  if (sale.customerId) {
    const balanceY = currentY + 10;
    doc.setFontSize(11);
    doc.text('Customer Balance Summary', pageWidth - 20, balanceY, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Today's Bill: ${settings.currencySymbol} ${(sale.finalAmount || 0).toFixed(2)}`, pageWidth - 20, balanceY + 6, { align: 'right' });
    doc.text(`Previous Due: ${settings.currencySymbol} ${previousBalance.toFixed(2)}`, pageWidth - 20, balanceY + 12, { align: 'right' });
    doc.text(`Total Before Payment: ${settings.currencySymbol} ${(sale.finalAmount + previousBalance).toFixed(2)}`, pageWidth - 20, balanceY + 18, { align: 'right' });
    doc.text(`Payment Today: ${settings.currencySymbol} ${(sale.paidAmount || 0).toFixed(2)}`, pageWidth - 20, balanceY + 24, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`TOTAL REMAINING: ${settings.currencySymbol} ${(sale.finalAmount + previousBalance - (sale.paidAmount || 0)).toFixed(2)}`, pageWidth - 20, balanceY + 32, { align: 'right' });
  }

  const footerText = settings.receiptFooter || "Thank you for shopping with us!\nPowered by ShopMaster";
  const footerLines = footerText.split('\n');
  footerLines.forEach((line, index) => {
    doc.text(line, pageWidth / 2, finalY + 70 + (index * 6), { align: 'center' });
  });

  doc.save(`Invoice_${sale.id}.pdf`);
};

// --- Voice Command Parsing Helpers ---

function parseVoiceCommandQuantity(text: string): { originalText: string, searchName: string, quantity: number, matchFound: boolean } {
  const result = { originalText: text, searchName: text, quantity: 1, matchFound: false };
  const lower = text.toLowerCase().trim();

  // Handle Bengali quantity patterns like "৫ কেজি চিনি" or "৫টি সাবান" or "১০ টা ডিম"
  const bnQtyRegex = /^(\d+)\s*(কেজি|গ্রাম|লিটার|মিলি|পিস|টি|টা|মি|গজ|কে|প|ট)\s*(?:করে|ও)?\s*(.+)$/i;
  const bnMatch = lower.match(bnQtyRegex);
  if (bnMatch) {
    result.quantity = parseInt(bnMatch[1]);
    result.searchName = bnMatch[3].trim();
    result.matchFound = true;
    return result;
  }

  // Handle "এক কেজি চিনি" style
  const bnWordMap: {[key: string]: number} = { 'একটা': 1, 'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10 };
  for (const word in bnWordMap) {
    if (lower.startsWith(word)) {
      const remaining = lower.substring(word.length).trim();
      const units = ['কেজি', 'টা', 'টি', 'পিস'];
      for (const u of units) {
        if (remaining.startsWith(u)) {
          result.quantity = bnWordMap[word];
          result.searchName = remaining.substring(u.length).trim();
          result.matchFound = true;
          return result;
        }
      }
    }
  }

  // Handle English patterns like "5kg sugar" or "add 2 soaps" or "10 items of milk"
  const enQtyRegex = /^(?:add\s+)?(\d+)\s*(?:kg|kg\s+of|units\s+of|items\s+of|x|pcs|packs?|grams?|liter?s?|ml)?\s*(.+)$/i;
  const enMatch = lower.match(enQtyRegex);
  if (enMatch) {
    result.quantity = parseInt(enMatch[1]);
    result.searchName = enMatch[2].trim();
    result.matchFound = true;
    return result;
  }

  // Pattern like "Sugar 5kg"
  const reverseEnRegex = /^(.+)\s+(\d+)\s*(?:kg|pcs|x|units|packs?)$/i;
  const revMatch = lower.match(reverseEnRegex);
  if (revMatch) {
    result.searchName = revMatch[1].trim();
    result.quantity = parseInt(revMatch[2]);
    result.matchFound = true;
    return result;
  }

  return result;
}

async function parseNewProductVoiceCommand(rawText: string, categories: string[]): Promise<{
  name?: string,
  price?: number,
  stock?: number,
  category?: string,
  unit?: string
} | null> {
  try {
    const prompt = `
      Extract product details from this voice command: "${rawText}"
      Available categories: ${categories.join(', ')}
      If a category isn't exact, pick the closest one or "General".
      Support English, Bengali, and Arabic input.
      Return JSON: { "name": "...", "price": 10, "stock": 100, "category": "...", "unit": "kg/pcs" }
    `;

    const responseFetch = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        config: { 
          model: "gemini-1.5-flash-latest",
          generationConfig: {
            responseMimeType: "application/json",
          }
        }
      })
    });

    if (!responseFetch.ok) throw new Error("API failed");
    const data = await responseFetch.json();

    if (data && data.text) {
      const text = data.text;
      const jsonStr = text.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    }
    return null;
  } catch (err) {
    console.error("New product AI Error:", err);
    return null;
  }
}

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

function SettingsPanel({ 
  settings, 
  onSaveSettings, 
  users, 
  onAddUser, 
  onDeleteUser, 
  isSaving,
  products = [],
  sales = [],
  customers = [],
  expenses = [],
  deferredPrompt,
  onInstallPWA,
  isMasterAdmin = false,
  currentUserEmail = ''
}: { 
  settings: ShopSettings, 
  onSaveSettings: (s: ShopSettings) => void, 
  users: AppUser[], 
  onAddUser: (u: Omit<AppUser, 'id'>) => void, 
  onDeleteUser: (id: string) => void, 
  isSaving: boolean,
  products?: Product[],
  sales?: Sale[],
  customers?: Customer[],
  expenses?: Expense[],
  deferredPrompt: any,
  onInstallPWA: () => void,
  isMasterAdmin?: boolean,
  currentUserEmail?: string
}) {
  const systemLang = settings.systemLanguage || 'bn';
  const st = (key: keyof typeof SYSTEM_TRANSLATIONS['en']) => (SYSTEM_TRANSLATIONS[systemLang] as any)[key] || (SYSTEM_TRANSLATIONS['en'] as any)[key];
  const [activeSubTab, setActiveSubTab] = useState<'shop' | 'users' | 'download' | 'network'>('shop');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoBase64 || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.faviconBase64 || null);

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
    
    let logoBase64 = logoPreview || settings.logoBase64;
    if (logoFile) {
      logoBase64 = await fileToBase64(logoFile);
    }

    const faviconFile = (form.querySelector('input[name="favicon"]') as HTMLInputElement)?.files?.[0];
    let faviconBase64 = faviconPreview || settings.faviconBase64;
    if (faviconFile) {
      faviconBase64 = await fileToBase64(faviconFile);
    }

    onSaveSettings({
      ...settings,
      shopCode: settings.shopCode || Math.floor(100000 + Math.random() * 900000).toString(),
      name: formData.get('name') as string,
      platformTitle: formData.get('platformTitle') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      logoUrl: formData.get('logoUrl') as string,
      logoBase64: logoBase64,
      faviconBase64: faviconBase64,
      whatsappSender: formData.get('whatsappSender') as string,
      waGatewayType: formData.get('waGatewayType') as any,
      waApiUrl: formData.get('waApiUrl') as string,
      waInstanceId: formData.get('waInstanceId') as string,
      waPhoneNumberId: formData.get('waPhoneNumberId') as string,
      waToken: formData.get('waToken') as string,
      autoSendWhatsApp: formData.get('autoSendWhatsApp') === 'on',
      aiWhatsAppEnabled: formData.get('aiWhatsAppEnabled') === 'on',
      receiptWidth: formData.get('receiptWidth') as '58mm' | '80mm',
      receiptFooter: formData.get('receiptFooter') as string,
      waTemplateEnglish: formData.get('waTemplateEnglish') as string,
      waTemplateBengali: formData.get('waTemplateBengali') as string,
      printLanguage: formData.get('printLanguage') as 'en' | 'bn' | 'ar',
      systemLanguage: formData.get('systemLanguage') as 'en' | 'bn' | 'ar',
      currencySymbol: formData.get('currencySymbol') as string,
      jarvisLanguage: formData.get('jarvisLanguage') as 'en' | 'bn',
      jarvisVoiceGender: formData.get('jarvisVoiceGender') as 'male' | 'female',
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
    <>
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

      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveSubTab('shop')}
          className={`px-6 py-3 font-bold transition-all border-b-2 whitespace-nowrap ${activeSubTab === 'shop' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
        >
          Shop Profile
        </button>
        <button 
          onClick={() => setActiveSubTab('users')}
          className={`px-6 py-3 font-bold transition-all border-b-2 whitespace-nowrap ${activeSubTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveSubTab('download')}
          className={`px-6 py-3 font-bold transition-all border-b-2 whitespace-nowrap ${activeSubTab === 'download' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
        >
          {st('downloadTab')}
        </button>
        {isMasterAdmin && (
          <button 
            onClick={() => setActiveSubTab('network')}
            className={`px-6 py-3 font-bold transition-all border-b-2 whitespace-nowrap ${activeSubTab === 'network' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}
          >
            Network (Master)
          </button>
        )}
      </div>

      {activeSubTab === 'shop' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Shop Information
          </h3>
          <form onSubmit={handleShopSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-24 h-24 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Shop Logo" className="w-full h-full object-contain" />
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
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await fileToBase64(file);
                        setLogoPreview(base64);
                      }
                    }}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unique Shop Code <span className="text-xs text-gray-400 font-normal ml-2">(Share with customers to find your shop)</span></label>
                  <div className="flex items-center gap-2">
                    <input value={settings.shopCode || 'Not Generated Yet'} readOnly className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-mono font-black text-indigo-700 tracking-widest text-center cursor-default outline-none" />
                    <button type="button" onClick={() => {
                      if (settings.shopCode) {
                        navigator.clipboard.writeText(settings.shopCode);
                      }
                    }} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors" title="Copy Code">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Account Email / Gmail</label>
                  <div className="flex items-center gap-2">
                    <input value={currentUserEmail} readOnly className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-medium cursor-default outline-none" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">This email address is your main Shop ID and credential.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                <input name="name" defaultValue={settings.name || ''} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Title (Tabs Title)</label>
                <input name="platformTitle" defaultValue={settings.platformTitle || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="ShopMaster - My Shop" />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    Favicon Settings
                  </h4>
                  <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                      {faviconPreview ? (
                        <img src={faviconPreview} alt="Favicon" className="w-full h-full object-contain" />
                      ) : (
                        <Globe className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-900 mb-1">Upload Favicon</label>
                      <p className="text-[10px] text-gray-500 mb-3">Square icon recommended (32x32px)</p>
                      <input 
                        type="file" 
                        name="favicon"
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await fileToBase64(file);
                            setFaviconPreview(base64);
                          }
                        }}
                        className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
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
                  <option value="en">English (English)</option>
                  <option value="ar">Arabic (العربية)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Language (সিস্টেম ভাষা)</label>
                <select name="systemLanguage" defaultValue={settings.systemLanguage || 'bn'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="bn">Bengali (বাংলা)</option>
                  <option value="en">English (English)</option>
                  <option value="ar">Arabic (العربية)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Symbol (কারেন্সি সিম্বল)</label>
                <input name="currencySymbol" defaultValue={settings.currencySymbol || 'TK'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. TK, $, SAR" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Assistant Language</label>
                <select name="jarvisLanguage" defaultValue={settings.jarvisLanguage || 'bn'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="bn">Bengali (বাংলা)</option>
                  <option value="en">English (English)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Assistant Voice</label>
                <select name="jarvisVoiceGender" defaultValue={settings.jarvisVoiceGender || 'male'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Phone Number ID (Meta) / Instance ID (Generic)</label>
                <input name="waPhoneNumberId" placeholder="Phone Number ID (Meta)" defaultValue={settings.waPhoneNumberId} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none mb-2" />
                <input name="waInstanceId" placeholder="Instance ID (Generic)" defaultValue={settings.waInstanceId} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
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
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  name="aiWhatsAppEnabled" 
                  id="aiWhatsAppEnabled"
                  defaultChecked={settings.aiWhatsAppEnabled} 
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                />
                <label htmlFor="aiWhatsAppEnabled" className="text-sm font-bold text-gray-700">Use Gemini API for Personalized Messages</label>
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
            <button type="submit" disabled={isSaving} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Updating...' : 'Update Settings'}
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'users' && (
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

      {activeSubTab === 'download' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Download className="w-6 h-6 text-indigo-600" />
                Inventory & Products
              </h3>
              <p className="text-gray-500 mb-6 text-sm">Download your current stock list, prices, and categories in CSV format.</p>
              <button 
                onClick={() => {
                  const data = products.map(p => ({
                    'Product ID': p.id,
                    'Name': p.name,
                    'Category': p.category,
                    'Price': p.price,
                    'Stock': p.stock,
                    'Unit': p.unit,
                    'Barcode': p.barcode || 'N/A'
                  }));
                  const csv = Papa.unparse(data);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.setAttribute('download', `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full py-4 bg-indigo-50 text-indigo-700 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-3"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Download Inventory CSV
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                Customer Database
              </h3>
              <p className="text-gray-500 mb-6 text-sm">Download your customer list with contact details and current due balances.</p>
              <button 
                onClick={() => {
                  const data = customers.map(c => ({
                    'Customer ID': c.id,
                    'Name': c.name,
                    'Phone': c.phone,
                    'Address': c.address || '',
                    'Initial Due': c.initialDue || 0,
                    'Created At': safeDate(c.createdAt).toLocaleDateString()
                  }));
                  const csv = Papa.unparse(data);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.setAttribute('download', `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full py-4 bg-indigo-50 text-indigo-700 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-3"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Download Customer CSV
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-emerald-600" />
                {st('downloadAndroid')}
              </h3>
              <p className="text-gray-500 mb-6 text-sm">Get our Android app for mobile-first inventory management on the go.</p>
              <button 
                onClick={onInstallPWA}
                className="w-full py-4 bg-emerald-50 text-emerald-700 font-bold rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-3"
              >
                <Smartphone className="w-5 h-5" />
                Install Mobile App (PWA)
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MonitorIcon className="w-6 h-6 text-indigo-600" />
                {st('downloadDesktop')}
              </h3>
              <p className="text-gray-500 mb-6 text-sm">Download the desktop application for a seamless offline-capable experience.</p>
              <button 
                onClick={onInstallPWA}
                className="w-full py-4 bg-indigo-50 text-indigo-700 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-3"
              >
                <MonitorIcon className="w-5 h-5" />
                Install Desktop App (PWA)
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Banknote className="w-6 h-6 text-indigo-600" />
                Sales History (Last 1000)
              </h3>
              <p className="text-gray-500 mb-6 text-sm">Export recent transaction logs including payment methods and amounts.</p>
              <button 
                onClick={() => {
                  const data = sales.slice(0, 1000).map(s => ({
                    'Invoice ID': s.id,
                    'Date': safeDate(s.timestamp).toLocaleString(),
                    'Customer': s.customerName || 'Walk-in',
                    'Total': s.finalAmount,
                    'Paid': s.paidAmount,
                    'Due': s.dueAmount,
                    'Method': s.paymentMethod
                  }));
                  const csv = Papa.unparse(data);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.setAttribute('download', `sales_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full py-4 bg-indigo-50 text-indigo-700 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-3"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Download Sales CSV
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-indigo-600" />
                Expense Records
              </h3>
              <p className="text-gray-500 mb-6 text-sm">Download breakdown of categorized expenses for your bookkeeping.</p>
              <button 
                onClick={() => {
                  const data = expenses.map(e => ({
                    'ID': e.id,
                    'Date': safeDate(e.timestamp).toLocaleDateString(),
                    'Category': e.category,
                    'Description': e.description,
                    'Amount': e.amount
                  }));
                  const csv = Papa.unparse(data);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.setAttribute('download', `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full py-4 bg-indigo-50 text-indigo-700 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-3"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Download Expense CSV
              </button>
            </div>

            {/* PWA Install Section */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-xl text-white md:col-span-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Smartphone className="w-32 h-32" />
              </div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Download className="w-8 h-8" />
                  Install ShopMaster App (পিডব্লিউএ)
                </h3>
                <p className="text-indigo-100 max-w-lg">
                  {systemLang === 'bn' 
                    ? 'আপনার ফোনে বা কম্পিউটারে এই সিস্টেমটি অ্যাপ হিসেবে ব্যবহার করতে নিচের বাটনে ক্লিক করুন। এটি অফলাইনেও দ্রুত কাজ করবে।' 
                    : 'Install this system as an app on your phone or computer. It stays on your home screen and works offline.'}
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then((choiceResult: any) => {
                          if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the A2HS prompt');
                          }
                        });
                      } else {
                        alert(systemLang === 'bn' 
                          ? 'আপনার ব্রাউজারে ইতিমধ্যে ইন্সটল করা আছে অথবা এটি সাপোর্ট করছে না। সরাসরি ব্রাউজারের "Install App" অপশন ব্যবহার করুন।' 
                          : 'The app is already installed or your browser doesn\'t support this. Use the "Install App" option in your browser menu.');
                      }
                    }}
                    className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-lg shadow-black/10"
                  >
                    <Plus className="w-6 h-6" />
                    {systemLang === 'bn' ? 'অ্যান্ড্রয়েড/ডেস্কটপে ইন্সটল করুন' : 'Install for Android/Desktop'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMasterAdmin && activeSubTab === 'network' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          <NetworkConsole />
        </div>
      )}
    </motion.div>
    </>
  );
}

function RecycleBin({ items, onRestore }: { items: any[], onRestore: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredItems = (items || []).filter(item => {
    const dataStr = JSON.stringify(item.data || {});
    return (item.entityType || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           dataStr.toLowerCase().includes(searchTerm.toLowerCase());
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
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-gray-400 font-medium">
                  No items found in the recycle bin.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                      {item.entityType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.data?.name || item.data?.description || item.data?.displayName || "Item"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.deletedAt && format(new Date(item.deletedAt.seconds * 1000), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onRestore(item)}
                      className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all font-semibold text-xs border border-green-100"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function ShopManagement({ shops }: { shops: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredShops = shops.filter(shop => 
    (shop.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.ownerEmail || shop.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.shopCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Merchant Network Console</h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Manage and Monitor all business partners</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, email or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full md:w-64"
            />
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 whitespace-nowrap">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Shops</p>
            <p className="text-xl font-black text-indigo-600 font-mono">{filteredShops.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
                {shop.logo ? (
                  <img src={shop.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {shop?.type || 'Shop'}
                </span>
                {shop?.shopCode && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                    #{shop.shopCode}
                  </span>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-black text-gray-900 mb-1">{shop?.name || 'Unnamed Shop'}</h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{shop?.address || 'No address provided'}</p>
            
            <div className="space-y-2 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-gray-600">{shop.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-600">{shop.ownerEmail || shop.email || 'No email provided'}</span>
              </div>
              {shop.domain && (
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-gray-600">{shop.domain}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Registered: {shop.setupDate ? new Date(shop.setupDate).toLocaleDateString() : (shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : 'N/A')}
              </p>
              <button 
                onClick={async () => {
                   const confirmed = window.confirm('Are you sure you want to delete this merchant and all their data? This action is irreversible.');
                   if (!confirmed) return;
                   
                   try {
                       await deleteDoc(doc(db, 'shops', shop.id));
                       alert('Merchant deleted successfully.');
                   } catch (e) {
                       console.error('Error deleting merchant:', e);
                       alert('Failed to delete merchant. Please try again.');
                   }
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    console.log("ShopMaster App Initializing...");
  }, []);
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('shopmaster_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(() => {
    try {
      const saved = localStorage.getItem('shopmaster_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'admin' && u.shopId === 'master') {
          return true;
        }
        return u.isOnboarded !== undefined ? !!u.isOnboarded : null;
      }
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
        setNotification({ 
          message: "To install, use your browser's 'Install' or 'Add to Home Screen' option.", 
          type: 'info' 
        });
    }
  };
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return true;
    }
    const saved = localStorage.getItem('sidebar_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    localStorage.setItem('sidebar_visible', String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      // Toggle fullscreen on Escape key if not handled by browser or if user intent is clear.
      // However, Escape is standard for EXIT. To fix the flicker where it re-enters,
      // we only enter if we weren't just in it and if the user specifically wants it.
      if (e.key === 'Escape') {
        const isCurrentlyFull = !!document.fullscreenElement;
        // If we are NOT in fullscreen, maybe we just exited (browser default).
        // If we want Esc to toggle BOTH ways, we'd need to prevent browser default, 
        // but Esc is protected. So we'll skip the re-enter logic on Escape keyup
        // because it causes the "exit then immediately re-enter" loop.
        // Instead, we'll let Escape strictly be EXIT, and the button/MasterAdmin choice can handle ENTER.
        /* if (!isCurrentlyFull) {
           document.documentElement.requestFullscreen().catch(() => {});
        } */
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);



  // Initial sync check
  useEffect(() => {
    if (navigator.onLine) syncOfflineData();
  }, []);

  const syncOfflineData = async () => {
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline operations...`);
    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      // Retry mechanism: try up to 3 times for each item
      let success = false;
      let lastErr: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (item.type === 'sale') {
            const { saleData, customId, cart } = item.data;
            // Create sale
            await setDoc(doc(db, 'sales', customId), {
              ...saleData,
              timestamp: serverTimestamp()
            });

            // Update stock
            for (const cartItem of cart) {
              await updateDoc(doc(db, 'products', cartItem.id), {
                stock: increment(-cartItem.quantity)
              });
            }

            // Update customer if exists
            if (saleData.customerId) {
              const customerRef = doc(db, 'customers', saleData.customerId);
              await updateDoc(customerRef, {
                currentDue: increment(saleData.dueAmount),
                totalSpent: increment(saleData.finalAmount)
              });
            }
          } else if (item.type === 'payment') {
            const { paymentData, customerId, amount } = item.data;
            await addDoc(collection(db, 'due_payments'), {
              ...paymentData,
              shopId: user?.shopId,
              timestamp: serverTimestamp()
            });
            await updateDoc(doc(db, 'customers', customerId), {
              currentDue: increment(-amount)
            });
          } else if (item.type === 'customer') {
            const { customerData, customId } = item.data;
            await setDoc(doc(db, 'customers', customId), {
              ...customerData,
              timestamp: serverTimestamp()
            });
          } else if (item.type === 'customer_update') {
            const { customerId, customerData, logData } = item.data;
            await updateDoc(doc(db, 'customers', customerId), customerData);
            if (logData) {
              await addDoc(collection(db, 'customer_logs'), {
                ...logData,
                timestamp: serverTimestamp()
              });
            }
          }
          
          await removeFromSyncQueue(item.id!);
          successCount++;
          success = true;
          break; // Break the retry loop
        } catch (err: any) {
          lastErr = err;
          const isNetworkError = err?.message?.toLowerCase().includes('network') || err?.message?.toLowerCase().includes('offline') || err?.code === 'unavailable';
          if (!isNetworkError) {
            // Fatal error, break retry loop but leave in queue or maybe we shouldn't delete yet for safety.
            break;
          }
          console.warn(`Attempt ${attempt} to sync item failed. Retrying in 1s...`, item, err);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      if (!success) {
        console.error('Failed to sync item after retries:', item, lastErr);
        failCount++;
      }
    }
    
    if (successCount > 0 && failCount === 0) {
      setNotification({ message: `Connection restored. Data successfully synchronized!`, type: 'success' });
    } else if (successCount > 0 && failCount > 0) {
      setNotification({ message: `Partial sync: ${successCount} synced, ${failCount} failed. Check internet.`, type: 'warning' });
    } else if (failCount > 0) {
      setNotification({ message: `Sync failed for ${failCount} items due to network issues.`, type: 'error' });
    }
  };
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'cart' | 'product'>('cart');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSuggestion, setCustomerSuggestion] = useState('');
  const [isCustomerVoiceListening, setIsCustomerVoiceListening] = useState(false);

  // Function to generate AI suggestion for customer
  const generateCustomerSuggestion = async (query: string) => {
    if (!query || query.length < 2) return;
    try {
      const prompt = `The user searched for a customer named "${query}" but they don't exist in the database. Write a very short (max 15 words) friendly and helpful AI assistant message suggesting to add them as a new customer. Be professional but welcoming. Example: "I couldn't find ${query}. Would you like me to help you add them to your records?"`;
      
      const responseFetch = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          config: { model: "gemini-1.5-flash-latest" }
        })
      });
      
      const data = await responseFetch.json();
      setCustomerSuggestion(data.text || `I couldn't find "${query}". Would you like to add them?`);
    } catch (error) {
      setCustomerSuggestion(`I couldn't find "${query}" in our database. Shall we add them as a new customer?`);
    }
    setIsCustomerModalOpen(true);
  };
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [stockRecords, setStockRecords] = useState<StockRecord[]>([]);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'merchant' | 'staff'>('merchant');
  
  const isLoginPath = () => {
    const path = window.location.pathname.toLowerCase();
    return path.includes('login');
  };

  const [showCustomerPortal, setShowCustomerPortal] = useState<boolean>(() => {
    try {
      const hasCachedUser = !!localStorage.getItem('shopmaster_user');
      if (hasCachedUser) {
        return false;
      }
    } catch (e) {}
    return !isLoginPath();
  });

  useEffect(() => {
    const handlePopState = () => {
      setShowCustomerPortal(!isLoginPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSetShowCustomerPortal = (show: boolean) => {
    setShowCustomerPortal(show);
    window.history.pushState({}, '', show ? '/' : '/login');
  };

  // Auth State Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      // Synchronously reset previous user's data state to avoid any transient data rendering
      resetStateToDefaults();
      
      if (firebaseUser && !firebaseUser.isAnonymous) {
        // Authenticated real user
        setShowCustomerPortal(false);
        const isMaster = firebaseUser.email?.toLowerCase().trim() === 'stratproamz@gmail.com';
        
        if (isMaster) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: 'Master Admin',
            role: 'admin',
            shopId: 'master',
            isOnboarded: true
          };
          setUser(userData);
          setIsOnboarded(true);
          localStorage.setItem('shopmaster_user', JSON.stringify(userData));
        } else {
          // Check if it's a staff member (in users collection) or a merchant
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: data.displayName || data.username || 'Staff',
                role: data.role || 'sales_team',
                shopId: data.shopId,
                isOnboarded: true
              };
              setUser(userData);
              setIsOnboarded(true);
              localStorage.setItem('shopmaster_user', JSON.stringify(userData));
            } else {
              // Might be a Merchant (logged in via Google or first time)
              let finalShopId = firebaseUser.uid;
              let onboardStatus = false;

              try {
                // 1. Direct match: doc ID is firebaseUser.uid
                const shopDoc = await getDoc(doc(db, 'shops', firebaseUser.uid));
                if (shopDoc.exists()) {
                  finalShopId = firebaseUser.uid;
                  onboardStatus = true;
                } else {
                  // 2. Try searching by ownerUid
                  const qByUid = query(collection(db, 'shops'), where('ownerUid', '==', firebaseUser.uid));
                  const snapByUid = await getDocs(qByUid);
                  if (!snapByUid.empty) {
                    const foundShop = snapByUid.docs[0];
                    finalShopId = foundShop.id;
                    onboardStatus = true;
                  } else if (firebaseUser.email) {
                    // 3. Try searching by ownerEmail
                    const qByEmail = query(collection(db, 'shops'), where('ownerEmail', '==', firebaseUser.email));
                    const snapByEmail = await getDocs(qByEmail);
                    if (!snapByEmail.empty) {
                      const foundShop = snapByEmail.docs[0];
                      finalShopId = foundShop.id;
                      onboardStatus = true;
                    }
                  }
                }
              } catch (shopSearchErr) {
                console.error("Error searching shops during login setup:", shopSearchErr);
              }

              const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Merchant',
                role: 'admin',
                shopId: finalShopId,
                isOnboarded: onboardStatus
              };
              setUser(userData);
              setIsOnboarded(onboardStatus);
              localStorage.setItem('shopmaster_user', JSON.stringify(userData));
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
            // Fallback to basic data
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'sales_team',
              shopId: firebaseUser.uid,
              isOnboarded: false
            };
            setUser(userData);
            setIsOnboarded(false);
          }
        }
      } else {
        // Logged out or Anonymous
        setUser(null);
        setIsOnboarded(null);
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
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dashboardPeriod, setDashboardPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [dashboardViewMetric, setDashboardViewMetric] = useState<'revenue' | 'profit'>('revenue');
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const isMasterAdmin = user?.email?.toLowerCase().trim() === 'stratproamz@gmail.com';

  useEffect(() => {
    const fetchSyncQueue = async () => {
      const queue = await getSyncQueue();
      setSyncQueue(queue);
    };
    fetchSyncQueue();
    const interval = setInterval(fetchSyncQueue, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isMasterAdmin) {
      setShops([]);
      return;
    }
    
    const unsubShops = onSnapshot(collection(db, 'shops'), (snapshot) => {
      setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Shops sync error", err));

    return () => unsubShops();
  }, [user, isMasterAdmin]);

  const handleOnboardingComplete = async (formData: any) => {
    try {
      setLoading(true);
      if (!user || !user.shopId) throw new Error("User not authenticated");

      // Generate a unique 6-digit shop code
      const generatedShopCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Save to global shops collection for master admin
      // We use the shopId (merchant uid) as the document ID for the shop
      const shopRef = doc(db, 'shops', user.shopId);
      await setDoc(shopRef, {
        ...formData,
        shopId: user.shopId,
        shopCode: generatedShopCode,
        ownerEmail: user.email,
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      });

      // Update current shop settings - isolated by shopId
      const settingsRef = doc(db, 'settings', user.shopId);
      await setDoc(settingsRef, {
        ...shopSettings,
        shopId: user.shopId,
        shopCode: generatedShopCode,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        logoUrl: formData.logo,
        type: formData.type,
        domain: formData.domain
      });

      setIsOnboarded(true);
      if (user) {
        const updatedUser = { ...user, isOnboarded: true };
        setUser(updatedUser);
        localStorage.setItem('shopmaster_user', JSON.stringify(updatedUser));
      }
      setNotification({ message: 'Shop setup complete!', type: 'success' });
    } catch (error) {
      console.error(error);
      setNotification({ message: 'Failed to save shop settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleItem[]>([]);
  const [customerLogs, setCustomerLogs] = useState<CustomerLog[]>([]);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  
  // Check for expiring products
  useEffect(() => {
    if (products.length > 0) {
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);

      const nearingExpiry = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiry = new Date(p.expiryDate);
        return expiry >= today && expiry <= in30Days;
      });

      setExpiringProducts(nearingExpiry);

      if (nearingExpiry.length > 0) {
        setNotification({
          type: 'info',
          message: `${nearingExpiry.length} products are nearing expiry date (within 30 days)!`
        });
      }
    }
  }, [products]);

  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    name: 'Bismillah Store',
    platformTitle: 'Bismillah Store - ShopMaster',
    address: 'Your Shop Address',
    phone: '',
    receiptWidth: '58mm',
    receiptFooter: "Thank you for shopping with us!\nPowered by ShopMaster",
    waGatewayType: 'manual',
    autoSendWhatsApp: false,
    aiWhatsAppEnabled: false,
    waTemplateEnglish: "Hello *{{customerName}}*, thank you for shopping at *{{shopName}}*! Your invoice #{{invoiceId}} total is {{currencySymbol}} {{totalAmount}}.",
    waTemplateBengali: "প্রিয় *{{customerName}}*, *{{shopName}}*-এ কেনাকাটা করার জন্য ধন্যবাদ! আপনার ইনভয়েস #{{invoiceId}} এর মোট পরিমাণ {{currencySymbol}} {{totalAmount}} টাকা।",
    printLanguage: 'bn',
    systemLanguage: 'bn',
    currencySymbol: 'TK',
    jarvisLanguage: 'bn',
    jarvisVoiceGender: 'male',
  });

  function resetStateToDefaults() {
    setIsOnboarded(null);
    setAppUsers([]);
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setCategories([]);
    setCustomerOrders([]);
    setEmployees([]);
    setExpenses([]);
    setInvestments([]);
    setStaffSalaries([]);
    setDailyClosings([]);
    setRecycleBin([]);
    setCustomerLogs([]);
    setDuePayments([]);
    setNotes([]);
    setStockRecords([]);
    setShopSettings({
      name: 'Bismillah Store',
      platformTitle: 'Bismillah Store - ShopMaster',
      address: 'Your Shop Address',
      phone: '',
      receiptWidth: '58mm',
      receiptFooter: "Thank you for shopping with us!\nPowered by ShopMaster",
      waGatewayType: 'manual',
      autoSendWhatsApp: false,
      aiWhatsAppEnabled: false,
      waTemplateEnglish: "Hello *{{customerName}}*, thank you for shopping at *{{shopName}}*! Your invoice #{{invoiceId}} total is {{currencySymbol}} {{totalAmount}}.",
      waTemplateBengali: "প্রিয় *{{customerName}}*, *{{shopName}}*-এ কেনাকাটা করার জন্য ধন্যবাদ! আপনার ইনভয়েস #{{invoiceId}} এর মোট পরিমাণ {{currencySymbol}} {{totalAmount}} টাকা।",
      printLanguage: 'bn',
      systemLanguage: 'bn',
      currencySymbol: 'TK',
      jarvisLanguage: 'bn',
      jarvisVoiceGender: 'male',
    });
  }

  const [prevPendingCount, setPrevPendingCount] = useState<number>(0);
  useEffect(() => {
    const pendingCount = customerOrders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevPendingCount) {
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
      
      const isBn = shopSettings.systemLanguage === 'bn';
      setNotification({
        message: isBn 
          ? `নতুন কাস্টমার অর্ডার এসেছে! (${pendingCount}টি পেন্ডিং রয়েছে)`
          : `New customer order received! (${pendingCount} pending)`,
        type: 'info'
      });
    }
    setPrevPendingCount(pendingCount);
  }, [customerOrders, prevPendingCount, shopSettings.systemLanguage]);

  // Check onboarding status in Firestore as a fallback if not determined yet
  useEffect(() => {
    if (!user) {
      setIsOnboarded(null);
      return;
    }

    if (isMasterAdmin) {
      setIsOnboarded(true);
      return;
    }

    if (isOnboarded !== null) return; // Already resolved synchronously or via auth state changed!

    const checkOnboardingFallback = async () => {
      try {
        const shopDoc = await getDoc(doc(db, 'shops', user.shopId));
        if (shopDoc.exists()) {
          setIsOnboarded(true);
          const updatedUser = { ...user, isOnboarded: true };
          localStorage.setItem('shopmaster_user', JSON.stringify(updatedUser));
          return;
        }

        const qByUid = query(collection(db, 'shops'), where('ownerUid', '==', user.uid));
        const snapByUid = await getDocs(qByUid);
        if (!snapByUid.empty) {
          const foundShop = snapByUid.docs[0];
          const updatedUser = { ...user, shopId: foundShop.id, isOnboarded: true };
          setUser(updatedUser);
          localStorage.setItem('shopmaster_user', JSON.stringify(updatedUser));
          setIsOnboarded(true);
          return;
        }

        if (user.email) {
          const qByEmail = query(collection(db, 'shops'), where('ownerEmail', '==', user.email));
          const snapByEmail = await getDocs(qByEmail);
          if (!snapByEmail.empty) {
            const foundShop = snapByEmail.docs[0];
            const updatedUser = { ...user, shopId: foundShop.id, isOnboarded: true };
            setUser(updatedUser);
            localStorage.setItem('shopmaster_user', JSON.stringify(updatedUser));
            setIsOnboarded(true);
            return;
          }
        }

        setIsOnboarded(false);
      } catch (err) {
        console.error("Error checking onboarding status falling back:", err);
      }
    };
    checkOnboardingFallback();
  }, [user, isMasterAdmin, isOnboarded]);

  const handleDownloadCustomersCSV = () => {
    const csvData = customers.map(c => ({
      'Name': c.name,
      'Mobile Number': c.phone,
      'Address': c.address || '',
      'Father Name': c.fatherName || '',
      'Home Address': c.houseName || '',
      'House Number': c.serialNumber || '',
      'Current Due': c.currentDue || 0
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `customers_records_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const dynamicSettings = shopSettings;

  // Handle tax settings
  useEffect(() => {
    setTaxRate(0); // default to zero or integrate with shopSettings if needed
  }, []);

  // Keep window._globalCurrencySymbol sync'ed dynamically
  useEffect(() => {
    (window as any)._globalCurrencySymbol = dynamicSettings.currencySymbol;
  }, [dynamicSettings.currencySymbol]);
  
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


  useEffect(() => {
    const iconBase64 = shopSettings?.faviconBase64 || shopSettings?.logoBase64;
    if (iconBase64) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = iconBase64;
    }
  }, [shopSettings?.logoBase64, shopSettings?.faviconBase64]);

  useEffect(() => {
    if (dynamicSettings?.platformTitle) {
      document.title = dynamicSettings.platformTitle;
    } else if (dynamicSettings?.name) {
      document.title = dynamicSettings.name;
    }
  }, [dynamicSettings?.platformTitle, dynamicSettings?.name]);

  useEffect(() => {
    document.documentElement.dir = dynamicSettings?.systemLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = dynamicSettings?.systemLanguage || 'bn';
  }, [dynamicSettings?.systemLanguage]);

  useEffect(() => {
    // Sync global window variables for the fC helper
    (window as any)._globalCurrencySymbol = dynamicSettings.currencySymbol || 'TK';
    (window as any)._globalLang = dynamicSettings.systemLanguage;
  }, [dynamicSettings]);

  useEffect(() => {
    (window as any)._currentShopId = user?.shopId || null;
    
    if (!user || !user.shopId || (!isMasterAdmin && isOnboarded !== true)) {
      setAppUsers([]);
      setProducts([]);
      setSales([]);
      setCustomers([]);
      setCategories([]);
      setCustomerOrders([]);
      setEmployees([]);
      setExpenses([]);
      setInvestments([]);
      setStaffSalaries([]);
      setDailyClosings([]);
      setRecycleBin([]);
      setCustomerLogs([]);
      setDuePayments([]);
      setNotes([]);
      setStockRecords([]);
      setShopSettings({
        name: 'Bismillah Store',
        platformTitle: 'Bismillah Store - ShopMaster',
        address: 'Your Shop Address',
        phone: '',
        receiptWidth: '58mm',
        receiptFooter: "Thank you for shopping with us!\nPowered by ShopMaster",
        waGatewayType: 'manual',
        autoSendWhatsApp: false,
        aiWhatsAppEnabled: false,
        waTemplateEnglish: "Hello *{{customerName}}*, thank you for shopping at *{{shopName}}*! Your invoice #{{invoiceId}} total is {{currencySymbol}} {{totalAmount}}.",
        waTemplateBengali: "প্রিয় *{{customerName}}*, *{{shopName}}*-এ কেনাকাটা করার জন্য ধন্যবাদ! আপনার ইনভয়েস #{{invoiceId}} এর মোট পরিমাণ {{currencySymbol}} {{totalAmount}} টাকা।",
        printLanguage: 'bn',
        systemLanguage: 'bn',
        currencySymbol: 'TK',
      });
      return;
    }

    const currentShopId = user.shopId;
    if (!currentShopId) return; // Do not initialize snapshots if no shopId

    // Sync settings for this specific shop
    const unsubSettings = onSnapshot(doc(db, 'settings', currentShopId), (snapshot) => {
      if (snapshot.exists()) {
        setShopSettings(snapshot.data() as ShopSettings);
      }
    }, (err) => console.error("Settings sync error", err));

    // Sync users for this specific shop
    const unsubUsers = onSnapshot(query(collection(db, 'users'), where('shopId', '==', currentShopId)), (snapshot) => {
      setAppUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
    }, (err) => console.error("Users sync error", err));

    const unsubProducts = onSnapshot(query(collection(db, 'products'), where('shopId', '==', currentShopId)), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => console.error("Products sync error", err));

    const unsubSales = onSnapshot(query(collection(db, 'sales'), where('shopId', '==', currentShopId)), (snapshot) => {
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
      setSales(fetchedSales.slice(0, 100));
    }, (err) => console.error("Sales sync error", err));

    const unsubStock = onSnapshot(query(collection(db, 'stockRecords'), where('shopId', '==', currentShopId)), (snapshot) => {
      setStockRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockRecord)));
    }, (err) => console.error("Stock records sync error", err));

    const unsubCustomers = onSnapshot(query(collection(db, 'customers'), where('shopId', '==', currentShopId)), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => console.error("Customers sync error", err));

    const unsubCategories = onSnapshot(query(collection(db, 'categories'), where('shopId', '==', currentShopId)), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (err) => console.error("Categories sync error", err));

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), where('shopId', '==', currentShopId)), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    }, (err) => console.error("Expenses sync error", err));

    const unsubInvestments = onSnapshot(query(collection(db, 'investments'), where('shopId', '==', currentShopId)), (snapshot) => {
      setInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
    }, (err) => console.error("Investments sync error", err));

    const unsubStaffSalaries = onSnapshot(query(collection(db, 'staff_salaries'), where('shopId', '==', currentShopId)), (snapshot) => {
      setStaffSalaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffSalary)));
    }, (err) => console.error("Staff salaries sync error", err));

    const unsubDailyClosings = onSnapshot(query(collection(db, 'daily_closings'), where('shopId', '==', currentShopId)), (snapshot) => {
      setDailyClosings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyClosing)));
    }, (err) => console.error("Daily closing sync error", err));

    const unsubEmployees = onSnapshot(query(collection(db, 'employees'), where('shopId', '==', currentShopId)), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (err) => console.error("Employees sync error", err));

    const unsubRecycleBin = onSnapshot(query(collection(db, 'recycleBin'), where('shopId', '==', currentShopId)), (snapshot) => {
      setRecycleBin(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecycleItem)));
    }, (err) => console.error("Recycle bin sync error", err));

    const unsubCustomerLogs = onSnapshot(query(collection(db, 'customer_logs'), where('shopId', '==', currentShopId)), (snapshot) => {
      setCustomerLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerLog)));
    }, (err) => console.error("Customer logs sync error", err));

    const unsubDuePayments = onSnapshot(query(collection(db, 'due_payments'), where('shopId', '==', currentShopId)), (snapshot) => {
      setDuePayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DuePayment)));
    }, (err) => console.error("Due payments sync error", err));

    const unsubNotes = onSnapshot(query(collection(db, 'notes'), where('shopId', '==', currentShopId)), (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      fetchedNotes.sort((a, b) => {
        const getMs = (ts: any) => {
          if (!ts) return 0;
          if (typeof ts.toDate === 'function') return ts.toDate().getTime();
          if (ts.seconds) return ts.seconds * 1000;
          return new Date(ts).getTime() || 0;
        };
        return getMs(b.timestamp) - getMs(a.timestamp);
      });
      setNotes(fetchedNotes);
    }, (err) => console.error("Notes sync error", err));

    const unsubCustomerOrders = onSnapshot(query(collection(db, 'customer_orders'), where('shopId', '==', currentShopId)), (snapshot) => {
      setCustomerOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Customer orders sync error", err));

    return () => {
      unsubSettings();
      unsubUsers();
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
      unsubRecycleBin();
      unsubCustomerLogs();
      unsubDuePayments();
      unsubNotes();
      unsubCustomerOrders();
    };
  }, [user, isMasterAdmin, isOnboarded]);

  const handleAddNote = async (text: string, color: string, extra?: { priority?: string, dueDate?: string }) => {
    try {
      if (!user || !user.shopId) return;
      await addDoc(collection(db, 'notes'), {
        text,
        color,
        shopId: user.shopId,
        priority: extra?.priority || 'medium',
        dueDate: extra?.dueDate || null,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notes');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notes');
    }
  };

  const handleUpdateNote = async (id: string, text: string, extra?: { priority?: string, dueDate?: string }) => {
    try {
      const updateData: any = { text };
      if (extra?.priority) updateData.priority = extra.priority;
      if (extra?.dueDate !== undefined) updateData.dueDate = extra.dueDate;
      await updateDoc(doc(db, 'notes', id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notes');
    }
  };

  const handleDeleteDailyClosing = async (closing: DailyClosing) => {
    try {
      await moveToRecycleBin('daily_closing', closing.id, closing, closing.shopId || user?.shopId);
      await deleteDoc(doc(db, 'daily_closings', closing.id));
      setNotification({ message: 'Daily Closing moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'daily_closings');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    
    try {
      const email = `${username}@bismillahstore.local`;
      await signInWithEmailAndPassword(auth, email, password);
      // Profile will be fetched and user state set by onAuthStateChanged
    } catch (authErr: any) {
      console.warn("Firebase Auth failed for staff:", authErr);
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        setAuthError(st('loginTitle') === 'Business Management Suite' ? "Invalid username or password" : "ইউজারনাম বা পাসওয়ার্ড সঠিক নয়");
      } else {
        setAuthError(st('loginTitle') === 'Business Management Suite' ? "Login failed. Contact Admin." : "লগইন ব্যর্থ হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch(e) {}
    setUser(null);
    resetStateToDefaults();
    localStorage.removeItem('shopmaster_user');
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      const isMasterAdmin = googleUser.email?.toLowerCase().trim() === "stratproamz@gmail.com";
      const existingAppUser = appUsers.find(u => u.username.toLowerCase() === googleUser.email?.split('@')[0].toLowerCase());
      
      // Merchants logging in via Google who are not registered staff should get 'admin' role by default
      const role = isMasterAdmin ? 'admin' : (existingAppUser?.role || 'admin');
      
      let finalShopId = googleUser.uid;
      let onboardStatus = false;

      if (isMasterAdmin) {
        finalShopId = 'master';
        onboardStatus = true;
      } else {
        try {
          // 1. Direct match: doc ID is firebaseUser.uid
          const shopDoc = await getDoc(doc(db, 'shops', googleUser.uid));
          if (shopDoc.exists()) {
            finalShopId = googleUser.uid;
            onboardStatus = true;
          } else {
            // 2. Try searching by ownerUid
            const qByUid = query(collection(db, 'shops'), where('ownerUid', '==', googleUser.uid));
            const snapByUid = await getDocs(qByUid);
            if (!snapByUid.empty) {
              const foundShop = snapByUid.docs[0];
              finalShopId = foundShop.id;
              onboardStatus = true;
            } else if (googleUser.email) {
              // 3. Try searching by ownerEmail
              const qByEmail = query(collection(db, 'shops'), where('ownerEmail', '==', googleUser.email));
              const snapByEmail = await getDocs(qByEmail);
              if (!snapByEmail.empty) {
                const foundShop = snapByEmail.docs[0];
                finalShopId = foundShop.id;
                onboardStatus = true;
              }
            }
          }
        } catch (shopSearchErr) {
          console.error("Error searching shops during Google Login:", shopSearchErr);
        }
      }

      const userData = { 
        uid: googleUser.uid, 
        email: googleUser.email || '', 
        displayName: googleUser.displayName || googleUser.email?.split('@')[0] || 'Google User', 
        role,
        shopId: finalShopId,
        isOnboarded: onboardStatus
      };
      
      setUser(userData);
      setIsOnboarded(onboardStatus);
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

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        const newPrice = calculateItemPrice(product, newQty);
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: newQty, discountedPrice: newPrice } 
            : item
        );
      }
      const initialPrice = calculateItemPrice(product, qty);
      return [...prev, { ...product, quantity: qty, originalPrice: product.price, discountedPrice: initialPrice }];
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

  const updateCartLineTotalManual = (productId: string, total: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        // If quantity is 0 or less, avoid division by zero, just set quantity to 1 implicitly for Calculation mapping or keep it simple
        const qty = item.quantity > 0 ? item.quantity : 1;
        const newUnitPrice = Math.max(0, total) / qty;
        return { ...item, discountedPrice: newUnitPrice };
      }
      return item;
    }));
  };

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0), [cart]);
  const finalTotalBeforeTax = Math.max(0, cartTotal - discount);
  const taxAmount = (finalTotalBeforeTax * taxRate) / 100;
  const finalTotal = finalTotalBeforeTax + taxAmount;

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
    setIsCheckingOut(true);

    try {
      const selectedCustomer = customers.find(c => c.id === checkoutData.customerId);
      const paidAmount = checkoutData.paidAmount || 0;
      const currentLang = shopSettings.systemLanguage || 'bn';
      const defaultRetailName = currentLang === 'bn' ? 'নগদ ক্রেতা (Walk-in)' : (currentLang === 'ar' ? 'عميل عابر' : 'Retail Sale (Walk-in)');
      
      // Enforce full payment for walk-in customers
      if (!checkoutData.customerId && paidAmount < finalTotal) {
        setNotification({ message: "Walk-in customers must pay in full!", type: 'error' });
        setIsCheckingOut(false);
        return;
      }

      const dueAmount = finalTotal - paidAmount;
      const previousBalance = selectedCustomer?.currentDue || 0;
      const newBalance = previousBalance + dueAmount;

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
        shopId: user.shopId,
        customerName: selectedCustomer?.name || checkoutData.walkInName || defaultRetailName,
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
        taxRate: taxRate,
        taxAmount: taxAmount,
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
      if (!isOnline) {
        const customId = generateInvoiceId();
        finalSale = { ...saleData, id: customId } as Sale;
        await addToSyncQueue('sale', { saleData, customId, cart });
        setNotification({ message: "Running Offline: Order queued for sync!", type: 'info' });
      } else if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
        finalSale = { ...saleData, id: editingSale.id } as Sale;
      } else {
        const customId = generateInvoiceId();
        await setDoc(doc(db, 'sales', customId), saleData);
        finalSale = { ...saleData, id: customId } as Sale;
      }
      
      // Apply new sale effects locally/immediately if needed, but for now we rely on DB sync
      if (isOnline) {
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, { stock: increment(-item.quantity) });
        }
      }

      if (sendWhatsApp && isOnline) {
        await sendWhatsAppInvoice(finalSale, dynamicSettings, dynamicSettings.systemLanguage === 'bn' ? 'bn' : (dynamicSettings.systemLanguage === 'ar' ? 'ar' : 'en'));
      }

      if (checkoutData.customerId && isOnline) {
        const customerRef = doc(db, 'customers', checkoutData.customerId);
        const overpayment = checkoutData.paidAmount - finalTotal;

        await updateDoc(customerRef, {
          currentDue: increment(finalTotal - checkoutData.paidAmount),
          totalSpent: increment(finalTotal)
        });

        // Record overpayment in due_payments for history visibility
        if (overpayment > 0) {
          const prevDue = selectedCustomer?.currentDue || 0;
          const remainingDue = prevDue - overpayment;
          await addDoc(collection(db, 'due_payments'), {
            shopId: user.shopId,
            customerId: checkoutData.customerId,
            amount: overpayment,
            previousDue: prevDue,
            remainingDue: remainingDue,
            method: checkoutData.paymentMethod,
            timestamp: serverTimestamp(),
            receivedBy: user?.displayName || user?.username || 'POS',
            note: `Extra payment from Invoice #${finalSale.id}`
          });
        }
      }

      setLastSale(finalSale);
      setLastCompletedSale(finalSale);
      setNotification({ message: editingSale ? "Order updated successfully!" : "Order completed successfully!", type: 'success' });
      setCart([]);
      setDiscount(0);
      setTaxRate(0);
      setCheckoutData({ customerId: '', walkInName: '', walkInPhone: '', paidAmount: 0, paymentMethod: 'cash' });
      setEditingSale(null);
      setShowReceiptModal(true);

      // Auto Send WhatsApp if customer has phone and auto-send is enabled
      if (finalSale.customerPhone && dynamicSettings.autoSendWhatsApp) {
        sendWhatsAppInvoice(finalSale, dynamicSettings, dynamicSettings.systemLanguage === 'bn' ? 'bn' : (dynamicSettings.systemLanguage === 'ar' ? 'ar' : 'en'));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
      setNotification({ message: "Failed to complete transaction. Please try again.", type: 'error' });
    } finally {
      setIsCheckingOut(false);
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
      await moveToRecycleBin('sale', sale.id, sale, sale.shopId || user?.shopId);

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
      printInvoice(lastCompletedSale, dynamicSettings);
    }
  }, [showReceiptModal, lastCompletedSale, dynamicSettings]);

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await moveToRecycleBin('expense', expense.id, expense, expense.shopId || user?.shopId);
      await deleteDoc(doc(db, 'expenses', expense.id));
      setNotification({ message: 'Expense moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'expenses');
    }
  };

  const handleDeleteInvestment = async (investment: Investment) => {
    try {
      await moveToRecycleBin('investment', investment.id, investment, investment.shopId || user?.shopId);
      await deleteDoc(doc(db, 'investments', investment.id));
      setNotification({ message: 'Investment moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'investments');
    }
  };

  const handleDeleteStaffSalary = async (salary: StaffSalary) => {
    try {
      await moveToRecycleBin('salary', salary.id, salary, salary.shopId || user?.shopId);
      await deleteDoc(doc(db, 'staff_salaries', salary.id));
      setNotification({ message: 'Salary record moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'staff_salaries');
    }
  };

  const handleDeleteStockRecord = async (record: StockRecord) => {
    try {
      await moveToRecycleBin('stockRecord', record.id, record, record.shopId || user?.shopId);
      await deleteDoc(doc(db, 'stockRecords', record.id));
      setNotification({ message: 'Stock record moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'stockRecords');
    }
  };

  const addCategory = async (name: string) => {
    if (!user || !user.shopId) return;
    await addDoc(collection(db, 'categories'), { name, shopId: user.shopId });
  };
  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
  };
  const updateCategory = async (id: string, name: string) => {
    await updateDoc(doc(db, 'categories', id), { name });
  };

  const handleSaveSettings = async (newSettings: ShopSettings) => {
    setIsSavingSettings(true);
    try {
      if (!user || !user.shopId) throw new Error("No shopId found");
      
      // Update global shop overview for master admin
      const shopRef = doc(db, 'shops', user.shopId);
      await setDoc(shopRef, {
        name: newSettings.name || 'Unnamed',
        address: newSettings.address || '',
        phone: newSettings.phone || '',
        shopCode: newSettings.shopCode || '',
        ownerEmail: user.email || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update shop-specific settings
      const payload: any = { ...newSettings, shopId: user.shopId };
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      await setDoc(doc(db, 'settings', user.shopId), payload);
      
      setNotification({ message: 'Settings updated successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
      setNotification({ message: 'Failed to update settings', type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddUser = async (newUser: Omit<AppUser, 'id'>) => {
    if (!user?.shopId) return;
    // Check if username already exists
    const exists = appUsers.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      setNotification({ message: 'Username already exists. Please choose another.', type: 'error' });
      return;
    }

    try {
      // Create user in authentication
      const email = `${newUser.username}@bismillahstore.local`;
      let uid = '';
      try {
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);
        uid = credential.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
           setNotification({ message: 'This username is technically taken in Auth. Use another.', type: 'error' });
           return;
        } else {
           throw authErr;
        }
      }

      await setDoc(doc(db, 'users', uid), { ...newUser, shopId: user.shopId });
      setNotification({ message: 'User added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = appUsers.find(u => u.id === userId);
      if (userToDelete) {
        await moveToRecycleBin('user', userId, userToDelete, userToDelete.shopId || user?.shopId);
      }
      await deleteDoc(doc(db, 'users', userId));
      setNotification({ message: 'User moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
    }
  };

  const handleAddEmployee = async (newEmployee: Omit<Employee, 'id'>) => {
    try {
      if (!user?.shopId) return;
      await addDoc(collection(db, 'employees'), { ...newEmployee, shopId: user.shopId });
      setNotification({ message: 'Employee added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'employees');
    }
  };

  const handleAddProduct = async (newProduct: Partial<Product>) => {
    try {
      if (!user?.shopId) return;
      const maxSerial = products.reduce((max, p) => p.serialNumber ? Math.max(max, p.serialNumber) : max, 0);
      const docRef = await addDoc(collection(db, 'products'), {
        ...newProduct,
        shopId: user.shopId,
        serialNumber: maxSerial + 1,
        createdAt: new Date().toISOString()
      });
      setNotification({ message: 'Product added successfully', type: 'success' });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleAddCustomer = async (newCustomer: Omit<Customer, 'id' | 'serialNumber'>): Promise<string | undefined> => {
    try {
      if (!user?.shopId) return undefined;
      const docRef = await addDoc(collection(db, 'customers'), {
        ...newCustomer,
        shopId: user.shopId,
        serialNumber: Date.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
      return undefined;
    }
  };

  const handleLoadOrderToPOS = async (order: any) => {
    try {
      let customerId = '';
      const matchedCust = customers.find(c => c.phone === order.customerPhone);
      if (matchedCust) {
        customerId = matchedCust.id;
      } else {
        customerId = order.customerId || '';
      }

      const posCartItems: any[] = [];
      for (const item of order.items) {
        const p = products.find(prod => prod.id === item.productId);
        if (p) {
          posCartItems.push({
            ...p,
            quantity: item.quantity
          });
        } else {
          posCartItems.push({
            id: item.productId,
            name: item.productName,
            price: item.price,
            cost: item.price * 0.7,
            quantity: item.quantity,
            category: 'Uncategorized',
            unit: item.unit || 'unit',
            stock: 99
          });
        }
      }

      setCart(posCartItems);
      setCheckoutData({
        customerId: customerId,
        isWalkIn: !customerId,
        walkInName: order.customerName,
        walkInPhone: order.customerPhone,
        paidAmount: order.totalAmount,
        paymentMethod: 'cash'
      });

      setActiveTab('pos');

      const orderRef = doc(db, 'customer_orders', order.id);
      await updateDoc(orderRef, { status: 'approved' });

      setNotification({
        message: shopSettings.systemLanguage === 'bn' 
          ? 'গ্রাহক অর্ডার সফলভাবে POS-এ লোড করা হয়েছে!' 
          : 'Customer order successfully loaded to POS!',
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setNotification({ message: 'Failed to load order to POS', type: 'error' });
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
        await moveToRecycleBin('employee', id, employeeToDelete, employeeToDelete.shopId || user?.shopId);
      }
      await deleteDoc(doc(db, 'employees', id));
      setNotification({ message: 'Employee moved to Recycle Bin', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'employees');
    }
  };


  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      if (!user?.shopId) return;
      await addDoc(collection(db, 'expenses'), { ...newExpense, shopId: user.shopId });
      setNotification({ message: 'Expense added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const handleAddInvestment = async (newInvestment: Omit<Investment, 'id'>) => {
    try {
      if (!user?.shopId) return;
      await addDoc(collection(db, 'investments'), { ...newInvestment, shopId: user.shopId });
      setNotification({ message: 'Investment added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'investments');
    }
  };

  const handleAddStaffSalary = async (newSalary: Omit<StaffSalary, 'id'>) => {
    try {
      if (!user?.shopId) return;
      await addDoc(collection(db, 'staff_salaries'), { ...newSalary, shopId: user.shopId });
      setNotification({ message: 'Salary payment recorded', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'staff_salaries');
    }
  };

  const handleScan = (barcode: string) => {
    if (scannerMode === 'cart') {
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
    } else if (scannerMode === 'product') {
      setEditingProduct(prev => ({ ...(prev || {}), barcode }));
      setIsScannerOpen(false);
      setNotification({ message: `Barcode ${barcode} scanned`, type: 'success' });
    }
  };

  const handleSendWhatsAppReminder = async (customer: Customer, lang: 'en' | 'bn') => {
    let message = "";
    
    if (shopSettings.aiWhatsAppEnabled) {
      const aiMsg = await generatePersonalizedMessage(customer, null, 'reminder', lang, shopSettings);
      if (aiMsg) message = aiMsg;
    }

    if (!message) {
      if (lang === 'bn') {
        message = `আসসালামু আলাইকুম ${customer.name}, আপনার বকেয়া বিলের পরিমাণ ${shopSettings.currencySymbol} ${customer.currentDue?.toFixed(2)}। ${customer.dueDate ? `আপনার প্রতিশ্রুত তারিখ ছিল ${format(new Date(customer.dueDate), 'dd MMM yyyy')}।` : ''} অনুগ্রহ করে যত দ্রুত সম্ভব বিলটি পরিশোধ করুন। ধন্যবাদ!`;
      } else {
        message = `Assalamu Alaikum ${customer.name}, this is a reminder regarding your outstanding due of ${shopSettings.currencySymbol} ${customer.currentDue?.toFixed(2)}. ${customer.dueDate ? `Your promised date was ${format(new Date(customer.dueDate), 'dd MMM yyyy')}.` : ''} Please settle the amount as soon as possible. Thank you!`;
      }
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

  const systemLang = dynamicSettings.systemLanguage || 'bn';
  const st = (key: keyof typeof SYSTEM_TRANSLATIONS['en']) => (SYSTEM_TRANSLATIONS[systemLang] as any)[key] || (SYSTEM_TRANSLATIONS['en'] as any)[key];
  const isRtl = systemLang === 'ar';
  (window as any)._globalCurrencySymbol = dynamicSettings.currencySymbol || 'TK';
  (window as any)._globalLang = systemLang;

  if (loading || (user && isOnboarded === null)) {
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

  if (showCustomerPortal && !user) {
    return (
      <CustomerPortal 
        onBack={() => handleSetShowCustomerPortal(false)} 
        lang={shopSettings.systemLanguage || 'bn'} 
      />
    );
  }

  if (!user) {
    const isBn = systemLang === 'bn';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden font-sans">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-30" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full flex flex-col md:flex-row bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-white relative z-10 overflow-hidden mx-4"
        >
          {/* Left Side: Branding & Info */}
          <div className="flex-1 bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
            
            <div className="relative z-20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 shadow-lg border border-white/30">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-tight">
                {st('loginTitle')}
              </h1>
              <p className="text-indigo-100 text-lg opacity-90 max-w-xs font-light">
                {st('loginSubtitle')}
              </p>
            </div>

            <div className="relative z-20 mt-12 md:mt-0">
              <div className="space-y-6">
                {[
                  { icon: ShieldCheck, title: isBn ? 'সুরক্ষিত লেনদেন' : 'Secure Transactions' },
                  { icon: Sparkles, title: isBn ? 'এআই চালিত মেসেজ' : 'AI Powered Messaging' },
                  { icon: TrendingUp, title: isBn ? 'রিয়েল-টাইম রিপোর্ট' : 'Real-time Analytics' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="h-10 w-10 bg-white/10 group-hover:bg-white/20 transition-colors rounded-xl flex items-center justify-center border border-white/20">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium opacity-90">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="flex-1 p-8 md:p-12 flex flex-col">
            <div className="mb-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  {[
                    { id: 'bn', label: 'বাংলা' },
                    { id: 'en', label: 'EN' },
                    { id: 'ar', label: 'العربية' }
                  ].map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setShopSettings(prev => ({ ...prev, systemLanguage: lang.id as any }))}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${shopSettings.systemLanguage === lang.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  {st('systemStatus')}
                </div>
              </div>

              <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-8 font-semibold text-sm">
                <button 
                  onClick={() => setLoginMode('merchant')}
                  className={`flex-1 py-3 rounded-xl transition-all duration-300 ${loginMode === 'merchant' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {st('merchantLogin')}
                </button>
                <button 
                  onClick={() => setLoginMode('staff')}
                  className={`flex-1 py-3 rounded-xl transition-all duration-300 ${loginMode === 'staff' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {st('staffLogin')}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {loginMode === 'merchant' ? (
                  <motion.div
                    key="merchant"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center md:text-left mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{st('merchantLogin')}</h2>
                      <p className="text-gray-500 text-sm">{st('loginSubtitleMerchant')}</p>
                    </div>

                    <button 
                      onClick={handleGoogleLogin}
                      className="w-full h-14 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-4 group hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50"
                    >
                      <div className="w-8 h-8 bg-white shadow-sm rounded-full flex items-center justify-center border border-gray-100">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#ea4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.38-7.84 5.38-4.81 0-8.73-3.92-8.73-8.73s3.92-8.73 8.73-8.73c2.72 0 4.53 1.16 5.57 2.16l2.58-2.58C18.91 1.76 15.91 1 12.48 1 6.26 1 1.24 6.02 1.24 12.24s5.02 11.24 11.24 11.24c6.53 0 10.86-4.57 10.86-11.02 0-.74-.08-1.3-.18-1.86h-9.44z"/>
                        </svg>
                      </div>
                      {st('googleSignIn')}
                    </button>
                    
                    <div className="pt-6 border-t border-gray-100 text-center">
                      <p className="text-gray-400 text-xs leading-relaxed uppercase tracking-widest font-bold">
                        Secure Access Provided by Firebase
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="staff"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="text-center md:text-left mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{st('staffLogin')}</h2>
                      <p className="text-gray-500 text-sm">{st('loginSubtitleStaff')}</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-tight">{st('username')}</label>
                        <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                          <input 
                            type="text" 
                            required 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none text-gray-900 font-medium"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-tight">{st('password')}</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                          <input 
                            type="password" 
                            required 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none text-gray-900 font-medium"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      {authError && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl flex items-center gap-3 font-medium border border-red-100"
                        >
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          {authError}
                        </motion.div>
                      )}

                      <button 
                        type="submit"
                        className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group"
                      >
                        {st('signIn')}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Customer Portal Entry link */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => handleSetShowCustomerPortal(true)}
                  className="w-full h-14 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-black transition-all flex items-center justify-center gap-2.5 group"
                >
                  <Sparkles className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span>
                    {isBn ? "গ্রাহক সেবা পোর্টাল (অর্ডার ও সাধারণ খতিয়ান)" : "Customer Self-Service Portal"}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="mt-auto text-center pt-8 border-t border-gray-100">
              <p className="text-gray-400 text-xs">
                © {new Date().getFullYear()} {shopSettings.name}. All rights reserved.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (user && isOnboarded === false) {
    return <ShopOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-white flex flex-col lg:flex-row ${isRtl ? 'rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 truncate">{shopSettings.name}</span>
            {!isOnline && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {st('offline').toUpperCase()}
              </div>
            )}
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
        <aside 
          className={`
            fixed lg:static inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-50 bg-white border-r border-gray-100 flex flex-col shadow-2xl lg:shadow-none
            h-screen w-72 lg:w-72
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0 opacity-100 flex' : (isRtl ? 'translate-x-full lg:translate-x-0 hidden lg:flex' : '-translate-x-full lg:translate-x-0 hidden lg:flex')}
            overflow-hidden
          `}
        >
              <div className="p-6 flex items-center justify-between gap-3 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="flex items-center gap-3">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8, ease: "anticipate" }}
                    className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100"
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="font-black text-xl text-gray-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors uppercase">{shopSettings.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Business Suite</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-rose-50 rounded-xl transition-all text-gray-400 hover:text-rose-600 border border-transparent hover:border-rose-100 lg:hidden"
                  title="Hide Sidebar"
                >
                  <ChevronLeft className={`w-5 h-5 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1.5 bg-white">
            {[
              { id: 'core', label: 'core', items: [
                { id: 'dashboard', icon: LayoutDashboard, label: st('dashboard'), roles: ['admin', 'manager'], color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { id: 'pos', icon: ShoppingCart, label: st('pos'), roles: ['admin', 'manager', 'assistant_manager', 'sales_manager', 'sales_team'], color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              ]},
              { id: 'inventory', label: 'inventory_group', items: [
                { id: 'inventory', icon: Package, label: st('inventory'), roles: ['admin', 'manager', 'assistant_manager'], color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                { id: 'category', icon: Tag, label: st('category'), roles: ['admin', 'manager'], color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                { id: 'warehouse', icon: Warehouse, label: st('warehouse'), roles: ['admin', 'manager'], color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                { id: 'supplier', icon: Users, label: st('supplier'), roles: ['admin', 'manager'], color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
                { id: 'barcode', icon: Barcode, label: st('barcode'), roles: ['admin', 'manager'], color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
              ]},
              { id: 'sales_crm', label: 'sales_crm', items: [
                { id: 'sales', icon: History, label: st('sales'), roles: ['admin', 'manager', 'assistant_manager', 'sales_manager'], color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
                { id: 'customers', icon: Users, label: st('customers'), roles: ['admin', 'manager', 'assistant_manager', 'sales_manager'], color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
                { id: 'customer_orders', icon: ShoppingBag, label: shopSettings.systemLanguage === 'bn' ? 'গ্রাহক অর্ডার' : 'Customer Orders', roles: ['admin', 'manager', 'assistant_manager', 'sales_manager'], color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                { id: 'loan_management', icon: Banknote, label: st('loanManagement'), roles: ['admin', 'manager'], color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
              ]},
              { id: 'accounting', label: 'accounting', items: [
                { id: 'accounting', icon: CalculatorIcon, label: st('hishabNikash'), roles: ['admin', 'manager'], color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                { id: 'daily_closing', icon: Clock, label: st('dailyClosing'), roles: ['admin', 'manager'], color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
                { id: 'payment_method', icon: CreditCard, label: st('paymentMethod'), roles: ['admin', 'manager'], color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
              ]},
              { id: 'management', label: 'management', items: [
                { id: 'shops', icon: Globe, label: 'Network Console', roles: [], color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                { id: 'jarvis', icon: Bot, label: st('jarvisAI'), roles: ['admin'], color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
                { id: 'online_shop', icon: Globe, label: st('onlineShop'), roles: ['admin', 'manager'], color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { id: 'courier', icon: Truck, label: st('courier'), roles: ['admin', 'manager'], color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                { id: 'warranty', icon: ShieldCheck, label: st('warranty'), roles: ['admin', 'manager'], color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
                { id: 'service_offer', icon: Gift, label: st('serviceOffer'), roles: ['admin', 'manager'], color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                { id: 'activation_code', icon: KeySquare, label: st('activationCode'), roles: ['admin', 'manager'], color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                { id: 'note', icon: StickyNote, label: st('note'), roles: ['admin', 'manager'], color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
                { id: 'settings', icon: Settings, label: st('settings'), roles: ['admin'], color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
                { id: 'recycle_bin', icon: Trash2, label: st('recycleBin'), roles: ['admin'], color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                { id: 'main_admin', icon: UserCog, label: st('mainAdmin'), roles: ['admin'], color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              ]},
            ].map((group) => (
              <div key={group.id} className="space-y-1 mb-6">
                <h3 className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{st(group.label as any)}</h3>
                {group.items.filter(item => (user && item.roles.includes(user.role)) || (item.id === 'shops' && isMasterAdmin)).map((item, idx) => (
                  <motion.button
                    key={item.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.02, ease: "easeOut" }}
                    whileHover={{ x: 6, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (!isDesktop) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                      activeTab === item.id                
                        ? `${item.bg} ${item.color} shadow-sm ring-1 ${item.border}` 
                        : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        activeTab === item.id ? 'bg-white' : 'bg-gray-50 group-hover:bg-white'
                      }`}>
                        <item.icon className={`w-4 h-4 ${activeTab === item.id ? item.color : 'text-gray-400 group-hover:text-gray-600'}`} />
                      </div>
                      <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
                    </div>
                    {activeTab === item.id && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-current"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl mb-4 group cursor-pointer hover:bg-indigo-50 transition-colors">
              <div className="w-11 h-11 bg-white p-0.5 rounded-xl border border-indigo-100 shadow-sm overflow-hidden flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-105 transition-transform">
                {user.email?.[0].toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">{user.email?.split('@')[0] || 'Administrator'}</p>
                <p className="text-[10px] font-bold text-indigo-500 truncate uppercase mt-0.5 tracking-wider">{user.role}</p>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-calculator'));
                if (!isDesktop) {
                  setIsSidebarOpen(false);
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 mb-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-600 hover:to-purple-700 hover:text-white text-indigo-700 rounded-xl transition-all font-bold text-sm border border-indigo-100/50 shadow-sm"
            >
              <CalculatorIcon className="w-5 h-5" />
              {shopSettings.systemLanguage === 'bn' ? 'ক্যালকুলেটর (Calculator)' : 'Open Calculator'}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!isFullScreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 mb-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all font-bold text-sm border border-indigo-100 hover:border-indigo-600 shadow-sm"
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              {isFullScreen ? st('fullScreenOff') : st('fullScreenOn')}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-3 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all font-bold text-sm border border-red-100 hover:border-red-500 shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              {st('logout')}
            </motion.button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${(activeTab === 'pos' || activeTab === 'jarvis') ? 'p-0 sm:p-2 lg:p-3' : 'p-4 lg:p-8'} overflow-x-hidden relative bg-white`}>
          <AnimatePresence>
            {activeTab !== 'jarvis' && <motion.button 
              initial={{ x: -20, opacity: 0, scale: 0.8 }}
              animate={{ x: isSidebarOpen ? -100 : 0, opacity: isSidebarOpen ? 0 : 1, scale: isSidebarOpen ? 0.8 : 1 }}
              whileHover={{ scale: 1.05, x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden fixed ${isRtl ? 'right-6' : 'left-6'} top-6 z-[60] p-3 bg-white border border-gray-200 rounded-2xl text-indigo-600 shadow-xl shadow-indigo-100 hover:bg-indigo-50 transition-all group flex items-center gap-2`}
            >
              <Menu className="w-6 h-6" />
            </motion.button>}
          </AnimatePresence>

          {activeTab !== 'jarvis' && (
            <div className="mb-6 mt-12 lg:mt-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6 bg-gradient-to-r from-gray-50 to-indigo-50/10 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/10 text-indigo-600 rounded-2xl">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                    {systemLang === 'bn' ? 'সিস্টেম স্ট্যাটাস' : systemLang === 'ar' ? 'حالة النظام' : 'System Status'}
                  </h2>
                  <p className="text-xl font-black text-gray-900 tracking-tight">
                    {dynamicSettings.name || (systemLang === 'bn' ? 'আমার শপ' : systemLang === 'ar' ? 'متجري' : 'My Business')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100/60 text-emerald-700 rounded-2xl text-xs font-bold ring-1 ring-emerald-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {systemLang === 'bn' ? 'সিস্টেম অনলাইন' : systemLang === 'ar' ? 'النظام متصل' : 'System Online'}
                </div>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col animate-fadeIn"
            >
              {activeTab === 'shops' && isMasterAdmin && (
                <ShopManagement shops={shops} />
              )}
            {activeTab === 'jarvis' && (
              <JarvisAI 
                shopId={user?.shopId || ''}
                isMasterAdmin={isMasterAdmin}
                onClose={() => setActiveTab('dashboard')}
                systemData={{
                  items: products,
                  sales: sales,
                  customers: customers,
                  categories: categories,
                  settings: dynamicSettings,
                  merchants: shops
                }}
                actions={{
                  addItem: handleAddProduct,
                  addCustomer: handleAddCustomer,
                  removeItem: async (id) => {
                    const product = products.find(p => p.id === id);
                    if (product) handleDeleteProduct(product);
                  },
                  navigate: (tab: any) => setActiveTab(tab),
                  addToPOS: (items: any[]) => {
                    setActiveTab('pos');
                    setCart([]); // Clear cart to add new items from voice command
                    items.forEach(i => {
                      const p = fuzzyMatchProduct(products, i.productName);
                      if (p) addToCart(p, i.quantity);
                    });
                  },
                  sendReminder: (c: any) => {
                    handleSendWhatsAppReminder(c, dynamicSettings.systemLanguage as any || 'bn');
                  },
                  printLatestInvoice: () => {
                    if (sales.length > 0) {
                      printInvoice(sales[0], dynamicSettings);
                    } else {
                      setNotification({ message: 'No invoice found to print', type: 'error' });
                    }
                  },
                  sendLatestInvoiceWhatsApp: () => {
                    if (sales.length > 0) {
                      sendWhatsAppInvoice(sales[0], dynamicSettings, dynamicSettings.systemLanguage as any);
                    } else {
                      setNotification({ message: 'No invoice found', type: 'error' });
                    }
                  },
                  createDirectSale: async (saleData: any) => {
                    try {
                      const itemsToSell: any[] = [];
                      let cartTotal = 0;
                      let errorMsg = "";

                      // Build cart
                      for (const i of saleData.items) {
                        const p = fuzzyMatchProduct(products, i.productName);
                        if (p) {
                          if (p.stock < i.quantity) {
                            errorMsg += `Not enough stock for ${p.name}. `;
                          } else {
                            const price = p.price - (p.discount || 0);
                            itemsToSell.push({
                              id: p.id,
                              name: p.name,
                              quantity: i.quantity,
                              unit: p.unit || 'unit',
                              discountedPrice: price,
                              originalPrice: p.price,
                              cost: p.cost || 0
                            });
                            cartTotal += price * i.quantity;
                          }
                        } else {
                          errorMsg += `Product ${i.productName} not found. `;
                        }
                      }

                      if (itemsToSell.length === 0) {
                        return { success: false, error: errorMsg || 'No items to sell.' };
                      }

                      // Find customer
                      let selectedCustomer: Customer | undefined;
                      if (saleData.customerPhoneOrName) {
                        const q = saleData.customerPhoneOrName.toLowerCase();
                        selectedCustomer = customers.find(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
                      }

                      const finalTotal = cartTotal; // Assuming no additional tax/discount for AI sales for simplicity
                      let paidAmount = saleData.paidAmount;
                      if (paidAmount === undefined) paidAmount = finalTotal;
                      
                      if (!selectedCustomer && paidAmount < finalTotal) {
                        return { success: false, error: 'Walk-in customers must pay in full!' };
                      }

                      const dueAmount = finalTotal - paidAmount;
                      const previousBalance = selectedCustomer?.currentDue || 0;
                      const currentLang = shopSettings.systemLanguage || 'bn';
                      const defaultRetailName = currentLang === 'bn' ? 'নগদ ক্রেতা (Walk-in)' : 'Retail Sale (Walk-in)';

                      const finalSaleData: any = {
                        shopId: user?.shopId,
                        customerName: selectedCustomer?.name || defaultRetailName,
                        customerPhone: selectedCustomer?.phone || '',
                        customerId: selectedCustomer?.id || null,
                        items: itemsToSell.map(item => ({
                          productId: item.id || '',
                          productName: item.name || 'Unknown Product',
                          quantity: item.quantity || 0,
                          unit: item.unit || 'unit',
                          price: item.discountedPrice || 0,
                          originalPrice: item.originalPrice || 0,
                          cost: item.cost || 0
                        })),
                        totalAmount: cartTotal,
                        discount: 0,
                        taxRate: 0,
                        taxAmount: 0,
                        finalAmount: finalTotal,
                        paidAmount: paidAmount,
                        dueAmount: dueAmount,
                        previousBalance: previousBalance,
                        paymentMethod: 'cash',
                        timestamp: new Date(),
                        sellerId: auth.currentUser?.uid || 'unknown'
                      };

                      let finalSale: Sale;
                      if (!isOnline) {
                        const customId = generateInvoiceId('');
                        finalSale = { ...finalSaleData, id: customId } as Sale;
                        await addToSyncQueue('sale', { saleData: finalSaleData, customId, cart: itemsToSell });
                      } else {
                        const customId = generateInvoiceId('');
                        await setDoc(doc(db, 'sales', customId), finalSaleData);
                        finalSale = { ...finalSaleData, id: customId } as Sale;
                        
                        // Update stock
                        for (const item of itemsToSell) {
                          const productRef = doc(db, 'products', item.id);
                          await updateDoc(productRef, { stock: increment(-item.quantity) });
                        }
                        
                        // Update customer
                        if (selectedCustomer) {
                          const customerRef = doc(db, 'customers', selectedCustomer.id);
                          // We use finalTotal for totalSpent and (finalTotal - paidAmount) for due increment.
                          await updateDoc(customerRef, {
                            currentDue: increment(finalTotal - paidAmount),
                            totalSpent: increment(finalTotal)
                          });
                        }
                      }
                      
                      if (saleData.printInvoice) {
                        printInvoice(finalSale, dynamicSettings);
                      }
                      
                      if (saleData.sendWhatsApp && isOnline) {
                        await sendWhatsAppInvoice(finalSale, dynamicSettings, currentLang as any);
                      }

                      return { success: true, total: finalTotal, paid: paidAmount, due: dueAmount };
                    } catch (e: any) {
                      return { success: false, error: e.message };
                    }
                  }
                }}
              />
            )}
            {activeTab === 'dashboard' && (
              <Dashboard 
                products={products} 
                sales={sales} 
                customers={customers} 
                expenses={expenses}
                dailyClosings={dailyClosings}
                settings={dynamicSettings}
                onDelete={handleDeleteDailyClosing}
                onViewProductHistory={(p) => {
                  setSelectedProductForHistory(p);
                }}
                isOnline={isOnline}
                user={user}
                expiringProducts={expiringProducts}
                period={dashboardPeriod}
                setPeriod={setDashboardPeriod}
                viewMetric={dashboardViewMetric}
                setViewMetric={setDashboardViewMetric}
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
                updateCartLineTotalManual={updateCartLineTotalManual}
                handleCheckout={handleCheckout}
                discount={discount}
                setDiscount={setDiscount}
                taxRate={taxRate}
                setTaxRate={setTaxRate}
                taxAmount={taxAmount}
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
                  setTaxRate(0);
                  setCheckoutData({ customerId: '', paidAmount: 0, paymentMethod: 'cash' });
                }}
                settings={dynamicSettings}
                setNotification={setNotification}
                user={user}
                isOnline={isOnline}
                onAddCustomer={handleAddCustomer}
                generateCustomerSuggestion={generateCustomerSuggestion}
                isCustomerModalOpen={isCustomerModalOpen}
                setIsCustomerModalOpen={setIsCustomerModalOpen}
                customerSuggestion={customerSuggestion}
                isCustomerVoiceListening={isCustomerVoiceListening}
                setIsCustomerVoiceListening={setIsCustomerVoiceListening}
                isCheckingOut={isCheckingOut}
              />
            )}
            {activeTab === 'inventory' && (
              <Inventory 
                products={products} 
                categories={categories} 
                stockRecords={stockRecords}
                sales={sales}
                onViewHistory={(p) => {
                  setSelectedProductForHistory(p);
                }}
                setNotification={setNotification}
                isOnline={isOnline}
                settings={dynamicSettings}
                isSaving={isSavingProduct}
                setIsSaving={setIsSavingProduct}
                setScannerMode={setScannerMode}
                setIsScannerOpen={setIsScannerOpen}
                user={user}
              />
            )}
            {activeTab === 'category' && (
              <CategoryManagement 
                categories={categories}
                addCategory={addCategory}
                deleteCategory={deleteCategory}
                updateCategory={updateCategory}
              />
            )}
            {activeTab === 'sales' && (
              <SalesHistory 
                sales={sales} 
                onEdit={handleEditSale}
                onDelete={handleDeleteSale}
                settings={dynamicSettings}
                isOnline={isOnline}
                customers={customers}
              />
            )}
            {activeTab === 'customers' && (
              <Customers 
                customers={customers} 
                sales={sales} 
                setNotification={setNotification}
                shopSettings={dynamicSettings}
                user={user}
                onDownloadCSV={handleDownloadCustomersCSV}
                customerLogs={customerLogs}
                duePayments={duePayments}
                recycleBin={recycleBin}
                isOnline={isOnline}
                syncQueue={syncQueue}
              />
            )}
            {activeTab === 'customer_orders' && (
              <SellerOrdersView 
                orders={customerOrders} 
                lang={dynamicSettings.systemLanguage || 'bn'} 
                onLoadToPOS={handleLoadOrderToPOS} 
              />
            )}
            {activeTab === 'daily_closing' && (
              <DailyClosingView 
                sales={sales} 
                expenses={expenses} 
                dailyClosings={dailyClosings}
                duePayments={duePayments}
                settings={dynamicSettings}
                user={user}
                onDelete={handleDeleteDailyClosing}
                setNotification={setNotification}
              />
            )}
            {activeTab === 'barcode' && (
              <BarcodePage products={products} settings={dynamicSettings} user={user} setNotification={setNotification} />
            )}
            {activeTab === 'note' && (
              <NoteView 
                notes={notes} 
                onAdd={handleAddNote} 
                onUpdate={handleUpdateNote} 
                onDelete={handleDeleteNote}
                settings={dynamicSettings}
              />
            )}
            {activeTab === 'warranty' && (
              <WarrantyPage 
                products={products} 
                settings={dynamicSettings} 
              />
            )}
            {activeTab === 'loan_management' && (
              <LoanManagement 
                products={products}
                customers={customers}
                settings={dynamicSettings}
              />
            )}
            {activeTab === 'payment_method' && <PaymentMethodView />}
            {activeTab === 'courier' && <CourierView />}
            {activeTab === 'supplier' && (
              <SupplierPage 
                products={products}
                settings={dynamicSettings}
              />
            )}
            {activeTab === 'activation_code' && <ActivationCodePage />}
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
                isSaving={isSavingSettings}
                products={products}
                sales={sales}
                customers={customers}
                expenses={expenses}
                deferredPrompt={deferredPrompt}
                onInstallPWA={handleInstallPWA}
                isMasterAdmin={isMasterAdmin}
                currentUserEmail={user?.email || ''}
              />
            )}
            {activeTab === 'recycle_bin' && (
              <RecycleBin 
                items={recycleBin} 
                onRestore={handleRestoreRecycleItem} 
              />
            )}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {isCustomerModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCustomerModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className={`h-2 w-full bg-gradient-to-r ${PAGE_THEMES.dashboard.gradient}`}></div>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight lowercase">AI Assistant</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Smart Suggestion</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/30 mb-6">
                    <p className="text-emerald-900 font-bold text-sm italic">"{customerSuggestion}"</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Name</label>
                        <input 
                          type="text"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={checkoutData.walkInName || ''}
                          onChange={(e) => setCheckoutData({...checkoutData, walkInName: e.target.value})}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Mobile</label>
                        <input 
                          type="text"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={checkoutData.walkInPhone || ''}
                          onChange={(e) => setCheckoutData({...checkoutData, walkInPhone: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                          if (!SpeechRecognition) {
                            setNotification({ type: 'error', message: 'Voice recognition not supported' });
                            return;
                          }
                          const rec = new SpeechRecognition();
                          rec.lang = settings.systemLanguage === 'bn' ? 'bn-BD' : (settings.systemLanguage === 'ar' ? 'ar-SA' : 'en-US');
                          rec.onstart = () => setIsCustomerVoiceListening(true);
                          rec.onend = () => setIsCustomerVoiceListening(false);
                          rec.onresult = (event: any) => {
                            const transcript = event.results[0][0].transcript;
                            // Simple parser: "Name is X Mobile is Y"
                            const nameMatch = transcript.match(/name (is )?([a-zA-Z ]+)/i);
                            const phoneMatch = transcript.match(/mobile (is )?([0-9 ]+)/i);
                            if (nameMatch) setCheckoutData(prev => ({...prev, walkInName: nameMatch[2].trim()}));
                            if (phoneMatch) setCheckoutData(prev => ({...prev, walkInPhone: phoneMatch[2].trim().replace(/\s/g, '')}));
                            if (!nameMatch && !phoneMatch) {
                              setCheckoutData(prev => ({...prev, walkInName: transcript}));
                            }
                          };
                          rec.start();
                        }}
                        className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${isCustomerVoiceListening ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
                      >
                        <Mic className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {isCustomerVoiceListening ? '...' : 'Voice'}
                        </span>
                      </button>
                      
                      <button 
                        onClick={async () => {
                          const newCust = {
                            name: checkoutData.walkInName || 'New Customer',
                            phone: checkoutData.walkInPhone || '',
                            address: '',
                            points: 0,
                            totalSpent: 0,
                            currentDue: 0
                          };
                          const newId = await handleAddCustomer(newCust);
                          if (newId) {
                            setCheckoutData({ ...checkoutData, customerId: newId, walkInName: '', walkInPhone: '' });
                            setIsCustomerModalOpen(false);
                            setNotification({ type: 'success', message: 'Customer added successfully!' });
                          }
                        }}
                        className={`flex-[1.5] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all`}
                      >
                        <Plus className="w-4 h-4" />
                        Add Customer
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
              <p className="text-gray-500 mb-8">Order #{lastCompletedSale.id} has been generated.</p>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    printInvoice(lastCompletedSale, dynamicSettings);
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
                      sendWhatsAppInvoice(lastCompletedSale, dynamicSettings, dynamicSettings.systemLanguage === 'bn' ? 'bn' : (dynamicSettings.systemLanguage === 'ar' ? 'ar' : 'en'));
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
        <NoteGlobal 
          notes={notes} 
          onAdd={handleAddNote} 
          onDelete={handleDeleteNote}
          settings={dynamicSettings}
          isRtl={isRtl}
          isSidebarOpen={isSidebarOpen}
          isDesktop={isDesktop}
        />
        <Calculator settings={dynamicSettings} isRtl={isRtl} isSidebarOpen={isSidebarOpen} isDesktop={isDesktop} />
        
        <NotificationToast notification={notification} onClose={() => setNotification(null)} />
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

function BarcodeScanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    let isStarted = false;

    const startScanner = async () => {
      try {
        // Wait a tiny bit to make sure container div is in the DOM
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        const container = document.getElementById("reader");
        if (!container) return;

        html5Qrcode = new Html5Qrcode("reader");
        isStarted = true;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
            if (html5Qrcode) {
              html5Qrcode.stop().catch((err) => console.error("Error stopping html5-qrcode on scan:", err));
            }
            onClose();
          },
          (errorMessage) => {
            // Quietly ignore verbose camera scanning frame matching failures
          }
        );
      } catch (err: any) {
        console.error("Camera scanner error:", err);
        setErrorMsg(err?.message || "Could not access the camera. Please type the barcode manually.");
      }
    };

    startScanner();

    return () => {
      if (html5Qrcode) {
        if (html5Qrcode.isScanning) {
          html5Qrcode.stop().catch((err) => console.error("Error stopping html5-qrcode on unmount:", err));
        }
      }
    };
  }, [onScan, onClose]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      onClose();
    }
  };

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
        
        <div className="relative bg-black min-h-64 flex flex-col items-center justify-center text-white">
          <div id="reader" className="w-full h-64"></div>
          {errorMsg && (
            <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />
              <p className="text-sm font-bold max-w-xs">{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex flex-col gap-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Position the barcode within the camera frame or enter it below:</p>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Enter Barcode manually..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
            <button 
              onClick={handleManualSubmit}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationToast({ notification, onClose }: { 
  notification: { message: string, type: 'success' | 'error' | 'info' } | null, 
  onClose: () => void 
}) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-4 pointer-events-auto ${
              notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              notification.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              'bg-indigo-50 border-indigo-100 text-indigo-800'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              notification.type === 'error' ? 'bg-rose-100 text-rose-600' :
              'bg-indigo-100 text-indigo-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
               notification.type === 'error' ? <AlertCircle className="w-6 h-6" /> :
               <Info className="w-6 h-6" />}
            </div>
            <p className="font-bold text-sm flex-1">{notification.message}</p>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <X className="w-4 h-4 opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
              <p className="text-xs text-gray-500">Stock: {product.stock} {product.unit} | Price: {fC(product.price)}</p>
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
                          <p className="text-sm font-bold text-indigo-600">{fC((item?.quantity || 0) * (item?.price || 0))}</p>
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

function Calculator({ settings, isRtl, isSidebarOpen, isDesktop }: { settings: ShopSettings, isRtl: boolean, isSidebarOpen: boolean, isDesktop?: boolean }) {
  const [display, setDisplay] = useState('0');
  const [isOpen, setIsOpen] = useState(false);
  const [lastEquation, setLastEquation] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [calcHistory, setCalcHistory] = useState<{ equation: string; result: string; timestamp: string }[]>(() => {
    try {
      const saved = localStorage.getItem('shop_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabled] = useState(true);
  const [memory, setMemory] = useState<number>(0);

  // Global listener to easily open calculator from sidebar or head bar
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    window.addEventListener('toggle-calculator', handleToggle);
    window.addEventListener('open-calculator', handleOpen);
    window.addEventListener('close-calculator', handleClose);
    return () => {
      window.removeEventListener('toggle-calculator', handleToggle);
      window.removeEventListener('open-calculator', handleOpen);
      window.removeEventListener('close-calculator', handleClose);
    };
  }, []);

  const saveHistory = (equation: string, result: string) => {
    const newRecord = {
      equation,
      result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setCalcHistory(prev => {
      const updated = [newRecord, ...prev].slice(0, 50); // limit to 50 records
      localStorage.setItem('shop_calc_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAction = (val: string) => {
    if (val === 'C') {
      setDisplay('0');
      setLastEquation(null);
    } else if (val === 'del') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '=') {
      if (display === '0' || display === 'Error') return;
      try {
        setLastEquation(display);
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + display)();
        const calculatedStr = String(result ?? '0');
        setDisplay(calculatedStr);
        saveHistory(display, calculatedStr);
        if (isAudioFeedbackEnabled) {
          speakNumber(calculatedStr);
        }
      } catch {
        setDisplay('Error');
      }
    } else if (val === 'MC') {
      setMemory(0);
    } else if (val === 'MR') {
      setDisplay(String(memory));
    } else if (val === 'M+') {
      try {
        // eslint-disable-next-line no-new-func
        const currentVal = new Function('return ' + display)();
        setMemory(prev => prev + (Number(currentVal) || 0));
      } catch {}
    } else if (val === 'M-') {
      try {
        // eslint-disable-next-line no-new-func
        const currentVal = new Function('return ' + display)();
        setMemory(prev => prev - (Number(currentVal) || 0));
      } catch {}
    } else if (val === 'sqrt') {
      try {
        // eslint-disable-next-line no-new-func
        const currentVal = new Function('return ' + display)();
        const root = Math.sqrt(Number(currentVal) || 0);
        setDisplay(String(root));
        setLastEquation(`√(${display})`);
        saveHistory(`√(${display})`, String(root));
      } catch {
        setDisplay('Error');
      }
    } else {
      setDisplay(prev => {
        if (prev === 'Error') return val;
        if (prev === '0' && !['+', '-', '*', '/', '.', '(', ')', '%'].includes(val)) return val;
        return prev + val;
      });
    }
  };

  const speakNumber = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Convert text numbers to Bengali phrasing if system settings language is 'bn'
    let speakText = text;
    if (settings.systemLanguage === 'bn') {
      speakText = `হিসাবের উত্তর হচ্ছে ${text}`;
    } else {
      speakText = `Calculation result is ${text}`;
    }
    
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = settings.systemLanguage === 'bn' ? 'bn-BD' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard integration
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '0' && key <= '9') {
        handleAction(key);
      } else if (['+', '-', '*', '/'].includes(key)) {
        handleAction(key);
      } else if (key === '.') {
        handleAction('.');
      } else if (key === '(' || key === ')') {
        handleAction(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleAction('=');
      } else if (key === 'Backspace') {
        handleAction('del');
      } else if (key === 'Escape') {
        handleAction('C');
      } else if (key.toLowerCase() === 'c') {
        handleAction('C');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, memory]);

  const convertBanglaSpokenToMathExpression = (inp: string): string => {
    let text = inp.toLowerCase().trim();
    
    // Replace Bengali digits
    const bnToEnDigits: { [key: string]: string } = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    text = text.split('').map(char => bnToEnDigits[char] || char).join('');

    // Replace Bengali spoken numbers
    const verbalMapping: { [key: string]: string } = {
      'একশ': '100', 'একশো': '100', 'দুইশ': '200', 'দুইশো': '200', 'তিনশ': '300', 'তিনশো': '300',
      'চারশ': '400', 'চারশো': '400', 'পাচশ': '500', 'পাঁচশ': '500', 'পাঁচশো': '500', 'পাচশো': '500',
      'ছয়শ': '600', 'ছয়শো': '600', 'সাতশ': '700', 'সাতশো': '700', 'আটশ': '800', 'আটশো': '800',
      'নয়শ': '900', 'নয়শো': '900',
      'শূন্য': '0', 'এক': '1', 'দুই': '2', 'তিন': '3', 'চার': '4', 'পাঁচ': '5', 'পাচ': '5',
      'ছয়': '6', 'সাত': '7', 'আট': '8', 'নয়': '9', 'দশ': '10', 'এগারো': '11', 'বারো': '12',
      'তেরো': '13', 'চৌদ্দ': '14', 'পনেরো': '15', 'ষোলো': '16', 'সতেরো': '17', 'আঠারো': '18',
      'উনিশ': '19', 'কুড়ি': '20', 'বিশ': '20', 'ত্রিশ': '30', 'চল্লিশ': '40', 'পঞ্চাশ': '50',
      'ষাট': '60', 'সত্তর': '70', 'আশি': '80', 'নব্বই': '90', 'হাজার': '000', 'লাখ': '00000'
    };

    const operatorMap: { [key: string]: string } = {
      'প্লাস': '+', 'যোগ': '+', 'আরও': '+', 'সাথে': '+', 'এবং': '+',
      'মাইনাস': '-', 'বিয়োগ': '-', 'বাদ': '-',
      'ইনটু': '*', 'গুণ': '*', 'গুন': '*',
      'ভাগ': '/', 'ডিভাইড': '/', 'বাই': '/'
    };

    const words = text.split(/\s+/);
    const resultWords = words.map(word => {
      if (verbalMapping[word] !== undefined) return verbalMapping[word];
      if (operatorMap[word] !== undefined) return operatorMap[word];
      return word;
    });

    let expr = resultWords.join(' ');
    expr = expr.replace(/প্লাস/g, '+').replace(/যোগ/g, '+');
    expr = expr.replace(/মাইনাস/g, '-').replace(/বিয়োগ/g, '-');
    expr = expr.replace(/গুণ/g, '*').replace(/গুন/g, '*').replace(/ইনটু/g, '*');
    expr = expr.replace(/ভাগ/g, '/').replace(/ডিভাইড/g, '/');
    expr = expr.replace(/[^0-9+\-*/.()]/g, '');

    return expr;
  };

  const handleVoiceCommand = async (text: string) => {
    const cleanedText = text.trim();
    if (!cleanedText) return;

    // First try local rapid parser
    const localExpr = convertBanglaSpokenToMathExpression(cleanedText);
    if (localExpr && localExpr.length > 0 && /[0-9]/.test(localExpr)) {
      setDisplay(prev => {
        let current = (prev === '0' || prev === 'Error') ? '' : prev;
        const lastChar = current.slice(-1);
        const firstChar = localExpr[0];
        const isLastOp = ['+', '-', '*', '/'].includes(lastChar);
        const isFirstOp = ['+', '-', '*', '/'].includes(firstChar);
        
        if (isLastOp && isFirstOp) {
           return current.slice(0, -1) + localExpr;
        }
        const isLastDigit = /[0-9]/.test(lastChar);
        const isFirstDigit = /[0-9]/.test(firstChar);
        if (isLastDigit && isFirstDigit && current.length > 0) {
           return current + '+' + localExpr;
        }
        return current + localExpr;
      });
      return;
    }

    // AI Fallback
    try {
      setIsAiThinking(true);
      const expression = await parseMathVoiceCommandAI(cleanedText);
      if (!expression || expression === "ERROR") return;
      
      setDisplay(prev => {
          let current = (prev === '0' || prev === 'Error') ? '' : prev;
          const lastChar = current.slice(-1);
          const firstChar = expression[0];
          
          const isLastOp = ['+', '-', '*', '/'].includes(lastChar);
          const isFirstOp = ['+', '-', '*', '/'].includes(firstChar);
          
          if (isLastOp && isFirstOp) {
             return current.slice(0, -1) + expression;
          }
          const isLastDigit = /[0-9]/.test(lastChar);
          const isFirstDigit = /[0-9]/.test(firstChar);
          
          if (isLastDigit && isFirstDigit && current.length > 0) {
             return current + '+' + expression;
          }
          
          return current + expression;
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  const voiceLang = settings.systemLanguage === 'ar' ? 'ar-SA' : (settings.systemLanguage === 'bn' ? 'bn-BD' : 'en-US');

  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand, (err) => {
    console.error('Voice calculator error:', err);
  }, voiceLang);

  useEffect(() => {
    if (!isOpen && isListening) {
      toggleVoiceSearch();
    }
  }, [isOpen, isListening, toggleVoiceSearch]);

  const clearHistory = () => {
    setCalcHistory([]);
    localStorage.removeItem('shop_calc_history');
  };

  return (
    <>
      {/* Floating Trigger Button with high z-id */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 ${isRtl ? (isDesktop ? 'right-[312px]' : 'right-8') : (isDesktop ? 'left-[312px]' : 'left-8')} w-16 h-16 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-[100] group shadow-indigo-200/50`}
        title={settings.systemLanguage === 'bn' ? 'ক্যালকুলেটর' : 'Calculator'}
        id="calc-open-trigger"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
        </span>
        <CalculatorIcon className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Center Modal with Backdrop blur */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            {/* Main Dialog Panel (Beautiful, spacious, with history) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              {/* Left Column: Calculator Board */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto min-h-0">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                      <CalculatorIcon className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base tracking-tight">
                        {settings.systemLanguage === 'bn' ? 'স্মার্ট ক্যালকুলেটর' : 'Smart Calculator'}
                      </h3>
                      <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
                        {settings.systemLanguage === 'bn' ? 'ভয়েস কন্ট্রোল সক্রিয়' : 'Voice Enabled'} • {voiceLang}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAudioFeedbackEnabled(!isAudioFeedbackEnabled)}
                      className={`p-2.5 rounded-xl border transition-all ${isAudioFeedbackEnabled ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                      title={settings.systemLanguage === 'bn' ? 'ফলাফল শোনান' : 'Audio Feedback'}
                    >
                      {isAudioFeedbackEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={toggleVoiceSearch}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                      <span>{isListening ? 'STOP' : 'VOICE'}</span>
                    </button>
                    <button 
                      onClick={() => setIsOpen(false)} 
                      className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 active:scale-90 border border-transparent"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {voiceFeedback && (
                  <div className="mb-4 px-4 py-3 bg-indigo-50/90 text-xs font-bold text-indigo-600 rounded-2xl border border-indigo-100/50 flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <motion.span 
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 bg-indigo-600 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="truncate italic">"{voiceFeedback}"</span>
                  </div>
                )}

                {isAiThinking && (
                  <div className="mb-4 px-4 py-3 bg-purple-50 text-xs font-bold text-purple-600 rounded-2xl border border-purple-100/50 animate-pulse flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                    <span className="tracking-tight uppercase">AI is extracting numbers...</span>
                  </div>
                )}

                {/* Display Screen */}
                <div className="bg-slate-900 p-6 rounded-[2rem] mb-6 text-right shadow-inner flex flex-col justify-end overflow-hidden group min-h-[160px] relative border border-slate-800">
                  <div className="absolute top-4 left-4 flex gap-1.5">
                     <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                     <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                     <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  </div>
                  {lastEquation && (
                    <div className="text-xs text-indigo-300 font-mono font-bold mb-2 opacity-60 tracking-widest break-all">
                      {lastEquation} =
                    </div>
                  )}
                  <p className={`font-mono font-bold text-white break-all tracking-tight transition-all duration-200 ${
                    display.length > 200 ? 'text-xs' : 
                    display.length > 100 ? 'text-sm' : 
                    display.length > 50 ? 'text-lg' : 
                    display.length > 30 ? 'text-2xl' : 
                    display.length > 15 ? 'text-4xl' : 'text-6xl'
                  } ${display === 'Error' ? 'text-rose-400' : ''}`}>
                    {display}
                  </p>
                </div>

                {/* Calculator Keyboard */}
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
                  {[
                    { val: 'MC', color: 'bg-indigo-50/50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-black' },
                    { val: 'MR', color: 'bg-indigo-50/50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-black' },
                    { val: 'M+', color: 'bg-indigo-50/50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-black' },
                    { val: 'M-', color: 'bg-indigo-50/50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-black' },
                    
                    { val: 'C', color: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold' },
                    { val: 'del', icon: <Delete className="w-5 h-5" />, color: 'bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100' },
                    { val: '(', color: 'bg-slate-100/70 hover:bg-slate-200 text-slate-700 font-medium' },
                    { val: ')', color: 'bg-slate-100/70 hover:bg-slate-200 text-slate-700 font-medium' },
                    
                    { val: '7' }, { val: '8' }, { val: '9' }, { val: '/', color: 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg' },
                    
                    { val: '4' }, { val: '5' }, { val: '6' }, { val: '*', color: 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg' },
                    
                    { val: '1' }, { val: '2' }, { val: '3' }, { val: '-', color: 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg' },
                    
                    { val: 'sqrt', label: '√', color: 'bg-slate-100 hover:bg-slate-200 text-indigo-600 font-semibold' },
                    { val: '0' },
                    { val: '.' },
                    { val: '+', color: 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg' },
                    
                    { val: '=', color: 'col-span-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95 shadow-lg shadow-indigo-100 text-2xl font-black h-16' },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={() => handleAction(btn.val)}
                      className={`h-12 sm:h-14 rounded-2xl text-base sm:text-lg transition-all active:scale-95 flex items-center justify-center font-bold relative overflow-hidden shadow-sm ${
                        btn.color || 'bg-slate-50 border border-slate-100 text-slate-800 hover:bg-white hover:border-slate-200 hover:shadow-md'
                      } ${btn.val === '=' ? 'col-span-4' : ''}`}
                    >
                      {btn.icon || btn.label || btn.val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: History Sidebar Panel */}
              <div className="w-full lg:w-80 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-100 p-6 md:p-8 flex flex-col justify-between overflow-y-auto min-h-0">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-extrabold text-slate-800 text-sm tracking-tight text-indigo-950 uppercase">
                        {settings.systemLanguage === 'bn' ? 'হিসাবের ইতিহাস' : 'History'}
                      </h4>
                    </div>
                    {calcHistory.length > 0 && (
                      <button 
                        onClick={clearHistory}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100"
                      >
                        <Trash2 className="w-3 h-3" />
                        {settings.systemLanguage === 'bn' ? 'মুছুন' : 'Clear'}
                      </button>
                    )}
                  </div>

                  {calcHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center gap-3 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                      <History className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-xs font-medium max-w-[180px]">
                        {settings.systemLanguage === 'bn' ? 'কোনো পূর্ববর্তী হিসাব রেকর্ড পাওয়া যায়নি' : 'No calculations yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-1">
                      {calcHistory.map((h, i) => (
                        <div 
                          key={i} 
                          className="bg-white p-3.5 rounded-xl border border-slate-150 flex flex-col gap-1 shadow-sm hover:border-indigo-100 group transition-all"
                        >
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>{h.timestamp}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setDisplay(h.equation);
                                  setLastEquation(null);
                                }}
                                className="text-indigo-600 hover:underline"
                                title="Use Equation"
                              >
                                {settings.systemLanguage === 'bn' ? 'ব্যবহার' : 'Use Eq'}
                              </button>
                              <button 
                                onClick={() => {
                                  setDisplay(prev => prev === '0' ? h.result : prev + h.result);
                                }}
                                className="text-indigo-600 hover:underline"
                                title="Append Result"
                              >
                                {settings.systemLanguage === 'bn' ? '+ ফলাফল' : '+ Result'}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-mono font-medium text-slate-500 break-all">{h.equation} =</p>
                          <p 
                            className="text-sm font-mono font-black text-slate-800 break-all cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-1"
                            onClick={() => {
                              try {
                                navigator.clipboard.writeText(h.result);
                                alert(settings.systemLanguage === 'bn' ? 'ফলাফল কপি করা হয়েছে!' : 'Result copied!');
                              } catch(e) {
                                setDisplay(h.result);
                              }
                            }}
                            title="Copy result"
                          >
                            {h.result}
                            <Copy className="w-3 h-3 text-slate-300 hover:text-indigo-600 inline opacity-0 group-hover:opacity-100 transition-all ml-1" />
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/50 text-[11px] text-slate-400 text-center font-medium bg-white/40 p-2.5 rounded-xl">
                  {settings.systemLanguage === 'bn'
                    ? 'কীবোর্ড সাপোর্ট সক্রিয়: টাইপ করতে পারেন।'
                    : 'Full Keyboard inputs active for raw typing speed.'}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NoteGlobal({ notes, onAdd, onDelete, settings, isRtl, isSidebarOpen, isDesktop }: { 
  notes: Note[], 
  onAdd: (text: string, color: string, extra?: { priority?: string, dueDate?: string }) => void,
  onDelete: (id: string) => void,
  settings: ShopSettings,
  isRtl: boolean,
  isSidebarOpen: boolean,
  isDesktop?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-yellow-200');
  const [selectedPriority, setSelectedPriority] = useState<'low'|'medium'|'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const colors = ['bg-yellow-200', 'bg-blue-200', 'bg-green-200', 'bg-red-200', 'bg-purple-200', 'bg-orange-200'];

  const handleVoiceCommand = (text: string) => {
    setNewNote(prev => prev + (prev ? ' ' : '') + text);
  };

  const voiceLang = settings.systemLanguage === 'ar' ? 'ar-SA' : 'bn-BD';
  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand, (err) => {
    console.error('Voice note error:', err);
  }, voiceLang);

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-44 ${isRtl ? (isDesktop ? 'right-[312px]' : 'right-8') : (isDesktop ? 'left-[312px]' : 'left-8')} w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 z-50 overflow-hidden`}
        title="Quick Notes"
      >
        <StickyNote className="w-6 h-6" />
        {notes.length > 0 && (
          <span className="absolute top-2 right-2 bg-white text-emerald-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
            {notes.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, x: isRtl ? 20 : -20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: isRtl ? 20 : -20 }}
            className={`fixed bottom-60 ${isRtl ? (isDesktop ? 'right-[312px]' : 'right-8') : (isDesktop ? 'left-[312px]' : 'left-8')} w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden max-h-[500px] transition-all duration-500`}
          >
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                <h3 className="font-bold">Quick Notes</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
               {/* Add Note */}
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  <div className="relative">
                    <textarea 
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Write a note..."
                      className="w-full text-sm outline-none resize-none min-h-[80px] bg-transparent placeholder-gray-400 pr-8"
                    />
                    <button 
                      onClick={toggleVoiceSearch}
                      className={`absolute right-0 top-0 p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-emerald-600'}`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {voiceFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute -bottom-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded-full shadow-lg"
                        >
                          "{voiceFeedback}"
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex gap-2">
                    <select 
                      value={selectedPriority}
                      onChange={e => setSelectedPriority(e.target.value as any)}
                      className="flex-1 bg-gray-50/50 p-1.5 min-w-0 text-[10px] font-bold rounded border border-gray-100 outline-none text-gray-600"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="flex-1 bg-gray-50/50 p-1.5 min-w-0 text-[10px] font-bold rounded border border-gray-100 outline-none text-gray-600"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <div className="flex gap-1.5">
                      {colors.map(c => (
                        <button 
                          key={c} 
                          onClick={() => setSelectedColor(c)} 
                          className={`w-4 h-4 rounded-full ${c} ${selectedColor === c ? 'ring-2 ring-offset-1 ring-gray-300' : ''} transition-all border border-black/5`} 
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        if (newNote.trim()) {
                          onAdd(newNote, selectedColor, { priority: selectedPriority, dueDate: dueDate || undefined });
                          setNewNote('');
                          setDueDate('');
                          setSelectedPriority('medium');
                        }
                      }}
                      disabled={!newNote.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg disabled:bg-gray-200 text-xs font-bold transition-all hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
               </div>

               {/* Notes List */}
               <div className="space-y-3 pb-2">
                  {notes.length === 0 ? (
                    <div className="text-center py-8">
                       <StickyNote className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                       <p className="text-xs text-gray-400">Your notes will appear here</p>
                    </div>
                  ) : (
                    notes.map(note => (
                      <motion.div 
                        layout 
                        key={note.id} 
                        className={`${note.color} p-4 rounded-2xl shadow-sm border border-black/5 flex flex-col gap-2 group relative`}
                      >
                         <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                         <div className="flex justify-between items-center pt-2 mt-auto border-t border-black/5">
                            <span className="text-[10px] text-black/40 font-bold">{format(safeDate(note.timestamp), 'dd MMM, hh:mm a')}</span>
                            <div className="flex items-center gap-2">
                               {(note.priority || note.dueDate) && (
                                 <div className="flex items-center gap-1">
                                   {note.priority && (
                                     <span className="text-[8px] uppercase tracking-wider font-bold bg-white/50 px-1.5 py-0.5 rounded text-black/60">
                                       {note.priority}
                                     </span>
                                   )}
                                   {note.dueDate && (
                                     <span className="text-[8px] uppercase tracking-wider font-bold bg-white/50 px-1.5 py-0.5 rounded text-black/60 flex items-center gap-0.5">
                                       <Clock className="w-2 h-2" />
                                       {format(new Date(note.dueDate), 'MMM dd')}
                                     </span>
                                   )}
                                 </div>
                               )}
                               <button 
                                 onClick={() => onDelete(note.id)}
                                 className="p-1.5 text-black/30 hover:text-red-600 hover:bg-white/50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                 title="Delete Note"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                      </motion.div>
                    ))
                  )}
               </div>
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
    (e?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e?.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e?.phone || '').includes(searchTerm)
  );

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    payroll: employees.reduce((sum, e) => sum + e.salary, 0)
  };

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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
    >
      <motion.header 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-blue-100 flex items-center justify-center ring-1 ring-blue-500/5">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Staff Logistics</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Operations & Payroll Control</p>
            </div>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-black/10 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Onboard Employee
        </motion.button>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-blue-100/30 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 ring-1 ring-black/[0.02]">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Find staff by name, role, or contact..."
                  className="w-full pl-16 pr-6 py-5 bg-gray-50/50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder:text-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="bg-white rounded-[2.5rem] shadow-[0_10px_60px_-15px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden ring-1 ring-black/[0.02]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center w-28">Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Staff Profile</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Compensation & Shift</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredEmployees.map((emp, idx) => (
                      <motion.tr 
                        key={emp.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                        whileHover={{ backgroundColor: "rgba(37, 99, 235, 0.01)" }}
                        className="group"
                      >
                        <td className="px-8 py-7">
                          <div className="flex flex-col items-center">
                            <motion.div 
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border-2 border-white shadow-md transition-all group-hover:shadow-blue-100 group-hover:border-blue-100"
                            >
                               <span className="text-xl font-black text-gray-400 group-hover:text-blue-600 transition-colors uppercase tabular-nums">
                                 {emp.name.charAt(0)}
                               </span>
                            </motion.div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-lg font-black text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">{emp.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">{emp.designation}</span>
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-500 tabular-nums">{emp.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col gap-1">
                            <span className="text-[16px] font-black text-gray-900 font-mono tracking-tighter tabular-nums">{fC(emp.salary)}</span>
                            <div className="flex items-center gap-2">
                               <Clock className="w-3 h-3 text-gray-400" />
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{emp.schedule || 'Not assigned'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-center">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                             emp.status === 'active' 
                               ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                               : 'bg-gray-50 text-gray-400 border-gray-100'
                           }`}>
                             {emp.status}
                           </span>
                        </td>
                        <td className="px-8 py-7 text-right relative">
                          <div className="flex items-center justify-end gap-2 relative z-10">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => { setEditingEmployee(emp); setIsModalOpen(true); }}
                              className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Edit profile"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirmDeleteId === emp.id) {
                                  onDelete(emp.id);
                                  setConfirmDeleteId(null);
                                } else {
                                  setConfirmDeleteId(emp.id);
                                }
                              }}
                              className={`p-3 rounded-xl transition-all relative z-10 ${
                                confirmDeleteId === emp.id 
                                  ? "bg-rose-600 text-white shadow-lg" 
                                  : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white shadow-sm"
                              }`}
                              title={confirmDeleteId === emp.id ? "Confirm?" : "Terminate"}
                            >
                              {confirmDeleteId === emp.id ? (
                                <Trash2 className="w-4 h-4 animate-bounce" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>
                          {/* Active Indicator Bar */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-l-full transition-all scale-y-0 group-hover:scale-y-100 opacity-60"></div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}


function NoteView({ notes, onAdd, onDelete, onUpdate, settings }: { 
  notes: Note[], 
  onAdd: (text: string, color: string, extra?: { priority?: string, dueDate?: string }) => void,
  onDelete: (id: string) => void,
  onUpdate: (id: string, text: string, extra?: { priority?: string, dueDate?: string }) => void,
  settings: ShopSettings
}) {
  const [newNote, setNewNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedPriority, setSelectedPriority] = useState<'low'|'medium'|'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<string>('medium');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const themes = {
    blue: {
      bg: 'bg-blue-50',
      accent: 'indigo-500',
      text: 'indigo-900',
      border: 'border-blue-100',
      icon: 'text-blue-500',
      gradient: 'from-blue-50 to-indigo-50'
    },
    emerald: {
      bg: 'bg-emerald-50',
      accent: 'emerald-600',
      text: 'emerald-900',
      border: 'border-emerald-100',
      icon: 'text-emerald-500',
      gradient: 'from-emerald-50 to-teal-50'
    },
    amber: {
      bg: 'bg-amber-50',
      accent: 'amber-600',
      text: 'amber-900',
      border: 'border-amber-100',
      icon: 'text-amber-500',
      gradient: 'from-amber-50 to-orange-50'
    },
    rose: {
      bg: 'bg-rose-50',
      accent: 'rose-600',
      text: 'rose-900',
      border: 'border-rose-100',
      icon: 'text-rose-500',
      gradient: 'from-rose-50 to-pink-50'
    },
    purple: {
      bg: 'bg-purple-50',
      accent: 'purple-600',
      text: 'purple-900',
      border: 'border-purple-100',
      icon: 'text-purple-500',
      gradient: 'from-purple-50 to-fuchsia-50'
    }
  };

  const handleVoiceCommand = (text: string) => {
    setNewNote(prev => prev + (prev ? ' ' : '') + text);
  };

  const voiceLang = settings.systemLanguage === 'ar' ? 'ar-SA' : 'bn-BD';
  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand, (err) => {
    console.error('Voice note error:', err);
  }, voiceLang);

  const addNote = () => {
    if (newNote.trim()) {
      onAdd(newNote, selectedColor, { priority: selectedPriority, dueDate: dueDate || undefined });
      setNewNote('');
      setDueDate('');
      setSelectedPriority('medium');
    }
  };

  const startEditing = (id: string, text: string, priority?: string, due?: string) => {
    setEditingId(id);
    setEditText(text);
    setEditPriority(priority || 'medium');
    setEditDueDate(due || '');
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editingId, editText, { priority: editPriority, dueDate: editDueDate || undefined });
      setEditingId(null);
    }
  };

  const filteredNotes = notes.filter(n => n.text.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
    >
      <motion.header 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-center ring-1 ring-black/[0.02]">
            <StickyNote className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Intelligence Ledger</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Knowledge Base & Notes</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search in ledger..."
              className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Note Composer Side */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden ring-1 ring-black/[0.02]"
          >
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">New Thought</h3>
               <div onClick={toggleVoiceSearch} className={`p-2 rounded-xl cursor-pointer transition-all ${isListening ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400 hover:text-indigo-600'}`}>
                 <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
               </div>
            </div>

            <div className="relative">
              <textarea 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)} 
                placeholder="Synchronize your ideas here..." 
                className="w-full text-base font-bold outline-none resize-none min-h-[160px] bg-transparent placeholder:text-gray-300 leading-relaxed"
              />
              <AnimatePresence>
                {voiceFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-2 left-0 right-0 p-3 bg-indigo-600 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest leading-tight z-10 shadow-xl"
                  >
                    "{voiceFeedback}"
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">Priority</label>
                <select 
                  value={selectedPriority} 
                  onChange={(e) => setSelectedPriority(e.target.value as 'low'|'medium'|'high')}
                  className="w-full bg-gray-50/50 p-2 text-xs font-bold rounded-xl border border-gray-100 outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 pl-1">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-gray-50/50 p-2 text-xs font-bold rounded-xl border border-gray-100 outline-none text-gray-600"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50">
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {Object.keys(themes).map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedColor(key)}
                    className={`w-7 h-7 rounded-xl transition-all ${selectedColor === key ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'} ${(themes as any)[key].bg.replace('50', '200')} border border-black/5`}
                  />
                ))}
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addNote} 
                disabled={!newNote.trim()}
                className="w-full py-4 bg-gray-900 hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Commit to Ledger
              </motion.button>
            </div>
          </motion.div>
          
          <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[60px]"></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">Statistics</p>
             <p className="text-3xl font-black font-mono tracking-tighter mb-4">{notes.length}</p>
             <p className="text-[10px] font-bold opacity-70 leading-loose uppercase tracking-widest">Total encrypted nodes stored in the digital ledger infrastructure.</p>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="lg:col-span-2">
          <motion.div 
            variants={{
              visible: { 
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((n, idx) => {
                const themeKey = (Object.keys(themes).includes(n.color) ? n.color : 'blue') as keyof typeof themes;
                const theme = themes[themeKey];
                return (
                  <motion.div 
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    whileHover={{ y: -8 }}
                    key={n.id} 
                    className={`relative p-8 rounded-[2.5rem] shadow-sm border ${theme.border} group transition-all hover:shadow-xl hover:shadow-black/5 ring-1 ring-black/[0.01] flex flex-col justify-between min-h-[280px] bg-white`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.bg.replace('50', '200')} to-transparent rounded-t-[2.5rem]`}></div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-10 h-10 ${theme.bg} ${theme.icon} rounded-xl flex items-center justify-center shadow-inner`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Generated On</span>
                          <span className="text-[10px] font-bold text-gray-500 tabular-nums">
                            {format(safeDate(n.timestamp), 'dd MMM yyyy')} • {format(safeDate(n.timestamp), 'hh:mm a')}
                          </span>
                          {(n.priority || n.dueDate) && (
                            <div className="flex gap-2 mt-2">
                              {n.priority && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                  n.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                                  n.priority === 'low' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                  'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {n.priority}
                                </span>
                              )}
                              {n.dueDate && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> Due {format(new Date(n.dueDate), 'MMM dd')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {editingId === n.id ? (
                        <div className="space-y-4">
                          <textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full min-h-[120px] bg-gray-50/50 rounded-2xl p-4 outline-none resize-none text-[15px] font-bold text-gray-800 leading-relaxed border border-gray-100"
                            autoFocus
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <select 
                              value={editPriority} 
                              onChange={(e) => setEditPriority(e.target.value as 'low'|'medium'|'high')}
                              className="w-full bg-gray-50/50 p-2 text-xs font-bold rounded-xl border border-gray-100 outline-none"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                            </select>
                            <input 
                              type="date" 
                              value={editDueDate} 
                              onChange={e => setEditDueDate(e.target.value)}
                              className="w-full bg-gray-50/50 p-2 text-xs font-bold rounded-xl border border-gray-100 outline-none text-gray-600"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[15px] font-bold text-gray-800 whitespace-pre-wrap leading-relaxed tracking-tight">
                          {n.text}
                        </p>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${theme.bg.replace('50', '500')}`}></div>
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{themeKey} Segment</span>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        {editingId === n.id ? (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={saveEdit} 
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            <Check className="w-4 h-4" />
                          </motion.button>
                        ) : (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startEditing(n.id, n.text, n.priority, n.dueDate)} 
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                        )}
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDelete(n.id)} 
                          className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Active Indicator Bar */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-indigo-500 rounded-r-full transition-all scale-y-0 group-hover:scale-y-100 opacity-60`}></div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredNotes.length === 0 && (
              <div className="col-span-full py-24 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-8">
                  <StickyNote className="w-8 h-8 text-gray-200" />
                </div>
                <h4 className="text-xl font-black text-gray-900 uppercase">Ledger is Empty</h4>
                <p className="text-gray-400 text-xs font-bold mt-3 uppercase tracking-widest max-w-[280px] leading-loose">No synchronized data nodes detected in this sector. Try updating your parameters.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
        <Sparkles className="w-10 h-10 text-indigo-300" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">This feature is coming soon! Our team is working hard to bring you the best experience.</p>
    </motion.div>
  );
}

function PaymentMethodView() {
  const [activeTab, setActiveTab] = useState('list');
  const theme = PAGE_THEMES.payment;

  const methods = [
    { id: 'cash', label: 'Fiat Cash', type: 'Physical', status: 'Operational', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'card', label: 'Credit/Debit', type: 'POS Terminal', status: 'Operational', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'bkash_personal', label: 'bKash Personal', type: 'MFS Node', status: 'Operational', icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'bkash_agent', label: 'bKash Agent', type: 'MFS Entry', status: 'Operational', icon: Smartphone, color: 'text-pink-700', bg: 'bg-pink-50/50' },
    { id: 'nogod', label: 'Nagad Wallet', type: 'MFS Node', status: 'Operational', icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'paypal', label: 'Paypal Global', type: 'External API', status: 'Live', icon: Globe, color: 'text-sky-700', bg: 'bg-sky-50' },
    { id: 'bank_transfer', label: 'Swift Bank', type: 'Settlement', status: 'Operational', icon: Landmark, color: 'text-slate-700', bg: 'bg-slate-50' },
    { id: 'binance', label: 'Crypto Node', type: 'Web3 Gateway', status: 'Live', icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-20"
    >
      <motion.header 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-${theme.primary.split('-')[0]}-100 flex items-center justify-center ring-1 ring-${theme.primary.split('-')[0]}-500/5 transition-transform hover:rotate-6`}>
            <CreditCard className={`w-8 h-8 text-${theme.primary}`} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Fintech Gateway</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 bg-${theme.primary.split('-')[0]}-500 rounded-full animate-pulse`}></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Payment rails & settlement protocols</p>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-50/80 p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm shrink-0 ring-1 ring-black/[0.02]">
          {[
            { id: 'list', label: 'Nodes', icon: List },
            { id: 'add', label: 'Integrate', icon: Plus }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                activeTab === tab.id 
                ? `bg-white text-${theme.primary} shadow-xl ${theme.shadow} ring-1 ring-${theme.primary.split('-')[0]}-100 scale-105` 
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? `text-${theme.primary}` : 'text-gray-300'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <motion.div variants={itemVariants} className={`bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden ring-1 ring-black/[0.02]`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Gateway Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Mechanism</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {methods.map((method, idx) => (
                      <motion.tr 
                        key={method.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="group"
                      >
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${method.bg} flex items-center justify-center ${method.color} font-black shadow-inner border border-black/[0.03] transition-transform group-hover:scale-110`}>
                              <method.icon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-lg font-black text-gray-900 tracking-tight group-hover:text-${theme.primary.split('-')[0]}-700 transition-colors uppercase`}>{method.label}</span>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{method.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <span className={`px-4 py-1.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 group-hover:bg-white group-hover:border-${theme.primary.split('-')[0]}-100 transition-all`}>
                            {method.type}
                          </span>
                        </td>
                        <td className="px-8 py-7 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${method.status === 'Operational' || method.status === 'Live' ? `bg-${theme.primary.split('-')[0]}-500 animate-pulse` : 'bg-gray-300'}`}></div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${method.status === 'Operational' || method.status === 'Live' ? `text-${theme.primary}` : 'text-gray-400'}`}>
                               {method.status}
                             </span>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-right relative">
                          <div className="flex items-center justify-end gap-2 relative z-10">
                             <motion.button 
                               whileHover={{ scale: 1.1 }}
                               whileTap={{ scale: 0.9 }}
                               className={`p-3 bg-${theme.primary.split('-')[0]}-50 text-${theme.primary} rounded-xl hover:bg-${theme.primary} hover:text-white transition-all shadow-sm`}
                             >
                               <ChevronRight className="w-4 h-4" />
                             </motion.button>
                          </div>
                          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-${theme.primary} rounded-l-full transition-all scale-y-0 group-hover:scale-y-100 opacity-60 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}></div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
           <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center relative overflow-hidden group"
          >
             <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient}`}></div>
             <div className={`w-24 h-24 bg-${theme.bg.split(' ')[0]} text-${theme.primary} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-700`}>
                <ShieldCheck className="w-12 h-12" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Security Vault</h3>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 leading-relaxed">Encrypted transaction protocols & fraud detection nodes.</p>

             <div className="mt-10 space-y-4 text-left">
                <div className={`p-8 bg-gradient-to-br from-${theme.primary.split('-')[0]}-900 to-${theme.primary.split('-')[0]}-800 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl`}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px]"></div>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Uptime Protocol</p>
                   <div className="flex items-end justify-between mb-4">
                      <p className="text-3xl font-black text-white font-mono tracking-tighter leading-none">99.9%</p>
                      <span className={`text-[10px] font-black text-${theme.primary.split('-')[0]}-400 uppercase`}>Verifed</span>
                   </div>
                   <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div className={`w-[99%] h-full bg-${theme.primary.split('-')[0]}-400 shadow-[0_0_10px_rgba(0,0,0,0.8)]`}></div>
                   </div>
                </div>

                <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl flex items-center gap-4 group/card hover:bg-white transition-all shadow-sm">
                   <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-${theme.primary} shadow-sm group-hover/card:scale-110 transition-transform`}>
                      <Lock className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">PCI Level</p>
                      <p className="text-base font-black text-gray-900 uppercase">Tier 1 Secure</p>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function CourierView() {
  const [activeTab, setActiveTab] = useState('active');
  const theme = PAGE_THEMES.courier;

  const couriers = [
    { id: 'pathao', name: 'Pathao Courier', type: 'Instant Delivery', coverage: '64 Districts', status: 'Active', logo: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'redx', name: 'REDX Logistics', type: 'Bulk Distribution', coverage: 'Nationwide', status: 'Active', logo: Box, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'steadfast', name: 'Steadfast Courier', type: 'Next Day', coverage: '490+ Upazilas', status: 'Active', logo: Navigation, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'paperfly', name: 'Paperfly', type: 'Full Coverage', coverage: 'Doorstep Delivery', status: 'Active', logo: MapPin, color: 'text-blue-700', bg: 'bg-indigo-50' },
    { id: 'ecourier', name: 'eCourier', type: 'Smart Logistics', coverage: 'Across Bangladesh', status: 'Operational', logo: Globe, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { id: 'sundarban', name: 'Sundarban Digital', type: 'Heritage Network', coverage: 'Global Nodes', status: 'Offline', logo: Landmark, color: 'text-amber-800', bg: 'bg-amber-50' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-20"
    >
      <motion.header 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-${theme.primary.split('-')[0]}-100 flex items-center justify-center ring-1 ring-${theme.primary.split('-')[0]}-500/5 transition-transform hover:rotate-6`}>
            <Truck className={`w-8 h-8 text-${theme.primary}`} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Logistics Network</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 bg-${theme.primary.split('-')[0]}-500 rounded-full animate-pulse`}></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supply chain orchestration & multi-carrier routing</p>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-50/80 p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm shrink-0 ring-1 ring-black/[0.02]">
          {[
            { id: 'active', label: 'Network nodes', icon: List },
            { id: 'integrate', label: 'API Connect', icon: Plus }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                activeTab === tab.id 
                ? `bg-white text-${theme.primary} shadow-xl ${theme.shadow} ring-1 ring-${theme.primary.split('-')[0]}-100 scale-105` 
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? `text-${theme.primary}` : 'text-gray-300'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {couriers.map((courier) => (
                <motion.div
                  key={courier.id}
                  layout
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`bg-white p-8 rounded-[2.5rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 group relative overflow-hidden`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-16 h-16 rounded-[1.5rem] ${courier.bg} flex items-center justify-center ${courier.color} shadow-inner transition-transform group-hover:rotate-6`}>
                      <courier.logo className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        courier.status === 'Active' || courier.status === 'Operational' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {courier.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-xl font-black text-gray-900 tracking-tight transition-colors group-hover:text-${theme.primary.split('-')[0]}-600 uppercase`}>{courier.name}</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{courier.type}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="relative group/input">
                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 transition-colors group-focus-within/input:text-${theme.primary.split('-')[0]}-500`} />
                            <input 
                                type="password" 
                                placeholder={`Enter ${courier.name} Token`}
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-${theme.primary.split('-')[0]}-500 transition-all`}
                            />
                        </div>
                        <button className={`w-full bg-${theme.primary.split('-')[0]}-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg ${theme.shadow}`}>
                          Authorize Node
                        </button>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                       <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-600 uppercase tabular-nums">{courier.coverage}</span>
                       </div>
                       <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                       <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-600 uppercase">98% Success</span>
                       </div>
                    </div>
                  </div>

                  {/* Active Indicator Bar */}
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-${theme.primary} rounded-l-full transition-all scale-y-0 group-hover:scale-y-100 opacity-60`}></div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-8">
           <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center relative overflow-hidden group"
          >
             <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient}`}></div>
             <div className={`w-24 h-24 bg-${theme.bg.split(' ')[0]} text-${theme.primary} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-700`}>
                <Globe className="w-12 h-12" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Delivery Ops</h3>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 leading-relaxed">Global nexus for fulfillment monitoring and dispatch control.</p>

             <div className="mt-10 space-y-4 text-left">
                <div className={`p-8 bg-gradient-to-br from-${theme.primary.split('-')[0]}-900 to-${theme.primary.split('-')[0]}-800 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl`}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px]"></div>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Network Reach</p>
                   <div className="flex items-end justify-between mb-4">
                      <p className="text-3xl font-black text-white font-mono tracking-tighter leading-none">Global</p>
                      <span className={`text-[10px] font-black text-${theme.primary.split('-')[0]}-400 uppercase`}>Tier 1</span>
                   </div>
                   <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div className={`w-[88%] h-full bg-${theme.primary.split('-')[0]}-400 shadow-[0_0_10px_rgba(0,0,0,0.8)]`}></div>
                   </div>
                </div>

                <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl flex items-center gap-4 group/card hover:bg-white transition-all shadow-sm">
                   <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-${theme.primary} shadow-sm group-hover/card:scale-110 transition-transform`}>
                      <Target className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Efficiency</p>
                      <p className="text-base font-black text-gray-900 uppercase">High Sigma</p>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function BarcodePage({ products, settings, user, setNotification }: { products: Product[], settings: ShopSettings, user?: any, setNotification: any }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeView, setActiveView] = useState<'generate' | 'history' | 'qr'>('generate');
  const [warning, setWarning] = useState<string | null>(null);
  const [generatedValue, setGeneratedValue] = useState<string>('');
  const [qrInput, setQrInput] = useState<string>('');
  
  // New States for Merchant QR
  const [qrMode, setQrMode] = useState<'merchant' | 'custom'>('merchant');
  const [domainUrl, setDomainUrl] = useState('https://pos.sellerscampus.com');
  const [pathPrefix, setPathPrefix] = useState('merchant');
  
  const shopCode = settings.shopCode || user?.shopId || 'unknown';
  const theme = PAGE_THEMES.barcode;

  const systemLang = settings.systemLanguage || 'bn';
  const st = (key: keyof typeof SYSTEM_TRANSLATIONS['en']) => (SYSTEM_TRANSLATIONS[systemLang] as any)[key] || (SYSTEM_TRANSLATIONS['en'] as any)[key];

  const navigateTo = (view: 'generate' | 'history' | 'qr') => {
    setActiveView(view);
    setWarning(null);
  };

  const handleGenerateAndSave = async () => {
    setWarning(null);
    if (!selectedProduct) return;

    if (selectedProduct.barcode) {
      setWarning("This product already has a barcode.");
      return;
    }

    const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const randomValue = [...digits, checkDigit].join('');
    
    try {
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        barcode: randomValue
      });
      setGeneratedValue(randomValue);
      setWarning(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'products');
    }
  };

  const handlePrint = (value: string, type: 'barcode' | 'qr', quantity: number = 1) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    
    let contents = '';
    if (type === 'barcode') {
       for(let i=0; i<quantity; i++) {
         contents += `<div class="content-wrapper"><svg id="barcode-${i}"></svg></div>`;
       }
    } else {
       for(let i=0; i<quantity; i++) {
         contents += `<div class="content-wrapper"><canvas id="qr-${i}"></canvas></div>`;
       }
    }

    printWindow.document.write(`
      <html lang="en">
        <head>
          <title>Print Label</title>
          <style>
            @media print {
              @page { size: 50mm 25mm; margin: 0; }
              body { margin: 0; padding: 0; width: 50mm; height: 25mm; }
              .content-wrapper { page-break-after: always; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
            .content-wrapper { width: 50mm; height: 25mm; display: flex; align-items: center; justify-content: center; overflow: hidden; page-break-after: always; }
            svg, canvas { max-width: 48mm; max-height: 23mm; object-fit: contain; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
          <script>
            function checkDepsAndRun() {
                if (typeof JsBarcode !== 'undefined' && typeof QRCode !== 'undefined') {
                    runGeneration();
                } else {
                    setTimeout(checkDepsAndRun, 50);
                }
            }

            function runGeneration() {
                try {
                ${type === 'barcode' ? 
                  `for(let i=0; i<${quantity}; i++) { 
                    try {
                      let val = "${value}".replace(/\\D/g, '');
                      if (val.length === 0) val = "123456789012";
                      
                      if (val.length > 12) {
                          val = val.substring(0, 12);
                      } else if (val.length < 12) {
                          val = val.padStart(12, '0');
                      }
                      
                      try {
                        JsBarcode("#barcode-"+i, val, { 
                          format: "EAN13", 
                          displayValue: true, 
                          fontSize: 14,
                          width: 1.8,
                          height: 48,
                          margin: 0,
                          textMargin: 2
                        }); 
                      } catch(subErr) {
                         console.error(subErr);
                      }
                    } catch(e) { console.error('Barcode error', e); }
                  }` : 
                  `for(let i=0; i<${quantity}; i++) { 
                      try {
                          QRCode.toCanvas(document.getElementById('qr-'+i), "${value}", { width: 90, height: 90, margin: 1 }); 
                      } catch(e) { console.error('QR error', e); }
                  }`
                }
                
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }, 1000);
              } catch (e) {
                console.error('Generation error', e);
              }
            }
          </script>
        </head>
        <body onload="checkDepsAndRun()">
          ${contents}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintMerchantQR = () => {
    const finalUrl = `${domainUrl}/${pathPrefix}/${shopCode}`;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html lang="bn">
        <head>
          <title>${settings.name || 'Shop'} - QR Standee</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Hind+Siliguri:wght@400;700&display=swap');
            @media print {
              @page { size: A5 portrait; margin: 0; }
              body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
            body { 
              font-family: 'Inter', 'Hind Siliguri', sans-serif; 
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f8fafc;
              padding: 24px;
              box-sizing: border-box;
            }
            .standee-card {
              width: 140mm;
              height: 200mm;
              background: linear-gradient(135deg, #6366f1 0%, #312e81 100%);
              border-radius: 32px;
              color: white;
              padding: 32px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              text-align: center;
              position: relative;
              overflow: hidden;
              border: 1px solid rgba(255,255,255,0.1);
            }
            .standee-card::before {
              content: '';
              position: absolute;
              top: -100px;
              left: -100px;
              width: 300px;
              height: 300px;
              background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%);
              border-radius: 50%;
            }
            .shop-logo {
              width: 64px;
              height: 64px;
              background: white;
              color: #4f46e5;
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 28px;
              margin-bottom: 8px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .shop-name {
              font-size: 26px;
              font-weight: 900;
              margin: 4px 0;
              letter-spacing: -0.025em;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .instructions {
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 16px;
              padding: 12px 24px;
              font-size: 14px;
              font-weight: 905;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: #ffffff;
              margin: 12px 0;
              width: 90%;
              box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
            }
            .qr-container {
              background: white;
              border-radius: 28px;
              padding: 24px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
              display: flex;
              flex-direction: column;
              align-items: center;
              margin: 16px 0;
              border: 1px solid rgba(0,0,0,0.05);
            }
            .qr-container canvas {
              width: 190px;
              height: 190px;
            }
            .shop-code-badge {
              margin-top: 16px;
              background: #1e1b4b;
              color: #ffffff;
              font-weight: 900;
              font-family: monospace;
              padding: 8px 20px;
              border-radius: 99px;
              font-size: 16px;
              letter-spacing: 0.1em;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .scan-text {
              font-size: 16px;
              font-weight: 700;
              color: #e0e7ff;
              margin-top: 4px;
            }
            .link-text {
              font-size: 11px;
              font-family: monospace;
              color: #c7d2fe;
              background: rgba(0, 0, 0, 0.2);
              padding: 6px 12px;
              border-radius: 8px;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              border: 1px solid rgba(255,255,255,0.05);
            }
            .footer {
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              color: #818cf8;
              margin-top: 16px;
            }
            .no-print-btn {
              background: #4f46e5;
              color: white;
              border: none;
              padding: 14px 28px;
              font-size: 14px;
              font-weight: 900;
              border-radius: 16px;
              cursor: pointer;
              margin-bottom: 20px;
              transition: all 0.2s;
              box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
            }
            .no-print-btn:hover {
              background: #4338ca;
              transform: translateY(-1px);
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        </head>
        <body>
          <button class="no-print-btn no-print" onclick="window.print()">Print Standee / পোস্টার প্রিন্ট</button>
          
          <div class="standee-card">
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
              <div class="shop-logo">
                ${settings.name ? settings.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div class="shop-name">${settings.name || 'SellersCampus Shop'}</div>
              <div class="instructions">
                ${systemLang === 'bn' ? 'দোকান সিলেক্ট করতে স্ক্যান করুন' : 'SCAN TO SELECT SHOP'}
              </div>
            </div>

            <div class="qr-container">
              <canvas id="standee-qr"></canvas>
              <div class="shop-code-badge">CODE: ${shopCode}</div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
              <p class="scan-text">
                ${systemLang === 'bn' ? 'স্ক্যান করুন এবং সরাসরি অর্ডার দিন' : 'Scan & Place Your Orders Directly'}
              </p>
              <p class="link-text">${finalUrl}</p>
              <div class="footer">SellersCampus POS Network</div>
            </div>
          </div>

          <script>
            setTimeout(() => {
              if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(document.getElementById('standee-qr'), "${finalUrl}", { 
                  width: 190, 
                  height: 190, 
                  margin: 1,
                  color: {
                    dark: "#000000",
                    light: "#ffffff"
                  }
                }, function(error) {
                  if (error) console.error(error);
                  else {
                    setTimeout(() => {
                      window.print();
                    }, 500);
                  }
                });
              }
            }, 100);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    setGeneratedValue(selectedProduct?.barcode || '');
    setWarning(null);
  }, [selectedProduct]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
    >
      <motion.header 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-violet-100 flex items-center justify-center ring-1 ring-violet-500/5">
            <Barcode className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Identity Forge</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Advanced Product Serialization & QR Control</p>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-50/80 p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm shrink-0 ring-1 ring-black/[0.02]">
          {[
            { id: 'generate', label: 'Forge', icon: Plus },
            { id: 'history', label: 'Registry', icon: HistoryIcon },
            { id: 'qr', label: 'QR Portal', icon: QrCode }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                activeView === tab.id 
                ? 'bg-white text-violet-600 shadow-xl shadow-violet-100 ring-1 ring-violet-100 scale-105' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className={`w-3 h-3 ${activeView === tab.id ? 'text-violet-600' : 'text-gray-300'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-sm"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Unit Telemetry</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">Serialized Units</span>
                <span className="text-xl font-black text-gray-900 font-mono tracking-tighter">{products.filter(p => !!p.barcode).length}</span>
              </div>
              <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500" 
                  style={{ width: `${products.length > 0 ? (products.filter(p => !!p.barcode).length / products.length) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60 leading-relaxed">
                Coverage: {Math.round((products.filter(p => !!p.barcode).length / (products.length || 1)) * 100)}% of total inventory nodes.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-violet-900 to-indigo-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[60px]"></div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">Protocol</p>
             <p className="text-2xl font-black font-mono tracking-tighter mb-4">EAN-13</p>
             <p className="text-[10px] font-bold opacity-70 leading-loose uppercase tracking-widest">Industry standard cryptographic serialization used for global unit tracking and identification.</p>
          </motion.div>
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden ring-1 ring-black/[0.01]"
            >
              {activeView === 'generate' && (
                <div className="p-10 lg:p-16 space-y-12">
                  <div className="max-w-xl mx-auto space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-pulse"></div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Source Unit Selection</label>
                      </div>
                      <div className="relative group">
                        <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-violet-500 transition-colors" />
                        <select 
                          className="w-full pl-16 pr-10 py-6 bg-gray-50 border-none rounded-[2.2rem] text-base font-bold focus:ring-2 focus:ring-violet-500 shadow-inner appearance-none outline-none transition-all" 
                          onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}
                          value={selectedProduct?.id || ''}
                        >
                          <option value="">Locate unassigned product...</option>
                          {products.filter(p => !p.barcode).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                      {warning && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-rose-50 text-rose-600 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-4 shadow-sm">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          {warning}
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="pt-6">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateAndSave} 
                        className="w-full py-6 bg-gray-900 hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-[2.2rem] font-black text-[13px] uppercase tracking-[0.3em] shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-4"
                        disabled={!selectedProduct}
                      >
                        <Plus className="w-5 h-5" />
                        Forge Identity
                      </motion.button>
                      <p className="text-[9px] text-gray-400 text-center mt-6 uppercase font-black tracking-widest opacity-40 leading-relaxed">System will automatically generate a random EAN13 cryptographic node and synchronize with central database.</p>
                    </div>

                    <AnimatePresence>
                      {generatedValue && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
                          animate={{ opacity: 1, scale: 1, y: 0 }} 
                          className="mt-12 p-12 bg-gray-50/50 rounded-[3rem] border border-gray-100 flex flex-col items-center gap-8 relative overflow-hidden group"
                        >
                          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-20 bg-violet-500 rounded-r-full"></div>
                          
                          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative group-hover:scale-105 transition-transform duration-700">
                            <div className="text-4xl font-mono tracking-[0.8rem] text-gray-900 font-black leading-none">{generatedValue}</div>
                            <div className="mt-4 text-[10px] font-black text-violet-500 uppercase tracking-[0.4em] text-center opacity-60">Verified Node</div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <motion.button 
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => handlePrint(generatedValue, 'barcode', 1)}
                               className="px-10 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
                            >
                               <Printer className="w-4 h-4 text-violet-600" /> Print Single
                            </motion.button>
                            <motion.button 
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => handlePrint(generatedValue, 'barcode', 10)}
                               className="px-10 py-4 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-violet-700 transition-all shadow-xl shadow-violet-200"
                            >
                               <Printer className="w-4 h-4" /> Print Batch ×10
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeView === 'history' && (
                <div className="p-0">
                  <div className="p-10 lg:p-12 border-b border-gray-50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner">
                           <HistoryIcon className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Identity Registry</h3>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Chronological log of unassigned and active units.</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-violet-600 uppercase bg-violet-50 px-4 py-2 rounded-xl shadow-sm border border-violet-100">{products.filter(p => !!p.barcode).length} Enrolled Units</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Unit Identification</th>
                          <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Logic Address</th>
                          <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Physical Output</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {products.filter(p => !!p.barcode).map((p, idx) => (
                          <motion.tr 
                            key={p.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.03 }}
                            whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.01)" }}
                            className="group"
                          >
                            <td className="px-10 py-8">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-base font-black text-gray-900 tracking-tight group-hover:text-violet-700 transition-colors">{p.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">{p.category}</span>
                                  <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                  <span className="text-[9px] font-bold text-gray-400">UID: {p.id.substring(0, 8)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <code className="px-4 py-2 bg-gray-50 text-gray-900 font-mono text-sm tracking-[0.2em] font-black border border-gray-100 rounded-2xl shadow-sm group-hover:bg-white group-hover:border-violet-100 transition-all">{p.barcode}</code>
                            </td>
                            <td className="px-10 py-8 relative">
                              <div className="flex gap-4 justify-end items-center relative z-10">
                                <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-100 focus-within:ring-2 focus-within:ring-violet-500 transition-all group-hover:bg-white">
                                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-3">Qty</span>
                                   <input 
                                     type="number" 
                                     defaultValue="1" 
                                     min="1" 
                                     className="w-8 bg-transparent text-center text-xs font-black outline-none tabular-nums" 
                                     id={`qty-${p.id}`} 
                                   />
                                </div>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    const qty = Number((document.getElementById(`qty-${p.id}`) as HTMLInputElement)?.value) || 1;
                                    handlePrint(p.barcode || '', 'barcode', qty);
                                  }} 
                                  className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-200"
                                  title="Commit to print"
                                >
                                  <Printer className="w-4 h-4" />
                                </motion.button>
                              </div>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-violet-600 rounded-l-full transition-all scale-y-0 group-hover:scale-y-100 opacity-60"></div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeView === 'qr' && (
                <div className="p-10 lg:p-16 space-y-12">
                  <div className="max-w-xl mx-auto space-y-12">
                    {/* QR Generator Mode Toggles */}
                    <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] border border-gray-200">
                      <button
                        onClick={() => setQrMode('merchant')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                          qrMode === 'merchant'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {systemLang === 'bn' ? 'দোকান কিউআর লিংক' : 'Merchant QR Code'}
                      </button>
                      <button
                        onClick={() => setQrMode('custom')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                          qrMode === 'custom'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {systemLang === 'bn' ? 'কাস্টম কিউআর' : 'Custom QR Code'}
                      </button>
                    </div>

                    {qrMode === 'merchant' ? (
                      <div className="space-y-6">
                        <div className="bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100/30 text-xs text-indigo-900 font-bold leading-relaxed space-y-2">
                          <p className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" />
                            <span>{systemLang === 'bn' ? 'কাস্টমাররা কিউআর কোড স্ক্যান করে সরাসরি আপনার দোকানে যুক্ত হতে পারবে।' : 'Customers can scan this QR code to quickly open and select your shop storefront.'}</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{systemLang === 'bn' ? 'ডোমেইন' : 'Domain'}</label>
                            <input
                              type="text"
                              value={domainUrl}
                              onChange={(e) => setDomainUrl(e.target.value)}
                              placeholder="https://pos.sellerscampus.com"
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{systemLang === 'bn' ? 'পাথ প্রিফিক্স' : 'Path Prefix'}</label>
                            <input
                              type="text"
                              value={pathPrefix}
                              onChange={(e) => setPathPrefix(e.target.value)}
                              placeholder="merchant"
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{systemLang === 'bn' ? 'ইউনিক দোকান কোড' : 'Unique Shop ID'}</p>
                            <p className="text-sm font-black text-indigo-600 font-mono tracking-wider mt-1">{shopCode}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">{systemLang === 'bn' ? 'সিস্টেম জেনারেটেড' : 'Auto Generated'}</span>
                        </div>

                        <div className="bg-indigo-900 text-indigo-100 p-5 rounded-3xl space-y-2">
                          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">{systemLang === 'bn' ? 'কাস্টমারদের জন্য নির্ধারিত ডোমেন লিংক' : 'Final Selection Link'}</p>
                          <p className="font-mono text-xs font-bold leading-tight break-all max-w-full select-all selection:bg-indigo-500 bg-black/20 p-2.5 rounded-xl border border-white/5">{domainUrl}/{pathPrefix}/{shopCode}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 ml-4">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{systemLang === 'bn' ? 'ডাটা এনকোডিং ম্যাট্রিক্স (যেকোনো লিংক/লেখা)' : 'Data Encoding Matrix'}</label>
                        </div>
                        <div className="relative group">
                          <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            type="text"
                            value={qrInput}
                            onChange={(e) => setQrInput(e.target.value)}
                            placeholder={systemLang === 'bn' ? 'যেকোনো লিংক বা লেখা টাইপ করুন...' : 'Inject URL, transaction ID, or plaintext...'}
                            className="w-full pl-16 pr-6 py-6 bg-gray-50 border-none rounded-[2.2rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-inner outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                    
                    <motion.div 
                      layout
                      className="flex flex-col items-center bg-gray-50/50 p-12 rounded-[3.5rem] border border-gray-100 shadow-inner group relative overflow-hidden"
                    >
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-24 bg-indigo-500 rounded-r-full shadow-lg"></div>
                      
                      <motion.div 
                         initial={{ scale: 0.9, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         className="p-8 bg-white rounded-[3rem] shadow-2xl border-[12px] border-gray-50/50 group-hover:scale-105 transition-transform duration-700"
                      >
                        <QRCode value={qrMode === 'merchant' ? `${domainUrl}/${pathPrefix}/${shopCode}` : (qrInput || 'https://sellerscampus.com')} size={220} level="H" />
                      </motion.div>
                      <div className="mt-8 flex items-center gap-3">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] italic">Real-time Matrix Sync</p>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {qrMode === 'merchant' ? (
                        <>
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const targetUrl = `${domainUrl}/${pathPrefix}/${shopCode}`;
                              navigator.clipboard.writeText(targetUrl);
                              setNotification({
                                type: 'success',
                                message: systemLang === 'bn' ? 'লিংক ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Selection URL copied to clipboard!'
                              });
                            }}
                            className="w-full py-5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md"
                          >
                            <Copy className="w-4 h-4 text-indigo-500" />
                            {systemLang === 'bn' ? 'লিংক কপি করুন' : 'Copy Shop URL'}
                          </motion.button>

                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePrintMerchantQR} 
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-150"
                          >
                            <Printer className="w-4 h-4" />
                            {systemLang === 'bn' ? 'স্ট্যান্ডি / পোস্টার প্রিন্ট' : 'Print Counter Standee'}
                          </motion.button>
                        </>
                      ) : (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePrint(qrInput || 'https://sellerscampus.com', 'qr')} 
                          className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest sm:col-span-2 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                          <Printer className="w-4 h-4" />
                          {systemLang === 'bn' ? 'কাস্টম কিউআর কোড প্রিন্ট' : 'Execute QR Output'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function LoanManagement({ products, customers, settings }: { products: Product[], customers: Customer[], settings: ShopSettings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const theme = PAGE_THEMES.loan;

  const loanRecords = useMemo(() => {
    // Generate demo loan records
    const demoRecords = [
      {
        id: 'L1',
        customer: customers[0] || { name: 'Rahim Ahmed', phone: '01711223344' },
        product: products[0] || { name: 'Smart Phone X1', barcode: '8801234567890' },
        amount: 25000,
        interest: '5%',
        duration: '6 Months',
        dueDate: '2024-12-15',
        status: 'Active'
      },
      {
        id: 'L2',
        customer: customers[1] || { name: 'Karim Ullah', phone: '01822334455' },
        product: products[1] || { name: 'LED Monitor 24"', barcode: '8800987654321' },
        amount: 12000,
        interest: '0%',
        duration: '3 Months',
        dueDate: '2024-11-20',
        status: 'Active'
      },
      {
        id: 'L3',
        customer: customers[2] || { name: 'Nila Begum', phone: '01933445566' },
        product: products[2] || { name: 'Bluetooth Speaker', barcode: '8801122334455' },
        amount: 5000,
        interest: '2%',
        duration: '2 Months',
        dueDate: '2024-10-10',
        status: 'Overdue'
      }
    ];
    return demoRecords;
  }, [products, customers]);

  const filtered = loanRecords.filter(r => 
    r.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.includes(searchTerm)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-20"
    >
      <motion.header 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-${theme.primary.split('-')[0]}-100 flex items-center justify-center ring-1 ring-${theme.primary.split('-')[0]}-500/5 transition-transform hover:rotate-6`}>
            <Coins className={`w-8 h-8 text-${theme.primary}`} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Credit Portfolio</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 bg-${theme.primary.split('-')[0]}-500 rounded-full animate-pulse`}></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Advanced Loan Servicing & Risk Assessment</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <motion.div variants={itemVariants} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 ring-1 ring-black/[0.02]">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text"
                placeholder="Scan credit nodes by customer, unit, or ID..."
                className="w-full pl-16 pr-6 py-5 bg-gray-50/50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </motion.div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(225,29,72,0.08)] border border-gray-100 overflow-hidden ring-1 ring-black/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Beneficiary</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Asset Linked</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Financial Data</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((record, idx) => (
                      <motion.tr 
                        key={record.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="group"
                      >
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-${theme.bg.split(' ')[0]} flex items-center justify-center text-${theme.primary} font-black shadow-inner border border-black/[0.03] transition-transform group-hover:scale-110`}>
                              {record.customer.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-lg font-black text-gray-900 tracking-tight group-hover:text-${theme.primary.split('-')[0]}-700 transition-colors uppercase`}>{record.customer.name}</span>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{record.customer.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                               <Package className={`w-3 h-3 text-${theme.primary.split('-')[0]}-500`} />
                               <span className="text-[13px] font-black text-gray-700 uppercase tracking-tight">{record.product.name}</span>
                             </div>
                             <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter opacity-70 uppercase tracking-widest">UID: {record.product.barcode}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                           <div className="flex flex-col gap-1">
                              <span className="text-[16px] font-black text-gray-900 font-mono tracking-tighter tabular-nums">{fC(record.amount)}</span>
                              <div className="flex items-center gap-2">
                                 <div className={`flex items-center gap-1.5 bg-${theme.light} px-2 py-0.5 rounded-md border border-${theme.primary.split('-')[0]}-100`}>
                                    <TrendingUp className={`w-3 h-3 text-${theme.primary.split('-')[0]}-600`} />
                                    <span className={`text-[9px] font-black text-${theme.primary.split('-')[0]}-600`}>{record.interest} Int.</span>
                                 </div>
                                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{record.duration}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-7 text-center relative">
                           <div className="flex flex-col items-center gap-2">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                                record.status === 'Active' 
                                  ? `bg-${theme.bg.split(' ')[0]} text-${theme.primary} border-${theme.primary.split('-')[0]}-100 shadow-sm` 
                                  : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {record.status}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase opacity-60 font-black">Due: {record.dueDate}</span>
                           </div>
                           <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-${theme.primary} rounded-l-full transition-all scale-y-0 group-hover:scale-y-100 opacity-60`}></div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-24 text-center flex flex-col items-center">
                  <div className={`w-20 h-20 bg-${theme.bg.split(' ')[0]} rounded-3xl flex items-center justify-center mb-6 ring-1 ring-${theme.primary.split('-')[0]}-100`}>
                    <Coins className={`w-8 h-8 text-${theme.primary.split('-')[0]}-200`} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase">Sector Inactive</h4>
                  <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest leading-loose text-center max-w-md">No active credit nodes detected in central registry.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center relative overflow-hidden group"
          >
             <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient}`}></div>
             <div className={`w-24 h-24 bg-${theme.bg.split(' ')[0]} text-${theme.primary} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-700`}>
                <BarChart3 className="w-12 h-12" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Financial Meta</h3>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 leading-relaxed">Aggregated credit data and recovery metrics.</p>

             <div className="mt-10 space-y-4 text-left">
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between hover:bg-white transition-all group/item shadow-sm">
                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Exposure</p>
                      <p className="text-xl font-black text-gray-900 font-mono tracking-tighter tabular-nums">{fC(loanRecords.reduce((s, r) => s + r.amount, 0))}</p>
                   </div>
                   <div className={`w-12 h-12 bg-${theme.bg.split(' ')[0]} text-${theme.primary} rounded-2xl flex items-center justify-center group-hover/item:rotate-12 transition-transform`}>
                      <DollarSign className="w-6 h-6" />
                   </div>
                </div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className={`bg-gradient-to-br from-${theme.primary.split('-')[0]}-950 to-${theme.primary.split('-')[0]}-900 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl`}
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px]"></div>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Risk Factor</p>
                   <div className="flex items-end justify-between mb-4">
                      <p className="text-3xl font-black text-white font-mono tracking-tighter leading-none">Low</p>
                      <span className="text-[10px] font-black text-emerald-400 uppercase">92.4% Recovery</span>
                   </div>
                   <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-[92%] h-full bg-emerald-500"></div>
                   </div>
                </motion.div>

                <div className={`p-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center gap-4 group-hover:border-${theme.primary.split('-')[0]}-100 transition-colors`}>
                   <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-${theme.bg.split(' ')[0]} group-hover:text-${theme.primary.split('-')[0]}-400 transition-all font-black`}>
                      <AlertCircle className="w-6 h-6" />
                   </div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-relaxed">No pending protocol updates detected at this node.</p>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function SupplierPage({ products, settings }: { products: Product[], settings: ShopSettings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const theme = PAGE_THEMES.supplier;

  const suppliers = useMemo(() => {
    return [
      {
        id: 'S1',
        company: 'Samsung Electronics',
        brand: 'Samsung',
        srName: 'Kazi Nazrul',
        srPhone: '01711223344',
        category: 'Electronics',
        status: 'Active',
        productCount: 124
      },
      {
        id: 'S2',
        company: 'Xiaomi Global',
        brand: 'Xiaomi',
        srName: 'Rahim Khan',
        srPhone: '01822334455',
        category: 'Smartphones',
        status: 'Active',
        productCount: 450
      },
      {
        id: 'S3',
        company: 'Sony Corporation',
        brand: 'Sony',
        srName: 'Tanvir Hasan',
        srPhone: '01933445566',
        category: 'Audio/Visual',
        status: 'Active',
        productCount: 82
      },
      {
        id: 'S4',
        company: 'Apple Inc',
        brand: 'iPhone',
        srName: 'Imran Bashar',
        srPhone: '01644556677',
        category: 'Premium Mobile',
        status: 'Blocked',
        productCount: 22
      },
      {
        id: 'S5',
        company: 'Oppo Bangladesh',
        brand: 'Oppo',
        srName: 'Mahir Faisal',
        srPhone: '01511223344',
        category: 'Mobile Devices',
        status: 'Active',
        productCount: 95
      },
      {
        id: 'S6',
        company: 'Walton Hi-Tech',
        brand: 'Walton',
        srName: 'Sajib Ali',
        srPhone: '01311223344',
        category: 'Home Appliances',
        status: 'Active',
        productCount: 310
      }
    ];
  }, []);

  const filtered = suppliers.filter(s => 
    s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.srName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-20"
    >
      <motion.header 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-${theme.primary.split('-')[0]}-100 flex items-center justify-center ring-1 ring-${theme.primary.split('-')[0]}-500/5 transition-transform hover:rotate-6`}>
            <Building2 className={`w-8 h-8 text-${theme.primary}`} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Supplier Matrix</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 bg-${theme.primary.split('-')[0]}-500 rounded-full animate-pulse`}></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global supply chain & vendor relationship terminal</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-3 px-8 py-4 bg-${theme.primary} text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl ${theme.shadow} hover:bg-black transition-all`}
        >
          <UserPlus className="w-4 h-4" />
          Onboard Vendor
        </motion.button>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <motion.div variants={itemVariants} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 ring-1 ring-black/[0.02]">
            <div className="relative flex-1 group w-full">
              <Search className={`absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-${theme.primary.split('-')[0]}-500 transition-colors`} />
              <input 
                type="text"
                placeholder="Query central vendor registry by company, SR, or brand..."
                className={`w-full pl-16 pr-6 py-5 bg-gray-50/50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-${theme.primary.split('-')[0]}-500 transition-all outline-none`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={`bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden ring-1 ring-black/[0.01]`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Company Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Support Representative</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Portfolio Data</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((supplier, idx) => (
                      <motion.tr 
                        key={supplier.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        whileHover={{ backgroundColor: `rgba(0,0,0,0.02)` }}
                        className="group"
                      >
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black">
                                {supplier.company.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                               <span className="text-lg font-black text-gray-900 uppercase">{supplier.company}</span>
                             </div>
                          </div>
                        </td>

                        <td className="px-8 py-7 text-center relative">
                           <div className="flex flex-col items-center gap-2">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                                supplier.status === 'Active' 
                                  ? `bg-${theme.bg.split(' ')[0]} text-${theme.primary} border-${theme.primary.split('-')[0]}-100 shadow-sm` 
                                  : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                {supplier.status}
                              </span>
                           </div>
                           {/* Active Indicator Bar */}
                           <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-${theme.primary} rounded-l-full transition-all scale-y-0 group-hover:scale-y-100 opacity-60 shadow-[0_0_10px_rgba(0,0,0,0.3)]`}></div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-24 text-center flex flex-col items-center">
                  <div className={`w-20 h-20 bg-${theme.bg.split(' ')[0]} rounded-3xl flex items-center justify-center mb-6 ring-1 ring-${theme.primary.split('-')[0]}-100`}>
                    <Building2 className={`w-8 h-8 text-${theme.primary.split('-')[0]}-200`} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase">Registry Empty</h4>
                  <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest leading-loose text-center max-w-md">No qualified vendors detected in central procurement database matching your search parameters.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
           <motion.div 
            variants={itemVariants}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center relative overflow-hidden group"
           >
             <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient}`}></div>
             <div className={`w-24 h-24 bg-${theme.bg.split(' ')[0]} text-${theme.primary} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-700`}>
                <Warehouse className="w-12 h-12" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Procurement Ops</h3>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 leading-relaxed">Central nexus for supply chain orchestration and vendor health metrics.</p>

             <div className="mt-10 space-y-4 text-left">
                <div className={`p-8 bg-gradient-to-br from-${theme.primary.split('-')[0]}-900 to-${theme.primary.split('-')[0]}-800 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl`}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px]"></div>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Stock Health</p>
                   <div className="flex items-end justify-between mb-4">
                      <p className="text-3xl font-black text-white font-mono tracking-tighter leading-none">Optimal</p>
                      <span className={`text-[10px] font-black text-${theme.primary.split('-')[0]}-400 uppercase`}>94% Fill</span>
                   </div>
                   <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`w-[94%] h-full bg-${theme.primary.split('-')[0]}-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                   </div>
                </div>

                <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl flex items-center gap-4 group/card hover:bg-white transition-all shadow-sm">
                   <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                      <Lock className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                     <p className="text-base font-black text-indigo-600 uppercase">Awaits Key</p>
                  </div>
              </div>
           </div>
           </motion.div>
        </div>

        {/* Design Accents */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-50 rounded-full blur-[60px] opacity-50"></div>
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-violet-50 rounded-full blur-[60px] opacity-50"></div>
      </div>
    </motion.div>
  );
}

function ActivationCodePage() {
  const theme = {
    primary: 'indigo-600',
    bg: 'bg-indigo-50',
    gradient: 'from-indigo-600 to-violet-600',
    shadow: 'shadow-indigo-200'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-12 py-12"
    >
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl border border-indigo-100 flex items-center justify-center mx-auto ring-4 ring-indigo-50 transition-transform hover:rotate-12 duration-500">
           <Zap className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic">Activation Node</h2>
        <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.3em]">Initialize high-level system protocols via license matrix</p>
      </div>

      <div className="bg-white p-12 rounded-[4rem] shadow-[0_30px_80px_-20px_rgba(79,70,229,0.15)] border border-gray-100 relative overflow-hidden group">
         <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.gradient}`}></div>
         
         <div className="space-y-10 relative z-10">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">License Authentication Key</label>
               <div className="relative group/input">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 transition-colors group-focus-within/input:text-indigo-600" />
                  <input 
                    type="text" 
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full pl-16 pr-8 py-7 bg-gray-50/50 border-2 border-transparent rounded-[2rem] text-2xl font-black font-mono tracking-[0.2em] uppercase focus:bg-white focus:border-indigo-500 transition-all outline-none"
                  />
               </div>
            </div>

            <button className="w-full bg-black text-white py-8 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.4em] hover:bg-indigo-600 transform active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-4 group/btn">
               Verify System Integrity
               <ChevronRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-2" />
            </button>
         </div>
      </div>
    </motion.div>
  );
}
function WarrantyPage({ products, settings }: { products: Product[], settings: ShopSettings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const theme = PAGE_THEMES.warranty;

  const warrantyProducts = useMemo(() => {
    const base = products.filter(p => !!p.warranty);
    if (base.length === 0 && products.length > 0) {
      return products.slice(0, 5).map((p, idx) => ({
        ...p,
        warranty: idx % 2 === 0 ? '1 Year Replacement' : '6 Months Service'
      }));
    }
    return base;
  }, [products]);

  const filtered = warrantyProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
    >
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-${theme.primary.split('-')[0]}-100 flex items-center justify-center ring-1 ring-${theme.primary.split('-')[0]}-500/5 transition-transform hover:rotate-6`}>
            <ShieldCheck className={`w-8 h-8 text-${theme.primary}`} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Warranty Ledger</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 bg-${theme.primary.split('-')[0]}-500 rounded-full animate-pulse`}></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Protection & Service Monitoring</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 ring-1 ring-black/[0.02]">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-cyan-600" />
              <input 
                type="text" 
                placeholder="Secure lookup via product hash or identifier..."
                className="w-full pl-16 pr-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-3xl text-sm font-black focus:bg-white focus:border-cyan-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filtered.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:shadow-cyan-500/5 transition-all"
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 blur-2xl opacity-10"></div>
                   <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-100 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700 blur-2xl opacity-10"></div>
                   
                   <div className="flex items-center gap-4 mb-6 relative">
                     <div className={`w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                       <ShieldCheck className="w-7 h-7 text-cyan-600" />
                     </div>
                     <div>
                       <h3 className="font-black text-gray-900 text-lg leading-tight truncate max-w-[200px]">{item.name}</h3>
                       <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mt-1">Protected Asset</p>
                     </div>
                   </div>

                   <div className="space-y-4 relative">
                     <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 group-hover:bg-white transition-colors">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Warranty Status</span>
                         <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-[8px] font-black uppercase ring-1 ring-cyan-100">Active</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Duration</p>
                            <p className="text-xs font-black text-gray-900">{item.warranty || '0'} Days</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Coverage</p>
                            <p className="text-xs font-black text-gray-900">Full Service</p>
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center justify-between pt-2">
                       <div className="flex flex-col">
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Identifier</span>
                         <span className="text-[10px] font-mono font-bold text-gray-900">#{item.id?.slice(-8) || item.barcode}</span>
                       </div>
                       <button className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-cyan-600 transition-all shadow-lg active:scale-95 group-hover:rotate-6">
                         <ArrowRight className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
             <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500 rounded-full -mr-24 -mt-24 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
             <div className="relative">
               <h3 className="text-xl font-black mb-4">Warranty Statistics</h3>
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-cyan-400">
                     {products.filter(p => (Number(p.warranty) || 0) > 0).length}
                   </div>
                   <p className="text-sm font-bold text-gray-400">Total Items Protected</p>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function POS({ 
  products, 
  customers, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  updateCartQuantityManual, 
  updateCartPriceManual, 
  updateCartLineTotalManual, 
  checkoutData, 
  setCheckoutData, 
  handleCheckout, 
  discount, 
  setDiscount, 
  taxRate,
  setTaxRate,
  taxAmount,
  finalTotal, 
  cartTotal, 
  setNotification, 
  settings,
  sales,
  editingSale,
  onCancelEdit,
  user,
  isOnline,
  onAddCustomer,
  generateCustomerSuggestion,
  isCustomerModalOpen,
  setIsCustomerModalOpen,
  customerSuggestion,
  isCustomerVoiceListening,
  setIsCustomerVoiceListening,
  isCheckingOut
}: { 
  products: Product[],
  customers: Customer[],
  cart: CartItem[], 
  addToCart: (p: Product, q?: number) => void, 
  removeFromCart: (id: string) => void,
  updateCartQuantity: (id: string, delta: number) => void,
  updateCartQuantityManual: (id: string, q: number) => void,
  updateCartPriceManual: (id: string, p: number) => void,
  updateCartLineTotalManual: (id: string, t: number) => void,
  checkoutData: any,
  setCheckoutData: any,
  handleCheckout: () => void,
  discount: number,
  setDiscount: (d: number) => void,
  taxRate?: number,
  setTaxRate?: (r: number) => void,
  taxAmount?: number,
  finalTotal: number,
  cartTotal: number,
  setNotification: (n: any) => void,
  settings: ShopSettings,
  sales?: Sale[],
  editingSale?: Sale | null,
  onCancelEdit?: () => void,
  user?: any,
  isOnline?: boolean,
  onAddCustomer?: () => void,
  generateCustomerSuggestion?: (q: string) => void,
  isCustomerModalOpen?: boolean,
  setIsCustomerModalOpen?: (o: boolean) => void,
  customerSuggestion?: string,
  isCustomerVoiceListening?: boolean,
  setIsCustomerVoiceListening?: (l: boolean) => void,
  isCheckingOut: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const theme = PAGE_THEMES.pos;
  const systemLang = settings.systemLanguage || 'bn';
  const st = (key: keyof typeof SYSTEM_TRANSLATIONS['en']) => (SYSTEM_TRANSLATIONS[systemLang] as any)[key] || (SYSTEM_TRANSLATIONS['en'] as any)[key];

  const filteredProducts = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    if (!term && !categoryFilter) return products;
    
    return products.filter(p => {
       if (categoryFilter !== '' && p.category !== categoryFilter) return false;
       if (!term) return true;
       
       const name = p.name.toLowerCase();
       const barcode = (p.barcode || '').toLowerCase();
       
       if (name.includes(term) || barcode.includes(term)) return true;
       if (isPhoneticMatch(p.name, term)) return true;
       
       return false;
    });
  }, [products, deferredSearchTerm, categoryFilter]);

  const handleVoiceCommand = async (rawText: string) => {
    setSearchTerm('');
    setNotification({ type: 'info', message: 'Processing voice command...' });
    try {
      const aiResult = await parsePosVoiceCommandAI(
        rawText,
        products.map(p => ({ id: p.id!, name: p.name })),
        customers.map(c => ({ id: c.id!, name: c.name, phone: c.phone }))
      );

      if (aiResult && aiResult.items && aiResult.items.length > 0) {
        let addedCount = 0;
        let missingItems: string[] = [];
        let customerSet = false;
        
        for (const item of aiResult.items) {
          if (item.action === 'addProduct' || item.action === 'newProduct') {
            let match = null;
            if (item.productId) {
              match = products.find(p => p.id === item.productId);
            }
            
            if (!match && item.recognizedName) {
              const nameLower = item.recognizedName.toLowerCase();
              match = products.find(p => 
                p.name.toLowerCase().includes(nameLower) || 
                isPhoneticMatch(p.name, nameLower)
              );
              
              if (!match && nameLower.length > 2) {
                const words = nameLower.split(/\s+/).filter(w => w.length > 2);
                match = products.find(p => 
                  words.some(w => p.name.toLowerCase().includes(w) || isPhoneticMatch(p.name, w))
                );
              }
            }

            if (match) {
              addToCart(match, item.quantity > 0 ? item.quantity : 1);
              addedCount++;
            } else {
              missingItems.push(item.recognizedName || 'Unknown');
            }
          } else if (item.action === 'setCustomer') {
            let cMatch = null;
            if (item.customerId) {
              cMatch = customers.find(c => c.id === item.customerId);
            }
            if (!cMatch && item.recognizedName) {
              const cName = item.recognizedName.toLowerCase();
              cMatch = customers.find(c => 
                c.name.toLowerCase().includes(cName) || 
                isPhoneticMatch(c.name, cName) ||
                (c.phone && c.phone.includes(cName))
              );
            }

            if (cMatch) {
              setCheckoutData(prev => ({ ...prev, customerId: cMatch.id }));
              customerSet = true;
            } else {
              missingItems.push(item.recognizedName || 'Customer');
            }
          }
        }

        if (addedCount > 0) {
          setNotification({ 
            type: 'success', 
            message: `${aiResult.summary || `Added ${addedCount} items.`} ${missingItems.length > 0 ? `(Unrecognized: ${missingItems.join(', ')})` : ''}` 
          });
        } else if (customerSet && missingItems.length === 0) {
          setNotification({ type: 'success', message: aiResult.summary || 'Customer set successfully.' });
        } else if (missingItems.length > 0) {
          setSearchTerm(missingItems[0]);
          setNotification({ 
            type: 'warning', 
            message: `Could not exactly match: ${missingItems.join(', ')}. Searching instead.` 
          });
        } else {
            setSearchTerm(rawText.trim());
            setNotification({ type: 'warning', message: 'No clear command identified. Searching instead.' });
        }
      } else {
        setSearchTerm(rawText.trim());
      }
    } catch (err) {
      console.warn("AI parsing failed:", err);
      setSearchTerm(rawText.trim());
    }
  };

  const voiceLang = settings.systemLanguage === 'ar' ? 'ar-SA' : 'bn-BD';
  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand, (err) => {
    if (err === 'not-allowed') {
      setNotification({ message: "Microphone access denied. Please allow microphone in browser settings.", type: 'error' });
    } else {
      setNotification({ message: `Voice search error: ${err}`, type: 'error' });
    }
  }, voiceLang);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      
      const term = searchTerm.trim();
      // 1. Exact Barcode Match
      let match = products.find(p => p.barcode && p.barcode === term);
      let qty = 1;

      if (!match) {
        // 2. Try parsing as a command (e.g. "5 kg sugar")
        const parsed = parseVoiceCommandQuantity(term);
        qty = parsed.quantity;
        const sName = parsed.searchName.toLowerCase();
        
        // Find best match for sName
        match = products.find(p => 
          p.name.toLowerCase() === sName || 
          isPhoneticMatch(p.name, sName) ||
          (p.barcode && p.barcode === sName)
        );

        if (!match && filteredProducts.length > 0) {
          match = filteredProducts[0];
          // If we found a match via filteredProducts, we might want to still use the parsed quantity
          // if the search term contained a quantity.
          if (parsed.matchFound) {
            qty = parsed.quantity;
          }
        }
      }

      if (match) {
        addToCart(match, qty);
        setNotification({ type: 'success', message: `${qty > 1 ? qty + ' ' : ''}Added "${match.name}" to cart.` });
        setSearchTerm('');
      } else {
        setNotification({ type: 'error', message: `No product found for "${term}"` });
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-5rem)] flex flex-col gap-3 md:gap-4 p-2 md:p-0"
    >
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 relative shrink-0">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient} shadow-sm`}></div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`w-9 h-9 ${theme.bg} text-${theme.primary} rounded-xl flex items-center justify-center shadow-inner`}>
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Point of Sale</h2>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5 opacity-70">Entry Desk</p>
          </div>
        </div>
        
        <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-3 xl:gap-8 lg:px-2">
          {/* Customer Selection Group */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-1 rounded-2xl border-2 border-gray-100 shadow-sm transition-all hover:border-emerald-200 min-w-0 lg:max-w-[420px] group/customer">
            <div className="relative group w-full sm:w-60 shrink-0">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 pointer-events-none">
                {!checkoutData.customerId ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg ring-1 ring-gray-200 transition-all group-focus-within/customer:bg-emerald-50 group-focus-within/customer:ring-emerald-200">
                    <User className="w-3.5 h-3.5 text-gray-400 group-focus-within/customer:text-emerald-500" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider group-focus-within/customer:text-emerald-700">Walk-in</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 rounded-lg ring-1 ring-emerald-400 shadow-lg shadow-emerald-500/20">
                    <UserCheck className="w-3.5 h-3.5 text-white" />
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">Client</span>
                  </div>
                )}
              </div>
              <input 
                type="text" 
                placeholder={checkoutData.customerId ? customers.find(c => c.id === checkoutData.customerId)?.name : "Enter guest name or search..."}
                className={`w-full bg-transparent border-none rounded-xl pl-[88px] pr-4 py-2.5 text-[11px] font-black focus:ring-0 shadow-none outline-none text-gray-800 transition-all placeholder:text-gray-300 h-11`} 
                value={checkoutData.walkInName || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCheckoutData({...checkoutData, walkInName: val});
                  if (val.length > 1) {
                    const matched = customers.some(c => c.name.toLowerCase().includes(val.toLowerCase()) || (c.phone && c.phone.includes(val)));
                    if (!matched && val.length > 5) {
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && checkoutData.walkInName) {
                    const matched = customers.filter(c => c.name.toLowerCase().includes(checkoutData.walkInName!.toLowerCase()) || (c.phone && c.phone.includes(checkoutData.walkInName!)));
                    if (matched.length === 0) {
                      generateCustomerSuggestion?.(checkoutData.walkInName!);
                    } else if (matched.length === 1) {
                      setCheckoutData({...checkoutData, customerId: matched[0].id, walkInName: '', walkInPhone: ''});
                    }
                  }
                }}
              />
              {checkoutData.walkInName && customers.filter(c => c.name.toLowerCase().includes(checkoutData.walkInName!.toLowerCase()) || (c.phone && c.phone.includes(checkoutData.walkInName!))).length > 0 && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {customers.filter(c => c.name.toLowerCase().includes(checkoutData.walkInName!.toLowerCase()) || (c.phone && c.phone.includes(checkoutData.walkInName!))).map(c => (
                    <div 
                      key={c.id} 
                      className="px-3 py-2 text-[10px] font-black text-gray-700 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0"
                      onClick={() => setCheckoutData({...checkoutData, customerId: c.id, walkInName: '', walkInPhone: ''})}
                    >
                      {c.name} {c.phone && <span className="text-gray-400">({c.phone})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 flex-1 min-w-0 pr-2">
              <input 
                type="text" 
                placeholder="Mobile #" 
                className="w-full bg-gray-50/50 border border-transparent rounded-xl px-2 py-2 text-[10px] font-black focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-gray-300 h-9 outline-none" 
                value={checkoutData.walkInPhone || ''}
                readOnly={!!checkoutData.customerId}
                onChange={(e) => setCheckoutData({...checkoutData, walkInPhone: e.target.value})}
              />
            </div>

            {checkoutData.customerId && (
              <button 
                onClick={() => setCheckoutData({...checkoutData, customerId: '', walkInName: '', walkInPhone: ''})}
                className="px-2 py-1 text-[8px] font-black text-gray-400 hover:text-red-500 uppercase transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            {/* Product Search Group */}
            <div className="flex-1 flex items-center gap-2 bg-[#f8faf7] p-1 rounded-2xl md:rounded-[1.5rem] border border-emerald-100/50 shadow-sm hover:shadow-md transition-all group/search">
              <div className="relative flex-1 group">
                <input 
                  type="text"
                  placeholder="Scan barcode or type name..."
                  className="w-full h-11 md:h-12 pl-4 md:pl-6 pr-10 md:pr-12 bg-white/90 border border-emerald-100/50 rounded-xl md:rounded-[1.25rem] text-[11px] md:text-[13px] font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm outline-none text-gray-800 placeholder:text-gray-400 group-hover/search:border-emerald-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button 
                  onClick={toggleVoiceSearch}
                  className={`absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
                >
                  <Mic className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <AnimatePresence>
                  {voiceFeedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -bottom-8 left-0 right-0 py-1 bg-emerald-600 text-white text-[9px] font-black rounded-lg text-center shadow-lg z-50 border border-white/20 px-2 truncate"
                    >
                      "{voiceFeedback}"
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid View"
              >
                <Box className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="shrink-0">
              <select 
                className="w-full bg-white border border-gray-100 rounded-xl md:rounded-[1.25rem] px-3 md:px-5 h-10 md:h-12 text-[10px] md:text-[11px] font-black text-gray-700 tracking-wide focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm min-w-0 md:min-w-[160px] outline-none cursor-pointer hover:bg-gray-50 flex items-center"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {FIXED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden lg:h-[calc(100vh-200px)]">
        {/* Products Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
            <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              {st('products')}
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 font-black uppercase tracking-widest leading-none">
                {filteredProducts.length} items
              </span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar pb-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-5 pb-8">
                {filteredProducts.map((p, idx) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.01, 0.3) }}
                    onClick={() => addToCart(p)}
                    className={`flex flex-col bg-white rounded-[1.75rem] p-3 text-left border transition-all duration-500 relative group overflow-hidden border-gray-100/80 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 ${p.stock <= 0 ? 'border-dashed opacity-60' : 'shadow-sm'}`}
                  >
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <div className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-1 border border-emerald-400/50">
                        <span className="text-[10px] font-black tracking-tighter">#{String(idx + 1).padStart(3, '0')}</span>
                      </div>
                    </div>
                    <div className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full z-10 shadow-sm ${p.stock > 10 ? 'bg-emerald-500' : p.stock > 0 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`}></div>
                    <div className="aspect-square bg-gray-50/50 rounded-2xl mb-3 flex items-center justify-center text-gray-300 group-hover:scale-105 transition-transform duration-500 overflow-hidden relative ring-1 ring-gray-100">
                       <Package className="w-8 h-8 opacity-10" />
                       {p.stock <= 5 && p.stock > 0 && (
                         <div className="absolute inset-x-0 bottom-0 bg-red-500/90 py-1 text-center backdrop-blur-sm">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Low Stock</span>
                         </div>
                       )}
                       {p.stock <= 0 && (
                         <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest rotate-[-15deg] border-2 border-white px-2 py-0.5 rounded-lg">Out of Stock</span>
                         </div>
                       )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{p.category}</span>
                      </div>
                      <p className="font-black text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors text-xs sm:text-[13px] line-clamp-2 min-h-[32px]">{p.name}</p>
                    </div>
                    <div className="mt-2 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Price</span>
                        <p className="text-sm font-black text-emerald-600 font-mono tracking-tight">{settings.currencySymbol}{p.price}</p>
                      </div>
                      <div className="bg-gray-50 px-2 py-1 rounded-xl text-[9px] font-black text-gray-400 border border-gray-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-600 transition-all">
                        QTY: {p.stock}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {filteredProducts.map((p, idx) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.01, 0.3) }}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center gap-5 bg-white hover:bg-emerald-50/40 p-4 rounded-3xl border-2 border-gray-50 hover:border-emerald-200 transition-all group shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
                  >
                    <div className="w-16 text-[12px] font-black text-gray-400 tracking-tighter flex flex-col items-center gap-1 shrink-0 px-2 border-r border-gray-100">
                      <span className="uppercase text-[8px] opacity-40 font-sans tracking-[0.2em]">SL NO</span>
                      <span className="bg-gray-900 text-white w-full py-1.5 rounded-xl text-center shadow-lg shadow-gray-200">#{String(idx + 1).padStart(3, '0')}</span>
                    </div>
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-white transition-all shadow-inner relative overflow-hidden">
                      <Package className="w-6 h-6 opacity-20" />
                      {p.stock <= 5 && p.stock > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-lg"></div>}
                    </div>
                    <div className="flex-1 min-w-0 text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{p.category}</span>
                        {p.barcode && <span className="text-[8px] font-mono text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded select-all">ISBN: {p.barcode}</span>}
                      </div>
                      <p className="text-[13px] font-black text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{p.name}</p>
                    </div>
                    <div className="text-right shrink-0 px-4 border-l border-gray-100">
                      <p className="text-lg font-black text-emerald-600 font-mono leading-none mb-1">{settings.currencySymbol}{p.price}</p>
                      <div className={`flex items-center justify-end gap-1.5`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? 'bg-emerald-500' : p.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">In Stock: {p.stock}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm active:scale-90">
                      <Plus className="w-5 h-5" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Cart Area */}
        <div id="cart-panel" className="w-full lg:w-[400px] bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col overflow-hidden relative lg:shrink-0 h-[600px] lg:h-full min-h-0">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 ${theme.bg} text-${theme.primary} rounded-lg flex items-center justify-center font-black shadow-sm text-xs`}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div>
                <h3 className="font-black text-gray-900 tracking-tight text-sm">Shopping Cart</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${checkoutData.customerId ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                    {checkoutData.customerId ? customers.find(c => c.id === checkoutData.customerId)?.name : (checkoutData.walkInName || 'Walk-in Mode')}
                  </p>
                </div>
              </div>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => {if(confirm('Clear entire cart?')) cart.forEach(i => removeFromCart(i.id))}}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 min-h-[150px] overflow-y-auto p-3 md:p-4 space-y-3 custom-scrollbar bg-white">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 select-none">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <p className="font-black text-sm uppercase tracking-widest text-gray-400">Empty Cart</p>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="flex flex-col gap-2 p-2.5 md:p-3.5 bg-gray-50/50 rounded-xl md:rounded-2xl border border-gray-100 group hover:border-emerald-200 hover:bg-white transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start px-0.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] md:text-[12px] font-black text-gray-800 leading-tight break-words">{item.name}</p>
                        <p className="text-[7.5px] md:text-[8px] text-gray-400 font-bold mt-0.5 uppercase tracking-widest leading-none">
                          {item.unit ? `UNIT: ${item.unit}` : (item.barcode ? `CODE: ${item.barcode}` : '')}
                        </p>
                        {item.stock <= 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                              দয়া করে ইনভেন্টরি আপডেট দেওয়া হোক
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg shadow-sm border border-gray-100 shrink-0 mx-2 scale-90 origin-right">
                        <button 
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-emerald-50 active:scale-95"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input 
                          type="number" 
                          value={item.quantity === 0 ? '' : Number(item.quantity).toString()}
                          onChange={(e) => updateCartQuantityManual(item.id, Number(e.target.value))}
                          className="w-8 text-center font-black text-[11px] bg-transparent outline-none text-gray-800"
                        />
                        <button 
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-emerald-50 active:scale-95"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0 -mt-1 -mr-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-inner border border-gray-100 overflow-hidden mt-0.5">
                       <div className="grid grid-cols-2 bg-gray-50/50 border-b border-gray-100 px-2 md:px-3.5 py-1 md:py-1.5">
                          <span className="text-[7px] md:text-[7.5px] text-gray-400 font-black uppercase tracking-[0.1em]">Price</span>
                          <span className="text-[7px] md:text-[7.5px] text-gray-400 font-black uppercase tracking-[0.1em] border-l border-gray-100 pl-2 md:pl-3">Line Total</span>
                       </div>
                       <div className="grid grid-cols-2 gap-px bg-gray-100/50">
                          <div className="bg-white p-1.5 md:p-2.5 flex items-baseline gap-1 group/input">
                            <span className="text-gray-300 font-bold text-[8px] md:text-[9px]">{settings.currencySymbol}</span>
                            <input 
                              type="number"
                              value={parseFloat(Number(item.discountedPrice).toFixed(2))}
                              onChange={(e) => updateCartPriceManual(item.id, Number(e.target.value))}
                              className="w-full text-left font-black text-gray-800 text-xs md:text-sm bg-transparent outline-none group-focus-within/input:text-emerald-600 transition-all font-mono"
                            />
                          </div>
                          <div className="bg-white p-1.5 md:p-2.5 flex items-baseline gap-1 border-l border-gray-100">
                            <span className="text-emerald-400/60 font-bold text-[8px] md:text-[9px]">{settings.currencySymbol}</span>
                            <input 
                              type="number"
                              value={parseFloat(Number(item.discountedPrice * item.quantity).toFixed(2))}
                              onChange={(e) => updateCartLineTotalManual(item.id, Number(e.target.value))}
                              className="w-full text-left font-black text-emerald-600 text-xs md:text-sm bg-transparent outline-none font-mono"
                            />
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 space-y-2.5 shrink-0 relative z-10 rounded-b-[2rem]">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-gray-400 font-bold text-[9px] uppercase tracking-widest px-1">
                <span>Subtotal</span>
                <span className="font-mono font-black text-gray-600">{fC(cartTotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Disc</span>
                  <input 
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-12 text-right font-black text-red-500 bg-transparent outline-none text-[10px]"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Tax%</span>
                  <input 
                    type="number"
                    value={taxRate || 0}
                    onChange={(e) => setTaxRate?.(Number(e.target.value))}
                    className="w-12 text-right font-black text-rose-500 bg-transparent outline-none text-[10px]"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                {(['cash', 'bkash', 'nagad', 'card'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setCheckoutData({...checkoutData, paymentMethod: method})}
                    className={`flex-1 py-1.5 px-0.5 rounded-lg flex items-center justify-center gap-1 transition-all text-[8px] font-black uppercase tracking-wider ${checkoutData.paymentMethod === method ? `bg-${theme.primary} text-white shadow-md transform scale-[1.02]` : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    {method === 'cash' ? <Banknote className="w-3 h-3" /> : method === 'card' ? <CreditCard className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                    <span className="hidden lg:inline">{method}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm group">
                 <span className="text-[8px] ml-1 font-black text-gray-400 uppercase tracking-widest leading-tight">Paid</span>
                 <div className="flex items-center gap-1 group-focus-within:text-emerald-500 transition-colors mr-1">
                   {/* Full payment required alert */}
                   <span className="text-gray-300 font-bold text-[9px]">{settings.currencySymbol}</span>
                   <input 
                      type="number"
                      className={`w-20 text-right font-black ${(!checkoutData.customerId && checkoutData.paidAmount < finalTotal) ? 'text-red-500 animate-pulse' : 'text-gray-900'} text-xs bg-transparent outline-none transition-all placeholder-gray-300`}
                      value={checkoutData.paidAmount}
                      onChange={(e) => setCheckoutData({...checkoutData, paidAmount: Number(e.target.value)})}
                      onFocus={(e) => e.target.select()}
                      placeholder={finalTotal.toString()}
                   />
                 </div>
              </div>

              {checkoutData.customerId && (
                <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/30 space-y-1.5 mt-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-emerald-700/70 uppercase">
                     <span>{systemLang === 'bn' ? 'পূর্বের বাকি' : 'Previous Due'}</span>
                     <span className="font-mono">{fC(customers.find(c => c.id === checkoutData.customerId)?.currentDue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-emerald-800 uppercase">
                     <span>{systemLang === 'bn' ? 'বর্তমান বাকি' : 'Current Balance'}</span>
                     <span className="font-mono font-black">{fC((customers.find(c => c.id === checkoutData.customerId)?.currentDue || 0) + finalTotal - (checkoutData.paidAmount || 0))}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 px-1 mt-0.5">
                <span className="text-gray-900 font-black text-[10px] uppercase tracking-tight">Total</span>
                <span className={`text-[20px] font-black text-${theme.primary} tracking-tighter font-mono`}>{fC(finalTotal)}</span>
              </div>
            </div>

            <button 
              disabled={cart.length === 0 || isCheckingOut || (!checkoutData.customerId && checkoutData.paidAmount < finalTotal)}
              onClick={() => {
                 if (!checkoutData.paidAmount && checkoutData.paidAmount !== 0) {
                    setCheckoutData({...checkoutData, paidAmount: finalTotal});
                 }
                 setTimeout(() => handleCheckout(), 50);
              }}
              className={`w-full py-3.5 ${!checkoutData.customerId ? 'bg-gray-900 shadow-gray-200' : `bg-${theme.primary} ${theme.shadow}`} text-white rounded-[1.25rem] font-black text-[14px] shadow-xl hover:opacity-90 disabled:bg-gray-200 disabled:shadow-none transition-all flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] mt-1 border-b-4 border-black/10`}
            >
              {isCheckingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Banknote className="w-4 h-4" />
                    <span className="uppercase tracking-widest">{systemLang === 'bn' ? 'টাকা নিন' : 'Pay Now'}</span>
                  </div>
                  <span className="text-[9px] opacity-70 font-black uppercase tracking-widest font-sans flex items-center gap-1">
                    {!checkoutData.customerId ? (
                      <><User className="w-2 h-2" /> Walk-in</>
                    ) : (
                      <><UserCheck className="w-2 h-2" /> {customers.find(c => c.id === checkoutData.customerId)?.name.split(' ')[0]}</>
                    )}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Payable</span>
          <span className={`text-xl font-black text-${theme.primary} font-mono tracking-tighter leading-none`}>{fC(finalTotal)}</span>
        </div>
        <button 
          disabled={cart.length === 0}
          onClick={() => {
             const cartPanel = document.getElementById('cart-panel');
             if (cartPanel) {
                cartPanel.scrollIntoView({ behavior: 'smooth' });
             } else {
                // If scroll fails, try to just trigger pay if full paid or if customer selected
                if (!checkoutData.paidAmount && checkoutData.paidAmount !== 0) {
                  setCheckoutData({...checkoutData, paidAmount: finalTotal});
                }
                setTimeout(() => handleCheckout(), 0);
             }
          }}
          className={`flex-1 py-3.5 bg-${theme.primary} text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg ${theme.shadow} flex items-center justify-center gap-2 active:scale-95 transition-all`}
        >
          <Banknote className="w-4 h-4" />
          {cart.length === 0 ? 'Empty Cart' : 'Checkout Now'}
        </button>
      </div>

      <AnimatePresence>
      </AnimatePresence>
    </motion.div>
  );
}

function Inventory(props: { 
  products: Product[], 
  categories: Category[], 
  stockRecords: StockRecord[],
  sales: Sale[],
  onViewHistory: (p: Product) => void,
  setNotification: (n: { message: string, type: 'success' | 'error' | 'info' } | null) => void,
  isOnline: boolean,
  settings: ShopSettings,
  isSaving: boolean,
  setIsSaving: (v: boolean) => void,
  setScannerMode: (mode: 'cart' | 'product') => void,
  setIsScannerOpen: (v: boolean) => void,
  user: any
}) {
  const { products, categories, stockRecords, sales, onViewHistory, setNotification, isOnline, settings, isSaving, setIsSaving, setScannerMode, setIsScannerOpen, user } = props;
  const systemLang = settings.systemLanguage || 'bn';
  const st = (key: keyof typeof SYSTEM_TRANSLATIONS['en']) => (SYSTEM_TRANSLATIONS[systemLang] as any)[key] || (SYSTEM_TRANSLATIONS['en'] as any)[key];
  const [productSortBy, setProductSortBy] = useState<string>('serial');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingStockProduct, setAddingStockProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    status: string;
    current: number;
    total: number;
  } | null>(null);
  const [importReport, setImportReport] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
    show: boolean;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [categorySearch, setCategorySearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [bulkStockData, setBulkStockData] = useState<Record<string, { quantity: number; batchNumber: string; expiryDate: string }>>({});
  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImportReport(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        let report = {
          total: results.data.length,
          added: 0,
          updated: 0,
          duplicates: 0,
          totalStock: 0,
          errors: [] as string[],
          show: true
        };

        try {
          const data = results.data;
          const productMap = new Map(products.map(p => [p.name.toLowerCase(), p]));
          const batch = writeBatch(db);
          let batchCount = 0;
          const nameSetInCSV = new Set();

          setUploadProgress({ status: 'Processing...', current: 0, total: data.length });

          for (const row of data) {
            const name = (row.Name || row.name || row['Product Name'] || row['পণ্যের নাম'] || '').trim();
            if (!name) {
              report.errors.push("Missing name in a row");
              continue;
            }

            if (nameSetInCSV.has(name.toLowerCase())) {
              report.duplicates++;
            } else {
              nameSetInCSV.add(name.toLowerCase());
            }

            const stockChange = Number(row.Stock || row.stock || row['Initial Stock'] || row['স্টক'] || 0);
            const existingProduct = productMap.get(name.toLowerCase());

            if (existingProduct) {
              // Update
              const newStock = existingProduct.stock + stockChange;
              batch.update(doc(db, 'products', existingProduct.id), {
                stock: newStock
              });
              report.updated++;
            } else {
              // Add
              const newProductRef = doc(collection(db, 'products'));
              const productData = {
                name,
                category: (row.Category || row.category || row['Catalog'] || row['Catalogue'] || row['বিভাগ'] || 'General').trim(),
                price: Number(row.Price || row.price || row['Selling Price'] || row['বিক্রয় মূল্য'] || 0),
                cost: Number(row.Cost || row.cost || row['Buying Price'] || row['ক্রয় মূল্য'] || 0),
                stock: stockChange,
                unit: (() => {
                  const rawUnit = (row.Unit || row.unit || row['একক'] || 'unit').toLowerCase();
                  if (rawUnit.includes('kg')) return 'kg';
                  if (rawUnit.includes('doz')) return 'dozen';
                  if (rawUnit.includes('hal')) return 'hali';
                  return 'unit';
                })(),
                barcode: (row.Barcode || row.barcode || row['বারকোড'] || '').trim(),
                expiryDate: (row['Expiry Date'] || row.expiryDate || row['মেয়াদ'] || '').trim(),
                location: (row.Location || row.location || row['স্থান'] || '').trim(),
                company: (row.Company || row.company || row['Company Name'] || row['কোম্পানি'] || '').trim(),
                department: (row.Department || row.department || '').trim(),
                warehouse: (row.Warehouse || row.warehouse || '').trim(),
                serialNumber: products.length + report.added + 1,
                shopId: user.shopId
              };
              batch.set(newProductRef, productData);
              productMap.set(name.toLowerCase(), { id: newProductRef.id, ...productData } as Product);
              report.added++;
            }
            batchCount++;
            if (batchCount === 500) {
              await batch.commit();
              batchCount = 0;
            }
          }

          if (batchCount > 0) {
            await batch.commit();
          }

          // Calculate final total stock
          const finalProductsSnapshot = await getDocs(query(collection(db, 'products'), where('shopId', '==', user.shopId)));
          report.totalStock = finalProductsSnapshot.docs.reduce((acc, doc) => acc + (doc.data().stock || 0), 0);
          
          setImportReport({ ...report, total: report.added + report.updated } as any);
        } catch (error) {
          console.error(error);
          setNotification({ message: 'Error during bulk import', type: 'error' });
        } finally {
          setIsUploading(false);
          setUploadProgress(null);
          if (e.target) e.target.value = '';
        }
      }
    });
  };

  const getAiCategorySuggestion = async (productName: string) => {
    if (!productName || productName.trim().length < 2) {
      setAiSuggestion(null);
      return;
    }

    try {
      setIsAiThinking(true);
      const responseFetch = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Product Name: "${productName}"
List of available categories: ${FIXED_CATEGORIES.join(', ')}

Task: Identify the most suitable category from the list above for this product name. The name might be in Bengali or English. 
Return the result as JSON with a "category" field containing exactly one string from the list provided.`,
          config: {
            model: "gemini-1.5-flash-latest",
            generationConfig: {
              responseMimeType: "application/json",
            }
          }
        })
      });

      if (!responseFetch.ok) throw new Error("API failed");
      const data = await responseFetch.json();

      const result = JSON.parse(data.text || '{}');
      if (result.category && FIXED_CATEGORIES.includes(result.category)) {
        setAiSuggestion(result.category);
      } else {
        setAiSuggestion(null);
      }
    } catch (error) {
      console.error("AI Suggestion error:", error);
      setAiSuggestion(null);
    } finally {
      setIsAiThinking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isModalOpen && editingProduct?.name && !editingProduct?.category && !aiSuggestion) {
        getAiCategorySuggestion(editingProduct.name);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [editingProduct?.name, isModalOpen]);

  const handleVoiceCommand = async (rawText: string) => {
    setNotification({ type: 'info', message: 'Processing AI Voice Command...' });
    
    try {
      const aiResult = await parsePosVoiceCommandAI(
        rawText,
        products.map(p => ({ id: p.id!, name: p.name })),
        []
      );

      if (aiResult && aiResult.items && aiResult.items.length > 0) {
        const item = aiResult.items[0]; // For inventory, we only process the first action
        if (item.action === 'newProduct') {
           setIsModalOpen(true);
           setEditingProduct({
             name: item.productId ? (products.find(p => p.id === item.productId)?.name || rawText) : rawText.replace(/(নতুন|new|প্রোডাক্ট|product|অ্যাড|add|করো|কর|do)/gi, '').trim(),
             price: 0,
             stock: item.quantity || 0,
             unit: 'unit',
             cost: 0,
             barcode: '',
             category: 'General',
             department: '',
             location: '',
             expiryDate: ''
           });
           setNotification({ type: 'success', message: aiResult.summary || 'Opened Add Product Modal' });
           return;
        } else if (item.action === 'addProduct' && item.productId) {
           const match = products.find(p => p.id === item.productId);
           if (match) {
             setSearchTerm(match.name);
             setNotification({ type: 'success', message: aiResult.summary || `Searched for: ${match.name}` });
             return;
           }
        }
      }
      
      // Fallback
      const { searchName } = parseVoiceCommandQuantity(rawText);
      let lower = rawText.toLowerCase().trim();
      if (lower.includes('নতুন প্রোডাক্ট') || lower.includes('নতুন ইনভেন্টরি') || lower.includes('new product') || lower.includes('প্রোডাক্ট অ্যাড') || lower.includes('নতুন ফোডাক্ট')) {
         const { name, price, stock, unit } = parseNewProductVoiceCommand(rawText);
         setIsModalOpen(true);
         setEditingProduct({ name, price: price || 0, stock: stock || 0, unit: unit || 'unit', cost: 0, barcode: '', category: 'General', department: '', location: '', expiryDate: '' });
         setNotification({ type: 'success', message: 'Voice: Opened Add Product Modal' });
         return;
      }
      
      setSearchTerm(searchName.trim());
      setNotification({ type: 'info', message: `Voice searched for: ${searchName.trim()}` });
      
    } catch (e: any) {
      console.error(e);
      if (e.message === 'QUOTA_EXCEEDED') {
        setNotification({ type: 'error', message: 'AI Voice Quota Exceeded. Using local search.' });
      }
      setSearchTerm(rawText.trim());
    }
  };

  const voiceLang = settings.systemLanguage === 'ar' ? 'ar-SA' : 'bn-BD';
  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand, (err) => {
    if (err === 'not-allowed') {
      setNotification({ message: "Microphone access denied. Please allow microphone in browser settings (click lock icon in address bar).", type: 'error' });
    } else {
      setNotification({ message: `Voice search error: ${err}`, type: 'error' });
    }
  }, voiceLang);

  // Clear confirmation state if user clicks elsewhere
  useEffect(() => {
    const handleClick = () => setConfirmDeleteId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Category management moved to App level or should be accessed via props if needed
  // However, local addCategory was shadowing if we had it in props
  // We keep it in props if we want to pass it down, but since it's already used in CategoryManagement,
  // we should pass it to Inventory too if needed.
  // Actually, line 8449 had it defined. Let's see if we can remove it from Inventory body.


  const salesCount: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        counts[item.productId] = (counts[item.productId] || 0) + (item.quantity || 1);
      });
    });
    return counts;
  }, [sales]);

  const lastSaleDate: Record<string, number> = useMemo(() => {
    const dates: Record<string, number> = {};
    sales.forEach(sale => {
      const saleTime = sale.timestamp ? (sale.timestamp as any).toMillis?.() || new Date(sale.timestamp).getTime() || 0 : 0;
      sale.items.forEach(item => {
        if (saleTime > (dates[item.productId] || 0)) {
          dates[item.productId] = saleTime;
        }
      });
    });
    return dates;
  }, [sales]);

  const now = new Date();

  const sortedProducts = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    
    const filtered = (term || categorySearch || productSortBy === 'expired_filter') 
      ? products.filter(p => {
          // Priority 1: Exact matches or barcode (fast)
          const name = p.name.toLowerCase();
          const cat = p.category.toLowerCase();
          const comp = (p.company || '').toLowerCase();
          const barcode = (p.barcode || '').toLowerCase();
          const serial = (p.serialNumber || '').toString();

          if (name.includes(term) || barcode.includes(term) || serial.includes(term)) return true;
          if (cat.includes(term) || comp.includes(term)) return true;

          // Priority 2: Phonetic matches (heavier)
          if (isPhoneticMatch(p.name, term)) return true;
          if (isPhoneticMatch(p.category, term)) return true;
          if (p.company && isPhoneticMatch(p.company, term)) return true;

          return false;
        }).filter(p => {
          if (productSortBy === 'expired_filter') {
            if (!p.expiryDate) return false;
            return new Date(p.expiryDate) < now;
          }
          return true;
        })
      : products;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (productSortBy) {
        case 'serial':
          cmp = (a.serialNumber || 0) - (b.serialNumber || 0);
          break;
        case 'company':
          cmp = (a.company || '').localeCompare(b.company || '');
          break;
        case 'near_expire':
          const aDate = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
          const bDate = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        case 'price':
        case 'low_price':
        case 'high_price':
          cmp = a.price - b.price;
          break;
        case 'stock':
          cmp = a.stock - b.stock;
          break;
        case 'long_time_no_sell':
          cmp = (lastSaleDate[a.id] || 0) - (lastSaleDate[b.id] || 0);
          break;
        case 'trending':
          cmp = (salesCount[a.id] || 0) - (salesCount[b.id] || 0);
          break;
        default:
          cmp = a.name.localeCompare(b.name);
      }
      return productSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [products, deferredSearchTerm, categorySearch, productSortBy, productSortOrder, now, lastSaleDate, salesCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, categorySearch, productSortBy, productSortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = sortedProducts.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

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
        productName: addingStockProduct.name,
        quantity: quantity,
        type: 'add' as const,
        timestamp: new Date(),
        expiryDate: expiryDate || '',
        batchNumber: formData.get('batchNumber') as string || '',
        location: formData.get('location') as string || '',
        note: formData.get('note') as string || 'Manual stock add',
        shopId: user.shopId
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
      'Company': p.company || '',
      'Department': p.department || '',
      'Warehouse': p.warehouse || ''
    }));
    
    // We already have Papa imported at the top
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!window.confirm("Are you sure? This will DELETE all existing inventory and replace it with this file's content.\n\nআপনি কি নিশ্চিত? এটি আপনার বর্তমান সমস্ত ইনভেন্টরি মুছে ফেলবে এবং এই ফাইল থেকে নতুন ডাটা যোগ করবে।")) {
        if (e.target) e.target.value = '';
        return;
      }

      setIsUploading(true);
      setImportReport(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          let report = {
            total: results.data.length,
            success: 0,
            failed: 0,
            errors: [] as string[],
            show: true
          };

          try {
            const data = results.data;
            
            // Fetch fresh list of IDs to ensure everything is deleted
            setUploadProgress({ status: 'Querying current inventory...', current: 0, total: 0 });
            const querySnapshot = await getDocs(query(collection(db, 'products'), where('shopId', '==', user.shopId)));
            const productIds = querySnapshot.docs.map(doc => doc.id);
            
            setUploadProgress({ status: 'Deleting current inventory...', current: 0, total: productIds.length });
            
            for (let i = 0; i < productIds.length; i += 500) {
              const batch = writeBatch(db);
              const chunk = productIds.slice(i, i + 500);
              chunk.forEach(id => {
                batch.delete(doc(db, 'products', id));
              });
              await batch.commit();
              setUploadProgress(prev => prev ? { ...prev, current: i + chunk.length } : null);
            }
            
            // Add new products in batches
            setUploadProgress({ status: 'Uploading new products...', current: 0, total: data.length });
            for (let i = 0; i < data.length; i += 500) {
              const batch = writeBatch(db);
              const chunk = data.slice(i, i + 500);
              
              chunk.forEach((row: any) => {
                try {
                  const name = (row.Name || row.name || row['Product Name'] || row['পণ্যের নাম'] || '').trim();
                  const price = Number(row.Price || row.price || row['Selling Price'] || row['বিক্রয় মূল্য'] || 0);
                  const serialFromCSV = Number(row['Serial Number'] || row.serialNumber || row['সিরিয়াল'] || NaN);
                  
                  if (!name) {
                    report.failed++;
                    report.errors.push("Missing name in row " + (report.success + report.failed + 1));
                    return;
                  }
                  
                  const productData = {
                    name,
                    category: (row.Category || row.category || row['Catalog'] || row['Catalogue'] || row['বিভাগ'] || 'General').trim(),
                    price: isNaN(price) ? 0 : price,
                    cost: Number(row.Cost || row.cost || row['Buying Price'] || row['ক্রয় মূল্য'] || 0),
                    stock: Number(row.Stock || row.stock || row['Initial Stock'] || row['স্টক'] || 0),
                    unit: (row.Unit || row.unit || row['একক'] || 'unit').toLowerCase().includes('kg') ? 'kg' : 'unit',
                    barcode: (row.Barcode || row.barcode || row['বারকোড'] || '').trim(),
                    expiryDate: (row['Expiry Date'] || row.expiryDate || row['মেয়াদ'] || '').trim(),
                    location: (row.Location || row.location || row['স্থান'] || '').trim(),
                    company: (row.Company || row.company || row['Company Name'] || row['কোম্পানি'] || '').trim(),
                    department: (row.Department || row.department || '').trim(),
                    warehouse: (row.Warehouse || row.warehouse || '').trim(),
                    serialNumber: !isNaN(serialFromCSV) ? serialFromCSV : (report.success + 1),
                    shopId: user.shopId
                  };

                  const newDocRef = doc(collection(db, 'products'));
                  batch.set(newDocRef, productData);
                  report.success++;
                } catch (rowError: any) {
                  report.failed++;
                  report.errors.push(`Row Error: ${rowError.message || 'Unknown error'}`);
                }
              });
              
              await batch.commit();
              setUploadProgress(prev => prev ? { ...prev, current: i + chunk.length } : null);
            }
            
            setImportReport(report);
            setNotification({ type: 'success', message: `Import completed: ${report.success} success, ${report.failed} failed.` });
          } catch (error) {
            console.error("CSV Import Error:", error);
            setNotification({ type: 'error', message: 'Critical failure during inventory reset.' });
            setImportReport(prev => prev ? { ...prev, show: true } : report);
          } finally {
            setIsUploading(false);
            setUploadProgress(null);
            if (e.target) e.target.value = '';
          }
        },
        error: (error) => {
           console.error("Papa Parse Error:", error);
           setNotification({ type: 'error', message: 'Failed to parse CSV file.' });
           setIsUploading(false);
           setUploadProgress(null);
           if (e.target) e.target.value = '';
        }
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const imageFile = (form.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
    
    let finalImageUrl = productImage;
    if (imageFile) {
      finalImageUrl = await fileToBase64(imageFile);
    }
    
    const productData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      cost: Number(formData.get('cost') || 0),
      stock: Number(formData.get('stock') || 0),
      unit: formData.get('unit') as string,
      barcode: formData.get('barcode') as string || '',
      department: formData.get('department') as string || '',
      warehouse: formData.get('warehouse') as string || '',
      expiryDate: formatToBnDate(formData.get('expiryDate') as string || ''),
      location: formData.get('location') as string || '',
      company: formData.get('company') as string || '',
      imageUrl: finalImageUrl
    };

    if (!productData.name || isNaN(productData.price) || productData.price < 0) {
      setNotification({ message: "Please enter a valid product name and price.", type: 'error' });
      setIsSaving(false);
      return;
    }

    try {
      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        setNotification({ message: "Product updated successfully!", type: 'success' });
      } else {
        // Generate serial number
        const maxSerial = products.reduce((max, p) => Math.max(max, p.serialNumber || 0), 0);
        const newProduct = {
          ...productData,
          shopId: user.shopId,
          serialNumber: maxSerial + 1
        };
        await addDoc(collection(db, 'products'), newProduct);
        setNotification({ message: "Product added successfully!", type: 'success' });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setProductImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
      setNotification({ message: "Failed to save product.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
    
    try {
      setIsUploading(true);
      for (const product of selectedProducts) {
        const data = bulkStockData[product.id];
        if (!data || data.quantity <= 0) continue;

        const stockRecord = {
          shopId: user.shopId,
          productId: product.id,
          quantity: data.quantity,
          type: 'add' as const,
          timestamp: new Date(),
          expiryDate: data.expiryDate || '',
          batchNumber: data.batchNumber || '',
          location: product.location || '',
          note: 'Bulk stock add'
        };

        await addDoc(collection(db, 'stockRecords'), stockRecord);
        
        const updateData: any = {
          stock: increment(data.quantity)
        };
        if (data.expiryDate) {
          updateData.expiryDate = formatToBnDate(data.expiryDate);
        }

        await updateDoc(doc(db, 'products', product.id), updateData);
      }

      setNotification({ message: `Bulk stock updated for ${selectedProducts.length} products`, type: 'success' });
      setIsBulkStockModalOpen(false);
      setSelectedProductIds([]);
      setBulkStockData({});
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'stockRecords');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === sortedProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(sortedProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const productToDelete = products.find(p => p.id === id);
      if (productToDelete) {
        await moveToRecycleBin('product', id, productToDelete, productToDelete.shopId || user?.shopId);
      }
      await deleteDoc(doc(db, 'products', id));
      setNotification({ message: "Product moved to Recycle Bin", type: 'success' });
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
      setNotification({ message: "Failed to move product to Recycle Bin", type: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsSaving(true);
      const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
      
      for (const product of selectedProducts) {
        await moveToRecycleBin('product', product.id, product, product.shopId || user?.shopId);
        await deleteDoc(doc(db, 'products', product.id));
      }
      
      setNotification({ 
        message: systemLang === 'bn' 
          ? `সফলভাবে ${selectedProducts.length}টি প্রোডাক্ট রিসাইকেল বিনে পাঠানো হয়েছে।` 
          : `Successfully moved ${selectedProducts.length} products to Recycle Bin.`, 
        type: 'success' 
      });
      setSelectedProductIds([]);
      setBulkDeleteConfirmOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
      setNotification({ 
        message: systemLang === 'bn' 
          ? `প্রোডাক্ট ডিলিট করতে সমস্যা হয়েছে।` 
          : `Failed to delete products.`, 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const theme = PAGE_THEMES.inventory;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.1 }
        }
      }}
      className="space-y-6"
    >
      <motion.header 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group"
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} shadow-sm`}></div>
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-16 h-16 ${theme.bg} text-${theme.primary} rounded-3xl flex items-center justify-center shadow-inner relative group`}
          >
            <div className="absolute inset-0 bg-current opacity-5 rounded-3xl blur-md group-hover:opacity-10 transition-opacity"></div>
            <Package className="w-9 h-9 relative z-10" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{st('stockInventory')}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficient Resource Management</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-amber-100 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  {st('products')}: {products.length}
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  {st('liveStock')}: {Math.round(products.reduce((sum, p) => sum + (p.stock || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={productSortBy}
            onChange={(e) => setProductSortBy(e.target.value)}
            className="px-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="serial">{st('sortSerial')}</option>
            <option value="name">{st('sortName')}</option>
            <option value="company">{st('sortCompany')}</option>
            <option value="near_expire">{st('sortNearExpire')}</option>
            <option value="expired_filter">{st('showExpiredOnly')}</option>
            <option value="price">{st('sortPrice')}</option>
            <option value="stock">{st('sortStock')}</option>
            <option value="long_time_no_sell">{st('sortLongTimeNoSell')}</option>
            <option value="trending">{st('sortTrending')}</option>
          </select>

          <select
            value={productSortOrder}
            onChange={(e) => setProductSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer appearance-none"
          >
            <option value="asc">{st('ascending')}</option>
            <option value="desc">{st('descending')}</option>
          </select>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleVoiceSearch}
            className={`px-5 py-4 rounded-2xl transition-all flex items-center gap-3 font-bold text-sm border shadow-sm relative ${isListening ? 'bg-red-500 text-white border-red-400 shadow-red-200' : 'bg-white text-gray-500 hover:text-indigo-600 border-gray-100 hover:border-indigo-100 hover:shadow-indigo-50'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isListening ? 'bg-white/20' : 'bg-gray-50'}`}>
              <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
            </div>
            {isListening ? (systemLang === 'bn' ? 'শুনছি...' : systemLang === 'ar' ? 'استماع...' : 'Listening...') : st('voiceSearch')}
            
            <AnimatePresence>
              {voiceFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -45, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-2xl z-50 border border-white/20"
                >
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rotate-45 border-r border-b border-white/10"></div>
                  "{voiceFeedback}"
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingProduct(null);
              setProductImage(null);
              setIsModalOpen(true);
            }}
            className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-[1.5rem] font-black shadow-xl ${theme.shadow} hover:shadow-2xl transition-all flex items-center gap-3 transform uppercase tracking-widest text-xs h-full`}
          >
            <Plus className="w-5 h-5" />
            {st('addProduct')}
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {selectedProductIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="bg-amber-50/80 border border-amber-200/60 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-50/50 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
            <div className="flex items-center gap-4 pl-2">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shadow-inner">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-tight">
                  {systemLang === 'bn' ? `${selectedProductIds.length}টি প্রোডাক্ট সিলেক্ট করা হয়েছে` : `${selectedProductIds.length} Products Selected`}
                </h4>
                <p className="text-xs font-bold text-amber-600/80 mt-0.5">
                  {systemLang === 'bn' ? 'স্টক পরিবর্তন বা ডিলিট করার জন্য পাশের অপশনগুলো ব্যবহার করুন' : 'Apply bulk adjustments or remove all selected inventory'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pr-2">
              <button 
                onClick={() => setIsBulkStockModalOpen(true)}
                className="px-5 py-3.5 bg-white text-emerald-700 font-extrabold text-xs uppercase tracking-widest rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {systemLang === 'bn' ? 'স্টক আপডেট করুন' : 'Bulk Stock In'}
              </button>
              
              <button 
                onClick={() => setBulkDeleteConfirmOpen(true)}
                className="px-5 py-3.5 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {systemLang === 'bn' ? 'ডিলিট করুন' : 'Delete Selected'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-3 ring-1 ring-black/[0.02]"
          >
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text"
                placeholder={st('search')}
                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all outline-none placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDownloadCSV}
                className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm flex-1 sm:flex-none flex justify-center"
                title={st('downloadCSV')}
              >
                <Download className="w-5 h-5" />
              </motion.button>
              <label className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer shadow-sm flex-1 sm:flex-none flex justify-center" title={st('uploadCSV')}>
                <Upload className="w-5 h-5" />
                <input type="file" accept=".csv" onChange={handleUploadCSV} className="hidden" />
              </label>
              <label className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer shadow-sm flex-1 sm:flex-none flex justify-center" title="Bulk Import/Update">
                <Database className="w-5 h-5" />
                <input type="file" accept=".csv" onChange={handleBulkImport} className="hidden" />
              </label>
            </div>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden ring-1 ring-black/[0.02]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-6 border-b border-gray-100 text-center w-12 col-span-1">
                      <input 
                        type="checkbox" 
                        checked={selectedProductIds.length === sortedProducts.length && sortedProducts.length > 0} 
                        onChange={toggleSelectAll} 
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-550 w-4.5 h-4.5 cursor-pointer accent-amber-500"
                      />
                    </th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center w-20">SL</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Product Particulars</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Catalog</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Financials</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Current Stock</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((p, index) => (
                      <motion.tr 
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        whileHover={{ backgroundColor: "rgba(255, 251, 235, 0.5)" }}
                        className="group relative"
                      >
                        <td className="p-6 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedProductIds.includes(p.id)} 
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectProduct(p.id);
                            }} 
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer accent-amber-500"
                          />
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Pos</span>
                            <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-all tabular-nums ring-1 ring-gray-100 group-hover:ring-amber-200 shadow-sm">
                              {p.serialNumber || ((validCurrentPage - 1) * itemsPerPage + index + 1)}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-5">
                            <motion.div 
                              whileHover={{ scale: 1.15, rotate: 2 }}
                              className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 border border-gray-100 overflow-hidden shrink-0 shadow-sm relative group/img"
                            >
                              {/* Standard Image Rendering: Only displays manually uploaded images. 
                                  No automatic fetching from external sources like Wikipedia is implemented. */}
                              {p.imageUrl ? (
                                <Package className="w-7 h-7 opacity-20" />
                              ) : (
                                <Package className="w-7 h-7 opacity-20" />
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                            </motion.div>
                            <div className="min-w-0">
                              <p className="text-[15px] font-extrabold text-gray-900 group-hover:text-amber-700 transition-colors uppercase leading-tight truncate max-w-[200px]">{p.name}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="p-1 px-1.5 bg-gray-100 rounded-md text-[9px] font-black text-gray-400 uppercase tracking-tighter ring-1 ring-black/5">Code</span>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest tabular-nums">{p.barcode || '---'}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1.5 bg-amber-50/50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100/50 shadow-sm">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <p className="text-sm font-black text-gray-800 font-mono tracking-tight">{fC(p.price)}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                              <p className="text-[10px] font-bold text-gray-400 font-mono italic">{fC(p.cost)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${p.stock <= 5 ? 'bg-red-50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-emerald-50 text-emerald-600 shadow-inner'}`}>
                                <Box className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-xl font-black leading-none flex items-center ${p.stock <= 5 ? 'text-red-500' : 'text-gray-900'} font-mono tabular-nums tracking-tighter`}>
                                  {p.stock}
                                </span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mt-1">{p.unit} in-stock</span>
                              </div>
                            </div>
                            {p.stock <= 5 && (
                              <motion.div 
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100/50 text-red-600 rounded-lg w-fit text-[9px] font-black uppercase ring-1 ring-red-200/50 backdrop-blur-sm"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Critical Level
                              </motion.div>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2 pr-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-x-4 md:translate-x-0 group-hover:translate-x-0">
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: -5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onViewHistory(p)}
                              className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm ring-1 ring-indigo-100/50"
                              title="View History"
                            >
                              <History className="w-5 h-5" />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: -5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setAddingStockProduct(p)}
                              className="p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all shadow-sm ring-1 ring-amber-100/50"
                              title="Refill Stock"
                            >
                              <CirclePlus className="w-5 h-5" />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                              className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all shadow-sm ring-1 ring-blue-100/50"
                              title="Edit Info"
                            >
                              <Edit className="w-5 h-5" />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, backgroundColor: "#fee2e2" }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                              className={`p-3 rounded-2xl transition-all shadow-sm relative ${confirmDeleteId === p.id ? 'bg-red-600 text-white shadow-red-200' : 'bg-red-50 text-red-500 hover:shadow-red-50'}`}
                              title="Delete Product"
                            >
                              {confirmDeleteId === p.id ? (
                                <div className="flex items-center gap-1">
                                  <Trash2 className="w-5 h-5" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} />
                                </div>
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {sortedProducts.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                <div className="p-6 bg-gray-50 rounded-full">
                  <Search className="w-12 h-12 text-gray-200" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Matches Found</h4>
                  <p className="text-gray-400 text-sm font-bold">Try adjusting your filters or searching for something else.</p>
                </div>
              </div>
            )}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <div className="text-xs font-bold text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedProducts.length)} of {sortedProducts.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-gray-50 text-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1 hidden sm:flex">
                    {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${currentPage === page ? 'bg-amber-500 text-white shadow-sm' : 'hover:bg-gray-200 text-gray-600 bg-transparent'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-gray-50 text-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div 
             variants={{
               hidden: { opacity: 0, x: 20 },
               visible: { opacity: 1, x: 0 }
             }}
             className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col h-full"
          >
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                   <List className="w-5 h-5" />
                 </div>
                 Category
               </h3>
               <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-300">
                 {FIXED_CATEGORIES.length}
               </div>
             </div>
             
             <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
               {FIXED_CATEGORIES.map((cat, idx) => {
                 const count = products.filter(p => p.category === cat).length;
                 const isActive = categorySearch === cat;
                 return (
                   <motion.button 
                    key={cat}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCategorySearch(isActive ? '' : cat)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border shadow-sm group ${
                      isActive 
                       ? 'bg-amber-600 border-amber-500 text-white shadow-amber-200' 
                       : 'bg-white border-gray-50 hover:bg-amber-50 hover:border-amber-100'
                    }`}
                   >
                     <span className={`text-[12px] font-black uppercase tracking-tight transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-amber-700'}`}>{cat}</span>
                     <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shadow-inner transition-all ${
                       isActive ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-amber-600'
                     }`}>
                       {count}
                     </span>
                   </motion.button>
                 );
               })}
             </div>
          </motion.div>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ translateY: -5 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group cursor-default"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-[80px] group-hover:bg-amber-400/20 transition-all duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-[80px]"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                <TrendingUp className="w-8 h-8 text-amber-400 opacity-80" />
              </div>
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Inventory Valuation</h3>
              <p className="text-4xl font-black font-mono tracking-tighter text-white mb-2 leading-none">
                {fC(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
              </p>
              <div className="flex items-center gap-2 mt-6 p-2 px-3 bg-white/5 rounded-2xl w-fit border border-white/5 backdrop-blur-md">
                <div className="w-2 h-2">
                   <div className="w-full h-full bg-emerald-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80">Market Live Tracking</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Upload Progress Overlay */}
      <AnimatePresence>
        {isUploading && uploadProgress && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                ></motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-gray-900 font-mono">
                    {Math.round((uploadProgress.current / (uploadProgress.total || 1)) * 100)}%
                  </span>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Processing Inventory</h3>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">{uploadProgress.status}</p>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(uploadProgress.current / (uploadProgress.total || 1)) * 100}%` }}
                ></motion.div>
              </div>
              
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {uploadProgress.current} / {uploadProgress.total} Items
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Report Modal */}
      <AnimatePresence>
        {importReport?.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 text-center">
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${importReport.failed === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                  {importReport.failed === 0 ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Import Summary</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Added</p>
                    <p className="text-xl font-black text-gray-900">{importReport.added || importReport.success || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Updated</p>
                    <p className="text-xl font-black text-gray-900">{importReport.updated || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duplicates</p>
                    <p className="text-xl font-black text-amber-600">{importReport.duplicates || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Stock</p>
                    <p className="text-xl font-black text-indigo-600">{importReport.totalStock || 0}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setImportReport({ ...importReport, show: false } as any)}
                  className="w-full py-3 bg-gray-900 text-white font-black rounded-xl uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                  Close
                </button>

                {importReport.errors.length > 0 && (
                  <div className="text-left mb-8 max-h-32 overflow-y-auto p-4 bg-red-50/50 rounded-2xl border border-red-100/50 space-y-2">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Errors Encountered:</p>
                    {importReport.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-[11px] font-bold text-red-600/70 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                        {err}
                      </p>
                    ))}
                    {importReport.errors.length > 5 && (
                      <p className="text-[10px] font-bold text-red-400 italic">...and {importReport.errors.length - 5} more errors</p>
                    )}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setImportReport(null)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all"
                >
                  Close Report
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-grow custom-scrollbar">
                  {/* Section 1: Basic Info */}
                  <div className="section-title text-blue-700 font-extrabold border-b pb-2 mb-4">Primary Details</div>
                  
                  <div className="form-group">
                      <label htmlFor="product-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name <span className="text-red-600">*</span></label>
                      <input type="text" id="product-name" name="name" defaultValue={editingProduct?.name || ''} className="w-full p-4 border border-gray-300 rounded-xl text-base" placeholder="Enter product name" required/>
                  </div>

                  <div className="form-group grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                          <select id="category" name="category" defaultValue={editingProduct?.category || ''} className="w-full p-4 border border-gray-300 rounded-xl text-base">
                              <option value="">-- Select --</option>
                              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label htmlFor="company-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                          <input type="text" id="company-name" name="company" defaultValue={editingProduct?.company || ''} className="w-full p-4 border border-gray-300 rounded-xl text-base" placeholder="Brand / Mfg"/>
                      </div>
                  </div>

                  {/* Section 2: Pricing & Stock */}
                  <div className="section-title text-blue-700 font-extrabold border-b pb-2 mb-4 mt-8 text-lg">Pricing & Inventory</div>

                  <div className="form-group grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="selling-price" className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price <span className="text-red-600">*</span></label>
                          <input type="number" id="selling-price" name="price" defaultValue={editingProduct?.price || 0} step="0.01" className="w-full p-4 border border-gray-300 rounded-xl text-base" placeholder="0.00" required/>
                      </div>
                      <div>
                          <label htmlFor="buying-cost" className="block text-sm font-semibold text-gray-700 mb-1.5">Buying Cost</label>
                          <input type="number" id="buying-cost" name="cost" defaultValue={editingProduct?.cost || 0} step="0.01" className="w-full p-4 border border-gray-300 rounded-xl text-base" placeholder="0.00"/>
                      </div>
                  </div>

                  <div className="form-group grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                          <label htmlFor="initial-stock" className="block text-sm font-semibold text-gray-700 mb-1.5">Initial Stock</label>
                          <input type="number" id="initial-stock" name="stock" defaultValue={editingProduct?.stock || 0} className="w-full p-4 border border-gray-300 rounded-xl text-base" placeholder="0"/>
                      </div>
                      <div>
                          <label htmlFor="units" className="block text-sm font-semibold text-gray-700 mb-1.5">Units</label>
                          <select id="units" name="unit" defaultValue={editingProduct?.unit || 'unit'} className="w-full p-4 border border-gray-300 rounded-xl text-base">
                              <option value="unit">Pcs</option>
                              <option value="kg">Kg</option>
                              <option value="dozen">Dozen</option>
                          </select>
                      </div>
                  </div>

                  {/* Section 3: Logistics & Tracking */}
                  <div className="section-title text-blue-700 font-extrabold border-b pb-2 mb-4 mt-8 text-lg">Logistics & Tracking</div>

                  <div className="form-group">
                      <label htmlFor="barcode" className="block text-sm font-semibold text-gray-700 mb-1.5">Barcode</label>
                      <div className="flex gap-3">
                          <input type="text" id="barcode" name="barcode" defaultValue={editingProduct?.barcode || ''} className="w-full p-4 border border-gray-300 rounded-xl text-base flex-grow" placeholder="Scan or enter barcode"/>
                          <button type="button" onClick={() => { setScannerMode('product'); setIsScannerOpen(true); }} className="bg-blue-700 text-white rounded-xl px-5 flex items-center gap-2 font-bold text-sm shadow-md hover:bg-blue-800">
                              <span>📷</span> Scan
                          </button>
                      </div>
                  </div>

                  <div className="form-group grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="expiry-date" className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                          <input type="date" id="expiry-date" name="expiryDate" defaultValue={editingProduct?.expiryDate || ''} className="w-full p-4 border border-gray-300 rounded-xl text-base"/>
                      </div>
                      <div>
                          <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1.5">Location (Shelf)</label>
                          <input type="text" id="location" name="location" defaultValue={editingProduct?.location || ''} className="w-full p-4 border border-gray-300 rounded-xl text-base" placeholder="e.g. A-12"/>
                      </div>
                  </div>

                  <div className="form-group pt-2">
                      <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                          <label htmlFor="warranty" className="text-sm font-semibold text-gray-700">Product Warranty</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="warranty" defaultChecked={editingProduct?.hasWarranty || false} id="warranty" className="sr-only peer" />
                            <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-semibold text-gray-700">Enable</span>
                          </label>
                      </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4 bg-gray-50/50">
                    <button type="button" onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="px-6 py-4 bg-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-200">Cancel</button>
                    <button type="submit" className="px-6 py-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-200">Save Product</button>
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

      {/* Bulk Stock Update Modal */}
      <AnimatePresence>
        {isBulkStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Bulk Stock In</h3>
                    <p className="text-xs text-emerald-600 font-medium">Updating {selectedProductIds.length} products simultaneously</p>
                  </div>
                </div>
                <button onClick={() => setIsBulkStockModalOpen(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Product</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Current</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Stock Added *</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Batch #</th>
                      <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.filter(p => selectedProductIds.includes(p.id)).map(p => (
                      <tr key={p.id}>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{p.barcode || 'No Barcode'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-600">{p.stock} {p.unit}</span>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            step="0.001"
                            placeholder="0"
                            className="w-24 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            value={bulkStockData[p.id]?.quantity || ''}
                            onChange={(e) => setBulkStockData(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], quantity: Number(e.target.value) }
                            }))}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text"
                            placeholder="Batch #"
                            className="w-24 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            value={bulkStockData[p.id]?.batchNumber || ''}
                            onChange={(e) => setBulkStockData(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], batchNumber: e.target.value }
                            }))}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="date"
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            value={bulkStockData[p.id]?.expiryDate || ''}
                            onChange={(e) => setBulkStockData(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], expiryDate: e.target.value }
                            }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsBulkStockModalOpen(false)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkAddStock}
                  disabled={isUploading}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {isUploading ? 'Updating...' : `Update ${selectedProductIds.length} Products`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden p-8 text-center space-y-6 border border-gray-100 relative"
            >
              <button 
                onClick={() => setBulkDeleteConfirmOpen(false)} 
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="w-16 h-16 bg-red-50 text-red-650 rounded-2xl flex items-center justify-center mx-auto shadow-inner relative">
                <div className="absolute inset-0 bg-red-500 opacity-5 rounded-2xl blur-sm"></div>
                <Trash2 className="w-8 h-8 relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
                  {systemLang === 'bn' ? 'ডিলিট করতে চান?' : 'Confirm Bulk Deletion'}
                </h3>
                <p className="text-sm font-bold text-gray-500 leading-relaxed px-2">
                  {systemLang === 'bn' 
                    ? `আপনি কি নিশ্চিত যে সিলেক্ট করা ${selectedProductIds.length}টি প্রোডাক্ট ডিলিট করতে চান? এগুলো রিসাইকেল বিনে পাঠানো হবে।` 
                    : `Are you sure you want to delete these ${selectedProductIds.length} items? This will move them to the Recycle Bin and clear current inventory.`}
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setBulkDeleteConfirmOpen(false)}
                  className="flex-1 py-4 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 font-extrabold rounded-2xl transition-all uppercase tracking-widest text-[10px]"
                >
                  {systemLang === 'bn' ? 'না, বাতিল' : 'Cancel'}
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-xl shadow-red-100 hover:shadow-2xl transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {systemLang === 'bn' ? 'হ্যাঁ, ডিলিট' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SalesHistory({ sales, customers, onEdit, onDelete, settings, isOnline }: { sales: Sale[], customers: Customer[], onEdit: (sale: Sale) => void, onDelete: (sale: Sale) => void, settings: ShopSettings, isOnline: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isFilterPaneOpen, setIsFilterPaneOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'pending'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'bkash' | 'nagad' | 'card'>('all');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'vip' | 'regular'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportTab, setReportTab] = useState<'logs' | 'product_report' | 'customer_report'>('logs');

  const handleVoiceCommand = (text: string) => {
    setSearchTerm(text.trim());
  };
  const voiceLang = settings.systemLanguage === 'ar' ? 'ar-SA' : 'bn-BD';
  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand, undefined, voiceLang);

  const filteredSales = sales.filter(sale => {
    // Search filter
    const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.customerPhone && sale.customerPhone.includes(searchTerm));
    
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'settled' && sale.dueAmount > 0) return false;
    if (statusFilter === 'pending' && sale.dueAmount <= 0) return false;

    // Date filter
    const saleDate = safeDate(sale.timestamp);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (saleDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (saleDate > end) return false;
    }
    
    // Payment Method filter
    if (paymentMethodFilter !== 'all' && sale.paymentMethod !== paymentMethodFilter) return false;

    // Segment filter
    if (segmentFilter !== 'all') {
      const customer = customers.find(c => c.id === sale.customerId);
      const isVip = customer && customer.totalSpent > 10000;
      if (segmentFilter === 'vip' && !isVip) return false;
      if (segmentFilter === 'regular' && isVip) return false;
    }

    return true;
  });

  const getSalesByProduct = () => {
    const productSales: Record<string, { id: string, name: string, quantity: number, revenue: number }> = {};
    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        const id = item.productId || item.name;
        if (!productSales[id]) {
            productSales[id] = { id, name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[id].quantity += item.quantity;
        productSales[id].revenue += item.quantity * item.price; 
      });
    });
    return Object.values(productSales).sort((a,b) => b.revenue - a.revenue);
  };

  const getSalesByCustomer = () => {
    const customerSales: Record<string, { id: string, name: string, phone: string, purchases: number, revenue: number, due: number }> = {};
    filteredSales.forEach(sale => {
      const id = sale.customerId || sale.customerName || 'Walk-in';
      if (!customerSales[id]) {
        customerSales[id] = { id, name: sale.customerName || 'Walk-in', phone: sale.customerPhone || '', purchases: 0, revenue: 0, due: 0 };
      }
      customerSales[id].purchases += 1;
      customerSales[id].revenue += sale.finalAmount;
      customerSales[id].due += sale.dueAmount;
    });
    return Object.values(customerSales).sort((a,b) => b.revenue - a.revenue);
  };

  const handleExportCSV = () => {
     let csvData: any[] = [];
     let filename = '';
     if (reportTab === 'logs') {
       csvData = filteredSales.map(s => ({
         'Date': safeDate(s.timestamp).toLocaleString(),
         'Invoice ID': s.id,
         'Customer Name': s.customerName || 'Walk-in',
         'Customer Phone': s.customerPhone || '',
         'Total Amount': s.finalAmount,
         'Paid Amount': s.paidAmount,
         'Due Amount': s.dueAmount,
         'Payment Method': s.paymentMethod || 'cash',
         'Items Count': s.items ? s.items.length : 0,
         'Status': s.dueAmount > 0 ? 'Pending' : 'Settled'
       }));
       filename = `sales_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
     } else if (reportTab === 'product_report') {
       csvData = getSalesByProduct().map(p => ({
         'Product Name': p.name,
         'Units Sold': p.quantity,
         'Total Revenue': p.revenue
       }));
       filename = `product_sales_${format(new Date(), 'yyyy-MM-dd')}.csv`;
     } else if (reportTab === 'customer_report') {
       csvData = getSalesByCustomer().map(c => ({
         'Customer Name': c.name,
         'Phone': c.phone,
         'Total Purchases': c.purchases,
         'Total Revenue': c.revenue,
         'Current Due': c.due
       }));
       filename = `customer_sales_${format(new Date(), 'yyyy-MM-dd')}.csv`;
     }

     const csv = Papa.unparse(csvData);
     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.setAttribute('download', filename);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const theme = PAGE_THEMES.sales;

  const resetFilters = () => {
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setSegmentFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.1 }
        }
      }}
      className="space-y-6"
    >
      <motion.header 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group"
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} shadow-sm`}></div>
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: -10, scale: 1.1 }}
            className={`w-16 h-16 ${theme.bg} text-${theme.primary} rounded-3xl flex items-center justify-center shadow-inner relative group`}
          >
            <div className="absolute inset-0 bg-current opacity-5 rounded-3xl blur-md group-hover:opacity-10 transition-opacity"></div>
            <HistoryIcon className="w-9 h-9 relative z-10" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Sales Records</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-emerald-600">Business Activity</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sales.length} Transactions Logged</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Lifetime Volume</p>
            <p className={`text-3xl font-black text-${theme.primary} font-mono tracking-tighter tabular-nums`}>
              {fC(sales.reduce((sum, s) => sum + s.finalAmount, 0))}
            </p>
          </div>
          <div className="h-12 w-px bg-gray-100 hidden md:block"></div>
          <div className="flex -space-x-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            ))}
            <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
              +{Math.max(0, sales.length - 3)}
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-gray-100 max-w-fit ring-1 ring-black/[0.02]">
        <button
          onClick={() => setReportTab('logs')}
          className={`px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
            reportTab === 'logs' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          Activity Logs
        </button>
        <button
          onClick={() => setReportTab('product_report')}
          className={`px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
            reportTab === 'product_report' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          By Product
        </button>
        <button
          onClick={() => setReportTab('customer_report')}
          className={`px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
            reportTab === 'customer_report' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          By Customer
        </button>
      </div>

      <motion.div 
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 }
        }}
        className="space-y-4"
      >
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-3 ring-1 ring-black/[0.02]">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-violet-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search invoice, customer name or phone..."
              className="w-full pl-14 pr-16 py-4 bg-gray-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500 transition-all outline-none placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={toggleVoiceSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-violet-50 hover:text-violet-500'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {voiceFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl"
                >
                  {voiceFeedback}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleExportCSV}
            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-3 border w-full sm:w-auto bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFilterPaneOpen(!isFilterPaneOpen)}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-3 border w-full sm:w-auto ${isFilterPaneOpen ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-500 border-gray-100 hover:border-violet-100 hover:text-violet-600'}`}
          >
            <Filter className="w-4 h-4" />
            {isFilterPaneOpen ? 'Close Filter' : 'Advanced Filter'}
          </motion.button>
        </div>

        <AnimatePresence>
          {isFilterPaneOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-6 md:p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Financial Status</label>
                  <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    {(['all', 'settled', 'pending'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-white text-violet-600 shadow-md ring-1 ring-black/[0.02]' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Payment Method</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'cash', 'bkash', 'nagad', 'card'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethodFilter(method)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          paymentMethodFilter === method ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Customer Segment</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'vip', 'regular'] as const).map(segment => (
                      <button
                        key={segment}
                        onClick={() => setSegmentFilter(segment)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          segmentFilter === segment ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {segment}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Start Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">End Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-400 italic">Showing {filteredSales.length} matches from {sales.length} records</p>
                <button 
                  onClick={resetFilters}
                  className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Parameters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden ring-1 ring-black/[0.02]"
      >
        <div className="overflow-x-auto">
          {reportTab === 'logs' && (
            <>
              <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Timestamp</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Identity</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Customer Engagement</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Financial Status</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Net Value</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/80">
              <AnimatePresence mode="popLayout">
                {filteredSales.map((sale, idx) => (
                  <motion.tr 
                    key={sale.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    whileHover={{ backgroundColor: "rgba(124, 58, 237, 0.02)" }}
                    onClick={() => setSelectedSale(sale)}
                    className="group cursor-pointer relative"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-12 rounded-full bg-violet-100 group-hover:bg-violet-500 transition-all duration-500"></div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-gray-900 uppercase tabular-nums">{format(safeDate(sale.timestamp), 'MMM dd, yyyy')}</span>
                          <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{format(safeDate(sale.timestamp), 'hh:mm a')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                          <FileText className="w-5 h-5 text-gray-400 group-hover:text-violet-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice</span>
                          <span className="text-xs font-black text-gray-900 font-mono tracking-tighter transition-colors group-hover:text-violet-600">#{sale.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <p className="text-[14px] font-extrabold text-gray-900 uppercase leading-none group-hover:text-violet-700 transition-colors truncate max-w-[150px]">{sale.customerName || 'Standard Client'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          {sale.customerPhone || 'Direct Checkout'}
                        </p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit border ${
                          sale.dueAmount > 0 
                            ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.05)]' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sale.dueAmount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                            {sale.dueAmount > 0 ? 'Balance Pending' : 'Settled'}
                          </span>
                        </div>
                        {sale.dueAmount > 0 && (
                          <p className="text-[10px] font-black text-red-500 font-mono pl-1">-{fC(sale.dueAmount)} Owed</p>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <p className="text-lg font-black text-gray-900 group-hover:text-violet-700 transition-colors font-mono tracking-tighter tabular-nums">{fC(sale.finalAmount)}</p>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-x-4 md:translate-x-0 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
                        <motion.button 
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => printInvoice(sale, settings)}
                          className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-violet-50 hover:text-violet-600 transition-all shadow-sm border border-transparent hover:border-violet-100"
                          title="Print Receipt"
                        >
                          <Printer className="w-5 h-5" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEdit(sale)}
                          className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-blue-100"
                          title="Edit Transaction"
                        >
                          <Edit className="w-5 h-5" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: "#fee2e2" }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (confirmDeleteId === sale.id) {
                              onDelete(sale);
                              setConfirmDeleteId(null);
                            } else {
                              setConfirmDeleteId(sale.id);
                            }
                          }}
                          className={`p-3 rounded-2xl transition-all shadow-sm border border-transparent ${confirmDeleteId === sale.id ? 'bg-red-600 text-white border-red-400' : 'bg-red-50 text-red-500 hover:border-red-100'}`}
                          title="Void Transaction"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
            {filteredSales.length === 0 && (
              <div className="p-24 text-center flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Sales Records Found</h4>
                <p className="text-gray-400 text-sm font-bold mt-2">Try searching with a different keyword or invoice ID.</p>
              </div>
            )}
            </>
          )}

          {reportTab === 'product_report' && (
            <>
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Product Name</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Units Sold</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Total Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {getSalesByProduct().map((p, idx) => (
                    <motion.tr 
                      key={p.id || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-gray-50/50"
                    >
                      <td className="p-6">
                        <div className="font-bold text-gray-900">{p.name || 'Unknown Item'}</div>
                      </td>
                      <td className="p-6 text-right font-mono font-black text-gray-600">{p.quantity}</td>
                      <td className="p-6 text-right font-mono font-black text-emerald-600">{fC(p.revenue)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {getSalesByProduct().length === 0 && (
                <div className="p-24 text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No product sales found.</p>
                </div>
              )}
            </>
          )}

          {reportTab === 'customer_report' && (
            <>
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Customer Name</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Phone</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Total Purchases</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Total Revenue</th>
                    <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Outstanding Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  {getSalesByCustomer().map((c, idx) => (
                    <motion.tr 
                      key={c.id || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-gray-50/50"
                    >
                      <td className="p-6 font-bold text-gray-900">{c.name}</td>
                      <td className="p-6 text-gray-600 font-mono text-[13px]">{c.phone || '-'}</td>
                      <td className="p-6 text-right font-mono font-black text-gray-600">{c.purchases}</td>
                      <td className="p-6 text-right font-mono font-black text-emerald-600">{fC(c.revenue)}</td>
                      <td className="p-6 text-right font-mono font-black text-rose-600">{c.due > 0 ? fC(c.due) : '-'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {getSalesByCustomer().length === 0 && (
                <div className="p-24 text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No customer sales found.</p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

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
                  {selectedSale.taxAmount ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax (VAT){selectedSale.taxRate ? ` (${selectedSale.taxRate}%)` : ''}</span>
                      <span className="text-rose-500">+{formatCurrency(selectedSale.taxAmount)}</span>
                    </div>
                  ) : null}
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

  const theme = PAGE_THEMES.accounting;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} shadow-sm`}></div>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${theme.bg} text-${theme.primary} rounded-2xl flex items-center justify-center shadow-inner`}>
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Hishab Nikash</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Financial Intelligence & Accounting</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsExpenseModalOpen(true)} className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2 border border-red-100">
            <Plus className="w-4 h-4" /> Expense
          </button>
          <button onClick={() => setIsInvestmentModalOpen(true)} className="px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2 border border-emerald-100">
            <Plus className="w-4 h-4" /> Invest
          </button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSalaryModalOpen(true)} 
            className={`px-6 py-3 bg-gradient-to-r ${theme.gradient} text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2`}
          >
            <ShieldCheck className="w-4 h-4" /> Pay Salary
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-emerald-100/50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-emerald-600" />
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Net Profit/Loss</p>
          <h3 className={`text-3xl font-black font-mono tracking-tighter ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fC(netProfit)}
          </h3>
          <div className="mt-4 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              Real-time Profit
            </span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-rose-100/50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-12 h-12 text-rose-600" />
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Operating Expenses</p>
          <h3 className="text-3xl font-black font-mono tracking-tighter text-rose-600">{fC(totalExpenses)}</h3>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tight">Includes bills & salaries</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-orange-100/50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-orange-500" />
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Market Outstanding</p>
          <h3 className="text-3xl font-black font-mono tracking-tighter text-orange-500">{fC(totalMarketDue)}</h3>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tight">Recoverable capital</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-100/50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-12 h-12 text-indigo-600" />
          </div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Total Investments</p>
          <h3 className="text-3xl font-black font-mono tracking-tighter text-indigo-600">{fC(totalInvestments)}</h3>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tight">Owner's equity</p>
        </div>
      </div>

      <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex gap-2">
        {(['overview', 'expenses', 'investments', 'salaries', 'dues'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-2 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
              activeTab === tab ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg` : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${theme.bg} text-${theme.primary} flex items-center justify-center`}>
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Financial Performance Ledger</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest group-hover:text-emerald-700">Total Sales Revenue</span>
                    </div>
                    <span className="text-xl font-mono font-black text-gray-900 group-hover:text-emerald-600">{fC(totalSales)}</span>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-700">Total Product Cost</span>
                    </div>
                    <span className="text-xl font-mono font-black text-gray-900 group-hover:text-orange-600">{fC(totalCost)}</span>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest group-hover:text-rose-700">Operating Expenses</span>
                    </div>
                    <span className="text-xl font-mono font-black text-rose-600">{fC(totalExpenses)}</span>
                  </div>

                  <div className={`flex justify-between items-center p-6 bg-gradient-to-br ${theme.gradient} rounded-2xl border border-gray-100 shadow-lg group`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                        <Star className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-white/80 uppercase tracking-widest">Net Profit Ledger</span>
                    </div>
                    <span className="text-2xl font-mono font-black text-white">{fC(netProfit)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Expense Registry</h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Category</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-left">Description</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Amount</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenses.length === 0 ? (
                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold italic uppercase text-xs">No records found</td></tr>
                      ) : (
                        expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-rose-50/30 transition-colors group">
                            <td className="p-4 text-xs font-black text-gray-900">{format(safeDate(exp.timestamp), 'MMM dd, yy')}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{exp.category}</span>
                            </td>
                            <td className="p-4 text-xs font-bold text-gray-500 italic max-w-[200px] truncate">{exp.description}</td>
                            <td className="p-4 text-right font-mono font-black text-rose-600">{fC(exp.amount)}</td>
                            <td className="p-4 text-right">
                              <button onClick={() => onDeleteExpense(exp)} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'investments' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Investment Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-left">Date</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-left">Description</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Capital Amount</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {investments.map(inv => (
                        <tr key={inv.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="p-4 text-xs font-black text-gray-900">{format(safeDate(inv.timestamp), 'MMM dd, yy')}</td>
                          <td className="p-4 text-xs font-bold text-gray-500 italic max-w-[300px] truncate">{inv.description}</td>
                          <td className="p-4 text-right font-mono font-black text-emerald-600">{fC(inv.amount)}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => onDeleteInvestment(inv)} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'salaries' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Staff Salary Records</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Staff Name</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Salary Month</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount Paid</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staffSalaries.map(sal => (
                        <tr key={sal.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="p-4 text-xs font-black text-gray-900 uppercase">{sal.staffName}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{sal.month}</span>
                          </td>
                          <td className="p-4 text-right font-mono font-black text-indigo-600 uppercase tracking-widest text-[11px]">{fC(sal.amount)}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => onDeleteSalary(sal)} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'dues' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Market Recovery (Outstanding Dues)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Customer Name</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Outstanding Due</th>
                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Quick Reminders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {highDueCustomers.map(cust => (
                        <tr key={cust.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-4">
                            <p className="text-xs font-black text-gray-900 uppercase">{cust.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{cust.phone}</p>
                          </td>
                          <td className="p-4 text-right font-mono font-black text-orange-600">{fC(cust.currentDue)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => onSendWhatsAppReminder(cust, 'bn')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                Send BN
                              </button>
                              <button onClick={() => onSendWhatsAppReminder(cust, 'en')} className="px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                Send EN
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 to-pink-600"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Record Expense</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Daily operating costs</p>
                  </div>
                  <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleExpenseSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select name="category" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500 shadow-inner outline-none">
                      <option value="salary">Staff Salary</option>
                      <option value="rent">Shop Rent</option>
                      <option value="electricity">Electricity Bill</option>
                      <option value="internet">Internet Bill</option>
                      <option value="food">Food Expense</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 w-5 h-5" />
                      <input name="amount" type="number" required placeholder="0.00" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500 shadow-inner outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea name="description" placeholder="Notes about this expense..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500 shadow-inner outline-none h-32 resize-none" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-100 hover:shadow-rose-200 transition-all">Save Entry</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {isInvestmentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Inject Capital</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">New Investment Registry</p>
                  </div>
                  <button onClick={() => setIsInvestmentModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleInvestmentSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Capital Amount</label>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                      <input name="amount" type="number" required placeholder="0.00" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Source / Note</label>
                    <textarea name="description" placeholder="Where did this capital come from?" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner outline-none h-32 resize-none" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsInvestmentModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-100 transition-all">Apply Investment</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {isSalaryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Staff Salary</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Monthly payroll processing</p>
                  </div>
                  <button onClick={() => setIsSalaryModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSalarySubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Staff Member</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" />
                      <input name="staffName" required placeholder="Employee Full Name" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-inner outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payroll Month</label>
                    <input name="month" placeholder="e.g. October 2024" required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-inner outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Salary Amount</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" />
                      <input name="amount" type="number" required placeholder="0" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-inner outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 transition-all">Process Payment</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Customers({ 
  customers, 
  sales, 
  setNotification, 
  shopSettings,
  user,
  onDownloadCSV,
  customerLogs,
  duePayments,
  recycleBin,
  isOnline,
  syncQueue
}: { 
  customers: Customer[], 
  sales: Sale[],
  setNotification: (n: { message: string, type: 'success' | 'error' | 'info' } | null) => void,
  shopSettings: ShopSettings,
  user: any,
  onDownloadCSV: () => void,
  customerLogs: CustomerLog[],
  duePayments: DuePayment[],
  recycleBin: RecycleItem[],
  isOnline: boolean,
  syncQueue: any[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<'transactions' | 'payments' | 'edits'>('transactions');
  const [dateFilter, setDateFilter] = useState<'3m' | '6m' | '1y' | '2y' | 'all'>('all');

  const allCustomers = useMemo(() => {
    const pendingCustomers = syncQueue
      .filter(item => item.type === 'customer')
      .map(item => ({ 
        id: item.data.customId, 
        ...item.data.customerData, 
        isSyncing: true 
      }));
    return [...pendingCustomers, ...customers];
  }, [customers, syncQueue]);

  const handleVoiceCommand = (text: string) => {
    setSearchTerm(text.trim());
  };
  const voiceLang = shopSettings.systemLanguage === 'ar' ? 'ar-SA' : 'bn-BD';
  const { isListening, voiceFeedback, toggleVoiceSearch } = useVoiceSearch(handleVoiceCommand, undefined, voiceLang);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return allCustomers;
    return allCustomers.filter(c => 
      isPhoneticMatch(c.name, searchTerm) || 
      (c.phone && c.phone.includes(searchTerm)) || 
      isPhoneticMatch(c.address, searchTerm) ||
      isPhoneticMatch(c.fatherName, searchTerm)
    );
  }, [allCustomers, searchTerm]);

  const sendCustomerWhatsApp = async (customer: Customer, lang: 'en' | 'bn') => {
    let message = "";
    
    if (shopSettings.aiWhatsAppEnabled) {
      const aiMsg = await generatePersonalizedMessage(customer, null, 'reminder', lang, shopSettings);
      if (aiMsg) message = aiMsg;
    }

    if (!message) {
      const template = lang === 'bn' 
        ? (shopSettings.waTemplateBengali || "প্রিয় {{customerName}}, {{shopName}}-এ আপনার বকেয়া {{dueAmount}} টাকা। অনুগ্রহ করে সময়মতো পরিশোধ করুন।") 
        : (shopSettings.waTemplateEnglish || "Dear {{customerName}}, your due amount at {{shopName}} is {{dueAmount}}. Please pay on time.");
      
      // Basic variable substitution
      message = template
        .replace('{{customerName}}', customer.name || 'Customer')
        .replace('{{shopName}}', shopSettings.name || 'Shop')
        .replace('{{dueAmount}}', (customer.currentDue || 0).toString());
    }

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
      currentDue: Number(formData.get('currentDue') || 0),
      dueDate: formData.get('dueDate') as string || '',
      points: Number(formData.get('points') || 0),
      totalSpent: Number(formData.get('totalSpent') || 0),
    };

    try {
      if (editingCustomer?.id) {
        if (isOnline) {
          await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
          await addDoc(collection(db, 'customer_logs'), {
            shopId: user.shopId,
            customerId: editingCustomer.id,
            type: 'profile_edit',
            oldData: editingCustomer,
            newData: customerData,
            timestamp: serverTimestamp(),
            performedBy: user?.displayName || user?.username || 'Admin',
            performedByRole: user?.role || 'admin'
          });
        } else {
          await addToSyncQueue('customer_update', {
            customerId: editingCustomer.id,
            customerData,
            logData: {
              shopId: user.shopId,
              customerId: editingCustomer.id,
              type: 'profile_edit',
              oldData: editingCustomer,
              newData: customerData,
              performedBy: user?.displayName || user?.username || 'Admin',
              performedByRole: user?.role || 'admin'
            }
          });
          setNotification({ message: 'Saved offline. Data will sync when back online.', type: 'info' });
        }
        setNotification({ message: 'Customer updated successfully', type: 'success' });
      } else {
        const customId = `cust_${Date.now()}`;
        const newCustomerData = {
          ...customerData,
          shopId: user.shopId,
          serialNumber: Date.now()
        };
        
        if (isOnline) {
           await setDoc(doc(db, 'customers', customId), {
             ...newCustomerData,
             timestamp: serverTimestamp()
           });
        } else {
          await addToSyncQueue('customer', {
            customId,
            customerData: newCustomerData
          });
          setNotification({ message: 'Added offline. Data will sync when back online.', type: 'info' });
        }
        setNotification({ message: 'Customer added successfully', type: 'success' });
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
    }
  };

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForHistory) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const amount = Number(formData.get('amount'));
    const method = formData.get('method') as 'cash' | 'bkash' | 'nagad' | 'bank';
    const note = formData.get('note') as string;

    if (amount <= 0) return;

    try {
      const paymentData = {
        customerId: selectedCustomerForHistory.id,
        amount,
        previousDue: selectedCustomerForHistory.currentDue,
        remainingDue: selectedCustomerForHistory.currentDue - amount,
        method,
        note,
        shopId: user.shopId,
        receivedBy: user?.displayName || user?.username || 'Admin'
      };

      if (isOnline) {
        await addDoc(collection(db, 'due_payments'), {
          ...paymentData,
          timestamp: serverTimestamp()
        });
        await updateDoc(doc(db, 'customers', selectedCustomerForHistory.id), {
          currentDue: increment(-amount)
        });
        setNotification({ message: `${fC(amount)} collected from ${selectedCustomerForHistory.name}`, type: 'success' });
      } else {
        await addToSyncQueue('payment', {
          paymentData,
          customerId: selectedCustomerForHistory.id,
          amount
        });
        setNotification({ message: 'Collection saved offline. Data will sync when back online.', type: 'info' });
      }
      setIsPaymentModalOpen(false);
      setSelectedCustomerForHistory({
        ...selectedCustomerForHistory,
        currentDue: selectedCustomerForHistory.currentDue - amount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'due_payments');
      setNotification({ message: "Failed to collect payment", type: 'error' });
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getFilteredData = (data: any[]) => {
    if (dateFilter === 'all') return data;
    const now = new Date();
    let cutoff = new Date();
    if (dateFilter === '3m') cutoff.setMonth(now.getMonth() - 3);
    else if (dateFilter === '6m') cutoff.setMonth(now.getMonth() - 6);
    else if (dateFilter === '1y') cutoff.setFullYear(now.getFullYear() - 1);
    else if (dateFilter === '2y') cutoff.setFullYear(now.getFullYear() - 2);
    
    return data.filter(item => safeDate(item.timestamp) >= cutoff);
  };

  const printHistory = (type: 'sales' | 'payments', data: any[]) => {
    const lang = shopSettings.printLanguage || 'bn';
    const t = PRINT_TRANSLATIONS[lang];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatVal = (num: number) => lang === 'bn' ? toBengaliNumber((num || 0).toLocaleString()) : (num || 0).toLocaleString();
    const formatDate = (date: any) => lang === 'bn' ? toBengaliNumber(format(safeDate(date), 'dd/MM/yy HH:mm')) : format(safeDate(date), 'dd/MM/yy HH:mm');

    const html = `
      <html>
        <head>
          <title>${type === 'sales' ? 'Sale' : 'Payment'} History - ${selectedCustomerForHistory?.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&family=Inter:wght@400;700&display=swap');
            body { font-family: ${lang === 'bn' ? "'Hind Siliguri', sans-serif" : "'Inter', sans-serif"}; padding: 20px; color: #333; }
            h1 { text-align: center; margin-bottom: 5px; }
            .shop-info { text-align: center; font-size: 14px; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border-bottom: 1px solid #eee; padding: 10px; text-align: left; }
            th { background: #f9fafb; color: #666; text-transform: uppercase; font-size: 10px; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
          </style>
        </head>
        <body>
          <h1>${shopSettings.name}</h1>
          <div class="shop-info">${shopSettings.address} | ${shopSettings.phone}</div>
          <div style="margin-bottom: 15px;">
            <p><strong>Customer:</strong> ${selectedCustomerForHistory?.name}</p>
            <p><strong>Type:</strong> ${type === 'sales' ? 'Transaction' : 'Payment'} History (${dateFilter === 'all' ? 'All Time' : 'Last ' + dateFilter})</p>
            <p><strong>Date Filter:</strong> ${dateFilter === 'all' ? 'All' : dateFilter}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                ${type === 'sales' ? '<th>Invoice #</th><th>Total</th><th>Paid</th><th>Due</th>' : '<th>Amount</th><th>Method</th><th>Prev Due</th><th>New Due</th>'}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${formatDate(item.timestamp)}</td>
                  ${type === 'sales' ? `
                    <td>#${item.id}</td>
                    <td class="text-right">TK ${formatVal(item.finalAmount)}</td>
                    <td class="text-right">TK ${formatVal(item.paidAmount)}</td>
                    <td class="text-right">TK ${formatVal(item.dueAmount)}</td>
                  ` : `
                    <td class="text-right font-bold">TK ${formatVal(item.amount)}</td>
                    <td>${item.method.toUpperCase()}</td>
                    <td class="text-right">TK ${formatVal(item.previousDue)}</td>
                    <td class="text-right font-bold">TK ${formatVal(item.remainingDue)}</td>
                  `}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Software by StratPro Solutions | Printed on ${new Date().toLocaleString()}</div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const theme = PAGE_THEMES.customers;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
      }}
      className="space-y-6 pb-20"
    >
      <motion.header 
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group"
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} shadow-sm`}></div>
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-16 h-16 ${theme.bg} text-${theme.primary} rounded-3xl flex items-center justify-center shadow-inner relative group`}
          >
            <div className="absolute inset-0 bg-current opacity-5 rounded-3xl blur-md group-hover:opacity-10 transition-opacity"></div>
            <Users className="w-9 h-9 relative z-10" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Customer Relations</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none">Intelligence Ledger</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{customers.length} Profiles Registered</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Receivables</p>
            <p className={`text-3xl font-black text-${theme.primary} font-mono tracking-tighter tabular-nums`}>
              {fC(customers.reduce((sum, c) => sum + (c.currentDue || 0), 0))}
            </p>
          </div>
          <div className="h-12 w-px bg-gray-100 hidden md:block"></div>
          <motion.button 
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-[1.5rem] font-black shadow-xl ${theme.shadow} hover:shadow-2xl transition-all flex items-center gap-3 transform uppercase tracking-widest text-xs h-full`}
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </motion.button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-purple-100/30 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 ring-1 ring-black/[0.02]">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Find customer (smart/phonetic)..."
                  className="w-full pl-16 pr-16 py-5 bg-gray-50/50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-purple-500 transition-all outline-none placeholder:text-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  onClick={toggleVoiceSearch}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-purple-50 hover:text-purple-500'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {voiceFeedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl"
                    >
                      {voiceFeedback}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDownloadCSV}
                className="p-5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm flex items-center justify-center border border-transparent hover:border-emerald-100 w-full sm:w-auto"
                title="Export Database"
              >
                <Download className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="bg-white rounded-[2.5rem] shadow-[0_10px_60px_-15px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden ring-1 ring-black/[0.02]"
          >
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center w-28">Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Client Profile</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Promise Date</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Debit Balance</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredCustomers.map((customer, idx) => (
                      <motion.tr 
                        key={customer.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                        whileHover={{ backgroundColor: "rgba(147, 51, 234, 0.01)" }}
                        className="group cursor-pointer"
                        onClick={() => setSelectedCustomerForHistory(customer)}
                      >
                        <td className="px-8 py-7">
                          <div className="flex flex-col items-center">
                            <motion.div 
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border-2 border-white shadow-md transition-all group-hover:shadow-purple-100 group-hover:border-purple-100"
                            >
                               <span className="text-xl font-black text-gray-400 group-hover:text-purple-600 transition-colors uppercase tabular-nums">
                                 {customer.name?.charAt(0) || 'C'}
                               </span>
                            </motion.div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-lg font-black text-gray-900 tracking-tight group-hover:text-purple-700 transition-colors">{customer.name}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg group-hover:bg-purple-50 transition-colors">
                                <Phone className="w-3 h-3 text-purple-600" />
                                <span className="text-[11px] font-bold text-gray-500 tabular-nums">{customer.phone}</span>
                              </div>
                              {customer.address && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                  <span className="text-[10px] font-medium text-gray-400 italic truncate max-w-[180px]">{customer.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-center">
                            {customer.dueDate ? (
                                <div className="flex flex-col items-center gap-1">
                                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                       {format(safeDate(customer.dueDate), 'dd MMM yyyy')}
                                    </span>
                                    {isPast(safeDate(customer.dueDate)) && customer.currentDue > 0 && (
                                        <span className="text-[8px] font-black text-rose-500 uppercase animate-pulse">Overdue</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-gray-200 text-[10px] font-black uppercase tracking-widest italic">—</span>
                            )}
                        </td>
                        <td className="px-8 py-7 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-xl font-black font-mono tracking-tighter tabular-nums ${customer.currentDue > 0 ? 'text-rose-500' : 'text-gray-900'}`}>
                              {fC(customer.currentDue)}
                            </span>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Outstanding</span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {customer.currentDue > 0 && (
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => sendCustomerWhatsApp(customer, shopSettings.printLanguage || 'en')}
                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Send reminder"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </motion.button>
                            )}
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                              className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Edit profile"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredCustomers.length === 0 && (
                <div className="p-24 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-gray-200" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase">No Data Found</h4>
                  <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest leading-loose">The intelligence filter returned zero matches<br/>Try alternative search parameters.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-8 h-full">
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center text-center group relative overflow-hidden h-full"
          >
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient}`}></div>
            <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-700">
               <Activity className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Intelligence Hub</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 px-2 leading-relaxed">Financial interaction and credit health monitoring center.</p>
            
            <div className="w-full h-px bg-gray-50 my-10 relative">
               <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Quick Pulse</div>
            </div>
            
            <div className="w-full space-y-5">
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 group/item hover:bg-white transition-all shadow-sm">
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Risk Exposure</p>
                  <p className="text-xl font-black text-rose-500 font-mono tracking-tighter">
                    {customers.filter(c => c.currentDue > 1000).length} High
                  </p>
                </div>
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 group/item hover:bg-white transition-all shadow-sm">
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Growth Index</p>
                  <p className="text-xl font-black text-emerald-600 font-mono tracking-tighter">+18.4%</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
                   <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <motion.div 
                 whileHover={{ scale: 1.02 }}
                 className="bg-gradient-to-br from-purple-900 to-fuchsia-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mt-6 text-left"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[60px]"></div>
                 <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-4">Elite Segment</h4>
                 <p className="text-4xl font-black text-white font-mono tracking-tighter mb-4 leading-none">{customers.filter(c => c.totalSpent > 5000).length}</p>
                 <p className="text-[10px] font-bold text-white/70 leading-relaxed uppercase tracking-widest">Profiles with strategic lifetime value over ৳5,000.</p>
                 <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Confidence Score</span>
                       <span className="text-sm font-black text-emerald-400 font-mono">98.2%</span>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                       <ShieldCheck className="w-5 h-5 text-white/60" />
                    </div>
                 </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>


      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.gradient}`}></div>
              <div className="flex flex-col max-h-[90vh]">
                <div className="p-6 pb-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingCustomer ? 'Update Profile' : 'New Customer'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Master Ledger Entry</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className={`p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
                  <div className="p-6 pt-4 space-y-4 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                         <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 w-5 h-5" />
                           <input name="name" defaultValue={editingCustomer?.name || ''} required placeholder="Customer Name" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 shadow-inner outline-none" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                         <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 w-5 h-5" />
                           <input name="phone" defaultValue={editingCustomer?.phone || ''} required placeholder="017XXXXXXXX" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 shadow-inner outline-none" />
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Father's Name</label>
                         <input name="fatherName" defaultValue={editingCustomer?.fatherName || ''} placeholder="Father's Name" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 shadow-inner outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">House Name/No</label>
                         <input name="houseName" defaultValue={editingCustomer?.houseName || ''} placeholder="House/Village" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 shadow-inner outline-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Address</label>
                      <textarea name="address" defaultValue={editingCustomer?.address || ''} placeholder="Full detailed address..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 shadow-inner outline-none h-24 resize-none" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Balance (TK)</label>
                         <div className="relative">
                           <CalculatorIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600 w-5 h-5" />
                           <input name="currentDue" type="number" defaultValue={editingCustomer?.currentDue || 0} placeholder="0.00" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500 shadow-inner outline-none" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Promise Date</label>
                         <div className="relative">
                           <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 w-5 h-5" />
                           <input name="dueDate" type="date" defaultValue={editingCustomer?.dueDate || ''} className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 shadow-inner outline-none" />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                    <button type="submit" className={`flex-1 py-4 bg-gradient-to-r ${theme.gradient} text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-purple-100 hover:shadow-purple-200 transition-all`}>
                      {editingCustomer ? 'Update Entry' : 'Create Customer'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCustomerForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.gradient}`}></div>
              
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${theme.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <HistoryIcon className={`w-8 h-8 text-${theme.primary}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedCustomerForHistory.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedCustomerForHistory.currentDue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {selectedCustomerForHistory.currentDue > 0 ? `Receivable: ${fC(selectedCustomerForHistory.currentDue)}` : "Settled Balance"}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reward Points: {selectedCustomerForHistory.points}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    <Banknote className="w-4 h-4" /> Collect Payment
                  </motion.button>
                  <button onClick={() => setSelectedCustomerForHistory(null)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex border-b border-gray-100 px-8 bg-gray-50/30 items-center justify-between">
                <div className="flex gap-2">
                  {(['transactions', 'payments', 'edits'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setHistoryTab(tab)}
                      className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${historyTab === tab ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {tab}
                      {historyTab === tab && <motion.div layoutId="histTab" className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full" />}
                    </button>
                  ))}
                </div>
                <div className="py-2">
                  <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200 shadow-inner">
                    {(['all', '3m', '6m', '1y', '2y'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setDateFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === f ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {f === 'all' ? 'Full' : f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {historyTab === 'transactions' && (
                  <div className="space-y-6">
                    {(() => {
                      const rawSales = [
                        ...sales.filter(s => s.customerId === selectedCustomerForHistory.id).map(s => ({ ...s, isDeleted: false })),
                        ...recycleBin
                          .filter(item => item.entityType === 'sale' && (item.data as Sale).customerId === selectedCustomerForHistory.id)
                          .map(item => ({ ...(item.data as Sale), isDeleted: true }))
                      ];
                      
                      const filteredSales = getFilteredData(rawSales).sort((a,b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime());

                      if (filteredSales.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                                <ShoppingCart className="w-8 h-8" />
                             </div>
                             <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">No purchase transactions in this period</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Dispatches</h4>
                            <button 
                              onClick={() => printHistory('sales', filteredSales)}
                              className="flex items-center gap-2 text-[10px] font-black text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-all uppercase tracking-widest shadow-sm shadow-purple-100"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Export Statement
                            </button>
                          </div>
                          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice Total</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Settled</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Due Carry</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {filteredSales.map(sale => (
                                    <tr key={sale.id} className={`group hover:bg-gray-50/50 transition-colors ${sale.isDeleted ? 'opacity-60 bg-red-50/20' : ''}`}>
                                      <td className="px-6 py-4 text-[10px] font-bold text-gray-400 group-hover:text-gray-600">
                                        {format(safeDate(sale.timestamp), 'dd MMM yy HH:mm')}
                                        {sale.isDeleted && <span className="ml-2 text-[8px] font-black text-rose-500 uppercase px-2 py-0.5 border border-rose-200 bg-rose-50 rounded-full">Deleted</span>}
                                      </td>
                                      <td 
                                        className={`px-6 py-4 text-xs font-black cursor-pointer uppercase tracking-tight group-hover:text-purple-600 ${sale.isDeleted ? 'text-gray-300 line-through' : 'text-gray-900'}`}
                                        onClick={() => printInvoice(sale, dynamicSettings)}
                                      >
                                        Inv#{sale.id}
                                      </td>
                                      <td className="px-6 py-4 text-right font-mono font-black text-gray-900">{fC(sale.finalAmount)}</td>
                                      <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">{fC(sale.paidAmount)}</td>
                                      <td className="px-6 py-4 text-right font-mono font-black text-rose-600">{fC(sale.dueAmount)}</td>
                                    </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {historyTab === 'payments' && (
                  <div className="space-y-6">
                    {(() => {
                      const filteredPay = getFilteredData(duePayments.filter(p => p.customerId === selectedCustomerForHistory.id))
                        .sort((a,b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime());

                      if (filteredPay.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                                <Banknote className="w-8 h-8" />
                             </div>
                             <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">No capital injection records in this period</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquid Cash Entries</h4>
                             <button 
                               onClick={() => printHistory('payments', filteredPay)}
                               className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all uppercase tracking-widest shadow-sm shadow-emerald-100"
                             >
                               <Printer className="w-3.5 h-3.5" />
                               Print Ledger List
                             </button>
                           </div>
                          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Deposit Amount</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Channel</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Previous</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Remaining</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Slip</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {filteredPay.map(pay => (
                                    <tr key={pay.id} className="group hover:bg-gray-50/50 transition-colors">
                                      <td className="px-6 py-4 text-[10px] font-bold text-gray-400 group-hover:text-gray-600">{format(safeDate(pay.timestamp), 'dd MMM yy HH:mm')}</td>
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                          <span className="font-black text-emerald-600 text-lg font-mono tracking-tighter">{fC(pay.amount)}</span>
                                          {pay.note && <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[120px]">{pay.note}</span>}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:bg-white transition-colors">{pay.method}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right text-gray-300 line-through font-mono text-xs">{fC(pay.previousDue)}</td>
                                      <td className="px-6 py-4 text-right font-black font-mono text-gray-900">{fC(pay.remainingDue)}</td>
                                      <td className="px-6 py-4 text-right">
                                        <button 
                                          onClick={() => printPaymentReceipt(pay, selectedCustomerForHistory!.name, shopSettings)}
                                          className="p-2.5 bg-gray-50 text-gray-400 hover:bg-white hover:text-emerald-600 hover:shadow-md rounded-xl transition-all"
                                          title="Print Slip"
                                        >
                                          <Printer className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {historyTab === 'edits' && (
                  <div className="space-y-6">
                    {customerLogs.filter(l => l.customerId === selectedCustomerForHistory.id).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                            <Edit className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">No profile modifications logged</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-purple-50 ml-6 space-y-10 py-4">
                        {customerLogs.filter(l => l.customerId === selectedCustomerForHistory.id)
                          .sort((a,b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime())
                          .map((log) => (
                            <div key={log.id} className="relative pl-10">
                              <div className="absolute -left-2.5 top-0 w-5 h-5 bg-white border-4 border-purple-600 rounded-full shadow-sm" />
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(safeDate(log.timestamp), 'dd MMM yyyy - HH:mm')}</span>
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-purple-100">{log.type.replace('_', ' ')}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 tracking-tight">
                                  Action by <span className="text-purple-600">{log.performedBy}</span>
                                </p>
                                <div className="mt-2 bg-gray-50/50 rounded-2xl p-5 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-100 shadow-inner">
                                  {log.oldData && (
                                    <div>
                                      <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest">Previous Record</p>
                                      <div className="space-y-1.5 opacity-60">
                                        {Object.entries(log.oldData).map(([key, val]) => (
                                          <div key={key} className="flex items-center justify-between border-b border-gray-100/50 pb-1">
                                            <span className="text-gray-400 capitalize">{key}:</span> 
                                            <span className="text-gray-600 font-bold max-w-[150px] truncate">{String(val)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {log.newData && (
                                    <div>
                                      <p className="text-[9px] font-black text-purple-400 mb-3 uppercase tracking-widest">New Values</p>
                                      <div className="space-y-1.5">
                                        {Object.entries(log.newData).map(([key, val]) => (
                                          <div key={key} className="flex items-center justify-between border-b border-purple-100/50 pb-1">
                                            <span className="text-gray-400 capitalize">{key}:</span> 
                                            <span className="text-purple-900 font-black max-w-[150px] truncate">{String(val)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4 shadow-inner">
                <button 
                  onClick={() => setSelectedCustomerForHistory(null)}
                  className="px-10 py-4 bg-white border border-gray-200 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all shadow-sm"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaymentModalOpen && selectedCustomerForHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Collect Payment</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Capital Injection: {selectedCustomerForHistory.name}</p>
                  </div>
                  <button onClick={() => setIsPaymentModalOpen(false)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleCollectDue} className="space-y-6">
                  <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 flex items-center justify-between shadow-inner">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Outstanding Balance</p>
                        <p className="text-3xl font-mono font-black text-emerald-900 tracking-tighter">{fC(selectedCustomerForHistory.currentDue)}</p>
                      </div>
                      <Banknote className="w-10 h-10 text-emerald-200" />
                  </div>
  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Collection Amount</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl">{shopSettings.currencySymbol}</div>
                      <input 
                        name="amount" 
                        type="number" 
                        autoFocus
                        max={selectedCustomerForHistory.currentDue}
                        required 
                        className="w-full pl-12 pr-6 py-5 bg-gray-50 border-none rounded-2xl text-2xl font-black font-mono focus:ring-2 focus:ring-emerald-500 shadow-inner outline-none text-emerald-900" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Channel</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['cash', 'bkash', 'nagad', 'bank'].map(m => (
                         <label key={m} className="cursor-pointer group">
                            <input type="radio" name="method" value={m} defaultChecked={m === 'cash'} className="hidden peer" />
                            <div className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-emerald-100 group-hover:bg-gray-100 peer-checked:group-hover:bg-emerald-700">
                              {m}
                            </div>
                         </label>
                      ))}
                    </div>
                  </div>
  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes & References (Optional)</label>
                    <input name="note" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner outline-none" placeholder="e.g. Received via WhatsApp proof..." />
                  </div>
  
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all">
                      Confirm Collection
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DailyClosingView({ sales, expenses, dailyClosings, duePayments, settings, user, onDelete, setNotification }: { 
  sales: Sale[], 
  expenses: Expense[], 
  dailyClosings: DailyClosing[], 
  duePayments: DuePayment[],
  settings: ShopSettings, 
  user?: any, 
  onDelete: (closing: DailyClosing) => void,
  setNotification: (n: { message: string, type: 'success' | 'error' | 'info' } | null) => void 
}) {
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
  
  const todayCollections = duePayments.filter(p => {
    const ts = safeDate(p.timestamp);
    const tsTime = ts.getTime();
    const isSameDay = format(ts, 'yyyy-MM-dd') === today;
    const isAfterLastClosing = !lastClosingDate || tsTime > lastClosingDate;
    return isSameDay && isAfterLastClosing;
  }).reduce((sum, p) => sum + p.amount, 0);

  const cashReceived = todaySales.reduce((sum, s) => sum + s.paidAmount, 0) + todayCollections;
  
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
    
    // Explicitly generate a unique ID for the closing
    const closingId = `closing-${user?.shopId}-${format(new Date(), 'yyyyMMdd')}-${Date.now()}`;
    
    const closingData: any = {
      id: closingId,
      shopId: user?.shopId,
      date: today,
      totalSales,
      cashSales,
      dueSales,
      collections: todayCollections,
      totalExpenses: todayExpenses,
      cashInHand: totalCashInDrawer,
      bkashBalance,
      denominations,
      notes,
      timestamp: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'daily_closings', closingId), closingData);
      setNotification({ message: 'Daily closing recorded successfully!', type: 'success' });
      printDailyClosing(closingData, settings, user);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'daily_closings');
      setNotification({ message: 'Failed to save daily closing. Check internet connection.', type: 'error' });
    }
  };

  const theme = PAGE_THEMES.accounting;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} shadow-sm`}></div>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${theme.bg} text-${theme.primary} rounded-2xl flex items-center justify-center shadow-inner`}>
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Day End Closing</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Cash Reconciliation & Finalization</p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className={`px-8 py-3 bg-gradient-to-r ${theme.gradient} text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-100 flex items-center gap-2`}
        >
          <Plus className="w-4 h-4" /> New Closing
        </motion.button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales', value: totalSales, sub: 'Today', icon: ShoppingCart, color: 'text-gray-900' },
          { label: 'Cash Flow', value: cashReceived, sub: 'Inflow', icon: Banknote, color: 'text-emerald-500' },
          { label: 'Credit Sales', value: dueSales, sub: 'Receivable', icon: CalculatorIcon, color: 'text-rose-500' },
          { label: 'Operational Cost', value: todayExpenses, sub: 'Outflow', icon: DollarSign, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors mb-4 shadow-inner`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-xl font-mono font-black ${stat.color} tracking-tighter`}>{formatCurrency(stat.value)}</p>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Historical Reconciliation Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reconciliation Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Revenue</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Liquidity</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Digital (bKash)</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dailyClosings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs italic">
                    No reconciliation history found
                  </td>
                </tr>
              ) : (
                dailyClosings.sort((a, b) => b.date.localeCompare(a.date)).map(closing => (
                  <tr key={closing.id} className="hover:bg-purple-50/30 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-purple-600 shadow-inner group-hover:bg-white transition-colors">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{format(new Date(closing.date), 'dd MMM yyyy')}</p>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">Audit Status: CLOSED</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className="text-sm font-mono font-black text-gray-900 tracking-tighter">{formatCurrency(closing.totalSales)}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className="text-sm font-mono font-black text-emerald-600 tracking-tighter">{formatCurrency(closing.cashInHand)}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className="text-sm font-mono font-black text-pink-600 tracking-tighter">{formatCurrency(closing.bkashBalance)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => printDailyClosing(closing, settings, user)}
                          className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-white hover:shadow-md rounded-xl transition-all"
                          title="Print Reconciliation Report"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setClosingToDelete(closing)}
                          className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-md rounded-xl transition-all"
                          title="Purge Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {closingToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Purge Record?</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
                You are about to remove the audit for {format(new Date(closingToDelete.date), 'dd MMM yyyy')}.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setClosingToDelete(null)}
                  className="py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Keep It
                </button>
                <button 
                  onClick={() => {
                    onDelete(closingToDelete);
                    setClosingToDelete(null);
                  }}
                  className="py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
                >
                  Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.gradient}`}></div>
              
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Reconcile Daily Ledger</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Audit Date: {format(new Date(), 'dd MMMM yyyy')}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className={`p-3 ${theme.bg} text-${theme.primary} rounded-2xl hover:bg-purple-100 transition-all`}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveClosing} className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 custom-scrollbar">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Banknote className="w-4 h-4 text-purple-600" /> Physical Denominations (Notes)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.keys(denominations).sort((a, b) => Number(b) - Number(a)).map(val => (
                        <div key={val} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner group focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                          <div className="w-12 text-right font-black font-mono text-gray-400 text-sm">{val}</div>
                          <div className="text-gray-300 font-black">×</div>
                          <input 
                            type="number" 
                            min="0"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-black font-mono outline-none shadow-sm"
                            value={denominations[val]}
                            onChange={(e) => setDenominations({...denominations, [val]: Number(e.target.value)})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 bg-purple-600 rounded-[2rem] text-white shadow-xl shadow-purple-200 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-2">Total Physical Cash in Drawer</p>
                      <p className="text-4xl font-mono font-black tracking-tighter">{formatCurrency(totalCashInDrawer)}</p>
                    </div>
                    <Banknote className="absolute right-[-10%] bottom-[-20%] w-40 h-40 opacity-10 rotate-12" />
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <CreditCard className="w-4 h-4 text-pink-600" /> Digital & Virtual Balances
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">bKash Terminal Balance</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-600 font-black text-lg">{settings.currencySymbol}</div>
                          <input 
                            type="number" 
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-black font-mono focus:ring-2 focus:ring-pink-500 shadow-inner outline-none"
                            value={bkashBalance}
                            onChange={(e) => setBkashBalance(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observational Notes</label>
                        <textarea 
                          className="w-full px-6 py-5 bg-gray-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-purple-500 shadow-inner outline-none h-32 resize-none"
                          placeholder="Note any discrepancies, missed entries, or staff remarks..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner space-y-4">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Reconciliation Summary</h5>
                    {[
                      { label: 'Gross Revenue', value: totalSales, color: 'text-gray-900' },
                      { label: 'Cash Inflow', value: cashReceived, color: 'text-emerald-600' },
                      { label: 'Expense Outflow', value: todayExpenses, color: 'text-rose-600', prefix: '-' },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center pb-2 border-b border-gray-200/50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                        <span className={`text-md font-mono font-black ${row.color}`}>{row.prefix || ''}{formatCurrency(row.value)}</span>
                      </div>
                    ))}
                    <div className="pt-4 flex justify-between items-center">
                      <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Expected Liquidity:</span>
                      <div className="text-right">
                        <span className="text-2xl font-mono font-black text-purple-600 tracking-tighter">{formatCurrency(cashReceived - todayExpenses)}</span>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Physical + Digital Flow</p>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className={`w-full py-5 bg-gradient-to-r ${theme.gradient} text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-200 hover:shadow-purple-300 transition-all transform hover:-translate-y-1`}>
                    Archive & Close Ledger
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
