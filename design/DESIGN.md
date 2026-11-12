# Lift, Today screen: design spec for both looks

Two static mockups of the Today screen, same content, same behaviour, two looks. Arda picks one; the builder implements only that one.

- `today-a.html` (A, calm) and `today-b.html` (B, bright) are the exact reference. Every value below is copied from their CSS; if this file and the CSS ever disagree, the CSS wins. Class names are not binding, tokens and measurements are.
- Screenshots (390 x 844 at 2x): `a-1`/`b-1` opening view, `a-2`/`b-2` scrolled to exercise 3, `a-3`/`b-3` exercise 3 with its first set open (left and right reps), `a-full`/`b-full` the whole page. `compare.html` shows both side by side.
- Mockup URL switches: `?at=ex3` shows the page scrolled to exercise 3, `?open=ex3` opens its first set, `?y=600` shifts by 600 px. They shift `main` with a transform because headless screenshots go blank after a real scroll. Not app behaviour.
- Mockup-only parts, do not build: the drawn iOS status bar and home indicator, the `--x` left anchor (headless Brave keeps a 500 px minimum width), the `SFR` font face in B (it lets a Mac browser show SF Rounded; on the iPhone `ui-rounded` resolves first).

## Shared behaviour (both looks)

**Frame.** Phone first, 390 pt wide. Side gutter 16. Safe areas come from `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` (the mockup assumes 47 and 34). Home-screen web app, full screen, status bar style black-translucent; the status area is painted in the page colour so content never shows under the clock.

**Order on the screen.** Header (date, "Updated today, 05:47", session title "Push A", focus "Shoulders first"), week strip, brief card (stage line, then the day note), six exercise cards in plan order, then the fixed bottom: the session dock (rest timer and Finish) and the tab bar (Today, Plan, History, Settings). After 90 px of scroll a compact title bar appears under the status area: date left, "Push A" centred, "1 of 18 sets" right.

**One open set.** The next undone set in plan order is the open set: it shows the steppers and the big Done button. Every other set is a compact row showing its numbers. Tapping a compact row opens it instead (a done row reopens for an edit). Done marks the set, starts the rest timer and opens the next undone set. Only one set is open at a time, so the screen always has one focal point.

**Steppers.** Weight plus and minus move by the exercise's own step (in the mockup: 2.5 kg for dumbbells and cables, 5 kg for the pec deck, 1 kg for the light dumbbells). Reps move by 1. A tap on the number opens the numeric keypad to type it. Each set keeps its own weight. One-arm exercises show Left and Right reps, Left first (the coach line asks to start with the left arm).

**Rest timer.** Lives in the dock, so it stays visible wherever he scrolls. 150 s after sets of the first two exercises, 75 s after the rest. The ring shows time left (2:12 of 2:30 is 88 percent). It never blocks: Done works during a rest and restarts the timer. When no timer runs, the left side of the dock may show "1 of 18 sets" instead (not drawn).

