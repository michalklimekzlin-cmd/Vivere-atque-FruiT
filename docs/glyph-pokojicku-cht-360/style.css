:root {
  color-scheme: dark;
  --bg: #080707;
  --panel: rgba(22, 20, 17, .94);
  --line: rgba(255, 226, 173, .18);
  --line-strong: rgba(255, 226, 173, .52);
  --gold: #ffe2ad;
  --gold-deep: #c79b33;
  --text: #fff4dc;
  --muted: #c7bda8;
  --quiet: #8b8374;
  --ok: #b9d190;
  --warning: #ffc977;
  --danger: #ff9d91;
  --radius: 22px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
html { background: var(--bg); }

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  color: var(--text);
  background:
    radial-gradient(circle at 12% 4%, rgba(199, 155, 51, .16), transparent 31rem),
    radial-gradient(circle at 84% 22%, rgba(255, 226, 173, .075), transparent 25rem),
    linear-gradient(135deg, #060605, #0f0d09 52%, #060605);
}

button,
input,
select,
textarea,
a {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button { cursor: pointer; }

button:disabled {
  cursor: not-allowed;
  opacity: .47;
}

.app-shell {
  width: min(1500px, 100%);
  margin: auto;
  padding:
    max(20px, env(safe-area-inset-top))
    clamp(15px, 3vw, 46px)
    max(24px, env(safe-area-inset-bottom));
}

.topbar,
.top-actions,
.panel-heading,
.form-actions,
.module-heading {
  display: flex;
  align-items: center;
}

.topbar {
  justify-content: space-between;
  gap: 25px;
  margin: 7px 0 22px;
}

.topbar > div { max-width: 760px; }

.top-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.eyebrow {
  margin: 0 0 5px;
  color: var(--gold-deep);
  font-size: .71rem;
  font-weight: 800;
  letter-spacing: .13em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
  color: var(--gold);
  font-size: clamp(1.92rem, 4.9vw, 3.35rem);
  letter-spacing: -.055em;
  line-height: .98;
}

h2 {
  margin-bottom: 0;
  font-size: 1.08rem;
  letter-spacing: -.02em;
}

h3 {
  margin-bottom: 0;
  font-size: .98rem;
}

.subtitle,
.hint {
  color: var(--muted);
  line-height: 1.5;
}

.subtitle { margin-bottom: 0; }

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--gold);
  background: rgba(255, 255, 255, .025);
  font-weight: 750;
  text-decoration: none;
  transition: .16s ease;
  transition-property: transform, border-color, background;
}

.button:hover {
  border-color: var(--line-strong);
  background: rgba(255, 226, 173, .09);
}

.button:active { transform: translateY(1px); }

