// src/vaft.bridge.js
;(function () {
  const PREFIX = 'VAFT_MSG_';
  if (!window.VAFT) window.VAFT = {};

  window.VAFT.bridge = {
    send(channel, data) {
      localStorage.setItem(
        PREFIX + channel,
        JSON.stringify({ t: Date.now(), from: location.pathname, data })
      );
    },
    listen(channel, cb) {
      window.addEventListener('storage', (e) => {
        if (e.key === PREFIX + channel && e.newValue) {
          try {
            const msg = JSON.parse(e.newValue);
            cb(msg.data, msg);
          } catch (e) { console.warn(e); }
        }
      });
    }
  };

  // každá appka může takhle říct “jsem online”
  window.VAFT.bridge.send('online', { app: location.pathname });
})();
