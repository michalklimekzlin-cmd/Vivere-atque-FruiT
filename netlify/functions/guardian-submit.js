// netlify/functions/guardian-submit.js
const crypto = require('crypto');

// stejný in-memory store (v produkci DB)
const CHALLENGES = global.GUARD_CHALLENGES = global.GUARD_CHALLENGES || new Map();

// tajný klíč pro HMAC (musí být v env variable NETLIFY_BUILD_ENV nebo NETLIFY env)
const HMAC_SECRET = process.env.GUARDIAN_SECRET || 'replace_with_real_secret';

// helper sha256
function sha256hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

exports.handler = async function(event) {
  try {
    const { challengeId, seed, payload, nonce } = JSON.parse(event.body || '{}');
    if (!challengeId || !seed || !payload || typeof nonce === 'undefined') {
      return { statusCode: 400, body: JSON.stringify({ error: 'missing' }) };
    }

    const ch = CHALLENGES.get(challengeId);
    if (!ch || ch.seed !== seed || ch.ttl < Date.now()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid_challenge' }) };
    }

    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const candidate = seed + '|' + nonce + '|' + payloadStr;
    const h = sha256hex(candidate);

    const targetPrefix = '0'.repeat(Math.max(0, Math.floor(ch.difficulty / 4)));
    if (!h.startsWith(targetPrefix)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'pow_failed' }) };
    }

    // proof OK -> vytvoříme podepsané "secured" tělo
    const ts = Date.now();
    const secured = { payload, issuedAt: ts, challengeId, proofHash: h };
    const signature = crypto.createHmac('sha256', HMAC_SECRET).update(JSON.stringify(secured)).digest('hex');

    // z bezpečnostních důvodů challenge jednou použijeme a smažeme
    CHALLENGES.delete(challengeId);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, secured, signature })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'server', message: e.message }) };
  }
};
