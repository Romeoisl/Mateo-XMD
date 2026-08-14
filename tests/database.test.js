const assert = require("assert");
const fs = require("fs");
const path = require("path");
const JsonAdapter = require("../src/lib/database/json");
const SqliteAdapter = require("../src/lib/database/sqlite");

async function testAdapter(Adapter, options, cleanup) {
  const db = new Adapter(options);
  await db.init();
  assert.equal(await db.health(), true);
  const user = db.upsertUser("test-user", { name: "XMD" });
  assert.equal(db.getUser("test-user").name, "XMD");
  const group = db.upsertGroup("test-group", { settings: { antiSpam: true } });
  assert.equal(db.getGroup("test-group").settings.antiSpam, true);
  db.setSetting("language", "en");
  assert.equal(db.getSetting("language"), "en");
  assert.equal(db.getStats().users, 1);
  await db.close();
  cleanup?.();
}

(async () => {
  const dir = path.join(__dirname, ".tmp-db");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  await testAdapter(JsonAdapter, { file: path.join(dir, "data.json") }, () => fs.rmSync(dir, { recursive: true, force: true }));

  const sqlite = path.join(dir, "test.sqlite");
  fs.mkdirSync(dir, { recursive: true });
  await testAdapter(SqliteAdapter, { file: sqlite }, () => fs.rmSync(dir, { recursive: true, force: true }));

  console.log("XMD database adapter tests: PASS (JSON + SQLite)");
  console.log("MongoDB: skipped unless database.mongodb.uri is configured.");
})().catch(err => { console.error(err); process.exit(1); });
