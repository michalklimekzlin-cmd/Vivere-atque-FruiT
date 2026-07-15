/*
 * CHT 360°‰. — společný most pro PWA Bubínky a Paměť.
 *
 * Zámek chrání otevření slotu v tomto prohlížeči. Hash kódu se ukládá
 * zvlášť od obsahu Paměti, aby se samotný kód nikde neobjevil v čitelné podobě.
 * Není to šifrovaný trezor proti člověku s přístupem k datům prohlížeče.
 */

export const SLOT_LOCKS_STORAGE_KEY = "cht360_slot_locks_v1";
export const SLOT_UNLOCKS_STORAGE_KEY = "cht360_slot_unlocks_v1";
export const SLOT_LOCKS_SCHEMA = "cht360-slot-locks-v1";
export const SLOT_LOCK_TOKENS = Object.freeze([
  "A", "E", "I", "O", "U", "Á", "Č", "Ě", "Ř", "Š", "Ž",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "◌", "•", "△", "□", "◆", "☆", "ア"
]);
export const SLOT_LOCK_MIN_DRUMS = 4;
export const SLOT_LOCK_MAX_DRUMS = 8;
export const DEFAULT_UNLOCK_MINUTES = 15;

const CORE_IDS = new Set(["earth", "language", "game", "control"]);
const encoder = new TextEncoder();

function now() {
  return Date.now();
}

function validCoreId(coreId) {
  const value = String(coreId || "");
  if (!CORE_IDS.has(value)) {
    throw new Error("Neznámé jádro zámku.");
  }
  return value;
}

function validSlotId(slotId) {
  const value = Number(slotId);
  if (!Number.isInteger(value) || value < 1 || value > 70) {
    throw new Error("Slot zámku musí být v rozsahu 1 až 70.");
  }
  return value;
}

function validToken(token) {
  const value = String(token || "").trim();
  if (!SLOT_LOCK_TOKENS.includes(value)) {
    throw new Error("Bubínek obsahuje nepovolený znak.");
  }
  return value;
}

function lockKey(coreId, slotId) {
  return `${validCoreId(coreId)}:${validSlotId(slotId)}`;
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normaliseLockRecord(record) {
  if (!record || typeof record !== "object") return null;
  const salt = String(record.salt || "");
  const digest = String(record.digest || "");
  const createdAt = Number(record.createdAt) || now();
  const updatedAt = Number(record.updatedAt) || createdAt;

  if (!/^[a-f0-9]{24,128}$/i.test(salt) || !/^[a-f0-9]{64}$/i.test(digest)) {
    return null;
  }

  return {
    version: 1,
    salt,
    digest,
    hint: String(record.hint || "").trim().slice(0, 80),
    createdAt,
    updatedAt
  };
}

function readLocks() {
  const value = readJson(SLOT_LOCKS_STORAGE_KEY, {});
  const locks = {};

  for (const [key, record] of Object.entries(value.locks || value)) {
    const [coreId, rawSlotId] = key.split(":");
    try {
      const safeKey = lockKey(coreId, rawSlotId);
      const normalised = normaliseLockRecord(record);
      if (normalised) locks[safeKey] = normalised;
    } catch {
      /* Jeden poškozený zámek neblokuje zbytek Paměti. */
    }
  }

  return locks;
}

function writeLocks(locks) {
  writeJson(SLOT_LOCKS_STORAGE_KEY, {
    schema: SLOT_LOCKS_SCHEMA,
    version: 1,
    updatedAt: now(),
    locks
  });
  announceChange();
}

function readUnlocks() {
  const value = readJson(SLOT_UNLOCKS_STORAGE_KEY, {});
  const unlocks = {};

  for (const [key, expiresAt] of Object.entries(value.unlocks || value)) {
    const timestamp = Number(expiresAt);
    if (Number.isFinite(timestamp) && timestamp > now()) unlocks[key] = timestamp;
  }

  return unlocks;
}

function writeUnlocks(unlocks) {
  writeJson(SLOT_UNLOCKS_STORAGE_KEY, {
    schema: SLOT_LOCKS_SCHEMA,
    version: 1,
    updatedAt: now(),
    unlocks
  });
  announceChange();
}

function announceChange() {
  globalThis.dispatchEvent?.(new CustomEvent("cht.slotLocks.changed"));
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Prohlížeč neumí bezpečně vytvořit zámek.");
  }
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

async function digest(value) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Prohlížeč neumí bezpečně ověřit zámek.");
  }
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(buffer), value => value.toString(16).padStart(2, "0")).join("");
}

