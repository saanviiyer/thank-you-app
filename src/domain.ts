export type Category =
  | "Everyday kindness"
  | "A thank you"
  | "Neighbor love"
  | "For the planet"
  | "Small act, big day";

export type Comment = {
  id: number;
  name: string;
  handle: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: number;
  name: string;
  handle: string;
  createdAt: string;
  initials: string;
  color: string;
  avatar?: string;
  body: string;
  tag: Category;
  thanks: number;
  comments: Comment[];
  liked?: boolean;
  featured?: boolean;
  image?: string;
};

export type Activity = {
  id: number;
  kind: "thanks" | "comment" | "follow";
  message: string;
  createdAt: string;
  read: boolean;
};

export type AppData = {
  version: 2;
  posts: Post[];
  users: Record<string, UserState>;
  legacy?: UserState;
};

export type UserState = {
  followed: string[];
  likedPostIds: number[];
  activities: Activity[];
};

export type Actor = {
  name: string;
  handle: string;
  initials: string;
  color: string;
};

export function toggleThanks(
  posts: Post[],
  id: number,
  liked: boolean,
): Post[] {
  return posts.map((post) =>
    post.id === id
      ? {
          ...post,
          liked: undefined,
          thanks: Math.max(0, post.thanks + (liked ? -1 : 1)),
        }
      : post,
  );
}

export function addComment(
  posts: Post[],
  postId: number,
  body: string,
  actor: Actor,
  now = new Date(),
): Post[] {
  const clean = body.trim().slice(0, 500);
  if (!clean) return posts;
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          comments: [
            ...post.comments,
            {
              id: now.getTime(),
              name: actor.name,
              handle: actor.handle,
              body: clean,
              createdAt: now.toISOString(),
            },
          ],
        }
      : post,
  );
}

export function filterFeed(
  posts: Post[],
  query: string,
  followed: string[],
  followingOnly: boolean,
): Post[] {
  const needle = query.trim().toLowerCase();
  return posts.filter((post) => {
    if (followingOnly && !followed.includes(post.handle)) return false;
    return (
      !needle ||
      `${post.name} ${post.handle} ${post.body} ${post.tag}`
        .toLowerCase()
        .includes(needle)
    );
  });
}

export function parseAppData(raw: string | null, fallback: AppData): AppData {
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as {
      version?: number;
      posts?: Post[];
      users?: Record<string, UserState>;
      followed?: string[];
      activities?: Activity[];
    };
    if (
      value.version === 2 &&
      Array.isArray(value.posts) &&
      value.users &&
      typeof value.users === "object"
    )
      return value as AppData;
    if (
      value.version === 1 &&
      Array.isArray(value.posts) &&
      Array.isArray(value.followed) &&
      Array.isArray(value.activities)
    ) {
      return {
        version: 2,
        posts: value.posts.map((post) => ({ ...post, liked: undefined })),
        users: {},
        legacy: {
          followed: value.followed,
          likedPostIds: value.posts
            .filter((post) => post.liked)
            .map((post) => post.id),
          activities: value.activities,
        },
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function userState(data: AppData, userId: string): UserState {
  return (
    data.users[userId] ??
    data.legacy ?? { followed: [], likedPostIds: [], activities: [] }
  );
}

export function activateUser(data: AppData, userId: string): AppData {
  if (data.users[userId]) return data;
  return {
    ...data,
    users: {
      ...data.users,
      [userId]: data.legacy ?? {
        followed: [],
        likedPostIds: [],
        activities: [],
      },
    },
    legacy: undefined,
  };
}

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
