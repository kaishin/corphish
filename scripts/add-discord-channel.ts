#!/usr/bin/env tsx
/**
 * Script to add a Discord channel to the registered groups.
 * Usage: tsx scripts/add-discord-channel.ts <channel_id> <channel_name> <folder> <trigger>
 *
 * Example: tsx scripts/add-discord-channel.ts 123456789012345678 "My Server #general" main @Krabby
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'data');
const REGISTERED_GROUPS_PATH = resolve(DATA_DIR, 'registered_groups.json');

function loadRegisteredGroups(): Record<string, any> {
  if (existsSync(REGISTERED_GROUPS_PATH)) {
    const data = readFileSync(REGISTERED_GROUPS_PATH, 'utf8');
    return JSON.parse(data);
  }
  return {};
}

function saveRegisteredGroups(groups: Record<string, any>): void {
  writeFileSync(REGISTERED_GROUPS_PATH, JSON.stringify(groups, null, 2) + '\n');
}

function main() {
  const [channelId, channelName, folder, trigger] = process.argv.slice(2);

  if (!channelId || !channelName || !folder || !trigger) {
    console.error(
      'Usage: tsx scripts/add-discord-channel.ts <channel_id> <channel_name> <folder> <trigger>',
    );
    console.error(
      'Example: tsx scripts/add-discord-channel.ts 123456789012345678 "My Server #general" main @Krabby',
    );
    process.exit(1);
  }

  const chatJid = `dc:${channelId}`;
  const now = new Date().toISOString();

  const registeredGroups = loadRegisteredGroups();

  registeredGroups[chatJid] = {
    name: `Discord: ${channelName}`,
    folder,
    trigger,
    added_at: now,
    requiresTrigger: false,
  };

  saveRegisteredGroups(registeredGroups);

  console.log(
    `✅ Added Discord channel ${channelName} (${chatJid}) to registered groups.`,
  );
  console.log(`   Folder: ${folder}`);
  console.log(`   Trigger: ${trigger}`);
}

main();
