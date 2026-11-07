import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaLevels, dayBack, dayLabel, levelFor, pointRules, pointsWord, windowDays } from '../src/lib/arena-checkin.ts';

test('levels advance at their thresholds and cap at the highest', () => {
  assert.equal(levelFor(0).current.name, 'Pé na areia');
  assert.equal(levelFor(24).current.name, 'Pé na areia');
  assert.equal(levelFor(25).current.name, 'Saque');
  assert.equal(levelFor(130).current.name, 'Rally');
  assert.equal(levelFor(130).next.name, 'Ace');
  assert.equal(levelFor(130).remaining, 120);
  assert.equal(levelFor(600).current.name, 'Lenda do Pico');
  assert.equal(levelFor(9999).next, null);
  assert.equal(levelFor(9999).progress, 1);
  assert.ok(arenaLevels.every((l, i) => i === 0 || l.min > arenaLevels[i - 1].min));
});

test('check-in window is today plus six days, labelled in Portuguese', () => {
  const from = new Date('2026-11-07T15:00:00Z'); // Saturday noon in São Paulo
  const days = windowDays(from);
  assert.equal(days.length, 7);
  assert.deepEqual(days.map(d => d.day).slice(0, 3), ['2026-11-07', '2026-11-06', '2026-11-05']);
  assert.equal(dayBack(7, from), '2026-10-31');
  assert.equal(dayLabel(0, from), 'Hoje');
  assert.equal(dayLabel(1, from), 'Ontem');
  assert.equal(dayLabel(2, from), 'qui');
});

test('the window follows São Paulo midnight, not the device clock', () => {
  assert.equal(dayBack(0, new Date('2026-11-07T02:59:00Z')), '2026-11-06'); // 23:59 in São Paulo
  assert.equal(dayBack(0, new Date('2026-11-07T03:00:00Z')), '2026-11-07'); // 00:00 in São Paulo
  assert.equal(dayBack(1, new Date('2026-03-01T12:00:00Z')), '2026-02-28');
});

test('point wording and rules stay in sync with the documented policy', () => {
  assert.equal(pointsWord(1), '1 ponto');
  assert.equal(pointsWord(12), '12 pontos');
  assert.deepEqual(pointRules.map(r => r.kind), ['checkin', 'post', 'comment', 'like_given', 'like_received', 'repost']);
});
