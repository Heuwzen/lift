# Lift build critique, look B (12 Nov 2026)

**Verdict.** Today is a faithful port of look B: tokens, type, lips, the open set, the dock and dark mode match the spec closely. The improvised screens (Plan, History, Settings, Finish sheet, rest day) use the same cards, type and buttons, so they read as one product; what they lack is Today's "selected" language (accent-soft fill, accent border) for "where am I". Three things break in the gym: those are [must].

**How this was checked.** The eight screenshots, style.css and app.js, plus 2x renders of the real style.css in headless Chromium with his real numbers (12.5, 22.5, 47.5, Body) and with the fixes below. Items marked (rendered) were seen working. Chromium falls back from SF Rounded to SF Pro; the digit widths are close, so the stepper collision is the same or worse on the phone.

Line numbers are as of today. Each fix quotes the old text so it can be found if lines move.

---

## 1. [must] Steppers: real weights crash into the minus and plus buttons

**Wrong.** The two steppers share the row in equal halves (`.steps{grid-template-columns:1fr 1fr}`), which leaves 49 px for the number. "12.5", "22.5" (triceps pushdown, Push A), "47.5" and "Body" (pull-ups, the first exercise of Pull A, today's session) need 56 to 72 px. Rendered with the real CSS: the number touches both circles, "Body" overlaps them, and the reps stepper is pushed 2 to 8 px out of the grey open-set panel. The mockup only showed "15" and "7", so it hid this. Two columns cannot hold a four-character weight next to 44 px buttons at 390 pt; the only way to keep them is smaller numbers, which loses legibility at arm's length.

**Why it matters.** It is the control he touches most, every set. A jammed number reads as broken, and the circles become hard to hit with a sweaty thumb.

**Fix.** Weight on its own full-width row in every exercise, reps (or Left and Right) below it. This is the one-arm layout he already has, so all exercises share one pattern. (rendered)

style.css, replace line 97 `.steps{display:grid;grid-template-columns:1fr 1fr;gap:8px}` and line 109 `.steps.lr{grid-template-columns:1fr 1fr;row-gap:10px}` with:
```css
.steps{display:grid;grid-template-columns:minmax(0,1fr);gap:10px 8px}
.steps.lr{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
```
Add `flex:none` to `.stepper .rb` (line 100) so the circles can never be squeezed. Keep `.steps.lr .wide{grid-column:1/3}`.

app.js `stepper()` (line 99), the caption reads "Body / KG ADDED" at zero, which contradicts itself. Old: `(cap === 'Body' ? 'kg added' : cap)` New: `(cap === 'Body' ? (v === 0 ? 'weight' : 'kg added') : cap)`. It then reads "Body / WEIGHT" at zero and "5 / KG ADDED" above zero.

The open set grows by 73 px; item 2 keeps DONE in view.

## 2. [must] After the last set of an exercise, the next exercise's name hides under the compact bar

**Wrong.** `setDone` scrolls the next card with `scrollIntoView({block:'start'})`, which puts the card's top edge at y 0. The compact bar is fixed there (48 px) and covers the number badge and the exercise name, exactly what he reads to walk to the next machine. Inside one exercise nothing scrolls, so each Done pushes DONE 48 px lower, toward the dock.

**Why it matters.** Five times a session he has to scroll back up to see what is next, the most annoying gesture with wet hands.

**Fix.** style.css, add:
```css
.ex,.open{scroll-margin-top:calc(var(--safe-top) + 60px)}
.open{scroll-margin-bottom:calc(var(--safe-bottom) + var(--bottom-h) + 20px)}
```
app.js, replace the whole `setDone` (lines 273 to 289) with this. The two lines marked "item 5" also stop the rest timer from starting after the very last set.
```js
  function setDone(exId, i) {
    var o = find(exId), s = o.e.sets[i], now = Date.now(), wasDone = s.done;
    s.done = true;
    for (var j = i + 1; j < o.e.sets.length; j++) if (!o.e.sets[j].done && !o.e.sets[j].touched) { o.e.sets[j].w = s.w; }
    o.rec.start = o.rec.start || now;
    o.rec.end = now;
    touch(o.rec, o.ex, o.e); save(o.rec);
    manual = null;
    var next = openSet(o.rec, o.sKey);
    if (!wasDone && next) {                                   // item 5: no rest after the last set
      var idx = exList(o.sKey).indexOf(o.ex);
      T = { end: now + (idx < 2 ? C.plan.rest.first : C.plan.rest.other) * 1000, total: idx < 2 ? C.plan.rest.first : C.plan.rest.other };
      wr(K.timer, T);
    } else if (!next) { T = null; wr(K.timer, null); }        // item 5
    render(true);
    if (next) {
      var el = next.ex !== exId ? $('ex-' + next.ex) : document.querySelector('#ex-' + exId + ' .open');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: next.ex !== exId ? 'start' : 'nearest' });
    }
  }
```
app.js `toOpen()` (line 412), so the first set of a fresh session does not sit under the dock now that the open set is taller. Old: `if (el && (o.ex !== exList(sKey)[0].id || o.i > 0)) el.scrollIntoView({ block: 'center' });` New: `if (el) el.scrollIntoView({ block: o.ex !== exList(sKey)[0].id || o.i > 0 ? 'center' : 'nearest' });`

Also: `.mini` (line 19) declares its height twice and the second one, `height:46px`, wins and ignores the safe area. Delete `height:46px;`. No visible change today (the "default" status bar gives a 0 inset), but it would break the bar if the status bar ever goes black-translucent as the spec says.

## 3. [must] "Rest over" cannot be seen from the bench

**Wrong.** When the rest ends, only the 11 px grey label changes (REST to REST OVER) and the number switches to the set count. The ring flips from countdown to set progress, so the green arc can grow at the moment it should say "go".

**Why it matters.** The timer exists to tell him when to start the next set, at arm's length or with the phone on the bench. A Home Screen web app on iPhone cannot vibrate, so colour is the only signal.

**Fix.** A solid green disc and a green label for the 60 s after the rest ends. (rendered, light and dark)
```css
.dock.over .ring svg.r circle{stroke:var(--accent)}
.dock.over .ring .ic{inset:6px;border-radius:50%;background:var(--accent);color:var(--on-accent)}
.dock.over .rest .s{color:var(--accent-text)}
```
app.js, replace `dock()` (lines 244 to 257) with this version. It also carries items 4, 5 and 7, so it is one edit.
```js
  function dock() {
    if (!C) return;
    var sKey = L.sessionKey(C, view.day), c = counts(sKey), rec = sKey && sessFor(sKey);
    var left = T ? (T.end - Date.now()) / 1000 : 0, ring = $('ring');
    var hide = !sKey && !(T && left > 0);                                   // item 7
    $('dock').hidden = hide;
    document.documentElement.style.setProperty('--bottom-h', hide ? '64px' : '130px');
    keepAwake(!!T && left > -60);                                            // item 4
    if (hide) return;
    $('dock').classList.toggle('over', !!T && left <= 0 && left > -60);
    $('finish').classList.toggle('ready', c.all > 0 && c.done === c.all && !(rec && rec.sent)); // item 5
    if (T && left > 0) {
      $('dock-s').textContent = 'Rest';
      $('dock-t').innerHTML = fmt(left) + '<small>of ' + fmt(T.total) + '</small>';
      ring.setAttribute('stroke-dasharray', (110 * left / T.total).toFixed(1) + ' 110');
    } else {
      $('dock-s').textContent = T && left > -60 ? 'Rest over' : 'Sets';
      $('dock-t').innerHTML = c.done + '<small>of ' + c.all + '</small>';
      ring.setAttribute('stroke-dasharray', (c.all ? 110 * c.done / c.all : 0).toFixed(1) + ' 110');
    }
  }
```
If item 4 is not wanted, delete the `keepAwake` line.

## 4. [nice] Keep the screen awake while he rests

**Wrong.** Nothing stops auto-lock. With a 30 s or 1 min auto-lock, the screen is dark long before a 75 or 150 s rest ends, so the timer (and item 3) is never seen without unlocking.

**Why it matters.** One glance should answer "can I go?".

**Fix.** Screen Wake Lock, only while a rest runs and for 60 s after it, so the phone still locks by itself once he stops logging. Add after `var editing = null;` (line 22):
```js
  var wake = null;
  function keepAwake(on) {
    if (!('wakeLock' in navigator)) return;
    if (on && !wake) { wake = 'asking'; navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }, function () { wake = null; }); }
    else if (!on && wake && wake.release) { wake.release(); wake = null; }
  }
```
`dock()` in item 3 calls it. iOS drops the lock when the app goes to the background; the existing `visibilitychange` handler re-renders, which calls `dock()`, which asks again.

## 5. [nice] Finish turns green when every set is done

**Wrong.** After the last Done nothing changes: Finish stays the same white button it was at the first set, and a pointless rest timer starts.

**Why it matters.** Sending the report is what puts the session in the vault and shapes tomorrow's plan; the end of the session should point at it.

**Fix.** `dock()` (item 3) toggles `ready`; `setDone` (item 2) skips the last rest. Add: (rendered)
```css
.finish.ready{background:var(--accent);border-color:var(--accent);color:var(--on-accent);box-shadow:0 var(--lip-sm) 0 var(--accent-lip)}
```
It goes back to white once the session is marked sent.

## 6. [nice] Finish sheet: four buttons on the iPhone, and the report can push them off screen

**Wrong.** The screenshot shows Send, Copy, Close because desktop Chromium has no `navigator.share`. On the iPhone it has, so the sheet shows Send, then Copy and Share side by side, then a full-width Back: four buttons and two names for leaving (Close, Back). The report box has no height limit, so a full session with notes scrolls the lower buttons out of view. The Send button carries a check, which means "done", not "send".

**Why it matters.** It is the last screen of every session, used tired. One obvious action plus one way out is enough. Share already covers Copy on iOS.

**Fix.** app.js `finishSheet()` (lines 371 to 372), replace the `two` row and the `Back` line with:
```js
      h += '<div class="two">' + (navigator.share ? '<button class="btn plain" type="button" data-x="share">Share</button>' : '<button class="btn plain" type="button" data-x="copy">Copy</button>') + '<button class="btn plain" type="button" data-x="close">Close</button></div>';
```
In the "Nothing logged yet" state (line 373) rename the button `Back` to `Close`.
style.css: `.sheet pre{max-height:34vh;overflow:auto}` (add to the existing rule).
Icon: add to the symbols in index.html
```html
<symbol id="send" viewBox="0 0 24 24"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM21.854 2.147l-10.94 10.939"/></symbol>
```
(Lucide send) and use `ic('send')` instead of `ic('check')` on the Send to Telegram link (line 370).

Note: the underline under "SEND TO TELEGRAM" in 3-finish-sheet.jpg does not reproduce with today's style.css (`.btn` has `text-decoration:none`); that screenshot is older than the fix.

## 7. [nice] Rest day: an empty dock, "rest" three times, a puzzling sentence

**Wrong.** On Sunday the dock still shows a ring, "SETS 0 of 0" and Finish, which only opens "Nothing logged yet". The header says "Rest day / Off", the strip says "Rest", the card says "Rest" again, then "Tap its day above and log it: it counts for today." A stale header reads "Last update: Thu 12 Nov" while a fresh one reads "Updated today, 05:47".

**Why it matters.** The one useful thing on a rest day is catching up on a missed session; the rest is noise.

**Fix.** `dock()` (item 3) hides the dock row when the day has no session and no rest runs; the panel then holds only the tabs.
- app.js line 139, Old: `esc(s ? s.sub : 'Off')` New: `esc(s ? s.sub : 'No gym today')`
- app.js line 149, the card becomes: `'<div class="card restday"><h2>Missed a session?</h2><p>Tap its day above to do it today.</p></div>'`
- style.css `.restday h2`: `font:800 20px/1.2 var(--ui)` (every other card title is 20).
- app.js line 67, Old: `'Last update: ' + L.dayLabel(wk)` New: `'Updated ' + L.dayLabel(wk)` (also fixes the Settings row).

## 8. [nice] History: the rescue button is the quiet one

**Wrong.** An unsent session gets a white SEND while the same action in the Finish sheet is green. Every entry from the phone says "on this phone" in orange, though orange is kept for warnings, so the real warning ("Not sent") has to compete. The vault note is glued on with a full stop: "Wed 11 Nov. Dumbbells or machine not said".

**Fix.** (rendered)
- app.js line 185, Old: `'<button class="btn plain" type="button" data-act="resend"` New: `'<button class="btn ' + (r.sent ? 'plain' : 'go') + '" type="button" data-act="resend"` ("Send again" stays white).
- app.js line 196, Old: `(x.local ? ', <i>on this phone</i>' : '')` New: `(x.local ? ', on this phone' : '')`; Old: `(x.note ? '. ' + esc(x.note) : '')` New: `(x.note ? '<br>' + esc(x.note) : '')`
- style.css: `.last em{color:var(--muted)}` so Today's "on this phone" matches.
- Lede (line 177), Old: "From the vault, plus sessions on this phone the vault has not read yet." New: "Last five of each exercise, newest first."

## 9. [nice] Settings: "Clear today's sets" looks exactly like "Check for an update"

**Wrong.** Two identical white buttons; one wipes today's log. The confirm dialog guards it (good), but the button should look different before the tap.

**Fix.** app.js line 207, Old: `<button class="btn plain" type="button" data-act="wipe">` New: `<button class="btn plain danger" type="button" data-act="wipe">`. style.css: (rendered; 5.9:1 contrast in both themes)
```css
.btn.plain.danger{color:var(--red-lip)}
@media (prefers-color-scheme:dark){.btn.plain.danger{color:var(--red)}}
```

## 10. [nice] Plan: "where am I" is a single green word

**Wrong.** The current stage is marked only by a green "Now:" (an inline style), and nothing marks today's session among six cards. Today says "selected" with accent-soft fill and an accent border (day tile, toggle, tab); Plan should say it the same way.

**Fix.** (rendered)
- app.js line 165, Old: `'<li><span>' + (now ? '<b style="color:var(--accent-text)">Now: </b>' : '')` New: `'<li' + (now ? ' class="now"' : '') + '><span>' + (now ? '<b>Now: </b>' : '')`
- app.js line 169, after `'</small>'` insert `+ (L.sessionKey(C, t) === k ? '<span class="tag-now">Today</span>' : '')` (uses the dated plan, so Thu 12 Nov marks Pull A, not Push B).
- app.js line 170, Old: `esc(ex.choices.join(' or '))` New: `esc(ex.choices.join(' or ').toLowerCase())` (matches History).
```css
.plist li.now{margin:0 -8px;padding:9px 8px;border-radius:var(--r-tile);border-top-color:transparent;background:var(--accent-soft);box-shadow:inset 0 0 0 2px var(--accent-line)}
.plist li.now + li{border-top-color:transparent}
.plist li.now b{color:var(--accent-text)}
.tag-now{display:inline-block;margin-left:8px;padding:5px 10px;border-radius:999px;background:var(--accent);color:var(--on-accent);box-shadow:0 2px 0 var(--accent-lip);font:800 12px/1 var(--ui);letter-spacing:.05em;text-transform:uppercase;vertical-align:3px}
```

## 11. [nice] Dark mode: right tokens, two weak spots

**Verdict.** Dark follows the token table one for one (8-dark matches 1-today-mid), green fills keep dark words, the lips still read. Two fixes:
- The scrim (`rgba(0,0,0,.35)`) barely dims a #111113 page, so the page behind the Finish sheet still looks live.
- The stepper minus and plus use `--sunken` (#161618), darker than their bar (#1B1B1E), so in dark they read as holes, not buttons. In light the same token reads raised.

**Fix.** (rendered)
```css
@media (prefers-color-scheme:dark){
  .scrim{background:rgba(0,0,0,.6)}
  .stepper .rb{background:#26262A}
}
```

## 12. [nice] Small drifts from the spec

- Toggle cells: the spec says two cells of 104; the build has `min-width:96px`, so "Dumbbells" is 108 wide and "Machine" 96. `.seg button{min-width:104px}`
- NOTE and PAIN are 42 px tall; the spec's own rule is 44 minimum. `.mini-btn{height:44px}`
- The one-arm "Last" line breaks inside a side ("right" ends one line, "6, 7, 7, 5" starts the next). app.js `lastText()` (line 69):
```js
  function lastText(h) {
    var side = h.sets[0].l != null;
    var t = esc(L.setsText(h.sets, side).replace(/ x /g, ' × ').replace(/; then /g, ', then '));
    return side ? t.replace(/(left|right) ([\d.]+(?:, [\d.]+)*)/g, '<i>$1 $2</i>') : t;
  }
```
plus `.hlist li > i{font-style:normal;white-space:nowrap}` (`.last i` already has it).
