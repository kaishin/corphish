<p align="center">
  <img src="assets/nanoclaw-logo.png" alt="NanoClaw" width="400">
</p>

<p align="center">
  Personal Claude assistant that runs securely in containers. Small enough to understand and customize.
</p>

<p align="center">
  <a href="https://nanoclaw.dev">nanoclaw.dev</a>&nbsp; • &nbsp;
  <a href="https://discord.gg/VDdww8qS42"><img src="https://img.shields.io/discord/1470188214710046894?label=Discord&logo=discord&v=2" alt="Discord" valign="middle"></a>&nbsp; • &nbsp;
  <a href="repo-tokens"><img src="repo-tokens/badge.svg" alt="34.9k tokens, 17% of context window" valign="middle"></a>
</p>

## Quick Start

```bash
git clone https://github.com/qwibitai/nanoclaw.git
cd nanoclaw
claude
```

Then run `/setup`. Claude Code handles everything: dependencies, authentication, container setup, service configuration.

## Philosophy

**Small enough to understand.** One process, a few source files. No microservices, no message queues, no abstraction layers.

**Secure by isolation.** Agents run in Linux containers (Apple Container on macOS, or Docker). They can only see what's explicitly mounted.

**Built for one user.** Fork it and have Claude Code make it match your exact needs.

**Skills over features.** New capabilities are contributed as [Claude Code skills](https://code.claude.com/docs/en/skills) — `/add-telegram`, `/add-gmail`, etc. — that transform your fork. You get clean code that does exactly what you need.

## What It Supports

- **Discord I/O** — Message Claude from Discord
- **Isolated group context** — Each group has its own `CLAUDE.md` memory and container sandbox
- **Main channel** — Your private channel for admin control
- **Scheduled tasks** — Recurring jobs that run Claude and message you back
- **Web access** — Search and fetch content
- **Agent Swarms** — Teams of specialized agents that collaborate on complex tasks
- **Optional integrations** — Gmail, X, Telegram and more via skills

## Usage

Talk to your assistant with the trigger word (default: `@Andy`):

```
@Andy send an overview of the sales pipeline every weekday morning at 9am
@Andy review the git history for the past week each Friday and update the README if there's drift
@Andy every Monday at 8am, compile AI news from Hacker News and message me a briefing
```

From the main channel (your self-chat), you can manage groups and tasks:

```
@Andy list all scheduled tasks across groups
@Andy pause the Monday briefing task
@Andy join the Family Chat group
```

## Customizing

Just tell Claude Code what you want:

- "Change the trigger word to @Bob"
- "Remember to make responses shorter and more direct"
- "Store conversation summaries weekly"

Or run `/customize` for guided changes.

## Contributing

**Don't add features. Add skills.**

Contribute a skill file (`.claude/skills/add-telegram/SKILL.md`) that teaches Claude Code how to transform a NanoClaw installation. Users run `/add-telegram` on their fork and get clean code that does exactly what they need.

Security fixes, bug fixes, and clear improvements to the base configuration are accepted as PRs. Everything else should be a skill.

## Requirements

- macOS or Linux
- Node.js 20+
- [Claude Code](https://claude.ai/download)
- [Apple Container](https://github.com/apple/container) (macOS) or [Docker](https://docker.com/products/docker-desktop) (macOS/Linux)

## Architecture

```
Discord --> SQLite --> Polling loop --> Container (Claude Agent SDK) --> Response
```

Single Node.js process. Agents execute in isolated Linux containers with mounted directories. Per-group message queue with concurrency control. IPC via filesystem.

Key files:

- `src/index.ts` - Orchestrator: state, message loop, agent invocation
- `src/channels/discord.ts` - Discord connection, auth, send/receive
- `src/container-runner.ts` - Spawns streaming agent containers
- `src/task-scheduler.ts` - Runs scheduled tasks
- `src/db.ts` - SQLite operations

## Community

Questions? Ideas? [Join the Discord](https://discord.gg/VDdww8qS42).

## License

MIT
