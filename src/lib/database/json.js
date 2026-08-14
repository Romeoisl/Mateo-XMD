const fs = require("fs");
const path = require("path");

class JsonAdapter {
  constructor(options = {}) {
    this.type = "json";
    this.file = path.resolve(options.file || "src/database/data.json");
    this.db = null;
    this.timer = null;
  }

  init() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    try { this.db = JSON.parse(fs.readFileSync(this.file, "utf8")); }
    catch { this.db = { users: {}, groups: {}, settings: {} }; }
    this.db.users ??= {};
    this.db.groups ??= {};
    this.db.settings ??= {};
  }

  ensureSchema() { this.db.users ??= {}; this.db.groups ??= {}; this.db.settings ??= {}; }
  health() { this.ensureSchema(); return true; }

  save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2));
    fs.renameSync(tmp, this.file);
  }

  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.save(), 100);
    this.timer.unref?.();
  }

  getUser(id) { return this.db.users[id] || null; }
  upsertUser(id, data = {}) {
    if (!id) return null;
    this.db.users[id] = { ...(this.db.users[id] || {}), ...data, id, updatedAt: Date.now() };
    this.schedule(); return this.db.users[id];
  }

  getGroup(id) { return this.db.groups[id] || null; }
  upsertGroup(id, data = {}) {
    if (!id) return null;
    const old = this.db.groups[id] || {};
    this.db.groups[id] = { ...old, ...data, id,
      settings: { ...(old.settings || {}), ...(data.settings || {}) }, updatedAt: Date.now() };
    this.schedule(); return this.db.groups[id];
  }

  getSetting(key, fallback = null) { return this.db.settings[key] ?? fallback; }
  setSetting(key, value) { this.db.settings[key] = value; this.schedule(); return value; }
  getStats() { return { users: Object.keys(this.db.users).length, groups: Object.keys(this.db.groups).length }; }

  close() { clearTimeout(this.timer); this.save(); }
}
module.exports = JsonAdapter;
