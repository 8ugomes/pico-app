import assert from 'node:assert/strict';
import test from 'node:test';
import { findMentionQuery, insertMention, selectedMentionsInText } from '../src/lib/inline-mentions.ts';

test('typing @ in prose searches at the caret, not inside an email', () => {
  assert.deepEqual(findMentionQuery('Treino com @p', 13), { start: 11, end: 13, query: 'p' });
  assert.equal(findMentionQuery('contato@p', 9), null);
  assert.equal(findMentionQuery('Olá @pa no treino', 17), null);
});

test('choosing a person inserts the handle at the caret', () => {
  assert.deepEqual(insertMention('Oi @pa hoje', { start: 3, end: 6, query: 'pa' }, 'paula'), { body: 'Oi @paula hoje', cursor: 10 });
});

test('only selected handles still in the text produce recipients', () => {
  const people = [{ id: '1', username: 'paula' }, { id: '2', username: 'pedro' }];
  assert.deepEqual(selectedMentionsInText('Oi @paula e @pedro!', people, false), { people, everyone: false });
  assert.deepEqual(selectedMentionsInText('Oi @paula2 e @pedro', people, false), { people: [people[1]], everyone: false });
  assert.deepEqual(selectedMentionsInText('Oi @todos', people, true), { people: [], everyone: true });
  assert.deepEqual(selectedMentionsInText('Oi @todoss', people, true), { people: [], everyone: false });
});
