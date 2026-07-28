"use strict";

/*
  Kompatibilní vstup pro starší část CHT, která ještě registruje ./sw.js.
  Skutečná společná offline logika je pouze v service-worker.js.
  Díky tomu stará registrace nemaže cache ostatních PWA a nehledá
  neexistující styles.css, app.js ani manifest.webmanifest.
*/
importScripts("./service-worker.js");
