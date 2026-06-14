const fetch = require('node-fetch');

async function testParams() {
  const base = 'https://app.sellerscampus.com/api/create/wa.otp';
  
  const token = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  const phone = '8801604877281';
  const device = 'z_wa_merchant_735';
  
  const possibleNames = ['account', 'session', 'device_id', 'server_id', 'instance', 'id', 'client', 'gateway', 'node', 'wid'];
  
  for(let i=0; i<possibleNames.length; i++){
    const name = possibleNames[i];
    const p = new URLSearchParams();
    p.set('token', token);
    p.set('phone', phone);
    p.set(name, device);
    
    try {
      const res = await fetch(`${base}?${p.toString()}`);
      const text = await res.text();
      console.log(`Test with ${name} ->`, text);
    } catch(e) {
      console.log(`Test with ${name} err:`, e.message);
    }
  }
}
testParams();
