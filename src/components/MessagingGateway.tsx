import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import { 
  MessageSquare, 
  Send, 
  Smartphone, 
  Settings, 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Users, 
  Sparkles, 
  Copy, 
  Check, 
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

interface MessagingGatewayProps {
  shopSettings?: any;
  onSaveSettings?: (settings: any) => void;
  customers?: any[];
  currentUserEmail?: string;
}

export const MessagingGateway: React.FC<MessagingGatewayProps> = ({
  shopSettings,
  onSaveSettings = (_s: any) => {},
  customers = [],
  currentUserEmail = ''
}) => {
  const settings = shopSettings || {};
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'templates' | 'broadcast' | 'logs'>('config');

  // WhatsApp Configuration State
  const [waType, setWaType] = useState<string>(settings.waGatewayType || 'zender');
  const [waToken, setWaToken] = useState<string>(settings.waToken || '');
  const [waInstanceId, setWaInstanceId] = useState<string>(settings.waInstanceId || '');
  const [waLinkSecret, setWaLinkSecret] = useState<string>(settings.waLinkSecret || '4fe17fcfe73d5035f55b9144fa10e07443659005');
  
  // Zender SaaS Integration State
  const [zenderWaDeviceId, setZenderWaDeviceId] = useState<string>(settings.zender_whatsapp_device_id || '');
  const [zenderSmsDeviceId, setZenderSmsDeviceId] = useState<string>(settings.zender_sms_device_id || '');
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected'>(settings.whatsapp_status || 'disconnected');
  const [smsStatus, setSmsStatus] = useState<'active' | 'disabled'>(settings.sms_status || 'disabled');
  const [defaultRoute, setDefaultRoute] = useState<'whatsapp' | 'sms' | 'manual_redirect'>(settings.default_route || 'whatsapp');

  // Manual API Configuration Credentials
  const [zenderEndpointUrl, setZenderEndpointUrl] = useState<string>(settings.zender_endpoint_url || 'https://app.sellerscampus.com/api/v1');
  const [zenderApiKey, setZenderApiKey] = useState<string>(settings.zender_api_key || settings.waToken || '');
  const [zenderDeviceId, setZenderDeviceId] = useState<string>(settings.zender_device_id || settings.zender_whatsapp_device_id || '');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const [isConnectingWa, setIsConnectingWa] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrWidgetUrl, setQrWidgetUrl] = useState('');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessageDetails, setSuccessMessageDetails] = useState('');

  // WhatsApp OTP / Phone Linking States
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Sync state from prop changes dynamically
  React.useEffect(() => {
    if (shopSettings) {
      setWaType(shopSettings.waGatewayType || 'zender');
      setWaToken(shopSettings.waToken || '');
      setWaInstanceId(shopSettings.waInstanceId || '');
      setZenderWaDeviceId(shopSettings.zender_whatsapp_device_id || '');
      setZenderSmsDeviceId(shopSettings.zender_sms_device_id || '');
      setWhatsappStatus(shopSettings.whatsapp_status || 'disconnected');
      setSmsStatus(shopSettings.sms_status || 'disabled');
      setDefaultRoute(shopSettings.default_route || 'whatsapp');
      setSmsType(shopSettings.smsGatewayType || 'none');
      setSmsApiKey(shopSettings.smsApiKey || '');
      setSmsSenderId(shopSettings.smsSenderId || '');
      setSmsEndpoint(shopSettings.smsEndpoint || '');
      
      // Manual Credentials Sync
      setZenderEndpointUrl(shopSettings.zender_endpoint_url || 'https://app.sellerscampus.com/api/v1');
      setZenderApiKey(shopSettings.zender_api_key || shopSettings.waToken || '');
      setZenderDeviceId(shopSettings.zender_device_id || shopSettings.zender_whatsapp_device_id || '');
      setWaLinkSecret(shopSettings.waLinkSecret || '4fe17fcfe73d5035f55b9144fa10e07443659005');
    }
  }, [shopSettings]);

  // Dynamic automatic status check on load
  const prevStatusRef = React.useRef(whatsappStatus);

  React.useEffect(() => {
    prevStatusRef.current = whatsappStatus;
  }, [whatsappStatus]);

  React.useEffect(() => {
    if ((waType === 'zender' || waType === 'walink') && (zenderDeviceId || zenderWaDeviceId)) {
      const activeId = zenderDeviceId || zenderWaDeviceId;
      // Immediate checks
      const verifyConnectionState = async () => {
        try {
          const queryParams = new URLSearchParams({
            endpoint_url: zenderEndpointUrl,
            api_key: waType === 'walink' ? waLinkSecret : zenderApiKey,
            device_id: activeId
          });
          const res = await fetch(`/api/gateways/status?${queryParams.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'connected') {
              setWhatsappStatus('connected');
              if (data.real_device_id && data.real_device_id !== zenderDeviceId) {
                  setZenderDeviceId(data.real_device_id);
                  setZenderWaDeviceId(data.real_device_id);
                  onSaveSettings({ ...settings, zender_whatsapp_device_id: data.real_device_id, zender_device_id: data.real_device_id });
              }
            } else if (data.status === 'disconnected' || data.status === 'logout') {
              setWhatsappStatus('disconnected');
              if (prevStatusRef.current === 'connected') {
                // Device was logged out!
                setOtpError('⚠️ হোয়াটসঅ্যাপ সেশনটি ডিসকানেক্ট বা লগআউট করা হয়েছে।');
              }
            }
          }
        } catch (e) {
          console.warn('Failed checking initial gateway state (this is normal if server is booting up):', e);
        }
      };
      verifyConnectionState();
      
      // Periodically poll every 10 seconds to keep system database in sync (faster response to unlinks)
      const statusInterval = setInterval(verifyConnectionState, 10000);
      return () => clearInterval(statusInterval);
    }
  }, [waType, zenderDeviceId, zenderWaDeviceId, zenderEndpointUrl, zenderApiKey, waLinkSecret]);

  const handleWhatsAppConnected = (deviceId: string, apiPhone?: string) => {
    setWhatsappStatus('connected');
    setShowQrModal(false);
    setOtpCode(''); // Auto-close inline QR code too
    setOtpError(null);
    setZenderWaDeviceId(deviceId);
    setZenderDeviceId(deviceId);
    
    onSaveSettings({
      ...settings,
      waGatewayType: waType,
      waLinkSecret: waLinkSecret,
      zender_whatsapp_device_id: deviceId,
      zender_endpoint_url: zenderEndpointUrl,
      zender_api_key: zenderApiKey,
      zender_device_id: deviceId,
      whatsapp_status: 'connected',
      default_route: 'whatsapp'
    });

    const shopName = settings.shopName || settings.name || 'ShopMaster';
    const targetPhone = apiPhone || otpPhone || settings.phone;

    setSuccessMessageDetails(
      targetPhone 
        ? `🎉 অভিনন্দন! আপনার হোয়াটসঅ্যাপ সফলভাবে সংযুক্ত হয়েছে।\nআপনার নম্বর (${targetPhone})-এ একটি প্রফেশনাল কনফার্মেশন মেসেজ পাঠানো হচ্ছে।` 
        : `🎉 অভিনন্দন! আপনার হোয়াটসঅ্যাপ সফলভাবে সংযুক্ত হয়েছে।\nদয়া করে সেটিংসে আপনার নম্বর (Store Mobile) যোগ করুন কনফার্মেশন মেসেজের জন্য।`
    );
    setShowSuccessNotification(true);

    if (targetPhone) {
      fetch('/api/gateways/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayConfig: {
            default_route: 'whatsapp',
            zender_whatsapp_device_id: deviceId,
            zender_api_key: zenderApiKey || waLinkSecret,
            endpoint_url: zenderEndpointUrl
          },
          sale: {
            customerPhone: targetPhone,
            message: `🎉 *অভিনন্দন!*\n\n*${shopName}*-এর সাথে আপনার হোয়াটসঅ্যাপ সফলভাবে কানেক্ট হয়েছে। এখন থেকে আপনার ব্যবসার সমস্ত ইনভয়েস এবং নোটিফিকেশন স্বয়ংক্রিয়ভাবে গ্রাহকদের কাছে ডেলিভারি হবে।`
          }
        })
      }).catch(err => {
        console.error('Failed to send confirmation message', err);
      });
    }

    // Auto-hide success notification after 5 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 5000);
  };

  // Removed iframe messaging listener to prevent early false success
  // Real success is now strictly driven by the checkRealWhatsAppStatus polling

  // Status Polling helper
  const startStatusPolling = (deviceId: string) => {
    if ((window as any)._waPollInterval) {
      clearInterval((window as any)._waPollInterval);
    }

    const intervalId = setInterval(async () => {
      try {
        const queryParams = new URLSearchParams({
          endpoint_url: zenderEndpointUrl,
          api_key: waType === 'walink' ? waLinkSecret : zenderApiKey,
          device_id: deviceId
        });

        const res = await fetch(`/api/gateways/status?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'REAL_CONNECTED') {
            clearInterval(intervalId);
            handleWhatsAppConnected(deviceId, data.phone);
          }
        }
      } catch (err) {
        console.warn('Zender Polling expected retry warning:', err);
      }
    }, 4000);

    (window as any)._waPollInterval = intervalId;

    // Stop after 3 minutes
    setTimeout(() => {
      clearInterval(intervalId);
    }, 180000);
  };

  const handleGenerateOtp = async () => {
    if (!otpPhone) {
      setOtpError('অনুগ্রহ করে একটি মোবাইল নম্বর প্রদান করুন (যেমন: +88017XXXXXXXX)');
      return;
    }
    setIsGeneratingOtp(true);
    setOtpError(null);
    setOtpCode('');
    try {
      let currentToken = waType === 'zender' ? zenderApiKey : waLinkSecret;
      if (!currentToken || currentToken.includes('your_sellerscampus')) {
        currentToken = '4fe17fcfe73d5035f55b9144fa10e07443659005';
      }

      const response = await fetch('/api/gateways/whatsapp/connect-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: otpPhone,
          token: currentToken
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        let cleanQr = data.code || '';
        cleanQr = cleanQr.replace(/_SellersCampus_SecureLink_.*?$/, '');
        cleanQr = cleanQr.replace(/^,+/, '');
        setOtpCode(cleanQr);
        setWhatsappStatus('disconnected');
        
        const deviceId = data.deviceId || `z_wa_otp_${Math.floor(Math.random() * 100000)}`;
        setZenderWaDeviceId(deviceId);

        // Reset connected status and wait for real-time polling to finish
        onSaveSettings({
          ...settings,
          waGatewayType: waType,
          waLinkSecret: waLinkSecret,
          whatsapp_status: 'disconnected',
          zender_whatsapp_device_id: deviceId
        });
        
        startStatusPolling(deviceId);
      } else {
        setOtpError(data.error || 'ওটিপি কোড জেনারেট করা সম্ভব হয়নি। নম্বরটি সঠিক এবং সচল কিনা পরীক্ষা করুন।');
      }
    } catch (err: any) {
      setOtpError(err.message || 'নেটওয়ার্ক ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    setIsConnectingWa(true);
    try {
      if (waType === 'walink') {
        const response = await fetch('/api/gateways/whatsapp/connect-walink', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            secret: waLinkSecret
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setZenderWaDeviceId(data.device_id);
          setZenderDeviceId(data.device_id);
          setQrWidgetUrl(data.widget_url);
          setShowQrModal(true);
          setWhatsappStatus('disconnected');
          startStatusPolling(data.device_id);
        } else {
          setOtpError('REAL API CONNECTION FAILED: ' + (data.error || 'Server error, check console.'));
        }
        setIsConnectingWa(false);
        return;
      }

      const newDeviceId = `z_wa_${settings.id || 'dev'}_${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * 1000)}`;
      
      const response = await fetch('/api/gateways/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId: settings.id || 'pos-merchant-master',
          endpoint_url: zenderEndpointUrl,
          api_key: zenderApiKey,
          device_id: newDeviceId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setZenderWaDeviceId(data.device_id);
        setZenderDeviceId(data.device_id);
        setQrWidgetUrl(data.widget_url);
        setShowQrModal(true);
        setWhatsappStatus('disconnected');
        startStatusPolling(data.device_id);
      } else {
        setOtpError('Could not initialize SellersCampus session. Check central server is running.');
      }
    } catch (err: any) {
      console.error('Zender connect exception:', err);
      setOtpError('Failed connecting Zender endpoint: ' + err.message);
    } finally {
      setIsConnectingWa(false);
    }
  };

  const handleUnlinkWhatsApp = async () => {
    if (window.confirm('Are you sure you want to unlink and release your active SellersCampus WhatsApp session? This cannot be undone.')) {
      try {
        setWhatsappStatus('disconnected');
        
        // Terminate Zender session
        await fetch('/api/gateways/unlink', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint_url: zenderEndpointUrl,
            api_key: zenderApiKey,
            device_id: zenderDeviceId || zenderWaDeviceId
          })
        });

        setZenderWaDeviceId('');
        setZenderDeviceId('');
        setDefaultRoute('manual_redirect');
        
        onSaveSettings({
          ...settings,
          waGatewayType: 'manual',
          zender_whatsapp_device_id: '',
          zender_endpoint_url: zenderEndpointUrl,
          zender_api_key: '',
          zender_device_id: '',
          whatsapp_status: 'disconnected',
          default_route: 'manual_redirect'
        });

        setOtpError('WhatsApp session unlinked successfully. You can now connect again.');
      } catch (err) {
        console.error('Error during Zender unlink:', err);
        setOtpError('Disconnection finalized locally.');
      }
    }
  };

  // SMS Configuration State
  const [smsType, setSmsType] = useState<string>(settings.smsGatewayType || 'none');
  const [smsApiKey, setSmsApiKey] = useState<string>(settings.smsApiKey || '');
  const [smsSenderId, setSmsSenderId] = useState<string>(settings.smsSenderId || '');
  const [smsEndpoint, setSmsEndpoint] = useState<string>(settings.smsEndpoint || '');

  // Template State
  const [saleTemplate, setSaleTemplate] = useState<string>(
    settings.saleTemplate || 'Hi {{customerName}}, your purchase of {{subtotal}} is completed at {{shopName}}!'
  );
  const [dueTemplate, setDueTemplate] = useState<string>(
    settings.dueTemplate || 'Dear {{customerName}}, you have a pending due of {{dueAmount}} at {{shopName}}. Please clear it soon.'
  );
  const [globalTemplateEn, setGlobalTemplateEn] = useState<string>(
    settings.globalTemplateEn || 'Hello *{{customerName}}*, thank you for shopping at *{{shopName}}*! Your invoice #{{invoiceId}} total is {{currencySymbol}} {{totalAmount}}.'
  );
  const [globalTemplateBn, setGlobalTemplateBn] = useState<string>(
    settings.globalTemplateBn || 'প্রিয় *{{customerName}}*, *{{shopName}}*-এ কেনাকাটা করার জন্য ধন্যবাদ! আপনার ইনভয়েস #{{invoiceId}} এর মোট পরিমাণ {{currencySymbol}} {{totalAmount}} টাকা।'
  );

  // Broadcast Composer State
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'due' | 'selected'>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastMethod, setBroadcastMethod] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{ success: number; failed: number } | null>(null);

  // Testing & Save Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);


  // Saved Logs (mock demo logs to keep user interaction functional and fully rich)
  const [logs, setLogs] = useState<Array<{
    id: string;
    recipient: string;
    phone: string;
    content: string;
    gateway: 'whatsapp' | 'sms';
    status: 'delivered' | 'failed' | 'pending';
    time: string;
  }>>([
    { id: 'msg-1', recipient: 'Abir Rahman', phone: '01712345678', content: 'Dear Abir Rahman, you have a pending due of 1500 BDT at My Shop. Please clear it soon.', gateway: 'whatsapp', status: 'delivered', time: 'Just now' },
    { id: 'msg-2', recipient: 'Farhana Kabir', phone: '01898765432', content: 'Hi Farhana Kabir, your purchase of 3400 BDT is completed at My Shop!', gateway: 'whatsapp', status: 'delivered', time: '10 mins ago' },
    { id: 'msg-3', recipient: 'Sajid Islam', phone: '01511223344', content: 'Big Discount! Get 10% off on all products this weekend. Visit My Shop!', gateway: 'sms', status: 'delivered', time: '1 hour ago' },
    { id: 'msg-4', recipient: 'Kamal Uddin', phone: '01933445566', content: 'Dear Kamal Uddin, you have a pending due of 450 BDT at My Shop.', gateway: 'sms', status: 'failed', time: '2 hours ago' }
  ]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSaveSettings({
        ...settings,
        waGatewayType: waType,
        waToken: waToken,
        waInstanceId: waInstanceId,
        smsGatewayType: smsType,
        smsApiKey: smsApiKey,
        smsSenderId: smsSenderId,
        smsEndpoint: smsEndpoint,
        saleTemplate: saleTemplate,
        dueTemplate: dueTemplate,
        globalTemplateEn: globalTemplateEn,
        globalTemplateBn: globalTemplateBn,
        zender_whatsapp_device_id: zenderDeviceId || zenderWaDeviceId,
        zender_sms_device_id: zenderSmsDeviceId,
        whatsapp_status: whatsappStatus,
        sms_status: smsStatus,
        default_route: defaultRoute,
        zender_endpoint_url: zenderEndpointUrl,
        zender_api_key: zenderApiKey,
        zender_device_id: zenderDeviceId || zenderWaDeviceId,
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const handleToggleCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(prev => prev.filter(item => item !== id));
    } else {
      setSelectedCustomers(prev => [...prev, id]);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    let targets: any[] = [];
    if (broadcastTarget === 'all') {
      targets = customers;
    } else if (broadcastTarget === 'due') {
      targets = customers.filter(c => (c.currentDue || 0) > 0);
    } else {
      targets = customers.filter(c => selectedCustomers.includes(c.id));
    }

    if (targets.length === 0) {
      setBroadcastStatus({
        success: 0,
        failed: 0,
        message: 'No recipients selected. Please select customers to send.'
      } as any);
      return;
    }

    setIsSending(true);
    setBroadcastStatus(null);

    let successfulCount = 0;
    let failedCount = 0;
    const newLogs: any[] = [];

    // Send broadcast sequentially or via Promise.all
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const parsedMessage = broadcastMessage.replace(/{{customerName}}/g, t.name || 'Customer');
      
      try {
        const response = await fetch('/api/gateways/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gatewayConfig: {
              default_route: broadcastMethod,
              zender_whatsapp_device_id: zenderDeviceId || zenderWaDeviceId || settings.zender_whatsapp_device_id,
              zender_sms_device_id: smsSenderId || settings.smsSenderId,
              zender_api_key: zenderApiKey || waLinkSecret || settings.zender_api_key || settings.smsApiKey || settings.waToken,
              endpoint_url: zenderEndpointUrl || smsEndpoint || settings.zender_endpoint_url
            },
            sale: {
              customerPhone: t.phone,
              message: parsedMessage
            }
          })
        });

        if (response.ok) {
          successfulCount++;
          newLogs.push({
            id: `msg-bcast-${Date.now()}-${i}`,
            recipient: t.name || 'Anonymous',
            phone: t.phone || '',
            content: parsedMessage,
            gateway: broadcastMethod,
            status: 'delivered' as const,
            time: 'Just now'
          });
        } else {
          failedCount++;
          let errorInfo = 'Delivery gateway rejected payload';
          try {
             const j = await response.json();
             if (j.error) errorInfo = j.error;
          } catch(e) {}
          
          if (i === 0) {
             setBroadcastStatus(prev => prev ? prev : ({
                success: 0,
                failed: targets.length,
                message: `Gateway Error: ${errorInfo}`
             } as any));
             break; // Stop bulk loop if gateway fundamentally rejects it
          }

          newLogs.push({
            id: `msg-bcast-${Date.now()}-${i}`,
            recipient: t.name || 'Anonymous',
            phone: t.phone || '',
            content: parsedMessage,
            gateway: broadcastMethod,
            status: 'failed' as const,
            time: 'Just now'
          });
        }
      } catch (e: any) {
        failedCount++;
        if (i === 0) {
             setBroadcastStatus(prev => prev ? prev : ({
                success: 0,
                failed: targets.length,
                message: `Network Error: ${e?.message}`
             } as any));
             break; // Stop bulk loop
        }
      }
    }

    setIsSending(false);
    setBroadcastStatus(prev => prev ? prev : {
      success: successfulCount,
      failed: failedCount
    } as any);

    setLogs(prev => [...newLogs, ...prev]);
    if (successfulCount > 0) {
      setBroadcastMessage('');
      setSelectedCustomers([]);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  );

  return (
    <div id="messaging-gateway-view" className="w-full bg-slate-50/40 dark:bg-slate-950 p-1 md:p-4 rounded-3xl">
      {/* Dynamic Upper Stat Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/85 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Total Customers</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{customers.length}</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/85 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">WhatsApp Route</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-450 tracking-wide uppercase inline-flex items-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              API Node Client
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/85 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">SMS Gateway</span>
            <span className="text-sm font-black text-gray-500 dark:text-slate-400 tracking-wide uppercase block mt-1">
              {smsType === 'none' ? 'Disabled' : smsType.toUpperCase()}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/85 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Total Logs</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{logs.length} Sent</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Container Layout */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[550px] flex flex-col">
        {/* Navigation Tab Header bar */}
        <div className="border-b border-gray-100 dark:border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-md font-bold text-gray-900 dark:text-white tracking-tight">Messaging Gateway Console</h2>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Active Owner: {currentUserEmail}</span>
            </div>
          </div>
          
          <div className="flex gap-1.5 p-1 bg-gray-100/70 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'config', label: 'Gateways', icon: Settings },
              { id: 'templates', label: 'Templates', icon: MessageSquare },
              { id: 'broadcast', label: 'Bulk Composer', icon: Send },
              { id: 'logs', label: 'Delivery Logs', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setBroadcastStatus(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-slate-800/50 scale-102'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents Frame */}
        <div className="flex-1 p-6 relative">
          <AnimatePresence mode="wait">
            {activeSubTab === 'config' && (
              <motion.div
                key="config-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Primary Default Route Selection Indicator */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-3xl border border-gray-100 dark:border-slate-800/80 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-950 dark:text-gray-100">Primary Dispatch Dispatcher</h3>
                    <p className="text-[11px] text-gray-450 dark:text-gray-400 font-medium">Select fallback medium for automated invoice messaging upon order completion</p>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp Silent Auto (Zender)', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30' },
                      { id: 'sms', label: 'SMS Device Carrier SIM (Android)', color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30' }
                    ].map(route => (
                      <button
                        key={route.id}
                        onClick={() => {
                          setDefaultRoute(route.id as any);
                          onSaveSettings({
                            ...settings,
                            default_route: route.id
                          });
                        }}
                        className={`px-3 py-2 rounded-xl border text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                          defaultRoute === route.id
                            ? `${route.color} ring-2 ring-indigo-500 scale-102`
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {route.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* WhatsApp Hub */}
                  <div className="bg-slate-50/60 dark:bg-slate-950/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-850">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                          WA
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-gray-900 dark:text-white">WhatsApp Gateway Node</h3>
                          <p className="text-[11px] text-gray-400 font-medium">Select notification delivery dispatch method</p>
                        </div>
                      </div>
                      
                      {whatsappStatus === 'connected' ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Disconnected
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Gateway Technology</label>
                        <select
                          value="zender"
                          onChange={() => {}}
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 font-semibold focus:ring-0 outline-none bg-gray-50 dark:bg-slate-800/50 text-sm opacity-80 cursor-not-allowed dark:text-slate-200"
                        >
                          <option value="zender">SellersCampus Zender (White-Label QR Client)</option>
                        </select>
                      </div>

                      {/* Zender White-label Connector Area */}
                      <div className="bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-xl space-y-4">
                          <h5 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-1.5 rounded-lg border border-indigo-100/20 uppercase tracking-wider text-center">
                            SellersCampus / Zender SaaS Credentials
                          </h5>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">API Endpoint URL</label>
                              <input
                                type="text"
                                value={zenderEndpointUrl}
                                onChange={(e) => setZenderEndpointUrl(e.target.value)}
                                placeholder="https://app.sellerscampus.com/api/v1"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">API Secret Key/Token</label>
                              <div className="relative flex items-center w-full">
                                <input
                                  type={showApiKey ? "text" : "password"}
                                  value={zenderApiKey}
                                  onChange={(e) => setZenderApiKey(e.target.value)}
                                  placeholder="Manual Zender token key"
                                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                />
                                <button
                                  type="button"
                                  id="toggle-zender-token-visibility"
                                  onClick={() => setShowApiKey(!showApiKey)}
                                  className="absolute right-3 p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                                  title={showApiKey ? "Hide Token" : "Show Token"}
                                >
                                  {showApiKey ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Device Session ID</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={zenderDeviceId}
                                  onChange={(e) => setZenderDeviceId(e.target.value)}
                                  placeholder="e.g. z_wa_merchant_19361"
                                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const generated = `z_wa_${settings.id || 'merchant'}_${Math.floor(10000 + Math.random() * 90000)}`;
                                    setZenderDeviceId(generated);
                                  }}
                                  className="px-3 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-[10px] font-bold hover:bg-gray-300 hover:dark:bg-slate-700 whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
                                >
                                  Generate ID
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Device Auth Status</span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                whatsappStatus === 'connected' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                                {whatsappStatus === 'connected' ? 'Connected / Active' : 'Disconnected / Unlinked'}
                              </span>
                            </div>

                            {whatsappStatus === 'connected' ? (
                              <div className="space-y-2">
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-450 font-bold leading-relaxed">
                                  ✓ WhatsApp system linked successfully on dynamic session container. Deliveries will route in real-time.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleUnlinkWhatsApp}
                                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Disconnect WhatsApp Session
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                                  Handshake status is Disconnected. Use your phone number to get a linking code.
                                </p>
                                <div className="flex flex-col gap-2">
                                  {/* Direct Phone Number Linking Section */}
                                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3.5">
                                    <div>
                                      <h6 className="text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                                        input Your WhatsApp business number
                                      </h6>
                                      <p className="text-[9px] text-gray-400 font-medium">কোনো স্ক্যানিং ঝামেলা ছাড়াই সরাসরি ৮ ডিজিটের কোড দিয়ে লিঙ্ক করুন</p>
                                    </div>
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={otpPhone}
                                        onChange={(e) => setOtpPhone(e.target.value)}
                                        placeholder="input Your WhatsApp business number (e.g. 016XXXXXXXX)"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                      />
                                      <button
                                        type="button"
                                        onClick={handleGenerateOtp}
                                        disabled={isGeneratingOtp}
                                        className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold rounded-xl text-xs text-white transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                                      >
                                        {isGeneratingOtp ? 'অপেক্ষা করুন...' : 'কিউআর কোড জেনারেট করুন (Generate QR Code)'}
                                      </button>
                                    </div>

                                    {otpError && (
                                      <p className="text-[10px] text-rose-500 font-bold whitespace-normal leading-normal">{otpError}</p>
                                    )}

                                    {otpCode && (
                                      <div className="bg-white dark:bg-slate-900 border border-indigo-500/30 p-3.5 rounded-2xl text-center flex flex-col items-center space-y-3 shadow-sm" id="qrcode">
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider animate-bounce">
                                          Scan to Link Device
                                        </p>
                                        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex justify-center w-full">
                                          <QRCode 
                                            value={otpCode}
                                            size={180}
                                            level="H"
                                            className="animate-pulse duration-1000"
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                          />
                                        </div>
                                        <p className="text-[9px] text-gray-400 leading-normal font-sans">
                                          Go to WhatsApp Settings {'>'} Linked Devices {'>'} <strong>Link a Device</strong> and scan this code.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed font-semibold">
                        SellersCampus Zender uses a central cloud node. Pair once and receive instant, automatic WhatsApp invoice drops.
                      </div>
                    </div>
                  </div>

                  {/* SMS Hub */}
                  <div className="bg-slate-50/60 dark:bg-slate-950/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-850">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                          SMS
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-gray-900 dark:text-white">Mobile SMS Carrier Integration</h3>
                          <p className="text-[11px] text-gray-400 font-medium">Configure masking & non-masking SMS gateways</p>
                        </div>
                      </div>

                      {smsType === 'zender_android' ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-650 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span> SIM Server Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Gateway Provider</label>
                        <select
                          value={smsType}
                          onChange={(e) => {
                            setSmsType(e.target.value);
                            onSaveSettings({
                              ...settings,
                              smsGatewayType: e.target.value
                            });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-sm dark:text-slate-200"
                        >
                          <option value="none">Disabled</option>
                          <option value="zender_android">SellersCampus Android SMS SIM Carrier Gateway</option>
                          <option value="bulksmsbd">BulkSMSBD API Engine</option>
                          <option value="greenweb">Greenweb SMS Gateway</option>
                          <option value="twilio">Twilio Global Carrier</option>
                        </select>
                      </div>

                      {/* Zender Android Device Integration */}
                      {smsType === 'zender_android' && (
                        <div className="space-y-3 bg-slate-150/40 dark:bg-slate-900/60 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                          <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Android unique Device key ID</label>
                            <input
                              type="text"
                              value={zenderSmsDeviceId}
                              onChange={(e) => {
                                setZenderSmsDeviceId(e.target.value);
                                onSaveSettings({
                                  ...settings,
                                  zender_sms_device_id: e.target.value
                                });
                              }}
                              placeholder="e.g. android_sim_2938"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-semibold outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Device Webhook URI</span>
                            <div className="flex gap-1.5 items-center">
                              <span className="bg-slate-100 dark:bg-slate-950 px-2.5 py-1 text-[9px] font-mono rounded w-full overflow-hidden text-ellipsis whitespace-nowrap text-gray-500">
                                {`https://${window.location.host}/api/gateways/dispatch`}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  navigator.clipboard.writeText(`https://${window.location.host}/api/gateways/dispatch`);
                                  const btn = e.currentTarget;
                                  const orig = btn.innerText;
                                  btn.innerText = 'Copied!';
                                  setTimeout(() => btn.innerText = orig, 1500);
                                }}
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded text-gray-600 dark:text-slate-300 shrink-0 cursor-pointer"
                              >
                                Copy Url
                              </button>
                            </div>
                          </div>

                          <div className="p-2.5 bg-blue-50/40 dark:bg-blue-950/10 rounded-lg text-[10px] text-blue-600 dark:text-blue-400 leading-normal font-semibold">
                            Install the official SellersCampus Android SMS Gateway App, insert the unique Device Auth Key above, and set the webhook URL inside your phone's app settings to route SMS dispatches directly through your custom mobile SIM network.
                          </div>
                        </div>
                      )}

                      {smsType !== 'none' && smsType !== 'zender_android' && (
                        <>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Endpoint API URL</label>
                            <input
                              type="text"
                              value={smsEndpoint}
                              onChange={(e) => setSmsEndpoint(e.target.value)}
                              placeholder="https://api.bulksmsbd.com/v2/sms"
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">API Token ID</label>
                              <input
                                type="password"
                                value={smsApiKey}
                                onChange={(e) => setSmsApiKey(e.target.value)}
                                placeholder="sk_live_..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Sender ID / Masking</label>
                              <input
                                type="text"
                                value={smsSenderId}
                                onChange={(e) => setSmsSenderId(e.target.value)}
                                placeholder="88017..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-slate-800/80">

                  <div className="flex items-center gap-2">
                    {saveSuccess && (
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest animate-bounce">
                        Configuration Saved!
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2"
                    >
                      {isSaving ? 'Storing credentials...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'templates' && (
              <motion.div
                key="templates-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-slate-50/60 dark:bg-slate-950/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-850">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Global Message Templates
                  </h3>
                  <p className="text-[11px] text-gray-400 font-semibold mb-6">These global notification templates are sent automatically for general customer communication and receipts.</p>

                  {/* Responsive side-by-side layout matching screenshot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GLOBAL TEMPLATE (ENGLISH)</label>
                        <span className="text-[9px] font-bold text-indigo-500">Variables: &#123;&#123;customerName&#125;&#125;, &#123;&#123;shopName&#125;&#125;, &#123;&#123;invoiceId&#125;&#125;, &#123;&#123;currencySymbol&#125;&#125;, &#123;&#123;totalAmount&#125;&#125;</span>
                      </div>
                      <textarea
                        value={globalTemplateEn}
                        onChange={(e) => setGlobalTemplateEn(e.target.value)}
                        placeholder="Hello *{{customerName}}*, thank you for shopping at *{{shopName}}*!..."
                        className="w-full px-4 py-3 min-h-[105px] rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GLOBAL TEMPLATE (BENGALI)</label>
                        <span className="text-[9px] font-bold text-indigo-500">Variables: &#123;&#123;customerName&#125;&#125;, &#123;&#123;shopName&#125;&#125;, &#123;&#123;invoiceId&#125;&#125;, &#123;&#123;currencySymbol&#125;&#125;, &#123;&#123;totalAmount&#125;&#125;</span>
                      </div>
                      <textarea
                        value={globalTemplateBn}
                        onChange={(e) => setGlobalTemplateBn(e.target.value)}
                        placeholder="প্রিয় *{{customerName}}*, *{{shopName}}*-এ কেনাকাটা করার জন্য ধন্যবাদ!..."
                        className="w-full px-4 py-3 min-h-[105px] rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-1 pt-6 border-t border-gray-100 dark:border-slate-850">
                    <MessageSquare className="w-4 h-4 text-teal-500" />
                    Additional System Message Templates
                  </h3>
                  <p className="text-[11px] text-gray-400 font-semibold mb-4">Define alternative formatting structures for custom actions and notifications.</p>

                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receipt Sales Template</label>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Variables available: &#123;&#123;customerName&#125;&#125;, &#123;&#123;subtotal&#125;&#125;</span>
                      </div>
                      <textarea
                        value={saleTemplate}
                        onChange={(e) => setSaleTemplate(e.target.value)}
                        placeholder="Customize dynamic invoice confirmation..."
                        className="w-full px-4 py-3 min-h-[85px] rounded-xl border border-gray-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Reminder Template</label>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Variables available: &#123;&#123;customerName&#125;&#125;, &#123;&#123;dueAmount&#125;&#125;</span>
                      </div>
                      <textarea
                        value={dueTemplate}
                        onChange={(e) => setDueTemplate(e.target.value)}
                        placeholder="Customize due balance alerts..."
                        className="w-full px-4 py-3 min-h-[85px] rounded-xl border border-gray-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition-all"
                  >
                    Save Templates
                  </button>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'broadcast' && (
              <motion.div
                key="broadcast-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Composer */}
                <div className="md:col-span-2 space-y-5">
                  <div className="bg-slate-50/60 dark:bg-slate-950/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-850 space-y-4">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-indigo-500" />
                      Bulk Message Composer
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dispatch Method</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBroadcastMethod('whatsapp')}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                              broadcastMethod === 'whatsapp'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50'
                                : 'bg-white dark:bg-slate-900 text-gray-500 border border-gray-200 dark:border-slate-800'
                            }`}
                          >
                            WhatsApp Link
                          </button>
                          <button
                            onClick={() => setBroadcastMethod('sms')}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                              broadcastMethod === 'sms'
                                ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50'
                                : 'bg-white dark:bg-slate-900 text-gray-500 border border-gray-200 dark:border-slate-800'
                            }`}
                          >
                            Mobile SMS
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Target Audience</label>
                        <select
                          value={broadcastTarget}
                          onChange={(e) => setBroadcastTarget(e.target.value as any)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-slate-200"
                        >
                          <option value="all">All Registered Customers ({customers.length})</option>
                          <option value="due">Due Customers Only ({customers.filter(c => (c.currentDue || 0) > 0).length})</option>
                          <option value="selected">Custom Selection ({selectedCustomers.length})</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-0.5">Broadcast Content</label>
                      <textarea
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Write something engaging... Tip: use {{customerName}} for personalized name lookup."
                        className="w-full px-4 py-3 min-h-[160px] rounded-2xl border-2 border-gray-100 dark:border-slate-800 text-sm font-semibold focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none bg-gray-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-all shadow-sm placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-y"
                      />
                    </div>
                  </div>

                  {broadcastStatus && (
                    <div className={`p-4 ${broadcastStatus.message ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'} dark:bg-opacity-20 rounded-2xl flex items-center gap-3`}>
                      {broadcastStatus.message ? <X className="w-5 h-5 flex-shrink-0 text-rose-500" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 animate-pulse" />}
                      <div>
                        <p className="font-bold text-sm">{broadcastStatus.message ? 'Action Failed' : 'Campaign Broadcast Completed!'}</p>
                        <p className="text-xs opacity-90 mt-0.5">{broadcastStatus.message || `Dispatched ${broadcastStatus.success} messages successfully via ${broadcastMethod.toUpperCase()}. ${broadcastStatus.failed > 0 ? `(${broadcastStatus.failed} failed)` : ''}`}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleSendBroadcast}
                      disabled={isSending || !broadcastMessage.trim()}
                      className="px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {isSending ? 'Transmitting payload...' : 'Dispatch Campaign'}
                    </button>
                  </div>
                </div>

                {/* Audience Selection list if custom selected */}
                <div className="bg-slate-50/60 dark:bg-slate-950/30 p-5 rounded-2xl border border-gray-100 dark:border-slate-850 flex flex-col h-[350px]">
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white mb-2">Recipient Selector</h4>
                  
                  <div className="relative mb-3 flex-shrink-0">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name/phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-400">No matching customers</div>
                    ) : (
                      filteredCustomers.map(c => {
                        const isChecked = selectedCustomers.includes(c.id);
                        const isSelectMode = broadcastTarget === 'selected';
                        return (
                          <div 
                            key={c.id}
                            onClick={() => isSelectMode && handleToggleCustomer(c.id)}
                            className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                              !isSelectMode 
                                ? 'bg-white/40 border-gray-100/50 opacity-60 dark:bg-slate-900/40 dark:border-slate-850'
                                : isChecked
                                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400'
                                  : 'bg-white border-gray-150 hover:bg-gray-50 cursor-pointer dark:bg-slate-900 dark:border-slate-800 text-gray-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="font-bold text-xs truncate">{c.name || 'Anonymous'}</p>
                              <p className="text-[10px] font-mono text-gray-400 truncate">{c.phone || 'No phone'}</p>
                            </div>

                            {isSelectMode && (
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 bg-white dark:border-slate-700'
                              }`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === 'logs' && (
              <motion.div
                key="logs-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-slate-50/60 dark:bg-slate-950/30 rounded-2xl border border-gray-100 dark:border-slate-850 p-2 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800/80">
                        <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Recipient</th>
                        <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone Number</th>
                        <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Gateway</th>
                        <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Message</th>
                        <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Time</th>
                        <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/40 dark:divide-slate-800/20">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-900/30">
                          <td className="p-3 font-bold text-gray-800 dark:text-slate-250 truncate max-w-[120px]">{log.recipient}</td>
                          <td className="p-3 font-mono text-gray-500 dark:text-slate-450">{log.phone}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                              log.gateway === 'whatsapp'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100/70 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                : 'bg-blue-50 text-blue-600 border-blue-100/70 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                            }`}>
                              {log.gateway}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-gray-600 dark:text-slate-350 truncate max-w-[280px]" title={log.content}>
                            {log.content}
                          </td>
                          <td className="p-3 text-gray-400 font-semibold">{log.time}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              log.status === 'delivered'
                                ? 'text-emerald-600 dark:text-emerald-450'
                                : log.status === 'failed'
                                  ? 'text-rose-600 dark:text-rose-450'
                                  : 'text-amber-600 dark:text-amber-450'
                            }`}>
                              {log.status === 'delivered' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {log.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-500" />
                Link WhatsApp Device
              </h3>
              <button onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center" id="qrcode">
              {qrWidgetUrl ? (
                <iframe src={qrWidgetUrl} className="w-full h-[320px] border-0 rounded-2xl bg-white" title="QR Code Scanner" />
              ) : (
                <div className="flex flex-col items-center justify-center h-[320px] text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-semibold">Generating secure QR code...</p>
                </div>
              )}
              <p className="text-xs text-gray-500 font-medium text-center mt-6">
                Open WhatsApp on your phone &bull; Settings &bull; Linked Devices &bull; Link a Device &bull; Scan the QR above
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[90%] mx-auto bg-green-500 text-white p-5 rounded-2xl shadow-xl shadow-green-500/20 text-center"
          >
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <h4 className="font-bold text-lg mb-1">কানেকশন সফল!</h4>
            <p className="text-sm text-green-100 leading-relaxed max-w-[280px] mx-auto">
              আপনার হোয়াটসঅ্যাপ নম্বরটি সফলভাবে কানেক্ট হয়েছে।
            </p>
            <p className="text-xs text-green-200 mt-3 border-t border-green-400/30 pt-3 max-w-[280px] mx-auto">
              {successMessageDetails}
            </p>
            <button 
              onClick={() => setShowSuccessNotification(false)}
              className="absolute top-2 right-2 p-2 text-green-100 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

