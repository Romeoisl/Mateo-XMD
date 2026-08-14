async function check(db) {
  const started = Date.now();
  try {
    if (!db) throw new Error("Database adapter is not initialized.");
    if (typeof db.health === "function") await db.health();
    else if (typeof db.ensureSchema === "function") await db.ensureSchema();

    return {
      ok: true,
      latencyMs: Date.now() - started,
      type: db.type || "unknown",
      checkedAt: Date.now()
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      type: db?.type || "unknown",
      error: error.message,
      checkedAt: Date.now()
    };
  }
}

module.exports = { check };
