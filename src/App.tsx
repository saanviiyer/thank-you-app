import { FormEvent, useEffect, useState } from "react";
import {
  AUTH_KEY,
  createAccount,
  currentProfile,
  deleteAccount,
  initials,
  normalizeUsername,
  parseAuth,
  signIn,
  updateProfile,
  validUsername,
  type AuthData,
  type Profile,
} from "./auth";
import {
  activateUser,
  addComment,
  filterFeed,
  parseAppData,
  timeAgo,
  toggleThanks,
  userState,
  type Activity,
  type AppData,
  type Category,
  type Post,
  type UserState,
} from "./domain";
import { compressImage } from "./media";

type IconName =
  | "home"
  | "compass"
  | "bell"
  | "user"
  | "search"
  | "plus"
  | "heart"
  | "comment"
  | "share"
  | "more"
  | "sparkle"
  | "sun"
  | "users"
  | "leaf"
  | "chevron";
type Page = "home" | "discover" | "activity" | "profile";
const paths: Record<IconName, string> = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5a5.5 5.5 0 0 0 1.1-8.9Z"/>',
  comment:
    '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  sparkle:
    '<path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 14l.7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  leaf: '<path d="M20.8 3.2C13 3 6.5 5.6 5 11c-1.2 4.4 2 7 5.5 6.8 6-.3 9.4-6.1 10.3-14.6Z"/><path d="M3 21c3-6 7-9 13-12"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
};
const categoryIcons: Record<Category, IconName> = {
  "Everyday kindness": "sparkle",
  "A thank you": "heart",
  "Neighbor love": "users",
  "For the planet": "leaf",
  "Small act, big day": "sun",
};
const categories = Object.keys(categoryIcons) as Category[];
function Icon({
  name,
  size = 20,
  fill = "none",
}: {
  name: IconName;
  size?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: paths[name] }}
    />
  );
}
function Avatar({
  initials,
  color,
  small = false,
  image,
  label,
}: {
  initials: string;
  color: string;
  small?: boolean;
  image?: string;
  label?: string;
}) {
  return (
    <div
      className={`avatar ${color} ${small ? "small" : ""}`}
      aria-label={label}
    >
      {image ? <img src={image} alt="" /> : initials}
    </div>
  );
}

const initialPosts: Post[] = [
  {
    id: 1,
    name: "Maya Chen",
    handle: "@mayac",
    createdAt: "2026-08-17T11:48:00Z",
    initials: "MC",
    color: "coral",
    body: "Saw someone leave their umbrella on the train this morning. Ran two blocks in the rain to catch up with them. We both ended up soaked and laughing.",
    tag: "Small act, big day",
    thanks: 84,
    comments: [
      {
        id: 101,
        name: "Leila Moore",
        handle: "@leilam",
        body: "This is exactly the story I needed today.",
        createdAt: "2026-08-17T11:50:00Z",
      },
    ],
    featured: true,
  },
  {
    id: 2,
    name: "Eli Thompson",
    handle: "@elithompson",
    createdAt: "2026-08-17T11:22:00Z",
    initials: "ET",
    color: "blue",
    body: "My neighbor Mr. Flores has been teaching me how to grow tomatoes. Today I brought over the first loaf of sourdough I didn’t mess up. A pretty great trade, if you ask me.",
    tag: "Neighbor love",
    thanks: 126,
    comments: [],
    image: "garden",
  },
  {
    id: 3,
    name: "Nadia Patel",
    handle: "@nadiap",
    createdAt: "2026-08-17T11:00:00Z",
    initials: "NP",
    color: "violet",
    body: "To the barista who remembered my order on a hard morning — you had no idea, but that tiny bit of care meant everything. Thank you, June. ☕",
    tag: "A thank you",
    thanks: 203,
    comments: [],
  },
  {
    id: 4,
    name: "Jon Bell",
    handle: "@jonb",
    createdAt: "2026-08-17T10:00:00Z",
    initials: "JB",
    color: "green",
    body: "Spent the afternoon picking up trash along our favorite trail with twelve complete strangers. We arrived alone and left with a group chat.",
    tag: "For the planet",
    thanks: 67,
    comments: [],
  },
];
const people = [
  { name: "Maya Chen", handle: "@mayac", initials: "MC", color: "coral" },
  {
    name: "Eli Thompson",
    handle: "@elithompson",
    initials: "ET",
    color: "blue",
  },
  { name: "Nadia Patel", handle: "@nadiap", initials: "NP", color: "violet" },
];
const initialData: AppData = {
  version: 2,
  posts: initialPosts,
  users: {},
  legacy: {
    followed: [],
    likedPostIds: [],
    activities: [
      {
        id: 1,
        kind: "thanks",
        message: "Maya thanked your story",
        createdAt: "2026-08-17T11:58:00Z",
        read: false,
      },
      {
        id: 2,
        kind: "follow",
        message: "Sam Rivera followed you",
        createdAt: "2026-08-17T11:00:00Z",
        read: false,
      },
    ],
  },
};
const STORAGE_KEY = "thank-you.web.v2";
const LEGACY_STORAGE_KEY = "thank-you.web.v1";

