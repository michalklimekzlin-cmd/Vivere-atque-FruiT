:root {
  color-scheme: dark;
  --bg: #090806;
  --panel: rgba(20, 17, 12, .86);
  --panel-deep: rgba(10, 9, 7, .95);
  --line: rgba(255, 226, 173, .18);
  --line-strong: rgba(255, 226, 173, .58);
  --gold: #ffe2ad;
  --gold-soft: #fff0c5;
  --gold-deep: #c79b33;
  --text: #fff8e8;
  --muted: #c9bea7;
  --quiet: #8f8372;
  --danger: #ffac9d;
  --good: #cbe69b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: var(--bg);
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  color: var(--text);
  background:
    radial-gradient(circle at 8% 2%, rgba(199, 155, 51, .2), transparent 27rem),
    radial-gradient(circle at 88% 28%, rgba(255, 226, 173, .08), transparent 32rem),
    linear-gradient(135deg, #070604 0%, #14120c 48%, #080706 100%);
}

button,
input,
a {
  font: inherit;
}

button {
  cursor: pointer;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}

.glyph-app {
  width: min(1760px, 100%);
  margin: 0 auto;
  padding:
    max(18px, env(safe-area-inset-top))
    clamp(14px, 3vw, 46px)
    max(22px, env(safe-area-inset-bottom));
}

.app-header {
  display: grid;
  grid-template-columns: minmax(72px, 1fr) auto minmax(72px, 1fr);
  align-items: center;
  gap: 14px;
  min-height: 62px;
}

.back-link,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 13px;
  color: var(--gold);
  background: rgba(255, 255, 255, .025);
  text-decoration: none;
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}

.back-link {
  justify-self: start;
  gap: 7px;
  padding: 0 12px;
  font-size: .79rem;
  font-weight: 850;
  letter-spacing: .08em;
}

.icon-button {
  width: 40px;
  padding: 0;
  color: var(--gold-soft);
  font-size: 1.15rem;
  font-weight: 800;
}

.back-link:hover,
.icon-button:hover,
.quiet-button:hover,
.danger-button:hover,
.choice:hover,
.style-choice:hover,
.token-button:hover {
  border-color: var(--line-strong);
  background: rgba(255, 226, 173, .11);
}

.back-link:active,
.icon-button:active,
.quiet-button:active,
.danger-button:active,
.choice:active,
.style-choice:active,
.token-button:active {
  transform: translateY(1px);
}

.title-stack {
  min-width: 0;
  text-align: center;
}

.eyebrow {
  margin: 0 0 5px;
  color: var(--gold-deep);
  font-size: .68rem;
  font-weight: 850;
  letter-spacing: .14em;
  line-height: 1.2;
  text-transform: uppercase;
}

.title-glyphs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 3px;
  max-width: 100%;
}

.title-token {
  display: grid;
  min-width: 18px;
  min-height: 25px;
  place-items: center;
  padding: 1px 4px;
  border: 1px solid rgba(255, 226, 173, .33);
  border-radius: 8px;
  color: var(--gold);
  background:
    linear-gradient(180deg, rgba(255, 226, 173, .13), rgba(255, 226, 173, .02)),
    rgba(0, 0, 0, .25);
  box-shadow: inset 0 0 10px rgba(255, 226, 173, .07);
  font-size: clamp(.83rem, 1.55vw, 1.1rem);
  font-weight: 850;
  line-height: 1;
}

.title-gap {
  width: 8px;
  height: 1px;
  flex: 0 0 8px;
}

.header-actions {
  display: flex;
  justify-self: end;
  gap: 6px;
}

.import-label {
  cursor: pointer;
}

.intro-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 26px;
  margin: 24px 0 18px;
  padding: clamp(20px, 3vw, 34px);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 28px;
  background:
    linear-gradient(115deg, rgba(255, 226, 173, .09), transparent 52%),
    linear-gradient(145deg, rgba(31, 25, 16, .9), rgba(11, 10, 8, .93));
  box-shadow: 0 22px 70px rgba(0, 0, 0, .3);
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  max-width: 760px;
  margin-bottom: 10px;
  color: var(--gold);
  font-size: clamp(2rem, 4.8vw, 4rem);
  letter-spacing: -.06em;
  line-height: .98;
}

