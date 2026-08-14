const migrations = [
  {
    version: 1,
    name: "initial-schema",
    async up(db) {
      if (typeof db.ensureSchema === "function") await db.ensureSchema();
    }
  }
];

async function migrate(db, currentVersion = 0) {
  let version = Number(currentVersion) || 0;
  for (const migration of migrations) {
    if (migration.version <= version) continue;
    await migration.up(db);
    version = migration.version;
  }
  return version;
}

module.exports = { migrations, migrate };
