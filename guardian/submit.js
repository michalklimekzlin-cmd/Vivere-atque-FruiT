// Netlify function stub: /guardian/submit
exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.challengeId || !body.nonce) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'missing' })
      };
    }

    // tady by normálně bylo: ověřit PoW proti uložené výzvě
    const authToken = 'demo-token-' + body.challengeId;

    return {
      statusCode: 200,
      body: JSON.stringify({ authToken })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(e) })
    };
  }
};