h2 {
  margin-bottom: 0;
  color: var(--gold-soft);
  font-size: 1rem;
  letter-spacing: -.02em;
}

.intro-card p:not(.eyebrow) {
  max-width: 810px;
  margin-bottom: 0;
  color: var(--muted);
  font-size: clamp(.96rem, 1.6vw, 1.12rem);
  line-height: 1.55;
}

.sample {
  color: var(--gold);
  font-weight: 780;
  white-space: nowrap;
}

.rule-card {
  display: grid;
  min-width: 166px;
  gap: 2px;
  padding: 18px;
  border: 1px solid rgba(255, 226, 173, .29);
  border-radius: 20px;
  color: var(--muted);
  background: rgba(6, 5, 4, .42);
  box-shadow: inset 0 0 28px rgba(255, 226, 173, .05);
}

.rule-card strong {
  color: var(--gold);
  font-size: 2.1rem;
  letter-spacing: -.06em;
  line-height: 1;
}

.rule-card span {
  font-size: .81rem;
  font-weight: 740;
}

.rule-card small {
  color: var(--quiet);
  font-size: .7rem;
  line-height: 1.35;
}

.workbench {
  display: grid;
  grid-template-columns: minmax(250px, .62fr) minmax(520px, 1.56fr) minmax(250px, .62fr);
  gap: 16px;
  align-items: stretch;
}

.side-panel,
.workspace-panel {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 24px;
  background:
    linear-gradient(145deg, var(--panel), var(--panel-deep));
  box-shadow: 0 20px 60px rgba(0, 0, 0, .26);
}

.side-panel {
  align-self: start;
  padding: clamp(15px, 1.7vw, 22px);
}

/* Levý panel je vstup do nové řádky. Vlastní třída udržuje jeho účel
   čitelný i při změně rozvržení na telefonu. */
.creator-panel {
  position: relative;
}

.creator-panel::after {
  position: absolute;
  right: 18px;
  bottom: 17px;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 226, 173, .09);
  border-radius: 50%;
  box-shadow: 0 0 0 10px rgba(255, 226, 173, .018);
  content: "";
  pointer-events: none;
}

.workspace-panel {
  display: flex;
  min-height: 650px;
  flex-direction: column;
  padding: 14px;
}

.panel-heading,
.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 13px;
}

.panel-heading {
  margin-bottom: 14px;
}

.panel-heading.compact {
  margin-bottom: 10px;
}

.panel-mark {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 1px solid rgba(255, 226, 173, .2);
  border-radius: 10px;
  color: var(--gold);
  background: rgba(255, 226, 173, .05);
  font-size: 1rem;
}

.creator-form,
.inspector-form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: .76rem;
  font-weight: 760;
}

input {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 9px 10px;
  border: 1px solid rgba(255, 226, 173, .17);
  border-radius: 12px;
  outline: none;
  color: var(--text);
  background: rgba(3, 3, 2, .5);
  transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
}

input:focus {
  border-color: rgba(255, 226, 173, .65);
  background: rgba(18, 15, 10, .9);
  box-shadow: 0 0 0 3px rgba(199, 155, 51, .12);
}

input:disabled {
  cursor: not-allowed;
  opacity: .48;
}

input::placeholder {
  color: #807565;
}

.choice-fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.choice-fieldset legend {
  margin-bottom: 7px;
  padding: 0;
  color: var(--muted);
  font-size: .76rem;
  font-weight: 760;
}

.choice-row,
.style-choice-row {
  display: flex;
  gap: 6px;
}

.choice {
  flex: 1 1 0;
  min-height: 35px;
  padding: 6px 5px;
  border: 1px solid rgba(255, 226, 173, .16);
  border-radius: 10px;
  color: var(--muted);
  background: rgba(0, 0, 0, .18);
  font-size: .72rem;
  font-weight: 780;
  transition: transform .16s ease, border-color .16s ease, background .16s ease, color .16s ease;
}

