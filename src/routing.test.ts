import { describe, it, expect, beforeEach } from 'vitest';

import { _initTestDatabase, getAllChats, storeChatMetadata } from './db.js';
import { getAvailableGroups, _setRegisteredGroups } from './index.js';

beforeEach(() => {
  _initTestDatabase();
  _setRegisteredGroups({});
});

// --- JID ownership patterns ---

describe('JID ownership patterns', () => {
  it('Discord channel JID: starts with dc:', () => {
    const jid = 'dc:1234567890123456';
    expect(jid.startsWith('dc:')).toBe(true);
  });
});

// --- getAvailableGroups ---

describe('getAvailableGroups', () => {
  it('returns only groups, excludes DMs', () => {
    storeChatMetadata(
      'dc:1111111111111111',
      '2024-01-01T00:00:01.000Z',
      'Group 1',
      'discord',
      true,
    );
    storeChatMetadata(
      'dc:2222222222222222',
      '2024-01-01T00:00:02.000Z',
      'User DM',
      'discord',
      false,
    );
    storeChatMetadata(
      'dc:3333333333333333',
      '2024-01-01T00:00:03.000Z',
      'Group 2',
      'discord',
      true,
    );

    const groups = getAvailableGroups();
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.jid)).toContain('dc:1111111111111111');
    expect(groups.map((g) => g.jid)).toContain('dc:3333333333333333');
    expect(groups.map((g) => g.jid)).not.toContain('dc:2222222222222222');
  });

  it('marks registered Discord channels correctly', () => {
    storeChatMetadata(
      'dc:1111111111111111',
      '2024-01-01T00:00:01.000Z',
      'DC Registered',
      'discord',
      true,
    );
    storeChatMetadata(
      'dc:2222222222222222',
      '2024-01-01T00:00:02.000Z',
      'DC Unregistered',
      'discord',
      true,
    );

    _setRegisteredGroups({
      'dc:1111111111111111': {
        name: 'DC Registered',
        folder: 'dc-registered',
        trigger: '@Krabby',
        added_at: '2024-01-01T00:00:00.000Z',
      },
    });

    const groups = getAvailableGroups();
    const dcReg = groups.find((g) => g.jid === 'dc:1111111111111111');
    const dcUnreg = groups.find((g) => g.jid === 'dc:2222222222222222');

    expect(dcReg?.isRegistered).toBe(true);
    expect(dcUnreg?.isRegistered).toBe(false);
  });

  it('excludes __group_sync__ sentinel', () => {
    storeChatMetadata('__group_sync__', '2024-01-01T00:00:00.000Z');
    storeChatMetadata(
      'dc:1234567890123456',
      '2024-01-01T00:00:01.000Z',
      'Group',
      'discord',
      true,
    );

    const groups = getAvailableGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].jid).toBe('dc:1234567890123456');
  });

  it('marks registered groups correctly', () => {
    storeChatMetadata(
      'dc:1111111111111111',
      '2024-01-01T00:00:01.000Z',
      'Registered',
      'discord',
      true,
    );
    storeChatMetadata(
      'dc:2222222222222222',
      '2024-01-01T00:00:02.000Z',
      'Unregistered',
      'discord',
      true,
    );

    _setRegisteredGroups({
      'dc:1111111111111111': {
        name: 'Registered',
        folder: 'registered',
        trigger: '@Krabby',
        added_at: '2024-01-01T00:00:00.000Z',
      },
    });

    const groups = getAvailableGroups();
    const reg = groups.find((g) => g.jid === 'dc:1111111111111111');
    const unreg = groups.find((g) => g.jid === 'dc:2222222222222222');

    expect(reg?.isRegistered).toBe(true);
    expect(unreg?.isRegistered).toBe(false);
  });

  it('returns groups ordered by most recent activity', () => {
    storeChatMetadata(
      'dc:1111111111111111',
      '2024-01-01T00:00:01.000Z',
      'Old',
      'discord',
      true,
    );
    storeChatMetadata(
      'dc:3333333333333333',
      '2024-01-01T00:00:05.000Z',
      'New',
      'discord',
      true,
    );
    storeChatMetadata(
      'dc:2222222222222222',
      '2024-01-01T00:00:03.000Z',
      'Mid',
      'discord',
      true,
    );

    const groups = getAvailableGroups();
    expect(groups[0].jid).toBe('dc:3333333333333333');
    expect(groups[1].jid).toBe('dc:2222222222222222');
    expect(groups[2].jid).toBe('dc:1111111111111111');
  });

  it('excludes non-group chats regardless of JID format', () => {
    storeChatMetadata(
      'unknown-format-123',
      '2024-01-01T00:00:01.000Z',
      'Unknown',
    );
    storeChatMetadata(
      'custom:abc',
      '2024-01-01T00:00:02.000Z',
      'Custom DM',
      'custom',
      false,
    );
    storeChatMetadata(
      'dc:1234567890123456',
      '2024-01-01T00:00:03.000Z',
      'Group',
      'discord',
      true,
    );

    const groups = getAvailableGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].jid).toBe('dc:1234567890123456');
  });

  it('returns empty array when no chats exist', () => {
    const groups = getAvailableGroups();
    expect(groups).toHaveLength(0);
  });

  it('returns Discord channels ordered by activity', () => {
    storeChatMetadata(
      'dc:1111111111111111',
      '2024-01-01T00:00:01.000Z',
      'Discord 1',
      'discord',
      true,
    );
    storeChatMetadata(
      'dc:2222222222222222',
      '2024-01-01T00:00:03.000Z',
      'Discord 2',
      'discord',
      true,
    );

    const groups = getAvailableGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0].jid).toBe('dc:2222222222222222');
    expect(groups[1].jid).toBe('dc:1111111111111111');
  });
});
