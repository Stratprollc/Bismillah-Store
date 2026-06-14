import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Phone, 
  Clock, 
  AlertCircle, 
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, updateDoc } from '../firebase';

interface SellerOrdersViewProps {
  orders: any[];
  products?: any[];
  lang: 'en' | 'bn' | 'ar';
  onLoadToPOS: (order: any) => void;
}

export function SellerOrdersView({ orders, products = [], lang, onLoadToPOS }: SellerOrdersViewProps) {
  const isBn = lang === 'bn';
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');

  const handleAddProductToOrder = (productId: string) => {
    if (!editingOrder || !products || !productId) return;
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Check if product is already in the order
    const existing = editingOrder.items?.find((item: any) => item.productId === productId);
    let updatedItems;
    if (existing) {
      updatedItems = editingOrder.items.map((item: any) => 
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedItems = [
        ...(editingOrder.items || []),
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          price: prod.price,
          unit: prod.unit || 'unit',
          imageUrl: prod.imageUrl || ''
        }
      ];
    }

    const total = updatedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      totalAmount: total
    });
    setSelectedProductToAdd(''); // reset selection
  };

  const handleUpdateStatus = async (orderId: string, status: 'approved' | 'cancelled') => {
    try {
      const orderRef = doc(db, 'customer_orders', orderId);
      await updateDoc(orderRef, { status });
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const startEditing = (order: any) => {
    // Clone properties to edit locally
    setEditingOrder(JSON.parse(JSON.stringify(order)));
  };

  const handleModifyQuantity = (productId: string, diff: number) => {
    if (!editingOrder) return;
    const updatedItems = editingOrder.items.map((item: any) => {
      if (item.productId === productId) {
        const newQty = item.quantity + diff;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    const total = updatedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      totalAmount: total
    });
  };

  const handleRemoveItem = (productId: string) => {
    if (!editingOrder) return;
    const updatedItems = editingOrder.items.filter((item: any) => item.productId !== productId);
    const total = updatedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      totalAmount: total
    });
  };

  const handleSaveModifiedOrder = async () => {
    if (!editingOrder) return;
    try {
      const orderRef = doc(db, 'customer_orders', editingOrder.id);
      await updateDoc(orderRef, {
        items: editingOrder.items,
        totalAmount: editingOrder.totalAmount,
        status: 'pending' // remains pending till approved
      });
      setEditingOrder(null);
    } catch (err) {
      console.error("Error saving modified customer order:", err);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const pastOrders = orders.filter(o => o.status !== 'pending');

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight leading-none">
            {isBn ? "গ্রাহক অর্ডার সমুহ" : "Customer Live Orders"}
          </h1>
          <p className="text-gray-500 font-semibold text-sm mt-2">
            {isBn 
              ? "ক্রেতাদের পক্ষ থেকে সরাসরি পাঠানো লিস্টিং ও অর্ডার রিকোয়েস্ট ম্যানেজ করুন।" 
              : "Manage real-time order baskets placed online by registered client devices."}
          </p>
        </div>

        {/* Counter metrics badge */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingOrders.length} {isBn ? "টি পেন্ডিং অর্ডার" : "Pending Order Requests"}</span>
          </div>
        </div>
      </div>

      {/* Primary orders screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Orders list col */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>{isBn ? "পেন্ডিং রিকোয়েস্ট সমূহ" : "Pending Incoming Orders"}</span>
            </h2>

            {pendingOrders.length === 0 ? (
              <div className="py-16 text-center text-gray-400 font-bold text-sm bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 flex flex-col items-center justify-center gap-3">
                <ShoppingBag className="w-10 h-10 text-gray-200" />
                <span>{isBn ? "কোনো পেন্ডিং অর্ডার রিকোয়েস্ট নেই।" : "No pending order requests found."}</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingOrders.map(order => (
                  <div key={order.id} className="py-5 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(order.timestamp).toLocaleString()}</span>
                        </span>
                      </div>

                      {/* Customer Info Card */}
                      <div className="flex items-center gap-4 pt-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 border border-gray-200">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-sm leading-tight">{order.customerName}</h4>
                          <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{order.customerPhone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Items details display list */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 space-y-1.5 max-w-sm">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                            {isBn ? "প্রোডাক্টের বিবরণ" : "Order Products"}
                          </p>
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-gray-700">
                              <span className="font-bold truncate max-w-[200px]">
                                {item.productName} <span className="text-[10px] text-gray-400">({item.quantity} × {item.price} TK)</span>
                              </span>
                              <span className="font-black text-gray-900 shrink-0 ml-2">{item.price * item.quantity} TK</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payment Information */}
                      {order.paymentMethod && order.paymentMethod !== 'cod' && (
                        <div className="mt-3 bg-pink-50/50 p-3 rounded-2xl border border-pink-100 max-w-sm">
                          <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest leading-none mb-2">
                            {isBn ? "পেমেন্ট তথ্য (Payment Info)" : "Payment Information"}
                          </p>
                          <div className="space-y-1 text-xs">
                            <p><span className="text-pink-800 font-bold">Method:</span> <span className="text-gray-700 uppercase">{order.paymentMethod}</span></p>
                            {order.paymentDetails?.sender && (
                              <p><span className="text-pink-800 font-bold">Sender No:</span> <span className="text-gray-700">{order.paymentDetails.sender}</span></p>
                            )}
                            {order.paymentDetails?.txnId && (
                              <p><span className="text-pink-800 font-bold">Txn ID:</span> <span className="text-gray-700 font-mono">{order.paymentDetails.txnId}</span></p>
                            )}
                            {order.paymentDetails?.screenshot && (
                              <div className="mt-2 text-left">
                                <span className="text-[10px] font-black text-pink-600 uppercase">Proof:</span>
                                <img src={order.paymentDetails.screenshot} alt="Screenshot Proof" className="mt-1 h-20 rounded border border-pink-200 shadow-sm" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Value & Operation Controls */}
                    <div className="flex flex-col items-start md:items-end justify-between gap-4 shrink-0 min-w-[200px]">
                      <div className="text-left md:text-right space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {isBn ? "স্ট্যাটাস" : "Status"}
                        </p>
                        <p className="text-xs font-bold text-gray-700">
                          {order.status === 'pending' 
                            ? (isBn ? "অপেক্ষমান (Pending)" : "Pending Acceptance")
                            : (order.invoiceNumber || 'N/A')}
                        </p>
                        
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{isBn ? "মোট বিল" : "Total Amount"}</p>
                        <h4 className="text-lg font-black text-indigo-600">
                           {order.totalAmount} TK
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 w-full md:justify-end">
                        {/* Edit Quantities button ("দোকানদার চাইলে ইচ্ছামত কমাতে-বাড়াতে পারবে") */}
                        <button
                          onClick={() => startEditing(order)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                        >
                          ✏️ {isBn ? "সংশোধন করুন" : "Modify Basket"}
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-100"
                          title={isBn ? "অর্ডার বাতিল করুন" : "Reject/Cancel Order"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        {/* Load in POS dashboard for perfect final checkout invoice processing */}
                        <button
                          onClick={() => onLoadToPOS(order)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-100 flex items-center gap-1.5 transition-all"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isBn ? "POS-এ লোড করুন" : "Proceed Checkout"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODIFIER EDIT SIDEBAR SECTION ("ইচ্ছামত কমাতে কিংবা বেশি করতে পারবে") */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {editingOrder ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 bg-white border border-indigo-100 rounded-[2rem] shadow-lg flex flex-col gap-6 sticky top-24"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                      {isBn ? "অর্ডার এডিট মোড" : "Basket Editor"}
                    </span>
                    <h3 className="font-black text-gray-900 text-base mt-1">#{editingOrder.orderNumber}</h3>
                  </div>
                  <button 
                    onClick={() => setEditingOrder(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Edit itemization index by index */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {editingOrder.items?.length === 0 ? (
                    <p className="text-gray-400 text-xs py-4 text-center font-semibold">No items left in this order request.</p>
                  ) : (
                    editingOrder.items.map((item: any) => (
                      <div key={item.productId} className="flex flex-col gap-2.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <h4 className="font-bold text-gray-900 truncate flex-1" title={item.productName}>{item.productName}</h4>
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded transition-colors ml-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price and Quantity Editing */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 font-bold">{isBn ? "মূল্য:" : "Price:"}</span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number"
                                className="w-20 px-2 py-1 text-center font-black text-gray-850 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                                value={item.price}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  const updatedItems = editingOrder.items.map((it: any) => {
                                    if (it.productId === item.productId) {
                                      return { ...it, price: newPrice };
                                    }
                                    return it;
                                  });
                                  const total = updatedItems.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
                                  setEditingOrder({
                                    ...editingOrder,
                                    items: updatedItems,
                                    totalAmount: total
                                  });
                                }}
                              />
                              <span className="text-gray-400 font-bold">TK</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => handleModifyQuantity(item.productId, -1)}
                              className="p-1 bg-white hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-200 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-gray-800 text-xs w-6 text-center">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => handleModifyQuantity(item.productId, 1)}
                              className="p-1 bg-white hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-200 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* SELECT AND ADD A NEW PRODUCT TO BASKET */}
                {products && products.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      {isBn ? "নতুন প্রোডাক্ট যোগ করুন" : "Add Product to Basket"}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedProductToAdd}
                        onChange={(e) => setSelectedProductToAdd(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl outline-none focus:border-indigo-500 text-gray-805"
                      >
                        <option value="">
                          {isBn ? "--- প্রোডাক্ট সিলেক্ট করুন ---" : "--- Select Product ---"}
                        </option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.price} TK)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddProductToOrder(selectedProductToAdd)}
                        disabled={!selectedProductToAdd}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white disabled:bg-gray-50 disabled:text-gray-300 font-bold text-xs rounded-xl transition-all shrink-0"
                      >
                        {isBn ? "যোগ" : "Add"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center text-sm font-black text-gray-900">
                    <span>{isBn ? "সংশোধিত মোট বিল" : "Adjusted Net Total"}</span>
                    <span className="text-indigo-600">{editingOrder.totalAmount} TK</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingOrder(null)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all"
                    >
                      {isBn ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModifiedOrder}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-100"
                    >
                      {isBn ? "পরিবর্তন সংরক্ষণ" : "Save Basket"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">{isBn ? "প্রসেসড বা সম্পন্ন অর্ডার" : "Completed / Past Orders"}</h3>
                {pastOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 font-semibold py-8 text-center">{isBn ? "পূর্বে সম্পন্ন কোনো অর্ডার রেকর্ড নেই।" : "No recorded history for past processed orders."}</p>
                ) : (
                  <div className="space-y-3.5 divide-y divide-gray-55 divide-opacity-40">
                    {pastOrders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map((pastOrder, pi) => (
                      <div key={pastOrder.id} className="pt-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-black text-gray-800">#{pastOrder.orderNumber}</p>
                          <p className="text-[10px] text-gray-400 mt-1 font-semibold">{pastOrder.customerName}</p>
                          {pastOrder.invoiceNumber && (
                            <p className="text-[9.5px] font-bold text-indigo-650 mt-0.5 font-mono">
                              {isBn ? "চালান নং:" : "Inv No:"} {pastOrder.invoiceNumber}
                            </p>
                          )}
                          {pastOrder.paymentMethod && pastOrder.paymentMethod !== 'cod' && (
                            <div className="mt-1 text-[9px]">
                              <span className="font-bold text-pink-600 bg-pink-50 px-1 py-0.5 rounded">{pastOrder.paymentMethod.toUpperCase()}</span>
                              {pastOrder.paymentDetails?.txnId && <span className="ml-1 text-slate-500 font-mono">{pastOrder.paymentDetails.txnId}</span>}
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${pastOrder.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {pastOrder.status === 'approved' ? (isBn ? 'সম্পন্ন' : 'Completed') : (isBn ? 'বাতিল' : 'Cancelled')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