.button-primary {
  border-color: rgba(255, 226, 173, .56);
  color: #1a1206;
  background: linear-gradient(135deg, #ffe9bf, #d7a84b);
}

.button-primary:hover {
  background: linear-gradient(135deg, #fff1d2, #dfb55e);
}

.button-danger {
  border-color: rgba(255, 157, 145, .4);
  color: var(--danger);
}

.import-button { cursor: pointer; }

.drum-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.drum {
  position: relative;
  min-height: 107px;
  overflow: hidden;
  padding: 15px 17px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(145deg, rgba(37, 32, 22, .92), rgba(12, 12, 10, .93));
  box-shadow: 0 15px 48px rgba(0, 0, 0, .26);
}

.drum::after {
  position: absolute;
  right: -28px;
  bottom: -44px;
  width: 106px;
  height: 106px;
  border: 1px solid rgba(255, 226, 173, .14);
  border-radius: 50%;
  box-shadow: 0 0 0 11px rgba(255, 226, 173, .03);
  content: "";
}

.drum span,
.drum small,
.drum strong {
  position: relative;
  z-index: 1;
  display: block;
}

.drum span {
  color: var(--quiet);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.drum strong {
  margin: 8px 0 3px;
  color: var(--gold);
  font-size: 1.42rem;
}

.drum small {
  color: var(--muted);
  font-size: .79rem;
}

.panel {
  padding: clamp(17px, 2.3vw, 26px);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(145deg, var(--panel), rgba(12, 12, 10, .94));
  box-shadow: 0 18px 65px rgba(0, 0, 0, .27);
}

.panel-heading {
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 17px;
}

.assign-panel { margin-bottom: 18px; }

.assign-grid {
  display: grid;
  grid-template-columns: minmax(120px, .55fr) minmax(0, 1.6fr) auto;
  gap: 12px;
  align-items: end;
}

.layout {
  display: grid;
  grid-template-columns: minmax(268px, .78fr) minmax(0, 2fr);
  gap: 18px;
  align-items: start;
}

.registry-panel {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  overflow: auto;
}

.workspace {
  display: grid;
  gap: 18px;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.locked-note,
.form-state {
  align-self: start;
  padding: 4px 7px;
  border: 1px solid rgba(255, 226, 173, .18);
  border-radius: 99px;
  color: var(--muted);
  font-size: .67rem;
  font-weight: 800;
  letter-spacing: .03em;
  white-space: nowrap;
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: .79rem;
  font-weight: 720;
}

input,
select,
textarea {
  width: 100%;
  min-height: 43px;
  padding: 10px 11px;
  border: 1px solid rgba(255, 226, 173, .16);
  border-radius: 12px;
  outline: none;
  color: var(--text);
  background: rgba(4, 4, 3, .48);
  transition: .16s ease;
  transition-property: border-color, box-shadow, background;
}

textarea {
  resize: vertical;
  line-height: 1.42;
}

input:focus,
select:focus,
textarea:focus {
  border-color: rgba(255, 226, 173, .67);
  background: rgba(17, 14, 10, .8);
  box-shadow: 0 0 0 3px rgba(199, 155, 51, .13);
}

input::placeholder,
textarea::placeholder {
  color: #867d6e;
}

select option { color: #20180d; }

.search-field { margin-bottom: 10px; }

.hint {
  margin: 0 0 16px;
  color: var(--quiet);
  font-size: .78rem;
}

.round-button {
  width: 39px;
  height: 39px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--gold);
  background: rgba(255, 255, 255, .025);
  font-size: 1.5rem;
  line-height: 1;
}

.round-button:hover {
  border-color: var(--line-strong);
  background: rgba(255, 226, 173, .09);
}

.glyph-list {
  display: grid;
  gap: 8px;
}

.glyph-button {
  display: grid;
  grid-template-columns: 47px minmax(0, 1fr) auto;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 1px solid rgba(255, 226, 173, .12);
  border-radius: 13px;
  color: var(--text);
  background: rgba(4, 4, 3, .28);
  text-align: left;
}

.glyph-button:hover,
.glyph-button.is-selected {
  border-color: rgba(255, 226, 173, .58);
  background: rgba(199, 155, 51, .11);
}

.glyph-mark {
  display: grid;
  width: 47px;
  height: 47px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 226, 173, .15);
  border-radius: 11px;
  color: var(--gold);
  background: rgba(0, 0, 0, .25);
  font-size: 1.25rem;
}

.glyph-name,
.glyph-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.glyph-name {
  margin: 3px 0 4px;
  font-weight: 780;
}

.glyph-meta {
  color: var(--quiet);
  font-size: .72rem;
}

.badge {
  align-self: start;
  padding: 4px 7px;
  border-radius: 99px;
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .04em;
}

.badge.návrh {
  color: var(--warning);
  background: rgba(255, 201, 119, .1);
}

.badge.schváleno {
  color: var(--ok);
  background: rgba(185, 209, 144, .1);
}

.badge.archiv {
  color: var(--quiet);
  background: rgba(255, 255, 255, .04);
}

.empty {
  margin: 7px 0;
  padding: 25px 9px;
  color: var(--muted);
  font-size: .88rem;
  line-height: 1.5;
  text-align: center;
}

.room-scene {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  min-height: 210px;
  padding: 7px;
  border: 1px solid rgba(255, 226, 173, .09);
  border-radius: 17px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 226, 173, .05), transparent 16rem),
    rgba(0, 0, 0, .18);
}

.room-wall {
  position: relative;
  min-width: 0;
  min-height: 184px;
  overflow: hidden;
  border: 1px solid rgba(255, 226, 173, .18);
  border-radius: 17px;
  color: var(--text);
  background: linear-gradient(145deg, #302615, #13110c);
  text-align: left;
  touch-action: manipulation;
}

.room-wall::before {
  position: absolute;
  inset: 11px 11px 34px;
  border: 1px solid rgba(255, 226, 173, .16);
  border-radius: 10px;
  content: "";
}

.room-wall.theme-ash {
  background: linear-gradient(145deg, #312f29, #151412);
}

.room-wall.theme-ember {
  background: linear-gradient(145deg, #442118, #17100c);
}

.room-wall.theme-moss {
  background: linear-gradient(145deg, #253226, #11170f);
}

.room-wall--empty {
  border-style: dashed;
  border-color: rgba(255, 226, 173, .24);
  background:
    radial-gradient(circle at 83% 24%, rgba(199, 155, 51, .11), transparent 5rem),
    linear-gradient(145deg, rgba(55, 43, 20, .62), rgba(14, 12, 9, .76));
}

.room-wall--empty:hover {
  border-color: rgba(255, 226, 173, .62);
  background:
    radial-gradient(circle at 83% 24%, rgba(255, 226, 173, .16), transparent 5rem),
    linear-gradient(145deg, rgba(65, 51, 23, .72), rgba(14, 12, 9, .84));
}

.room-wall:hover,
.room-wall.is-selected {
  border-color: rgba(255, 226, 173, .66);
  transform: translateY(-1px);
}

.room-number,
.room-door,
.room-tip,
.room-empty-title,
.room-reveal {
  position: absolute;
  z-index: 1;
}

.room-number {
  top: 14px;
  left: 15px;
  color: var(--gold);
  font-size: .7rem;
  font-weight: 900;
  letter-spacing: .1em;
}

.room-door {
  right: 20px;
  bottom: 34px;
  width: 47px;
  height: 76px;
  border: 1px solid rgba(255, 226, 173, .36);
  border-radius: 8px 8px 2px 2px;
  background: rgba(0, 0, 0, .21);
  box-shadow: inset -10px 0 0 rgba(255, 226, 173, .035);
}

.room-door::after {
  position: absolute;
  top: 38px;
  right: 7px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--gold);
  content: "";
}

.room-door--empty {
  border-color: rgba(255, 226, 173, .22);
  background: rgba(0, 0, 0, .13);
  opacity: .72;
}

.room-door--empty::after {
  background: rgba(255, 226, 173, .62);
}

.room-empty-title {
  right: 15px;
  bottom: 60px;
  left: 15px;
  color: var(--gold);
  font-size: .85rem;
  font-weight: 820;
  line-height: 1.15;
}

.room-tip {
  right: 15px;
  bottom: 12px;
  left: 15px;
  color: rgba(255, 244, 220, .62);
  font-size: .67rem;
}

.room-reveal {
  inset: 0;
  display: grid;
  padding: 18px;
  place-content: center;
  background: rgba(5, 4, 3, .9);
  text-align: center;
  opacity: 0;
  transform: scale(.96);
  transition: .18s ease;
  transition-property: opacity, transform;
}

.room-wall.is-revealed .room-reveal {
  opacity: 1;
  transform: scale(1);
}

.revealed-glyph {
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: var(--gold);
  font-size: 2.1rem;
  line-height: 1.15;
}

.revealed-description {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: .78rem;
  line-height: 1.4;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.wide { grid-column: 1 / -1; }

.wide b { color: var(--gold-deep); }

.form-notice {
  min-height: 20px;
  margin: 14px 0 11px;
  color: var(--muted);
  font-size: .84rem;
  line-height: 1.42;
}

.form-notice.error { color: var(--danger); }
.form-notice.warning { color: var(--warning); }

.form-actions {
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

.module-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 226, 173, .12);
}

.module-heading {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.module-heading > span {
  color: var(--quiet);
  font-size: .73rem;
}

.module-list {
  display: grid;
  gap: 7px;
  margin-bottom: 11px;
}

.module-button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 9px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid rgba(255, 226, 173, .12);
  border-radius: 11px;
  color: var(--text);
  background: rgba(4, 4, 3, .25);
  text-align: left;
}

.module-button:hover,
.module-button.is-selected {
  border-color: rgba(255, 226, 173, .55);
  background: rgba(199, 155, 51, .1);
}

.module-button strong,
.module-button span {
  display: block;
}

.module-button strong { font-size: .8rem; }

.module-button span {
  color: var(--quiet);
  font-size: .7rem;
}

.module-type {
  align-self: start;
  color: var(--gold);
  font-size: .67rem;
}

.module-form {
  display: grid;
  grid-template-columns: 1fr 128px;
  gap: 8px;
}

.module-form textarea,
.module-form .form-actions {
  grid-column: 1 / -1;
}

.footer-status {
  margin: 18px 2px 0;
  color: var(--quiet);
  font-size: .82rem;
  text-align: center;
}

.footer-status[data-kind="warning"] { color: var(--warning); }
.footer-status[data-kind="error"] { color: var(--danger); }

@media (max-width: 1000px) {
  .layout { grid-template-columns: 1fr; }

  .registry-panel {
    position: static;
    max-height: none;
  }

  .glyph-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .app-shell { padding-inline: 13px; }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .top-actions { justify-content: flex-start; }

  .drum-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .drum {
    min-height: 99px;
    padding: 13px;
  }

  .assign-grid,
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 500px) {
  .glyph-list,
  .form-grid,
  .module-form {
    grid-template-columns: 1fr;
  }

  .wide,
  .module-form textarea,
  .module-form .form-actions {
    grid-column: auto;
  }

  .top-actions .button,
  .form-actions .button {
    width: 100%;
  }

  .room-scene {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .room-wall { min-height: 158px; }
}
