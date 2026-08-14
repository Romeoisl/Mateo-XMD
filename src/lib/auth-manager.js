const fs = require("fs");
const path = require("path");

const sessionDir = path.resolve(__dirname, "../../session");

function ensureSessionDir() {
  fs.mkdirSync(sessionDir, { recursive: true });
  return sessionDir;
}

function hasSession() {
  ensureSessionDir();
  return fs.readdirSync(sessionDir).some(name => !name.startsWith("."));
}

function sessionInfo() {
  ensureSessionDir();
  const files = fs.readdirSync(sessionDir);
  return { exists: files.length > 0, files: files.length, directory: sessionDir };
}

function clearSession() {
  ensureSessionDir();
  for (const name of fs.readdirSync(sessionDir)) {
    fs.rmSync(path.join(sessionDir, name), { recursive: true, force: true });
  }
}

module.exports = { ensureSessionDir, hasSession, sessionInfo, clearSession };