.choice.is-selected {
  border-color: rgba(255, 226, 173, .58);
  color: #171006;
  background: linear-gradient(135deg, #ffe9bd, #d9a94f);
}

.style-choice {
  display: grid;
  flex: 1 1 0;
  height: 42px;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(255, 226, 173, .16);
  border-radius: 11px;
  background: rgba(0, 0, 0, .19);
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}

.style-choice.is-selected {
  border-color: rgba(255, 226, 173, .63);
  background: rgba(255, 226, 173, .12);
  box-shadow: inset 0 0 14px rgba(255, 226, 173, .1);
}

.style-choice i {
  position: relative;
  display: block;
  width: 23px;
  height: 23px;
  border: 2px solid var(--gold);
}

.style-ring-icon {
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(255, 226, 173, .11);
}

.style-bracket-icon {
  border-right-color: transparent !important;
  border-left-color: transparent !important;
  border-radius: 4px;
}

.style-bracket-icon::before,
.style-bracket-icon::after {
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 4px;
  border-top: 2px solid var(--gold);
  border-bottom: 2px solid var(--gold);
  content: "";
}

.style-bracket-icon::before {
  left: -3px;
  border-left: 2px solid var(--gold);
}

.style-bracket-icon::after {
  right: -3px;
  border-right: 2px solid var(--gold);
}

.style-rail-icon {
  height: 18px !important;
  border-right: 0 !important;
  border-left: 0 !important;
  box-shadow: 0 7px 0 -5px var(--gold), 0 -7px 0 -5px var(--gold);
}

.style-capsule-icon {
  width: 26px !important;
  height: 17px !important;
  border-radius: 99px;
}

.primary-button,
.quiet-button,
.danger-button {
  display: inline-flex;
  min-height: 41px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 11px;
  font-size: .79rem;
  font-weight: 820;
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}

.primary-button {
  border-color: rgba(255, 226, 173, .62);
  color: #1b1205;
  background: linear-gradient(135deg, #ffebbf, #d9a94c);
}

.primary-button:hover {
  background: linear-gradient(135deg, #fff2d6, #e3b45a);
}

.quiet-button {
  color: var(--gold);
  background: rgba(255, 255, 255, .025);
}

.danger-button {
  border-color: rgba(255, 172, 157, .34);
  color: var(--danger);
  background: rgba(255, 132, 117, .04);
}

.danger-button:hover {
  border-color: rgba(255, 172, 157, .68);
  background: rgba(255, 132, 117, .11);
}

.full-width {
  width: 100%;
}

.token-maker,
.token-shelf-section,
.cell-editor {
  margin-top: 19px;
  padding-top: 17px;
  border-top: 1px solid rgba(255, 226, 173, .12);
}

.helper-text,
.cell-info,
.workspace-message,
.empty-selection {
  color: var(--quiet);
  font-size: .76rem;
  line-height: 1.5;
}

.helper-text {
  margin: 10px 0 0;
}

.token-shelf {
  display: flex;
  max-height: 216px;
  flex-wrap: wrap;
  gap: 6px;
  overflow: auto;
  padding-right: 3px;
  scrollbar-color: rgba(255, 226, 173, .42) transparent;
}

.token-button {
  display: grid;
  min-width: 32px;
  min-height: 31px;
  place-items: center;
  padding: 3px 6px;
  border: 1px solid rgba(255, 226, 173, .14);
  border-radius: 9px;
  color: var(--gold-soft);
  background: rgba(0, 0, 0, .22);
  font-size: .78rem;
  font-weight: 800;
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}

.token-button.is-custom {
  border-color: rgba(199, 155, 51, .52);
  color: var(--gold);
}

.workspace-header {
  align-items: center;
  padding: 5px 5px 14px;
}

.workspace-state {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
  color: var(--quiet);
  font-size: .71rem;
  font-weight: 760;
  text-align: right;
}

.workspace-state output:first-child {
  color: var(--gold);
}

.glyph-workspace {
  position: relative;
  min-height: 570px;
  flex: 1 1 auto;
  overflow: hidden;
  border: 1px solid rgba(255, 226, 173, .16);
  border-radius: 18px;
  background:
    linear-gradient(rgba(255, 226, 173, .055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 226, 173, .055) 1px, transparent 1px),
    radial-gradient(circle at 23% 24%, rgba(199, 155, 51, .14), transparent 20rem),
    radial-gradient(circle at 73% 75%, rgba(255, 226, 173, .07), transparent 23rem),
    #0a0906;
  background-size: 42px 42px, 42px 42px, auto, auto, auto;
  box-shadow: inset 0 0 65px rgba(0, 0, 0, .4);
  isolation: isolate;
}

.glyph-workspace::before,
.glyph-workspace::after {
  position: absolute;
  z-index: -1;
  width: 260px;
  height: 260px;
  border: 1px solid rgba(255, 226, 173, .12);
  border-radius: 50%;
  content: "";
  pointer-events: none;
}

.glyph-workspace::before {
  top: -154px;
  left: -96px;
  box-shadow: 0 0 0 27px rgba(255, 226, 173, .025);
}

.glyph-workspace::after {
  right: -154px;
  bottom: -112px;
  box-shadow: 0 0 0 31px rgba(255, 226, 173, .02);
}

.glyph-block {
  position: absolute;
  min-width: 92px;
  max-width: min(88%, 690px);
  padding: 5px 6px 7px;
  border: 1px solid rgba(255, 226, 173, .23);
  border-radius: 17px;
  background:
    linear-gradient(145deg, rgba(31, 26, 18, .95), rgba(9, 8, 6, .93));
  box-shadow: 0 14px 33px rgba(0, 0, 0, .34), inset 0 0 20px rgba(255, 226, 173, .04);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: border-color .18s ease, box-shadow .18s ease;
}

.glyph-block.is-selected {
  border-color: rgba(255, 226, 173, .68);
  box-shadow: 0 0 0 2px rgba(199, 155, 51, .15), 0 16px 38px rgba(0, 0, 0, .42), inset 0 0 20px rgba(255, 226, 173, .07);
}

/* Tento stav přidává app.js během přesunu. Je záměrně bez změny rozměru,
   aby blok nepřeskočil přes okraj pracovní plochy. */
.glyph-block:has(.glyph-block-grip.is-dragging) {
  z-index: 9;
  border-color: rgba(255, 239, 197, .88);
  box-shadow: 0 0 0 3px rgba(199, 155, 51, .18), 0 23px 46px rgba(0, 0, 0, .56), inset 0 0 24px rgba(255, 226, 173, .12);
}

.glyph-block-grip {
  display: flex;
  height: 20px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px 3px;
  color: rgba(255, 226, 173, .5);
  cursor: grab;
  touch-action: none;
}

.glyph-block-grip:active {
  cursor: grabbing;
}

.glyph-block-grip.is-dragging {
  cursor: grabbing;
  color: var(--gold-soft);
}

.glyph-block-grip.is-dragging .grip-dots {
  filter: drop-shadow(0 0 6px rgba(255, 226, 173, .78));
}

.grip-dots {
  display: block;
  width: 27px;
  height: 8px;
  background:
    radial-gradient(circle, currentColor 1.1px, transparent 1.8px) 0 0 / 7px 4px;
}

.glyph-block-index {
  color: rgba(255, 226, 173, .44);
  font-size: .61rem;
  font-weight: 820;
  letter-spacing: .12em;
}

.drum-run {
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.glyph-space {
  width: 12px;
  height: 1px;
  flex: 0 0 12px;
}

.glyph-drum {
  position: relative;
  display: flex;
  min-width: 48px;
  min-height: 66px;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid rgba(255, 226, 173, .29);
  color: var(--gold-soft);
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 226, 173, .15), transparent 54%),
    rgba(3, 3, 2, .62);
  box-shadow: inset 0 0 16px rgba(255, 226, 173, .07), 0 5px 14px rgba(0, 0, 0, .2);
}

.glyph-block.style-ring .glyph-drum {
  border-radius: 25px;
}

.glyph-block.style-ring .glyph-drum::after {
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(255, 226, 173, .14);
  border-radius: inherit;
  content: "";
  pointer-events: none;
}

.glyph-block.style-bracket .glyph-drum {
  border-radius: 8px;
  border-right-color: transparent;
  border-left-color: transparent;
  background: linear-gradient(90deg, rgba(255, 226, 173, .12), transparent 18%, transparent 82%, rgba(255, 226, 173, .12)), rgba(3, 3, 2, .62);
}

.glyph-block.style-bracket .glyph-drum::before,
.glyph-block.style-bracket .glyph-drum::after {
  position: absolute;
  top: 5px;
  bottom: 5px;
  width: 5px;
  border-top: 1px solid rgba(255, 226, 173, .7);
  border-bottom: 1px solid rgba(255, 226, 173, .7);
  content: "";
  pointer-events: none;
}

.glyph-block.style-bracket .glyph-drum::before {
  left: 3px;
  border-left: 1px solid rgba(255, 226, 173, .7);
}

.glyph-block.style-bracket .glyph-drum::after {
  right: 3px;
  border-right: 1px solid rgba(255, 226, 173, .7);
}

.glyph-block.style-rail .glyph-drum {
  min-height: 58px;
  border-radius: 6px;
  border-right: 0;
  border-left: 0;
  box-shadow: inset 0 10px 0 -9px rgba(255, 226, 173, .55), inset 0 -10px 0 -9px rgba(255, 226, 173, .55);
}

.glyph-block.style-capsule .glyph-drum {
  min-width: 56px;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 226, 173, .2), rgba(255, 226, 173, .02) 42%, rgba(0, 0, 0, .32)),
    rgba(14, 12, 8, .9);
}

