import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "../src/data/mock.ts";
import { createDemoState, demoReducer, validatePost, normalizeSearch } from "../src/lib/demo-state.ts";
const initial = () => createDemoState(mock);

test("demo state is independent from its seed and new sessions", () => {
  const state = initial();
  state.players[0].name = "Changed";
  assert.equal(initial().players[0].name, "Rafa Costa");
  assert.equal(mock.players[0].name, "Rafa Costa");
});

test("likes are reversible without modifying the seed count", () => {
  const state = initial();
  const liked = demoReducer(state, { type: "like", postId: "post-marina" });
  assert.deepEqual(liked.likedPostIds, ["post-marina"]);
  assert.equal(liked.posts[0].likes, 24);
  assert.deepEqual(demoReducer(liked, { type: "like", postId: "post-marina" }).likedPostIds, []);
  assert.equal(demoReducer(state, { type: "like", postId: "missing" }), state);
});

test("connections cannot target self or an unknown player and toggle once", () => {
  let state = initial();
  assert.equal(demoReducer(state, { type: "connect", playerId: "rafa" }), state);
  assert.equal(demoReducer(state, { type: "connect", playerId: "missing" }), state);
  state = demoReducer(state, { type: "connect", playerId: "bia" });
  assert.equal(state.connectedPlayerIds.filter(id => id === "bia").length, 1);
  state = demoReducer(state, { type: "connect", playerId: "bia" });
  assert.ok(!state.connectedPlayerIds.includes("bia"));
});

test("following an arena is reversible and rejects unknown arenas", () => {
  let state = initial();
  assert.equal(demoReducer(state, { type: "follow", arenaId: "missing" }), state);
  state = demoReducer(state, { type: "follow", arenaId: "ipanema" });
  assert.ok(state.followedArenaIds.includes("ipanema"));
  state = demoReducer(state, { type: "follow", arenaId: "ipanema" });
  assert.ok(!state.followedArenaIds.includes("ipanema"));
});

test("posts enforce body and arena/sport compatibility", () => {
  const state = initial();
  const valid = { arenaId: "vila", sportId: "futevolei", content: " Bora jogar? " };
  assert.equal(validatePost(state, valid), null);
  for (const input of [{ ...valid, content: "  " }, { ...valid, content: "a".repeat(501) }, { ...valid, arenaId: "unknown" }, { ...valid, sportId: "beach-tennis" }]) {
    assert.ok(validatePost(state, input));
    assert.equal(demoReducer(state, { type: "post", input, id: "new", now: 1 }), state);
  }
  const next = demoReducer(state, { type: "post", input: valid, id: "new", now: 1 });
  assert.equal(next.posts[0].content, "Bora jogar?");
  assert.equal(next.posts[0].authorId, state.currentUserId);
  assert.equal(demoReducer(next, { type: "post", input: valid, id: "new", now: 1 }), next);
});

test("comments reject blank, oversized, unknown and duplicate submissions", () => {
  let state = initial();
  for (const content of ["  ", "a".repeat(281)]) assert.equal(demoReducer(state, { type: "comment", postId: "post-marina", content, id: "c", now: 1 }), state);
  assert.equal(demoReducer(state, { type: "comment", postId: "missing", content: "Oi", id: "c", now: 1 }), state);
  state = demoReducer(state, { type: "comment", postId: "post-marina", content: " Tô dentro! ", id: "c", now: 1 });
  assert.equal(state.comments.at(-1).content, "Tô dentro!");
  assert.equal(demoReducer(state, { type: "comment", postId: "post-marina", content: "Outra", id: "c", now: 2 }), state);
});

test("games are private local records with dates, corrections and no posts", () => {
  const original = initial();
  const action = { type: "save_game", arenaId: "vila", sportId: "futevolei", id: "one", playedOn: "2026-01-01" };
  const saved = demoReducer(original, action);
  assert.equal(saved.games.length, 1);
  assert.deepEqual(saved.posts, original.posts);
  assert.equal(demoReducer(saved, action), saved);
  assert.equal(demoReducer(saved, {...action, id:"future", playedOn:"2099-01-01"}), saved);
  assert.equal(demoReducer(saved, {...action, id:"invalid", playedOn:"2026-02-30"}), saved);
  const corrected = demoReducer(saved, {...action, playedOn:"2026-01-02", version:1});
  assert.equal(corrected.games[0].playedOn, "2026-01-02");
  assert.equal(corrected.games[0].version, 2);
  assert.equal(demoReducer(corrected, {...action, playedOn:"2026-01-03", version:1}), corrected);
  assert.equal(demoReducer({...saved,currentUserId:"marina"}, {type:"delete_game",id:"one"}).games.length, 1);
  const deleted = demoReducer(saved, {type:"delete_game",id:"one"});
  assert.equal(deleted.games.length, 0);
  assert.equal(demoReducer(deleted, action), deleted);
});

