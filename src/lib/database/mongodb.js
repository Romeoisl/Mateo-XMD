const { MongoClient } = require("mongodb");

class MongoAdapter {
  constructor(options = {}) {
    this.type = "mongodb";
    this.uri = String(options.uri || process.env.MONGODB_URI || "");
    this.dbName = String(options.dbName || process.env.MONGODB_DB || "xmd");
    this.client = null;
    this.db = null;
  }

  async init() {
    if (!this.uri) {
      throw new Error("MongoDB is selected but no MongoDB URI was configured. Set database.mongodb.uri or MONGODB_URI.");
    }

    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
  }

  async read(collection, id) {
    return this.db.collection(collection).findOne({ _id: id });
  }

  async write(collection, id, value) {
    await this.db.collection(collection).replaceOne({ _id: id }, { _id: id, ...value }, { upsert: true });
    return value;
  }

  getUser(id) {
    const cached = this._users?.get(id);
    return cached || null;
  }

  upsertUser(id, data = {}) {
    if (!this._users) this._users = new Map();
    const value = { ...(this._users.get(id) || {}), ...data, id, updatedAt: Date.now() };
    this._users.set(id, value);
    void this.write("users", id, value).catch(err => console.error("[DATABASE:MONGODB] user write failed:", err));
    return value;
  }

  getGroup(id) {
    return this._groups?.get(id) || null;
  }

  upsertGroup(id, data = {}) {
    if (!this._groups) this._groups = new Map();
    const old = this._groups.get(id) || {};
    const value = {
      ...old,
      ...data,
      id,
      settings: { ...(old.settings || {}), ...(data.settings || {}) },
      updatedAt: Date.now()
    };
    this._groups.set(id, value);
    void this.write("groups", id, value).catch(err => console.error("[DATABASE:MONGODB] group write failed:", err));
    return value;
  }

  getSetting(key, fallback = null) {
    return this._settings?.get(key) ?? fallback;
  }

  setSetting(key, value) {
    if (!this._settings) this._settings = new Map();
    this._settings.set(key, value);
    void this.write("settings", key, { value }).catch(err => console.error("[DATABASE:MONGODB] setting write failed:", err));
  }

  getStats() {
    return {
      users: this._users?.size || 0,
      groups: this._groups?.size || 0
    };
  }

  async hydrate() {
    this._users = new Map();
    this._groups = new Map();
    this._settings = new Map();

    const [users, groups, settings] = await Promise.all([
      this.db.collection("users").find({}).toArray(),
      this.db.collection("groups").find({}).toArray(),
      this.db.collection("settings").find({}).toArray()
    ]);

    for (const item of users) {
      const { _id, ...value } = item;
      this._users.set(_id, value);
    }
    for (const item of groups) {
      const { _id, ...value } = item;
      this._groups.set(_id, value);
    }
    for (const item of settings) this._settings.set(item._id, item.value);
  }

  async close() {
    await this.client?.close();
    this.client = null;
    this.db = null;
  }
}

const OriginalInit = MongoAdapter.prototype.init;
MongoAdapter.prototype.init = async function initWithHydration() {
  await OriginalInit.call(this);
  await this.hydrate();
};

module.exports = MongoAdapter;
