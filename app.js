/* Lift: the screens. Rules live in logic.js; the look in style.css (design/DESIGN.md, look B).
   Storage (this phone only): lift.data = the last content file, lift.sessions = sessions logged here,
   lift.timer = the running rest timer. Nothing is sent anywhere except the report he sends to Telegram himself. */
(function () {
  'use strict';
  var L = window.LiftLogic;
  var $ = function (id) { return document.getElementById(id); };
  var K = { data: 'lift.data', sess: 'lift.sessions', timer: 'lift.timer' };
  function rd(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(id) { return '<svg class="i"><use href="#' + id + '"/></svg>'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(ms) { var d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function num(w) { return String(Math.round(w * 100) / 100); }

  var C = rd(K.data);                 // content
  var S = rd(K.sess) || {};           // sessions on this phone, by "date|session"
  var T = rd(K.timer);                // {end, total}
  var view = { tab: 'today', day: L.todayKey() };
  var manual = null;                  // a set he tapped open: {ex, i}
  var editing = null;                 // a stepper value being typed: {ex, i, f}
  var noteOpen = {};

  /* ---------- sessions ---------- */
  function today() { return L.todayKey(); }
  function locals() { return Object.keys(S).map(function (k) { return S[k]; }); }
  function sessFor(sKey) { var k = today() + '|' + sKey; return S[k] || { date: today(), s: sKey, ex: {} }; }
  function save(rec) {
    S[rec.date + '|' + rec.s] = rec;
    var keep = L.addDays(today(), -90);
    Object.keys(S).forEach(function (k) { if (S[k].date < keep) delete S[k]; });
    wr(K.sess, S);
  }
  function exList(sKey) { return C.plan.sessions[sKey].ex; }
  function stage() { return L.stageOf(C, view.day); }

  /* An exercise's entry: what he logged, or the prefill from the morning content (kept unsaved until he acts). */
  function entry(rec, sKey, ex, pickedChoice) {
    var e = rec.ex[ex.id];
    if (e && !pickedChoice) return e;
    var card = L.cardFor(C, locals(), sKey, ex, today(), pickedChoice || (e && e.choice));
    var side = L.isSide(ex, card.choice), n = L.setCount(ex, stage());
    var w = card.start == null ? 0 : card.start;
    var sets = [];
    for (var i = 0; i < n; i++) sets.push(side ? { w: w, l: card.reps, rr: card.reps, done: false } : { w: w, r: card.reps, done: false });
    return { choice: card.choice, sets: sets, note: e ? e.note : '', pain: e ? e.pain : false, fresh: true };
  }
  function touch(rec, ex, e) { delete e.fresh; rec.ex[ex.id] = e; return e; }

  function openSet(rec, sKey) {
    var list = exList(sKey);
    if (manual) return manual;
    for (var x = 0; x < list.length; x++) {
      var e = entry(rec, sKey, list[x]);
      for (var i = 0; i < e.sets.length; i++) if (!e.sets[i].done) return { ex: list[x].id, i: i };
    }
    return null;
  }

  /* ---------- header text ---------- */
  function updatedText() {
    if (!C || !C.written) return { t: 'No update yet', old: true };
    var w = new Date(C.written), wk = L.keyOf(w), t = L.keyOf(new Date());
    if (wk === t) return { t: 'Updated today, ' + hm(w), old: false };
    if (wk === L.addDays(t, -1)) return { t: 'Updated yesterday, ' + hm(w), old: false };
    return { t: 'Last update: ' + L.dayLabel(wk), old: true };
  }
  function lastText(h) {
    var side = h.sets[0].l != null;
    return esc(L.setsText(h.sets, side).replace(/ x /g, ' × ').replace(/; then /g, ', then '));
  }

  /* ---------- Today ---------- */
  function weekStrip() {
    var d = L.fromKey(view.day), dow = (d.getDay() + 6) % 7, mon = L.addDays(view.day, -dow), h = '';
    for (var i = 0; i < 7; i++) {
      var k = L.addDays(mon, i), s = L.sessionKey(C, k), name = s ? C.plan.sessions[s].name : 'Rest';
      h += '<a class="day' + (k === view.day ? ' on' : '') + (s ? '' : ' rest') + '" data-day="' + k + '"><b>' + L.dayLabel(k).slice(0, 3) + '</b><span>' + esc(name) + '</span></a>';
    }
    return '<nav class="week" aria-label="Day">' + h + '</nav>';
  }
  function cue(start, last) {
    if (!last || start == null) return '';
    var top = Math.max.apply(null, last.sets.map(function (s) { return s.w; }));
    var k = start > top ? 'up' : start < top ? 'down' : 'same';
    return '<span class="cue ' + k + '">' + ic(k) + '</span>';
  }
  function valHTML(s, body) {
    var w = body && s.w === 0 ? 'Body' : num(s.w) + '<small>kg</small>';
    if (s.l != null) return '<span class="val">' + w + '<span class="lr">Left</span>' + s.l + '<span class="lr">Right</span>' + s.rr + '</span>';
    return '<span class="val">' + w + '<span class="x">×</span>' + s.r + '</span>';
  }
  function stepper(exId, i, f, v, cap, wide) {
    var shown = editing && editing.ex === exId && editing.i === i && editing.f === f
      ? '<input id="edit" inputmode="decimal" enterkeyhint="done" value="' + esc(num(v)) + '" aria-label="' + cap + '">'
      : '<b data-act="edit" data-ex="' + exId + '" data-i="' + i + '" data-f="' + f + '">' + (f === 'w' && cap === 'Body' && v === 0 ? 'Body' : num(v)) + '</b>';
    return '<div class="stepper' + (wide ? ' wide' : '') + '"><button class="rb" type="button" data-act="dec" data-ex="' + exId + '" data-i="' + i + '" data-f="' + f + '" aria-label="Less ' + cap + '">' + ic('minus') +
      '</button><output>' + shown + '<small>' + (cap === 'Body' ? 'kg added' : cap) + '</small></output><button class="rb" type="button" data-act="inc" data-ex="' + exId + '" data-i="' + i + '" data-f="' + f + '" aria-label="More ' + cap + '">' + ic('plus') + '</button></div>';
  }
  function exCard(rec, sKey, ex, n, open) {
    var e = entry(rec, sKey, ex);
    var card = L.cardFor(C, locals(), sKey, ex, today(), e.choice);
    var body = L.isBody(ex, e.choice), side = e.sets.length && e.sets[0].l != null;
    var isNow = open && open.ex === ex.id;
    var done = e.sets.filter(function (s) { return s.done; }).length;
    var h = '<article class="card ex' + (isNow ? ' now' : '') + (done && done === e.sets.length ? ' complete' : '') + '" id="ex-' + ex.id + '">';
    h += '<div class="ex-head"><span class="num">' + (done && done === e.sets.length ? ic('check') : n) + '</span><h2 class="ex-name">' + esc(ex.name) + '</h2></div>';
    h += '<div class="sub-row"><span class="target">' + ex.sets + ' × ' + ex.reps[0] + '-' + ex.reps[1] + '</span>';
    if (ex.choices) {
      h += '<div class="seg">' + ex.choices.map(function (c) { return '<button type="button" class="' + (c === e.choice ? 'on' : '') + '" data-act="choice" data-ex="' + ex.id + '" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    } else if (ex.star) h += '<span class="pill star">' + ic('star') + 'Side delts</span>';
    h += '</div>';
    if (ex.choices && ex.star) h += '<div class="sub-row"><span class="pill star" style="margin-left:0">' + ic('star') + 'Side delts</span></div>';
    if (card.last) h += '<p class="last"><span>Last, ' + L.dayLabel(card.last.date) + '</span>' + lastText(card.last) + (card.last.local ? '<em>on this phone</em>' : '') + '</p>';
    if (card.coach) h += '<p class="coach">' + cue(card.start, card.last) + '<span>' + esc(card.coach) + (card.own ? '<span class="own">The app\'s own rule: the morning update has not seen this yet.</span>' : '') + '</span></p>';
    if (ex.knee) h += '<p class="last"><span>Knee</span>Light and slow. Drop it if the spot below the kneecap hurts.</p>';
    h += '<div class="sets">';
    e.sets.forEach(function (s, i) {
      if (isNow && open.i === i) {
        h += '<div class="open"><span class="tag">Set ' + (i + 1) + '</span><div class="steps' + (side ? ' lr' : '') + '">' +
          stepper(ex.id, i, 'w', s.w, body ? 'Body' : 'kg', side) +
          (side ? stepper(ex.id, i, 'l', s.l, 'Left') + stepper(ex.id, i, 'rr', s.rr, 'Right') : stepper(ex.id, i, 'r', s.r, 'reps')) +
          '</div><button class="btn go" type="button" data-act="done" data-ex="' + ex.id + '" data-i="' + i + '">' + ic('check') + (s.done ? 'Save' : 'Done') + '</button></div>';
      } else {
        h += '<div class="row ' + (s.done ? 'done' : 'todo') + '" data-act="open" data-ex="' + ex.id + '" data-i="' + i + '"><span class="disc">' + (s.done ? ic('check') : i + 1) + '</span>' + valHTML(s, body) + (s.done ? '<span class="side">Set ' + (i + 1) + '</span>' : '') + '</div>';
      }
    });
    h += '</div>';
    if (e.note && !noteOpen[ex.id]) h += '<p class="note-box">' + esc(e.note) + '</p>';
    if (noteOpen[ex.id]) h += '<div class="note-box"><textarea id="note-' + ex.id + '" data-ex="' + ex.id + '" rows="1" placeholder="Machine taken, too light, ...">' + esc(e.note || '') + '</textarea></div>';
    h += '<div class="ex-foot"><div class="setcount"><button class="rb sm" type="button" data-act="less" data-ex="' + ex.id + '" aria-label="Remove set">' + ic('minus') + '</button><span>' + e.sets.length + ' set' + (e.sets.length === 1 ? '' : 's') + '</span><button class="rb sm" type="button" data-act="more" data-ex="' + ex.id + '" aria-label="Add set">' + ic('plus') + '</button></div>' +
      '<button class="mini-btn' + (e.note ? ' on' : '') + '" type="button" data-act="note" data-ex="' + ex.id + '">' + ic('pen') + 'Note</button>' +
      '<button class="mini-btn pain' + (e.pain ? ' on' : '') + '" type="button" data-act="pain" data-ex="' + ex.id + '" aria-pressed="' + !!e.pain + '">' + ic('flag') + 'Pain</button></div>';
    return h + '</article>';
  }
  function todayHTML() {
    var sKey = L.sessionKey(C, view.day), s = sKey && C.plan.sessions[sKey], u = updatedText(), st = stage();
    var h = '<section class="head"><div class="top"><div><h1>' + esc(s ? s.name : 'Rest day') + '</h1><p class="sub">' + esc(s ? s.sub : 'Off') + '</p></div>' +
      '<div class="when' + (u.old ? ' old' : '') + '"><b>' + L.dayLabel(view.day) + '</b><span><i class="dot"></i>' + esc(u.t) + '</span></div></div>' + weekStrip();
    var note = C.days && C.days[view.day] && C.days[view.day].note;
    var brief = '';
    if (st) brief += '<p class="stage">' + ic('gauge') + '<span><b>This week:</b> ' + esc(st.rule.charAt(0).toLowerCase() + st.rule.slice(1)) + '</span></p>';
    if (note) brief += '<p class="daynote">' + esc(note) + '</p>';
    if (sKey && view.day !== today()) brief += '<p class="asof">Sets you log here count for today, ' + L.dayLabel(today()) + '.</p>';
    if (sKey && C.days && !C.days[view.day]) brief += '<p class="asof">No morning update covers this day. Weights come from last time.</p>';
    if (brief) h += '<div class="card brief">' + brief + '</div>';
    h += '</section>';
    if (!sKey) return h + '<div class="card restday"><h2>Rest</h2><p>Nothing on the plan today. Missed a session this week? Tap its day above and log it: it counts for today.</p></div>';
    var rec = sessFor(sKey), open = openSet(rec, sKey);
    if (rec.sent) {
      var inVault = (C.logged || []).indexOf(rec.date) >= 0;
      h += '<div class="card sentcard"><span class="disc">' + ic('check') + '</span><span>' + (inVault ? 'In the vault. The morning update has read this session.' : 'Sent to the bot at ' + hm(rec.sentAt) + '. Not in the vault yet: the next morning update reads it.') + '</span></div>';
    }
    exList(sKey).forEach(function (ex, i) { h += exCard(rec, sKey, ex, i + 1, open); });
    return h;
  }

  /* ---------- Plan, History, Settings ---------- */
  function planHTML() {
    var p = C.plan, t = today(), names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var h = '<section class="screen"><h1 class="title">Plan</h1><p class="lede">The gym plan in the vault, as the morning update last copied it.</p>';
    h += '<div class="card block"><h2>Stages</h2><ul class="plist">' + p.stages.map(function (s) {
      var now = s.from <= t && t <= s.to;
      return '<li><span>' + (now ? '<b style="color:var(--accent-text)">Now: </b>' : '') + esc(s.rule) + '</span><b>' + L.dayLabel(s.from).slice(4) + ' to ' + L.dayLabel(s.to).slice(4) + '</b></li>';
    }).join('') + '</ul></div>';
    [1, 2, 3, 4, 5, 6].forEach(function (d) {
      var k = p.weekdays[String(d)], s = p.sessions[k];
      h += '<div class="card block"><h2>' + esc(s.name) + '<small>' + names[d] + ', ' + esc(s.sub.toLowerCase()) + '</small></h2><ul class="plist">' + s.ex.map(function (ex) {
        return '<li><span>' + (ex.star ? '<span class="star">★ </span>' : '') + esc(ex.name) + (ex.choices ? ' <span style="color:var(--muted)">(' + esc(ex.choices.join(' or ')) + ')</span>' : '') + '</span><b>' + ex.sets + ' × ' + ex.reps[0] + '-' + ex.reps[1] + '</b></li>';
      }).join('') + '</ul></div>';
    });
    h += '<div class="card block"><h2>Rules</h2><ul class="plist"><li><span>When every set reaches the top of its range, add the smallest step next time.</span></li><li><span>Rest 2 to 3 minutes on the first two exercises, 60 to 90 seconds on the rest.</span></li><li><span>Leg extension light and slow for the knee.</span></li><li><span>Sunday off.</span></li></ul></div>';
    return h + '</section>';
  }
  function historyHTML() {
    var h = '<section class="screen"><h1 class="title">History</h1><p class="lede">From the vault, plus sessions on this phone the vault has not read yet.</p>';
    var mine = locals().filter(function (r) { return Object.keys(r.ex).some(function (k) { return r.ex[k].sets.some(function (s) { return s.done; }); }); })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var logged = C.logged || [];
    if (mine.length) {
      h += '<div class="card block"><h2>On this phone</h2><ul class="hlist">' + mine.slice(0, 8).map(function (r) {
        var inV = logged.indexOf(r.date) >= 0;
        return '<li>' + esc(C.plan.sessions[r.s].name) + ', ' + L.dayLabel(r.date) + '<span>' + (inV ? 'In the vault' : r.sent ? '<i>Sent, not in the vault yet</i>' : '<i>Not sent</i>') + '</span>' +
          (inV ? '' : '<button class="btn plain" type="button" data-act="resend" data-k="' + esc(r.date + '|' + r.s) + '">' + (r.sent ? 'Send again' : 'Send') + '</button>') + '</li>';
      }).join('') + '</ul></div>';
    }
    var seen = {};
    [1, 2, 3, 4, 5, 6].forEach(function (d) {
      var k = C.plan.weekdays[String(d)];
      C.plan.sessions[k].ex.forEach(function (ex) {
        if (seen[ex.id]) return;
        seen[ex.id] = 1;
        var list = L.historyOf(C, locals(), ex.id, null).slice(0, 5);
        h += '<div class="card block"><h2>' + esc(ex.name) + '</h2>' + (list.length ? '<ul class="hlist">' + list.map(function (x) {
          return '<li>' + lastText(x) + '<span>' + L.dayLabel(x.date) + (x.choice ? ', ' + esc(x.choice.toLowerCase()) : '') + (x.local ? ', <i>on this phone</i>' : '') + (x.note ? '. ' + esc(x.note) : '') + '</span></li>';
        }).join('') + '</ul>' : '<p class="empty">Not done yet.</p>') + '</div>';
      });
    });
    return h + '</section>';
  }
  function settingsHTML() {
    var u = updatedText(), standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
    var h = '<section class="screen"><h1 class="title">Settings</h1>';
    h += '<div class="card block"><h2>Morning update</h2><div class="kv"><span>Content</span><b>' + esc(u.t) + '</b></div><div class="kv"><span>Covers</span><b>' + (C.from ? L.dayLabel(C.from) + ' to ' + L.dayLabel(L.addDays(C.from, 6)) : 'nothing yet') + '</b></div>' +
      '<button class="btn plain" type="button" data-act="refresh">Check for an update</button></div>';
    h += '<div class="card block"><h2>Today\'s session</h2><p class="empty">Wipes the sets logged on this phone today. Sessions already in the vault stay there.</p><button class="btn plain" type="button" data-act="wipe">Clear today\'s sets</button></div>';
    if (!standalone) h += '<div class="card block"><h2>Install</h2><p class="empty">In Safari: Share, then Add to Home Screen. Open Lift from that icon: it then works with no signal. A Private tab forgets your sets.</p></div>';
    return h + '<p class="lede" style="padding-bottom:8px">Lift, made for Arda. Sends nothing by itself: only the report you send to Telegram.</p></section>';
  }

  /* ---------- render ---------- */
  function render(keepScroll) {
    var y = window.scrollY;
    if (!C) { $('main').innerHTML = '<section class="screen"><h1 class="title">Lift</h1><p class="lede">Loading the plan. The first open needs a connection.</p></section>'; return; }
    var t = view.tab;
    $('main').innerHTML = t === 'plan' ? planHTML() : t === 'history' ? historyHTML() : t === 'settings' ? settingsHTML() : todayHTML();
    [].forEach.call(document.querySelectorAll('.tab'), function (a) { a.classList.toggle('on', a.dataset.tab === t); });
    if (keepScroll) window.scrollTo(0, y);
    var ed = $('edit');
    if (ed) { ed.focus(); ed.select(); }
    Object.keys(noteOpen).forEach(function (id) { var n = $('note-' + id); if (n) { n.focus(); grow(n); } });
    dock();
    mini();
  }
  function grow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
  function mini() {
    var on = view.tab === 'today' && window.scrollY > 90;
    document.documentElement.classList.toggle('scrolled', on);
    if (!on || !C) return;
    var sKey = L.sessionKey(C, view.day), c = counts(sKey);
    $('mini-l').textContent = L.dayLabel(view.day);
    $('mini-c').textContent = sKey ? C.plan.sessions[sKey].name : 'Rest';
    $('mini-r').textContent = sKey ? c.done + ' of ' + c.all + ' sets' : '';
  }
  function counts(sKey) {
    var r = { done: 0, all: 0 };
    if (!sKey) return r;
    var rec = sessFor(sKey);
    exList(sKey).forEach(function (ex) { entry(rec, sKey, ex).sets.forEach(function (s) { r.all++; if (s.done) r.done++; }); });
    return r;
  }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function dock() {
    if (!C) return;
    var left = T ? (T.end - Date.now()) / 1000 : 0, ring = $('ring');
    if (T && left > 0) {
      $('dock-s').textContent = 'Rest';
      $('dock-t').innerHTML = fmt(left) + '<small>of ' + fmt(T.total) + '</small>';
      ring.setAttribute('stroke-dasharray', (110 * left / T.total).toFixed(1) + ' 110');
    } else {
      var c = counts(L.sessionKey(C, view.day));
      $('dock-s').textContent = T && left > -60 ? 'Rest over' : 'Sets';
      $('dock-t').innerHTML = c.done + '<small>of ' + c.all + '</small>';
      ring.setAttribute('stroke-dasharray', (c.all ? 110 * c.done / c.all : 0).toFixed(1) + ' 110');
    }
  }
  setInterval(function () { if (T) dock(); }, 250);

  /* ---------- actions ---------- */
  function find(exId) {
    var sKey = L.sessionKey(C, view.day), rec = sessFor(sKey);
    var ex = exList(sKey).filter(function (x) { return x.id === exId; })[0];
    return { sKey: sKey, rec: rec, ex: ex, e: entry(rec, sKey, ex) };
  }
  function bump(f, d, exId, i) {
    var o = find(exId), s = o.e.sets[i];
    if (f === 'w') s.w = Math.max(0, Math.round((s.w + d * (o.ex.step || 2.5)) * 100) / 100);
    else s[f] = Math.max(0, s[f] + d);
    s.touched = true;
    touch(o.rec, o.ex, o.e); save(o.rec); render(true);
  }
  function setDone(exId, i) {
    var o = find(exId), s = o.e.sets[i], now = Date.now(), wasDone = s.done;
    s.done = true;
    for (var j = i + 1; j < o.e.sets.length; j++) if (!o.e.sets[j].done && !o.e.sets[j].touched) { o.e.sets[j].w = s.w; }
    o.rec.start = o.rec.start || now;
    o.rec.end = now;
    touch(o.rec, o.ex, o.e); save(o.rec);
    manual = null;
    if (!wasDone) {
      var idx = exList(o.sKey).indexOf(o.ex);
      T = { end: now + (idx < 2 ? C.plan.rest.first : C.plan.rest.other) * 1000, total: idx < 2 ? C.plan.rest.first : C.plan.rest.other };
      wr(K.timer, T);
    }
    render(true);
    var next = openSet(o.rec, o.sKey);
    if (next && next.ex !== exId) { var el = $('ex-' + next.ex); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  function commitEdit() {
    var inp = $('edit');
    if (!inp || !editing) return;
    var v = parseFloat(String(inp.value).replace(',', '.')), o = find(editing.ex), s = o.e.sets[editing.i];
    if (!isNaN(v) && v >= 0 && v < 1000) { s[editing.f] = editing.f === 'w' ? Math.round(v * 100) / 100 : Math.round(v); s.touched = true; touch(o.rec, o.ex, o.e); save(o.rec); }
    editing = null;
    render(true);
  }

  $('main').addEventListener('click', function (ev) {
    var day = ev.target.closest('[data-day]');
    if (day) { view.day = day.dataset.day; manual = null; render(); window.scrollTo(0, 0); return; }
    var a = ev.target.closest('[data-act]');
    if (!a) return;
    var act = a.dataset.act, exId = a.dataset.ex, i = +a.dataset.i, o;
    if (editing && act !== 'edit') commitEdit();
    if (act === 'inc' || act === 'dec') bump(a.dataset.f, act === 'inc' ? 1 : -1, exId, i);
    else if (act === 'done') setDone(exId, i);
    else if (act === 'open') { manual = { ex: exId, i: i }; render(true); }
    else if (act === 'edit') { editing = { ex: exId, i: i, f: a.dataset.f }; render(true); }
    else if (act === 'choice') {
      o = find(exId);
      var hasDone = o.e.sets.some(function (s) { return s.done; });
      var ne = hasDone ? o.e : entry(o.rec, o.sKey, o.ex, a.dataset.c);
      ne.choice = a.dataset.c;
      if (!hasDone) { ne.sets = (function () { var side = L.isSide(o.ex, a.dataset.c); return ne.sets.map(function (s) { return side ? { w: s.w, l: s.r != null ? s.r : s.l, rr: s.r != null ? s.r : s.rr, done: false } : { w: s.w, r: s.r != null ? s.r : s.l, done: false }; }); })(); }
      touch(o.rec, o.ex, ne); save(o.rec); render(true);
    } else if (act === 'more') {
      o = find(exId);
      var last = o.e.sets[o.e.sets.length - 1] || { w: 0, r: o.ex.reps[0] };
      var add = last.l != null ? { w: last.w, l: last.l, rr: last.rr, done: false } : { w: last.w, r: last.r, done: false };
      o.e.sets.push(add); touch(o.rec, o.ex, o.e); save(o.rec); render(true);
    } else if (act === 'less') {
      o = find(exId);
      for (var j = o.e.sets.length - 1; j >= 0; j--) if (!o.e.sets[j].done) { o.e.sets.splice(j, 1); break; }
      if (manual && manual.ex === exId) manual = null;
      touch(o.rec, o.ex, o.e); save(o.rec); render(true);
    } else if (act === 'note') { noteOpen[exId] = !noteOpen[exId]; render(true); }
    else if (act === 'pain') { o = find(exId); o.e.pain = !o.e.pain; touch(o.rec, o.ex, o.e); save(o.rec); render(true); }
    else if (act === 'refresh') { load(true); }
    else if (act === 'wipe') {
      if (!confirm('Clear the sets logged on this phone today?')) return;
      Object.keys(S).forEach(function (k) { if (S[k].date === today()) delete S[k]; });
      wr(K.sess, S); T = null; wr(K.timer, null); render();
    } else if (act === 'resend') { finishSheet(S[a.dataset.k]); }
  });
  $('main').addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.tagName === 'TEXTAREA' && t.dataset.ex) { grow(t); var o = find(t.dataset.ex); o.e.note = t.value; touch(o.rec, o.ex, o.e); save(o.rec); }
  });
  $('main').addEventListener('focusout', function (ev) {
    if (ev.target.id === 'edit') setTimeout(commitEdit, 0);
    if (ev.target.tagName === 'TEXTAREA' && ev.target.dataset.ex) { var id = ev.target.dataset.ex; setTimeout(function () { if (noteOpen[id]) { noteOpen[id] = false; render(true); } }, 150); }
  });
  $('main').addEventListener('keydown', function (ev) { if (ev.target.id === 'edit' && ev.key === 'Enter') { ev.preventDefault(); commitEdit(); } });
  $('tabs').addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-tab]');
    if (!a) return;
    if (a.dataset.tab === 'today' && view.tab === 'today') view.day = today();
    view.tab = a.dataset.tab; render(); window.scrollTo(0, 0);
  });
  window.addEventListener('scroll', mini, { passive: true });

  /* ---------- finish and send ---------- */
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }
  function closeSheet() { $('layer').innerHTML = ''; }
  function finishSheet(rec) {
    var sKey = L.sessionKey(C, view.day);
    rec = rec || (sKey && sessFor(sKey));
    var any = rec && Object.keys(rec.ex).some(function (k) { return rec.ex[k].sets.some(function (s) { return s.done; }); });
    var text = any ? L.report(C, rec) : '';
    var bot = C.bot || '';
    var h = '<div class="scrim" data-x="close"></div><div class="sheet" role="dialog" aria-label="Finish"><h2>' + (any ? 'Send this session' : 'Nothing logged yet') + '</h2>';
    if (any) {
      h += '<p class="sub">It goes to your Telegram bot, which writes it into the Gym Log.</p><pre>' + esc(text) + '</pre>';
      if (bot) h += '<a class="btn go" id="send" href="tg://resolve?domain=' + encodeURIComponent(bot) + '&text=' + encodeURIComponent(text) + '">' + ic('check') + 'Send to Telegram</a>';
      h += '<div class="two"><button class="btn plain" type="button" data-x="copy">Copy</button>' + (navigator.share ? '<button class="btn plain" type="button" data-x="share">Share</button>' : '<button class="btn plain" type="button" data-x="close">Close</button>') + '</div>';
      if (navigator.share) h += '<button class="btn plain" type="button" data-x="close">Back</button>';
    } else h += '<p class="sub">Tap Done on a set first.</p><button class="btn plain" type="button" data-x="close">Back</button>';
    $('layer').innerHTML = h + '</div>';
    function mark() { rec.sent = true; rec.sentAt = Date.now(); save(rec); }
    var send = $('send');
    if (send) send.addEventListener('click', function () { mark(); setTimeout(function () { closeSheet(); render(true); }, 400); });
    $('layer').onclick = function (ev) {
      var x = ev.target.closest('[data-x]');
      if (!x) return;
      if (x.dataset.x === 'close') closeSheet();
      else if (x.dataset.x === 'copy') {
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { mark(); toast('Copied. Paste it to the bot in Telegram.'); closeSheet(); render(true); }, function () { toast('Copy failed: select the text and copy it.'); });
      } else if (x.dataset.x === 'share') {
        navigator.share({ text: text }).then(function () { mark(); closeSheet(); render(true); }, function () { /* cancelled */ });
      }
    };
  }
  $('finish').addEventListener('click', function () { if (C) finishSheet(); });

  /* ---------- content: the last copy at once, a newer one behind it ---------- */
  function load(loud) {
    return fetch('data.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      if (!j || !j.plan) throw new Error('bad');
      var first = !C, changed = first || C.written !== j.written;
      C = j; wr(K.data, j);
      if (changed && !editing && !Object.keys(noteOpen).some(function (k) { return noteOpen[k]; })) render(true);
      if (first) toOpen();
      if (loud) toast(changed ? 'Updated.' : 'Already the newest.');
    }).catch(function () { if (loud) toast('No connection. Showing the last copy.'); if (!C) render(); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    if (view.day < today() && view.tab === 'today') view.day = today();
    T = rd(K.timer); render(true); load(false);
  });
  /* Reopened mid-session: bring the next set into view. */
  function toOpen() {
    if (view.tab !== 'today' || !C) return;
    var sKey = L.sessionKey(C, view.day), o = sKey && openSet(sessFor(sKey), sKey);
    var el = o && document.querySelector('#ex-' + o.ex + ' .open');
    if (el && (o.ex !== exList(sKey)[0].id || o.i > 0)) el.scrollIntoView({ block: 'center' });
  }
  render();
  toOpen();
  load(false);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
})();