.glyph-drum.is-double {
  min-width: 92px;
}

.glyph-drum.is-word {
  min-width: 76px;
  max-width: min(245px, 68vw);
}

.reel {
  position: relative;
  z-index: 1;
  display: grid;
  min-width: 46px;
  flex: 1 1 46px;
  grid-template-rows: 16px 30px 16px;
  align-items: center;
  overflow: hidden;
  padding: 0 5px;
  border: 0;
  color: inherit;
  background: transparent;
  touch-action: none;
}

.reel:focus-visible {
  z-index: 4;
  outline: 2px solid var(--gold-soft);
  outline-offset: -3px;
}

.glyph-drum.is-word .reel {
  min-width: 74px;
  grid-template-rows: 16px 30px 16px;
}

.reel::before,
.reel::after {
  position: absolute;
  right: 5px;
  left: 5px;
  z-index: 2;
  height: 1px;
  background: rgba(255, 226, 173, .15);
  content: "";
  pointer-events: none;
}

.reel::before {
  top: 17px;
}

.reel::after {
  bottom: 17px;
}

.reel.is-selected {
  background: linear-gradient(180deg, rgba(255, 226, 173, .15), rgba(255, 226, 173, .02), rgba(255, 226, 173, .13));
  box-shadow: inset 0 0 0 1px rgba(255, 226, 173, .53);
}

