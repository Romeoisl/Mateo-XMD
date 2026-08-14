const { MongoClient } = require("mongodb");

class MongoAdapter {
  constructor(options = {}) {
    this.type = "mongodb";
    this.uri = String(options.uri || process.env.MONGODB_URI || "");
    this.dbName = String(options.dbName || process.env.MONGODB_DB || "xmd");
    this.prefix = String(options.collectionPrefix || "xmd_");
    this.client = null;
    this.db = null;
    this._users = new Map(); this._groups = new Map(); this._settings = new Map();
  }

  collection(name) { return this.db.collection(`${this.prefix}${name}`); }

  async init() {
    if (!this.uri) throw new Error("MongoDB is selected but no MongoDB URI was configured. Set database.mongodb.uri or MONGODB_URI.");
    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    await this.ensureSchema();
    await this.hydrate();
  }

  async ensureSchema() {
    await Promise.all([
      this.collection("users").createIndex({ updatedAt: 1 }),
      this.collection("groups").createIndex({ updatedAt: 1 }),
      this.collection("settings").createIndex({ updatedAt: 1 })
    ]);
  }

  async health() { await this.db.command({ ping: 1 }); return true; }
  async write(collection, id, value) { await this.collection(collection).replaceOne({ _id: id }, { _id: id, ...value }, { upsert: true }); return value; }
  getUser(id) { return this._users.get(id) || null; }
  upsertUser(id, data = {}) { if (!id) return null; const value = { ...(this._users.get(id) || {}), ...data, id, updatedAt: Date.now() }; this._users.set(id, value); void this.write("users", id, value).catch(console.error); return value; }
  getGroup(id) { return this._groups.get(id) || null; }
  upsertGroup(id, data = {}) { if (!id) return null; const old = this._groups.get(id) || {}; const value = { ...old, ...data, id, settings: { ...(old.settings || {}), ...(data.settings || {}) }, updatedAt: Date.now() }; this._groups.set(id, value); void this.write("groups", id, value).catch(console.error); return value; }
  getSetting(key, fallback = null) { return this._settings.get(key) ?? fallback; }
  setSetting(key, value) { this._settings.set(key, value); void this.write("settings", key, { value, updatedAt: Date.now() }).catch(console.error); return value; }
  getStats() { return { users: this._users.size, groups: this._groups.size }; }

  async hydrate() {
    const [users, groups, settings] = await Promise.all([
      this.collection("users").find({}).toArray(), this.collection("groups").find({}).toArray(), this.collection("settings").find({}).toArray()
    ]);
    this._users = new Map(users.map(x => { const { _id, ...v } = x; return [_id, v]; }));
    this._groups = new Map(groups.map(x => { const { _id, ...v } = x; return [_id, v]; }));
    this._settings = new Map(settings.map(x => [x._id, x.value]));
  }

  async close() { await this.client?.close(); this.client = null; this.db = null; }
}
module.exports = MongoAdapter;
