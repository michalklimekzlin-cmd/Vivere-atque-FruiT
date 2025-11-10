// /.netlify/functions/guardian-honeypot
exports.handler = async function (event, context) {
  console.log('HONEYPOT HIT', {
    ts: Date.now(),
    path: event.path,
    headers: event.headers,
    body: (event.body || '').slice(0, 300)
  });

  // úmyslné zpoždění
  await new Promise(r => setTimeout(r, 1500));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  };
};
