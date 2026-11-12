/* Lift: the app's rules, kept apart from the screen so they can be tested on the Mac (bun test/logic.test.js).
   Content comes from the sealed data.json (written each morning from the vault); "local" sessions are the ones
   this phone logged that the content does not list yet. */
(function (root) {
  'use strict';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromKey(k) { var a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2], 12); }
  /* The gym day starts at 04:00: a session that runs past midnight belongs to the evening it started. */
  function todayKey(now) { return keyOf(new Date((now || Date.now()) - 4 * 3600e3)); }
  function addDays(k, n) { var d = fromKey(k); d.setDate(d.getDate() + n); return keyOf(d); }
  function dayLabel(k) { var d = fromKey(k); return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function longLabel(k) { return dayLabel(k) + ' ' + fromKey(k).getFullYear(); }

  function sessionKey(c, k) {
    if (c.days && c.days[k]) return c.days[k].s;
    var p = c.plan;
    if (Object.prototype.hasOwnProperty.call(p.dates || {}, k)) return p.dates[k];
    return p.weekdays[String(fromKey(k).getDay())];
  }
  function stageOf(c, k) {
    if (c.days && c.days[k] && c.days[k].stage) return c.days[k].stage;
    var st = c.plan.stages || [];
    for (var i = 0; i < st.length; i++) if (st[i].from <= k && k <= st[i].to) return st[i];
    return null;
  }
  function setCount(ex, stage) { return stage && stage.sets ? Math.min(stage.sets, ex.sets) : ex.sets; }
  function isSide(ex, choice) {
    if (ex.sideChoices) return ex.sideChoices.indexOf(choice || ex.choices[0]) >= 0;
    return !!ex.side;
  }
  function isBody(ex, choice) {
    if (!ex.body) return false;
    return ex.body.indexOf('*') >= 0 || ex.body.indexOf(choice || (ex.choices && ex.choices[0])) >= 0;
  }
  function repsOf(s) { return s.r != null ? s.r : Math.min(s.l, s.rr); }

  /* Every session of one exercise, newest first: the content's history plus this phone's sessions that the
     content does not list yet (marked local). A choice narrows it when that choice has any history. */
  function historyOf(c, locals, exId, choice) {
    var list = ((c.history || {})[exId] || []).map(function (h) { return { date: h.date, choice: h.choice, sets: h.sets, note: h.note, local: false }; });
    var logged = c.logged || [];
    (locals || []).forEach(function (s) {
      if (logged.indexOf(s.date) >= 0) return;
      var e = s.ex && s.ex[exId];
      if (!e) return;
      var sets = (e.sets || []).filter(function (x) { return x.done; }).map(function (x) {
        return x.l != null ? { w: x.w, l: x.l, rr: x.rr } : { w: x.w, r: x.r };
      });
      if (sets.length) list.push({ date: s.date, choice: e.choice, sets: sets, note: e.note, local: true, sent: !!s.sent });
    });
    list.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    if (choice) {
      var same = list.filter(function (h) { return !h.choice || h.choice === choice; });
      if (same.length) return same;
    }
    return list;
  }

  /* The phone's own rule, used when the phone holds a newer session than the morning's content (plan, "Coach line"). */
  function fallback(ex, last) {
    if (!last || !last.sets.length) return null;
    var lo = ex.reps[0], hi = ex.reps[1], sets = last.sets;
    var reps = sets.map(repsOf), ws = sets.map(function (s) { return s.w; });
    var one = ws.every(function (w) { return w === ws[0]; });
    var heavy = Math.max.apply(null, ws), lastW = ws[ws.length - 1];
    var step = ex.step || 2.5;
    if (one && reps.every(function (r) { return r >= hi; })) return { start: round(heavy + step), coach: 'Add the smallest step: every set reached ' + hi + '.', rule: 'up' };
    if (Math.max.apply(null, reps) < lo * 0.7) return { start: Math.max(0, round(lastW - step)), coach: 'Too heavy for this range: go lighter.', rule: 'down' };
    if (reps.some(function (r) { return r < lo; })) return { start: heavy, coach: 'Stay at this weight until every set reaches ' + lo + '.', rule: 'stay' };
    return { start: heavy, coach: 'Same weight, more reps.', rule: 'more' };
  }
  function round(x) { return Math.round(x * 4) / 4; }

  /* What one exercise card shows on a day: choice, target, prefill, last time and the coach line. */
  function cardFor(c, locals, sKey, ex, k, picked) {
    var g = (c.coach || {})[sKey + ':' + ex.id] || {};
    var choice = picked || g.choice || (ex.choices ? ex.choices[0] : null);
    var hist = historyOf(c, locals, ex.id, ex.choices ? choice : null).filter(function (h) { return h.date < k; });
    var last = hist[0] || null;
    var fromPhone = last && last.local;
    var fb = fallback(ex, last);
    var coach, start, reps, own = false;
    if (g.coach && !fromPhone) { coach = g.coach; start = g.start; reps = g.reps; }
    else if (fb) { coach = fb.coach; start = fb.start; own = true; }
    else { coach = last ? '' : 'First time: pick a weight you could lift a few more times than the reps.'; }
    if (start == null && last) start = last.sets[0].w;
    if (reps == null) reps = last ? repsOf(last.sets[0]) : ex.reps[0];
    reps = Math.max(1, Math.min(reps, ex.reps[1]));
    return { choice: choice, last: last, coach: coach, own: own, start: start == null ? (isBody(ex, choice) ? 0 : null) : start, reps: reps };
  }

  /* ---------- the report: a fixed form the Telegram bot and the morning run read ---------- */
  function kg(w) { return w === 0 ? 'bodyweight' : w + ' kg'; }
  function setsText(sets, side) {
    var groups = [];
    sets.forEach(function (s) {
      var g = groups[groups.length - 1];
      if (!g || g.w !== s.w) groups.push(g = { w: s.w, list: [] });
      g.list.push(s);
    });
    return groups.map(function (g, i) {
      var pre = i ? 'then ' : '';
      if (side) return pre + kg(g.w) + ': left ' + g.list.map(function (s) { return s.l; }).join(', ') + ', right ' + g.list.map(function (s) { return s.rr; }).join(', ');
      return pre + kg(g.w) + ' x ' + g.list.map(function (s) { return s.r; }).join(', ');
    }).join('; ');
  }
  function hm(ms) { var d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function report(c, sess) {
    var p = c.plan.sessions[sess.s], stage = stageOf(c, sess.date);
    var out = ['Gym log', p.name + ', ' + longLabel(sess.date) + (sess.start ? ', ' + hm(sess.start) + ' to ' + hm(sess.end || Date.now()) : '')];
    if (stage) out.push('Stage: ' + stage.name.toLowerCase() + ' (' + stage.rule.charAt(0).toLowerCase() + stage.rule.slice(1) + ')');
    var n = 0, notes = [];
    p.ex.forEach(function (ex, i) {
      var e = sess.ex[ex.id];
      if (!e) return;
      var done = (e.sets || []).filter(function (s) { return s.done; });
      var name = ex.name + (ex.choices ? ', ' + e.choice.toLowerCase() : '');
      if (done.length) { n++; out.push((i + 1) + '. ' + name + ': ' + setsText(done, done[0].l != null)); }
      if (e.note) notes.push(ex.name + ': ' + e.note.trim());
      if (e.pain) notes.push(ex.name + ': pain flagged');
    });
    p.ex.forEach(function (ex) { var e = sess.ex[ex.id]; if (!e || !(e.sets || []).some(function (s) { return s.done; })) out.push('Skipped: ' + ex.name); });
    if (sess.note) notes.push(sess.note.trim());
    if (notes.length) out.push('Notes: ' + notes.join('. '));
    return out.join('\n');
  }

  root.LiftLogic = {
    todayKey: todayKey, addDays: addDays, dayLabel: dayLabel, longLabel: longLabel, keyOf: keyOf, fromKey: fromKey,
    sessionKey: sessionKey, stageOf: stageOf, setCount: setCount, isSide: isSide, isBody: isBody,
    historyOf: historyOf, fallback: fallback, cardFor: cardFor, report: report, setsText: setsText, repsOf: repsOf
  };
})(typeof window !== 'undefined' ? window : globalThis);
