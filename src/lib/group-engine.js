const groups = new Map();

function update(metadata) {
  if (!metadata?.id) return null;
  const current = groups.get(metadata.id) || {};
  const value = { ...current, ...metadata, cachedAt: Date.now() };
  groups.set(metadata.id, value);
  return value;
}

function get(id) { return groups.get(id) || null; }
function remove(id) { return groups.delete(id); }
function clear() { groups.clear(); }

function isAdmin(metadata, jid) {
  return Boolean(metadata?.participants?.some(
    p => p.id === jid && ["admin", "superadmin"].includes(p.admin)
  ));
}

function isBotAdmin(metadata, botJid) { return isAdmin(metadata, botJid); }
function stats() { return { cachedGroups: groups.size }; }

module.exports = { update, get, remove, clear, isAdmin, isBotAdmin, stats };
