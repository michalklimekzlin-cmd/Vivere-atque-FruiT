(() => {
  "use strict";

  const GLYPHY = [
    "`९נֶ",
    "`¡´T",
    "`ī´",
    "`¡¡´",
    "¿'",
    "°&",
    "(\\/*)",
    "j´",
    "˚°‰•.",
    "\\\\(•.(•°.)ア}"
  ];

  const STYLE_ID = "cht360-zeme-glyphy-style";

  function pridejStyl() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .cht360-zeme {
        --zlata: #ffb52e;
        --zlata2: #ffe39b;
        --tmava: #090401;

        position: relative;
        width: min(88vw, 430px);
        aspect-ratio: 1;
        margin: 0 auto;

        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        isolation: isolate;
      }

      .cht360-zeme * {
        box-sizing: border-box;
      }

      .cht360-zeme__pozadi {
        position: absolute;
        inset: 0;
        border-radius: 50%;

        background:
          radial-gradient(
            circle at 50% 50%,
            rgba(255,174,25,.10),
            transparent 58%
          ),
          radial-gradient(
            circle at 50% 85%,
            rgba(255,117,0,.16),
            transparent 28%
          );

        filter:
          drop-shadow(
            0 0 18px
            rgba(255,140,0,.20)
          );
      }

      .cht360-zeme__orbita,
      .cht360-zeme__orbita::before,
      .cht360-zeme__orbita::after {
        position: absolute;
        content: "";

        inset: 10%;

        border:
          1px solid
          rgba(255,190,66,.36);

        border-radius: 50%;

        pointer-events: none;
      }

      .cht360-zeme__orbita {
        transform:
          rotate(-10deg)
          scaleY(.72);

        box-shadow:
          0 0 10px
          rgba(255,159,0,.18);
      }

      .cht360-zeme__orbita::before {
        inset: -7%;

        transform:
          rotate(52deg)
          scaleY(.82);
      }

      .cht360-zeme__orbita::after {
        inset: 7%;

        transform:
          rotate(-72deg)
          scaleY(.80);
      }

      .cht360-zeme__koule {
        position: absolute;

        left: 50%;
        top: 50%;

        width: 62%;
        aspect-ratio: 1;

        transform:
          translate(-50%, -50%);

        border-radius: 50%;
        overflow: hidden;

        cursor: pointer;

        border:
          1px solid
          rgba(255,211,111,.92);

        background:
          radial-gradient(
            circle at 42% 35%,
            rgba(255,241,175,.34),
            transparent 10%
          ),

          radial-gradient(
            circle at 50% 50%,
            rgba(91,31,0,.20),
            transparent 52%
          ),

          radial-gradient(
            circle at 42% 43%,
            #3a1700 0 31%,
            #150800 64%,
            #050301 100%
          );

        box-shadow:
          inset 0 0 30px
          rgba(255,158,0,.55),

          inset -22px -9px 45px
          rgba(0,0,0,.78),

          0 0 8px #ffd16b,

          0 0 24px
          rgba(255,151,0,.72),

          0 0 54px
          rgba(255,101,0,.28);
      }

      .cht360-zeme__koule::before {
        content: "";

        position: absolute;
        inset: 0;

        border-radius: inherit;

        opacity: .88;

        background:
          repeating-radial-gradient(
            ellipse at 50% 50%,

            transparent 0 16px,

            rgba(255,186,54,.20)
            17px,

            transparent
            18px 31px
          ),

          repeating-linear-gradient(
            90deg,

            transparent
            0 18px,

            rgba(255,186,54,.14)
            19px,

            transparent
            20px 37px
          );

        mix-blend-mode: screen;
      }

      .cht360-zeme__mapa {
        position: absolute;

        inset:
          13%
          15%
          14%
          15%;

        opacity: .96;

        filter:
          drop-shadow(
            0 0 5px
            rgba(255,203,73,.95)
          )

          drop-shadow(
            0 0 10px
            rgba(255,143,0,.45)
          );
      }

      .cht360-zeme__mapa svg {
        display: block;

        width: 100%;
        height: 100%;
      }

      .cht360-zeme__stred {
        position: absolute;

        left: 50%;
        top: 51%;

        transform:
          translate(-50%, -50%);

        z-index: 3;

        color: #ffe39a;

        font:
          700
          clamp(28px, 8vw, 44px)
          / 1
          Georgia,
          "Times New Roman",
          serif;

        letter-spacing: .03em;

        text-shadow:
          0 0 5px #fff1b2,
          0 0 14px #ffb020,
          0 0 25px
          rgba(255,121,0,.75);

        white-space: nowrap;

        pointer-events: none;
      }

      .cht360-zeme__stred::before {
        content: "";

        position: absolute;

        width: 48%;
        height: 15%;

        left: 26%;
        top: -36%;

        border:
          2px solid
          #ffd76a;

        border-radius: 50%;

        box-shadow:
          0 0 9px
          #ffb31a;
      }

      .cht360-zeme__kridlo {
        position: absolute;

        top: 49%;

        width: 23%;
        height: 15%;

        opacity: .58;

        border-top:
          1px solid
          #ffd05f;

        border-radius: 50%;

        filter:
          drop-shadow(
            0 0 5px
            #ff9b00
          );

        pointer-events: none;
      }

      .cht360-zeme__kridlo--leve {
        right: 64%;

        transform:
          rotate(-18deg);
      }

      .cht360-zeme__kridlo--prave {
        left: 64%;

        transform:
          rotate(18deg);
      }

      .cht360-zeme__glyphy {
        position: absolute;

        inset: 0;

        animation:
          cht360-otoc-kruh
          44s
          linear
          infinite;
      }

      .cht360-zeme[data-pauza="ano"]
      .cht360-zeme__glyphy {
        animation-play-state: paused;
      }

      .cht360-zeme__glyph {
        --uhel: 0deg;
        --polomer: 44%;

        position: absolute;

        left: 50%;
        top: 50%;

        width:
          clamp(
            46px,
            12vw,
            60px
          );

        min-height:
          clamp(
            42px,
            11vw,
            54px
          );

        transform:
          translate(-50%, -50%)
          rotate(var(--uhel))
          translateY(
            calc(
              -1 * var(--polomer)
            )
          )
          rotate(
            calc(
              -1 * var(--uhel)
            )
          );

        display: grid;
        place-items: center;

        padding: 5px;

        border:
          1px solid
          rgba(255,203,95,.72);

        border-radius: 10px;

        background:
          linear-gradient(
            180deg,
            rgba(255,181,38,.14),
            rgba(64,22,0,.36)
          ),

          rgba(7,3,0,.78);

        color: #ffe2a0;

        font:
          700
          clamp(11px, 3.2vw, 16px)
          / 1.05
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        text-align: center;
        white-space: nowrap;

        box-shadow:
          inset
          0 0 10px
          rgba(255,165,0,.12),

          0 0 9px
          rgba(255,149,0,.38);

        text-shadow:
          0 0 7px
          rgba(255,188,58,.82);

        cursor: pointer;

        -webkit-tap-highlight-color:
          transparent;

        transition:
          border-color .16s ease,
          background .16s ease,
          box-shadow .16s ease;

        animation:
          cht360-drz-glyph
          44s
          linear
          infinite;
      }

      .cht360-zeme__glyph:focus-visible,
      .cht360-zeme__glyph:hover,
      .cht360-zeme__glyph[aria-pressed="true"] {
        outline: none;

        border-color:
          #ffe39b;

        background:
          linear-gradient(
            180deg,
            rgba(255,207,92,.30),
            rgba(105,41,0,.56)
          ),

          rgba(12,5,0,.90);

        box-shadow:
          inset
          0 0 13px
          rgba(255,186,46,.24),

          0 0 8px
          rgba(255,229,154,.70),

          0 0 19px
          rgba(255,132,0,.64);
      }

      .cht360-zeme__glyph:active {
        scale: .95;
      }

      .cht360-zeme__glyph--vafit {
        width:
          clamp(
            96px,
            27vw,
            126px
          );

        font-size:
          clamp(
            10px,
            2.6vw,
            14px
          );
      }

      .cht360-zeme__puls {
        position: absolute;

        inset: 29%;

        border-radius: 50%;

        border:
          1px solid
          rgba(255,192,70,.45);

        animation:
          cht360-puls-zeme
          3.2s
          ease-out
          infinite;

        pointer-events: none;
      }

      @keyframes cht360-otoc-kruh {
        to {
          transform:
            rotate(360deg);
        }
      }

      @keyframes cht360-drz-glyph {
        to {
          transform:
            translate(-50%, -50%)

            rotate(
              calc(
                var(--uhel)
                - 360deg
              )
            )

            translateY(
              calc(
                -1 * var(--polomer)
              )
            )

            rotate(
              calc(
                -1 * var(--uhel)
                + 360deg
              )
            );
        }
      }

      @keyframes cht360-puls-zeme {
        0% {
          transform:
            scale(.82);

          opacity: .65;
        }

        100% {
          transform:
            scale(1.28);

          opacity: 0;
        }
      }

      @media
      (prefers-reduced-motion: reduce) {

        .cht360-zeme__glyphy,
        .cht360-zeme__glyph,
        .cht360-zeme__puls {
          animation:
            none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function svgMapy() {
    return `
      <svg
        viewBox="0 0 300 320"
        aria-hidden="true"
      >

        <defs>

          <linearGradient
            id="cht360-zeme-zare"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >

            <stop
              offset="0"
              stop-color="#ffd66c"
              stop-opacity=".82"
            />

            <stop
              offset=".55"
              stop-color="#e88b00"
              stop-opacity=".52"
            />

            <stop
              offset="1"
              stop-color="#8c3900"
              stop-opacity=".30"
            />

          </linearGradient>

          <pattern
            id="cht360-zeme-tecky"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >

            <circle
              cx="1.5"
              cy="1.5"
              r="1.15"
              fill="#ffc33e"
              opacity=".72"
            />

          </pattern>

        </defs>

        <path
          d="
            M93 64
            L115 50
            141 54
            151 44
            166 50
            180 45
            198 56
            220 55
            232 68
            216 78
            204 91
            187 96
            183 108
            164 109
            151 101
            138 106
            123 96
            112 102
            96 95
            84 83
            Z
          "
          fill="url(#cht360-zeme-zare)"
          stroke="#ffd76e"
          stroke-width="2"
        />

        <path
          d="
            M111 105
            L133 101
            153 111
            169 124
            174 145
            166 166
            170 185
            161 207
            154 232
            142 259
            130 281
            116 275
            105 251
            95 228
            88 205
            83 181
            88 157
            82 138
            92 119
            Z
          "
          fill="url(#cht360-zeme-tecky)"
          stroke="#ffc44b"
          stroke-width="2.3"
        />

        <path
          d="
            M171 115
            L197 118
            217 130
            228 144
            218 153
            199 148
            186 138
            176 132
            Z
          "
          fill="url(#cht360-zeme-zare)"
          stroke="#ffc44b"
          stroke-width="1.8"
        />

        <path
          d="
            M227 221
            L236 230
            232 248
            223 259
            218 248
            220 232
            Z
          "
          fill="#f39b13"
          opacity=".68"
          stroke="#ffd36a"
          stroke-width="1.4"
        />

      </svg>
    `;
  }

  function vysli(
    root,
    nazev,
    detail
  ) {

    root.dispatchEvent(
      new CustomEvent(
        nazev,
        {
          detail,
          bubbles: true,
          composed: true
        }
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        nazev,
        {
          detail
        }
      )
    );
  }

  function vytvorGlyph(
    text,
    index
  ) {

    const tlacitko =
      document.createElement(
        "button"
      );

    const uhel =
      index *
      (
        360 /
        GLYPHY.length
      );

    tlacitko.type =
      "button";

    tlacitko.className =
      "cht360-zeme__glyph";

    tlacitko.style.setProperty(
      "--uhel",
      `${uhel}deg`
    );

    tlacitko.dataset.glyphIndex =
      String(index);

    tlacitko.dataset.glyph =
      text;

    tlacitko.setAttribute(
      "aria-label",
      `Glyph ${text}`
    );

    tlacitko.setAttribute(
      "aria-pressed",
      "false"
    );

    tlacitko.textContent =
      text;

    if (
      index ===
      GLYPHY.length - 1
    ) {

      tlacitko.classList.add(
        "cht360-zeme__glyph--vafit"
      );
    }

    return tlacitko;
  }

  function vytvorZemi() {

    const root =
      document.createElement(
        "section"
      );

    root.className =
      "cht360-zeme";

    root.dataset.cht360Earth =
      "1";

    root.dataset.pauza =
      "ne";

    root.setAttribute(
      "aria-label",
      "CHT 360°‰. Země •ア s Glyphy"
    );

    root.innerHTML = `
      <div
        class="cht360-zeme__pozadi"
        aria-hidden="true"
      ></div>

      <div
        class="cht360-zeme__orbita"
        aria-hidden="true"
      ></div>

      <div
        class="cht360-zeme__puls"
        aria-hidden="true"
      ></div>

      <div
        class="cht360-zeme__koule"
        role="button"
        tabindex="0"
        aria-label="Země •ア"
      >

        <div
          class="cht360-zeme__mapa"
        >
          ${svgMapy()}
        </div>

        <span
          class="
            cht360-zeme__kridlo
            cht360-zeme__kridlo--leve
          "
        ></span>

        <span
          class="
            cht360-zeme__kridlo
            cht360-zeme__kridlo--prave
          "
        ></span>

        <div
          class="cht360-zeme__stred"
        >
          \`¡´T
        </div>

      </div>

      <div
        class="cht360-zeme__glyphy"
        aria-label="Klikací Glyphy Země"
      ></div>
    `;

    const vrstvaGlyphu =
      root.querySelector(
        ".cht360-zeme__glyphy"
      );

    GLYPHY.forEach(
      (
        text,
        index
      ) => {

        const tlacitko =
          vytvorGlyph(
            text,
            index
          );

        tlacitko.addEventListener(
          "click",
          (
            event
          ) => {

            event.stopPropagation();

            vrstvaGlyphu
              .querySelectorAll(
                ".cht360-zeme__glyph"
              )
              .forEach(
                (
                  el
                ) => {

                  el.setAttribute(
                    "aria-pressed",
                    "false"
                  );
                }
              );

            tlacitko.setAttribute(
              "aria-pressed",
              "true"
            );

            vysli(
              root,
              "cht360:glyph",
              {
                index,
                glyph: text,
                element:
                  tlacitko
              }
            );
          }
        );

        vrstvaGlyphu.appendChild(
          tlacitko
        );
      }
    );

    const koule =
      root.querySelector(
        ".cht360-zeme__koule"
      );

    function prepniPauzu() {

      const novaPauza =
        root.dataset.pauza !==
        "ano";

      root.dataset.pauza =
        novaPauza
          ? "ano"
          : "ne";

      vysli(
        root,
        "cht360:zeme",
        {
          paused:
            novaPauza,

          element:
            root
        }
      );
    }

    koule.addEventListener(
      "click",
      prepniPauzu
    );

    koule.addEventListener(
      "keydown",
      (
        event
      ) => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          prepniPauzu();
        }
      }
    );

    return root;
  }

  function najdiCil(
    cil
  ) {

    if (
      typeof cil ===
      "string"
    ) {

      return document.querySelector(
        cil
      );
    }

    if (
      cil instanceof
      Element
    ) {

      return cil;
    }

    return null;
  }

  function pripoj(
    cil,
    volby = {}
  ) {

    pridejStyl();

    const host =
      najdiCil(
        cil
      );

    if (!host) {

      console.warn(
        "[CHT 360°‰. Země] Cílový element nebyl nalezen:",
        cil
      );

      return null;
    }

    const existujici =
      host.querySelector(
        ":scope > .cht360-zeme"
      );

    if (existujici) {
      return existujici;
    }

    const zeme =
      vytvorZemi();

    if (
      volby.nahraditObsah ===
      true
    ) {

      host.replaceChildren(
        zeme
      );

    } else {

      host.appendChild(
        zeme
      );
    }

    vysli(
      zeme,
      "cht360:zeme-pripojena",
      {
        host,
        element:
          zeme
      }
    );

    return zeme;
  }

  function odpoj(
    cil
  ) {

    const host =
      najdiCil(
        cil
      );

    if (!host) {
      return false;
    }

    const zeme =
      host.matches?.(
        ".cht360-zeme"
      )

        ? host

        : host.querySelector(
            ".cht360-zeme"
          );

    if (!zeme) {
      return false;
    }

    zeme.remove();

    return true;
  }

  function automatickyPripoj() {

    document
      .querySelectorAll(
        "[data-cht360-zeme]"
      )
      .forEach(
        (
          host
        ) => {

          pripoj(
            host
          );
        }
      );
  }

  window.CHT360Zeme =
    Object.freeze(
      {

        glyphy:
          [
            ...GLYPHY
          ],

        pripoj,

        odpoj
      }
    );

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      automatickyPripoj,
      {
        once: true
      }
    );

  } else {

    automatickyPripoj();
  }

})();