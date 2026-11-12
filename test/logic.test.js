// bun test test/  (content from the vault's lift-build.py, sample of 11 Nov: LIFT_CONTENT=<path>)
import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
await import('../logic.js');
const L = globalThis.LiftLogic;
const c = JSON.parse(readFileSync(process.env.LIFT_CONTENT, 'utf8'));
const pushA = c.plan.sessions.pushA;
const card = (cc, locals, id) => L.cardFor(cc, locals, 'pushA', pushA.ex.find(e => e.id === id), '2026-11-16');

test('weekday map and first week', () => {
  expect(L.sessionKey(c, '2026-11-12')).toBe('pullA');
  expect(L.sessionKey(c, '2026-11-14')).toBe(null);
  expect(L.sessionKey(c, '2026-11-16')).toBe('pushA');
  expect(L.sessionKey(c, '2026-11-26')).toBe('pushB');   // beyond the 7 days: plan map
  expect(L.setCount(pushA.ex[2], L.stageOf(c, '2026-11-12'))).toBe(2);
  expect(L.setCount(pushA.ex[2], L.stageOf(c, '2026-11-16'))).toBe(4);
});

for (const [label, cc, locals] of (() => {
  // the phone's fallback: content without that history, the 11 Nov session held only on the phone
  const bare = JSON.parse(JSON.stringify(c)); bare.history = {}; bare.coach = {}; bare.logged = [];
  const sess = { date: '2026-11-11', s: 'pushA', ex: {} };
  for (const [id, h] of Object.entries(c.history)) sess.ex[id] = { choice: id === 'chest-fly' ? 'Pec deck' : id === 'shoulder-press' ? 'Dumbbells' : undefined, sets: h[0].sets.map(s => ({ ...s, done: true })) };
  return [['morning run', c, []], ['phone fallback', bare, [sess]]];
})()) {
  test(`next Push A from 11 Nov: ${label}`, () => {
    expect(card(cc, locals, 'chest-fly').start).toBeGreaterThan(25);
    expect(card(cc, locals, 'triceps-pushdown').start).toBeGreaterThan(20);
    expect(card(cc, locals, 'cable-lateral').start).toBeLessThan(10);
    expect(card(cc, locals, 'db-lateral').start).toBeLessThan(5);
    expect(card(cc, locals, 'incline-db-press').start).toBe(10);
    expect(card(cc, locals, 'cable-lateral').last.date).toBe('2026-11-11');
  });
}

test('report form', () => {
  const s = { date: '2026-11-16', s: 'pushA', start: new Date(2026, 10, 16, 21, 5).getTime(), end: new Date(2026, 10, 16, 22, 12).getTime(), ex: {
    'shoulder-press': { choice: 'Machine', sets: [{ w: 15, r: 8, done: true }, { w: 15, r: 7, done: true }, { w: 10, r: 9, done: true }, { w: 10, r: 1, done: false }] },
    'cable-lateral': { sets: [{ w: 5, l: 12, rr: 13, done: true }, { w: 5, l: 11, rr: 12, done: true }], note: 'machine taken at first' },
  } };
  const t = L.report(c, s);
  console.log(t);
  expect(t).toContain('Gym log\nPush A, Mon 16 Nov 2026, 21:05 to 22:12');
  expect(t).toContain('1. Seated shoulder press, machine: 15 kg x 8, 7; then 10 kg x 9');
  expect(t).toContain('3. Cable lateral raise, one arm: 5 kg: left 12, 11, right 13, 12');
  expect(t).toContain('Skipped: Chest fly');
});
