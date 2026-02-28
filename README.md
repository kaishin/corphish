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

Talk to your assistant with the trigger word (default: `@Krabby`):

```text
@Krabby send an overview of the sales pipeline every weekday morning at 9am
@Krabby review the git history for the past week each Friday and update the README if there's drift
@Krabby every Monday at 8am, compile AI news from Hacker News and message me a briefing
```

From the main channel (your self-chat), you can manage groups and tasks:

```text
@Krabby list all scheduled tasks across groups
@Krabby pause the Monday briefing task
@Krabby join the Family Chat group
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

## Running & Development

### First-time setup

The easiest path: run `claude` then `/setup`. It installs dependencies, authenticates your channel, builds the container image, and configures the background service.

If you prefer doing it manually:

```bash
npm install                  # Install Node dependencies
cp .env.example .env         # Create your env file, then fill in your tokens
./container/build.sh         # Build the agent container image
```

### Developing

```bash
npm run dev                  # Run with hot reload (tsx)
```

This starts the orchestrator directly. It connects to Discord, polls for messages, and spawns agent containers on demand. You don't run containers yourself — the orchestrator handles all of that (mounts, secrets via stdin, session management).

Other useful commands:

```bash
npm run build                # Compile TypeScript to dist/
npm run typecheck            # Type-check without emitting
npm test                     # Run tests
```

If you change anything inside `container/agent-runner/`, the running container picks up source changes automatically (the host `src/` is bind-mounted). But if you change the `Dockerfile` or system dependencies, rebuild:

```bash
./container/build.sh
```

> **Note:** The container build cache is aggressive. If `build.sh` doesn't pick up your changes, prune the builder first:
> `container builder prune` (Apple Container) or `docker builder prune` (Docker), then re-run `build.sh`.

### Deploying on your Mac

Once things work with `npm run dev`, set it up as a background service that survives reboots:

```bash
# 1. Compile TypeScript (the service runs the compiled JS, not tsx)
npm run build

# 2. Install the launchd service
#    /setup does this automatically, but if you need to do it manually:
#    Copy launchd/com.nanoclaw.plist to ~/Library/LaunchAgents/
#    Replace {{NODE_PATH}}, {{PROJECT_ROOT}}, and {{HOME}} with real paths

# 3. Load it
launchctl load ~/Library/LaunchAgents/com.nanoclaw.plist
```

Managing the service:

```bash
# Stop
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist

# Restart (stop then start)
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist && \
launchctl load ~/Library/LaunchAgents/com.nanoclaw.plist

# Check if it's running
launchctl list | grep nanoclaw

# View logs
tail -f logs/nanoclaw.log
tail -f logs/nanoclaw.error.log
```

The service runs `node dist/index.js` with `KeepAlive` — macOS will restart it if it crashes.

## How It Works

NanoClaw is a single Node.js process (the **orchestrator**) that bridges messaging channels to Claude agents running in isolated Linux containers.

### The big picture

```text
Discord --> SQLite --> Polling loop --> Container (Claude Agent SDK) --> Response
```

1. **Channels** (Discord) receive messages and write them to a SQLite database (`store/messages.db`). Each message records the chat JID, sender, content, and timestamp.

2. **The polling loop** runs every 2 seconds. It reads new messages from SQLite, checks which ones belong to registered groups, and filters by trigger word (`@Krabby` by default). The main channel skips the trigger check — every message is processed.

3. **The group queue** decides what to run. Each group can have at most one active container at a time. If a container is already running for that group, new messages get piped to it via IPC files. If not, a new container is spawned. There's a global concurrency cap (default 5 containers).

4. **Containers** are ephemeral Linux VMs (Apple Container on macOS, or Docker). Each one runs the **agent runner** (`container/agent-runner/src/index.ts`), which calls the Claude Agent SDK. The orchestrator passes the prompt as JSON on stdin, along with secrets (API keys, proxy config). The container gets specific directories mounted:
   - `/workspace/group/` — the group's own files and `CLAUDE.md` memory
   - `/home/node/.claude/` — Claude Code session data and skills
   - `/workspace/ipc/` — filesystem-based IPC for messages and tasks
   - `/workspace/project/` — the full project root (main group only)

5. **Results stream back** via stdout markers (`OUTPUT_START` / `OUTPUT_END`). The orchestrator parses each chunk and sends it to the channel immediately — so the user sees responses as they're generated, not after the container exits.

6. **Idle behavior**: After the agent finishes responding, the container stays alive for 30 minutes (configurable via `IDLE_TIMEOUT`). During this time, follow-up messages get piped to the same container via IPC files, preserving the Claude session. After 30 minutes of silence, the orchestrator writes a `_close` sentinel and the container shuts down. Next message spawns a fresh one.

### Groups and isolation

Each registered group has:

- A **folder** under `groups/` with its own `CLAUDE.md` (the agent's memory and personality)
- An **IPC directory** under `data/ipc/` for message passing
- A **session directory** under `data/sessions/` for Claude Code state
- A **trigger pattern** (e.g. `@Krabby`) — messages without it are stored but ignored unless the group has `requiresTrigger: false`

Groups are registered in the `registered_groups` table in SQLite. The main group has elevated privileges: it sees all groups, all tasks, and gets the full project mounted read-write.

### Memory

Memory works in three layers:

- **Claude Code sessions** — conversational context. Each group keeps a session ID (stored in the `sessions` table). When a container spawns, it resumes the previous session, so the agent remembers recent conversation history across container restarts.
- **`CLAUDE.md`** — long-term memory. Each group's `groups/{name}/CLAUDE.md` is mounted into the container. Claude Code loads it automatically at session start. The agent can also write to it or create additional files in the group folder (e.g. `customers.md`, `preferences.md`).
- **Auto-memory** — Claude Code's built-in memory feature is enabled, so the agent can remember user preferences between sessions without explicit file writes.

### Scheduled tasks

The task scheduler polls every 60 seconds for due tasks (cron or one-shot). When a task fires, it spawns a container for the target group just like a message would, runs the prompt, and sends the result back to the chat.

### IPC

Containers can't talk to the outside world directly. Instead, they write JSON files to `/workspace/ipc/`:

- `messages/` — outbound messages to send
- `tasks/` — task CRUD operations (create, update, delete scheduled tasks)
- `input/` — inbound messages piped from the orchestrator to a running container

The orchestrator's IPC watcher polls these directories every second and executes the requested actions.

### Key files

| File | What it does |
| ---- | ------------ |
| `src/index.ts` | Orchestrator: startup, message loop, agent invocation |
| `src/channels/discord.ts` | Discord connection, auth, send/receive |
| `src/container-runner.ts` | Builds mount args, spawns containers, streams output |
| `src/group-queue.ts` | Per-group concurrency, message piping, retry with backoff |
| `src/ipc.ts` | Watches IPC directories, executes container requests |
| `src/task-scheduler.ts` | Cron/one-shot task execution |
| `src/router.ts` | Message formatting and outbound routing |
| `src/host-proxy.ts` | HTTP CONNECT proxy for container-to-host networking |
| `src/db.ts` | SQLite schema, queries, migrations |
| `src/config.ts` | All configuration (env vars, paths, timeouts) |
| `container/agent-runner/src/index.ts` | Runs inside the container — calls Claude Agent SDK |
| `groups/{name}/CLAUDE.md` | Per-group agent memory and personality |

## Community

Questions? Ideas? [Join the Discord](https://discord.gg/VDdww8qS42).

## License

MIT
