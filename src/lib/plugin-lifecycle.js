const hooks = new Map();

const EVENTS = ["onLoad", "onStart", "onMessage", "onCommand", "onReply", "onReaction", "onGroupEvent", "onUnload"];

function register(name, plugin) {
  if (!name || !plugin) throw new Error("Plugin name and plugin are required.");
  const record = { name, plugin };
  hooks.set(name, record);
  return record;
}

async function run(name, hook, context) {
  const record = hooks.get(name);
  const fn = record?.plugin?.[hook];
  if (typeof fn !== "function") return;
  try { return await fn(context); }
  catch (err) { console.error(`[PLUGIN:${name}:${hook}]`, err); }
}

async function broadcast(hook, context) {
  for (const name of hooks.keys()) await run(name, hook, context);
}

function list() {
  return [...hooks.values()].map(({ name, plugin }) => ({
    name,
    hooks: EVENTS.filter(event => typeof plugin?.[event] === "function")
  }));
}

module.exports = { EVENTS, register, run, broadcast, list };
