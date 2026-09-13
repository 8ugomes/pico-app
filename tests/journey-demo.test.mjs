import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from '../src/data/mock.ts';
import { createDemoState, demoReducer, validatePost, visibleDemoPosts } from '../src/lib/demo-state.ts';

test('demo group participation distinguishes immediate entry, pending and private visibility',()=>{
 let state=createDemoState(mock);
 state=demoReducer(state,{type:'community_membership',id:'primeiros-saques',join:true});
 assert.ok(state.communities.find(c=>c.id==='primeiros-saques').members.includes(state.currentUserId));
 state=demoReducer(state,{type:'community_membership',id:'roda-reservada',join:true});
 const privateGroup=state.communities.find(c=>c.id==='roda-reservada');
 assert.ok(privateGroup.pending.includes(state.currentUserId));assert.ok(!privateGroup.members.includes(state.currentUserId));
 const input={arenaId:'vila',sportId:'futevolei',content:'Rascunho',audience:'private',communityIds:['roda-reservada']};
 assert.ok(validatePost(state,input));
 const withPrivate={...state,posts:[...state.posts,{id:'private-fixture',authorId:'julia',arenaId:'vila',sportId:'volei-praia',content:'Privado',audience:'private',communityIds:['roda-reservada'],createdAt:0,likes:0}]};
 assert.ok(!visibleDemoPosts(withPrivate).some(p=>p.id==='private-fixture'));
 assert.ok(!mock.communities.find(c=>c.id==='primeiros-saques').members.includes(state.currentUserId));
});

test('demo game sharing is a separate explicit action with immutable past date and chosen destinations',()=>{
 let state=createDemoState(mock);const before=state.posts.length;
 state=demoReducer(state,{type:'save_game',id:'game-1',arenaId:'vila',sportId:'futevolei',playedOn:'2026-01-02'});
 assert.equal(state.posts.length,before);
 const input={arenaId:'vila',sportId:'futevolei',content:'',gameId:'game-1',gameVersion:1,audience:'beta',communityIds:[],distributedToArena:false};
 assert.equal(validatePost(state,input),null);
 state=demoReducer(state,{type:'post',id:'post-1',input,now:0});
 assert.equal(state.posts[0].gamePlayedOn,'2026-01-02');assert.equal(state.posts[0].distributedToArena,false);
 state=demoReducer(state,{type:'post',id:'post-1',input,now:0});assert.equal(state.posts.length,before+1);
 state=demoReducer(state,{type:'save_game',id:'game-1',arenaId:'vila',sportId:'futevolei',playedOn:'2026-01-03',version:1});
 assert.ok(validatePost(state,input));assert.equal(state.posts[0].gamePlayedOn,'2026-01-02');
 state=demoReducer(state,{type:'delete_game',id:'game-1'});assert.equal(state.posts.length,before+1);assert.equal(state.games.length,0);
 assert.equal(demoReducer(state,{type:'save_game',id:'missing',arenaId:'vila',sportId:'futevolei',playedOn:'2026-01-01',version:1}),state);
});
