import React, { useState, useEffect, useMemo } from 'react';
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
  X, 
  Menu,
  LogOut, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  Box, 
  User as UserIcon,
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
  Camera
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  handleFirestoreError
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
}

interface Product {
  id: string;
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
  items: { productId: string; productName: string; quantity: number; price: number; originalPrice: number }[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'due';
  timestamp: any;
  sellerId: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  fatherName?: string;
  houseName?: string;
  points: number;
  totalSpent: number;
  currentDue: number;
}

interface Category {
  id: string;
  name: string;
}

// --- Utilities ---
const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
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

const printInvoice = (sale: Sale, settings: ShopSettings) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = sale.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.price || 0).toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice #${sale.id.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 100px; margin-bottom: 10px; }
          .shop-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .shop-info { font-size: 12px; color: #666; }
          .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .totals { text-align: right; }
          .total-row { font-weight: bold; font-size: 16px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.logoBase64 ? `<img src="${settings.logoBase64}" class="logo" />` : ''}
          <div class="shop-name">${settings.name}</div>
          <div class="shop-info">${settings.address}</div>
          ${settings.phone ? `<div class="shop-info">Phone: ${settings.phone}</div>` : ''}
        </div>
        <div class="invoice-meta">
          <div>
            <strong>Invoice:</strong> #${sale.id.slice(-6).toUpperCase()}<br>
            <strong>Customer:</strong> ${sale.customerName || 'Walk-in'}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${format(sale.timestamp.toDate(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <table>
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #eee;">Product</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #eee;">Qty</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #eee;">Price</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #eee;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div>Subtotal: TK ${(sale.totalAmount || 0).toFixed(2)}</div>
          <div>Discount: TK ${(sale.discount || 0).toFixed(2)}</div>
          <div class="total-row">Grand Total: TK ${(sale.finalAmount || 0).toFixed(2)}</div>
          <div style="margin-top: 10px;">Paid: TK ${(sale.paidAmount || 0).toFixed(2)}</div>
          <div style="color: #dc2626;">Due: TK ${(sale.dueAmount || 0).toFixed(2)}</div>
        </div>
        <div class="footer">
          Thank you for shopping with us!<br>
          Powered by ShopMaster
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const sendWhatsAppInvoice = (sale: Sale, settings: ShopSettings) => {
  if (!sale.customerPhone) return;
  
  const cleanPhone = sale.customerPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `880${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
  
  const itemsText = sale.items.map(item => `• ${item.productName}: ${item.quantity} x ${item.price} = ${item.price * item.quantity}`).join('\n');
  
  const message = `*Invoice from ${settings.name}*\n` +
    `Invoice: #${sale.id.slice(-6).toUpperCase()}\n` +
    `Date: ${format(sale.timestamp.toDate(), 'dd/MM/yyyy')}\n\n` +
    `*Items:*\n${itemsText}\n\n` +
    `*Total:* TK ${sale.finalAmount}\n` +
    `*Paid:* TK ${sale.paidAmount}\n` +
    `*Due:* TK ${sale.dueAmount}\n\n` +
    `Thank you for your purchase!`;

  window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
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
  doc.text(`Invoice: #${sale.id.slice(-6).toUpperCase()}`, 20, 50);
  doc.text(`Date: ${format(sale.timestamp.toDate(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 20, 50, { align: 'right' });
  doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 20, 58);
  if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`, 20, 64);

  // Table
  const tableData = sale.items.map(item => [
    item.productName,
    item.quantity.toString(),
    (item.price || 0).toFixed(2),
    ((item.price || 0) * (item.quantity || 0)).toFixed(2)
  ]);

  (doc as any).autoTable({
    startY: 75,
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.text(`Subtotal: TK ${(sale.totalAmount || 0).toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });
  doc.text(`Discount: TK ${(sale.discount || 0).toFixed(2)}`, pageWidth - 20, finalY + 6, { align: 'right' });
  doc.setFontSize(14);
  doc.text(`Grand Total: TK ${(sale.finalAmount || 0).toFixed(2)}`, pageWidth - 20, finalY + 14, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`Paid: TK ${(sale.paidAmount || 0).toFixed(2)}`, pageWidth - 20, finalY + 20, { align: 'right' });
  doc.text(`Due: TK ${(sale.dueAmount || 0).toFixed(2)}`, pageWidth - 20, finalY + 26, { align: 'right' });

  doc.text('Thank you for shopping with us!', pageWidth / 2, finalY + 40, { align: 'center' });

  doc.save(`Invoice_${sale.id.slice(-6)}.pdf`);
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
                <input name="name" defaultValue={settings.name} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input name="phone" defaultValue={settings.phone} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea name="address" defaultValue={settings.address} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (Optional)</label>
                <input name="logoUrl" defaultValue={settings.logoUrl} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Sender Number (Optional)</label>
                <input name="whatsappSender" defaultValue={settings.whatsappSender} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="88017..." />
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
                        onClick={() => onDeleteUser(u.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
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
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Check local storage for session
  useEffect(() => {
    const savedUser = localStorage.getItem('shopmaster_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    name: 'Bismillah Store',
    address: 'Your Shop Address',
    phone: '01XXXXXXXXX'
  });
  
  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Real-time Data Sync
  useEffect(() => {
    if (!user) return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => console.error("Products sync error", err));

    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    }, (err) => console.error("Sales sync error", err));

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => console.error("Customers sync error", err));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (err) => console.error("Categories sync error", err));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAppUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
    }, (err) => console.error("Users sync error", err));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'shop'), (snapshot) => {
      if (snapshot.exists()) {
        setShopSettings(snapshot.data() as ShopSettings);
      }
    }, (err) => console.error("Settings sync error", err));

    return () => {
      unsubProducts();
      unsubSales();
      unsubCustomers();
      unsubCategories();
      unsubUsers();
      unsubSettings();
    };
  }, [user]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    // Check against appUsers collection
    const foundUser = appUsers.find(u => u.username === username && u.password === password);

    if (foundUser) {
      const userData = { uid: foundUser.id, email: `${foundUser.username}@shop.com`, displayName: foundUser.displayName, role: foundUser.role };
      setUser(userData);
      localStorage.setItem('shopmaster_user', JSON.stringify(userData));
    } else if (username === 'Admin' && password === 'Admin') {
      // Fallback for initial setup if no users exist
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
        const newPrice = calculateItemPrice(item, newQty);
        return { ...item, quantity: newQty, discountedPrice: newPrice };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0), [cart]);
  const finalTotal = Math.max(0, cartTotal - discount);

  const [checkoutData, setCheckoutData] = useState({
    customerId: '',
    paidAmount: 0,
    paymentMethod: 'cash' as 'cash' | 'due'
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const selectedCustomer = customers.find(c => c.id === checkoutData.customerId);
      const dueAmount = checkoutData.paymentMethod === 'due' ? finalTotal : Math.max(0, finalTotal - checkoutData.paidAmount);

      // Revert old sale effects if editing
      if (editingSale) {
        for (const item of editingSale.items) {
          const productRef = doc(db, 'products', item.productId);
          const product = products.find(p => p.id === item.productId);
          if (product) {
            await updateDoc(productRef, { stock: product.stock + item.quantity });
          }
        }
        if (editingSale.customerId) {
          const customerRef = doc(db, 'customers', editingSale.customerId);
          const customer = customers.find(c => c.id === editingSale.customerId);
          if (customer) {
            await updateDoc(customerRef, {
              currentDue: Math.max(0, (customer.currentDue || 0) - editingSale.dueAmount),
              totalSpent: Math.max(0, (customer.totalSpent || 0) - editingSale.finalAmount)
            });
          }
        }
      }

      const saleData: Omit<Sale, 'id'> = {
        customerId: checkoutData.customerId || undefined,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.discountedPrice,
          originalPrice: item.originalPrice
        })),
        totalAmount: cartTotal,
        discount: discount,
        finalAmount: finalTotal,
        paidAmount: checkoutData.paymentMethod === 'cash' ? checkoutData.paidAmount : 0,
        dueAmount: dueAmount,
        paymentMethod: checkoutData.paymentMethod,
        timestamp: editingSale ? editingSale.timestamp : new Date(),
        sellerId: user.uid
      };

      let finalSale: Sale;
      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
        finalSale = { ...saleData, id: editingSale.id } as Sale;
      } else {
        const docRef = await addDoc(collection(db, 'sales'), saleData);
        finalSale = { ...saleData, id: docRef.id } as Sale;
      }
      
      // Apply new sale effects
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const product = products.find(p => p.id === item.id);
        if (product) {
          // Note: Stock might be slightly off if multiple updates happen fast, 
          // but for this app it's acceptable.
          await updateDoc(productRef, { stock: Math.max(0, product.stock - item.quantity) });
        }
      }

      if (checkoutData.customerId) {
        const customerRef = doc(db, 'customers', checkoutData.customerId);
        const customer = customers.find(c => c.id === checkoutData.customerId);
        if (customer) {
          await updateDoc(customerRef, {
            currentDue: (customer.currentDue || 0) + dueAmount,
            totalSpent: (customer.totalSpent || 0) + finalTotal
          });
        }
      }

      setLastSale(finalSale);
      setNotification({ message: editingSale ? "Order updated successfully!" : "Order completed successfully!", type: 'success' });
      setCart([]);
      setDiscount(0);
      setCheckoutData({ customerId: '', paidAmount: 0, paymentMethod: 'cash' });
      setEditingSale(null);

      // Receipt options
      if (confirm("Order successful! Print receipt?")) {
        printInvoice(finalSale, shopSettings);
      } else if (saleData.customerPhone && confirm("Send receipt via WhatsApp?")) {
        sendWhatsAppInvoice(finalSale, shopSettings);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (!confirm("Are you sure you want to delete this invoice? This will revert stock and customer balance.")) return;
    
    try {
      for (const item of sale.items) {
        const productRef = doc(db, 'products', item.productId);
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateDoc(productRef, { stock: product.stock + item.quantity });
        }
      }

      if (sale.customerId) {
        const customerRef = doc(db, 'customers', sale.customerId);
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
          await updateDoc(customerRef, {
            currentDue: Math.max(0, (customer.currentDue || 0) - sale.dueAmount),
            totalSpent: Math.max(0, (customer.totalSpent || 0) - sale.finalAmount)
          });
        }
      }

      await deleteDoc(doc(db, 'sales', sale.id));
      setNotification({ message: "Invoice deleted successfully", type: 'success' });
    } catch (error) {
      console.error("Delete sale error", error);
      setNotification({ message: "Failed to delete invoice", type: 'error' });
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
      paidAmount: sale.paidAmount,
      paymentMethod: sale.paymentMethod
    });
    setNotification({ message: `Editing Invoice #${sale.id.slice(-6).toUpperCase()}`, type: 'info' });
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
    try {
      await addDoc(collection(db, 'users'), newUser);
      setNotification({ message: 'User added successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setNotification({ message: 'User deleted successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
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
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 truncate">{shopSettings.name}</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin'] },
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
                onViewProductHistory={(p) => {
                  setSelectedProductForHistory(p);
                }}
              />
            )}
            {activeTab === 'pos' && (
              <POS 
                products={products} 
                cart={cart} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
                updateCartQuantity={updateCartQuantity}
                handleCheckout={handleCheckout}
                discount={discount}
                setDiscount={setDiscount}
                cartTotal={cartTotal}
                finalTotal={finalTotal}
                customers={customers}
                checkoutData={checkoutData}
                setCheckoutData={setCheckoutData}
                onScanClick={() => setIsScannerOpen(true)}
                editingSale={editingSale}
                onCancelEdit={() => {
                  setEditingSale(null);
                  setCart([]);
                  setDiscount(0);
                  setCheckoutData({ customerId: '', paidAmount: 0, paymentMethod: 'cash' });
                }}
                settings={shopSettings}
              />
            )}
            {activeTab === 'inventory' && (
              <Inventory 
                products={products} 
                categories={categories} 
                onViewHistory={(p) => {
                  setSelectedProductForHistory(p);
                }}
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
            {activeTab === 'customers' && <Customers customers={customers} sales={sales} />}
            {activeTab === 'settings' && (
              <SettingsPanel 
                settings={shopSettings} 
                onSaveSettings={handleSaveSettings} 
                users={appUsers}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
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
                    <p className="text-sm text-gray-500 pt-2">Invoice: #{lastSale.id.slice(-6).toUpperCase()}</p>
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
                        <span className="text-gray-900">{lastSale.customerPhone}</span>
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
            onClose={() => setSelectedProductForHistory(null)} 
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

// --- Sub-components ---

function BarcodeScanner({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        videoConstraints: {
          facingMode: "environment"
        }
      },
      /* verbose= */ false
    );
    scanner.render(onScan, (err) => {
      // console.warn(err);
    });

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
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

function Dashboard({ products, sales, customers, onViewProductHistory }: { products: Product[], sales: Sale[], customers: Customer[], onViewProductHistory: (p: Product) => void }) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const now = new Date();

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = s.timestamp.toDate();
      if (period === 'day') return format(saleDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
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
    const todaySales = sales.filter(s => format(s.timestamp.toDate(), 'yyyy-MM-dd') === today);
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
        const saleDate = s.timestamp.toDate();
        if (period === 'year') return format(saleDate, 'MMM') === label;
        return format(saleDate, 'MMM dd') === label;
      });
      return {
        name: label,
        sales: periodSales.reduce((sum, s) => sum + s.finalAmount, 0),
        cash: periodSales.reduce((sum, s) => sum + s.paidAmount, 0),
        due: periodSales.reduce((sum, s) => sum + s.dueAmount, 0)
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
        <StatCard icon={AlertCircle} label="Total Market Due" value={formatCurrency(totalMarketDue)} color="bg-red-50 text-red-600" />
        <StatCard icon={CheckCircle2} label={`${period.charAt(0).toUpperCase() + period.slice(1)} Cash`} value={formatCurrency(stats.periodCash)} color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label={`${period.charAt(0).toUpperCase() + period.slice(1)} Due`} value={formatCurrency(stats.periodDue)} color="bg-amber-50 text-amber-600" />
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
          <h3 className="text-lg font-bold mb-6">Sales Overview (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="cash" name="Cash" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="due" name="Due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
                    <p className="text-xs text-gray-500">{format(sale.timestamp.toDate(), 'hh:mm a')}</p>
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

function ProductHistory({ product, sales, onClose }: { product: Product, sales: Sale[], onClose: () => void }) {
  const productSales = sales.filter(s => s.items.some(item => item.productId === product.id));
  
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
                            <p className="text-xs font-bold text-gray-400">{format(sale.timestamp.toDate(), 'MMM dd')}</p>
                            <p className="text-[10px] text-gray-400">{format(sale.timestamp.toDate(), 'yyyy')}</p>
                          </div>
                          <div className="w-px h-8 bg-gray-200" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{sale.customerName || 'Walk-in'}</p>
                            <p className="text-xs text-gray-500">Quantity: {item?.quantity} {product.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">TK {(item?.quantity || 0) * (item?.price || 0)}</p>
                          <p className="text-[10px] text-gray-400">Invoice: #{sale.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    );
                  })}
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
        setDisplay(eval(display).toString());
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

function POS({ 
  products, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
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
  settings
}: any) {

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const filteredProducts = products.filter((p: Product) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  const selectedCustomer = customers.find((c: Customer) => c.id === checkoutData.customerId);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[calc(100vh-8rem)]"
    >
      <div className="lg:col-span-2 flex flex-col space-y-6 min-h-[500px] lg:min-h-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
              title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
            >
              {viewMode === 'grid' ? <Menu className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
            </button>
            <button 
              onClick={onScanClick}
              className="px-4 py-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100"
            >
              <Scan className="w-5 h-5" />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <select 
              className="w-full sm:w-64 px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              value={checkoutData.customerId}
              onChange={(e) => setCheckoutData({ ...checkoutData, customerId: e.target.value })}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c: Customer) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 lg:overflow-y-auto pb-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((product: Product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <Package className="w-10 h-10 text-gray-300 group-hover:text-indigo-300" />
                  </div>
                  <p className="font-bold text-gray-900 truncate">{product.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-indigo-600 font-bold">{formatCurrency(product.price)}</span>
                    <span className="text-[10px] text-gray-400">/{product.unit}</span>
                  </div>
                  {product.expiryDate && (
                    <p className="text-[10px] text-amber-600 mt-1">Exp: {product.expiryDate}</p>
                  )}
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

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
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
              Editing Invoice: #{editingSale.id.slice(-6).toUpperCase()}
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item: CartItem) => (
              <div key={item.id} className="flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.discountedPrice < item.originalPrice ? (
                      <span className="line-through mr-1 text-gray-300">{formatCurrency(item.originalPrice)}</span>
                    ) : null}
                    {formatCurrency(item.discountedPrice)} / {item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <button onClick={() => updateCartQuantity(item.id, -0.25)} className="p-1 hover:bg-white rounded shadow-sm transition-all"><Minus className="w-3 h-3" /></button>
                  <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 0.25)} className="p-1 hover:bg-white rounded shadow-sm transition-all"><Plus className="w-3 h-3" /></button>
                </div>
                <div className="text-right min-w-[70px]">
                  <p className="font-bold text-gray-900">{formatCurrency(item.discountedPrice * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Discount</span>
              <input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-20 bg-white border border-gray-200 rounded px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-indigo-600">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <button 
                onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: 'cash' })}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${checkoutData.paymentMethod === 'cash' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              >Cash</button>
              <button 
                onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: 'due' })}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${checkoutData.paymentMethod === 'due' ? 'bg-amber-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              >Due</button>
            </div>
            
            {checkoutData.paymentMethod === 'cash' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Paid Amount</label>
                <input 
                  type="number" 
                  value={checkoutData.paidAmount}
                  onChange={(e) => setCheckoutData({ ...checkoutData, paidAmount: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {checkoutData.paidAmount < finalTotal && (
                  <p className="text-[10px] text-amber-600 mt-1">Remaining TK {finalTotal - checkoutData.paidAmount} will be added to Due</p>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-4 text-white rounded-2xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 ${editingSale ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {editingSale ? 'Update Order' : 'Complete Order'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Inventory({ products, categories, onViewHistory }: { products: Product[], categories: Category[], onViewHistory: (p: Product) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct?.imageUrl) {
      setProductImage(editingProduct.imageUrl);
    } else {
      setProductImage(null);
    }
  }, [editingProduct]);

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
      cost: Number(formData.get('cost')),
      stock: Number(formData.get('stock')),
      unit: formData.get('unit') as string,
      barcode: formData.get('barcode') as string,
      department: formData.get('department') as string,
      warehouse: formData.get('warehouse') as string,
      imageUrl: imageUrl
    };

    try {
      // Add category if it doesn't exist
      if (productData.category && !categories.find(c => c.name === productData.category)) {
        await addDoc(collection(db, 'categories'), { name: productData.category });
      }

      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setProductImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
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
          <h2 className="text-3xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-500">Manage your products and stock levels.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setProductImage(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Dept/Wh</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
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
                        <p className="text-xs text-gray-500">Barcode: {product.barcode || 'N/A'}</p>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {product.stock} {product.unit || 'pcs'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input name="category" defaultValue={editingProduct?.category} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost ($)</label>
                    <input name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Level</label>
                    <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <select name="unit" defaultValue={editingProduct?.unit} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="unit">Unit/Piece</option>
                      <option value="kg">KG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input name="expiryDate" type="date" defaultValue={editingProduct?.expiryDate} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location (Shelf/Aisle)</label>
                    <input name="location" defaultValue={editingProduct?.location} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
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
    </motion.div>
  );
}

function SalesHistory({ sales, onEdit, onDelete, settings }: { sales: Sale[], onEdit: (s: Sale) => void, onDelete: (s: Sale) => void, settings: ShopSettings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
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
                    <p className="font-semibold text-gray-900">{format(sale.timestamp.toDate(), 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-gray-500">{format(sale.timestamp.toDate(), 'hh:mm a')}</p>
                    <p className="text-[10px] font-mono text-indigo-400">#{sale.id.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{sale.customerName || 'Walk-in'}</p>
                    <p className="text-xs text-gray-500">{sale.customerPhone || 'N/A'}</p>
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
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => printInvoice(sale, settings)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => downloadInvoicePDF(sale, settings)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {sale.customerPhone && (
                        <button 
                          onClick={() => sendWhatsAppInvoice(sale, settings)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Send via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => onEdit(sale)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(sale)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Order"
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
                    <p className="text-lg font-bold text-gray-900">#{selectedSale.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="text-lg font-bold text-gray-900">{format(selectedSale.timestamp.toDate(), 'MMM dd, yyyy hh:mm a')}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-900 mb-2">Customer Info</p>
                  <p className="text-gray-700">{selectedSale.customerName || 'Walk-in'}</p>
                  {selectedSale.customerPhone && <p className="text-sm text-gray-500">{selectedSale.customerPhone}</p>}
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

function Customers({ customers, sales }: { customers: Customer[], sales: Sale[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

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
      points: Number(formData.get('points') || 0),
      totalSpent: Number(formData.get('totalSpent') || 0),
    };

    try {
      if (editingCustomer?.id) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
      } else {
        await addDoc(collection(db, 'customers'), customerData);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative group">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => openWhatsApp(customer.phone)}
                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                title="WhatsApp Message"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{customer.name}</h3>
                <p className="text-xs text-gray-500">{customer.phone || 'No phone'}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              {customer.fatherName && (
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="font-bold text-gray-400">Father:</span> {customer.fatherName}
                </p>
              )}
              {customer.houseName && (
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="font-bold text-gray-400">House:</span> {customer.houseName}
                </p>
              )}
              {customer.address && (
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="font-bold text-gray-400">Addr:</span> {customer.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <button 
                onClick={() => setSelectedCustomerForHistory(customer)}
                className="text-left"
              >
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Current Due</p>
                <p className={`font-bold ${customer.currentDue > 0 ? 'text-red-600' : 'text-emerald-600'} flex items-center gap-1`}>
                  TK {customer.currentDue || 0}
                  {customer.currentDue > 0 && <ArrowRight className="w-3 h-3" />}
                </p>
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Total Spent</p>
                <p className="font-bold text-gray-900">TK {customer.totalSpent || 0}</p>
              </div>
            </div>
          </div>
        ))}
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
                  <input name="name" defaultValue={editingCustomer?.name} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input name="phone" defaultValue={editingCustomer?.phone} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
                  <input name="fatherName" defaultValue={editingCustomer?.fatherName} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">House Name/No</label>
                  <input name="houseName" defaultValue={editingCustomer?.houseName} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input name="address" defaultValue={editingCustomer?.address} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Due (TK)</label>
                  <input name="currentDue" type="number" defaultValue={editingCustomer?.currentDue || 0} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
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
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedCustomerForHistory.name} Due History</h3>
                    <p className="text-xs text-gray-500">Total Outstanding: TK {selectedCustomerForHistory.currentDue}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomerForHistory(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {sales.filter(s => s.customerId === selectedCustomerForHistory.id && s.dueAmount > 0).length === 0 ? (
                    <p className="text-center text-gray-400 py-8 italic">No active dues found for this customer.</p>
                  ) : (
                    sales.filter(s => s.customerId === selectedCustomerForHistory.id && s.dueAmount > 0).map(sale => (
                      <div key={sale.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs font-bold text-gray-400">{format(sale.timestamp.toDate(), 'MMM dd')}</p>
                            <p className="text-[10px] text-gray-400">{format(sale.timestamp.toDate(), 'hh:mm a')}</p>
                          </div>
                          <div className="w-px h-8 bg-red-100" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">Invoice #{sale.id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-gray-500">Total: TK {sale.finalAmount}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-red-600">TK {sale.dueAmount}</p>
                          <p className="text-[10px] text-red-400">Remaining Due</p>
                        </div>
                      </div>
                    ))
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
