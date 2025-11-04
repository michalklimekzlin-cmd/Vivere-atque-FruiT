// impulse.js – jednoduchý podpis autora
(function(){
  const FEED_KEY = "meziprostor_feed_v1";
  const MY_NAME = "Michal Klimek";

  function loadFeed(){
    try {
      return JSON.parse(localStorage.getItem(FEED_KEY) || "[]");
    } catch(e){
      return [];
    }
  }
  function saveFeed(arr){
    localStorage.setItem(FEED_KEY, JSON.stringify(arr));
  }

  function sayHello(reason){
    const feed = loadFeed();
    feed.unshift({
      id: "mk-" + Date.now(),
      type: "impuls",
      label: MY_NAME,
      desc: reason || "autor je přítomen",
      createdAt: Date.now()
    });
    saveFeed(feed.slice(0,60));
  }

  // hned při startu
  sayHello("start meziprostoru");

  // občas připomeň
  setInterval(()=> {
    sayHello("živá stopa autora");
  }, 20000);
})();
