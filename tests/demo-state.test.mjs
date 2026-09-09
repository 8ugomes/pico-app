import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "../src/data/mock.ts";
import { createDemoState, demoReducer, activeCheckins, validatePost, CHECKIN_DURATION, normalizeSearch } from "../src/lib/demo-state.ts";
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

test("a player has one active check-in and replacement preserves others", () => {
  let state = initial();
  const others = state.checkins.filter(c => c.playerId !== "rafa");
  state = demoReducer(state, { type: "checkin", arenaId: "vila", sportId: "futevolei", id: "one", now: 100 });
  state = demoReducer(state, { type: "checkin", arenaId: "ipanema", sportId: "beach-tennis", id: "two", now: 200 });
  const mine = state.checkins.filter(c => c.playerId === "rafa");
  assert.equal(mine.length, 1);
  assert.equal(mine[0].arenaId, "ipanema");
  assert.deepEqual(state.checkins.filter(c => c.playerId !== "rafa"), others);
  assert.equal(demoReducer(state, { type: "checkin", arenaId: "vila", sportId: "beach-tennis", id: "bad", now: 300 }), state);
});

test("check-in expires exactly at the boundary and checkout removes presence", () => {
  const state = demoReducer(initial(), { type: "checkin", arenaId: "vila", sportId: "futevolei", id: "one", now: 100 });
  assert.ok(!activeCheckins(state, 99).some(c => c.playerId === "rafa"));
  assert.ok(activeCheckins(state, 100 + CHECKIN_DURATION - 1).some(c => c.playerId === "rafa"));
  assert.ok(!activeCheckins(state, 100 + CHECKIN_DURATION).some(c => c.playerId === "rafa"));
  assert.ok(!activeCheckins(demoReducer(state, { type: "checkout" }), 101).some(c => c.playerId === "rafa"));
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
