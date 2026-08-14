const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../config");
const globalFile = path.join(root, "bot.json");
const groupsDir = path.join(root, "groups");

const defaults = {
  prefix: ".",
  mode: "public",
  language: "en",
  moderation: { antiSpam: false, antiLink: false, antiCaps: false, warningLimit: 3 }
};

function ensure() {
  fs.mkdirSync(groupsDir, { recursive: true });
  if (!fs.existsSync(globalFile)) fs.writeFileSync(globalFile, JSON.stringify(defaults, null, 2));
}

function read(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function getGlobal() { ensure(); return { ...defaults, ...read(globalFile) }; }

function getGroup(jid) {
  ensure();
  const safe = String(jid).replace(/[^a-zA-Z0-9._-]/g, "_");
  return read(path.join(groupsDir, `${safe}.json`), {});
}

function getEffective(jid) {
  const global = getGlobal();
  const group = getGroup(jid);
  return { ...global, ...group, moderation: { ...(global.moderation || {}), ...(group.moderation || {}) } };
}

function setGroup(jid, patch) {
  ensure();
  const safe = String(jid).replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = path.join(groupsDir, `${safe}.json`);
  const current = read(file, {});
  const next = { ...current, ...patch, moderation: { ...(current.moderation || {}), ...(patch.moderation || {}) } };
  fs.writeFileSync(file, JSON.stringify(next, null, 2));
  return next;
}

module.exports = { ensure, getGlobal, getGroup, getEffective, setGroup };