export default function App() {
  const [auth, setAuth] = useState<AuthData>(() =>
    parseAuth(localStorage.getItem(AUTH_KEY)),
  );
  const profile = currentProfile(auth);
  const [data, setData] = useState<AppData>(() =>
    parseAppData(
      localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY),
      initialData,
    ),
  );
  const [page, setPage] = useState<Page>("home");
  const [tab, setTab] = useState<"For you" | "Following">("For you");
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<Category>("Everyday kindness");
  const [photo, setPhoto] = useState<string>();
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [toast, setToast] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setStorageError("");
    } catch {
      setStorageError(
        "Your latest change could not be saved. Remove a large photo or free browser storage.",
      );
    }
  }, [data]);
  useEffect(() => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } catch {
      setStorageError(
        "Your account session could not be saved in this browser.",
      );
    }
  }, [auth]);
  useEffect(() => {
    if (profile && !data.users[profile.id])
      setData((current) => activateUser(current, profile.id));
  }, [data.users, profile]);
  if (!profile) return <AuthScreen auth={auth} onAuth={setAuth} />;
  const currentUser = {
    name: profile.name,
    handle: `@${profile.username}`,
    initials: initials(profile.name),
    color: "orange",
    avatar: profile.avatar,
  };
  const state = userState(data, profile.id);
  const unread = state.activities.filter((item) => !item.read).length;
  const visiblePosts = filterFeed(
    page === "profile"
      ? data.posts.filter((post) => post.handle === currentUser.handle)
      : data.posts,
    query,
    state.followed,
    page === "home" && tab === "Following",
  );
  const selectedPost = data.posts.find((post) => post.id === commentPostId);
  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const setPosts = (posts: Post[]) =>
    setData((current) => ({ ...current, posts }));
  const updateState = (transform: (value: UserState) => UserState) =>
    setData((current) => ({
      ...current,
      users: {
        ...current.users,
        [profile.id]: transform(userState(current, profile.id)),
      },
    }));
  const navigate = (next: Page) => {
    setPage(next);
    setQuery("");
    if (next === "activity")
      updateState((value) => ({
        ...value,
        activities: value.activities.map((item) => ({ ...item, read: true })),
      }));
  };
  const toggleFollow = (handle: string) => {
    if (handle === currentUser.handle) return;
    setData((current) => {
      const mine = userState(current, profile.id);
      const isFollowing = mine.followed.includes(handle);
      const target = auth.accounts.find((account) => `@${account.username}` === handle);
      const users = { ...current.users, [profile.id]: { ...mine, followed: isFollowing ? mine.followed.filter((item) => item !== handle) : [...mine.followed, handle] } };
      if (!isFollowing && target && target.id !== profile.id) {
        const theirs = userState(current, target.id);
        users[target.id] = { ...theirs, activities: [{ id: Date.now(), kind: "follow", message: `${profile.name} followed you`, createdAt: new Date().toISOString(), read: false }, ...theirs.activities] };
      }
      return { ...current, users };
    });
  };
  const thank = (post: Post) => {
    const liked = state.likedPostIds.includes(post.id);
    const activity: Activity = {
      id: Date.now(),
      kind: "thanks",
      message: `You thanked ${post.name}'s story`,
      createdAt: new Date().toISOString(),
      read: true,
    };
    setData((current) => {
      const value = userState(current, profile.id);
      const target = auth.accounts.find((account) => `@${account.username}` === post.handle);
      const users = {
        ...current.users,
        [profile.id]: {
          ...value,
          likedPostIds: liked ? value.likedPostIds.filter((id) => id !== post.id) : [...value.likedPostIds, post.id],
          activities: liked ? value.activities : [activity, ...value.activities],
        },
      };
      if (!liked && target && target.id !== profile.id) {
        const theirs = userState(current, target.id);
        users[target.id] = { ...theirs, activities: [{ id: Date.now() + 1, kind: "thanks", message: `${profile.name} thanked your story`, createdAt: new Date().toISOString(), read: false }, ...theirs.activities] };
      }
      return {
        ...current,
        posts: toggleThanks(current.posts, post.id, liked),
        users,
      };
    });
  };
  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim().slice(0, 280);
    if (!body) return;
    const post: Post = {
      id: Date.now(),
      ...currentUser,
      createdAt: new Date().toISOString(),
      body,
      tag: category,
      thanks: 0,
      comments: [],
      image: photo,
    };
    setData((current) => ({ ...current, posts: [post, ...current.posts] }));
    setDraft("");
    setCategory("Everyday kindness");
    setPhoto(undefined);
    setComposerOpen(false);
    setPage("home");
    flash("Your kindness is now out in the world.");
  };
  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (commentPostId == null || !commentDraft.trim()) return;
    const targetPost = data.posts.find((post) => post.id === commentPostId);
    setData((current) => {
      const target = auth.accounts.find((account) => `@${account.username}` === targetPost?.handle);
      if (!target || target.id === profile.id) return { ...current, posts: addComment(current.posts, commentPostId, commentDraft, currentUser) };
      const theirs = userState(current, target.id);
      return { ...current, posts: addComment(current.posts, commentPostId, commentDraft, currentUser), users: { ...current.users, [target.id]: { ...theirs, activities: [{ id: Date.now(), kind: "comment", message: `${profile.name} replied to your story`, createdAt: new Date().toISOString(), read: false }, ...theirs.activities] } } };
    });
    setCommentDraft("");
  };
  const sharePost = async (post: Post) => {
    const text = `${post.name}: ${post.body}`;
    const nativeShare = typeof navigator.share === "function";
    try {
      if (nativeShare)
        await navigator.share({
          title: "A story from thank you",
          text,
          url: location.href,
        });
      else await navigator.clipboard.writeText(`${text}\n${location.href}`);
      flash(nativeShare ? "Shared." : "Story copied to clipboard.");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        flash("Sharing was not available.");
    }
  };
  const loadPhoto = async (file?: File) => {
    if (!file) return;
    try {
      setPhoto(await compressImage(file, 1_600, 900_000));
    } catch (error) {
      flash(
        error instanceof Error
          ? error.message
          : "The photo could not be prepared.",
      );
    }
  };
  const saveEditedProfile = (next: Profile) => {
    const oldHandle = currentUser.handle;
    const nextHandle = `@${next.username}`;
    setAuth((value) => updateProfile(value, next));
    setData((current) => ({
      ...current,
      posts: current.posts.map((post) => ({
        ...post,
        ...(post.handle === oldHandle
          ? {
              name: next.name,
              handle: nextHandle,
              initials: initials(next.name),
              avatar: next.avatar,
            }
          : {}),
        comments: post.comments.map((comment) =>
          comment.handle === oldHandle
            ? { ...comment, name: next.name, handle: nextHandle }
            : comment,
        ),
      })),
      users: Object.fromEntries(
        Object.entries(current.users).map(([id, value]) => [
          id,
          {
            ...value,
            followed: [
              ...new Set(
                value.followed.map((handle) =>
                  handle === oldHandle ? nextHandle : handle,
                ),
              ),
            ],
          },
        ]),
      ),
    }));
    setEditingProfile(false);
  };
  const deleteCurrent = () => {
    if (
      !confirm(
        "Permanently delete this account, its stories, and replies from this browser?",
      )
    )
      return;
    const ownedIds = new Set(
      data.posts
        .filter((post) => post.handle === currentUser.handle)
        .map((post) => post.id),
    );
    setData((current) => ({
      ...current,
      posts: current.posts
        .filter((post) => post.handle !== currentUser.handle)
        .map((post) => ({
          ...post,
          comments: post.comments.filter(
            (comment) => comment.handle !== currentUser.handle,
          ),
        })),
      users: Object.fromEntries(
        Object.entries(current.users)
          .filter(([id]) => id !== profile.id)
          .map(([id, value]) => [
            id,
            {
              ...value,
              followed: value.followed.filter(
                (handle) => handle !== currentUser.handle,
              ),
              likedPostIds: value.likedPostIds.filter(
                (postId) => !ownedIds.has(postId),
              ),
            },
          ]),
      ),
    }));
    setAuth((value) => deleteAccount(value, profile.id));
  };

  const PostCard = ({ post }: { post: Post }) => (
    <article className={`post ${post.featured ? "featured" : ""}`}>
      {post.featured && (
        <div className="featured-label">
          <Icon name="sparkle" size={13} /> A LITTLE EXTRA GOOD
        </div>
      )}
      <div className="post-head">
        <Avatar initials={post.initials} color={post.color} image={post.avatar} label={`${post.name}'s profile photo`} />
        <div className="identity">
          <div>
            <strong>{post.name}</strong>
            <span>
              {post.handle} · {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        {post.handle !== currentUser.handle ? (
          <button
            className={`follow-inline ${state.followed.includes(post.handle) ? "following" : ""}`}
            onClick={() => toggleFollow(post.handle)}
            aria-pressed={state.followed.includes(post.handle)}
          >
            {state.followed.includes(post.handle) ? "Following" : "Follow"}
          </button>
        ) : (
          <button
            className="icon-btn"
            aria-label="Delete story"
            onClick={() => {
              if (confirm("Delete this story and its replies?"))
                setPosts(data.posts.filter((item) => item.id !== post.id));
            }}
          >
            <Icon name="more" />
          </button>
        )}
      </div>
      <p className="post-body">{post.body}</p>
      {post.image === "garden" && (
        <div className="garden-image" aria-label="A sunny community garden">
          <div className="sun" />
          <div className="hill h1" />
          <div className="hill h2" />
          <span className="flower f1">✿</span>
          <span className="flower f2">✿</span>
          <span className="flower f3">✿</span>
          <span className="tomato t1">●</span>
          <span className="tomato t2">●</span>
          <span className="garden-caption">grown with patience</span>
        </div>
      )}
      {post.image && post.image !== "garden" && (
        <img
          className="post-photo"
          src={post.image}
          alt="Shared with this kindness story"
        />
      )}
      <div className="post-meta">
        <span className="tag">
          <Icon name={categoryIcons[post.tag]} size={14} />
          {post.tag}
        </span>
      </div>
      <div className="post-actions">
        <button
          className={state.likedPostIds.includes(post.id) ? "liked" : ""}
          aria-pressed={state.likedPostIds.includes(post.id)}
          aria-label={
            state.likedPostIds.includes(post.id)
              ? `Remove thanks. ${post.thanks} thanks`
              : `Give thanks. ${post.thanks} thanks`
          }
          onClick={() => thank(post)}
        >
          <Icon
            name="heart"
            size={18}
            fill={
              state.likedPostIds.includes(post.id) ? "currentColor" : "none"
            }
          />
          {post.thanks} thanks
        </button>
        <button
          aria-label={`Open ${post.comments.length} replies`}
          onClick={() => setCommentPostId(post.id)}
        >
          <Icon name="comment" size={18} />
          {post.comments.length}
        </button>
        <button
          className="share-action"
          aria-label="Share story"
          onClick={() => void sharePost(post)}
        >
          <Icon name="share" size={18} />
        </button>
      </div>
    </article>
  );
  const Feed = ({ hero = false }: { hero?: boolean }) => (
    <>
      {hero && (
        <section className="hero">
          <div>
            <span className="eyebrow">
              <Icon name="sparkle" size={15} /> TODAY'S GOOD
            </span>
            <h1>
              Kindness looks good
              <br />
              on everyone.
            </h1>
            <p>Share a little good. Make someone's day.</p>
          </div>
          <div className="hero-art">
            <span className="ray r1" />
            <span className="ray r2" />
            <span className="ray r3" />
            <span className="ray r4" />
            <div className="hero-heart">
              <Icon name="heart" size={39} fill="currentColor" />
            </div>
          </div>
        </section>
      )}
      <div className="feed-label">
        <span>
          {page === "profile" ? "YOUR KINDNESS" : "THE KINDNESS FEED"}
        </span>
        <span>{visiblePosts.length} stories</span>
      </div>
      <section className="feed">
        {visiblePosts.map((post) => (
          <PostCard post={post} key={post.id} />
        ))}
        {!visiblePosts.length && (
          <div className="empty">
            <Icon name={tab === "Following" ? "users" : "search"} size={30} />
            <h3>
              {tab === "Following"
                ? "Your following feed is quiet"
                : "No kindness found"}
            </h3>
            <p>
              {tab === "Following"
                ? "Follow someone from the feed to see their stories here."
                : "Try a different search — there is plenty of good here."}
            </p>
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className="app-shell">
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Icon name="sparkle" size={17} />
          {toast}
        </div>
      )}
      {storageError && (
        <div className="storage-error" role="alert">
          {storageError}
        </div>
      )}
      <aside className="sidebar">
        <button className="brand brand-button" onClick={() => navigate("home")}>
          <span className="brand-mark">
            <Icon name="heart" size={22} fill="currentColor" />
          </span>
          <span>thank you</span>
        </button>
        <nav aria-label="Primary">
          <button
            className={`nav-item ${page === "home" ? "active" : ""}`}
            onClick={() => navigate("home")}
          >
            <Icon name="home" />
            Home
          </button>
          <button
            className={`nav-item ${page === "discover" ? "active" : ""}`}
            onClick={() => navigate("discover")}
          >
            <Icon name="compass" />
            Discover
          </button>
          <button
            className={`nav-item ${page === "activity" ? "active" : ""}`}
            onClick={() => navigate("activity")}
          >
            <span className="nav-icon-wrap">
              <Icon name="bell" />
              {unread > 0 && <b>{unread}</b>}
            </span>
            Activity
          </button>
          <button
            className={`nav-item ${page === "profile" ? "active" : ""}`}
            onClick={() => navigate("profile")}
          >
            <Icon name="user" />
            Profile
          </button>
        </nav>
        <button className="share-button" onClick={() => setComposerOpen(true)}>
          <Icon name="plus" size={19} />
          Share kindness
        </button>
        <div className="sidebar-user">
          <Avatar initials={currentUser.initials} color="orange" image={profile.avatar} label={`${profile.name}'s profile photo`} small />
          <div>
            <strong>{profile.name}</strong>
            <span>{currentUser.handle}</span>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Icon name="heart" size={18} fill="currentColor" />
            </span>
            thank you
          </div>
          {page === "home" ? (
            <div className="tabs">
              <button
                className={tab === "For you" ? "active" : ""}
                onClick={() => setTab("For you")}
              >
                For you
              </button>
              <button
                className={tab === "Following" ? "active" : ""}
                onClick={() => setTab("Following")}
              >
                Following
              </button>
            </div>
          ) : (
            <h2 className="page-title">
              {page === "activity"
                ? "Activity"
                : page[0].toUpperCase() + page.slice(1)}
            </h2>
          )}
          <button
            className="mobile-compose"
            onClick={() => setComposerOpen(true)}
          >
            <Icon name="plus" />
          </button>
        </header>
        {page === "home" && <Feed hero />}
        {page === "discover" && (
          <>
            <section className="page-intro">
              <span className="eyebrow">
                <Icon name="compass" size={15} /> DISCOVER
              </span>
              <h1>Good is everywhere.</h1>
              <p>Search stories, people, and kinds of kindness.</p>
              <div className="mobile-search search">
                <Icon name="search" size={18} />
                <input
                  aria-label="Search kindness"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search kindness"
                />
              </div>
            </section>
            <Feed />
          </>
        )}
        {page === "profile" && (
          <>
            <section className="profile-head">
              <Avatar initials={currentUser.initials} color="orange" image={profile.avatar} label={`${profile.name}'s profile photo`} />
              <div>
                <h1>{profile.name}</h1>
                <span>{currentUser.handle}</span>
                <p>{profile.bio}</p>
                <div className="profile-buttons">
                  <button onClick={() => setEditingProfile(true)}>
                    Edit profile
                  </button>
                  <button
                    onClick={() =>
                      setAuth((value) => ({ ...value, sessionId: undefined }))
                    }
                  >
                    Sign out
                  </button>
                </div>
              </div>
              <div className="profile-stats">
                <strong>
                  {
                    data.posts.filter(
                      (post) => post.handle === currentUser.handle,
                    ).length
                  }
                  <span>stories</span>
                </strong>
                <strong>
                  {data.posts
                    .filter((post) => post.handle === currentUser.handle)
                    .reduce((sum, post) => sum + post.thanks, 0)}
                  <span>thanks</span>
                </strong>
                <strong>
                  {state.followed.length}
                  <span>following</span>
                </strong>
              </div>
            </section>
            <Feed />
          </>
        )}
        {page === "activity" && (
          <section className="activity-list">
            {state.activities.map((item) => (
              <article key={item.id}>
                <span className={`activity-icon ${item.kind}`}>
                  <Icon
                    name={
                      item.kind === "thanks"
                        ? "heart"
                        : item.kind === "comment"
                          ? "comment"
                          : "user"
                    }
                    size={18}
                    fill={item.kind === "thanks" ? "currentColor" : "none"}
                  />
                </span>
                <div>
                  <strong>{item.message}</strong>
                  <span>{timeAgo(item.createdAt)}</span>
                </div>
              </article>
            ))}
            {!state.activities.length && (
              <div className="empty">
                <Icon name="bell" size={30} />
                <h3>Nothing new yet</h3>
              </div>
            )}
          </section>
        )}
      </main>
      <aside className="rightbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input
            aria-label="Search kindness"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search kindness"
          />
        </div>
        <section className="side-card prompt-card">
          <span className="eyebrow">
            <Icon name="sun" size={14} /> DAILY PROMPT
          </span>
          <h2>
            Who made your day
            <br />a little brighter?
          </h2>
          <p>Take a moment. Tell them.</p>
          <button
            onClick={() => {
              setCategory("A thank you");
              setComposerOpen(true);
            }}
          >
            Send a thank you <Icon name="chevron" size={15} />
          </button>
        </section>
        <section className="side-card people-card">
          <div className="card-title">
            <h3>Kind people to know</h3>
            <Icon name="users" size={18} />
          </div>
          {people
            .filter((person) => person.handle !== currentUser.handle)
            .map((person) => (
              <div className="person" key={person.handle}>
                <Avatar initials={person.initials} color={person.color} small />
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.handle}</span>
                </div>
                <button
                  aria-pressed={state.followed.includes(person.handle)}
                  className={
                    state.followed.includes(person.handle) ? "following" : ""
                  }
                  onClick={() => toggleFollow(person.handle)}
                >
                  {state.followed.includes(person.handle)
                    ? "Following"
                    : "Follow"}
                </button>
              </div>
            ))}
        </section>
        <footer>
          About · Community guidelines · Privacy
          <br />
          <span>© 2026 thank you · be kind out there</span>
        </footer>
      </aside>
      <nav className="mobile-nav">
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => navigate("home")}
        >
          <Icon name="home" />
        </button>
        <button
          className={page === "discover" ? "active" : ""}
          onClick={() => navigate("discover")}
        >
          <Icon name="compass" />
        </button>
        <button className="mobile-main" onClick={() => setComposerOpen(true)}>
          <Icon name="plus" />
        </button>
        <button
          className={page === "activity" ? "active" : ""}
          onClick={() => navigate("activity")}
        >
          <Icon name="bell" />
        </button>
        <button
          className={page === "profile" ? "active" : ""}
          onClick={() => navigate("profile")}
        >
          <Icon name="user" />
        </button>
      </nav>
      {composerOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setComposerOpen(false)}
        >
          <form
            className="composer"
            aria-modal="true"
            aria-labelledby="composer-title"
            onSubmit={submitPost}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="composer-head">
              <div>
                <span className="eyebrow">
                  <Icon name="sparkle" size={14} /> SHARE THE GOOD
                </span>
                <h2 id="composer-title">What kind thing happened?</h2>
              </div>
              <button
                aria-label="Close composer"
                type="button"
                onClick={() => setComposerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="composer-body">
              <Avatar initials={currentUser.initials} color="orange" image={profile.avatar} label={`${profile.name}'s profile photo`} />
              <div className="composer-fields">
                <textarea
                  aria-label="Kindness story"
                  autoFocus
                  maxLength={280}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Share a kind act, or thank someone who made your day..."
                />
                <div className="composer-options">
                  <select
                    aria-label="Kindness type"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as Category)
                    }
                  >
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <label className="photo-button">
                    {photo ? "Change photo" : "Add photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => loadPhoto(event.target.files?.[0])}
                    />
                  </label>
                  {photo && (
                    <button type="button" onClick={() => setPhoto(undefined)}>
                      Remove
                    </button>
                  )}
                </div>
                {photo && (
                  <img
                    className="composer-preview"
                    src={photo}
                    alt="Selected story attachment preview"
                  />
                )}
                <div className="composer-foot">
                  <span>{draft.length}/280</span>
                  <button disabled={!draft.trim()} type="submit">
                    Share kindness{" "}
                    <Icon name="heart" size={16} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
      {selectedPost && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setCommentPostId(null)}
        >
          <section
            className="comments-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comments-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="composer-head">
              <div>
                <span className="eyebrow">
                  <Icon name="comment" size={14} /> CONVERSATION
                </span>
                <h2 id="comments-title">
                  {selectedPost.comments.length}{" "}
                  {selectedPost.comments.length === 1 ? "reply" : "replies"}
                </h2>
              </div>
              <button
                aria-label="Close replies"
                type="button"
                onClick={() => setCommentPostId(null)}
              >
                ×
              </button>
            </div>
            <div className="comment-context">“{selectedPost.body}”</div>
            <div className="comment-list">
              {selectedPost.comments.map((comment) => (
                <article key={comment.id}>
                  <Avatar
                    initials={comment.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                    color="pink"
                    small
                  />
                  <div>
                    <strong>
                      {comment.name}{" "}
                      <span>
                        {comment.handle} · {timeAgo(comment.createdAt)}
                      </span>
                    </strong>
                    <p>{comment.body}</p>
                  </div>
                </article>
              ))}
              {!selectedPost.comments.length && (
                <p className="no-comments">Start a kind conversation.</p>
              )}
            </div>
            <form className="comment-form" onSubmit={submitComment}>
              <input
                aria-label="Write a reply"
                autoFocus
                maxLength={500}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Write a thoughtful reply…"
              />
              <button disabled={!commentDraft.trim()}>Reply</button>
            </form>
          </section>
        </div>
      )}
      {editingProfile && (
        <ProfileEditor
          profile={profile}
          auth={auth}
          onClose={() => setEditingProfile(false)}
          onSave={saveEditedProfile}
          onDelete={deleteCurrent}
        />
      )}
    </div>
  );
}

