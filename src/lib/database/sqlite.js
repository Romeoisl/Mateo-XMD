const path = require("path");
const Database = require("better-sqlite3");

function merge(base, patch) { return { ...(base || {}), ...(patch || {}) }; }

class SqliteAdapter {
  constructor(options = {}) {
    this.type = "sqlite";
    this.file = path.resolve(options.file || "src/database/xmd.sqlite");
    this.db = null;
  }

  init() {
    this.db = new Database(this.file);
    this.db.pragma("journal_mode = WAL");
    this.ensureSchema();
  }

  ensureSchema() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  }

  health() { return this.db.prepare("SELECT 1 AS ok").get().ok === 1; }
  getUser(id) { const r = this.db.prepare("SELECT data FROM users WHERE id=?").get(id); return r ? JSON.parse(r.data) : null; }
  upsertUser(id, data = {}) {
    if (!id) return null;
    const value = { ...merge(this.getUser(id), data), id, updatedAt: Date.now() };
    this.db.prepare(`INSERT INTO users(id,data,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`).run(id, JSON.stringify(value), value.updatedAt);
    return value;
  }
  getGroup(id) { const r = this.db.prepare("SELECT data FROM groups WHERE id=?").get(id); return r ? JSON.parse(r.data) : null; }
  upsertGroup(id, data = {}) {
    if (!id) return null;
    const old = this.getGroup(id) || {};
    const value = { ...old, ...data, id, settings: { ...(old.settings || {}), ...(data.settings || {}) }, updatedAt: Date.now() };
    this.db.prepare(`INSERT INTO groups(id,data,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`).run(id, JSON.stringify(value), value.updatedAt);
    return value;
  }
  getSetting(key, fallback = null) { const r = this.db.prepare("SELECT value FROM settings WHERE key=?").get(key); return r ? JSON.parse(r.value) : fallback; }
  setSetting(key, value) { this.db.prepare(`INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(key, JSON.stringify(value)); return value; }
  getStats() { return { users: this.db.prepare("SELECT COUNT(*) count FROM users").get().count, groups: this.db.prepare("SELECT COUNT(*) count FROM groups").get().count }; }
  close() { if (this.db?.open) this.db.close(); }
}
module.exports = SqliteAdapter;