**Coach line cue.** A small round mark before each coach line tells the direction at a glance: up (start weight above last session's heaviest set), same (equal), down (lower). Mockup: 1 same, 2 same, 3 down, 4 up, 5 up, 6 down. Derive it from the content file's numbers; the text stays the morning run's sentence.

**Sets, note, pain.** The stage's set count shows by default; add set adds one after the last, remove set removes the last undone set. Note opens a one-line field under the set list (16 px text so iOS does not zoom; it grows with text); a saved note shows there as a line of text. Pain is a toggle per exercise; its active look is given per look below.

**Tap targets.** Every control is at least 44 x 44 pt. Numbers use tabular figures everywhere (`font-variant-numeric: tabular-nums`).

**Copy (exact).** No emoji, no em dashes. Mockup strings: "Mon 16 Nov", "Updated today, 05:47", "Push A", "Shoulders first", "This week: all sets, stop 2 reps before failure", the day note, exercise names, targets ("3 × 6-10" with the multiplication sign), "Last, Wed 11 Nov" before last time's numbers, the coach lines word for word, "Done", "Add set", "Remove set", "Note", "Pain", "Rest", "2:12", "of 2:30", "Finish", "Today", "Plan", "History", "Settings", "Side delts" with a star on both lateral raises.

**Not designed here:** a finished exercise card, the Finish summary sheet, Plan, History and Settings screens, dark mode renders.

**Icons.** Lucide shapes on a 24 grid, round caps and joins: plus, minus, check, pencil (Note), flag (Pain), arrow-up, arrow-down, equal (two bars), gauge (stage line), timer, star (filled), calendar-check (Today), clipboard-list (Plan), history (History), settings (Settings). The paths are inline in both HTML files.

---

## Look A, calm (Mora): a well-made paper notebook

Character: warm paper page, white cards, hairlines, Fraunces for display words, Nunito for everything else, one peach-to-terracotta accent. The set list is a quiet table (Set, kg, Reps), like the Notes table it replaces.

### Colour (light)
| Token | Value | Use |
|---|---|---|
| paper | #F6F4F0 | page, status area, tab bar, toggle track |
| card | #FFFFFF | cards, dock, steppers |
| line | #ECE6DF | hairlines, card borders |
| line-2 | #DCD3C9 | stepper borders, pending disc ring, selected toggle ring |
| ink | #27221E | main text, open-set disc, Finish border |
| ink-2 | #4B433D | secondary text, pending values, focus subtitle |
| muted | #7A7069 | labels, inactive tabs (4.8:1 on white) |
| peach to terra | #F9BD86 to #EF9159, `linear-gradient(135deg, ...)` | Done button, done discs, timer ring (#EF9159) |
| accent-ink | #B4561F | accent words and icons: exercise numbers, selected weekday, cue glyphs, active tab icon, stage icon (4.9:1 on white) |
| on-accent | #3A2110 | text and icons on the gradient |
| wash | #FCEFE2 | coach cue chip |
| wash-line | #F2D5BA | open set border |
| open-set fill | #FFFAF5 | open set background |
| ring track | #F2E9E0 | timer ring track |
| pain | #C2453A | Pain when active |

Dark mode (Claude's proposal, not rendered): paper #1A1714, card #24201C, line #36302A, line-2 #4A423A, ink #F3EEE8, ink-2 #D9D1C8, muted #A89E95, accent-ink #F2A877, wash #3A2A1F, wash-line #5A3E2A, open-set fill #2B231D; the gradient and on-accent stay.

### Type
Fraunces (Google Fonts, axes opsz, wght, ital) for display words only; Nunito (500 to 900) for the rest. Self-host both for offline use.
| Role | Font | Weight | Size / line | Notes |
|---|---|---|---|---|
| Session title "Push A" | Fraunces | 600 | 40 / 1 | opsz 144, letter-spacing -0.015em |
| Focus "Shoulders first" | Fraunces italic | 400 | 19 / 1 | opsz 24, ink-2, on the title's baseline, 12 gap |
| Day note | Fraunces italic | 500 | 18 / 1.28 | opsz 20, ink |
| Exercise name | Fraunces | 600 | 21 / 1.18 | opsz 28, letter-spacing -0.005em |
| Exercise number | Fraunces italic | 500 | 19 | accent-ink, 9 gap before the name |
| Compact title bar | Fraunces | 600 | 18 | opsz 24 |
| Header date, updated | Nunito | 700 | 14 / 1.2 | muted |
| Stage line | Nunito | 700 | 14 / 1.3 | muted; "This week:" 800 ink |
| Weekday / session in strip | Nunito | 700 / 800 | 12 / 12.5 | muted / ink-2 |
| Target "3 × 6-10" | Nunito | 800 | 16 | ink |
| Last time | Nunito | 700 | 14 / 1.35 | ink-2; label "Last, Wed 11 Nov" muted, 6 gap |
| Coach line | Nunito | 800 | 16 / 1.35 | ink |
| Table header | Nunito | 700 | 12 | muted |
| Table values | Nunito | 800 | 19 | ink when done, ink-2 when pending |
| Stepper value | Nunito | 800 | 25 (23 with a caption) | caption 700 11 muted above the number |
| Done | Nunito | 800 | 18 | on-accent |
| Rest time | Nunito | 800 | 25 | "Rest" 700 12 muted above, "of 2:30" 700 13 muted after |
| Finish | Nunito | 800 | 16 | ink |
| Footer buttons | Nunito | 700 | 14 | |
| Tab labels | Nunito | 700 | 11 | |
| Toggle | Nunito | 700 | 14 | |

### Shape, space, depth
Radii: card 20, open set 16, Done 14, Finish 14, week cell 14, toggle and steppers full pill. Card shadow `0 1px 2px rgba(39,34,30,.04)`; dock shadow `0 10px 28px rgba(39,34,30,.10), 0 1px 3px rgba(39,34,30,.06)`. Spacing: gutter 16, card padding 15 15 2, 12 between cards, 10 before the brief card, 14 above the week strip.

### Components
- **Header.** Row: date left, "Updated today, 05:47" right. Then title and focus on one baseline, 6 below.
- **Week strip.** 7 equal cells, 2 gap, bleeds 4 px past the gutter. Cell padding 8 top, 9 bottom: weekday, then session ("Rest" on Sunday in muted 700). Selected day: white cell, 1 px line border, card shadow, weekday in accent-ink, session in ink. Others have no box.
- **Brief card.** Card style, padding 12 15 13. Stage line with the 17 px gauge icon in accent-ink, gap 9; day note 6 below.
- **Exercise card.** White, 1 px line, radius 20. Number and name on row 1. Every row below is indented 21 px so it starts under the name: row 2 holds the target (left) and the toggle or the star tag (right); then last time (10 below); then the coach line (8 below), its cue chip hanging in the 21 px number column.
- **Toggle.** Track 46 tall, paper fill, 1 px line border, pill. Each segment is the full 44 px height (the whole half is the hit area), padding 0 17. Selected: ink text on a white pill inset 2 px with a 1 px line-2 ring and `0 1px 2px rgba(39,34,30,.08)`; unselected muted.
- **Star tag.** Filled 12 px star and "Side delts", Nunito 700 12, accent-ink, no box.
- **Coach cue.** 22 px circle, wash fill, glyph 14 px in accent-ink, stroke 2.6.
- **Set table.** 10 below the coach line. Grid columns 34 / 150 / 124 with 9 gaps (one-arm: 34 / 100 / 87 / 87 with 6 gaps). Header row 22 tall: "Set" left, "kg" and "Reps" (or "Left", "Right") centred over their columns, hairline under. Rows at least 48 tall with a hairline between, none under the last. Values centred in their column.
- **Set disc.** 30 px circle. Pending: 1.5 px line-2 ring, number 800 14 muted. Done: gradient fill, 16 px check in on-accent, stroke 3. Open: ink fill, white number.
- **Open set.** Same grid, so its steppers sit in the kg and Reps columns. Margin 6 -8 (bleeds 8 past the table), padding 10 7 8, 1 px wash-line border, radius 16, fill #FFFAF5, 10 between the stepper row and Done. One-arm: grid 34 / 1fr / 1fr, the kg stepper spans both columns, Left and Right steppers below it, each value with its caption ("kg", "Left", "Right") above the number.
- **Stepper.** White pill, 50 tall, 1 px line-2 border, `0 1px 2px rgba(39,34,30,.05)`. Columns 46 / value / 46; minus and plus are 48 tall, 20 px glyphs in ink, stroke 2.4.
- **Done.** Spans the whole open set, 54 tall, radius 14, gradient fill, 20 px check (stroke 2.8) and "Done" in on-accent, gap 8, shadow `0 1px 0 rgba(180,86,31,.22), 0 4px 12px rgba(239,145,89,.25)`.
- **Card footer.** Hairline on top, 50 tall, bleeds 8 px each side. Text buttons 44 tall, padding 0 8, icon 16 (stroke 2.4), gap 6: "Add set" and "Remove set" in ink-2 on the left, "Note" and "Pain" in muted on the right. Pain active: icon filled and text in pain red. A saved note: a line of Nunito 600 14 ink-2 above the footer.
- **Session dock.** Floating card 12 px from each side, 8 above the tab bar, 60 tall, white, 1 px line, radius 20, dock shadow, padding 0 8 0 12, gap 12. Ring 42 px: track #F2E9E0, progress #EF9159, both 4 px, round cap, starting at 12 o'clock; 18 px timer icon in accent-ink in the middle. Then "Rest" over "2:12 of 2:30". Finish on the right: 48 tall, padding 0 20, radius 14, 1.5 px ink border, no fill, ink text.
- **Fade.** Behind the dock, from 22 px above it: paper at 0 to 0.94 opacity at 20 px to solid at 36 px, so rows slide under cleanly.
- **Tab bar.** Fixed to the bottom, 49 tall plus the safe area, paper fill, 1 px line on top, 4 equal items. Icon 23 px (stroke 1.9) over the label, gap 4. Inactive: muted. Active: label ink, icon accent-ink.
- **Compact title bar.** 44 tall under the status area, paper fill, 1 px line under it.

---

## Look B, bright (LangOS, Emerald lit): chunky and quick

Character: white page, solid fills, everything you press sits on a darker lip and squashes down when pressed, SF Rounded heavy type, green as the one accent (current and done), orange only for warnings. Colours are Arda's locked LangOS `Palette` (Theme.swift, 7 Nov 2026); white words appear only on orange and red, words on green are dark.

### Colour (light; dark from Theme.swift)
| Token | Light | Dark | Use |
|---|---|---|---|
| page / surface | #FFFFFF / #FFFFFF | #111113 / #1B1B1E | page, cards, buttons |
| sunken | #F5F5F6 | #161618 | open set, toggle off, stepper buttons, rest tile |
| border | #E5E5E7 | #2F2F34 | 2 px borders and the grey lips |
| ink | #17171A | #F5F5F7 | text |
| ink-2 | #3A3A40 | #D5D5DA (derived) | pending values, last time |
| muted | #6A6A72 | #A3A3AB | labels |
| accent | #22C464 | #22C464 | Done, done discs, current exercise number, set tag, ring, selected day border |
| accent-lip | #008D3A | #007C2F | lip under accent fills |
| accent-text | #00860D | #4CD57E | green words and small icons |
| on-accent | #17171A | #17171A | words and icons on green |
| accent-soft | #DFF6E8 (accent 14 % on white) | #1C3328 (derived) | selected day, selected toggle, active tab |
| accent-line | #9EDDB6 | #2E6B45 (derived) | active tab border |
| orange | #F67045, lip #B04519 | #FF7A4F, lip #B4481D | "go lighter" cue |
| orange-text / orange-soft | #CA4B20 / #FEEEE9 | #FF8A63 / derived | star tag |
| red | #E5484D, lip #B83338 | #FF6369, lip #C9454A | Pain when active |

### Type
One family: `ui-rounded, "SF Pro Rounded", system-ui, sans-serif` (SF Rounded on the iPhone, nothing to load).
| Role | Weight | Size / line | Notes |
|---|---|---|---|
| Session title "Push A" | 800 | 34 / 1.1 | letter-spacing -0.01em |
| Focus "Shoulders first" | 700 | 17 / 1.2 | muted, 2 below the title |
| Header date | 800 | 17 | right column |
| Updated | 700 | 13 | muted, 8 px accent dot, gap 6 |
| Weekday / session in strip | 800 / 800 | 11 uppercase (0.04em) / 12 | muted / ink |
| Stage line | 700 | 14 / 1.3 | muted; "This week:" 800 ink |
| Day note | 700 | 17 / 1.3 | ink |
| Exercise name | 800 | 20 / 1.2 | |
| Exercise number | 800 | 15 | in a 30 px badge |
| Target | 800 | 18 | ink |
| Toggle | 800 | 15 | |
| Last time | 700 | 15 / 1.35 | ink-2; label muted |
| Coach line | 800 | 16 / 1.35 | ink |
| Set row values | 800 | 20 | "kg" 700 14 muted; "×" 700 16 muted; "Left"/"Right" 700 14 muted |
| Stepper value | 800 | 28 | caption under it 800 11 uppercase (0.06em) muted |
| Buttons (Done, Finish) | 700 | 17 (Finish 15) | uppercase, letter-spacing 0.6 px |
| Small buttons (Note, Pain) | 700 | 13 | uppercase, 0.4 px |
| Set tag | 800 | 12 | uppercase, 0.05em |
| Rest time | 800 | 26 | "REST" 800 11 uppercase above, "of 2:30" 700 13 muted after |
| Tab labels | 700 | 11 | |

### Shape, lips, press
Radii: button 16, card 18, tile and toggle 14, tab 20, bottom panel 26, number badge 10, discs and round buttons full. Lips are a solid offset shadow in the lip colour: big buttons 4 px (`0 4px 0`), cards, tiles, round buttons and small buttons 3 px, discs and cues 2 px. Pressed: the element moves down by its lip and the lip goes to 0 (LangOS spring, response 0.18 s, damping 0.7; Prep's CSS port: transform and box-shadow over 270 ms with its press curve). No gradients on any surface.

### Components
- **Header.** Left: title, focus under it. Right: date, then the updated line, 6 from the top.
- **Week strip.** 12 below the header. 7 tiles, gap 5, 48 tall, 2 px border, radius 14, white, 3 px border-coloured lip. Weekday uppercase over the session. Selected: accent-soft fill, accent border, accent lip, both words accent-text. Sunday: sunken fill, "Rest" muted.
- **Card.** White, 2 px border, radius 18, 3 px border-coloured lip.
- **Brief card.** 10 below the strip, padding 10 14 12. Stage line with an 18 px gauge in accent-text, gap 8; day note 6 below.
- **Exercise card.** Margin 14 between cards, padding 12 14 10. Row 1: number badge (30 x 30, radius 10, sunken fill, 2 px border, muted number; the current exercise's badge is accent with on-accent number and a 2 px accent-lip) and the name, gap 10. Row 2, 10 below, full width: target on the left, toggle or star pill on the right. Then last time (10 below), coach line (8 below).
- **Toggle.** Two cells of 104, gap 6, 44 tall, 2 px border, radius 14, sunken fill, muted text. Selected: accent-soft fill, accent border, accent-text.
- **Star pill.** Capsule, padding 4 9, orange-soft fill, orange-text, 12 px filled star, gap 4.
- **Coach cue.** 26 px circle, glyph 15 px stroke 3. Up: accent fill, on-accent arrow, 2 px accent-lip. Same: sunken fill, 2 px border ring inside, ink-2 bars. Down: orange fill, white arrow, 2 px orange-lip.
- **Set rows.** 8 below the coach line, gap 2, each at least 46 tall, disc then values, gap 12. Disc 34 px: pending white with 2 px border, 2 px border lip and a muted number; done accent fill and border, 2 px accent-lip, 18 px check (stroke 3.4) in on-accent. Values read "15 kg × 7" (one-arm "5 kg  Left 12  Right 12"). Done rows show "Set 1" at the right, 700 13 muted.
- **Open set.** Margin 12 -4 6, padding 17 10 10, sunken fill, radius 18, no border. The tag ("SET 2") sits on its top edge: 12 from the left, 12 above, capsule, padding 5 10, accent fill, on-accent words, 2 px accent-lip. Steppers in a grid of 166 / rest, gap 8. One-arm: two equal columns, the kg stepper spans both, Left and Right below, 10 apart.
- **Stepper bar.** 60 tall, white, 2 px border, radius 18, 3 px border lip, padding 0 6. Minus and plus: 44 px circles, sunken fill, 2 px border, 3 px border lip, 22 px glyph stroke 3 in ink, lifted 3 px so face and lip centre in the bar. Value and caption centred between them.
- **Done.** 10 below the steppers, full width, at least 50 tall, radius 16, accent fill, 4 px accent-lip, 22 px check (stroke 3.2) and "DONE" in on-accent, gap 8.
- **Card footer.** 8 below the sets, 10 padding above a 2 px sunken rule. Left: set count, a minus and a plus round button (44 px, white, 2 px border, 3 px lip, 18 px glyph) around "3 sets" (800 15 ink-2), gap 6; minus is Remove set, plus is Add set. Right: NOTE and PAIN small buttons, 42 tall, padding 0 9, radius 14, white, 2 px border, 3 px lip, 16 px icon stroke 2.6, gap 5, muted; 8 between them. Pain active: red fill, red lip, white words and icon. A saved note: a sunken box (radius 14, 700 15 ink-2) above the footer.
- **Bottom panel.** One floating panel, 10 from each side, 2 above the safe area, padding 6, white, 2 px border, radius 26, 4 px border lip. Top row (the session dock), 52 tall with a 2 px sunken rule under it and 6 below: ring 42 px (track border colour, progress accent, 5 px, round cap, from 12 o'clock) with a 17 px timer icon in accent-text, then "REST" over "2:12 of 2:30", gap 11; FINISH on the right as a plain chunky button (at least 44 tall, padding 0 18, radius 16, white, 2 px border, 3 px border lip, ink). Bottom row: 4 tabs, gap 2, each 48 tall, radius 20, 2 px transparent border, 24 px icon (stroke 2.4) over the label, muted; active tab accent-soft fill, accent-line border, accent-text.
- **Fade.** Behind the panel, from 24 px above it: white at 0 to 0.95 at 16 px to solid at 28 px.
- **Compact title bar.** 46 tall, white, 2 px border under it; "Push A" 800 18, sides 700 14 muted.