function codeText(tokens) {
  const values = Array.isArray(tokens) ? tokens : [];
  if (values.length < SLOT_LOCK_MIN_DRUMS || values.length > SLOT_LOCK_MAX_DRUMS) {
    throw new Error(`Zámek potřebuje ${SLOT_LOCK_MIN_DRUMS} až ${SLOT_LOCK_MAX_DRUMS} bubínků.`);
  }
  return values.map(validToken).join("\u241f");
}

function safePublicLock(record) {
  if (!record) return null;
  return {
    hint: record.hint,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function getSlotLock(coreId, slotId) {
  const record = readLocks()[lockKey(coreId, slotId)] || null;
  return safePublicLock(record);
}

export function clearExpiredSlotUnlocks() {
  const current = readUnlocks();
  writeUnlocks(current);
  return current;
}

export function getSlotLockState(coreId, slotId) {
  const key = lockKey(coreId, slotId);
  const locks = readLocks();
  const lock = locks[key] || null;
  const unlocks = readUnlocks();
  const expiresAt = Number(unlocks[key]) || 0;

  return {
    locked: Boolean(lock),
    unlocked: Boolean(lock && expiresAt > now()),
    expiresAt: expiresAt > now() ? expiresAt : null,
    lock: safePublicLock(lock)
  };
}

export async function setSlotLock(coreId, slotId, tokens, hint = "") {
  const key = lockKey(coreId, slotId);
  const phrase = codeText(tokens);
  const salt = randomSalt();
  const timestamp = now();
  const locks = readLocks();
  const previous = normaliseLockRecord(locks[key]);

  locks[key] = {
    version: 1,
    salt,
    digest: await digest(`${salt}:${phrase}`),
    hint: String(hint || "").trim().slice(0, 80),
    createdAt: previous?.createdAt || timestamp,
    updatedAt: timestamp
  };

  writeLocks(locks);
  const unlocks = readUnlocks();
  delete unlocks[key];
  writeUnlocks(unlocks);
  return safePublicLock(locks[key]);
}

export async function unlockSlot(coreId, slotId, tokens, minutes = DEFAULT_UNLOCK_MINUTES) {
  const key = lockKey(coreId, slotId);
  const record = normaliseLockRecord(readLocks()[key]);
  if (!record) return { ok: true, expiresAt: null, wasLocked: false };

  const phrase = codeText(tokens);
  const candidate = await digest(`${record.salt}:${phrase}`);
  if (candidate !== record.digest) return { ok: false, expiresAt: null, wasLocked: true };

  const safeMinutes = Math.max(1, Math.min(120, Number(minutes) || DEFAULT_UNLOCK_MINUTES));
  const expiresAt = now() + safeMinutes * 60 * 1000;
  const unlocks = readUnlocks();
  unlocks[key] = expiresAt;
  writeUnlocks(unlocks);
  return { ok: true, expiresAt, wasLocked: true };
}

export async function removeSlotLock(coreId, slotId, tokens) {
  const key = lockKey(coreId, slotId);
  const result = await unlockSlot(coreId, slotId, tokens, 1);
  if (!result.ok) return false;

  const locks = readLocks();
  delete locks[key];
  writeLocks(locks);
  const unlocks = readUnlocks();
  delete unlocks[key];
  writeUnlocks(unlocks);
  return true;
}

export function listSlotLocks() {
  return Object.entries(readLocks()).map(([key, record]) => {
    const [coreId, slotId] = key.split(":");
    return {
      coreId,
      slotId: Number(slotId),
      ...safePublicLock(record),
      ...getSlotLockState(coreId, slotId)
    };
  });
}

export function exportSlotLocks() {
  return JSON.stringify({
    schema: SLOT_LOCKS_SCHEMA,
    version: 1,
    exportedAt: new Date().toISOString(),
    locks: readLocks()
  }, null, 2);
}

export function importSlotLocks(text) {
  let source;
  try {
    source = JSON.parse(String(text || ""));
  } catch {
    throw new Error("Soubor zámků není platný JSON.");
  }

  const incoming = source?.locks && typeof source.locks === "object"
    ? source.locks
    : source;
  const locks = {};

  for (const [key, record] of Object.entries(incoming || {})) {
    const [coreId, slotId] = key.split(":");
    try {
      const safeKey = lockKey(coreId, slotId);
      const normalised = normaliseLockRecord(record);
      if (normalised) locks[safeKey] = normalised;
    } catch {
      /* Neplatný zámek při importu jen přeskočíme. */
    }
  }

  writeLocks(locks);
  writeUnlocks({});
  return Object.keys(locks).length;
}
