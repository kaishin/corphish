---
name: setup
description: Run initial NanoClaw setup. Use when user wants to install dependencies, register their main Discord channel, or start the background services. Triggers on "setup", "install", "configure nanoclaw", or first-time setup requests.
---

# NanoClaw Setup

Run setup scripts automatically. Only pause when user action is required (configuration choices, pasting tokens). Scripts live in `.claude/skills/setup/scripts/` and emit structured status blocks to stdout. Verbose logs go to `logs/setup.log`.

**Principle:** When something is broken or missing, fix it. Don't tell the user to go fix it themselves unless it genuinely requires their manual action (e.g. pasting a secret token). If a dependency is missing, install it. If a service won't start, diagnose and repair. Ask the user for permission when needed, then do the work.

**UX Note:** Use `AskUserQuestion` for all user-facing questions.

## 1. Check Environment

Run `./.claude/skills/setup/scripts/01-check-environment.sh` and parse the status block.

- If HAS_REGISTERED_GROUPS=true → note existing config, offer to skip or reconfigure
- Record PLATFORM, APPLE_CONTAINER, and DOCKER values for step 3

**If NODE_OK=false:**

Node.js is missing or too old. Ask the user if they'd like you to install it. Offer options based on platform:

- macOS: `brew install node@22` (if brew available) or install nvm then `nvm install 22`
- Linux: `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs`, or nvm

If brew/nvm aren't installed, install them first. After installing Node, re-run the environment check to confirm NODE_OK=true.

## 2. Install Dependencies

Run `./.claude/skills/setup/scripts/02-install-deps.sh` and parse the status block.

**If failed:** Read the tail of `logs/setup.log` to diagnose. Common fixes to try automatically:

1. Delete `node_modules` and `package-lock.json`, then re-run the script
2. If permission errors: suggest running with corrected permissions
3. If specific package fails to build (native modules like better-sqlite3): install build tools (`xcode-select --install` on macOS, `build-essential` on Linux), then retry

Only ask the user for help if multiple retries fail with the same error.

## 3. Container Runtime

### 3a. Choose runtime

Check the preflight results for `APPLE_CONTAINER` and `DOCKER`.

**If APPLE_CONTAINER=installed** (macOS only): Ask the user which runtime they'd like to use — Docker (default, cross-platform) or Apple Container (native macOS). If they choose Apple Container, run `/convert-to-apple-container` now before continuing, then skip to 3b.

**If APPLE_CONTAINER=not_found**: Use Docker (the default). Proceed to install/start Docker below.

### 3a-docker. Install Docker

- DOCKER=running → continue to 3b
- DOCKER=installed_not_running → start Docker: `open -a Docker` (macOS) or `sudo systemctl start docker` (Linux). Wait 15s, re-check with `docker info`. If still not running, tell the user Docker is starting up and poll a few more times.
- DOCKER=not_found → **ask the user for confirmation before installing.** Tell them Docker is required for running agents and ask if they'd like you to install it. If confirmed:
  - macOS: install via `brew install --cask docker`, then `open -a Docker` and wait for it to start. If brew not available, direct to Docker Desktop download at https://docker.com/products/docker-desktop
  - Linux: install with `curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER`. Note: user may need to log out/in for group membership.

### 3b. Apple Container conversion gate (if needed)

**If the chosen runtime is Apple Container**, check whether the source code has already been converted:

```bash
grep -q "CONTAINER_RUNTIME_BIN = 'container'" src/container-runtime.ts && echo "ALREADY_CONVERTED" || echo "NEEDS_CONVERSION"
```

**If NEEDS_CONVERSION**, run the `/convert-to-apple-container` skill NOW.

**If ALREADY_CONVERTED** or using Docker, continue to 3c.

### 3c. Build and test

Run `./.claude/skills/setup/scripts/03-setup-container.sh --runtime <chosen>` and parse the status block.

**If BUILD_OK=false:** Read `logs/setup.log` tail for the build error.

- If it's a cache issue (stale layers): run `docker builder prune -f`, then retry.
- If Dockerfile syntax or missing files: diagnose from the log and fix.

**If TEST_OK=false but BUILD_OK=true:** The image built but won't run. Check logs — common cause is runtime not fully started. Wait a moment and retry the test.

## 4. Claude Authentication (No Script)

If HAS_ENV=true from step 1, read `.env` and check if it already has `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`. If so, confirm with user: "You already have Claude credentials configured. Want to keep them or reconfigure?" If keeping, skip to step 5.

AskUserQuestion: Claude subscription (Pro/Max) vs Anthropic API key?

**Subscription:** Tell the user:

1. Open another terminal and run: `claude setup-token`
2. Copy the token it outputs
3. Add it to the `.env` file in the project root: `CLAUDE_CODE_OAUTH_TOKEN=<token>`
4. Let me know when done

