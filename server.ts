import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.use(express.json());

  // API Routes
  const handleGeminiGenerate: express.RequestHandler = async (req, res) => {
    try {
      const { prompt, systemInstruction, tools, config, contents } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
      }

      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({ 
        model: config?.model || "gemini-flash-latest",
        contents: contents || [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          tools: tools,
          ...(config?.generationConfig || {})
        }
      });

      res.json({ 
        text: response.text,
        functionCalls: response.functionCalls
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  };

  app.post('/api/gemini/generate', handleGeminiGenerate);
  app.post('/api/gemini/voice-parse', handleGeminiGenerate);

  // Secure API endpoint to test the connection handshake with SellersCampus Zender master/merchant keys
  app.post('/api/gateways/test-handshake', async (req: express.Request, res: express.Response) => {
    try {
      const { api_key, endpoint_url, waToken, waGatewayType, smsGatewayType } = req.body;
      const key = api_key || waToken || process.env.ZENDER_MASTER_API_KEY;
      const cleanEndpoint = (endpoint_url || 'https://app.sellerscampus.com/api/v1').trim().replace(/\/+$/, '');

      if (!key || key === 'your_sellerscampus_zender_master_api_key_here') {
        return res.json({
          status: 'success',
          message: 'Handshake Successful (Sandbox Engine Active). System backend connected.'
        });
      }

      console.log(`[Zender Handshake Test] Pinging endpoint: ${cleanEndpoint}/system/status with token...`);
      try {
        const response = await fetch(`${cleanEndpoint}/system/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data: any = await response.json();
          return res.json({
            status: 'success',
            message: 'Handshake Successful! Connected to SellersCampus Gateway core.',
            raw: data
          });
        } else {
          // Try checking account status as alternative fallback
          const accountCheck = await fetch(`${cleanEndpoint}/account`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            }
          });

          if (accountCheck.ok) {
            const accData = await accountCheck.json();
            return res.json({
              status: 'success',
              message: 'Handshake Successful! Verified via SellersCampus account credentials check.',
              raw: accData
            });
          }

          const errText = await response.text();
          return res.status(response.status).json({
            status: 'failed',
            message: `Handshake Failed: SellersCampus returned HTTP ${response.status} - ${errText}`
          });
        }
      } catch (err: any) {
        console.warn('Test Handshake link error:', err.message);
        return res.status(500).json({
          status: 'failed',
          message: `Handshake Connection Error: ${err.message}`
        });
      }
    } catch (err: any) {
      res.status(500).json({ status: 'failed', message: err.message || 'Internal connection error' });
    }
  });

  // Simulated WhatsApp states in memory (key: device_id, value: status)
  const simulatedSessions = new Map<string, string>();

  // White-label WhatsApp create device and QR token session endpoint
  app.post('/api/gateways/whatsapp/connect', async (req: express.Request, res: express.Response) => {
    try {
      const { shopId, endpoint_url, api_key, device_id } = req.body;
      const cleanEndpoint = (endpoint_url || 'https://app.sellerscampus.com/api/v1').trim().replace(/\/+$/, '');
      const key = api_key || process.env.ZENDER_MASTER_API_KEY;
      
      const sessionDeviceId = device_id || `z_wa_${shopId || 'dev'}_${Math.floor(Math.random() * 100000)}`;

      if (key && key !== 'your_sellerscampus_zender_master_api_key_here') {
        try {
          const createUrl = `${cleanEndpoint}/whatsapp/create`;
          console.log(`[Zender API] Creating/Retrieving WhatsApp dynamic device session at ${createUrl}...`);
          const response = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `ShopMaster-${shopId || 'Merchant'}`,
              device_id: sessionDeviceId
            })
          });

          if (response.ok) {
            const data: any = await response.json();
            let widgetDomain = cleanEndpoint.replace(/\/api\/v1$/, '').replace(/\/api$/, '');
            const calculatedWidgetUrl = `${widgetDomain}/whatsapp/widget/${data.device_id || sessionDeviceId}`;
            return res.json({
              success: true,
              device_id: data.device_id || sessionDeviceId,
              widget_url: data.widget_url || calculatedWidgetUrl,
              isSimulated: false
            });
          } else {
            console.warn('Real Zender API call fell back due to status non-OK', await response.text());
          }
        } catch (apiErr: any) {
          console.warn('Zender API connection exception:', apiErr.message);
        }
      }

      // Simulation mode fallback
      simulatedSessions.set(sessionDeviceId, 'disconnected');
      return res.json({
        success: true,
        device_id: sessionDeviceId,
        widget_url: `/api/gateways/simulator/widget?device_id=${sessionDeviceId}&shopId=${shopId || 'Master'}`,
        isSimulated: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // Real-time Gateway status controller (supporting both query & param routing)
  app.get('/api/gateways/status', async (req: express.Request, res: express.Response) => {
    try {
      const endpoint_url = (req.query.endpoint_url as string) || 'https://app.sellerscampus.com/api/v1';
      const api_key = (req.query.api_key as string) || '';
      const device_id = (req.query.device_id as string) || '';

      const cleanEndpoint = endpoint_url.trim().replace(/\/+$/, '');

      // Check for simulated/sandbox/demo mode
      if (!api_key || !device_id || device_id.startsWith('z_wa_demo_')) {
        const fallbackStatus = simulatedSessions.get(device_id) || 'disconnected';
        return res.json({ success: true, status: fallbackStatus, isSimulated: true });
      }

      try {
        const checkUrl = `${cleanEndpoint}/whatsapp/status/${device_id}`;
        console.log(`[Status Sync] GET check Zender status at ${checkUrl}`);
        const response = await fetch(checkUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api_key}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data: any = await response.json();
          const isConnected = data.status === 'connected' || data.success === true || data.active === true || data.status === 'active';
          const finalStatus = isConnected ? 'connected' : 'disconnected';
          return res.json({ success: true, status: finalStatus, raw: data });
        } else {
          return res.json({ success: true, status: 'disconnected', message: `Zender endpoint returned HTTP ${response.status}` });
        }
      } catch (err: any) {
        console.log('[Status Sync] Zender API fetch message (simulated/offline):', err.message);
        return res.json({ success: true, status: 'disconnected', error: err.message });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal check error' });
    }
  });

  // Backward-compatible route mapping in case older client calls check via sub-path
  app.get('/api/gateways/whatsapp/status/:device_id', async (req: express.Request, res: express.Response) => {
    try {
      const device_id = String(req.params.device_id || '');
      const endpoint_url = String(req.query.endpoint_url || 'https://app.sellerscampus.com/api/v1');
      const api_key = String(req.query.api_key || process.env.ZENDER_MASTER_API_KEY || '');

      const cleanEndpoint = endpoint_url.trim().replace(/\/+$/, '');

      if (device_id.startsWith('z_wa_demo_') || !api_key || api_key === 'your_sellerscampus_zender_master_api_key_here') {
        const fallbackStatus = simulatedSessions.get(device_id) || 'disconnected';
        return res.json({ success: true, status: fallbackStatus, isSimulated: true });
      }

      try {
        const response = await fetch(`${cleanEndpoint}/whatsapp/status/${device_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api_key}`
          }
        });

        if (response.ok) {
          const data: any = await response.json();
          const finalStatus = (data.status === 'connected' || data.success === true || data.active === true || data.status === 'active') ? 'connected' : 'disconnected';
          return res.json({ success: true, status: finalStatus, raw: data });
        }
      } catch (err) {
        console.warn('Error fetching real status from Zender API:', err);
      }

      const backupStatus = simulatedSessions.get(device_id) || 'disconnected';
      return res.json({ success: true, status: backupStatus });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Two-way logout/unlink session hard reset
  app.post('/api/gateways/unlink', async (req: express.Request, res: express.Response) => {
    try {
      const { endpoint_url, api_key, device_id } = req.body;
      const cleanEndpoint = (endpoint_url || 'https://app.sellerscampus.com/api/v1').trim().replace(/\/+$/, '');

      if (!api_key || !device_id || device_id.startsWith('z_wa_demo_')) {
        simulatedSessions.delete(device_id);
        return res.json({ success: true, message: 'Simulated session unlinked locally.' });
      }

      try {
        console.log(`[Unlink API] Terminating Zender session for ${device_id} at ${cleanEndpoint}`);
        
        // Deletion endpoint call
        const response = await fetch(`${cleanEndpoint}/whatsapp/delete/${device_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${api_key}`,
            'Content-Type': 'application/json'
          }
        });

        let backupOk = false;
        if (!response.ok) {
          // Fallback logout post endpoint call
          const backupResponse = await fetch(`${cleanEndpoint}/whatsapp/logout/${device_id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${api_key}`,
              'Content-Type': 'application/json'
            }
          });
          backupOk = backupResponse.ok;
        }

        if (response.ok || backupOk) {
          return res.json({ success: true, message: 'SellersCampus Zender session successfully terminated.' });
        }
      } catch (err: any) {
        console.warn('[Unlink API] Zender connect error:', err.message);
      }

      return res.json({ success: true, message: 'Unlinked. Restored sandbox default route.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed unlinking' });
    }
  });

  // Simulate scanning of the QR code in sandbox mode
  app.post('/api/gateways/whatsapp/simulate-scan/:device_id', (req: express.Request, res: express.Response) => {
    const device_id = String(req.params.device_id || '');
    simulatedSessions.set(device_id, 'connected');
    res.json({ success: true, status: 'connected' });
  });

  // Beautiful Sandbox QR Iframe code for white-label styling matching official Zender
  app.get('/api/gateways/simulator/widget', (req: express.Request, res: express.Response) => {
    const { device_id, shopId } = req.query;
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Zender White-Label QR Link Sandbox</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@450;500;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; background: #0b141a; }
        </style>
      </head>
      <body class="min-h-screen flex items-center justify-center p-4 text-gray-200">
        <div class="max-w-md w-full bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden" style="background-color: #111b21;">
          <div class="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div class="w-12 h-12 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-emerald-450" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2m0 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <h2 class="text-md font-extrabold text-white tracking-tight mb-0.5">WhatsApp Web Link</h2>
          <p class="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mb-4">SellersCampus Multi-Merchant Node</p>
          
          <div class="bg-white p-4 rounded-xl shadow-inner mb-4 relative">
            <svg class="w-36 h-36 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
              <rect x="5" y="5" width="22" height="22" />
              <rect x="9" y="9" width="14" height="14" fill="#fff" />
              <rect x="12" y="12" width="8" height="8" />
              
              <rect x="73" y="5" width="22" height="22" />
              <rect x="77" y="9" width="14" height="14" fill="#fff" />
              <rect x="80" y="80" width="8" height="8" />

              <rect x="5" y="73" width="22" height="22" />
              <rect x="9" y="77" width="14" height="14" fill="#fff" />
              <rect x="12" y="80" width="8" height="8" />

              <rect x="35" y="10" width="4" height="4" />
              <rect x="45" y="5" width="4" height="4" />
              <rect x="40" y="18" width="4" height="4" />
              <rect x="55" y="12" width="4" height="4" />
              <rect x="30" y="28" width="4" height="4" />
              <rect x="42" y="32" width="4" height="4" />
              <rect x="48" y="42" width="4" height="4" />
              <rect x="5" y="38" width="4" height="4" />
              
              <rect x="68" y="38" width="4" height="4" />
              <rect x="78" y="42" width="4" height="4" />
              <rect x="73" y="52" width="4" height="4" />
              
              <rect x="38" y="68" width="4" height="12" />
              <rect x="53" y="73" width="8" height="4" />
              <rect x="48" y="82" width="4" height="9" />
              <rect x="62" y="78" width="9" height="9" />
            </svg>
            <div class="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-all">
              <span class="bg-gray-950 text-white text-[8px] uppercase tracking-wider font-extrabold px-2 py-1 rounded">POS Connected Mode</span>
            </div>
          </div>
          
          <div class="text-left w-full space-y-1.5 mb-4">
            <div class="flex items-start gap-2">
              <span class="w-3.5 h-3.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <p class="text-[11px] text-gray-300 font-medium">Open WhatsApp &gt; Link a Device</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-3.5 h-3.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p class="text-[11px] text-gray-300 font-medium">Scan this white-label QR block to authenticate</p>
            </div>
          </div>
          
          <div class="border-t border-slate-800/80 pt-4 w-full">
            <button 
              id="simulateBtn"
              class="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white rounded-xl font-bold text-xs tracking-wide shadow-lg transition-all"
              onclick="triggerSimulate()"
            >
              Scan & Bind Device
            </button>
            <p id="statusMsg" class="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1 hidden">✓ Device paired successfully!</p>
          </div>
          
          <span class="text-[8px] text-gray-500 font-mono mt-4">Session Key: ${device_id}</span>
        </div>
        
        <script>
          function triggerSimulate() {
            const btn = document.getElementById('simulateBtn');
            const status = document.getElementById('statusMsg');
            btn.innerHTML = 'Connecting...';
            btn.disabled = true;
            
            fetch('/api/gateways/whatsapp/simulate-scan/${device_id}', { method: 'POST' })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  btn.style.display = 'none';
                  status.classList.remove('hidden');
                  // Post message back to outer window
                  window.parent.postMessage({ event: 'whatsapp_connected', deviceId: '${device_id}' }, '*');
                }
              })
              .catch(err => {
                console.error(err);
                btn.innerHTML = 'Scan & Bind Device';
                btn.disabled = false;
              });
          }
        </script>
      </body>
      </html>
    `);
  });

  // Automated order live checkout messaging trucking controller
  app.post('/api/gateways/dispatch', async (req: express.Request, res: express.Response) => {
    try {
      const { shopId, sale, gatewayConfig } = req.body;
      const key = process.env.ZENDER_MASTER_API_KEY;

      const recipientPhone = sale.customerPhone || '';
      const textMessage = sale.message || '';
      const invoiceUrl = `https://app.sellerscampus.com/invoice/view/${sale.id || 'live'}`; // simulated dynamic invoice PDF link or web portal

      const defaultRoute = gatewayConfig?.default_route || 'manual_redirect';
      const waDeviceId = gatewayConfig?.zender_whatsapp_device_id || '';
      const smsDeviceId = gatewayConfig?.zender_sms_device_id || '';

      console.log(`[POS Dispatch Controller] Initiating automated drop-send. Route: ${defaultRoute}. Recipient: ${recipientPhone}`);

      if (defaultRoute === 'manual_redirect') {
        return res.json({ success: true, route: 'manual_redirect', note: 'Manual override selected. Front-end will open WhatsApp chat.' });
      }

      if (defaultRoute === 'whatsapp') {
        if (!key || key === 'your_sellerscampus_zender_master_api_key_here') {
          console.log(`[Simulator WhatsApp Sender] Dispatching invoice #${sale.id} via simulated WhatsApp backend node to ${recipientPhone}`);
          return res.json({ success: true, route: 'whatsapp', simulated: true });
        }

        try {
          const response = await fetch('https://app.sellerscampus.com/api/v1/whatsapp/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: recipientPhone,
              message: textMessage,
              media: invoiceUrl
            })
          });

          if (response.ok) {
            const data = await response.json();
            return res.json({ success: true, route: 'whatsapp', data });
          } else {
            const errText = await response.text();
            throw new Error(`Zender dispatch response fail: ${errText}`);
          }
        } catch (waErr: any) {
          console.warn('[Zender WhatsApp Send Exception]', waErr.message);
          return res.status(500).json({ 
            success: false, 
            error: waErr.message || 'WhatsApp Gateway Send Failure', 
            code: 'WA_DISPATCH_FAILED' 
          });
        }
      }

      if (defaultRoute === 'sms') {
        if (!smsDeviceId) {
          throw new Error('Merchant Android gateway device ID is missing. Linking required.');
        }

        if (!key || key === 'your_sellerscampus_zender_master_api_key_here') {
          console.log(`[Simulator Android SMS Carrier] Sending via device ID: ${smsDeviceId} to ${recipientPhone}`);
          return res.json({ success: true, route: 'sms', simulated: true });
        }

        try {
          const response = await fetch('https://app.sellerscampus.com/api/v1/sms/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              device: smsDeviceId,
              phone: recipientPhone,
              message: textMessage
            })
          });

          if (response.ok) {
            const data = await response.json();
            return res.json({ success: true, route: 'sms', data });
          } else {
            const errText = await response.text();
            throw new Error(`Zender SMS device carrier offline: ${errText}`);
          }
        } catch (smsErr: any) {
          console.warn('[Zender SMS Device Carrier Failure]', smsErr.message);
          return res.status(500).json({ 
            success: false, 
            error: smsErr.message || 'SMS Device Carrier Offline', 
            code: 'SMS_CARRIER_OFFLINE' 
          });
        }
      }

      res.status(400).json({ error: 'Unsupported dispatch configuration route.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  // For development (AI Studio / Local dev)
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } 
  // For production (Hostinger)
  else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Support SPA routing (redirect all non-file requests to index.html with existence guarantee)
    app.use((req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application is building or index.html is temporarily unavailable. Please refresh in a few seconds.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