function AuthScreen({
  auth,
  onAuth,
}: {
  auth: AuthData;
  onAuth: (data: AuthData) => void;
}) {
  const [mode, setMode] = useState<"signup" | "signin">(
    auth.accounts.length ? "signin" : "signup",
  );
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "signup"
          ? await createAccount(auth, { name, username, email, password })
          : await signIn(auth, email, password);
      if (result.data) onAuth(result.data);
      else setError(result.error ?? "Account access failed.");
    } catch {
      setError(
        "Secure password processing is unavailable. Use a current browser on HTTPS or localhost.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">
            <Icon name="heart" size={22} fill="currentColor" />
          </span>
          thank you
        </div>
        <span className="eyebrow">
          <Icon name="sparkle" size={14} />{" "}
          {mode === "signup" ? "JOIN THE GOOD" : "WELCOME BACK"}
        </span>
        <h1>
          {mode === "signup" ? "Make kindness social." : "Good to see you."}
        </h1>
        <p>
          {mode === "signup"
            ? "Create a private local account to share, thank, and connect."
            : "Sign in to your account on this browser."}
        </p>
        <form onSubmit={(event) => void submit(event)}>
          {mode === "signup" && (
            <>
              <label>
                Name
                <input
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
              <label>
                Username
                <input
                  autoCapitalize="none"
                  maxLength={22}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              minLength={8}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="auth-submit" disabled={busy}>
            {busy
              ? "Working…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError("");
          }}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
        <small>
          Accounts and stories stay in this browser until a hosted service is
          connected.
        </small>
      </section>
    </main>
  );
}

function ProfileEditor({
  profile,
  auth,
  onClose,
  onSave,
  onDelete,
}: {
  profile: Profile;
  auth: AuthData;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim().slice(0, 80);
    const cleanUsername = normalizeUsername(username);
    if (cleanName.length < 2) return setError("Enter your full name.");
    if (!validUsername(cleanUsername))
      return setError("Use 3–20 letters, numbers, periods, or underscores.");
    if (
      auth.accounts.some(
        (account) =>
          account.id !== profile.id && account.username === cleanUsername,
      )
    )
      return setError("That username is already taken.");
    onSave({
      ...profile,
      name: cleanName,
      username: cleanUsername,
      bio: bio.trim().slice(0, 160),
      avatar,
    });
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="profile-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="composer-head">
          <h2 id="profile-editor-title">Edit profile</h2>
          <button
            aria-label="Close profile editor"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="profile-form">
          <Avatar initials={initials(name)} color="orange" image={avatar} />
          <label>
            Profile photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file)
                  void compressImage(file, 512, 300_000)
                    .then(setAvatar)
                    .catch((reason: Error) => setError(reason.message));
              }}
            />
          </label>
          {avatar && (
            <button type="button" onClick={() => setAvatar(undefined)}>
              Remove photo
            </button>
          )}
          <label>
            Name
            <input
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Username
            <input
              maxLength={22}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            Bio
            <textarea
              maxLength={160}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
            <small>{bio.length}/160</small>
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="auth-submit">Save profile</button>
          <button className="danger-button" type="button" onClick={onDelete}>
            Delete account
          </button>
        </div>
      </form>
    </div>
  );
}
