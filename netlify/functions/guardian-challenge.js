// netlify/functions/guardian-challenge.js
exports.handler = async function (event, context) {
  // vygeneruj jednoduchý challenge
  const challengeId = Math.random().toString(36).slice(2);
  const seed = Math.random().toString(36).slice(2);
  const difficulty = 13; // můžeš zvedat

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ challengeId, seed, difficulty })
  };
};
