import fetch from 'node-fetch';
async function run() {
  const secret = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  const url = 'https://app.sellerscampus.com/api/send/whatsapp';
  
  const idsToTest = [
     '1',
     '1781084852c4ca4238a0b923820dcc509a6f75849b6a2932b4bec9e',
     '+8801604877281',
     '8801604877281'
  ];
  
  for (const id of idsToTest) {
     const body = `secret=${secret}&account=${id}&type=text&recipient=8801712312312&message=test`;
     const res = await fetch(url, {
        method: 'POST', body, headers: {'Content-Type': 'application/x-www-form-urlencoded'}
     });
     console.log('[POST]', id, res.status, await res.text());
  }
}
run();
