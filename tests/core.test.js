const assert = require("assert");
const events = require("../src/lib/event-bus");
const scheduler = require("../src/lib/scheduler");
const i18n = require("../src/lib/i18n");
const config = require("../src/lib/config-manager");
const media = require("../src/lib/media");

(async () => {
  let called = false;
  const off = events.on("test", () => { called = true; });
  await events.emit("test", {});
  off();
  assert.equal(called, true);
  assert.ok(i18n.get("core.started", "en"));
  assert.ok(i18n.available().length >= 1);
  config.ensure();
  assert.ok(config.getGlobal().prefix);
  const temp = media.tempPath("tmp");
  assert.ok(temp.includes("media"));
  const name = "test-job";
  scheduler.add(name, () => {}, { delayMs: 50 });
  assert.ok(scheduler.list().some(j => j.name === name));
  scheduler.remove(name);
  console.log("XMD core tests: PASS");
})();
