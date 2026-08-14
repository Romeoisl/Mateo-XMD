const JsonAdapter = require("./json");
const SqliteAdapter = require("./sqlite");
const MongoAdapter = require("./mongodb");

let adapter = null;
let initialized = false;

function normalizeType(type) {
  const value = String(type || "json").toLowerCase();
  if (["json", "sqlite", "mongodb", "mongo"].includes(value)) {
    return value === "mongo" ? "mongodb" : value;
  }
  throw new Error(`Unsupported database type: ${type}`);
}

async function init(config) {
  if (initialized) return adapter;

  const db = config.database || {};
  const type = normalizeType(db.type);

  if (type === "json") adapter = new JsonAdapter(db.json || {});
  if (type === "sqlite") adapter = new SqliteAdapter(db.sqlite || {});
  if (type === "mongodb") adapter = new MongoAdapter(db.mongodb || {});

  await adapter.init();
  initialized = true;
  return adapter;
}

function requireAdapter() {
  if (!adapter) throw new Error("Database has not been initialized.");
  return adapter;
}

function getUser(id) { return requireAdapter().getUser(id); }
function upsertUser(id, data) { return requireAdapter().upsertUser(id, data); }
function getGroup(id) { return requireAdapter().getGroup(id); }
function upsertGroup(id, data) { return requireAdapter().upsertGroup(id, data); }
function getSetting(key, fallback) { return requireAdapter().getSetting(key, fallback); }
function setSetting(key, value) { return requireAdapter().setSetting(key, value); }
function getStats() { return requireAdapter().getStats(); }
async function closeDatabase() {
  if (!adapter) return;
  await adapter.close();
  adapter = null;
  initialized = false;
}

function type() { return adapter?.type || null; }

module.exports = {
  init,
  getUser,
  upsertUser,
  getGroup,
  upsertGroup,
  getSetting,
  setSetting,
  getStats,
  closeDatabase,
  type
};
