import { describe, expect, it } from 'vitest';
import { activateUser, addComment, filterFeed, parseAppData, timeAgo, toggleThanks, userState, type AppData, type Post } from './domain';

const post = (overrides: Partial<Post> = {}): Post => ({
  id: 1, name: 'Maya', handle: '@maya', createdAt: '2026-08-17T10:00:00Z', initials: 'M', color: 'coral',
  body: 'A kind story', tag: 'Everyday kindness', thanks: 2, comments: [], ...overrides,
});

describe('thank you domain', () => {
  it('toggles thanks without allowing negative totals', () => {
    expect(toggleThanks([post()], 1, false)[0]).toMatchObject({ thanks: 3 });
    expect(toggleThanks([post({ thanks: 0 })], 1, true)[0].thanks).toBe(0);
  });

  it('adds trimmed comments to the selected post', () => {
    const result = addComment([post()], 1, '  This made my day  ', { name: 'Alex', handle: '@alex', initials: 'A', color: 'orange' }, new Date('2026-08-17T12:00:00Z'));
    expect(result[0].comments[0].body).toBe('This made my day');
  });

  it('filters following and search together', () => {
    const posts = [post(), post({ id: 2, handle: '@eli', body: 'Garden help' })];
    expect(filterFeed(posts, 'garden', ['@eli'], true).map((item) => item.id)).toEqual([2]);
  });

  it('falls back when stored data is malformed', () => {
    const fallback: AppData = { version: 2, posts: [], users: {} };
    expect(parseAppData('{"bad":true}', fallback)).toBe(fallback);
  });

  it('migrates v1 reactions into the first activated account', () => {
    const fallback: AppData = { version: 2, posts: [], users: {} };
    const migrated = parseAppData(JSON.stringify({ version: 1, posts: [post({ liked: true })], followed: ['@maya'], activities: [] }), fallback);
    const active = activateUser(migrated, 'user-1');
    expect(userState(active, 'user-1')).toMatchObject({ followed: ['@maya'], likedPostIds: [1] });
  });

  it('formats relative time', () => {
    expect(timeAgo('2026-08-17T11:30:00Z', new Date('2026-08-17T12:00:00Z').getTime())).toBe('30m');
  });
});