test("profile editing validates lengths, trims and leaves other players unchanged", () => {
  const state = initial();
  const input = { name: "  Rafa Silva ", bio: " Bora! ", available: false };
  const next = demoReducer(state, { type: "profile", input });
  assert.equal(next.players[0].name, "Rafa Silva");
  assert.equal(next.players[0].bio, "Bora!");
  assert.equal(next.players[0].available, false);
  assert.deepEqual(next.players.slice(1), state.players.slice(1));
  for (const bad of [{ ...input, name: " " }, { ...input, name: "a".repeat(61) }, { ...input, bio: "x".repeat(161) }]) assert.equal(demoReducer(state, { type: "profile", input: bad }), state);
});

test("Portuguese search handles accents, case and surrounding whitespace", () => {
  assert.equal(normalizeSearch("  JÚLIA  "), "julia");
  assert.ok(normalizeSearch("Vila Madalena São Paulo").includes(normalizeSearch("sao paulo")));
});

test('demo republication is explicit, canonical, idempotent and disappears after undo', async () => {
  const { demoFeed } = await import('../src/lib/demo-state.ts');
  let state = initial();
  const original = state.posts.find(p => p.authorId !== state.currentUserId);
  const before = structuredClone({ posts: state.posts, comments: state.comments, games: state.games });
  const action = { type: 'repost', postId: original.id, reposted: true, now: Date.now() };
  state = demoReducer(state, action);
  assert.equal(state.reposts.length, 1);
  assert.equal(demoReducer(state, { ...action, now: action.now + 1000 }), state);
  assert.deepEqual({ posts: state.posts, comments: state.comments, games: state.games }, before);
  const own = demoFeed(state, state.currentUserId).find(p => p.post.id === original.id);
  assert.equal(own.post.authorId, original.authorId);
  assert.equal(own.repost.playerId, state.currentUserId);
  assert.equal(demoFeed(state).filter(p => p.post.id === original.id).length, 1);
  state = demoReducer(state, { ...action, reposted: false });
  assert.equal(state.reposts.length, 0);
  assert.equal(demoFeed(state, state.currentUserId).some(p => p.post.id === original.id), false);
});

test('demo republication cannot expose private posts and tracks follower direction', async () => {
  const { demoFeed } = await import('../src/lib/demo-state.ts');
  let state = initial();
  const original = state.posts.find(p => p.authorId !== state.currentUserId);
  const other = state.players.find(p => p.id !== state.currentUserId && p.id !== original.authorId);
  const privatePost = { ...original, id: 'private-repost-test', audience: 'private', communityIds: ['closed'] };
  state = { ...state, posts: [...state.posts, privatePost], communities: [...state.communities, { id: 'closed', members: [original.authorId, other.id] }], reposts: [{ postId: privatePost.id, playerId: other.id, createdAt: Date.now() }] };
  assert.equal(demoReducer(state, { type: 'repost', postId: privatePost.id, reposted: true, now: Date.now() }), state);
  assert.equal(demoFeed(state).some(p => p.post.id === privatePost.id), false);
  state = { ...state, communities: state.communities.map(c => c.id === 'closed' ? { ...c, members: [...c.members, state.currentUserId] } : c), connectedPlayerIds: [] };
  assert.equal(demoFeed(state).find(p => p.post.id === privatePost.id).repost, undefined);
  state = { ...state, connectedPlayerIds: [other.id] };
  assert.equal(demoFeed(state).find(p => p.post.id === privatePost.id).repost.playerId, other.id);
  state = { ...state, communities: state.communities.map(c => c.id === 'closed' ? { ...c, members: c.members.filter(id => id !== other.id) } : c) };
  assert.equal(demoFeed(state).find(p => p.post.id === privatePost.id).repost, undefined);
});