.reel-ghost,
.reel-current {
  display: block;
  width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.reel-ghost {
  color: rgba(255, 240, 197, .28);
  font-size: .62rem;
  line-height: 1;
}

.reel-current {
  color: var(--gold-soft);
  font-size: .96rem;
  font-weight: 860;
  letter-spacing: .02em;
  line-height: 1;
  text-shadow: 0 0 14px rgba(255, 218, 147, .52);
}

.glyph-drum.is-word .reel-current {
  font-size: .86rem;
}

.reel.is-spinning .reel-current {
  animation: reel-step .22s ease-out;
}

.reel.is-spinning[data-direction="-1"] .reel-current {
  animation-name: reel-step-down;
}

.double-divider {
  position: relative;
  z-index: 3;
  display: grid;
  width: 9px;
  place-items: center;
  color: rgba(255, 226, 173, .58);
  font-size: .76rem;
  pointer-events: none;
}

.selected-badge {
  display: grid;
  min-width: 30px;
  min-height: 28px;
  place-items: center;
  padding: 3px 7px;
  border: 1px solid rgba(255, 226, 173, .18);
  border-radius: 10px;
  color: var(--gold);
  font-size: .68rem;
  font-weight: 850;
}

.cell-info {
  min-height: 35px;
  margin: 0 0 9px;
}

.inspector-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.empty-selection {
  display: grid;
  min-height: 180px;
  place-items: center;
  padding: 20px;
  border: 1px dashed rgba(255, 226, 173, .16);
  border-radius: 16px;
  text-align: center;
}

.workspace-message {
  margin: 12px 5px 2px;
}

.app-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px 16px;
  margin: 17px 0 3px;
  color: var(--quiet);
  font-size: .73rem;
  text-align: center;
}

