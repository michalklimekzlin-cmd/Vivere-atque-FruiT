/*
  Batolete – worlds/worlds.js
  World manager – přehled a navigace do světů
*/

"use strict";

const WORLDS = [
  {
    id: "revia",
    name: "Revia",
    emoji: "✨",
    description: "Svět světel a příběhů. Angelic a Dark mód.",
    url: "../../Revia/index.html",
    colors: ["#0a0e1f", "#7e6ee0"],
    tags: ["příběhy", "světy", "postava"]
  },
  {
    id: "revia-master",
    name: "Revia Master",
    emoji: "🌑",
    description: "Pokročilý svět Revie s více funkcionalitou.",
    url: "../../Revia-Master/index.html",
    colors: ["#080810", "#4a3a8a"],
    tags: ["pokročilý", "příběhy"]
  },
  {
    id: "glyph-planet",
    name: "Glyph Planeta",
    emoji: "🌐",
    description: "Planeta plná písmenek a Glyphů.",
    url: "../../Glyph-Planet/index.html",
    colors: ["#050815", "#7fffd4"],
    tags: ["glyphs", "písmena", "planeta"]
  },
  {
    id: "glyph-planet-3d",
    name: "Glyph Planeta 3D",
    emoji: "🪐",
    description: "3D planeta se znaky a symboly.",
    url: "../../Glyph-Planet-3D/index.html",
    colors: ["#050815", "#ffd700"],
    tags: ["3D", "glyphs", "planeta"]
  },
  {
    id: "1o1r",
    name: "1O1R RPG",
    emoji: "⚔️",
    description: "Mini RPG dobrodružství s rámeči.",
    url: "../../1O1R/index.html",
    colors: ["#05060a", "#f4d7a1"],
    tags: ["RPG", "rámeče", "pohyb"]
  },
  {
    id: "3d-ramecek",
    name: "3D Rámeček",
    emoji: "🧊",
    description: "Interaktivní 3D Glyph rámeček.",
    url: "../../3D ramecek/index.html",
    colors: ["#0a0014", "#ff6bff"],
    tags: ["3D", "interaktivní", "glyph"]
  }
];

/* Export for use in worlds.html */
if (typeof module !== "undefined") module.exports = { WORLDS };
