const JsonAdapter = require("./json");
const SqliteAdapter = require("./sqlite");
const MongoAdapter = require("./mongodb");
const { migrate } = require("./migrations");
const health = require("./health");

let adapter = null;
let initialized = false;
let migrationVersion = 0;

function normalizeType(type) {
  const value = String(type || "json").toLowerCase();
  if (["json", "sqlite", "mongodb", "mongo"].includes(value)) return value === "mongo" ? "mongodb" : value;
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
  if (db.autoMigrate !== false) migrationVersion = await migrate(adapter, 0);
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
function healthCheck() { return health.check(requireAdapter()); }
async function closeDatabase() { if (!adapter) return; await adapter.close(); adapter = null; initialized = false; migrationVersion = 0; }
function type() { return adapter?.type || null; }
function version() { return migrationVersion; }
function raw() { return requireAdapter(); }

module.exports = { init, getUser, upsertUser, getGroup, upsertGroup, getSetting, setSetting, getStats, healthCheck, closeDatabase, type, version, raw };
