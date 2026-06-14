async function testParams() {
  const base = 'https://app.sellerscampus.com/api/create/wa.otp';
  
  const token = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  const phone = '8801604877281';
  const device = '1'; // maybe device should be integer? No, the UI says z_wa_merchant_735
  const dStr = 'z_wa_merchant_735';
  
  const possibleNames = ['account', 'session', 'device_id', 'server_id', 'instance', 'id', 'client', 'gateway', 'device'];
  
  for(let i=0; i<possibleNames.length; i++){
    const name = possibleNames[i];
    const p = new URLSearchParams();
    p.set('secret', token); // try secret? NO, secret gives Invalid Endpoint
    p.set('phone', phone);
    p.set(name, dStr);
    
    const p2 = new URLSearchParams();
    p2.set('token', token);
    p2.set('phone', phone);
    p2.set(name, dStr);
    
    try {
      const res = await fetch(`${base}?${p2.toString()}`);
      const text = await res.text();
      if(!text.includes('Invalid Parameters!')) console.log(`SUCCESS with ${name} ->`, text);
    } catch(e) { }
  }
}
testParams();
