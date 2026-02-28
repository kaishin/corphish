# NanoClaw

Personal Claude assistant. See [README.md](README.md) for philosophy and setup. See [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) for architecture decisions.

## Quick Context

Single Node.js process that connects to Discord, routes messages to Claude Agent SDK running in containers (Linux VMs). Each group has isolated filesystem and memory.

## Key Files

| File                       | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `src/index.ts`             | Orchestrator: state, message loop, agent invocation |
| `src/channels/discord.ts`  | Discord connection, auth, send/receive              |
| `src/ipc.ts`               | IPC watcher and task processing                     |
| `src/router.ts`            | Message formatting and outbound routing             |
| `src/config.ts`            | Trigger pattern, paths, intervals                   |
| `src/container-runner.ts`  | Spawns agent containers with mounts                 |
| `src/host-proxy.ts`        | HTTP CONNECT proxy for container-to-host routing    |
| `src/task-scheduler.ts`    | Runs scheduled tasks                                |
| `src/db.ts`                | SQLite operations                                   |
| `groups/{name}/CLAUDE.md`  | Per-group memory (isolated)                         |

## Skills

Two types of skills exist in this project.

**Host skills** (`.claude/skills/`) run in Claude Code on the host. Use for setup and management:

| Skill                         | When to Use                                             |
| ----------------------------- | ------------------------------------------------------- |
| `/setup`                      | First-time installation, authentication, service config |
| `/customize`                  | Adding channels, integrations, changing behavior        |
| `/debug`                      | Container issues, logs, troubleshooting                 |
| `/add-discord`                | Add Discord as a channel                                |
| `/add-telegram`               | Add Telegram as a channel                               |
| `/add-telegram-swarm`         | Add agent swarm support to Telegram                     |
| `/add-gmail`                  | Add Gmail integration                                   |
| `/convert-to-apple-container` | Switch from Docker to Apple Container                   |
| `/x-integration`              | Add X (Twitter) integration                             |

**Container skills** (`container/skills/`) run inside the agent container. The agent invokes these automatically:

| Skill           | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `agent-browser` | Browse the web, fill forms, take screenshots, extract data |

## Development

Run commands directly—don't tell the user to run them.

```bash
npm run dev          # Run with hot reload
npm run build        # Compile TypeScript
./container/build.sh # Rebuild agent container
```

Service management:

```bash
launchctl load ~/Library/LaunchAgents/com.nanoclaw.plist
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist
```

## Container Build Cache

The container buildkit caches the build context aggressively. `--no-cache` alone does NOT invalidate COPY steps — the builder's volume retains stale files. To force a truly clean rebuild, prune the builder then re-run `./container/build.sh`.
