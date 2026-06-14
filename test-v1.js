import fetch from 'node-fetch';
async function run() {
  const res = await fetch('https://app.sellerscampus.com/api/v1/whatsapp/send', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer 4fe17fcfe73d5035f55b9144fa10e07443659005', 'Content-Type': 'application/json' },
    body: JSON.stringify({ device: '1', phone: '8801712312312', message: 'test' })
  });
  console.log(await res.text());
}
run();
