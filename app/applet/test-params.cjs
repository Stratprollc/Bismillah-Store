const fetch = require('node-fetch');

async function testParams() {
  const base = 'https://app.sellerscampus.com/api/create/wa.otp';
  
  const combos = [
    { secret: '4fe17fcfe73d5035f55b9144fa10e07443659005', phone: '8801604877281' },
    { secret: '4fe17fcfe73d5035f55b9144fa10e07443659005', number: '8801604877281' },
    { token: '4fe17fcfe73d5035f55b9144fa10e07443659005', device: 'z_wa_merchant_735', phone: '8801604877281' },
    { api_key: '4fe17fcfe73d5035f55b9144fa10e07443659005', number: '8801604877281' },
    { secret: '4fe17fcfe73d5035f55b9144fa10e07443659005', device: '1', phone: '8801604877281' },
    { api_key: '4fe17fcfe73d5035f55b9144fa10e07443659005', phone: '8801604877281' }
  ];

  for(let i=0; i<combos.length; i++){
    const p = new URLSearchParams(combos[i]);
    try {
      const res = await fetch(`${base}?${p.toString()}`);
      const text = await res.text();
      console.log(`Test ${i}: ${p.toString()} ->`, text);
    } catch(e) {
      console.log(`Test ${i} err:`, e.message);
    }
  }
}
testParams();
