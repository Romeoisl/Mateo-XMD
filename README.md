# Mateo-XMD

XMD WhatsApp Bot — **version 1.0.0**.

Core-first modular WhatsApp bot engine built around **XMD Baileys**. Command directories remain intentionally empty while the framework is hardened.

## Core systems

- QR and pairing-code authentication foundation
- Session persistence and reconnect handling
- Message, group, reaction and lifecycle events
- Plugin registry and lifecycle hooks
- Permissions, aliases and cooldowns
- Group metadata and admin detection
- Anti-spam and auto-moderation
- Warning escalation and persistent settings
- User/group statistics
- Media download and temporary-file management
- Scheduler for one-shot and recurring jobs
- English and Nigerian-English localization
- Global and per-group configuration
- Health monitoring, structured logging and graceful shutdown
- Core smoke tests

## Plugin lifecycle

Plugins can implement:

`onLoad`, `onStart`, `onMessage`, `onCommand`, `onReply`, `onReaction`, `onGroupEvent`, and `onUnload`.

## Configuration

Global defaults are stored in `config/bot.json`. Per-group overrides belong in `config/groups/` and are merged with the global configuration at runtime.

## Testing

Run:

```bash
npm test
```

The command directories are intentionally empty. The command ecosystem will be added after the core engine is stable.
