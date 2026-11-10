# Empty Room, Useful Furniture, Angry Cats, Mouse Catch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New players start in a shabby empty room, earn coins (now also with Mouse Catch), and buy furniture and cat gear that slow stat drops; neglected cats break items, which cost coins to repair.

**Architecture:** Item data (slot, price, `help`) lives in `SHOP_ITEMS` in `src/config.js`. Pure rules in `src/rules.js` compute help, breaking and repair; `applyElapsed` uses them, so breaking also happens while the page is closed. The room renderer draws only owned items and a scratched look for broken ones; walkers only use spots of usable (owned, unbroken) items.

**Tech Stack:** Vanilla JS ES modules, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-10-empty-room-furniture-design.md`

## Global Constraints
- All tunable numbers in `src/config.js`.
- Every new text has English and Vietnamese (`tests/i18n.test.js` checks keys match).
- Every shop item has a sprite icon (`tests/sprites.test.js`).
- Rules stay pure: take a state, return a new one. Randomness is passed in (`random = Math.random`) so tests can fix it.
- No ticket ids in code comments.

## Review Focus
1. Cat already below 10 when the save loads (long time away): breaks start from `lastSeen`, then every 6 h — test in Task 2.
2. Cat recovers (fed above 10) and later drops again: the 6-hour clock restarts from the new drop, not the old one — test in Task 2.
3. Nothing breakable owned (fresh start, only basics): no crash, nothing breaks — test in Task 2.
4. Repairing an item that isn't broken, or without coins: no change — test in Task 2.
5. Contest entry with a `broken` id that isn't in `decor`: dropped by `cleanEntry` — test in Task 5.

---

### Task 1: Item data, help, fresh-start save

**Files:**
- Modify: `src/config.js`, `src/state.js`, `src/rules.js`
- Test: `tests/rules.test.js`, `tests/state.test.js`

**Interfaces:**
- Produces: `SHOP_ITEMS` entries `{ id, slot, price, help? }` where `help` is `{ stat: percent }`. New slots: `basic` (`bowl` 5, `litter` 10, `cushion` 10), `gear` (`cat_tree` 40 happiness 15, `soft_bed` 45 energy 15, `auto_feeder` 60 hunger 15, `auto_litter` 70 cleanliness 15), `furniture` (`sofa` 50 happiness 10, `bookshelf` 35 happiness 5, `lamp` 25 energy 5). Decor/toys get `help` 5 (rug, beanbag: energy; plant, frame, lights, fishbowl, yarn, toy_mouse: happiness).
- `MAX_HELP = 40`, `START_COINS = 25`, `BREAKABLE_SLOTS = ['gear','furniture','decor','toy']`, `SAVE_VERSION = 3`.
- `usableItems(state): string[]` — owned minus `state.broken`.
- `helpFor(state, stat): number` — percent 0..40.
- `applyElapsed` multiplies each drop by `(1 - helpFor/100)`; sleep energy gain is not changed.
- `createState` adds `broken: []`. `loadState` returns null unless `version === 3`; `upgradeSave` removed.

- [ ] Tests: `helpFor` sums owned unbroken items and caps at 40; broken item gives no help; `applyElapsed` with cat tree drops happiness 15% slower; `createState` has 25 coins and `broken: []`; `loadState` returns null for a version 2 save.
- [ ] Run `npx vitest run` → new tests fail.
- [ ] Implement.
- [ ] Run `npx vitest run` → pass (fix older tests that relied on version 1/2 upgrades or 10 start coins).
- [ ] Commit.

### Task 2: Basics required, angry cats break things, repair

**Files:** Modify `src/config.js`, `src/rules.js`, `src/state.js`. Test `tests/rules.test.js`.

**Interfaces:**
- `ANGRY_BELOW = 10`, `BREAK_EVERY_HOURS = 6`, `REPAIR_SHARE = 0.5`.
- `feed` returns `{ result: 'noBowl' }` without `bowl`; `clean` returns `{ result: 'noLitter' }` without `litter`.
- Cat gets field `nextBreakAt: number | null`.
- `applyElapsed(state, now, random = Math.random)`: after stat drops, for each cat: if all stats ≥ 10 at `now` → `nextBreakAt = null`. Otherwise, if `nextBreakAt` is null, set it to the moment the cat first went below 10 in `[lastSeen, now]` (stats drop linearly, so per stat: `lastSeen + (start - 10) / dropPerHour * HOUR`, or `lastSeen` if already below; energy while asleep never counts as dropping). Then while `nextBreakAt <= now`: break one random usable item from `BREAKABLE_SLOTS` (if any) and add `{ cat: name, item: id }` to `state.news`; `nextBreakAt += 6 h`.
- `repairPrice(itemId) = Math.ceil(price * 0.5)`; `repair(state, itemId)` → `{ state, result: 'ok' | 'notBroken' | 'poor' }`.
- `createState` adds `news: []`.

- [ ] Tests: feed blocked without bowl; clean blocked without litter; cat hungry 15 with hunger drop 6/h, 1 h later breaks one item; 13 h later (already below at load) breaks 3 items (t=0, 6, 12); fed above 10 resets `nextBreakAt` to null; only basics owned → nothing broken, no news; repair costs half rounded up, fails when not broken or poor.
- [ ] Run → fail. Implement. Run → pass. Commit.

### Task 3: Room drawing, broken look, spots

**Files:** Modify `src/render/room.js`, `src/render/layout.js`, `src/render/canvas.js`, `src/render/sprites.js`. Test `tests/sprites.test.js` (already checks icons).

- Default wall: faded colour with a few cracks/stains; default floor: dull scuffed planks.
- `drawRoom` draws bowl, litter, cushion, cat tree, sofa, bookshelf, lamp, soft bed, auto feeder, auto-litter hood only when owned. Lamp glow only with lamp. Season items on the bookshelf only with bookshelf.
- Broken items: draw scratch marks over the item's box (`drawScratches(ctx, x, y, w, h)`).
- `SPOTS`: `needs` for `sofa` → `sofa`, `tree` → `cat_tree`. `canvas.js` passes `usableItems(state)` (not `state.owned`) to `wander` and `sleepSpots`. `START_SPOTS` must only use spots without needs or fall back: use `['center','right','front','bed','center']`.
- Icons (sprites) for every new item id.

- [ ] Run `npx vitest run` → pass; run `npm run build` → ok; open in browser and look at empty room, full room, broken items.
- [ ] Commit.

### Task 4: Mouse Catch and the Play chooser

**Files:** Create `src/minigame/mouse.js`. Modify `src/rules.js`, `src/config.js`, `src/ui.js`, `src/main.js`, i18n. Test `tests/rules.test.js`.

- `runMouseGame(canvas, { seconds, onTick, onCatch, onEnd })` like `runFishGame`; `onCatch(score)`; `onEnd(score)`. 3×3 holes, mouse +1, golden (1 in 8) +3, yarn −1, score ≥ 0, pop-ups speed up.
- `MOUSE_GAME_SECONDS = 30`.
- Rename `finishFishGame(state, caught)` → `finishMiniGame(state, coins)` (same effect).
- Task `{ id: 'mouse10', counter: 'mouse', goal: 10, coins: 5 }`; sticker `{ id: 'mouse_catcher', kind: 'counter', counter: 'mouse', goal: 50, coins: 10, icon: 'toy_mouse' }`.
- Play button opens a sheet with two choices; `openMiniGame(kind, { onCatch, onEnd })` in `ui.js` replaces `openFishGame`.

- [ ] Test: `finishMiniGame` adds coins and costs energy. Run → pass. Play both games in the browser. Commit.

### Task 5: Shop, messages, contest, i18n

**Files:** Modify `src/ui.js`, `src/main.js`, `src/contestRoom.js`, i18n. Test `tests/contestRoom.test.js`.

- Shop sections in order: basic, gear, furniture, decor, toy, hat, collar, wall, floor. Row shows a help line ("Vui giảm chậm 15%") and, when broken, a "Sửa N" button calling `repair`.
- After adoption: message telling the player to buy bowl, litter box and cushion in the shop.
- Feed/clean results `noBowl`/`noLitter` show a message.
- In `tick` and on boot: show and clear `state.news` ("Miu cào hỏng Sofa!").
- `buildEntry` sends decor from slots basic, gear, furniture, decor, toy and `broken` (subset). `cleanEntry` keeps `broken` only if in `decor`. `entryToScene` sets `broken`.

- [ ] Test: `cleanEntry` drops broken ids not in decor; keeps valid ones. Run all tests, build, play through: adopt → buy basics → play Mouse Catch → buy cat tree → force a cat below 10 (devtools) → see break message and repair. Commit.