.app-footer a {
  color: var(--gold);
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

/* Jemné posuvníky zůstanou viditelné i v Safari, ale nepřebijí pracovní plochu. */
.token-shelf::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.token-shelf::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 226, 173, .32);
}

@keyframes reel-step {
  from {
    transform: translateY(12px);
    opacity: .2;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes reel-step-down {
  from {
    transform: translateY(-12px);
    opacity: .2;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 1220px) {
  .workbench {
    grid-template-columns: minmax(240px, .73fr) minmax(460px, 1.55fr);
  }

  .inspector-panel {
    grid-column: 1 / -1;
  }

  .inspector-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .inspector-form > label,
  .inspector-form > .choice-fieldset,
  .cell-editor,
  .inspector-actions {
    min-width: 0;
  }

  .cell-editor {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }
}

@media (max-width: 800px) {
  .glyph-app {
    padding-right: 13px;
    padding-left: 13px;
  }

  .app-header {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .back-link {
    width: 40px;
    padding: 0;
  }

  .back-link span:last-child {
    display: none;
  }

  .intro-card {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .rule-card {
    grid-template-columns: auto 1fr;
    align-items: center;
    min-width: 0;
  }

  .rule-card strong {
    grid-row: span 2;
  }

  .workbench {
    grid-template-columns: 1fr;
  }

  .workspace-panel {
    min-height: 570px;
    order: -1;
  }

  .glyph-workspace {
    min-height: 485px;
  }

  .inspector-form {
    grid-template-columns: 1fr;
  }

  .cell-editor {
    margin-top: 19px;
    padding-top: 17px;
    border-top: 1px solid rgba(255, 226, 173, .12);
  }
}

@media (max-width: 460px) {
  .title-token:nth-child(n + 10) {
    display: none;
  }

  .header-actions {
    gap: 4px;
  }

  .icon-button {
    width: 35px;
    min-height: 35px;
  }

  .workspace-panel {
    padding: 9px;
  }

  .workspace-header {
    align-items: flex-start;
  }

  .workspace-state {
    max-width: 100px;
  }

  .glyph-block {
    max-width: 94%;
  }
}

/* iPhone na šířku: dílna zůstane kompaktní a ovladatelná jednou rukou. */
@media (orientation: landscape) and (max-height: 540px) {
  .glyph-app {
    padding-top: max(9px, env(safe-area-inset-top));
    padding-bottom: max(11px, env(safe-area-inset-bottom));
  }

  .app-header {
    min-height: 40px;
  }

  .back-link,
  .icon-button {
    min-height: 34px;
  }

  .back-link {
    font-size: .7rem;
  }

  .intro-card {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    margin: 10px 0;
    padding: 14px 16px;
  }

  .intro-card p:not(.eyebrow) {
    font-size: .82rem;
  }

  .rule-card {
    min-width: 126px;
    padding: 11px;
  }

  .rule-card strong {
    font-size: 1.55rem;
  }

  .workspace-panel {
    min-height: 430px;
    padding: 10px;
  }

  .glyph-workspace {
    min-height: 350px;
  }

  .side-panel {
    padding: 13px;
  }

  .token-shelf {
    max-height: 128px;
  }

  .glyph-drum {
    min-width: 43px;
    min-height: 58px;
  }

  .reel {
    min-width: 41px;
    flex-basis: 41px;
    grid-template-rows: 14px 28px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
