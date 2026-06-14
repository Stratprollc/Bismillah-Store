async function testSend() {
  const secret = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  const recipient = '8801604877281';
  const msg = 'Test';

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('account', '1');
  params.set('recipient', recipient);
  params.set('type', 'text');
  params.set('message', msg);

  let res = await fetch('https://app.sellerscampus.com/api/send/whatsapp?' + params.toString());
  console.log('GET', await res.text());

  const params2 = new URLSearchParams();
  params2.set('secret', secret);
  params2.set('account', '1');
  params2.set('phone', recipient);
  params2.set('type', 'text');
  params2.set('message', msg);
  res = await fetch('https://app.sellerscampus.com/api/send/whatsapp', { method: 'POST', body: params2 });
  console.log('POST phone', await res.text());

  const params3 = new URLSearchParams();
  params3.set('secret', secret);
  params3.set('account', '1');
  params3.set('recipient', recipient);
  params3.set('type', 'text');
  params3.set('message', msg);
  res = await fetch('https://app.sellerscampus.com/api/send/whatsapp', { method: 'POST', body: params3 });
  console.log('POST recipient', await res.text());

  const params4 = new URLSearchParams();
  params4.set('secret', secret);
  params4.set('whatsapp', '1'); // instead of account?
  params4.set('phone', recipient);
  params4.set('message', msg);
  res = await fetch('https://app.sellerscampus.com/api/send/whatsapp?' + params4.toString());
  console.log('GET whatsapp', await res.text());
}
testSend();
