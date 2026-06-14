async function testSend() {
  const secret = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  const phone = '8801604877281';
  const msg = 'Test';

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('account', '1');
  params.set('phone', phone);
  params.set('type', 'text');
  params.set('message', msg);

  const res = await fetch('https://app.sellerscampus.com/api/send/whatsapp', {
    method: 'POST',
    body: params
  });
  console.log(await res.text());
}
testSend();