Do NOT ask the user to paste the token into the chat. Just tell them what to do, then wait for confirmation. Once confirmed, verify the `.env` file has the key.

**API key:** Tell the user to add `ANTHROPIC_API_KEY=<key>` to the `.env` file in the project root, then let you know when done. Once confirmed, verify the `.env` file has the key.

## 5. Discord Bot Setup

If `DISCORD_BOT_TOKEN` is already set in `.env`, confirm with user: "Discord bot token already configured. Want to keep it or reconfigure?" If keeping, skip to step 6.

If the user doesn't have a bot token, tell them:

> I need you to create a Discord bot:
>
> 1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
> 2. Click **New Application** and give it a name (e.g., "Krabby Assistant")
> 3. Go to the **Bot** tab on the left sidebar
> 4. Click **Reset Token** to generate a new bot token — copy it immediately (you can only see it once)
> 5. Under **Privileged Gateway Intents**, enable:
>    - **Message Content Intent** (required to read message text)
>    - **Server Members Intent** (optional, for member display names)
> 6. Go to **OAuth2** > **URL Generator**:
>    - Scopes: select `bot`
>    - Bot Permissions: select `Send Messages`, `Read Message History`, `View Channels`
>    - Copy the generated URL and open it in your browser to invite the bot to your server

Wait for the user to provide the token. Add `DISCORD_BOT_TOKEN=<token>` to `.env`.

AskUserQuestion: What trigger word? (default: Krabby). In channels, messages that @mention the bot or reply to the bot go to Claude. In the main channel, no trigger needed.

## 6. Register Main Channel

Tell the user:

> To get the channel ID for registration:
>
> 1. In Discord, go to **User Settings** > **Advanced** > Enable **Developer Mode**
> 2. Right-click the text channel you want the bot to respond in
> 3. Click **Copy Channel ID**

Wait for the user to provide the channel ID.

Register the channel with `requiresTrigger: false` (main channel responds to all messages):

```bash
sqlite3 store/messages.db "INSERT OR REPLACE INTO registered_groups (jid, name, folder, trigger, added_at, requires_trigger) VALUES ('dc:<channel-id>', '<server-name> #<channel-name>', 'main', '@<TriggerWord>', datetime('now'), 0)"
```

## 7. Mount Allowlist

AskUserQuestion: Want the agent to access directories outside the NanoClaw project? (Git repos, project folders, documents, etc.)

**If no:** Run `./.claude/skills/setup/scripts/07-configure-mounts.sh --empty`

**If yes:** Collect directory paths and permissions (read-write vs read-only). Build the JSON and pipe it to the script:

`echo '{"allowedRoots":[...],"blockedPatterns":[],"nonMainReadOnly":true}' | ./.claude/skills/setup/scripts/07-configure-mounts.sh`

## 8. Start Service

If the service is already running (check `launchctl list | grep nanoclaw` on macOS), unload it first: `launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist` — then proceed with a clean install.

Run `./.claude/skills/setup/scripts/08-setup-service.sh` and parse the status block.

**If SERVICE_LOADED=false:**

- Read `logs/setup.log` for the error.
- Common fix: plist already loaded with different path. Unload the old one first, then re-run.
- On macOS: check `launchctl list | grep nanoclaw` to see if it's loaded with an error status.
- On Linux: check `systemctl --user status nanoclaw` for the error and fix accordingly.

## 9. Verify

Run `./.claude/skills/setup/scripts/09-verify.sh` and parse the status block.

**If STATUS=failed, fix each failing component:**

- SERVICE=stopped → run `npm run build` first, then restart: `launchctl kickstart -k gui/$(id -u)/com.nanoclaw` (macOS) or `systemctl --user restart nanoclaw` (Linux). Re-check.
- SERVICE=not_found → re-run step 8.
- CREDENTIALS=missing → re-run step 4.
- REGISTERED_GROUPS=0 → re-run step 6.
- MOUNT_ALLOWLIST=missing → run `./.claude/skills/setup/scripts/07-configure-mounts.sh --empty` to create a default.

After fixing, re-run `09-verify.sh` to confirm everything passes.

Tell user to test: send a message in their registered Discord channel (@mention the bot or any message in main channel).

Show the log tail command: `tail -f logs/nanoclaw.log`

## Troubleshooting

**Service not starting:** Check `logs/nanoclaw.error.log`. Common causes: wrong Node path in plist (re-run step 8), missing `.env` (re-run step 4).

**Container agent fails:** Ensure the container runtime is running. Check container logs in `groups/main/logs/container-*.log`.

**No response to messages:** Verify the bot is in the server and has permissions. Main channel doesn't need a trigger. Other channels need @mention or reply to the bot. Check `logs/nanoclaw.log`.

**Unload service:** `launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist`
