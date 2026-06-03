import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ArrowLeft, 
  ChevronRight, 
  ShoppingBag, 
  Receipt, 
  History, 
  Globe, 
  Building2, 
  Phone, 
  User, 
  Barcode, 
  Download, 
  Printer, 
  MapPin, 
  Sparkles,
  SearchCode,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, addDoc, getDocs, query, where, doc, getDoc, onSnapshot } from '../firebase';
import ReactBarcode from 'react-barcode';

interface CustomerPortalProps {
  onBack: () => void;
  lang: 'en' | 'bn' | 'ar';
}

export function CustomerPortal({ onBack, lang }: CustomerPortalProps) {
  const isBn = lang === 'bn';

  // UI Stages: 'shop_selection' | 'customer_login' | 'dashboard'
  const [stage, setStage] = useState<'shop_selection' | 'customer_login' | 'dashboard'>('shop_selection');
  
  // Lists fetched from DB
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [searchShopQuery, setSearchShopQuery] = useState('');
  
  // Auth Form
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active User View Tabs: 'shop' | 'invoice_tracker' | 'orders'
  const [activeTab, setActiveTab] = useState<'shop' | 'invoice_tracker' | 'orders'>('shop');

  // Products under selected shop
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Cart configuration
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Invoice Lookup state
  const [invoiceSearchId, setInvoiceSearchId] = useState('');
  const [lookupSale, setLookupSale] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [searchingInvoice, setSearchingInvoice] = useState(false);

  // Customer order history
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'shops'));
        const shopList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShops(shopList);
      } catch (err) {
        console.error("Error fetching shops for customer:", err);
      }
    };
    fetchShops();
  }, []);

  // Fetch products and categories when shop is selected
  useEffect(() => {
    if (!selectedShop) return;

    // Load Categories
    const unsubCat = onSnapshot(query(collection(db, 'categories'), where('shopId', '==', selectedShop.id)), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Load Products
    const unsubProd = onSnapshot(query(collection(db, 'products'), where('shopId', '==', selectedShop.id)), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, [selectedShop]);

  // Sync historical orders for this phone of this shop
  useEffect(() => {
    if (!selectedShop || !currentCustomer) return;

    const q = query(
      collection(db, 'customer_orders'), 
      where('shopId', '==', selectedShop.id),
      where('customerPhone', '==', currentCustomer.phone)
    );

    const unsubOrders = onSnapshot(q, (snap) => {
      setCustomerOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubOrders();
  }, [selectedShop, currentCustomer]);

  const handleSelectShop = (shop: any) => {
    setSelectedShop(shop);
    setStage('customer_login');
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!phone.trim()) return;

    try {
      // Look up in database customers collection under selected shop
      const q = query(
        collection(db, 'customers'), 
        where('shopId', '==', selectedShop.id), 
        where('phone', '==', phone.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Customer exists
        const custDoc = querySnapshot.docs[0];
        setCurrentCustomer({ id: custDoc.id, ...custDoc.data() });
        setStage('dashboard');
      } else {
        // Customer not found, ask to register
        setIsNewCustomer(true);
      }
    } catch (err) {
      console.error(err);
      setLoginError(isBn ? "লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "Login failed. Please try again.");
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !selectedShop) return;

    try {
      const newCustomer = {
        name: customerName.trim(),
        phone: phone.trim(),
        shopId: selectedShop.id,
        currentDue: 0,
        points: 0,
        totalSpent: 0,
        serialNumber: Date.now(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'customers'), newCustomer);
      setCurrentCustomer({ id: docRef.id, ...newCustomer });
      setStage('dashboard');
      setIsNewCustomer(false);
    } catch (err) {
      console.error(err);
      setLoginError(isBn ? "রেজিস্ট্রেশন ব্যর্থ হয়েছে।" : "Registration failed.");
    }
  };

  // Cart operations
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, val: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + val;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((tot, item) => tot + (item.product.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !currentCustomer || !selectedShop) return;
    setPlacingOrder(true);
    try {
      const orderData = {
        shopId: selectedShop.id,
        customerPhone: currentCustomer.phone,
        customerName: currentCustomer.name,
        customerId: currentCustomer.id,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          unit: item.product.unit || 'unit',
          imageUrl: item.product.imageUrl || ''
        })),
        totalAmount: cartTotal,
        status: 'pending', // pending, approved, cancelled
        notes: orderNotes.trim(),
        timestamp: new Date().toISOString(),
        orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000)
      };

      await addDoc(collection(db, 'customer_orders'), orderData);
      setOrderSuccessId(orderData.orderNumber);
      setCart([]);
      setOrderNotes('');
      setActiveTab('orders'); // Jump to histories
    } catch (err) {
      console.error(err);
      alert(isBn ? "অর্ডার সাবমিট করতে সমস্যা হয়েছে।" : "Order submission failed.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const lookupInvoice = async () => {
    if (!invoiceSearchId.trim() || !selectedShop) return;
    setSearchingInvoice(true);
    setLookupError(null);
    setLookupSale(null);

    try {
      // Find invoice matches inside sales collection of selectedShop where standard fields (id, or invoice ID) matches.
      const q = query(
        collection(db, 'sales'),
        where('shopId', '==', selectedShop.id)
      );
      const querySnapshot = await getDocs(q);
      
      const searchKey = invoiceSearchId.trim().toLowerCase();
      const matchedSaleDoc = querySnapshot.docs.find(docSnapshot => {
        const id = docSnapshot.id.toLowerCase();
        const data = docSnapshot.data();
        const customerPhoneSpec = (data.customerPhone || '').toLowerCase();
        return id === searchKey || id.endsWith(searchKey) || id.includes(searchKey);
      });

      if (matchedSaleDoc) {
        setLookupSale({ id: matchedSaleDoc.id, ...matchedSaleDoc.data() });
      } else {
        setLookupError(isBn ? "দুঃখিত, এই ইনভয়েস নম্বরটি পাওয়া যায়নি।" : "Sorry, this invoice number was not found.");
      }
    } catch (err) {
      console.error(err);
      setLookupError("Error fetching invoice.");
    } finally {
      setSearchingInvoice(false);
    }
  };

  // Filtered store products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchProductQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredShops = shops.filter(s => {
    return s.name?.toLowerCase().includes(searchShopQuery.toLowerCase()) || 
           s.address?.toLowerCase().includes(searchShopQuery.toLowerCase()) ||
           s.shopCode?.includes(searchShopQuery);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              if (stage === 'dashboard') {
                setStage('customer_login');
              } else if (stage === 'customer_login') {
                setStage('shop_selection');
              } else {
                onBack();
              }
            }}
            className="p-2.5 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                {isBn ? "গ্রাহক সেবা পোর্টাল" : "Customer Portal"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">
              {stage === 'dashboard' && selectedShop ? selectedShop.name : (isBn ? "আমাদের সেবা সমূহ" : "Access Corporate Service")}
            </h1>
          </div>
        </div>

        {/* Selected store badge */}
        {selectedShop && stage !== 'shop_selection' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{selectedShop.name}</span>
          </div>
        )}

        {/* Merchant Login CTA on shop selection */}
        {stage === 'shop_selection' && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black transition-all border border-indigo-100/50"
          >
            <User className="w-3.5 h-3.5" />
            <span>{isBn ? "মার্চেন্ট লগইন" : "Merchant Login"}</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        
        {/* STAGE 1: SHOP SELECTION */}
        {stage === 'shop_selection' && (
          <div className="max-w-xl mx-auto w-full py-12 flex flex-col">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-100 mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                {isBn ? "দোকান নির্বাচন করুন" : "Choose Your Store"}
              </h2>
              <p className="text-gray-500 mt-2.5 text-sm md:text-base">
                {isBn 
                  ? "যে দোকান থেকে সার্ভিস বা কেনাকাটা করতে চান, সেটি লিস্ট থেকে বেছে নিন।" 
                  : "Select the specific corporate branch to start ordering or tracking products."}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder={isBn ? "দোকানের নাম, ঠিকানা, বা শপ কোড লিখুন..." : "Search shop name, address, or code..."}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 outline-none text-gray-900 shadow-sm focus:border-indigo-500 transition-colors font-medium text-sm"
                value={searchShopQuery}
                onChange={(e) => setSearchShopQuery(e.target.value)}
              />
            </div>

            {/* Shop List */}
            <div className="space-y-4">
              {filteredShops.length === 0 ? (
                <div className="p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-sm text-gray-400 font-medium">
                  {isBn ? "কোনো দোকান পাওয়া যায়নি।" : "No stores matching search found."}
                </div>
              ) : (
                filteredShops.map((shop) => (
                  <motion.button
                    key={shop.id}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectShop(shop)}
                    className="w-full p-5 bg-white border border-gray-100 hover:border-indigo-200 rounded-2xl text-left flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {shop.name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-base">{shop.name}</h3>
                          {shop.shopCode && (
                            <span className="bg-gray-100 text-gray-600 text-xs font-mono font-black px-2 py-0.5 rounded-full border border-gray-200">
                              #{shop.shopCode}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-400 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{shop.address || (isBn ? 'ঠিকানা দেয়া নেই' : 'No address provided')}</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STAGE 2: CUSTOMER LOGIN & REGISTER */}
        {stage === 'customer_login' && (
          <div className="max-w-md mx-auto w-full py-12">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                  <User className="w-6 h-6" />
                </div>

                {!isNewCustomer ? (
                  <>
                    <h2 className="text-2xl font-black text-gray-950 tracking-tight leading-none mb-2">
                      {isBn ? "কাস্টমার লগইন" : "Identify Yourself"}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium mb-6">
                      {isBn ? "মোবাইল নম্বর দিয়ে আপনার পূর্বের খতিয়ান ও নতুন অর্ডার করুন।" : "Enter your mobile phone number to find your record or submit new orders."}
                    </p>

                    <form onSubmit={handleCustomerLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-600 uppercase tracking-widest">{isBn ? "মোবাইল নম্বর" : "Mobile Phone Number"}</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input 
                            type="text"
                            required
                            placeholder="01xxxxxxxxx"
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none text-gray-900 font-bold"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      {loginError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group mt-6"
                      >
                        <span>{isBn ? "এগিয়ে যান" : "Proceed & Match"}</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-gray-950 tracking-tight leading-none mb-2">
                      {isBn ? "নতুন অ্যাকাউন্ট তৈরি" : "Register Profile"}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium mb-6">
                      {isBn 
                        ? `এই নম্বর (${phone}) দিয়ে কোনো কাস্টমার খতিয়ান খুঁজে পাওয়া যায়নি। এক ক্লিকে নতুন রেজিস্ট্রেশন করুন!` 
                        : "No profile found for this mobile. Quick register as a customer of this business."}
                    </p>

                    <form onSubmit={handleCustomerRegister} className="space-y-4">
                      <div className="space-y-1.5 focus-within:text-indigo-600">
                        <label className="text-xs font-black uppercase tracking-widest text-inherit">{isBn ? "আপনার নাম" : "Your Name"}</label>
                        <input 
                          type="text"
                          required
                          placeholder={isBn ? "যেমন: আব্দুর রহমান" : "e.g., John Doe"}
                          className="w-full px-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all outline-none text-gray-900 font-bold"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-600 uppercase tracking-widest">{isBn ? "মোবাইল নম্বর" : "Mobile Phone Number"}</label>
                        <input 
                          type="text"
                          disabled
                          className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-500 font-bold outline-none border border-transparent"
                          value={phone}
                        />
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button 
                          type="button"
                          onClick={() => setIsNewCustomer(false)}
                          className="flex-1 h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors"
                        >
                          {isBn ? "পিছনে যান" : "Go Back"}
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100"
                        >
                          {isBn ? "অ্যাকাউন্ট খুলুন" : "Create Profile"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: BRAND CUSTOMER DASHBOARD */}
        {stage === 'dashboard' && currentCustomer && (
          <div className="flex flex-col gap-6">
            
            {/* Customer Header Block / Summary Card */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none">{currentCustomer.name}</h2>
                  <p className="text-indigo-200 font-bold text-sm mt-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{currentCustomer.phone}</span>
                  </p>
                </div>
              </div>

              {/* Financial Status of Customer */}
              <div className="relative z-10 flex items-center gap-6 divide-x divide-white/10">
                <div className="text-left md:text-right">
                  <p className="text-indigo-200/80 text-xs uppercase tracking-widest font-black">{isBn ? "পূর্বের মোট বকেয়া" : "Remaining Total Due"}</p>
                  <p className="text-3xl font-black mt-1">
                    {currentCustomer.currentDue || 0} <span className="text-sm font-bold text-indigo-200">TK</span>
                  </p>
                </div>
                {currentCustomer.points !== undefined && (
                  <div className="pl-6 text-left md:text-right">
                    <p className="text-indigo-200/80 text-xs uppercase tracking-widest font-black">{isBn ? "অর্জিত পয়েন্ট" : "Earned Points"}</p>
                    <p className="text-2xl font-black mt-1 text-amber-300">
                      🌟 {currentCustomer.points || 0}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dashboard Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-gray-200/60 rounded-2xl max-w-md w-full font-bold text-sm shadow-inner mt-2">
              {[
                { id: 'shop', label: isBn ? 'অর্ডার করুন' : 'Shop / Order', icon: ShoppingBag },
                { id: 'invoice_tracker', label: isBn ? 'ইনভয়েস ট্র্যাক' : 'Track Invoice', icon: Receipt },
                { id: 'orders', label: isBn ? 'অর্ডার ইতিহাস' : 'Order History', icon: History }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT: PRODUCT SHOP / ONLINE ORDERING */}
            {activeTab === 'shop' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Product Catalog Column */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Shop filters & search */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                    {/* Catalog search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                      <input 
                        type="text"
                        placeholder={isBn ? "প্রোডাক্টের নাম খুঁজুন..." : "Filter catalog..."}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 shadow-inner text-sm text-gray-900 outline-none focus:border-indigo-500 font-medium"
                        value={searchProductQuery}
                        onChange={(e) => setSearchProductQuery(e.target.value)}
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="flex gap-1.5 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1.5 md:pb-0">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {isBn ? "সব ক্যাটাগরি" : "All Products"}
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat.name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.length === 0 ? (
                      <div className="p-12 text-center bg-white border border-gray-100 rounded-3xl shadow-sm text-gray-400 font-semibold sm:col-span-2 text-sm">
                        {isBn ? "কোনো প্রোডাক্ট পাওয়া যায়নি।" : "No matches found in store catalogs."}
                      </div>
                    ) : (
                      filteredProducts.map(prod => (
                        <div 
                          key={prod.id}
                          className="p-4 bg-white border border-gray-100 hover:border-indigo-100 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            {/* Product Thumbnail with standard referrer policy */}
                            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                              {prod.imageUrl ? (
                                <img 
                                  src={prod.imageUrl} 
                                  alt={prod.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ShoppingBag className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wide px-1.5 py-0.5 bg-indigo-50/50 rounded-md">
                                {prod.category}
                              </span>
                              <h3 className="font-bold text-gray-900 mt-1 truncate" title={prod.name}>{prod.name}</h3>
                              <p className="text-sm font-black text-gray-500 mt-0.5">
                                {prod.price} <span className="text-xs font-semibold">TK / {prod.unit || 'unit'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto">
                            {/* HIDE ACTUAL NUMERICAL STOCK COUNT as requested! */}
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${prod.stock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                              {prod.stock > 0 
                                ? (isBn ? "স্টকে উপলব্ধ" : "In Stock") 
                                : (isBn ? "স্টকে নেই" : "Out of stock")}
                            </span>

                            <button
                              disabled={prod.stock <= 0}
                              onClick={() => addToCart(prod)}
                              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isBn ? "যোগ করুন" : "Add"}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* Shopping Cart Drawer / Summary Panel */}
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col gap-6 sticky top-24">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-black text-gray-900 text-base">{isBn ? "অর্ডার কার্ট" : "My Basket"}</h3>
                      </div>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {cart.length} {isBn ? "আইটেম" : "items"}
                      </span>
                    </div>

                    {/* Item list in basket */}
                    {cart.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 font-medium flex flex-col items-center justify-center gap-3">
                        <ShoppingBag className="w-10 h-10 text-gray-200" />
                        <p className="text-sm">{isBn ? "অর্ডার করতে প্রোডাক্ট যোগ করুন।" : "Cart is currently empty."}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-1">
                        {cart.map(item => (
                          <div key={item.product.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-gray-900 truncate">{item.product.name}</h4>
                              <p className="text-xs font-bold text-gray-400 mt-0.5">
                                {item.product.price} TK × {item.quantity} = {item.product.price * item.quantity} TK
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, -1)}
                                className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-black text-gray-800 text-xs w-5 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, 1)}
                                className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              
                              <button 
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors ml-1"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {cart.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-gray-50">
                        {/* Notes input */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{isBn ? "বিশেষ কোনো নির্দেশনা (ঐচ্ছিক)" : "Specific Notes (Optional)"}</label>
                          <textarea 
                            rows={2}
                            placeholder={isBn ? "যেমন: জলদি ডেলিভারি প্রয়োজন..." : "e.g., Please deliver in morning..."}
                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold outline-none focus:border-indigo-500 text-gray-800"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                          />
                        </div>

                        {/* Order calculation breakdown */}
                        <div className="flex items-center justify-between text-base font-black text-gray-900 pt-2">
                          <span>{isBn ? "মোট বিল" : "Grand Order Value"}</span>
                          <span>{cartTotal} TK</span>
                        </div>

                        {/* Submit Button */}
                        <button
                          onClick={handlePlaceOrder}
                          disabled={placingOrder}
                          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{placingOrder ? (isBn ? "অর্ডার সাবমিট হচ্ছে..." : "Submitting Order...") : (isBn ? "অর্ডার প্লেস করুন" : "Submit & Request Order")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: INVOICE DIGITAL TRACKER */}
            {activeTab === 'invoice_tracker' && (
              <div className="max-w-2xl mx-auto w-full space-y-8 py-4">
                
                {/* Search Bar */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text"
                      placeholder={isBn ? "ইনভয়েস নম্বরটি লিখুন (যেমন: BR1-12345)" : "Enter Invoice ID number..."}
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-100 shadow-inner text-gray-950 font-bold outline-none focus:border-indigo-500"
                      value={invoiceSearchId}
                      onChange={(e) => setInvoiceSearchId(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={lookupInvoice}
                    disabled={searchingInvoice || !invoiceSearchId.trim()}
                    className="h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold px-8 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{searchingInvoice ? (isBn ? "খুঁজছি..." : "Searching...") : (isBn ? "ট্র্যাক করুন" : "Track Ledger")}</span>
                  </button>
                </div>

                {lookupError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span>{lookupError}</span>
                  </div>
                )}

                {/* Invoice display */}
                {lookupSale && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 md:p-8 bg-white border border-gray-200 rounded-[2rem] shadow-lg relative overflow-hidden text-gray-800"
                  >
                    {/* Decorative Receipt Border Styling */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-indigo-600" />
                    
                    {/* Header receipt info */}
                    <div className="text-center pb-6 border-b border-gray-100 mt-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">
                        {isBn ? "ডিজিটাল চালান রশিদ" : "Itemized Digital Receipt"}
                      </h3>
                      <h2 className="text-2xl font-black text-gray-900 mt-2.5 uppercase">{selectedShop?.name}</h2>
                      <p className="text-xs text-gray-400 font-bold mt-1 leading-tight">{selectedShop?.address}</p>
                      
                      <div className="mt-4 inline-block">
                        <ReactBarcode value={lookupSale.id} height={35} width={1.2} fontSize={10} displayValue={true} />
                      </div>
                    </div>

                    {/* Metadata column */}
                    <div className="grid grid-cols-2 gap-4 py-6 text-sm border-b border-gray-100">
                      <div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{isBn ? "ইনভয়েস নম্বর" : "Invoice No"}</p>
                        <p className="font-mono font-black text-gray-900 mt-1">{lookupSale.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{isBn ? "তারিখ ও সময়" : "Billing Date"}</p>
                        <p className="font-bold text-gray-900 mt-1">
                          {lookupSale.timestamp ? new Date(lookupSale.timestamp.seconds ? lookupSale.timestamp.seconds * 1000 : lookupSale.timestamp).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{isBn ? "গ্রাহক" : "Client Name"}</p>
                        <p className="font-bold text-gray-900 mt-1">{lookupSale.customerName || (isBn ? 'নামবিহীন কাস্টমার' : 'Walk-in Customer')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{isBn ? "মোবাইল" : "Contact Phone"}</p>
                        <p className="font-bold text-gray-900 mt-1">{lookupSale.customerPhone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Invoice ordered products items table */}
                    <div className="py-6 border-b border-gray-100">
                      <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-4">{isBn ? "ক্রয়কৃত আইটেমস" : "Itemized Pricing Records"}</p>
                      
                      <div className="divide-y divide-gray-50">
                        {lookupSale.items?.map((item: any, idx: number) => (
                          <div key={idx} className="py-3 flex items-center justify-between text-sm">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                              <p className="text-xs font-semibold text-gray-400 mt-0.5">
                                {item.price} TK × {item.quantity} {item.unit || 'unit'}
                              </p>
                            </div>
                            <span className="font-black text-gray-950 text-right">
                              {item.price * item.quantity} TK
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FINANCIAL BILL BREAKDOWN DETAILS - matches user request perfectly! */}
                    <div className="py-6 space-y-3 bg-gray-50/75 p-5 rounded-2xl mt-4">
                      
                      {/* Products Subtotal / Total price of product */}
                      <div className="flex justify-between text-sm text-gray-500 font-bold">
                        <span>{isBn ? "প্রোডাক্টের সর্বমোট মূল্য" : "Products Cost Subtotal"}</span>
                        <span>{lookupSale.totalAmount} TK</span>
                      </div>

                      {/* Discount amount */}
                      {lookupSale.discount > 0 && (
                        <div className="flex justify-between text-sm text-rose-500 font-bold">
                          <span>{isBn ? "ছাড় বা ডিসকাউন্ট (-)" : "Special Discount (-)"}</span>
                          <span>{lookupSale.discount} TK</span>
                        </div>
                      )}

                      {/* VAT / Taxes */}
                      {lookupSale.taxAmount > 0 && (
                        <div className="flex justify-between text-sm text-gray-500 font-bold">
                          <span>{isBn ? "ট্যাক্স বা ভ্যাট (+)" : "Applicable Itemized VAT (+)"}</span>
                          <span>{lookupSale.taxAmount} TK</span>
                        </div>
                      )}

                      {/* Current Invoice Total (finalAmount) - "টোটাল বিল কত" */}
                      <div className="flex justify-between text-sm font-black text-gray-900 border-b border-dashed border-gray-200 pb-3">
                        <span>{isBn ? "বর্তমান ইনভয়েস বিল" : "Current Invoice Total"}</span>
                        <span>{lookupSale.finalAmount} TK</span>
                      </div>

                      {/* Previous customer due - "আগের কত টাকা বাকি" */}
                      <div className="flex justify-between text-sm text-amber-600 font-bold">
                        <span>{isBn ? "পূর্বের বাকি বা বকেয়া" : "Previous Outstanding Due"}</span>
                        <span>{lookupSale.previousBalance || 0} TK</span>
                      </div>

                      {/* Currently Paid in current transaction - "বর্তমানে কত টাকা দিয়েছে" */}
                      <div className="flex justify-between text-sm text-emerald-600 font-black">
                        <span>{isBn ? "বর্তমানে পরিশোধ করা টাকা (-)" : "Amount Paid Current (-)"}</span>
                        <span>{lookupSale.paidAmount || 0} TK</span>
                      </div>

                      {/* Grand total outstanding remains - "সব মিলে কত টাকা বাকি" */}
                      <div className="flex justify-between text-base font-black text-gray-950 pt-2 border-t border-gray-200">
                        <span>{isBn ? "সব মিলিয়ে মোট বকেয়া (হাল বকেয়া)" : "Final Remaining Balance Due"}</span>
                        <span className="text-rose-600">
                          {((lookupSale.previousBalance || 0) + (lookupSale.dueAmount || 0))} TK
                        </span>
                      </div>

                    </div>

                    {/* Friendly printable note footer */}
                    <div className="text-center pt-6 mt-6 border-t border-dashed border-gray-100 text-xs text-gray-400 font-semibold leading-relaxed">
                      <p>✨ {isBn ? "ডিজিটাল চালান রশিদের সাথে থাকার জন্য ধন্যবাদ" : "Thank you for buying from our certified store!"} ✨</p>
                      <p className="mt-1">{isBn ? "উন্নত গ্রাহক সেবায় আমরা সদা সচেষ্ট" : "Powered by ShopMaster POS Solutions Group"}</p>
                    </div>

                  </motion.div>
                )}

              </div>
            )}

            {/* TAB CONTENT: HISTORIC ORDERS */}
            {activeTab === 'orders' && (
              <div className="max-w-3xl mx-auto w-full space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-gray-950 mb-4">{isBn ? "আমার সাবমিট করা অর্ডারসমূহ" : "Historic Store Orders"}</h3>
                  
                  {customerOrders.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-semibold text-sm">
                      {isBn ? "এখনো কোনো অর্ডার সাবমিট করা হয়নি।" : "You haven't placed any orders yet."}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {customerOrders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(order => (
                        <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-gray-900 text-sm">#{order.orderNumber}</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {order.status === 'pending' ? (isBn ? 'পেন্ডিং' : 'Pending') : order.status === 'approved' ? (isBn ? 'অনুমোদিত' : 'Approved') : (isBn ? 'বাতিলকৃত' : 'Cancelled')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-semibold mt-1">
                              {new Date(order.timestamp).toLocaleString()}
                            </p>
                            <p className="text-xs font-bold text-gray-500 mt-2">
                              {order.items?.map((it: any) => `${it.productName} (${it.quantity}X)`).join(', ')}
                            </p>
                            {order.notes && (
                              <p className="text-xs text-gray-400 italic mt-1.5 bg-gray-50 px-2 py-1 rounded">
                                * {order.notes}
                              </p>
                            )}
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-400 font-black uppercase tracking-wider">{isBn ? "অর্ডার বিল" : "Order Value"}</p>
                            <p className="text-lg font-black text-indigo-600 mt-1">{order.totalAmount} TK</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
